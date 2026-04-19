const Product = require("../models/products");
const Branch = require("../models/branches");
const InventoryTransaction = require("../models/inventory_transactions");

//ho trợ tìm kiếm gần đúng, tránh lỗi regex khi người dùng nhập ký tự đặc biệt
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getProducts = async ({ branch_id, page, limit, type, search }) => {
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

const createProduct = async (payload) => {
    //ktra chi nhanh
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

const getProductById = async (id) => {
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

  return product;
};

const updateProduct = async (id, payload) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: id, is_deleted: false },
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      const error = new Error("Không tìm thấy sản phẩm này hoặc đã bị xóa.");
      error.statusCode = 404;
      error.error_code = "ERR_PRODUCT_NOT_FOUND";
      throw error;
    }
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

const adjustStock = async (id, userId, payload) => {
  const { change_amount, reason, note } = payload;
//ktra so ton tai truoc khi xuat kho, neu change_amount < 0 thi so ton phai >= so muon xuat
  const query = { _id: id, is_deleted: false };
  if (change_amount < 0) {
    query.stock = { $gte: Math.abs(change_amount) }; 
  }

  const product = await Product.findOneAndUpdate(
    query,
    { $inc: { stock: change_amount } },
    { new: true }
  ).lean();

  if (!product) {
//ktra lỗi: nếu change_amount < 0 mà không tìm thấy sản phẩm hay ko con ton tai
    const exists = await Product.exists({ _id: id, is_deleted: false });
    if (exists) {
      const error = new Error("Số lượng tồn kho không đủ để thực hiện xuất/hủy.");
      error.statusCode = 400;
      error.error_code = "ERR_INSUFFICIENT_STOCK";
      throw error;
    } else {
      const error = new Error("Không tìm thấy sản phẩm.");
      error.statusCode = 404;
      error.error_code = "ERR_PRODUCT_NOT_FOUND";
      throw error;
    }
  }
//tao log
  const transaction = await InventoryTransaction.create({
    product_id: id,
    change_amount,
    reason,
    note,
    created_by: userId,
  });

  return { product, transaction };
};

const deleteProduct = async (id) => {
  const product = await Product.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { $set: { is_deleted: true } }
  );

  if (!product) {
    const error = new Error("Không tìm thấy sản phẩm này.");
    error.statusCode = 404;
    error.error_code = "ERR_PRODUCT_NOT_FOUND";
    throw error;
  }

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