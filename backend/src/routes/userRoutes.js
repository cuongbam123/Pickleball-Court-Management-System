const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const {
  validate,
  authenticate,
  authorizeRoles,
} = require("../middlewares/index");

const {
  getUsers,
  getUserById,
  updateUser,
  updateUserRank,
  deleteUser,
  updateMe,
} = require("../validations/userValidation");

// endpoints
router.get(
  "/me",
  authenticate,
  userController.getMe
);
router.put(
  "/me",
  authenticate,
  validate(updateMe),
  userController.updateMe
);

router.get(
  "/",
  authenticate,
  authorizeRoles("admin"),
  validate(getUsers),
  userController.getUsers,
);

router.get(
  "/:id",
  authenticate,
  validate(getUserById),
  authorizeRoles("admin"),
  userController.getUserById,
);

router.put(
  "/:id",
  authenticate,
  validate(updateUser),
  authorizeRoles("admin"),
  userController.updateUser,
);

router.patch(
  "/:id/rank",
  authenticate,
  authorizeRoles("admin", "staff"),
  validate(updateUserRank),
  userController.updateUserRank,
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  validate(deleteUser),
  userController.deleteUser,
);

router.get(
  "/dashboard/stats",
  authenticate,
  authorizeRoles("admin"),
  userController.getDashboardStats,
);
module.exports = router;
