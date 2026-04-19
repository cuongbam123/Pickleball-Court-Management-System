const express = require("express");
const router = express.Router();

const branchController = require("../controllers/branchController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");
const courtController = require("../controllers/courtController");
const { getCourtsByBranch, createCourt } = require("../validations/courtValidation");

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
  authorizeRoles("admin", "manager"),
  validate(updateBranch),
  branchController.updateBranch,
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin", "manager"),
  validate(deleteBranch),
  branchController.deleteBranch,
);

//api saân thuoc chi nhanh
router.get("/:branchId/courts", validate(getCourtsByBranch), courtController.getCourtsByBranch);

router.post(
  "/:branchId/courts",
  authenticate,
  authorizeRoles("admin", "manager"),
  validate(createCourt),
  courtController.createCourt,
);

module.exports = router;
