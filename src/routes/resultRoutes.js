const express = require("express");
const validateRoles = require("../middlewares/authorizeRoles");   
const router = express.Router();
const { getStudentResults } = require("../controllers/resultController");

// Routes utilised by students to view their results
router.route("/:studentId").get(validateRoles("Student"), getStudentResults);

module.exports = router;