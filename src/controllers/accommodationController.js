const asyncHandler = require("express-async-handler");
const AccommodationModel = require("../models/accommodationModel");

const getAccommodationVacancy = asyncHandler( async(req, res) => {
    const userId = req.user.id;
    if(!userId) {
        return res.status(400).json({
            success: false,
            message: "Bad Request."
        });
    }


    // Get hostels and rooms
    const studentBooking = await AccommodationModel.getStudentCurrentBooking(userId);
    const hostels = await AccommodationModel.getAllHostels(userId);
    const rooms = await AccommodationModel.getVacantRooms(userId);

    if(!hostels || !rooms) {
        return res.status(404).json({
            success: false,
            message: "Couldn't find accommodation."
        });
    }

    res.status(200).json({
        success: true,
        message: "Successful retrieval of Accomodation.",
        data: {rooms, hostels, studentBooking}
    })
});

const bookAccommodation = asyncHandler( async(req, res) => {
    const {studentId, roomId} = req.body;
    const studentIdInt = Number(studentId);
    const roomIdInt = Number(roomId);

    if(!Number.isInteger(studentIdInt) || !Number.isInteger(roomIdInt)) {
        return res.status(401).json({
            success: false,
            message: "Invalid Input."
        });
    }

    const studentBooking = await AccommodationModel.getStudentCurrentBooking(studentIdInt);
    const semester = await AccommodationModel.getActiveSemester();
    const yearId = await AccommodationModel.getActiveYear();

    if(studentBooking) {
        return res.status(409).json({
            success: false,
            message: "You've already booked accommodation."
        })
    }

    // Check for accommodation booked in the current semester
    if(!semester || !yearId) {
        return res.status(400).json({
            success: false,
            message: "No active semester/academic year found."
        });
    }

    await AccommodationModel.bookHostelAccommodation(
        req.user.id,
        roomIdInt,
        semester.semester_id,
        yearId,
        null,
        semester.start_date,
        semester.end_date
    );
    
    res.status(201).json({
        success: true,
        message: "Successful hostel booking."
    })
});

module.exports = {getAccommodationVacancy, bookAccommodation};