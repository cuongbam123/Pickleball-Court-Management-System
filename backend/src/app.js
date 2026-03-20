const express = require('express');
const cors = require('cors');
const morgan = require("morgan");
const errorHandler = require("./middlewares/errorMiddleware");
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

app.use((req, res, next) => {
  const error = new Error("Route không tồn tại");
  error.status = 404;
  next(error);
});


app.use(errorHandler);
module.exports = app;