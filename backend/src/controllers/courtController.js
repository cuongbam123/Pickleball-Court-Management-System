const courtService = require("../services/courtService");

const getCourtsByBranch = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const userRole = req.user?.role;

    const result = await courtService.getCourtsByBranch(
      branchId,
      req.query,
      userRole,
    );

    res.status(200).json({
      success: true,
      message: "Lấy danh sách sân thành công",
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

const createCourt = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const court = await courtService.createCourt(branchId, req.body);

    res.status(201).json({
      success: true,
      message: "Thêm sân mới thành công",
      data: court,
    });
  } catch (err) {
    next(err);
  }
};

const getCourtById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const court = await courtService.getCourtById(id);

    res.status(200).json({
      success: true,
      message: "Lấy chi tiết sân thành công",
      data: court,
    });
  } catch (err) {
    next(err);
  }
};

const updateCourt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const court = await courtService.updateCourt(id, req.body);
    res
      .status(200)
      .json({ success: true, message: "Cập nhật sân thành công", data: court });
  } catch (err) {
    next(err);
  }
};

//chi doi trang thai san
const updateCourtStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const court = await courtService.updateCourtStatus(id, status);
    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái sân thành công",
      data: court,
    });
  } catch (err) {
    next(err);
  }
};

const updateCourtTagStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tagStatus } = req.body;
    const court = await courtService.updateCourtTagStatus(id, tagStatus);
    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái tag sân thành công",
      data: court,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCourt = async (req, res, next) => {
  try {
    const { id } = req.params;
    await courtService.deleteCourt(id);
    res
      .status(200)
      .json({ success: true, message: "Xóa sân thành công", data: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCourtsByBranch,
  createCourt,
  getCourtById,
  updateCourt,
  updateCourtStatus,
  updateCourtTagStatus,
  deleteCourt,
};
