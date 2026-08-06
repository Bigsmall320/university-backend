const express = require("express");
require("dotenv").config();
const  validateToken = require("./middlewares/validateTokenHandler");
const errorHandler = require("./middlewares/errorHandler");

// create a server instanse
const app = express(); 

app.use(express.json());
app.use("/auth", require("./routes/authRoutes"));
// Protected - only accessible to logged in users
app.use("/students", validateToken, require("./routes/studentRoutes")); 
app.use("/registration", validateToken, require("./routes/registrationRoutes"));
app.use("/results", validateToken, require("./routes/resultRoutes"));
app.use("/finance", validateToken, require("./routes/financeRoutes"));
app.use("/accommodation", validateToken, require("./routes/accommodationRoutes"));

app.get("/", (req, res) => {
    res.json({
        name: "School Portal API",
        version: "1.0.0",
        endpoints: [
            "/students",
            "/finance",
            "/results"
        ]
        // TODO: res.redirect("/students");
    });
});

app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running in port ${port}`)
})