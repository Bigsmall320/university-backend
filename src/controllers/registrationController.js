const asyncHandler = require("express-async-handler");
const RegistrationModel = require("../models/registrationModels");

const getAvailableUnits = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    if(!userId) {
        return res.status(400).json({
            success: false,
            message: "Bad request"
        })
    }

    // TODO: Validate the data for errors
    const availableUnits = await RegistrationModel.getAllAvailableUnits(userId);
    const retakeUnitsId = await RegistrationModel.getDroppedUndoneUnits(userId);
    const supplementaryUnitsId = await RegistrationModel.getFailedUndoneUnits(userId);

    const retakeUnits = availableUnits.filter(unit => retakeUnitsId.includes(unit.unit_id));
    const supplementaryUnits = availableUnits.filter(unit => supplementaryUnitsId.includes(unit.unit_id));
    const unDoneUnits = [...retakeUnits, ...supplementaryUnits];

    const courseUnits = availableUnits.filter(unit => !unDoneUnits.includes(unit));

    if(!availableUnits) {
        return res.status(404).json({
            success: false,
            message: "No available units found for registration."
        });
    }

    return res.status(200).json({
        success: true,
        message: "Available units retrieved successfully.",
        data: {
            courseUnits,
            retakeUnits,
            supplementaryUnits
        }
    });
});

