const PricingRule = require("../models/pricing_rules");
const mongoose = require("mongoose");
const {
  toIdString,
  assertManagerBranchAccess,
  assertStaffOrManagerBranchAccess,
} = require("../utils/accessControl");

const toMinutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};
// overlap
const isTimeOverlapped = (newStart, newEnd, existingStart, existingEnd) => {
  return newStart < existingEnd && newEnd > existingStart;
};

const createAppError = (message, statusCode, errorCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.error_code = errorCode;
  return error;
};

const getPricingRules = async (query, currentUser) => {
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

  if (currentUser?.role === "staff" || currentUser?.role === "manager") {
    if (branch_id && toIdString(branch_id) !== toIdString(currentUser.branch_id)) {
      throw createAppError(
        "Ban chi duoc xem bang gia trong chi nhanh cua minh",
        403,
        "ERR_BRANCH_SCOPE_FORBIDDEN",
      );
    }
    filter.branch_id = currentUser.branch_id;
  } else if (branch_id) {
    filter.branch_id = branch_id;
  }

  if (court_type) filter.court_type = court_type;
  if (day_type) filter.day_type = day_type;
  if (time_type) filter.time_type = time_type;

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

const getPricingRuleDetail = async (id, currentUser) => {
  const rule = await PricingRule.findOne({
    _id: id,
    is_deleted: false,
  });

  if (!rule) {
    throw createAppError("Không tìm thấy cấu hình giá", 404, "ERR_PRICING_RULE_NOT_FOUND");
  }

  assertStaffOrManagerBranchAccess(
    currentUser,
    rule.branch_id,
    "Ban chi duoc xem bang gia trong chi nhanh cua minh",
  );

  return rule;
};

const createPricingRule = async (payload, currentUser) => {
  const {
    branch_id,
    court_type,
    day_type,
    time_type,
    start_time,
    end_time,
    price_per_hour,
  } = payload;

  assertManagerBranchAccess(
    currentUser,
    branch_id,
    "Manager chi duoc tao bang gia trong chi nhanh cua minh",
  );

  const newStart = toMinutes(start_time);
  const newEnd = toMinutes(end_time);

  if (newStart >= newEnd) {
    throw createAppError("start_time phai nho hon end_time", 400, "ERR_INVALID_TIME_RANGE");
  }

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
    return isTimeOverlapped(newStart, newEnd, existingStart, existingEnd);
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
  return newRule;
};
const updatePricingRule = async (id, payload) => {
  const currentRule = await PricingRule.findOne({
    _id: id,
    is_deleted: false,
  });

  if (!currentRule) {
    throw createAppError("Khong tim thay cau hinh gia", 404, "ERR_PRICING_RULE_NOT_FOUND");
  }

  assertManagerBranchAccess(
    currentUser,
    currentRule.branch_id,
    "Manager chi duoc cap nhat bang gia trong chi nhanh cua minh",
  );

  const mergedData = {
    branch_id: payload.branch_id || currentRule.branch_id.toString(),
    court_type: payload.court_type || currentRule.court_type,
    day_type: payload.day_type || currentRule.day_type,
    time_type: payload.time_type || currentRule.time_type,
    start_time: payload.start_time || currentRule.start_time,
    end_time: payload.end_time || currentRule.end_time,
    price_per_hour:
      payload.price_per_hour !== undefined
        ? payload.price_per_hour
        : currentRule.price_per_hour,
  };

  assertManagerBranchAccess(
    currentUser,
    mergedData.branch_id,
    "Manager khong duoc chuyen bang gia sang chi nhanh khac",
  );

  const newStart = toMinutes(mergedData.start_time);
  const newEnd = toMinutes(mergedData.end_time);

  if (newStart >= newEnd) {
    throw createAppError("start_time phải nhỏ hơn end_time", 400, "ERR_INVALID_TIME_RANGE");
  }

  const existingRules = await PricingRule.find({
    _id: { $ne: new mongoose.Types.ObjectId(id) },
    branch_id: mergedData.branch_id,
    court_type: mergedData.court_type,
    day_type: mergedData.day_type,
    is_deleted: false,
  }).select("start_time end_time");

  const overlappedRule = existingRules.find((rule) => {
    const existingStart = toMinutes(rule.start_time);
    const existingEnd = toMinutes(rule.end_time);

    return isTimeOverlapped(newStart, newEnd, existingStart, existingEnd);
  });

  if (overlappedRule) {
    throw createAppError(
      `Khoảng thời gian này đã bị trùng lặp với một quy tắc giá khác (${overlappedRule.start_time} - ${overlappedRule.end_time}) trong cùng chi nhánh, loại sân và loại ngày.`,
      409,
      "ERR_TIME_OVERLAP",
    );
  }

  currentRule.branch_id = mergedData.branch_id;
  currentRule.court_type = mergedData.court_type;
  currentRule.day_type = mergedData.day_type;
  currentRule.time_type = mergedData.time_type;
  currentRule.start_time = mergedData.start_time;
  currentRule.end_time = mergedData.end_time;
  currentRule.price_per_hour = mergedData.price_per_hour;

  await currentRule.save();

  return currentRule;
};

const deletePricingRule = async (id, currentUser) => {
  const currentRule = await PricingRule.findOne({
    _id: id,
    is_deleted: false,
  });

  if (!currentRule) {
    throw createAppError("Không tìm thấy cấu hình giá", 404, "ERR_PRICING_RULE_NOT_FOUND");
  }

  assertManagerBranchAccess(
    currentUser,
    currentRule.branch_id,
    "Manager chi duoc xoa bang gia trong chi nhanh cua minh",
  );

  currentRule.is_deleted = true;
  await currentRule.save();

  return null;
};

module.exports = {
  getPricingRules,
  getPricingRuleDetail,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
};
