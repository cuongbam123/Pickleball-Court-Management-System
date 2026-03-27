const pricingRuleService = require("../services/pricingRuleService");

const getPricingRules = async (req, res, next) => {
  try {
    const result = await pricingRuleService.getPricingRules(req.query);

    return res.status(200).json({
      success: true,
      message: "Lấy cấu hình giá thành công",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const createPricingRule = async (req, res, next) => {
  try {
    const newRule = await pricingRuleService.createPricingRule(req.body);

    return res.status(201).json({
      success: true,
      message: "Thêm quy tắc giá mới thành công",
      data: newRule,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPricingRules,
  createPricingRule,
};