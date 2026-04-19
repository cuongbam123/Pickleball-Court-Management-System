const Court = require("../models/court");
const Branch = require("../models/branches");
const Booking = require("../models/bookings");

//Get all
// court.service.js (hoặc file chứa hàm getCourtsByBranch hiện tại của bạn)

// GET ALL COURTS (Có hỗ trợ lọc tùy chọn)
const getAllCourts = async (
  { page = 1, limit = 10, type, status, tagStatus, branch_id },
  userRole
) => {
  const isAdmin = userRole === "admin";

  // Build query linh hoạt
  const query = {
    ...(branch_id && { branch_id }), // Nếu có truyền branch_id lên thì lọc, không thì lấy hết
    ...(type && { type }),
    ...(status && { status }),
    ...(tagStatus && { tagStatus }),
  };

  // Check quyền: Admin thấy cả sân đã xóa (soft delete), role khác thì không
  if (!isAdmin) {
    query.is_deleted = false;
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Court.find(query)
      .populate("branch_id", "name address") // 👉 Lấy luôn tên và địa chỉ chi nhánh
      .sort({ is_deleted: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
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
      total_pages: Math.ceil(total / limit) || 1,
    },
  };
};
// GET COURTS BY BRANCH
const getCourtsByBranch = async (
  branchId,
  { page, limit, type, status, tagStatus },
  userRole,
) => {
  const isAdmin = userRole === "admin";

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

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Court.find(query)
      .sort({ is_deleted: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-createdAt -updatedAt")
      .lean(),
    Court.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total_records: total,
      total_pages: Math.ceil(total / limit) || 1,
    },
  };
};

const createCourt = async (branchId, payload) => {
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

const updateCourt = async (id, payload) => {
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
const updateCourtStatus = async (id, status) => {
  const court = await Court.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { $set: { status } },
    { new: true },
  ).lean();

  if (!court) {
    const error = new Error("Không tìm thấy sân này.");
    error.statusCode = 404;
    error.error_code = "ERR_COURT_NOT_FOUND";
    throw error;
  }
  return court;
};

const updateCourtTagStatus = async (id, tagStatus) => {
  const court = await Court.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { $set: { tagStatus } },
    { new: true },
  ).lean();
  
  if (!court) {
    const error = new Error("Không tìm thấy sân này.");
    error.statusCode = 404;
    error.error_code = "ERR_COURT_NOT_FOUND";
    throw error;
  }
  return court;
};

const deleteCourt = async (id) => {
  const court = await Court.findOne({ _id: id, is_deleted: false });
  if (!court) {
    const error = new Error("Không tìm thấy sân này.");
    error.statusCode = 404;
    error.error_code = "ERR_COURT_NOT_FOUND";
    throw error;
  }

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

  court.is_deleted = true;
  await court.save();
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
