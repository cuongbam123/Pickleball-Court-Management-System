const express = require("express");
const router = express.Router();

const branchController = require("../controllers/branchController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");

const {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} = require("../validations/branchValidation");

//PUBLIC
router.get("/", validate(getBranches), branchController.getBranches);

router.get("/:id", validate(getBranchById), branchController.getBranchById);

//ADMIN
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  validate(createBranch),
  branchController.createBranch,
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  validate(updateBranch),
  branchController.updateBranch,
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  validate(deleteBranch),
  branchController.deleteBranch,
);

module.exports = router;
