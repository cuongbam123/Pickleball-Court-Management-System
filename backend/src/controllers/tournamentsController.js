const tournamentService = require("../services/tournamentsService");

// CREATE(ADMIN)
const createNewTournament = async (req, res) => {
   try {
    const tournament = await tournamentService.createTournament(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Giải đấu đã được tạo thành công",
      data: {
        __id: tournament._id,
        name: tournament.name,
        status: tournament.status,
        created_at: tournament.createdAt,
        branch_id: tournament.branch_id,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống khi tạo giải đấu" });
  }
};

//GET
const getTournaments = async (req,res)=>{
  try {
    const {tournament ,meta} = await tournamentService.getTournaments(req.body);
    return res.status(200).json({
      success: true,
      message: "Danh sách giải đấu",
      data: tournament,
      meta,
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Lỗi hệ thống khi tạo giải đấu"})
  }
}

//GET:ID
const getTournamentId = async (req,res,next)=>{
  try {
    const tournament = await tournamentService.getTournamentsId(req.params.id);
    return res.status(200).json({
      success: true,
      data: tournament,
    })
  } catch (error) {
    next(error)
  }
}

//PATCH(ADMIN)
const updateTournamentStatus = async (req,res)=>{
  try {
    const {id} = req.params;
    const {status}= req.body;
    const updateStatus = await tournamentService.updateTournamentStatus(id, status , req.user);
    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: updateStatus,
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
module.exports = {
  createNewTournament,
  getTournaments,
  getTournamentId,
  updateTournamentStatus,
};
