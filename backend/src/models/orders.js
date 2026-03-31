const mongoose = require("mongoose");

// ================= SUB DOCUMENT =================
const orderItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    name_snapshot: {
      type: String,
      required: true,
      trim: true,
    },
    unit_price_snapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false } // Không tạo _id cho từng item để tránh rác DB
);

// ================= MAIN SCHEMA =================
const orderSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bookings",
      required: true,
      unique: true, // 1 booking = 1 order
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    total_court_fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_pos_fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    deposit_paid: {
      type: Number,
      default: 0,
      min: 0,
    },
    final_amount_due: {
      type: Number,
      default: 0,
      min: 0,
    },
    payment_status: {
      type: String,
      enum: [
        "pending_deposit",
        "deposit_paid",
        "pending_final",
        "fully_paid",
      ],
      default: "pending_deposit",
    },
    payment_method: {
      type: String,
      enum: ["vnpay", "momo", "cash", "transfer"],
      default: null,
    },
    webhook_transaction_id: {
      type: String,
      unique: true, // Ngăn lặp lại mã giao dịch từ webhook
      sparse: true, // Cho phép null, nhưng nếu có thì không được trùng
    },
    idempotency_key: {
      type: String,
      unique: true, // Ngăn client gọi API thanh toán 2 lần
      sparse: true, 
    },
    order_items: {
      type: [orderItemSchema],
      default: [],
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

// Lịch sử đơn hàng của user/branch (thường hiển thị mới nhất trước nên thêm createdAt: -1)
orderSchema.index({ user_id: 1, createdAt: -1 });
orderSchema.index({ branch_id: 1, createdAt: -1 });

// Query theo trạng thái thanh toán (để filter/thống kê doanh thu)
orderSchema.index({ payment_status: 1 });

// ================= MODEL =================
const Order = mongoose.model("orders", orderSchema);

module.exports = Order;