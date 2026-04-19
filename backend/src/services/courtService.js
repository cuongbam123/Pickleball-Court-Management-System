const Court = require("../models/court");
const Branch = require("../models/branches");
const Booking = require("../models/bookings");
const {
  isAdmin,
  assertManagerBranchAccess,
  assertStaffOrManagerBranchAccess,
} = require("../utils/accessControl");

const getAllCourts = async (
  { page = 1, limit = 10, type, status, tagStatus, branch_id },
  currentUser,
) => {
  const query = {
    ...(branch_id && { branch_id }),
    ...(type && { type }),
    ...(status && { status }),
    ...(tagStatus && { tagStatus }),
  };

  if (!isAdmin(currentUser)) {
    query.is_deleted = false;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    Court.find(query)
      .populate("branch_id", "name address")
      .sort({ is_deleted: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-createdAt -updatedAt")
      .lean(),
    Court.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total_records: total,
      total_pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

const getCourtsByBranch = async (
  branchId,
  { page = 1, limit = 10, type, status, tagStatus },
  currentUser,
) => {
  const query = {
    branch_id: branchId,
    ...(type && { type }),
    ...(status && { status }),
    ...(tagStatus && { tagStatus }),
  };
  //check phai admin k
  if (!isAdmin) {
    query.is_deleted = false;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    Court.find(query)
      .sort({ is_deleted: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-createdAt -updatedAt")
      .lean(),
    Court.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total_records: total,
      total_pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

const createCourt = async (branchId, payload, currentUser) => {
  assertManagerBranchAccess(
    currentUser,
    branchId,
    "Manager chi duoc tao san cho chi nhanh cua minh",
  );

  const branchExists = await Branch.exists({
    _id: branchId,
    is_deleted: false,
  });

  if (!branchExists) {
    const error = new Error("Chi nhánh không tồn tại hoặc đã bị xóa.");
    error.statusCode = 404;
    error.error_code = "ERR_BRANCH_NOT_FOUND";
    throw error;
  }

  try {
    const court = await Court.create({
      ...payload,
      branch_id: branchId,
    });
    return court;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error("Tên sân này đã tồn tại trong chi nhánh.");
      error.statusCode = 400;
      error.error_code = "ERR_COURT_DUPLICATE";
      throw error;
    }
    throw err;
  }
};

const getCourtById = async (id) => {
  const court = await Court.findOne({
    _id: id,
    is_deleted: false,
  })
    .populate("branch_id", "name address hotline")
    .lean();

  if (!court) {
    const error = new Error("Không tìm thấy sân này.");
    error.statusCode = 404;
    error.error_code = "ERR_COURT_NOT_FOUND";
    throw error;
  }

  return court;
};

const findCourtAndAssertScope = async (id, currentUser, message) => {
  const court = await Court.findOne({ _id: id, is_deleted: false }).lean();

  if (!court) {
    const error = new Error("Khong tìm thay san nay hoac da bi xoa.");
    error.statusCode = 404;
    error.error_code = "ERR_COURT_NOT_FOUND";
    throw error;
  }

  assertManagerBranchAccess(currentUser, court.branch_id, message);

  return court;
};

const updateCourt = async (id, payload, currentUser) => {
  await findCourtAndAssertScope(
    id,
    currentUser,
    "Manager chi duoc cap nhat san trong chi nhanh cua minh",
  );

  try {
    const court = await Court.findOneAndUpdate(
      { _id: id, is_deleted: false },
      { $set: payload },
      { new: true, runValidators: true },
    ).lean();

    if (!court) {
      const error = new Error("Không tìm thấy sân này hoặc đã bị xóa.");
      error.statusCode = 404;
      error.error_code = "ERR_COURT_NOT_FOUND";
      throw error;
    }
    return court;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error("Tên sân này đã tồn tại trong chi nhánh.");
      error.statusCode = 400;
      error.error_code = "ERR_COURT_DUPLICATE";
      throw error;
    }
    throw err;
  }
};

//chi doi trang thai san
const updateCourtStatus = async (id, status, currentUser) => {
  const court = await findCourtAndAssertScope(
    id,
    currentUser,
    "Manager chi duoc cap nhat san trong chi nhanh cua minh",
  );

  assertStaffOrManagerBranchAccess(
    currentUser,
    court.branch_id,
    "Ban chi duoc cap nhat trang thai san trong chi nhanh cua minh",
  );

  const updatedCourt = await Court.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { $set: { status } },
    { new: true },
  ).lean();

  if (!updatedCourt) {
    const error = new Error("Không tìm thấy sân này.");
    error.statusCode = 404;
    error.error_code = "ERR_COURT_NOT_FOUND";
    throw error;
  }
  return updatedCourt;
};

const updateCourtTagStatus = async (id, tagStatus, currentUser) => {
  const court = await findCourtAndAssertScope(
    id,
    currentUser,
    "Manager chi duoc cap nhat san trong chi nhanh cua minh",
  );

  assertStaffOrManagerBranchAccess(
    currentUser,
    court.branch_id,
    "Ban chi duoc cap nhat trang thai san trong chi nhanh cua minh",
  );

  const updatedCourt = await Court.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { $set: { tagStatus } },
    { new: true },
  ).lean();

  if (!updatedCourt) {
    const error = new Error("Không tìm thấy sân này.");
    error.statusCode = 404;
    error.error_code = "ERR_COURT_NOT_FOUND";
    throw error;
  }
  return updatedCourt;
};

const deleteCourt = async (id, currentUser) => {
  const court = await findCourtAndAssertScope(
    id,
    currentUser,
    "Manager chi duoc xoa san trong chi nhanh cua minh",
  );

  const pendingBookingsCount = await Booking.countDocuments({
    court_id: id,
    status: { $in: ["holding", "deposited", "playing"] },
    start_time: { $gte: new Date() },
    is_deleted: false,
  });

  if (pendingBookingsCount > 0) {
    const error = new Error(
      `Không thể xóa! Sân này đang có ${pendingBookingsCount} lịch đặt sắp tới.`,
    );
    error.statusCode = 400;
    error.error_code = "ERR_COURT_HAS_PENDING_BOOKINGS";
    throw error;
  }

  await Court.updateOne({ _id: court._id }, { is_deleted: true });
  return true;
};

module.exports = {
  getAllCourts,
  getCourtsByBranch,
  createCourt,
  getCourtById,
  updateCourt,
  updateCourtStatus,
  updateCourtTagStatus,
  deleteCourt,
};
