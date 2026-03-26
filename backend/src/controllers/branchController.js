const branchService = require("../services/branchService");

// GET LIST
const getBranches = async (req, res, next) => {
  try {
    const result = await branchService.getBranches(req.query);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách chi nhánh thành công",
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

// CREATE
const createBranch = async (req, res, next) => {
  try {
    const branch = await branchService.createBranch(req.body);

    res.status(201).json({
      success: true,
      message: "Tạo chi nhánh thành công",
      data: branch,
    });
  } catch (err) {
    next(err);
  }
};

// GET DETAIL
const getBranchById = async (req, res, next) => {
  try {
    const branch = await branchService.getBranchById(req.params.id);

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBranches,
  createBranch,
  getBranchById,
};