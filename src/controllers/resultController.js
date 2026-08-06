const asyncHandler = require("express-async-handler");
const ResultModel = require("../models/resultModel");

const getStudentResults = asyncHandler( async(req, res) => {
    const studentId = req.params.studentId;
    if(!studentId) {
        return res.status(400).json({
            success: false,
            message: "Invalid request."
        });
    }

    const studentResults = await ResultModel.getAcademicResults(studentId);
    if(!studentResults) {
        return res.status(404).json({
            success: false,
            message: "Results not available."
        })
    }

    // Transcript results
    const transcript = studentResults;

    // Group results according to the year and semester
    const semestersResults = {};

    for (const row of studentResults) {
        const key = `Y${row.academic_year_id}-S${row.semester_number}`;

        if (!semestersResults[key]) {
            semestersResults[key] = [];
        }

        semestersResults[key].push(row);
    }


    // Calculate GPA
    // Grade → Grade Point mapping
    const gradePoints = {
        "A+": 4,
        "A": 4,
        "A-": 4,

        "B+": 3,
        "B": 3,
        "B-": 3,

        "C+": 2,
        "C": 2,
        "C-": 2,

        "D+": 1,
        "D": 1,
        "D-": 1,

        "E": 0,
        "F": 0
    };

    // Calculate GPA for each semester
    const GPA = {};

    for (const [semesterName, semesterResults] of Object.entries(semestersResults)) {

        let totalQualityPoints = 0;
        let totalCreditHours = 0;

        semesterResults.forEach((unit) => {

            // Skip units that don't count towards GPA
            if (unit.result_remark !== "PASS") return;

            const point = gradePoints[unit.result_grade];

            // Skip invalid or missing grades
            if (point === undefined) return;

            totalCreditHours += unit.credit_hours;
            totalQualityPoints += point * unit.credit_hours;
        });

        GPA[semesterName] =
            totalCreditHours === 0
                ? 0
                : Number((totalQualityPoints / totalCreditHours).toFixed(2));
    }

    res.json({
        success: true,
        message: "Student results fetched successfully",
        data: { semestersResults, GPA, transcript}
    })
});

module.exports = {
    getStudentResults
};