const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { validate, authenticate, authorizeRoles } = require("../middlewares/index");

const {
  getUsers,
  getUserById,
  updateUser,
  updateUserRank,
  deleteUser,
  updateMe,
} = require("../validations/userValidation");

router.get("/me", authenticate, userController.getMe);
router.put("/me", authenticate, validate(updateMe), userController.updateMe);

router.get(
  "/",
  authenticate,
  authorizeRoles("admin", "manager"),
  validate(getUsers),
  userController.getUsers,
);

router.get(
  "/:id",
  authenticate,
  validate(getUserById),
  authorizeRoles("admin", "manager"),
  userController.getUserById,
);

router.put(
  "/:id",
  authenticate,
  validate(updateUser),
  authorizeRoles("admin", "manager"),
  userController.updateUser,
);

router.patch(
  "/:id/rank",
  authenticate,
  authorizeRoles("admin", "manager", "staff"),
  validate(updateUserRank),
  userController.updateUserRank,
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin", "manager"),
  validate(deleteUser),
  userController.deleteUser,
);

router.get(
  "/dashboard/stats",
  authenticate,
  authorizeRoles("admin", "manager"),
  userController.getDashboardStats,
);

module.exports = router;
