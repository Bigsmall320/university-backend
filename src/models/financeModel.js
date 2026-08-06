const db = require("../config/db");

const FinanceModel = {
    getPaymentHistory(studentId) {
        return new Promise((resolve, reject) => {
           const query =  `
                SELECT
                    p.payment_id,
                    p.finance_officer_id,
                    p.semester_id,
                    p.amount AS payment_amount,
                    p.payment_method,
                    p.transaction_reference,
                    p.payment_date,
                    p.status AS payment_status,
                    r.receipt_id,
                    r.receipt_number,
                    sem.status AS sem_status
                FROM Payment AS p
                INNER JOIN Receipt AS r
                    ON p.payment_id = r.payment_id
                INNER JOIN Semester AS sem
                    ON  p.semester_id = sem.semester_id
                WHERE p.student_id = ?;
           `; 

           db.query(query, [studentId], (err, results) => {
                if(err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve([]);
                }

                return resolve(results);
           });
        });
    },

    getTotalFees(studentId) {
        return new Promise((resolve, reject) => {
           const query =  `
                SELECT 
                    fs.total_amount
                FROM Student AS s
                INNER JOIN FeeStructure AS fs
                    ON s.programme_id = fs.programme_id
                INNER JOIN Semester AS sem
                    ON fs.semester_id = sem.semester_id
                WHERE s.student_id = ?
                AND s.student_status = 'ACTIVE'
                AND sem.status = 'ACTIVE';
           `; 

           db.query(query, [studentId], (err, results) => {
                if(err) {
                    return reject(err);
                }

                if(results.length === 0) {
                    return resolve(null);
                }

                return resolve(results[0]);
           });
        });
    }
};

module.exports = FinanceModel;