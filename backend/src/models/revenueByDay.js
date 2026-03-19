const mongoose = require("mongoose");

const revenueByDaySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày phải là YYYY-MM-DD"],
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    total_revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    deposit_revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    pos_revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, 
    versionKey: false,
  }
);

// ================= INDEX =================

// 1. RẤT QUAN TRỌNG (Unique Index): Đảm bảo mỗi chi nhánh chỉ có DUY NHẤT 1 bản ghi báo cáo cho 1 ngày.
// Ngăn chặn triệt để lỗi sinh ra 2 dòng báo cáo cho cùng 1 ngày nếu Cronjob chạy đúp.
// Đồng thời, index này giúp truy vấn lấy báo cáo của 1 cơ sở trong 1 khoảng thời gian cực nhanh.
revenueByDaySchema.index({ branch_id: 1, date: 1 }, { unique: true });

// 2. Phục vụ truy vấn: Lấy tổng doanh thu của TOÀN BỘ hệ thống (tất cả các chi nhánh) trong 1 ngày cụ thể.
revenueByDaySchema.index({ date: 1 });

// ================= MODEL =================
const RevenueByDay = mongoose.model("revenues_by_day", revenueByDaySchema);

module.exports = RevenueByDay;