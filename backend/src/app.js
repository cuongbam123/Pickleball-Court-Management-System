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
const paymentRoute = require("./routes/vnpayRoutes");
const orderRoute = require("./routes/orderRoutes");
const webhookRoute = require("./routes/webhookRoute");
const tournamentRoute = require("./routes/tournamentsRoute");
const sharedMatchRoute = require("./routes/sharedMatchesRoute");
const app = express();

// middlewares
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép request từ server-to-server hoặc tool không có origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));
// routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/branches", branchRoute);
app.use("/api/v1/pricing-rules", pricingRuleRoute);
app.use("/api/v1/bookings", bookingRoute);
app.use("/api/v1/payments", paymentRoute);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/webhooks", webhookRoute);
app.use("/api/v1/tournaments", tournamentRoute);
app.use("/api/v1/shared-matches", sharedMatchRoute);


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
