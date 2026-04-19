const express = require("express");
const router = express.Router();
const tournamentController = require("../controllers/tournamentsController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");
const {
  createTournamentValidation,
  getTournamentValidation,
  getTournamentDetailValidation,
  updateStatusValidation,
} = require("../validations/tournamentsValidition");

router.get("/", validate(getTournamentValidation), tournamentController.getTournaments);
router.get("/:id", validate(getTournamentDetailValidation), tournamentController.getTournamentId);

router.post(
  "/",
  authenticate,
  authorizeRoles("admin", "manager"),
  validate(createTournamentValidation),
  tournamentController.createNewTournament,
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("admin", "manager"),
  validate(updateStatusValidation),
  tournamentController.updateTournamentStatus,
);

module.exports = router;
