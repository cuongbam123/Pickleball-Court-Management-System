import {
  COURT_TYPE_LABELS,
  DAY_TYPE_LABELS,
  TIME_TYPE_LABELS,
} from "../constants/pricingRuleOptions";

const CURRENCY_FORMATTER = new Intl.NumberFormat("vi-VN");
const HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const getCourtTypeLabel = (value) => COURT_TYPE_LABELS[value] || value || "-";
export const getDayTypeLabel = (value) => DAY_TYPE_LABELS[value] || value || "-";
export const getTimeTypeLabel = (value) => TIME_TYPE_LABELS[value] || value || "-";

export const formatCurrencyVnd = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return `${CURRENCY_FORMATTER.format(amount)} đ`;
};

export const isValidHHmm = (value) => HH_MM_REGEX.test(String(value || "").trim());

export const timeToMinutes = (value) => {
  if (!isValidHHmm(value)) return NaN;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};
