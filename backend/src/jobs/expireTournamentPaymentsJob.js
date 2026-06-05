const cron = require("node-cron");
const mongoose = require("mongoose");
const TournamentParticipant = require("../models/tournamentParticipants");
const PaymentTransaction = require("../models/payment_transactions");
const AuditLog = require("../models/audit_logs");

const expireTournamentPaymentsJob = () => {
  cron.schedule("* * * * *", async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const now = new Date();
      
      // 1. Tìm các bản ghi đăng ký giữ chỗ đã hết hạn thanh toán
      const expiredParticipants = await TournamentParticipant.find({
        lifecycle: "reserved",
        payment_status: "pending",
        expires_at: { $lt: now },
        is_deleted: false,
      }).session(session);

      if (expiredParticipants.length > 0) {
        const participantIds = expiredParticipants.map(p => p._id);

        // 2. Chuyển lifecycle sang expired và payment_status sang expired
        await TournamentParticipant.updateMany(
          { _id: { $in: participantIds } },
          {
            $set: {
              payment_status: "expired",
              lifecycle: "expired",
            },
          }
        ).session(session);

        // 3. Chuyển trạng thái giao dịch thanh toán sang expired
        await PaymentTransaction.updateMany(
          {
            reference_type: "TournamentParticipant",
            reference_id: { $in: participantIds },
            status: "pending",
          },
          {
            $set: { status: "expired" },
          }
        ).session(session);

        // 4. Lưu AuditLog hàng loạt
        const auditLogs = expiredParticipants.map(participant => ({
          action: "system_expire_registration",
          user_id: "system",
          target_collection: "tournament_participants",
          target_id: participant._id,
          old_value: { payment_status: "pending", lifecycle: "reserved" },
          new_value: { payment_status: "expired", lifecycle: "expired" },
        }));

        await AuditLog.create(auditLogs, { session });

        await session.commitTransaction();
        console.log(
          `[expireTournamentPaymentsJob] Đã tự động giải phóng ${expiredParticipants.length} suất đăng ký giải đấu quá hạn thanh toán.`
        );
      } else {
        await session.commitTransaction();
      }
    } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi chạy cron job expireTournamentPaymentsJob:", error);
    } finally {
      session.endSession();
    }
  });
};

module.exports = expireTournamentPaymentsJob;
