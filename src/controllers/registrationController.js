const asyncHandler = require("express-async-handler");
const RegistrationModel = require("../models/registrationModels");

const getAvailableUnits = asyncHandler(async (req, res) => {
    const availableUnits = await RegistrationModel.getAvailableUnits(req.user.id);
    console.log("Available Units: ", availableUnits);

    if(!availableUnits) {
        return res.status(404).json({
            success: false,
            message: "No available units found for registration."
        });
    }

    console.log("About to send a response with available units.");

    return res.status(200).json({
        success: true,
        message: "Available units retrieved successfully.",
        data: availableUnits 
    });
});

const registerUnit = asyncHandler(async (req, res) => {
    const offeringId = req.body.offeringId;

    // TODO: check if offering id exists in the database and is available for registration
    if(!offeringId) {
        return res.status(400).json({
            success: false,
            message: "Offering ID is required."
        });
    }

    const RegisteredUnit = await RegistrationModel.getStudentUnitHistory(req.user.id, offeringId);
    console.log("Registered Unit: ", RegisteredUnit);

    if (
        RegisteredUnit.registration_status === "REGISTERED" &&
        RegisteredUnit.result_remark === null
    ) {
        return res.status(409).json({
            success: false,
            message: "You are already registered for this unit."
        });
    }

    let registrationType = "REGULAR";
    if (RegisteredUnit) {
        if (
            RegisteredUnit.registration_status === "REGISTERED" &&
            RegisteredUnit.result_remark === "FAIL"
        ) {
            registrationType = "SUPPLEMENTARY";
        } else if (
            RegisteredUnit.registration_status === "REGISTERED" &&
            RegisteredUnit.result_remark === "PASS"
        ) {
            return res.status(400).json({
                success: false,
                message: "Unit is already registered and passed."
            });
        } else if (RegisteredUnit.registration_status === "DROPPED") {
            // Business rule:
            // A student who previously dropped a registered unit
            // is treated as RETAKE on subsequent registration.
            registrationType = "RETAKE";
        }
    }

    await RegistrationModel.registerUnit(req.user.id, offeringId, registrationType);

    return res.status(201).json({
        success: true,
        message: "Units registered successfully.",
    });
});

const dropRegisteredUnit = asyncHandler(async (req, res) => {
    // Implementation for dropping registered unit
    res.json({
        success: true,
        message: "Registered unit dropped successfully.",
        data: [] // Replace with actual data
    });
});

module.exports = {
    getAvailableUnits,
    registerUnit,
    dropRegisteredUnit
};