const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const validateToken = asyncHandler( async(req, res, next) => {
    const authHeader = req.headers.Authorization || req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. No header"
        })
    }

    if(!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. make it start with bearer"
        })
    }


    const token = authHeader.split(/\s+/)[1];
    // Check for token
    if(!token) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. No token",
        })
    }

    // Check correctness of token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
        if(err) {
            console.log(err);

            return res.status(401).json({
            success: false,
            message: "Invalid or expired token. couldn't be verified"
        })
        // throw new Error("Not Authorised!")
        }
        req.user = decoded.user;
        console.log("User from token validation!");
        next();
    })
})

module.exports = validateToken;