const express = require("express");
const validateRoles = require("../middlewares/authorizeRoles");
const {getStudentFinances} = require("../controllers/financeController");

const router = express.Router();

router.route("/").get(validateRoles("Student"), getStudentFinances);

module.exports = router;