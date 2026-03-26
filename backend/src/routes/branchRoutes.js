const express = require("express");
const router = express.Router();

const branchController = require("../controllers/branchController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");

const {
  createBranch,
  getBranches,
  getBranchById,
} = require("../validations/branchValidation");

// PUBLIC
router.get("/", validate(getBranches), branchController.getBranches);

router.get("/:id", validate(getBranchById), branchController.getBranchById);

// ADMIN
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  validate(createBranch),
  branchController.createBranch,
);

module.exports = router;
