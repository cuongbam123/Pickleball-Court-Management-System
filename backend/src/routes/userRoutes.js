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
} = require("../validations/userValidation");

// endpoints
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

module.exports = router;
