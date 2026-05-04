// Logger helper tối giản, không add dependency.
// Format: [<tag>] <ISO timestamp> <level> <message> <json-payload?>
// Dùng chung cho các cron job (autoRankJob, expireBookingsJob) và các
// module khác muốn log có structure để grep/parse bằng ops tool.
//
// Nếu sau này muốn đổi sang pino/winston chỉ cần thay implementation
// của createLogger, toàn bộ call-site giữ nguyên.

const format = (tag, level, message, extra) => {
  const timestamp = new Date().toISOString();
  const hasExtra = extra && Object.keys(extra).length > 0;
  const payload = hasExtra ? ` ${JSON.stringify(extra)}` : "";
  return `[${tag}] ${timestamp} ${level} ${message}${payload}`;
};

const createLogger = (tag) => ({
  info(message, extra) {
    console.log(format(tag, "INFO", message, extra));
  },
  warn(message, extra) {
    console.warn(format(tag, "WARN", message, extra));
  },
  error(message, extra) {
    console.error(format(tag, "ERROR", message, extra));
  },
});

module.exports = {
  createLogger,
};
