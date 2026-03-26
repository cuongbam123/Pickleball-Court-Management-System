const PricingRule = require("../models/pricing_rules");

const toMinutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const getPricingRules = async (query) => {
  const {
    branch_id,
    court_type,
    day_type,
    time_type,
    page = 1,
    limit = 50,
  } = query;

  const currentPage = Number(page) || 1;
  const currentLimit = Number(limit) || 50;
  const skip = (currentPage - 1) * currentLimit;

  const filter = {
    is_deleted: false,
  };
  if (branch_id) {
    filter.branch_id = branch_id;
  }
  if (court_type) {
    filter.court_type = court_type;
  }

  if (day_type) {
    filter.day_type = day_type;
  }

  if (time_type) {
    filter.time_type = time_type;
  }
  // tổng bản ghi 
  const total_records = await PricingRule.countDocuments(filter);

  const data = await PricingRule.find(filter)
    .sort({ court_type: 1, day_type: 1, start_time: 1 })
    .skip(skip)
    .limit(currentLimit);
  // tổng page
  const total_pages = Math.ceil(total_records / currentLimit) || 1;

  return {
    data,
    meta: {
      page: currentPage,
      limit: currentLimit,
      total_records,
      total_pages,
    },
  };
};

const createPricingRule = async (payload) => {
  const {
    branch_id,
    court_type,
    day_type,
    time_type,
    start_time,
    end_time,
    price_per_hour,
  } = payload;
// time mới
  const newStart = toMinutes(start_time);
  const newEnd = toMinutes(end_time);

  const existingRules = await PricingRule.find({
    branch_id,
    court_type,
    day_type,
    is_deleted: false,
  }).select("start_time end_time");
// time cũ
  const overlappedRule = existingRules.find((rule) => {
    const existingStart = toMinutes(rule.start_time);
    const existingEnd = toMinutes(rule.end_time);
// overlap
    return newStart < existingEnd && newEnd > existingStart;
  });

  if (overlappedRule) {
    const error = new Error(
      `Khoảng thời gian này đã bị trùng lặp với một quy tắc giá khác (${overlappedRule.start_time} - ${overlappedRule.end_time}) cho loại sân và ngày này.`
    );
    error.statusCode = 409;
    error.error_code = "ERR_TIME_OVERLAP";
    throw error;
  }

  const newRule = await PricingRule.create({
    branch_id,
    court_type,
    day_type,
    time_type,
    start_time,
    end_time,
    price_per_hour,
  });
  delete newRule.branch_id;
  return newRule;
};

module.exports = {
  getPricingRules,
  createPricingRule,
};