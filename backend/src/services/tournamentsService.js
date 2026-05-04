const Tournaments = require("../models/tournaments");
const AuditLog = require("../models/audit_logs");

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
    throw new Error("Chi nhanh nay da co tournament trong khoang thoi gian nay");
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

module.exports = {
  TOURNAMENT_STATUSES,
  createTournament,
  getCloseRegistrationDate,
  getTournaments,
  getTournamentsId,
  updateTournamentStatus,
};
