const productService = require("../services/productService");

const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.query);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm thành công",
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);

    res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      message: "Lấy chi tiết sản phẩm thành công",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    res.status(200).json({ success: true, message: "Cập nhật sản phẩm thành công", data: product });
  } catch (err) {
    next(err);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await productService.adjustStock(id, userId, req.body);

    res.status(200).json({
      success: true,
      message: "Điều chỉnh tồn kho thành công",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.status(200).json({ success: true, message: "Xóa sản phẩm thành công", data: null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
};