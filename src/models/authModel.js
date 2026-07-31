const db = require("../config/db");


const AuthModel = {
    findUserByEmail(email){
        return new Promise((resolve, reject) => {
            const query = `
            SELECT
                u.user_id,
                p.person_id,
                p.first_name,
                p.last_name,
                p.email,
                u.password_hash,
                u.account_status,
                u.last_login,
                r.role_id,
                r.role_name
            FROM User AS u
            INNER JOIN Person AS p
                ON u.user_id = p.user_id
            INNER JOIN UserRole AS ur
                ON u.user_id = ur.user_id
            INNER JOIN Role AS r
                ON ur.role_id = r.role_id
            WHERE p.email = ?;
            `;

            db.query(query, [email], (err, results) => {
                if(err) {
                    return reject(err);
                }

                // Check for records
                if(results.length === 0) {
                    return resolve(null);
                }

                return resolve(results[0]);
            });
        });
    },

    updateLastLogin(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE User
                SET last_login = NOW()
                WHERE user_id = ?;
            `;

            db.query(query, [userId], (err, results) => {
                if (err) {
                    return reject(err);
                }

                resolve(results);
            });
        });
    },

    getUserPassword(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT password_hash FROM User WHERE user_id = ?;
            `;

            db.query(query, [userId], (err, results) => {
                if(err) {
                    return reject(err);
                }

                // Check for results
                if(results.length === 0) {
                    return resolve(null);
                }

                return resolve(results[0]);
            })
        })
    },

    changeUserPassword(userId, newPassword) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE User
                SET password_hash = ?
                WHERE user_id = ?;
            `;

            db.query(query, [newPassword, userId], (err, results) => {
                if(err) {
                    return reject(err);
                }

                return resolve(results);
            });
        });
    }
};

module.exports = AuthModel;