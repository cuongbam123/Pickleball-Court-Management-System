const express = require('express');
const cors = require('cors');
const morgan = require("morgan");
const errorHandler = require("./middlewares/errorMiddleware");
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoutes");
const branchRoute = require("./routes/branchRoutes");
const pricingRuleRoute = require("./routes/pricingRuleRoutes");
const bookingRoute = require("./routes/bookingRoute");
const courtRoutes = require("./routes/courtRoutes");
const productRoutes = require("./routes/productRoutes");
const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/branches", branchRoute);
app.use("/api/v1/pricing-rules", pricingRuleRoute);
app.use("/api/v1/bookings", bookingRoute);


app.use("/api/v1/courts", courtRoutes)
app.use("/api/v1/products", productRoutes);

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