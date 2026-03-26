const Branch = require("../models/branches");

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

module.exports = {
  getBranches,
  createBranch,
  getBranchById,
};