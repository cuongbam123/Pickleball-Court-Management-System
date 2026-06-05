const tournamentService = require("../services/tournamentsService");

// CREATE(ADMIN)
const createNewTournament = async (req, res) => {
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
    const {tournament ,meta} = await tournamentService.getTournaments(req.query);
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
//PUT(ADMIN)
const updateTournament = async (req,res)=>{
  try {
    const {id} = req.params;
    const updates = req.body;
    const updatedTournament = await tournamentService.updateTournament(id, updates, req.user);
    return res.status(200).json({
      success: true,
      message: "Cập nhật giải đấu thành công",
      data: updatedTournament,
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
//DELETE(ADMIN)
const deleteTournament = async (req,res)=>{
  try{
    const {id} = req.params;
    await tournamentService.deleteTournament(id, req.user);
    return res.status(200).json({
      success: true,
      message: "Xóa giải đấu thành công",
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
//POST: Register for tournament
const registerForTournament = async (req,res)=>{
  try {
    const {id} = req.params;
    await tournamentService.registerForTournament(id, req.user);
    return res.status(200).json({
      success: true,
      message: "Đăng ký giải đấu thành công",
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  } 
}
const getParticipants = async (req,res)=>{
  try {
    const {id} = req.params;
    const {participants, meta} = await tournamentService.getParticipants(id, req.query);
    return res.status(200).json({
      success: true,
      message: "Danh sách người tham gia giải đấu",
      data: participants,
      meta,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const generateBrackets = async (req, res) => {
  try {
    const { id } = req.params;
    const { group_size } = req.body;
    const brackets = await tournamentService.generateBrackets(
      id,
      group_size,
      req.user,
    );

    return res.status(200).json({
      success: true,
      message: "Tạo bảng đấu thành công",
      data: brackets,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getTournamentBrackets = async (req, res) => {
  try {
    const { id } = req.params;
    const brackets = await tournamentService.getBrackets(id);

    return res.status(200).json({
      success: true,
      message: "Danh sách bảng đấu",
      data: brackets,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const initiateTournamentPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentData = await tournamentService.initiateTournamentPayment(id, req.user, req.body, req);
    return res.status(200).json({
      success: true,
      message: "Khởi tạo liên kết thanh toán giải đấu thành công",
      data: paymentData,
    });
  } catch (error) {
    next(error);
  }
};

const getParticipantPaymentStatus = async (req, res, next) => {
  try {
    const { participantId } = req.params;
    const userId = req.user.userId || req.user._id || req.user.id;
    const statusData = await tournamentService.getParticipantPaymentStatus(participantId, userId);
    return res.status(200).json({
      success: true,
      message: "Lấy trạng thái thanh toán giải đấu thành công",
      data: statusData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNewTournament,
  getTournaments,
  getTournamentId,
  deleteTournament,
  registerForTournament,
  updateTournamentStatus,
  updateTournament,
  getParticipants,
  generateBrackets,
  getTournamentBrackets,
  initiateTournamentPayment,
  getParticipantPaymentStatus,
};
