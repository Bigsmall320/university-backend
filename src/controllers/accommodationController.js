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

    // Get hostels
    const hostels = await AccommodationModel.getVacantRooms(userId);
    console.log("Hostels: ", hostels);

    res.status(200).json({
        success: true,
        message: "Get hostel room vacancy.",
        data: hostels
    })
});

const bookAccommodation = asyncHandler( async(req, res) => {
    const semester = await AccommodationModel.getActiveSemester();
    const yearId = await AccommodationModel.getActiveYear();

    if(!semester || !yearId) {
        return res.status(400).json({
            success: false,
            message: "No active semester/academic year found."
        });
    }

    await AccommodationModel.bookHostelAccommodation(
        req.user.id,
        req.body.roomId,
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