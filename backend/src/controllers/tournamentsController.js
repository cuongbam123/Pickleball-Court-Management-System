const tournamentService = require("../services/tournamentsService");

const createNewTournament = async (req, res, next) => {
  try {
    const tournament = await tournamentService.createTournament(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Giải đấu đã được tạo thành công",
      data: {
        _id: tournament._id,
        name: tournament.name,
        status: tournament.status,
        created_at: tournament.createdAt,
        branch_id: tournament.branch_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTournaments = async (req, res, next) => {
  try {
    const { tournament, meta } = await tournamentService.getTournaments(req.query);
    return res.status(200).json({
      success: true,
      message: "Danh sách giải đấu",
      data: tournament,
      meta,
    });
  } catch (error) {
    next(error);
  }
};

const getTournamentId = async (req, res, next) => {
  try {
    const tournament = await tournamentService.getTournamentsId(req.params.id);
    return res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    next(error);
  }
};
//PATCH(ADMIN)
const updateTournamentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updateStatus = await tournamentService.updateTournamentStatus(
      id,
      status,
      req.user,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái giải đấu thành công",
      data: updateStatus,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNewTournament,
  getTournaments,
  getTournamentId,
  updateTournamentStatus,
};
