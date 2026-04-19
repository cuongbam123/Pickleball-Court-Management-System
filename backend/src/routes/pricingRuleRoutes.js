const express = require("express");
const router = express.Router();

const pricingRuleController = require("../controllers/pricingRuleController");
const {
  getPricingRulesQuerySchema,
  pricingRuleIdParamSchema,
  createPricingRuleBodySchema,
  updatePricingRuleBodySchema,
} = require("../validations/pricingRuleValidation");

const { validate, authenticate, authorizeRoles } = require("../middlewares");

router.get(
  "/",
  validate(getPricingRulesQuerySchema, "query"),
  pricingRuleController.getPricingRules,
);

router.get(
  "/:id",
  validate(pricingRuleIdParamSchema, "params"),
  pricingRuleController.getPricingRuleDetail,
);

router.post(
  "/",
  authenticate,
  authorizeRoles("admin", "manager"),
  validate(createPricingRuleBodySchema, "body"),
  pricingRuleController.createPricingRule,
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin", "manager"),
  validate(pricingRuleIdParamSchema, "params"),
  validate(updatePricingRuleBodySchema, "body"),
  pricingRuleController.updatePricingRule,
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin", "manager"),
  validate(pricingRuleIdParamSchema, "params"),
  pricingRuleController.deletePricingRule,
);

module.exports = router;
