const Tournaments = require("../models/tournaments");
const TournamentParticipants = require("../models/tournamentParticipants");
const AuditLog = require("../models/audit_logs");
const mongoose = require("mongoose");

const TOURNAMENT_STATUSES = {
  OPEN_REGISTRATION: "open_registration",
  CLOSE_REGISTRATION: "close_registration",
  ONGOING: "ongoing",
  COMPLETED: "completed",
};

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const getCloseRegistrationDate = (startDayOngoing) =>
  new Date(new Date(startDayOngoing).getTime() - ONE_DAY_IN_MS);

const assertStatusTiming = (tournament, newStatus) => {
  const now = new Date();
  const closeRegistrationDate = getCloseRegistrationDate(
    tournament.start_day_ongoing,
  );
  const closeRegistrationWindowEnd = new Date(
    closeRegistrationDate.getTime() + ONE_DAY_IN_MS,
  );

  if (
    newStatus === TOURNAMENT_STATUSES.CLOSE_REGISTRATION &&
    (now < closeRegistrationDate || now >= closeRegistrationWindowEnd)
  ) {
    throw new Error(
      "Chi duoc chuyen sang close_registration trong vong 24 gio truoc start_day_ongoing.",
    );
  }

  if (
    newStatus === TOURNAMENT_STATUSES.ONGOING &&
    now < tournament.start_day_ongoing
  ) {
    throw new Error(
      "Chi duoc chuyen sang ongoing khi da den start_day_ongoing.",
    );
  }
};

const createTournament = async (tournamentData, user) => {
  const {
    name,
    required_rank,
    entry_fee,
    max_participants,
    start_date,
    start_day_ongoing,
    end_date,
    branch_id,
  } = tournamentData;

  const existingTournament = await Tournaments.findOne({
    name,
    is_deleted: false,
  });
  if (existingTournament) {
    throw new Error("Tournament voi ten nay da ton tai");
  }

  if (!branch_id) {
    throw new Error("branch_id la bat buoc");
  }

  const overlappingTournament = await Tournaments.findOne({
    branch_id,
    is_deleted: false,
    start_date: { $lte: end_date },
    end_date: { $gte: start_date },
  });

  if (overlappingTournament) {
    throw new Error(
      "Chi nhanh nay da co tournament trong khoang thoi gian nay",
    );
  }

  const tournament = new Tournaments({
    name,
    required_rank,
    entry_fee,
    max_participants,
    start_date,
    start_day_ongoing,
    end_date,
    branch_id,
    current_participants: 0,
    status: TOURNAMENT_STATUSES.OPEN_REGISTRATION,
  });

  await tournament.save();

  const audit = new AuditLog({
    action: "create tournament",
    target_collection: "tournaments",
    target_id: tournament._id,
    user_id: user.userId,
    old_value: null,
    new_value: tournament,
  });

  await audit.save();

  return tournament;
};
const getTournaments = async (query = {}) => {
  const {
    status,
    required_rank,
    branch_id,
    search,
    page = 1,
    limit = 10,
  } = query;
  const filter = { is_deleted: false };

  if (status) filter.status = status;
  if (required_rank) filter.required_rank = required_rank;
  if (branch_id) filter.branch_id = branch_id;
  if (search) filter.name = { $regex: search, $options: "i" };

  const tournament = await Tournaments.find(filter)
    .select(
      "_id name status branch_id required_rank entry_fee max_participants current_participants start_date start_day_ongoing end_date",
    )
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  const totalItems = await Tournaments.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / Number(limit));

  return {
    tournament,
    meta: {
      currentPage: Number(page),
      totalPages,
      totalItems,
    },
  };
};

const getTournamentsId = async (id) => {
  const tournament = await Tournaments.findOne({
    _id: id,
    is_deleted: false,
  });

  if (!tournament) {
    const error = new Error("Khong tim thay tournament nay");
    error.statusCode = 404;
    error.error_code = "ERR_TOURNAMENT_NOT_FOUND";
    throw error;
  }

  return tournament;
};

