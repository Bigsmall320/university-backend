const asyncHandler = require("express-async-handler");
const StudentModel = require("../models/studentModel");

const getStudentProfile = asyncHandler( async(req, res) => {
    const student = await StudentModel.getProfileByUserId(req.user.id);
    console.log("Student: ", student);

    if(!student) {
        return res.status(404).json({ 
            success: false,
            message: "Student not found."
        })
    }

    if(student.student_status !== "ACTIVE") {
        return res.status(403).json({
            success: true,
            message: "Account is inactive.",
        })
    }

    return res.status(200).json({student})
})

const updateStudentProfile = asyncHandler( async(req, res) => {
    const {
        first_name,
        last_name,
        date_of_birth,
        gender,
        national_id,
        phone,
        email
    } = req.body;
    await StudentModel.updateStudentProfile(
        first_name,
        last_name,
        date_of_birth,
        gender,
        national_id,
        phone,
        email,
        req.user.id
    );

    const updatedStudent = await StudentModel.getProfileByUserId(req.user.id);
    console.log("Updated Student:", updatedStudent);
    res.status(200).json({
        success: true,
        data: updatedStudent
    })
})

const getStudentDashboard = asyncHandler( async(req, res) => {
    res.json({ 
        message: "Student dashboard."
    })
})

module.exports = {getStudentProfile, updateStudentProfile, getStudentDashboard}