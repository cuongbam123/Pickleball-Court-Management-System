const cron = require("node-cron");
const SharedTicket = require("../models/sharedTicket");

const SHARED_TICKET_PENDING_MINUTES = 10;

const buildExpiredPendingTicketFilter = (now) => ({
  payment_status: "pending",
  is_deleted: false,
  $or: [
    { expires_at: { $lt: now } },
    {
      expires_at: null,
      createdAt: {
        $lt: new Date(now.getTime() - SHARED_TICKET_PENDING_MINUTES * 60 * 1000),
      },
    },
  ],
});

const expirePendingSharedTickets = async () => {
  const now = new Date();
  const deleteResult = await SharedTicket.deleteMany(
    buildExpiredPendingTicketFilter(now),
  );

  return deleteResult.deletedCount || 0;
};

const expireSharedTicketsJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const expiredCount = await expirePendingSharedTickets();

      if (expiredCount > 0) {
        console.log(
          `[expireSharedTicketsJob] Đã tự động xóa ${expiredCount} vé ghép pending quá hạn.`,
        );
      }
    } catch (error) {
      console.error("Lỗi khi chạy cron job expireSharedTicketsJob:", error);
    }
  });
};

module.exports = expireSharedTicketsJob;
module.exports.expirePendingSharedTickets = expirePendingSharedTickets;
