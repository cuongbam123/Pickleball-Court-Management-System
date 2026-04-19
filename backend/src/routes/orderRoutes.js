const express = require("express");

const { validate, authenticate, authorizeRoles } = require("../middlewares");

const orderValidation = require("../validations/orderValidation");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.use(authenticate);

router.post("/:id/pay-deposit", validate(orderValidation.payDeposit), orderController.payDeposit);

router.get("/:id", validate(orderValidation.getOrderDetail), orderController.getOrderDetail);

router.get(
  "/",
  authorizeRoles("admin", "manager", "staff"),
  validate(orderValidation.getOrders),
  orderController.getOrders,
);

router.post(
  "/:id/pos-items",
  authorizeRoles("admin", "manager", "staff"),
  validate(orderValidation.addPosItems),
  orderController.addPosItems,
);

router.patch(
  "/:id/pos-items",
  authorizeRoles("admin", "manager", "staff"),
  validate(orderValidation.updatePosItem),
  orderController.updatePosItem,
);

router.post(
  "/:id/checkout",
  authorizeRoles("admin", "manager", "staff"),
  validate(orderValidation.checkoutOrder),
  orderController.checkout,
);

module.exports = router;
