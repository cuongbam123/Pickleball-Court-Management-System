const express = require('express');
const router = express.Router();
const tournamentController = require("../controllers/tournamentsController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");
const {createTournamentValidation,getTournamentValidation,getTournamentDetailValidation , updateStatusValidation}  = require("../validations/tournamentsValidition")

//PUBLIC
router.get( "/", validate(getTournamentValidation),tournamentController.getTournaments);
router.get("/:id", validate(getTournamentDetailValidation),tournamentController.getTournamentId)
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

module.exports = router;
