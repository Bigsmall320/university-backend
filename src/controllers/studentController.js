const asyncHandler = require("express-async-handler");
const StudentModel = require("../models/studentModel");

const getStudentProfile = asyncHandler( async(req, res) => {
    const student = await StudentModel.getProfileByUserId(req.user.id);
    // console.log("Student: ", student);

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
    const feeStructure = await StudentModel.getFinancialSummary(req.user.id);
    console.log("Fee Structure: ", feeStructure);

    if(!feeStructure) {
        return res.status(404).json({ 
            success: false,
            message: "Fee structure not found."
        })
    }

    if(feeStructure.student_status !== "ACTIVE") {
        return res.status(403).json({
            success: true,
            message: "Account is inactive.",
        })
    }

    // Retrieve the profile of the student
    const studentProfile = await StudentModel.getProfileByUserId(req.user.id);
    console.log("Student Profile: ", studentProfile);

    if(!studentProfile) {
        return res.status(404).json({ 
            success: false,
            message: "Student profile not found."
        })
    }

    if(studentProfile.student_status !== "ACTIVE") {
        return res.status(403).json({
            success: true,
            message: "Account is inactive.",
        })
    }


    // Retrieve the Academic Summary of the student
    const registeredUnits = await StudentModel.getActiveRegisteredUnits(req.user.id);
    const attemptedUnits = await StudentModel.getAttemptedUnits(req.user.id);
    console.log("Registered Units: ", registeredUnits);
    console.log("Attempted Units: ", attemptedUnits);

    if (!registeredUnits || !attemptedUnits) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve academic data."
        });
    }

    const activeUnits = registeredUnits.filter(unit => unit.semester_status === "ACTIVE");
    const passedUnits = attemptedUnits.filter(unit => unit.result_remark === "PASS");
    const failedUnits = attemptedUnits.filter(unit => unit.result_remark === "FAIL");

    if(activeUnits.length === 0) {
        return res.status(404).json({ 
            success: false,
            message: "No active units found."
        });
    }

    // Return the active registered units
    return res.status(200).json({
        success: true,
        data: {
            feeStructure,
            studentProfile,
            activeUnits,
            passedUnits,
            failedUnits
        }
    });    
})

module.exports = {getStudentProfile, updateStudentProfile, getStudentDashboard}