const updateTournamentStatus = async (tournamentId, newStatus, user) => {
  const validStatuses = Object.values(TOURNAMENT_STATUSES);
  const statusFlow = {
    [TOURNAMENT_STATUSES.OPEN_REGISTRATION]: [
      TOURNAMENT_STATUSES.CLOSE_REGISTRATION,
      TOURNAMENT_STATUSES.ONGOING,
    ],
    [TOURNAMENT_STATUSES.CLOSE_REGISTRATION]: [TOURNAMENT_STATUSES.ONGOING],
    [TOURNAMENT_STATUSES.ONGOING]: [TOURNAMENT_STATUSES.COMPLETED],
    [TOURNAMENT_STATUSES.COMPLETED]: [],
  };

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Trang thai '${newStatus}' khong hop le`);
  }

  const tournament = await Tournaments.findOne({
    _id: tournamentId,
    is_deleted: false,
  });

  if (!tournament) {
    throw new Error("Khong tim thay tournament yeu cau.");
  }

  if (!statusFlow[tournament.status]?.includes(newStatus)) {
    throw new Error(
      `Khong the thay doi trang thai tu ${tournament.status} sang ${newStatus}.`,
    );
  }

  assertStatusTiming(tournament, newStatus);

  const oldStatus = tournament.status;
  tournament.status = newStatus;
  await tournament.save();

  const audit = new AuditLog({
    action: "update tournament status",
    target_collection: "tournaments",
    target_id: tournament._id,
    user_id: user.userId,
    old_value: oldStatus,
    new_value: tournament,
  });
  await audit.save();

  return tournament;
};

const updateTournament = async (tournamentId, updateData, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      required_rank,
      entry_fee,
      max_participants,
      start_date,
      start_day_ongoing,
      end_date,
      branch_id,
    } = updateData;

    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      throw new Error("ID giải đấu không hợp lệ.");
    }
    // 🔍 1. Tìm tournament
    const tournament =
      await Tournaments.findById(tournamentId).session(session);

    if (!tournament || tournament.is_deleted) {
      throw new Error("Không tìm thấy giải đấu yêu cầu.");
    }

    // ❌ 2. Không cho update nếu đang diễn ra hoặc đã kết thúc
    if (
      tournament.status === TOURNAMENT_STATUSES.ONGOING ||
      tournament.status === TOURNAMENT_STATUSES.COMPLETED
    ) {
      throw new Error(
        "Không thể cập nhật giải đấu đang diễn ra hoặc đã kết thúc.",
      );
    }

    // 📸 3. Clone dữ liệu cũ
    const oldValue = tournament.toObject();

    // 🔁 4. Resolve dữ liệu mới
    const newStart =
      start_date !== undefined ? new Date(start_date) : tournament.start_date;
    const newOngoing =
      start_day_ongoing !== undefined
        ? new Date(start_day_ongoing)
        : tournament.start_day_ongoing;
    const newEnd =
      end_date !== undefined ? new Date(end_date) : tournament.end_date;
    const newBranch =
      branch_id !== undefined ? branch_id : tournament.branch_id;

    // ❌ 5. Check trùng tên
    if (name !== undefined && name.trim() !== tournament.name) {
      const existing = await Tournaments.findOne({
        name: name.trim(),
        is_deleted: false,
        _id: { $ne: tournamentId },
      }).session(session);

      if (existing) {
        throw new Error("Tên giải đấu đã tồn tại.");
      }
    }

    // ❌ 6. Check overlap
    if (
      start_date !== undefined ||
      end_date !== undefined ||
      branch_id !== undefined
    ) {
      const overlap = await Tournaments.findOne({
        _id: { $ne: tournamentId },
        branch_id: newBranch,
        is_deleted: false,
        start_date: { $lte: newEnd },
        end_date: { $gte: newStart },
      }).session(session);

      if (overlap) {
        throw new Error(
          "Chi nhánh này đã có giải đấu trong khoảng thời gian đã chọn.",
        );
      }
    }

    // ❌ 7. Không cho giảm max < current
    if (
      max_participants !== undefined &&
      max_participants < tournament.current_participants
    ) {
      throw new Error(
        "Số lượng người tham gia tối đa không thể nhỏ hơn số người đã đăng ký.",
      );
    }

    // ❌ 8. Validate logic date
    if (newStart >= newEnd) {
      throw new Error("Ngày bắt đầu phải trước ngày kết thúc.");
    }

    if (newOngoing < newStart) {
      throw new Error(
        "Thời điểm bắt đầu thi đấu phải lớn hơn hoặc bằng ngày bắt đầu.",
      );
    }

    if (newOngoing > newEnd) {
      throw new Error(
        "Thời điểm bắt đầu thi đấu phải nhỏ hơn hoặc bằng ngày kết thúc.",
      );
    }

    // 🔄 9. Update field
    if (name !== undefined) tournament.name = name.trim();
    if (required_rank !== undefined) tournament.required_rank = required_rank;
    if (entry_fee !== undefined) tournament.entry_fee = entry_fee;
    if (max_participants !== undefined)
      tournament.max_participants = max_participants;
    if (start_date !== undefined) tournament.start_date = newStart;
    if (start_day_ongoing !== undefined)
      tournament.start_day_ongoing = newOngoing;
    if (end_date !== undefined) tournament.end_date = newEnd;
    if (branch_id !== undefined) tournament.branch_id = newBranch;

    await tournament.save({ session });

    // 🧾 10. Audit log
    const audit = new AuditLog({
      action: "update tournament",
      target_collection: "tournaments",
      target_id: tournament._id,
      user_id: user.userId,
      old_value: oldValue,
      new_value: tournament.toObject(),
    });

    await audit.save({ session });

    await session.commitTransaction();
    session.endSession();

    return tournament;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const deleteTournament = async (tournamentId, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Check user
    if (!user || !user.userId) {
      throw new Error("Không xác thực người dùng.");
    }

    // 2. Find + lock bằng condition (tránh race)
    const tournament = await Tournaments.findOne({
      _id: tournamentId,
      is_deleted: false,
    }).session(session);

    if (!tournament) {
      throw new Error("Giải đấu không tồn tại hoặc đã bị xóa.");
    }

    // 3. Clone dữ liệu trước khi sửa (QUAN TRỌNG)
    const oldTournament = tournament.toObject();

    // 4. Soft delete
    tournament.is_deleted = true;
    tournament.deleted_at = new Date();
    tournament.deleted_by = user.userId;

    await tournament.save({ session });

    // 5. Audit log
    const audit = new AuditLog({
      action: "delete_tournament",
      target_collection: "tournaments",
      target_id: tournament._id,
      user_id: user.userId,
      old_value: oldTournament,
      new_value: null,
      created_at: new Date(),
    });

    await audit.save({ session });

    // 6. Commit
    await session.commitTransaction();
    session.endSession();

    return {
      message: "Xóa giải đấu thành công",
      tournament_id: tournament._id,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const registerForTournament = async (tournamentId, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. check tournament
    const tournament = await Tournaments.findOne({
      _id: tournamentId,
      is_deleted: false,
    }).session(session);

    if (!tournament) {
      throw new Error("Không tìm thấy giải đấu.");
    }

    // 2. check đã đăng ký chưa
    const existingRegistration = await TournamentParticipants.findOne({
      tournament_id: tournamentId,
      user_id: user.userId,
      is_deleted: false,
    }).session(session);

    if (existingRegistration) {
      throw new Error("Bạn đã đăng ký tham gia giải đấu này.");
    }

    // 3. check trạng thái
    if (tournament.status !== TOURNAMENT_STATUSES.OPEN_REGISTRATION) {
      throw new Error("Giải đấu không đang mở đăng ký.");
    }

    // 4. check slot
    if (tournament.current_participants >= tournament.max_participants) {
      throw new Error("Giải đấu đã đạt số lượng người tham gia tối đa.");
    }

    // 5. check rank
    if (user.rank < tournament.required_rank) {
      throw new Error("Cấp bậc của bạn không đủ.");
    }

    // 6. tạo đăng ký
    await TournamentParticipants.create(
      [
        {
          tournament_id: tournamentId,
          user_id: user.userId,
        },
      ],
      { session }
    );

    // 7. tăng slot (dùng $inc cho an toàn hơn)
    await Tournaments.updateOne(
      { _id: tournamentId },
      { $inc: { current_participants: 1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return { message: "Đăng ký thành công" };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // 🔥 bắt lỗi unique index (double đăng ký)
    if (err.code === 11000) {
      throw new Error("Bạn đã đăng ký rồi.");
    }

    throw err;
  }
};
const getParticipants = async (tournamentId, query) => {
  const { page = 1, limit = 10, search, payment_status, result } = query;

  const filter = { tournament_id: tournamentId, is_deleted: false };

  if (payment_status) filter.payment_status = payment_status;
  if (result) filter.result = result;
  if (search) {
    filter.$or = [
      { "user_info.name": { $regex: search, $options: "i" } },
    ];
  };
  const participants = await TournamentParticipants.find(filter)
    .populate("user_id", "_id full_name skill_rank elo_score")
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();
  const totalItems = await TournamentParticipants.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / Number(limit));

  return {
    participants,
    meta: {
      currentPage: Number(page),
      totalPages,
      totalItems,
    },
  };
};

module.exports = {
  TOURNAMENT_STATUSES,
  createTournament,
  getCloseRegistrationDate,
  getTournaments,
  getTournamentsId,
  updateTournamentStatus,
  updateTournament,
  deleteTournament,
  registerForTournament,
  getParticipants,
};
