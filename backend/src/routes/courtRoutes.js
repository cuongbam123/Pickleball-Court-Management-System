const express = require("express");
const router = express.Router();

const courtController = require("../controllers/courtController");
const { validate, authenticate, authorizeRoles } = require("../middlewares");
const {
  updateCourt,
  updateCourtStatus,
  deleteCourt,
  getCourtById,
  updateCourtTagStatus,
} = require("../validations/courtValidation");

//public
router.get("/:id", validate(getCourtById), courtController.getCourtById);

//admiin
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  validate(updateCourt),
  courtController.updateCourt,
);

//chi doi trang thai san
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("admin", "staff"),
  validate(updateCourtStatus),
  courtController.updateCourtStatus,
);

router.patch(
  "/:id/tag-status",
  authenticate,
  authorizeRoles("admin", "staff"),
  validate(updateCourtTagStatus),
  courtController.updateCourtTagStatus,
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  validate(deleteCourt),
  courtController.deleteCourt,
);
module.exports = router;
