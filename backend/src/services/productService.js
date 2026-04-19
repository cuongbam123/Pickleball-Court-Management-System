const Product = require("../models/products");
const Branch = require("../models/branches");
const InventoryTransaction = require("../models/inventory_transactions");
const {
  assertManagerBranchAccess,
  assertStaffOrManagerBranchAccess,
} = require("../utils/accessControl");

//ho trợ tìm kiếm gần đúng, tránh lỗi regex khi người dùng nhập ký tự đặc biệt

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getProducts = async ({ branch_id, page, limit, type, search }, currentUser) => {
  assertStaffOrManagerBranchAccess(
    currentUser,
    branch_id,
    "Ban chi duoc xem san pham trong chi nhanh cua minh",
  );

  const query = {
    branch_id,
    is_deleted: false,
    ...(type && { type }),
    ...(search && { name: { $regex: escapeRegex(search), $options: "i" } }),
  };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select("-is_deleted -updatedAt")
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total_records: total,
      total_pages: Math.ceil(total / limit) || 1,
    },
  };
};

const createProduct = async (payload, currentUser) => {
  assertManagerBranchAccess(
    currentUser,
    payload.branch_id,
    "Manager chi duoc tao san pham trong chi nhanh cua minh",
  );

  const branchExists = await Branch.exists({ _id: payload.branch_id, is_deleted: false });
  if (!branchExists) {
    const error = new Error("Chi nhánh không tồn tại hoặc đã bị xóa.");
    error.statusCode = 404;
    error.error_code = "ERR_BRANCH_NOT_FOUND";
    throw error;
  }

  try {
    const product = await Product.create(payload);
    return product;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error("Sản phẩm này đã tồn tại trong chi nhánh.");
      error.statusCode = 400;
      error.error_code = "ERR_PRODUCT_DUPLICATE";
      throw error;
    }
    throw err;
  }
};

const getProductById = async (id, currentUser) => {
  const product = await Product.findOne({
    _id: id,
    is_deleted: false,
  })
    .populate("branch_id", "name address")
    .lean();

  if (!product) {
    const error = new Error("Không tìm thấy sản phẩm này.");
    error.statusCode = 404;
    error.error_code = "ERR_PRODUCT_NOT_FOUND";
    throw error;
  }

  assertStaffOrManagerBranchAccess(
    currentUser,
    product.branch_id?._id || product.branch_id,
    "Ban chi duoc xem san pham trong chi nhanh cua minh",
  );

  return product;
};

const updateProduct = async (id, payload, currentUser) => {
  const existing = await Product.findOne({ _id: id, is_deleted: false }).lean();

  if (!existing) {
    const error = new Error("Khong tim thay san pham nay hoac da bi xoa.");
    error.statusCode = 404;
    error.error_code = "ERR_PRODUCT_NOT_FOUND";
    throw error;
  }

  assertManagerBranchAccess(
    currentUser,
    existing.branch_id,
    "Manager chi duoc cap nhat san pham trong chi nhanh cua minh",
  );

  try {
    const product = await Product.findOneAndUpdate(
      { _id: id, is_deleted: false },
      { $set: payload },
      { new: true, runValidators: true },
    ).lean();

    return product;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error("Tên sản phẩm đã tồn tại trong chi nhánh này.");
      error.statusCode = 400;
      error.error_code = "ERR_PRODUCT_DUPLICATE";
      throw error;
    }
    throw err;
  }
};

const adjustStock = async (id, userId, payload, currentUser) => {
  const { change_amount, reason, note } = payload;

  const baseProduct = await Product.findOne({ _id: id, is_deleted: false }).lean();

  if (!baseProduct) {
    const error = new Error("Khong tim thay san pham.");
    error.statusCode = 404;
    error.error_code = "ERR_PRODUCT_NOT_FOUND";
    throw error;
  }

  assertStaffOrManagerBranchAccess(
    currentUser,
    baseProduct.branch_id,
    "Ban chi duoc dieu chinh ton kho trong chi nhanh cua minh",
  );

  const query = { _id: id, is_deleted: false };
  if (change_amount < 0) {
    query.stock = { $gte: Math.abs(change_amount) };
  }

  const product = await Product.findOneAndUpdate(
    query,
    { $inc: { stock: change_amount } },
    { new: true },
  ).lean();

  if (!product) {
//ktra lỗi: nếu change_amount < 0 mà không tìm thấy sản phẩm hay ko con ton tai
    const exists = await Product.exists({ _id: id, is_deleted: false });
    if (exists) {
      const error = new Error("Số lượng tồn kho không đủ để thực hiện xuất/hủy.");
      error.statusCode = 400;
      error.error_code = "ERR_INSUFFICIENT_STOCK";
      throw error;
    }

    const error = new Error("Khong tim thay san pham.");
    error.statusCode = 404;
    error.error_code = "ERR_PRODUCT_NOT_FOUND";
    throw error;
  }

  const transaction = await InventoryTransaction.create({
    product_id: id,
    change_amount,
    reason,
    note,
    created_by: userId,
  });

  return { product, transaction };
};

const deleteProduct = async (id, currentUser) => {
  const baseProduct = await Product.findOne({ _id: id, is_deleted: false }).lean();

  if (!baseProduct) {
    const error = new Error("Khong tim thay san pham nay.");
    error.statusCode = 404;
    error.error_code = "ERR_PRODUCT_NOT_FOUND";
    throw error;
  }

  assertManagerBranchAccess(
    currentUser,
    baseProduct.branch_id,
    "Manager chi duoc xoa san pham trong chi nhanh cua minh",
  );

  await Product.updateOne({ _id: id, is_deleted: false }, { $set: { is_deleted: true } });
  return true;
};

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
};
