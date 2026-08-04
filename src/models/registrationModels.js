const db = require("../config/db");

const RegistrationModel = {
    // Get all available units for registration
    getAvailableUnits(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    uo.offering_id,
                    uo.semester_id,
                    u.unit_id,
                    u.unit_code,
                    u.unit_name,
                    u.status AS unit_status
                FROM Student AS s
                INNER JOIN UnitOffering AS uo
                    ON s.programme_id = uo.programme_id
                INNER JOIN Unit AS u
                    ON uo.unit_id = u.unit_id
                INNER JOIN Semester AS sem
                    ON uo.semester_id = sem.semester_id
                WHERE s.student_id = ?
                AND sem.status = 'ACTIVE';
            `;

            db.query(query, [userId], (err, results) => {
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
    getStudentUnitHistory(studentId, offeringId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    uo.unit_id,
                    uo.semester_id,
                    reg.registration_id,
                    reg.registration_status,
                    reg.registration_type,
                    r.remark AS result_remark,
                    sem.status AS semester_status
                FROM UnitOffering  AS uo
                INNER JOIN Semester AS sem
                    ON uo.semester_id = sem.semester_id
                INNER JOIN Registration AS reg
                    ON uo.offering_id = reg.offering_id
                LEFT JOIN Result AS r
                    ON reg.registration_id = r.registration_id
                WHERE reg.student_id = ? 
                AND reg.offering_id = ?;
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

    // Drop registered unit
    dropRegisteredUnitByUnitOfferingId(studentId, offeringId) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE Registration AS reg
                LEFT JOIN Result AS r
                    ON reg.registration_id = r.registration_id
                SET reg.registration_status = 'DROPPED',
                    reg.registration_date = CURDATE(),
                    r.remark = NULL
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