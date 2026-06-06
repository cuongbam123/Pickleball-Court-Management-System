const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    reference_type: {
      type: String,
      required: true,
      enum: ["Booking", "Order", "TournamentParticipant"],
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "reference_type",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_method: {
      type: String,
      enum: ["vnpay", "momo", "cash", "transfer"],
      default: "vnpay",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired", "refunded"],
      default: "pending",
    },
    webhook_transaction_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    expires_at: {
      type: Date,
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
// Indexes
paymentTransactionSchema.index({ reference_type: 1, reference_id: 1 });
paymentTransactionSchema.index({ webhook_transaction_id: 1 }, { unique: true, sparse: true });
paymentTransactionSchema.index({ status: 1, expires_at: 1 });

// Hook tự động cập nhật bảng RevenueByDay khi có giao dịch thanh toán thành công hoặc hoàn tiền
paymentTransactionSchema.post("save", async function (doc) {
  if (doc.status === "paid" || doc.status === "refunded") {
    try {
      const reportService = require("../services/reportService");
      const { toZonedTime, format } = require("date-fns-tz");
      const TIMEZONE = "Asia/Ho_Chi_Minh";
      const dateStr = format(toZonedTime(doc.updatedAt || new Date(), TIMEZONE), "yyyy-MM-dd", { timeZone: TIMEZONE });
      
      // Chạy bất tuần tự để không làm chậm luồng phản hồi chính của API
      reportService.aggregateAndSaveRevenue(dateStr).catch((err) => {
        console.error(`[PaymentTransaction Hook] Lỗi tự động cập nhật doanh thu ngày ${dateStr}:`, err);
      });
    } catch (err) {
      console.error("[PaymentTransaction Hook] Lỗi import reportService:", err);
    }
  }
});

const PaymentTransaction = mongoose.model("payment_transactions", paymentTransactionSchema);

module.exports = PaymentTransaction;
