const express = require("express");
const router = express.Router();
const validateRoles = require("../middlewares/authorizeRoles");
const {getAccommodationVacancy, bookAccommodation} = require("../controllers/accommodationController");

router.route("/").get(validateRoles("Student", "Accommodation Officer"), getAccommodationVacancy);
router.route("/apply").post(validateRoles("Student", "Accommodation Officer"), bookAccommodation);

module.exports = router;