const db = require("../config/db.js");
const { bookAccommodation } = require("../controllers/accommodationController");
const AppError = require("../utils/AppError")

const AccommodationModel = {
    // Both Accommodation Offfcer and Student can access this data
    getAllHostels(studentId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    h.hostel_id,
                    h.hostel_name,
                    h.location AS hostel_location,
                    h.number_of_floors

                FROM Person AS p
                
                INNER JOIN Hostel AS h
                    ON p.gender = h.gender

                WHERE p.person_id = ? AND h.status = 'ACTIVE';
            `;

            db.query(query, [studentId], (err, results) => {
                if(err) return reject(err);

                if(results.length === 0) return resolve([]);

                return resolve(results);
            });
        })
    },

    getStudentCurrentBooking(studentId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    b.booking_id,
                    b.room_id,
                    r.room_number,
                    r.floor AS room_floor,
                    h.hostel_name,
                    h.location

                FROM Booking AS b

                INNER JOIN Room AS r
                    ON b.room_id = r.room_id

                INNER JOIN Hostel AS h 
                    ON r.hostel_id = h.hostel_id
                    AND h.status = 'ACTIVE'

                INNER JOIN Semester AS sem
                    ON b.semester_id = sem.semester_id

                WHERE b.student_id = ?
                AND b.booking_status = 'ACIVE'
                AND sem.status = 'ACTIVE'
            `;

            db.query(query, [studentId], (err, results) => {
                if(err) return reject(err);

                if(results.length === 0) return resolve(null);

                return resolve(results[0]);
            });
        });
    },

    getVacantRooms(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    h.hostel_id,
                    h.hostel_name,
                    h.location AS hostel_location,
                    h.number_of_floors,
                    r.room_id,
                    r.room_number,
                    r.capacity - COUNT(b.booking_id) AS available_spaces,
                    r.floor AS room_floor,
                    COUNT(b.booking_id) AS occupied

                FROM Person AS p

                INNER JOIN Hostel AS h
                    ON p.gender = h.gender

                INNER JOIN Room AS r
                    ON h.hostel_id = r.hostel_id

                LEFT JOIN Booking AS b
                    ON r.room_id = b.room_id
                AND b.booking_status = 'ACTIVE'
                AND b.semester_id = (
                    SELECT semester_id
                    FROM Semester
                    WHERE status = 'ACTIVE'
                )

                WHERE p.person_id = ?
                AND h.status = 'ACTIVE'
                AND r.status = 'AVAILABLE'

                GROUP BY
                    h.hostel_id,
                    h.hostel_name,
                    h.location,
                    h.number_of_floors,
                    r.room_id,
                    r.room_number,
                    r.capacity,
                    r.floor

                HAVING COUNT(b.booking_id) < r.capacity;
            `;

            db.query(query, [userId], (err, results) => {
                if(err) return reject(err);

                if(results.length === 0) return resolve([]);

                return resolve(results);
            });
        });
    },

    // Apply for hostel accommodation
    async bookHostelAccommodation(
        studentId,
        roomId,
        semesterId,
        academicYearId,
        accommodationOfficerId,
        checkIn,
        checkOut
    ) {
        const connection = await db.promise().getConnection();

        try {
            await connection.beginTransaction();

            // 1. Lock the room
            const [rooms] = await connection.query(
                `
                SELECT capacity
                FROM Room
                WHERE room_id = ?
                FOR UPDATE
                `,
                [roomId]
            );

            if (rooms.length === 0) {
                throw new AppError("Room not found.", 404);
            }

            const capacity = rooms[0].capacity;

            // 2. Check if student already has a booking
            const [existingBooking] = await connection.query(
                `
                SELECT booking_id
                FROM Booking
                WHERE student_id = ?
                AND semester_id = ?
                AND booking_status = 'ACTIVE'
                FOR UPDATE
                `,
                [studentId, semesterId]
            );

            if (existingBooking.length > 0) {
                throw new AppError(
                    "You have already booked accommodation for this semester.",
                    409
                );
            }

            // 3. Count current occupants
            const [occupancy] = await connection.query(
                `
                SELECT COUNT(*) AS occupied
                FROM Booking
                WHERE room_id = ?
                AND semester_id = ?
                AND booking_status = 'ACTIVE'
                FOR UPDATE
                `,
                [roomId, semesterId]
            );

            if (occupancy[0].occupied >= capacity) {
                throw new AppError("This room is already full.", 409);
            }

            // 4. Insert booking
            const [result] = await connection.query(
                `
                INSERT INTO Booking (
                    student_id,
                    room_id,
                    semester_id,
                    academic_year_id,
                    accommodation_officer_id,
                    booking_date,
                    check_in_date,
                    check_out_date,
                    booking_status,
                    allocation_date
                )
                VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, 'ACTIVE', NOW())
                `,
                [
                    studentId,
                    roomId,
                    semesterId,
                    academicYearId,
                    accommodationOfficerId,
                    checkIn,
                    checkOut
                ]
            );

            await connection.commit();

            return result;

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    },

    getActiveSemester(){
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    semester_id,
                    start_date,
                    end_date 
                FROM Semester 
                WHERE status = 'ACTIVE';
            `;

            db.query(query, (err, results) => {
                if(err) return reject(err);

                if(results.length === 0) return resolve(null);

                return resolve(results[0]);
            });
        });
    },

    getActiveYear() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    academic_year_id 
                FROM AcademicYear 
                WHERE status = 'ACTIVE'
            `;

            db.query(query, (err, results) => {
                if(err) return reject(err);

                return resolve(results.length ? results[0].academic_year_id : null);
            });
        });
    },
};

module.exports = AccommodationModel;