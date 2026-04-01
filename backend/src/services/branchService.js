const Branch = require("../models/branches");
const Court = require("../models/court");
const Booking = require("../models/bookings");

// GET LIST
const getBranches = async ({ page, limit, search }) => {
  const query = {
    is_deleted: false,
    ...(search && {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ],
    }),
  };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Branch.find(query)
      .skip(skip)
      .limit(limit)
      .select("name address hotline open_time close_time")
      .lean(),
    Branch.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total_records: total,
      total_pages: Math.ceil(total / limit),
    },
  };
};

// CREATE
const createBranch = async (payload) => {
  try {
    const branch = await Branch.create(payload);
    return branch;
  } catch (err) {
    // handle duplicate name
    if (err.code === 11000) {
      const error = new Error("Tên chi nhánh đã tồn tại");
      error.statusCode = 400;
      error.error_code = "ERR_BRANCH_DUPLICATE";
      throw error;
    }
    throw err;
  }
};

// GET DETAIL
const getBranchById = async (id) => {
  const branch = await Branch.findOne({
    _id: id,
    is_deleted: false,
  }).lean();

  if (!branch) {
    const error = new Error("Không tìm thấy chi nhánh này.");
    error.statusCode = 404;
    error.error_code = "ERR_BRANCH_NOT_FOUND";
    throw error;
  }

  return branch;
};

//update
const updateBranch = async (id, payload) => {
  try {
    const updatedBranch = await Branch.findOneAndUpdate(
      { _id: id, is_deleted: false },
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedBranch) {
      const error = new Error("Không tìm thấy chi nhánh này hoặc đã bị xóa.");
      error.statusCode = 404;
      error.error_code = "ERR_BRANCH_NOT_FOUND";
      throw error;
    }

    return updatedBranch;
  } catch (err) {
    //trungùng tên chi nhánh với chi nhánh khác
    if (err.code === 11000) {
      const error = new Error("Tên chi nhánh đã tồn tại ở cơ sở khác");
      error.statusCode = 400;
      error.error_code = "ERR_BRANCH_DUPLICATE";
      throw error;
    }
    throw err;
  }
};

//delete
const deleteBranch = async (id) => {
//check trước khi xóa
//xem thu co ton tai k
  const branch = await Branch.findOne({ _id: id, is_deleted: false });
  if (!branch) {
    const error = new Error("Không tìm thấy chi nhánh này.");
    error.statusCode = 404;
    error.error_code = "ERR_BRANCH_NOT_FOUND";
    throw error;
  }
//kiem tra san co thuoc chi nhanh do k
  const activeCourtsCount = await Court.countDocuments({ 
    branch_id: id, 
    is_deleted: false 
  });
  
  if (activeCourtsCount > 0) {
    const error = new Error(`Không thể xóa! Chi nhánh này đang có ${activeCourtsCount} sân (bao gồm cả active và maintenance).`);
    error.statusCode = 400;
    error.error_code = "ERR_BRANCH_HAS_COURTS";
    throw error;
  }

// kiem tra xem co lich dat san nao sap toi k
  const pendingBookingsCount = await Booking.countDocuments({
    branch_id: id,
    status: { $in: ["holding", "deposited", "playing"] },
    start_time: { $gte: new Date() }, 
    is_deleted: false
  });

  if (pendingBookingsCount > 0) {
    const error = new Error(`Không thể xóa! Chi nhánh này đang có ${pendingBookingsCount} lịch đặt sân sắp tới hoặc đang giữ chỗ.`);
    error.statusCode = 400;
    error.error_code = "ERR_BRANCH_HAS_PENDING_BOOKINGS";
    throw error;
  }

  branch.is_deleted = true;
  await branch.save();

  return true;
};

module.exports = {
  getBranches,
  createBranch,
  getBranchById,
  updateBranch,
  deleteBranch,
};