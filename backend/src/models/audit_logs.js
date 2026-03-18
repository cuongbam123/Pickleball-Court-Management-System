const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", 
      required: true,
    },
    target_collection: {
      type: String,
      required: true,
      trim: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // ID của record bị tác động (Order, Booking, User...)
    },
    old_value: {
      type: mongoose.Schema.Types.Mixed, 
      default: null,
    },
    new_value: {
      type: mongoose.Schema.Types.Mixed, 
      default: null,
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

// Phục vụ truy vấn: Xem lịch sử thao tác của một user (sắp xếp mới nhất)
auditLogSchema.index({ user_id: 1, createdAt: -1 });

// Phục vụ truy vấn: Truy vết vòng đời của 1 record cụ thể (VD: Ai đã update đơn hàng X?)
auditLogSchema.index({ target_collection: 1, target_id: 1, createdAt: -1 });

// Phục vụ truy vấn: Lọc log theo loại hành động (VD: Tìm tất cả thao tác "DELETE_BOOKING")
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model("audit_logs", auditLogSchema);

module.exports = AuditLog;