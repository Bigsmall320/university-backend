const express = require("express");
const {getStudentProfile, updateStudentProfile, getStudentDashboard} = require("../controllers/studentController");
const validateRoles = require("../middlewares/authorizeRoles")

const router = express.Router();
router.route("/profile").get(getStudentProfile)
router.route("/profile").put(validateRoles("Student"), updateStudentProfile)
router.route("/dashboard").get(validateRoles("Student"), getStudentDashboard);

module.exports = router;