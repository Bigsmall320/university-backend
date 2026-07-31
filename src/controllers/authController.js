const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken")
const AuthModel = require("../models/authModel");

const loginUser = asyncHandler(async (req, res) => {
    // Controller receives email and  password
    const {email, password} = req.body;

    // Validate the email
    if(!email || !password) {
        return res.status(400).json({ message: "Both email and password are Required!"})
    }

    // Find user in database
    const user = await AuthModel.findUserByEmail(email);
    console.log("user", user)

    // Check if user exists
    if(!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    // Check if account is active
    if(user.account_status !== "ACTIVE"){
        return res.status(403).json({
            success: false,
            message: "Account is inactive"
        });
    }

    // // Compare password with the hash password
    // const isMatch = await bcrypt.compare(password, user.password_hash);

    // if(!isMatch) {
    //     return res.status(401).json({
    //         success: false,
    //         message: "Invalid email or password"
    //     })
    // }

    //just for testing purposes
    if(password !== user.password_hash) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        })
    }

    // Update last login
    await AuthModel.updateLastLogin(user.user_id);

    // Generate web token
    const accessToken = jwt.sign({
        user: {
            id: user.user_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            roles: [user.role_name],
        },
    },  process.env.ACCESS_TOKEN_SECRET, {expiresIn: "20m"})

    return res.status(200).json({ 
        success: true,
        message: "Login Successful",
        accessToken,
        user: {
            id: user.user_id,
            firstName: user.first_name,
            lastName: user.last_name,
            roles: [user.role_name],
            email: user.email,
        },
    })
});

const changePassword = asyncHandler( async(req, res) => {
    // Get the password
    const {currentPassword, newPassword} = req.body;
    
    // Check for password
    if(!newPassword || !currentPassword) {
        return res.status(400).json({
            success: false,
            message: "Bad Request."
        });
    }

    // Check for valid newPassword length
    if(newPassword.length < 8 || newPassword.length > 16) {
        return res.status(401).json({
            success: false,
            message: "Password format is invalid."
        });
    }

    if(currentPassword === newPassword) {
        return res.status(401).json({
            success: false,
            message: "Password format is invalid."
        })
    }

    const passwordHash = await AuthModel.getUserPassword(req.user.id);

    // Compare passwords
    // TODO: implement using bcrypt
    if(currentPassword !== passwordHash.password_hash) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized."
        })
    }
    
    // const isMatch = await bcrypt.compare(currentPassword, passwordHash)
    // if(!isMatch) {
    //     return res.status(401).json({
    //         current: false,
    //         message: "Current password is incorrect."
    //     })
    // }
    // const hashedPassword = await bcrypt.hash(newPassword, 10);

    await AuthModel.changeUserPassword(req.user.id, newPassword); // Later use hashed password
    res.status(200).json({
        success: true,
        message: "Password changed successfully."
    })
})

const logoutUser = (req, res) => {
    res.json({
        mesage: "Logout User"
    })
}


// This route is private
const currentUser = (req, res) => {
    res.json({
        mesage: "Current User"
    })
}

module.exports = {loginUser, logoutUser, currentUser, changePassword}