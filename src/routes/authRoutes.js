const express = require("express");
const validateToken = require("../middlewares/validateTokenHandler")
const {changePassword} = require("../controllers/authController")
const {loginUser, logoutUser, currentUser} = require("../controllers/authController")

const router = express.Router();
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/me").get(currentUser);
router.put("/change-password", validateToken, changePassword); //protected - for logged in users

module.exports = router;