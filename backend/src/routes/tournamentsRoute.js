const express = require('express');
const router = express.Router();
const tournamentController = require("../controllers/tournamentsController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");
const {createTournamentValidation,getTournamentValidation,getTournamentDetailValidation , updateStatusValidation , updateTournamentValidation, deleteTournamentValidation, registerForTournamentValidation, getParticipantsValidation}  = require("../validations/tournamentsValidition")

//PUBLIC
router.get( "/", validate(getTournamentValidation),tournamentController.getTournaments);
router.get("/:id", validate(getTournamentDetailValidation),tournamentController.getTournamentId)
router.get("/:id/participants",validate(getParticipantsValidation), tournamentController.getParticipants);
router.post("/:id/participants", validate(registerForTournamentValidation), authenticate,authorizeRoles("user"), tournamentController.registerForTournament);
//ADMIN
router.post(
    "/",
    authenticate,
    authorizeRoles("admin"),
    validate(createTournamentValidation),
    tournamentController.createNewTournament
);
router.patch(
    "/:id/status",
    authenticate,
    authorizeRoles("admin"),
    validate(updateStatusValidation),
    tournamentController.updateTournamentStatus
);
router.put(
  "/:id",
  authenticate,
    authorizeRoles("admin"),
    validate(updateTournamentValidation),
    tournamentController.updateTournament
);
router.delete(
  "/:id",
  authenticate,
    authorizeRoles("admin"),
    validate(deleteTournamentValidation),
    tournamentController.deleteTournament
);
module.exports = router;
