const mongoose = require("mongoose");

// ================= MAIN SCHEMA =================
const productSchema = new mongoose.Schema(
  {
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["drink", "equipment_rental", "retail"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
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

// Đảm bảo không trùng tên sản phẩm trong cùng một chi nhánh
// Đồng thời phục vụ luôn cho các query chỉ tìm theo branch_id (Left-Prefix Rule)
productSchema.index({ branch_id: 1, name: 1 }, { unique: true });

// Lọc sản phẩm theo loại trong một chi nhánh cụ thể (Truy vấn phổ biến nhất ở quầy POS)
productSchema.index({ branch_id: 1, type: 1 });

// Lọc và sắp xếp theo giá
productSchema.index({ price: 1 });

// ================= MODEL =================
const Product = mongoose.model("products", productSchema);

module.exports = Product;