const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { validate, authenticate, optionalAuth } = require("../middlewares");

const {
  getBookingsValidation,
  holdBookingValidation,
} = require("../validations/bookingValidation");

// public
router.get(
  "/",
  optionalAuth,
  validate(getBookingsValidation),
  bookingController.getBookings
);

router.post(
  "/hold",
  authenticate,
  validate(holdBookingValidation),
  bookingController.holdBooking
);

module.exports = router;