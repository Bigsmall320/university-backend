const asyncHandler = require("express-async-handler")

const validateRoles = (...allowedRoles) => {
    return asyncHandler( async(req, res, next) => {
        const userRoles = req.user.roles;
        
        if(!userRoles) {
            return res.status(401).json({
                success: false,
                message: "Not Authorized.",
            })
        }  

        const hasRole = allowedRoles.some(role => 
            userRoles.includes(role)
        )

        if(!hasRole) {
            return res.status(403).json({
                success: false,
                message: "Access Denied."
            })
        }

        next();
    })
};

module.exports = validateRoles;