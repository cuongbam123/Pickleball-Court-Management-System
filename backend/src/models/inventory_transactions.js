const mongoose = require("mongoose");

// ================= MAIN SCHEMA =================
const inventoryTransactionSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    change_amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ["order_sale", "restock", "adjustment", "refund"],
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // VD: order_id để biết xuất do đơn hàng nào
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    note: {
      type: String,
      trim: true,
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

// Phục vụ truy vấn: Lịch sử xuất/nhập của MỘT SẢN PHẨM theo thứ tự mới nhất
inventoryTransactionSchema.index({ product_id: 1, createdAt: -1 });

// Phục vụ truy vấn: Lọc theo lý do (thống kê tổng hàng bán ra, tổng hàng nhập vào...)
inventoryTransactionSchema.index({ reason: 1, createdAt: -1 });

// Phục vụ truy vấn: Truy vết xem nhân viên nào đã thực hiện các thao tác này
inventoryTransactionSchema.index({ created_by: 1, createdAt: -1 });

// Phục vụ truy vấn: Tìm các biến động kho liên quan đến một đơn hàng cụ thể
inventoryTransactionSchema.index({ reference_id: 1 });

// ================= MODEL =================
const InventoryTransaction = mongoose.model(
  "inventory_transactions",
  inventoryTransactionSchema
);

module.exports = InventoryTransaction;