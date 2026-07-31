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
    updateStudentProfile(userId, firstName, lastName, dob, gender, nationalId, phone, email) {
        return new Promise((response, reject) => {
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

            const input = [userId || null, firstName || null, lastName || null, dob || null, gender || null, nationalId || null, phone || null, email || null];
            db.query(query, input, (err, results) => {
                if(err) {
                    return reject(err);
                }

                // Check results
                if(!results) {
                    return resolve(null);
                }

                resolve(results);
                return getProfileByUserId(userId)
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
    }
}

module.exports = StudentModel;