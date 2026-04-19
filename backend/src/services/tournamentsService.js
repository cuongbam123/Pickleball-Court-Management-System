const Tournaments = require("../models/tournaments");
const AuditLog = require("../models/audit_logs");
const { assertManagerBranchAccess } = require("../utils/accessControl");

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
    throw new Error("branch_id là bắt buộc");
  }

  assertManagerBranchAccess(
    user,
    branch_id,
    "Manager chi duoc tao giai dau trong chi nhanh cua minh",
  );

  const overlappingTournament = await Tournaments.findOne({
    branch_id,
    is_deleted: false,
    start_date: { $lte: end_date },
    end_date: { $gte: start_date },
  });

  if (overlappingTournament) {
    throw new Error("Chi nhánh này đã có giải đấu trong khoảng thời gian này");
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

  const audit = new AuditLog({
    action: "create_tournament",
    target_collection: "tournaments",
    target_id: tournament._id,
    user_id: user.userId,
    old_value: null,
    new_value: tournament,
  });

  await audit.save();

  return tournament;
};

//lấy danh sách các giải đấu
const getTournaments = async (query = {}) => {
  const { status, required_rank, branch_id, search, page = 1, limit = 10 } = query;
  const filter = { is_deleted: false };

  if (status) filter.status = status;
  if (required_rank) filter.required_rank = required_rank;
  if (branch_id) filter.branch_id = branch_id;
  if (search) filter.name = { $regex: search, $options: "i" };

  const tournament = await Tournaments.find(filter)
    .select(
      "_id name status branch_id required_rank entry_fee max_participants current_participants",
    )
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

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
    const error = new Error("Khong tim thay giai dau nay");
    error.statusCode = 404;
    error.error_code = "ERR_TOURNAMENT_NOT_FOUND";
    throw error;
  }
  return tournament;
};
//Cập nhật Status
const updateTournamentStatus = async (tournamentId, newStatus, user) => {
  const validStatuses = ["open_registration", "ongoing", "completed"];
  const statusFlow = {
    open_registration: ["ongoing"],
    ongoing: ["completed"],
    completed: [],
  };

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Trạng thái '${newStatus}' không hợp lệ`);
  }

  const tournament = await Tournaments.findById(tournamentId);
  if (!tournament) {
    throw new Error("Không tìm thấy giải đấu yêu cầu.");
  }

  assertManagerBranchAccess(
    user,
    tournament.branch_id,
    "Manager chi duoc cap nhat giai dau trong chi nhanh cua minh",
  );

  if (!statusFlow[tournament.status]?.includes(newStatus)) {
    throw new Error(
      `Không thể thay đổi trạng thái khi giải đấu đã ${tournament.status}.`,
    );
  }

  const oldStatus = tournament.status;
  tournament.status = newStatus;
  await tournament.save();
  //lưu audit_log
  const audit = new AuditLog({
    action: "update_tournament_status",
    target_collection: "tournaments",
    target_id: tournament._id,
    user_id: user.userId,
    old_value: oldStatus,
    new_value: tournament,
  });
  await audit.save();

  return tournament;
};

module.exports = {
  createTournament,
  getTournaments,
  getTournamentsId,
  updateTournamentStatus,
};
