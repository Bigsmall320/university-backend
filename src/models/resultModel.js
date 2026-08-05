const db = require("../config/db");

const ResultModel = {
    getStudentLevel(studentId) {
        return new Promise((resolve, reject) => {           
            const query = `
                SELECT 
                    student_id,
                    person_id,
                    year_of_study,
                    student_status
                FROM Student
                WHERE student_id = ?;
            `;

            db.query(query, [studentId], (err, results) => {
                if (err) {
                    return reject(err);
                } 

                if(results.length === 0) {
                    return resolve(null);
                }

                const studentLevel = results[0];
                return resolve(studentLevel);
            });         
        });
    },

    getAcademicResults(studentId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    sem.academic_year_id,
                    sem.semester_id,
                    sem.semester_number,

                    reg.registration_id,

                    u.unit_id,
                    u.unit_code,
                    u.unit_name,
                    u.credit_hours,

                    r.marks AS result_marks,
                    r.grade AS result_grade,
                    r.remark AS result_remark

                FROM Registration reg
                INNER JOIN UnitOffering uo
                    ON reg.offering_id = uo.offering_id
                INNER JOIN Unit u
                    ON uo.unit_id = u.unit_id
                INNER JOIN Semester sem
                    ON uo.semester_id = sem.semester_id
                LEFT JOIN Result r
                    ON reg.registration_id = r.registration_id
                WHERE reg.student_id = ?
                ORDER BY
                    sem.academic_year_id,
                    sem.semester_number,
                    u.unit_code;
            `;

            db.query(query, [studentId], (err, results) => {
                if(err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve(null);
                }

                return resolve(results);
            })
        })
    }
};

module.exports = ResultModel;