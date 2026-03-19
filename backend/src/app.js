const express = require('express');
const cors = require('cors');
const morgan = require("morgan");

const authRoute = require("./routes/authRoute");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// routes
app.use("/api/v1/auth", authRoute);

app.get('/', (req, res) => {
    res.send(' API Pickleball đang hoạt động!');
});


//EẺERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
module.exports = app;