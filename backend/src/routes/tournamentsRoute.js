const express = require('express');
const router = express.Router();
const tournamentController = require("../controllers/tournamentsController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");
const createTournamentValidation  = require("../validations/tournamentsValidition")

// Route tạo giải đấu mới
router.post(
    "/create",
    authenticate,
    authorizeRoles("admin"),
    validate(createTournamentValidation),
    tournamentController.createNewTournament
);

router.get(
    "/",
    tournamentController.getTournaments
);
module.exports = router;
