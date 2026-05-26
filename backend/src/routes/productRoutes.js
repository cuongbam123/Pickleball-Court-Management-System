const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");
const {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
} = require("../validations/productValidation");

//xac thuc
router.use(authenticate);

//public
router.get("/", validate(getProducts), productController.getProducts);
router.get("/:id", validate(getProductById), productController.getProductById);

//staff va admin doc, nhung chi admin va manager duoc dieu chinh kho
router.post(
  "/:id/adjust-stock",
  authorizeRoles("admin", "manager"),
  validate(adjustStock),
  productController.adjustStock,
);
//admin va manager CRUD san pham
router.post(
  "/",
  authorizeRoles("admin", "manager"),
  validate(createProduct),
  productController.createProduct,
);
router.put(
  "/:id",
  authorizeRoles("admin", "manager"),
  validate(updateProduct),
  productController.updateProduct,
);
router.delete(
  "/:id",
  authorizeRoles("admin", "manager"),
  validate(deleteProduct),
  productController.deleteProduct,
);

module.exports = router;
