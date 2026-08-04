const express = require("express");
const validateRoles = require("../middlewares/authorizeRoles");
const { getAvailableUnits, registerUnit, dropRegisteredUnit } = require("../controllers/registrationController");
const router = express.Router();

router.get("/", getAvailableUnits);
router.route("/register-unit").post(validateRoles("Student"), registerUnit);
router.route("/register-unit/:offeringId").delete(validateRoles("Student"), dropRegisteredUnit);

module.exports = router;