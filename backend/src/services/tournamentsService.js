const Tournaments = require("../models/tournaments");
const AuditLog = require("../models/audit_logs");

//Tạo giải đấu
const createTournament = async (tournamentData, user) => {
  const {
    name,
    required_rank,
    entry_fee,
    max_participants,
    start_date,
    end_date,
    branch_id,
  } = tournamentData;

  const existingTournament = await Tournaments.findOne({ name });
  if (existingTournament) {
    throw new Error("Giải đấu với tên này đã tồn tại");
  }

  if (!branch_id) {
    throw new Error("Chi nhánh (branch_id) là bắt buộc!");
  }
  const tournament = new Tournaments({
    name,
    required_rank,
    entry_fee,
    max_participants,
    start_date,
    end_date,
    branch_id,
    current_participants: 0,
    status: "open_registration",
  });

  await tournament.save();

  //lưu audit_log
  const Audit = new AuditLog({
    action: "create",
    target_collection: "tournaments",
    target_id: tournament._id,
    user_id: user.userId,
    old_value: null,
    new_value: tournament,
  });

  await Audit.save();

  return tournament;
};

//lấy danh sách các giải đấu
const getTournaments = async (query) => {
  const { status, required_rank, branch_id, page = 1, limit = 10 } = query;
  const filter = { is_deleted: false };

  if (status) filter.status = status;
  if (required_rank) filter.required_rank = required_rank;
  if (branch_id) filter.branch_id = branch_id;

  const tournament = await Tournaments.find(filter)
    .select(
      "_id name status branch_id required_rank entry_fee max_participants current_participants ",
    ) // <--- CHỈ LẤY những field này
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean(); // <--- Giúp query nhanh hơn 3-5 lần bằng cách trả về plain object

  const totalItems = await Tournaments.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / limit);

  return {
    tournament,
    meta: {
      currentPage: Number(page),
      totalPages,
      totalItems,
    },
  };
};

// Lấy chi tiết 1 giải đấu
const getTournamentsId = async (id) => {
  const tournament = await Tournaments.findOne({
    _id: id,
    is_deleted: false,
  });
  if (!tournament) {
    const error = new Error("Không tìm thấy giải đấu này");
    error.statusCode = 404;
    error.error_code = "ERR_BRANCH_NOT_FOUND";
    throw error;
  }
  return tournament;
};
//Cập nhật Status
const updateTournamentStatus = async (tournamentId, newStatus, user) => {
  const validStatuses = ["open_registration", "ongoing", "completed"];
  const terminalStatuses = ["completed"];

  if (!validStatuses.includes(newStatus)) {
    throw new error(`Trạng thái '${newStatus}'không hợp lệ`);
  }
  const tournament = await Tournaments.findById(tournamentId);
  if (!tournament) {
    throw new error("Không tìm thấy giải đấu yêu cầu.");
  }
  if (terminalStatuses.includes(tournament.status)) {
    throw new Error(
      `Không thể thay đổi trạng thái khi giải đấu đã ${tournament.status}.`,
    );
  }
  // Ví dụ: Chỉ có thể chuyển sang 'ongoing' nếu đang ở 'open' hoặc 'closed_registration'
  if (
    newStatus === "ongoing" &&
    !"open_registration".includes(tournament.status)
  ) {
    throw new Error("Giải đấu phải hoàn tất đăng ký trước khi bắt đầu.");
  }
  tournament.status = newStatus;
  if (newStatus === "ongoing") {
    tournament.actual_start_date = new Date();
  }
  await tournament.save();
  //lưu audit_log
  const Audit = new AuditLog({
    action: "Update_Status",
    target_collection: "tournaments",
    target_id: tournament._id,
    user_id: user.userId,
    old_value: null,
    new_value: tournament,
  });

  await Audit.save();

  return tournament;
};
module.exports = {
  createTournament,
  getTournaments,
  getTournamentsId,
  updateTournamentStatus,
};
