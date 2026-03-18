const mongoose = require("mongoose");

// ================= MAIN SCHEMA =================
const paymentWebhookRawSchema = new mongoose.Schema(
  {
    webhook_id: {
      type: String,
      required: true,
      trim: true,
      // Thường các cổng thanh toán sẽ có mã giao dịch hoặc mã webhook (vd: vnp_TransactionNo).
    },
    payload: {
      type: mongoose.Schema.Types.Mixed, // Lưu nguyên vẹn cục JSON của Momo/VNPay
      required: true,
    },
    status: {
      type: String,
      enum: ["processed", "failed", "ignored"],
      required: true,
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

// Phục vụ truy vấn: Tìm kiếm nhanh 1 webhook cụ thể từ log đối tác để đối soát
paymentWebhookRawSchema.index({ webhook_id: 1 });

// Phục vụ truy vấn: Lọc các webhook bị lỗi (failed) để Admin kiểm tra và chạy lại (Retry)
paymentWebhookRawSchema.index({ status: 1, createdAt: -1 });

// ================= MODEL =================
const PaymentWebhookRaw = mongoose.model(
  "payment_webhooks_raw",
  paymentWebhookRawSchema
);

module.exports = PaymentWebhookRaw;