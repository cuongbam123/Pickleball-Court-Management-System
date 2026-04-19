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

//staff va admin
router.post(
  "/:id/adjust-stock",
  authorizeRoles("admin", "manager", "staff"),
  validate(adjustStock),
  productController.adjustStock,
);
//admin
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
