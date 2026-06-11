const Tournaments = require("../models/tournaments");
const TournamentParticipants = require("../models/tournamentParticipants");
const TournamentBrackets = require("../models/tournamentBrackets");
const AuditLog = require("../models/audit_logs");
const PaymentTransaction = require("../models/payment_transactions");
const User = require("../models/users");
const { buildVnpayUrl } = require("../utils/vnpayHelper");
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

    const userDoc = await User.findById(user.userId || user.id || user._id).session(session);
    if (!userDoc) {
      throw new Error("Không tìm thấy thông tin người dùng.");
    }

    const userRankMap = { "D": 1, "C": 2, "B": 3, "A": 4 };
    const userRankVal = userRankMap[userDoc.skill_rank] || 0;
    const reqRankVal = userRankMap[tournament.required_rank] || 0;
    if (userRankVal < reqRankVal) {
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

const getBracketNameByIndex = (index) => {
  let current = index;
  let suffix = "";

  do {
    suffix = String.fromCharCode(65 + (current % 26)) + suffix;
    current = Math.floor(current / 26) - 1;
  } while (current >= 0);

  return `Bảng ${suffix}`;
};

const generateBrackets = async (tournamentId, groupSize, user) => {
  if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
    throw new Error("ID giải đấu không hợp lệ.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tournament = await Tournaments.findOne({
      _id: tournamentId,
      is_deleted: false,
    }).session(session);

    if (!tournament) {
      throw new Error("Không tìm thấy giải đấu.");
    }

    if (tournament.status !== TOURNAMENT_STATUSES.CLOSE_REGISTRATION) {
      throw new Error(
        "Chỉ được xếp bảng khi giải đấu đang ở trạng thái close_registration.",
      );
    }

    const participants = await TournamentParticipants.find({
      tournament_id: tournamentId,
      is_deleted: false,
      payment_status: "paid",
    })
      .populate("user_id", "_id full_name elo_score skill_rank")
      .session(session);

    const validParticipants = participants
      .filter((participant) => participant.user_id)
      .map((participant) => participant.user_id);

    if (validParticipants.length < groupSize) {
      throw new Error("Không đủ người chơi để chia bảng.");
    }

    const sortedUsers = validParticipants.sort((a, b) => {
      const eloDiff = (b.elo_score || 0) - (a.elo_score || 0);
      if (eloDiff !== 0) return eloDiff;
      return String(a._id).localeCompare(String(b._id));
    });

    const totalGroups = Math.ceil(sortedUsers.length / groupSize);
    const groupBuckets = Array.from({ length: totalGroups }, () => []);
    let direction = 1;
    let groupIndex = 0;

    sortedUsers.forEach((userInfo) => {
      groupBuckets[groupIndex].push(userInfo._id);

      if (totalGroups === 1) {
        return;
      }

      const isAtUpperBound = groupIndex === totalGroups - 1;
      const isAtLowerBound = groupIndex === 0;

      if (direction === 1 && isAtUpperBound) {
        direction = -1;
      } else if (direction === -1 && isAtLowerBound) {
        direction = 1;
      }

      groupIndex += direction;
    });

    await TournamentBrackets.updateMany(
      { tournament_id: tournamentId, is_deleted: false },
      { $set: { is_deleted: true } },
      { session },
    );

    const bracketDocs = groupBuckets.map((participantsInGroup, index) => ({
      tournament_id: tournamentId,
      name: getBracketNameByIndex(index),
      participants: participantsInGroup,
      status: "pending",
      is_deleted: false,
    }));

    await TournamentBrackets.insertMany(bracketDocs, { session });

    await AuditLog.create(
      [
        {
          action: "generate_tournament_brackets",
          target_collection: "tournament_brackets",
          target_id: tournament._id,
          user_id: user.userId,
          old_value: null,
          new_value: {
            total_groups: totalGroups,
            group_size: groupSize,
            total_participants: sortedUsers.length,
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();

    const createdBrackets = await TournamentBrackets.find({
      tournament_id: tournamentId,
      is_deleted: false,
    })
      .populate("participants", "_id full_name elo_score skill_rank")
      .sort({ name: 1 })
      .lean();

    return createdBrackets;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getBrackets = async (tournamentId) => {
  if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
    throw new Error("ID giải đấu không hợp lệ.");
  }

  const tournament = await Tournaments.findOne({
    _id: tournamentId,
    is_deleted: false,
  }).lean();

  if (!tournament) {
    throw new Error("Không tìm thấy giải đấu.");
  }

  const brackets = await TournamentBrackets.find({
    tournament_id: tournamentId,
    is_deleted: false,
  })
    .populate("participants", "_id full_name elo_score skill_rank")
    .sort({ name: 1 })
    .lean();

  return brackets;
};

const initiateTournamentPayment = async (tournamentId, user, body, req) => {
  const { payment_method, redirect_url } = body;

  if (payment_method !== "vnpay") {
    const error = new Error("Phương thức thanh toán không được hỗ trợ");
    error.statusCode = 400;
    throw error;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tournament = await Tournaments.findOne({
      _id: tournamentId,
      is_deleted: false,
    }).session(session);

    if (!tournament) {
      const error = new Error("Không tìm thấy giải đấu.");
      error.statusCode = 404;
      throw error;
    }

    if (tournament.status !== TOURNAMENT_STATUSES.OPEN_REGISTRATION) {
      throw new Error("Giải đấu không đang mở đăng ký.");
    }

    const userDoc = await User.findById(user.userId || user.id || user._id).session(session);
    if (!userDoc) {
      throw new Error("Không tìm thấy thông tin người dùng.");
    }

    const userRankMap = { "D": 1, "C": 2, "B": 3, "A": 4 };
    const userRankVal = userRankMap[userDoc.skill_rank] || 0;
    const reqRankVal = userRankMap[tournament.required_rank] || 0;
    if (userRankVal < reqRankVal) {
      throw new Error("Cấp bậc của bạn không đủ điều kiện tham gia giải đấu này.");
    }

    const existingRegistration = await TournamentParticipants.findOne({
      tournament_id: tournamentId,
      user_id: user.userId,
      is_deleted: false,
      payment_status: { $in: ["pending", "paid"] },
    }).session(session);

    if (existingRegistration) {
      if (existingRegistration.payment_status === "paid") {
        throw new Error("Bạn đã đăng ký và hoàn tất đóng phí cho giải đấu này.");
      }
      
      const existingTxn = await PaymentTransaction.findOne({
        reference_type: "TournamentParticipant",
        reference_id: existingRegistration._id,
        status: "pending",
        expires_at: { $gt: new Date() },
      }).session(session);

      if (existingTxn) {
        let ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
        if (ipAddr === "::1" || ipAddr === "::ffff:127.0.0.1") ipAddr = "127.0.0.1";

        const vnpayRes = buildVnpayUrl({
          txnRef: `TP_${existingRegistration._id.toString()}`,
          amount: tournament.entry_fee,
          orderInfo: `Thanh toan phi tham gia giai dau ${tournament.name}`,
          ipAddr,
          returnUrl: redirect_url,
          expireMinutes: 10,
        });

        await session.commitTransaction();
        session.endSession();

        return {
          participant_id: existingRegistration._id,
          tournament_id: tournament._id,
          entry_fee: tournament.entry_fee,
          payment_url: vnpayRes.payment_url,
          expires_at: vnpayRes.expires_at,
        };
      }
    }

    const activeReservedCount = await TournamentParticipants.countDocuments({
      tournament_id: tournamentId,
      lifecycle: "reserved",
      payment_status: "pending",
      expires_at: { $gt: new Date() },
      is_deleted: false,
    }).session(session);

    const confirmedCount = tournament.current_participants;
    if (confirmedCount + activeReservedCount >= tournament.max_participants) {
      throw new Error("Giải đấu đã đạt số lượng người tham gia tối đa (bao gồm các lượt đang chờ thanh toán).");
    }

    if (tournament.entry_fee === 0) {
      const participantDocs = await TournamentParticipants.create(
        [
          {
            tournament_id: tournamentId,
            user_id: user.userId,
            payment_status: "paid",
            lifecycle: "confirmed",
          },
        ],
        { session }
      );
      const participant = participantDocs[0];

      await Tournaments.updateOne(
        { _id: tournamentId },
        { $inc: { current_participants: 1 } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        participant_id: participant._id,
        tournament_id: tournament._id,
        entry_fee: 0,
        payment_url: null,
        expires_at: null,
      };
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const participantDocs = await TournamentParticipants.create(
      [
        {
          tournament_id: tournamentId,
          user_id: user.userId,
          payment_status: "pending",
          lifecycle: "reserved",
          expires_at: expiresAt,
        },
      ],
      { session }
    );
    const participant = participantDocs[0];

    const txnDocs = await PaymentTransaction.create(
      [
        {
          reference_type: "TournamentParticipant",
          reference_id: participant._id,
          amount: tournament.entry_fee,
          payment_method: "vnpay",
          status: "pending",
          expires_at: expiresAt,
        },
      ],
      { session }
    );
    const txn = txnDocs[0];

    participant.payment_transaction_id = txn._id;
    await participant.save({ session });

    let ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    if (ipAddr === "::1" || ipAddr === "::ffff:127.0.0.1") ipAddr = "127.0.0.1";

    const vnpayRes = buildVnpayUrl({
      txnRef: `TP_${participant._id.toString()}`,
      amount: tournament.entry_fee,
      orderInfo: `Thanh toan phi tham gia giai dau ${tournament.name}`,
      ipAddr,
      returnUrl: redirect_url,
      expireMinutes: 10,
    });

    await AuditLog.create(
      [
        {
          action: "initiate_tournament_payment",
          user_id: user.userId,
          target_collection: "tournament_participants",
          target_id: participant._id,
          old_value: null,
          new_value: {
            tournament_id: tournamentId,
            lifecycle: "reserved",
            payment_status: "pending",
            expires_at: expiresAt,
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return {
      participant_id: participant._id,
      tournament_id: tournament._id,
      entry_fee: tournament.entry_fee,
      payment_url: vnpayRes.payment_url,
      expires_at: vnpayRes.expires_at,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const confirmTournamentPayment = async (participantId, vnpAmount, vnpTransactionNo) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const participant = await TournamentParticipants.findById(participantId).session(session);
    if (!participant) throw new Error("01");

    const tournament = await Tournaments.findById(participant.tournament_id).session(session);
    if (!tournament) throw new Error("01");

    if (tournament.entry_fee !== vnpAmount) throw new Error("04");

    if (participant.payment_status === "paid") {
      throw new Error("02");
    }

    const transaction = await PaymentTransaction.findOne({
      reference_type: "TournamentParticipant",
      reference_id: participant._id,
    }).session(session);

    if (transaction) {
      transaction.status = "paid";
      transaction.webhook_transaction_id = vnpTransactionNo;
      await transaction.save({ session });
    }

    participant.payment_status = "paid";
    participant.lifecycle = "confirmed";
    participant.expires_at = null;
    await participant.save({ session });

    const updateResult = await Tournaments.updateOne(
      {
        _id: participant.tournament_id,
        current_participants: { $lt: tournament.max_participants },
      },
      {
        $inc: { current_participants: 1 },
      },
      { session }
    );

    if (updateResult.modifiedCount === 0) {
      if (transaction) {
        transaction.status = "failed";
        await transaction.save({ session });
      }
      participant.payment_status = "failed";
      participant.lifecycle = "cancelled";
      await participant.save({ session });

      throw new Error("Giải đấu đã đạt số lượng người tham gia tối đa. Suất của bạn sẽ được hoàn tiền.");
    }

    await AuditLog.create(
      [
        {
          action: "confirm_tournament_payment",
          user_id: participant.user_id,
          target_collection: "tournament_participants",
          target_id: participant._id,
          old_value: {
            payment_status: "pending",
            lifecycle: "reserved",
          },
          new_value: {
            payment_status: "paid",
            lifecycle: "confirmed",
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return true;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getParticipantPaymentStatus = async (participantId, userId) => {
  const participant = await TournamentParticipants.findById(participantId)
    .populate("tournament_id", "name entry_fee max_participants current_participants status")
    .lean();

  if (!participant || participant.is_deleted) {
    const error = new Error("Không tìm thấy thông tin đăng ký giải đấu");
    error.statusCode = 404;
    throw error;
  }

  if (participant.user_id.toString() !== userId.toString()) {
    const error = new Error("Bạn không có quyền xem thông tin đăng ký này");
    error.statusCode = 403;
    throw error;
  }

  const transaction = await PaymentTransaction.findOne({
    reference_type: "TournamentParticipant",
    reference_id: participant._id,
  }).lean();

  return {
    participant_id: participant._id,
    tournament: participant.tournament_id,
    payment_status: participant.payment_status,
    lifecycle: participant.lifecycle,
    amount: transaction?.amount || participant.tournament_id?.entry_fee || 0,
    expires_at: participant.expires_at,
    transaction_status: transaction?.status || null,
    webhook_transaction_id: transaction?.webhook_transaction_id || null,
    confirmed_at: participant.payment_status === "paid" ? participant.updatedAt : null,
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
  generateBrackets,
  getBrackets,
  initiateTournamentPayment,
  confirmTournamentPayment,
  getParticipantPaymentStatus,
};
