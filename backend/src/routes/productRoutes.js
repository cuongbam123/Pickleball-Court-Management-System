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
  authorizeRoles("admin", "staff"),
  validate(adjustStock),
  productController.adjustStock,
);
//admin, manager va staff
router.post(
  "/",
  authorizeRoles("admin", "manager", "staff"),
  validate(createProduct),
  productController.createProduct,
);
router.put(
  "/:id",
  authorizeRoles("admin", "manager", "staff"),
  validate(updateProduct),
  productController.updateProduct,
);
router.delete(
  "/:id",
  authorizeRoles("admin", "manager", "staff"),
  validate(deleteProduct),
  productController.deleteProduct,
);

module.exports = router;
