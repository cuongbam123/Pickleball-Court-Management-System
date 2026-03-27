const express = require("express");
const router = express.Router();

const pricingRuleController = require("../controllers/pricingRuleController");
const {
  getPricingRulesQuerySchema,
  createPricingRuleBodySchema,
} = require("../validations/pricingRuleValidation");

const {
  validate,
  authenticate,
  authorizeRoles,
} = require("../middlewares");

router.get(
  "/",
  validate(getPricingRulesQuerySchema, "query"),
  pricingRuleController.getPricingRules
);

router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  validate(createPricingRuleBodySchema, "body"),
  pricingRuleController.createPricingRule
);

module.exports = router;