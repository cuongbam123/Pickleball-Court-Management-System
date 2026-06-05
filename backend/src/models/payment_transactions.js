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

const PaymentTransaction = mongoose.model("payment_transactions", paymentTransactionSchema);

module.exports = PaymentTransaction;
