
const tournamentService = require("../services/tournamentsService");

const createNewTournament = async (req, res) => {
   try {
    const tournament = await tournamentService.createTournament(req.body);
    return res.status(201).json({
      success: true,
      message: "Giải đấu đã được tạo thành công",
      data: {
        __id: tournament._id,
        name: tournament.name,
        status: tournament.status,
        created_at: tournament.createdAt,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống khi tạo giải đấu" });
  }
};

const getTournaments = async (req, res) => {
  try {
    const {tournaments,meta} = await tournamentService.getTournaments(req.query);
    return res.status(200).json({
      success: true,
      message: "Danh sách giải đấu",
      data: tournaments,
      meta,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách giải đấu" });
  }
};

module.exports = {
  createNewTournament,
  getTournaments,
};
