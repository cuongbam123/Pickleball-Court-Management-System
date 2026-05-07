export const COURT_TYPE_OPTIONS = [
  { value: "2-player", label: "Sân 2 người" },
  { value: "4-player", label: "Sân 4 người" },
  { value: "all", label: "Tất cả các sân" },
];

export const DAY_TYPE_OPTIONS = [
  { value: "weekday", label: "Ngày thường (T2-T6)" },
  { value: "weekend", label: "Cuối tuần (T7-CN)" },
  { value: "holiday", label: "Ngày lễ" },
];

export const TIME_TYPE_OPTIONS = [
  { value: "normal", label: "Giờ bình thường" },
  { value: "golden", label: "Giờ vàng" },
];

const buildLabelMap = (options) =>
  options.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {});

export const COURT_TYPE_LABELS = buildLabelMap(COURT_TYPE_OPTIONS);
export const DAY_TYPE_LABELS = buildLabelMap(DAY_TYPE_OPTIONS);
export const TIME_TYPE_LABELS = buildLabelMap(TIME_TYPE_OPTIONS);
