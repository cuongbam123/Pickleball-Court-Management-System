const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { validate, authenticate, optionalAuth } = require("../middlewares");

const {
  getBookingsValidation,
  holdBookingValidation,
  getBookingDetailValidation,
  updateBookingStatusValidation,
  cancelBookingValidation,
  payDepositValidattion,
  getAvaliableTimeSlotsValidation,
} = require("../validations/bookingValidation");


router.get(
  "/avaliable",
  optionalAuth,
  validate(getAvaliableTimeSlotsValidation),
  bookingController.getAvaliadbleTimeSlots,
);
// public
router.get(
  "/",
  optionalAuth,
  validate(getBookingsValidation),
  bookingController.getBookings,
);

router.post(
  '/:id/pay-deposit',
   authenticate,
   validate(payDepositValidattion),
   bookingController.createDepositPaymentUrl);

router.get(
  "/:id",
  authenticate,
  validate(getBookingDetailValidation),
  bookingController.getBookingDetail
);

router.post(
  "/hold",
  authenticate,
  validate(holdBookingValidation),
  bookingController.holdBooking
);

router.patch(
  "/:id/status",
  authenticate,
  validate(updateBookingStatusValidation),
  bookingController.updateBookingStatus
);
router.patch(
  "/:id/cancel",
  authenticate,
  validate(cancelBookingValidation),
  bookingController.cancelBooking
);
module.exports = router;