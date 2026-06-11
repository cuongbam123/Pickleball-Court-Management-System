const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");
const reportValidation = require("../validations/reportValidation");

// API Lấy báo cáo doanh thu theo ngày
router.get(
  "/daily-revenue",
  authenticate,
  authorizeRoles("admin", "staff", "manager"),
  validate(reportValidation.getDailyRevenue),
  reportController.getDailyRevenue
);

// API Lấy báo cáo tổng hợp cho Dashboard
router.get(
  "/dashboard",
  authenticate,
  authorizeRoles("admin", "staff", "manager"),
  validate(reportValidation.getDashboard),
  reportController.getDashboardAnalytics
);

// API Lấy danh sách giao dịch cho báo cáo dòng tiền
router.get(
  "/transactions",
  authenticate,
  authorizeRoles("admin", "staff", "manager"),
  validate(reportValidation.getTransactions),
  reportController.getTransactions
);

// API Đồng bộ thủ công doanh thu cho 1 ngày cụ thể (Chỉ Admin)
router.post(
  "/sync",
  authenticate,
  authorizeRoles("admin"),
  validate(reportValidation.syncRevenue),
  reportController.syncRevenue
);

module.exports = router;
