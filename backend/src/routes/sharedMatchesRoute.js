const express = require("express");
const router = express.Router();
const sharedMatchController = require("../controllers/sharedMatchController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");
const {
  sharedMatchCreateValidation,
  getSharedMatchesValidation,
  getSharedMatchByIdValidation,
  updateSharedMatchValidation,
  updateSharedMatchStatusValidation,
  buySharedMatchTicketValidation,
  getSharedMatchTicketValidation,
  cancelSharedTicketValidation,
} = require("../validations/sharedMatchValidation");

router.post(
  "/",
  authenticate,
  authorizeRoles("admin", "staff"),
  validate(sharedMatchCreateValidation),
  sharedMatchController.createSharedMatch,
);
router.get(
  "/",
  validate(getSharedMatchesValidation),
  sharedMatchController.getSharedMatches,
);
router.post(
  "/:id/tickets",
  authenticate,
  authorizeRoles("customer"),
  validate(buySharedMatchTicketValidation),
  sharedMatchController.buySharedMatchTicket,
);
router.get(
  "/:id/tickets",
  authenticate,
  validate(getSharedMatchTicketValidation),
  sharedMatchController.getSharedMatchTicket,
);
router.get(
  "/:id",
  validate(getSharedMatchByIdValidation),
  sharedMatchController.getSharedMatchById,
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin", "staff"),
  validate(updateSharedMatchValidation),
  sharedMatchController.updateSharedMatch,
);
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("admin", "staff"),
  validate(updateSharedMatchStatusValidation),
  sharedMatchController.updateSharedMatchStatus,
);
router.delete(
  "/tickets/:ticket_id",
  authenticate,
  validate(cancelSharedTicketValidation),
  sharedMatchController.cancelSharedTicket,
);
module.exports = router;
