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

const getPricingRuleDetail = async (req, res, next) => {
  try {
    const rule = await pricingRuleService.getPricingRuleDetail(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết cấu hình giá thành công",
      data: rule,
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

const updatePricingRule = async (req, res, next) => {
  try {
    const updatedRule = await pricingRuleService.updatePricingRule(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật bảng giá thành công",
      data: updatedRule,
    });
  } catch (error) {
    next(error);
  }
};

const deletePricingRule = async (req, res, next) => {
  try {
    await pricingRuleService.deletePricingRule(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Xóa cấu hình giá thành công",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPricingRules,
  createPricingRule,
  getPricingRuleDetail,
  updatePricingRule,
  deletePricingRule,
};