const registerUnit = asyncHandler(async (req, res) => {
    // const offeringId = req.body.offeringId;
    // // console.log("Id in register Unit: ", offeringId);

    // // TODO: check if offering id exists in the database and is available for registration
    // if(!offeringId) {
    //     return res.status(400).json({
    //         success: false,
    //         message: "Offering ID is required."
    //     });
    // }

    // const registeredUnit = await RegistrationModel.getRecentUnitInformation(req.user.id, offeringId);

    // const unitHistory = await RegistrationModel.getUnitHistory(req.user.id, registeredUnit.unit_id);

    // console.log("Recent Unit: ", registeredUnit);
    // console.log("Unit History: ", unitHistory);

    // let registrationType = "REGULAR";
    // // 1. Check if the student has a previous registration
    // if (registeredUnit) { //Recent registration exists

    //     // Is the registration from the current semeseter or previous
    //     // If it's from the current semester register as 'REGULAR'
    //     // If from previous semesters check the type (REGULAR, SUPP, RETAKE).
    //     // If it was regular and result remark is failed register as Supp; but if reg_status was dropped then register as Retake
    //     // If it was Supp and result remark is failed or reg_status is dropped then register as supp
    //     // IF it was Retake and result remark is failed register as Supp but if reg status was dropped then register as Retake


    //     // The unit is recently registered
    //     if (
    //         registeredUnit.registration_status === "REGISTERED" &&
    //         registeredUnit.result_remark === null
    //     ) {
    //         return res.status(409).json({
    //             success: false,
    //             message: "You are already registered for this unit in this semester."
    //         });
    //     }

    //     // Previous  Semesters registration exist
    //     if(unitHistory) {
    //         // Scenario A: Re-registering a dropped unit
    //         if (
    //             registeredUnit.registration_status === "DROPPED" &&
    //             registeredUnit.result_remark === null
    //         ) {

    //             console.log("Inside!");
    //             const availableUnits = await RegistrationModel.getAllAvailableUnits(req.user.id);
    //             console.log("Interesting: ", availableUnits);

    //             const registrationType =
    //                 registeredUnit.semester_status === "COMPLETED" &&
    //                 availableUnits.includes(offeringId)
    //                     ? "RETAKE"
    //                     : "REGULAR";

    //             await RegistrationModel.registerOldUnit(
    //                 req.user.id,
    //                 offeringId,
    //                 registrationType
    //             );

    //             return res.status(200).json({
    //                 success: true,
    //                 message: `Unit re-registered successfully as ${registrationType}.`
    //             });
    //         }

    //         // Scenario B: Already registered and passed
    //         if (
    //             registeredUnit.registration_status === "REGISTERED" &&
    //             registeredUnit.result_remark === "PASS"
    //         ) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: "Unit has already been passed."
    //             });
    //         }

    //         // Scenario C: Failed before
    //         if (
    //             registeredUnit.registration_status === "REGISTERED" &&
    //             registeredUnit.result_remark === "FAIL"
    //         ) {

    //             await RegistrationModel.registerNewUnit(
    //                 req.user.id,
    //                 offeringId,
    //                 "SUPPLEMENTARY"
    //             );

    //             return res.status(201).json({
    //                 success: true,
    //                 message: "Unit registered successfully as SUPPLEMENTARY."
    //             });
    //         }
    //     }
    // }

    // // Scenario D: First-time registration
    // if(registeredUnit.registration_status === 'NOT_REGISTERED') {
    //     await RegistrationModel.registerNewUnit(
    //         req.user.id,
    //         offeringId,
    //         "REGULAR"
    //     );

    //     return res.status(201).json({
    //         success: true,
    //         message: "New unit registered successfully."
    //     });
    // }

    // return res.status(404).json({
    //     success: false,
    //     message: "Unit didn't pass any category."
    // })


    /////////////////////////////////////
    // New approach unsing unitcategory
    const {offeringId, unitCategory} = req.body;
    const userId = req.user.id;

    // Check for existance
    if(!unitCategory || !offeringId || !userId) {
        return res.status(401).json({
            success: false,
            message: "Missing fields."
        })
    }

    const unitInfo = await RegistrationModel.getRecentUnitInformation(userId, offeringId);
    console.log("Recent Unit Infor.: ", unitInfo);

    const regStatus = unitInfo.registration_status;

    switch(unitCategory){
        case "course":

            if(regStatus === "NOT_REGISTERED") {
                await RegistrationModel.registerNewUnit(
                    userId,
                    offeringId,
                    'REGULAR'
                );

                return res.status(201).json({
                    success: true,
                    message: "Unit successfully registered."
                });
            } else if(regStatus === "DROPPED") {
                await RegistrationModel.registerOldUnit(
                    userId,
                    offeringId,
                    'REGULAR'
                );

                return res.status(201).json({
                    success: true,
                    message: "Unit successfully re-registered as regular."
                });
            } else {
                return res.status(409).json({
                    success: false,
                    message: "Unit already registered."
                });
            }

            break;

        case "supplementary":

            if(regStatus === "NOT_REGISTERED") {
                await RegistrationModel.registerNewUnit(
                    userId,
                    offeringId,
                    'SUPPLEMENTARY'
                );

                return res.status(201).json({
                    success: true,
                    message: "Unit successfully registered."
                });
            } else if(regStatus === "DROPPED") {
                await RegistrationModel.registerOldUnit(
                    userId,
                    offeringId,
                    'SUPPLEMENTARY'
                );

                return res.status(201).json({
                    success: true,
                    message: "Unit successfully re-registered as supplementary."
                });
            } else {
                return res.status(409).json({
                    success: false,
                    message: "Unit already registered."
                });
            }

            break;

        case "retake":

            if(regStatus === "NOT_REGISTERED") {
                await RegistrationModel.registerNewUnit(
                    userId,
                    offeringId,
                    'RETAKE'
                );

                return res.status(201).json({
                    success: true,
                    message: "Unit successfully registered."
                });
            } else if(regStatus === "DROPPED") {
                await RegistrationModel.registerOldUnit(
                    userId,
                    offeringId,
                    'RETAKE'
                );

                return res.status(201).json({
                    success: true,
                    message: "Unit successfully re-registered as retake."
                });
            } else {
                return res.status(409).json({
                    success: false,
                    message: "Unit already registered."
                });
            }

            break;

        default:
            return res.status(401).json({
                success: false,
                message: "Unit category is required!"
            });
    }
});

const dropRegisteredUnit = asyncHandler(async (req, res) => {
    const offeringId = req.params.offeringId;
    console.log("Id from frontend! ", offeringId);

    if(!offeringId) {
        return res.status(400).json({
            success: false,
            message: "Offering ID is required."
        });
    }

    const parsedOfferingId = parseInt(offeringId, 10);

    // Get unit's information
    const unitHistory = await RegistrationModel.getRecentUnitInformation(req.user.id, parsedOfferingId);

    if(!unitHistory) {
        return res.status(404).json({
            success: false,
            message: "Unit does not exist."
        });
    }

    if(unitHistory.registration_status === 'DROPPED') {
        return res.status(409).json({
            success: false,
            message: "You've already Dropped this unit."
        })
    }

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