const cron = require("node-cron");
const User = require("../models/users");
const { getSkillRankFromElo } = require("../utils/userRank");
const { createLogger } = require("../utils/logger");

const logger = createLogger("autoRankJob");

// Lịch mặc định: 02:00 hằng ngày (giờ server). Có thể override bằng biến
// môi trường RANK_CRON_SCHEDULE (theo cú pháp crontab).
const DEFAULT_SCHEDULE = "0 2 * * *";
const BATCH_SIZE = 500;

// Mutex module-scope để tránh job chạy chồng nhau khi instance trước
// chưa hoàn tất (ví dụ DB lớn > 1 giờ).
let isRunning = false;

// Gom batch bulkWrite để giảm round-trip xuống DB.
const flushBulkOps = async (bulkOps) => {
  if (bulkOps.length === 0) return 0;
  const result = await User.bulkWrite(bulkOps, { ordered: false });
  return result.modifiedCount || 0;
};

// Hàm xử lý chính, tách riêng để dùng được cho cả cron tick và endpoint
// recompute thủ công (POST /users/rank/recompute).
const runAutoRank = async ({ trigger = "cron" } = {}) => {
  if (isRunning) {
    logger.warn("skip: previous run is still in progress", { trigger });
    return { skipped: true, scanned: 0, updated: 0, errors: 0, durationMs: 0 };
  }

  isRunning = true;
  const startedAt = Date.now();
  let scanned = 0;
  let updated = 0;
  let errors = 0;
  let bulkOps = [];

  logger.info("start", { trigger, batchSize: BATCH_SIZE });

  try {
    // Chỉ quét user chưa xoá mềm. Dùng cursor để tránh OOM khi DB phình to.
    const cursor = User.find({ is_deleted: false })
      .select("_id elo_score skill_rank")
      .lean()
      .cursor({ batchSize: BATCH_SIZE });

    for await (const user of cursor) {
      scanned += 1;
      const derivedRank = getSkillRankFromElo(user.elo_score);

      // elo_score không hợp lệ -> skip, không tự hạ rank để tránh mất data
      if (derivedRank === null) {
        logger.error("invalid elo_score, skip user", {
          userId: String(user._id),
          elo_score: user.elo_score,
        });
        errors += 1;
        continue;
      }

      if (derivedRank === user.skill_rank) continue;

      bulkOps.push({
        updateOne: {
          filter: { _id: user._id },
          update: { $set: { skill_rank: derivedRank } },
        },
      });

      if (bulkOps.length >= BATCH_SIZE) {
        const modified = await flushBulkOps(bulkOps);
        updated += modified;
        logger.info("flushed batch", { modified, scannedSoFar: scanned });
        bulkOps = [];
      }
    }

    const modified = await flushBulkOps(bulkOps);
    updated += modified;
    bulkOps = [];

    const durationMs = Date.now() - startedAt;
    logger.info("done", { trigger, scanned, updated, errors, durationMs });
    return { skipped: false, scanned, updated, errors, durationMs };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.error("job failed", {
      trigger,
      scanned,
      updated,
      errors,
      durationMs,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    isRunning = false;
  }
};

// Khởi tạo cron schedule. Gọi 1 lần khi server start.
const autoRankJob = () => {
  const schedule = process.env.RANK_CRON_SCHEDULE || DEFAULT_SCHEDULE;

  if (!cron.validate(schedule)) {
    logger.error("invalid cron schedule, fallback to default", {
      provided: schedule,
      default: DEFAULT_SCHEDULE,
    });
  }

  const expression = cron.validate(schedule) ? schedule : DEFAULT_SCHEDULE;

  cron.schedule(expression, async () => {
    try {
      await runAutoRank({ trigger: "cron" });
    } catch (error) {
      logger.error("unhandled error from cron tick", { error: error.message });
    }
  });

  logger.info("scheduled", { expression });
};

module.exports = autoRankJob;
module.exports.runAutoRank = runAutoRank;
