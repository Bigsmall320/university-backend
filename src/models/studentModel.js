const db = require("../config/db");

const StudentModel = {
    // Id comes from the response that was with the accesstoken
    getProfileByUserId(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    p.first_name,
                    p.last_name,
                    p.date_of_birth,
                    p.gender,
                    p.national_id,
                    p.phone,
                    p.email,
                    s.student_id,
                    s.admission_number,
                    s.year_of_study,
                    s.student_status
                FROM Person AS p
                INNER JOIN Student AS s
                    ON p.person_id = s.person_id
                    WHERE p.person_id = ?;
            `

            db.query(query, [userId], (err, results) => {
                if(err) {
                    return reject(err);
                }

                // Check for results
                if(results.length === 0) {
                    return resolve(null);
                }

                // Return the results
                return resolve(results[0]);
            })
        })
    },

    // Update profile
    updateStudentProfile(firstName, lastName, dob, gender, nationalId, phone, email, userId) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE Person AS p
                    SET first_name = COALESCE(?, first_name),
                        last_name = COALESCE(?, last_name),
                        date_of_birth = COALESCE(?, date_of_birth),
                        gender = COALESCE(?, gender),
                        national_id = COALESCE(?, national_id),
                        phone = COALESCE(?, phone),
                        email = COALESCE(?, email)
                    WHERE p.user_id = ?;
            `

            const input = [firstName || null, lastName || null, dob || null, gender || null, nationalId || null, phone || null, email || null, userId || null];
            db.query(query, input, (err, results) => {
                if(err) {
                    return reject(err);
                }

                console.log(results);
                return resolve(results);
            })
        })
    },

    // Dashboard
    // Get the summaries of: financial(total fees, amt paid, bal), academic(current semester, registered units, completed units, GPA(in each attended sem)), notifications
    getFinancialSummary(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    s.programme_id,
                    s.student_status,
                    fs.total_amount
                FROM Student AS s
                INNER JOIN FeeStructure AS fs
                    ON s.programme_id = fs.programme_id
                INNER JOIN Semester AS sem
                    ON fs.semester_id = sem.semester_id
                WHERE s.student_id = ?
                AND sem.status = 'ACTIVE';
            `;

            db.query(query, [userId], (err, results) => {
                if(err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve(null);
                }

                return resolve(results[0]);
            })
        });
    },


    // Get the academic summary of the student
    getActiveRegisteredUnits(userId) {
        // Get registered units of the student in the current semester, and the current semester details
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    s.year_of_study,
                    sem.start_date,
                    sem.end_date,
                    sem.status AS semester_status,
                    u.unit_id,
                    u.unit_name,
                    u.unit_code
                FROM Student AS s
                INNER JOIN Registration AS reg
                    ON s.student_id = reg.student_id
                INNER JOIN UnitOffering AS uo
                    ON reg.offering_id = uo.offering_id
                INNER JOIN Unit AS u
                    ON uo.unit_id = u.unit_id
                INNER JOIN Semester AS sem
                    ON uo.semester_id = sem.semester_id
                WHERE s.student_id = ?
                AND reg.registration_status = 'REGISTERED'
                AND sem.status = 'ACTIVE';
            `;  

            db.query(query, [userId], (err, results) => {
                if(err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve(null);
                }
                
                return resolve(results);
            });
        });
    }, 

    // Get attempted units for student
    getAttemptedUnits(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    s.year_of_study,
                    sem.start_date,
                    sem.end_date,
                    sem.status AS semester_status,
                    u.unit_id,
                    u.unit_name,
                    u.unit_code,
                    r.marks AS result_marks,
                    r.remark AS result_remark,
                    r.grade AS result_grade
                FROM Student AS s
                INNER JOIN Registration AS reg
                    ON s.student_id = reg.student_id
                INNER JOIN Result AS r
                    ON reg.registration_id = r.registration_id
                INNER JOIN UnitOffering AS uo
                    ON reg.offering_id = uo.offering_id
                INNER JOIN Unit AS u
                    ON uo.unit_id = u.unit_id
                INNER JOIN Semester AS sem
                    ON uo.semester_id = sem.semester_id
                WHERE s.student_id = ?
                AND reg.registration_status = 'REGISTERED';
            `;

            db.query(query, [userId], (err, results) => {
                if(err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve(null);
                }

                return resolve(results);
            })
        });
    }
}

module.exports = StudentModel;