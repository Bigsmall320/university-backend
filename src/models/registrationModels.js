const db = require("../config/db");

const RegistrationModel = {
    // Get all available units for registration
    getAllAvailableUnits(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    uo.offering_id,
                    uo.semester_id,
                    u.unit_id,
                    u.unit_code,
                    u.unit_name,
                    u.status AS unit_status,
                    sem.status AS semester_status,
                    COALESCE(reg.registration_status, 'NOT_REGISTRED') AS registration_status

                FROM Student AS s

                INNER JOIN UnitOffering AS uo
                    ON s.programme_id = uo.programme_id

                INNER JOIN Unit AS u
                    ON uo.unit_id = u.unit_id

                INNER JOIN Semester AS sem
                    ON uo.semester_id = sem.semester_id

                LEFT JOIN Registration AS reg
                    ON s.student_id = reg.student_id
                    AND uo.offering_id = reg.offering_id

                WHERE s.student_id = ?
                AND sem.status = 'ACTIVE' || 'COMPLETED';
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve([]);
                }

                return resolve(results);
            });
        });
    },

    getDroppedUndoneUnits(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    uo.unit_id

                FROM Registration AS reg

                INNER JOIN UnitOffering AS uo
                    ON reg.offering_id = uo.offering_id

                WHERE reg.student_id = ?
                AND reg.registration_status = 'DROPPED'
                AND NOT EXISTS (
                    SELECT 1
                    FROM Registration AS regt
                    INNER JOIN Result AS r
                        ON regt.registration_id = r.registration_id
                    WHERE regt.student_id = ?
                    AND regt.registration_type = 'RETAKE'
                    AND regt.registration_date > reg.registration_date
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM Registration AS regt
                    INNER JOIN UnitOffering AS uo
                        ON regt.offering_id = uo.offering_id
                    INNER JOIN Semester AS sem
                        ON uo.semester_id = sem.semester_id
                    WHERE regt.student_id = ?
                    AND regt.registration_type = 'RETAKE'
                    AND regt.registration_date > reg.registration_date
                    AND sem.status = 'ACTIVE'
                );
            `;

            db.query(query, [userId, userId, userId], (err, results) => {
                if (err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve([]);
                }

                return resolve(results);
            });
        });
    },

    getFailedUndoneUnits(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    uo.unit_id,
                    reg.offering_id

                FROM Registration AS reg

                INNER JOIN Result AS r
                    ON reg.registration_id = r.registration_id
                    AND r.remark = 'FAIL'

                INNER JOIN UnitOffering AS uo
                    ON reg.offering_id = uo.offering_id

                WHERE reg.student_id = ?
                AND NOT EXISTS (
                    SELECT 1

                    FROM Registration AS reg

                    INNER JOIN Result AS r
                        ON reg.registration_id = r.registration_id
                        AND r.remark = 'PASS'

                    INNER JOIN UnitOffering AS uof
                        ON reg.offering_id = uof.offering_id
                    
                    WHERE reg.student_id = ?
                    AND reg.registration_status = 'REGISTERED' 
                    AND uo.unit_id = uof.unit_id
                )
                AND NOT EXISTS (
                    SELECT 1 
                    FROM Registration AS reg
                    INNER JOIN UnitOffering AS uof
                        ON reg.offering_id = uof.offering_id
                    INNER JOIN Semester AS sem
                        ON uof.semester_id = sem.semester_id
                    WHERE reg.student_id = ?
                    AND sem.status = 'ACTIVE'
                    AND uo.unit_id = uof.unit_id
                );
            `;

            db.query(query, [userId, userId, userId], (err, results) => {
                if (err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve([]);
                }

                return resolve(results);
            });
        });
    },

    // Register for units
    registerNewUnit(userId, unitOfferingId, registrationType) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO Registration (student_id, offering_id, registration_type, registration_status, registration_date)
                VALUES (?, ?, ?, 'REGISTERED', CURDATE());
            `;

            db.query(query, [userId, unitOfferingId, registrationType], (err, results) => {
                if (err) {
                    return reject(err);
                }

                return resolve(results);
            });
        });
    },

    registerOldUnit(userId, unitOfferingId, registrationType) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE Registration
                SET registration_type = ?, 
                    registration_status = 'REGISTERED', 
                    registration_date = CURDATE()
                WHERE student_id = ? 
                AND offering_id = ?;
            `;

            db.query(query, [registrationType, userId, unitOfferingId], (err, results) => {
                if (err) {
                    return reject(err);
                }

                return resolve(results);
            });
        });
    },

    // Get unit id by unit offering id
    getRecentUnitInformation(studentId, offeringId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    uo.unit_id,
                    uo.semester_id,
                    reg.registration_id,
                    COALESCE(reg.registration_status, 'NOT_REGISTERED') AS registration_status,
                    reg.registration_type,
                    r.remark AS result_remark,
                    sem.status AS semester_status

                FROM UnitOffering  AS uo

                INNER JOIN Semester AS sem
                    ON uo.semester_id = sem.semester_id

                LEFT JOIN Registration AS reg
                    ON uo.offering_id = reg.offering_id
                    AND reg.student_id = ?

                LEFT JOIN Result AS r
                    ON reg.registration_id = r.registration_id

                WHERE uo.offering_id = ?;
            `;

            db.query(query, [studentId, offeringId], (err, results) => {
                if (err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve(null);
                }

                return resolve(results[0]);
            });
        });
    },

    // Get information of all registration 
    getUnitHistory(studentId, unitId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    uo.offering_id,
                    uo.semester_id,
                    reg.registration_id,
                    COALESCE(reg.registration_status, 'NOT_REGISTERED') AS registration_status,
                    reg.registration_type,
                    r.remark AS result_remark,
                    sem.status AS semester_status

                FROM UnitOffering AS uo

                INNER JOIN Semester AS sem
                    ON uo.semester_id = sem.semester_id

                LEFT JOIN Registration AS reg
                    ON uo.offering_id = reg.offering_id
                    AND reg.student_id = ?

                LEFT JOIN Result AS r
                    ON reg.registration_id = r.registration_id

                WHERE uo.unit_id = ?;
            `;

            db.query(query, [studentId, unitId], (err, results) => {
                if (err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve(null);
                }

                return resolve(results);
            });
        });
    },

    // Drop registered unit
    dropRegisteredUnitByUnitOfferingId(studentId, offeringId) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE Registration AS reg
                SET reg.registration_status = 'DROPPED',
                    reg.registration_date = CURDATE()
                WHERE reg.student_id = ? AND reg.offering_id = ?;
            `;

            db.query(query, [studentId, offeringId], (err, results) => {
                if (err) {
                    return reject(err);
                }

                return resolve(results);
            });
        });
    }
}

module.exports = RegistrationModel;

// UPDATE Registration AS reg
// LEFT JOIN Result AS r
//     ON reg.registration_id = r.registration_id
// SET reg.registration_status = 'DROPPED',
//     reg.registration_date = CURDATE(),
//     r.remark = NULL
// WHERE reg.student_id = ? AND reg.offering_id = ?;