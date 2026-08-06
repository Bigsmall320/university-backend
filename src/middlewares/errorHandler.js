const errorHandler = (err, req, res, next) => {
    console.error(err);

    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === "production";

    res.status(statusCode).json({
        success: false,
        status: err.status || "error",
        message:
            isProduction && !err.isOperational
                ? "Something went wrong. Please try again later."
                : err.message
    });
};

module.exports = errorHandler;