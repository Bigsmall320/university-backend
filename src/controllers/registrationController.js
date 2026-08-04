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
    // 1. Check if the student has a previous registration
    if (RegisteredUnit) {

        // Scenario A: Re-registering a dropped unit
        if (
            RegisteredUnit.registration_status === "DROPPED" &&
            RegisteredUnit.result_remark === null
        ) {

            const availableUnits = await RegistrationModel.getAvailableUnits(req.user.id);

            const registrationType =
                RegisteredUnit.semester_status === "COMPLETED" &&
                availableUnits.includes(offeringId)
                    ? "RETAKE"
                    : "REGULAR";

            await RegistrationModel.registerOldUnit(
                req.user.id,
                offeringId,
                registrationType
            );

            return res.status(200).json({
                success: true,
                message: `Unit re-registered successfully as ${registrationType}.`
            });
        }

        // Scenario B: Already registered and passed
        if (
            RegisteredUnit.registration_status === "REGISTERED" &&
            RegisteredUnit.result_remark === "PASS"
        ) {
            return res.status(400).json({
                success: false,
                message: "Unit has already been passed."
            });
        }

        // Scenario C: Failed before
        if (
            RegisteredUnit.registration_status === "REGISTERED" &&
            RegisteredUnit.result_remark === "FAIL"
        ) {

            await RegistrationModel.registerNewUnit(
                req.user.id,
                offeringId,
                "SUPPLEMENTARY"
            );

            return res.status(201).json({
                success: true,
                message: "Unit registered successfully as SUPPLEMENTARY."
            });
        }
    }

    // Scenario D: First-time registration
    await RegistrationModel.registerNewUnit(
        req.user.id,
        offeringId,
        "REGULAR"
    );

    return res.status(201).json({
        success: true,
        message: "Unit registered successfully."
    });
});

const dropRegisteredUnit = asyncHandler(async (req, res) => {
    const offeringId = req.params.offeringId;

    if(!offeringId) {
        return res.status(400).json({
            success: false,
            message: "Offering ID is required."
        });
    }

    const parsedOfferingId = parseInt(offeringId, 10);

    await RegistrationModel.dropRegisteredUnitByUnitOfferingId(req.user.id, parsedOfferingId);

    return res.status(200).json({
        success: true,
        message: "Registered unit dropped successfully.",
    });
});

module.exports = {
    getAvailableUnits,
    registerUnit,
    dropRegisteredUnit
};