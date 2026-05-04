const cron = require("node-cron");
const Tournaments = require("../models/tournaments");
const { TOURNAMENT_STATUSES } = require("../services/tournamentsService");

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const ONE_MINUTE_IN_MS = 60 * 1000;

const tournamentCron = () => {
  
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const now = new Date();
        const nextMinute = new Date(now.getTime() + ONE_MINUTE_IN_MS);

        const closeRegistrationResult = await Tournaments.updateMany(
          {
            is_deleted: false,
            status: TOURNAMENT_STATUSES.OPEN_REGISTRATION,
            start_day_ongoing: {
              $gte: new Date(now.getTime() + ONE_DAY_IN_MS),
              $lt: new Date(nextMinute.getTime() + ONE_DAY_IN_MS),
            },
          },
          {
            $set: { status: TOURNAMENT_STATUSES.CLOSE_REGISTRATION },
          },
        );

        const ongoingResult = await Tournaments.updateMany(
          {
            is_deleted: false,
            status: {
              $in: [
                TOURNAMENT_STATUSES.OPEN_REGISTRATION,
                TOURNAMENT_STATUSES.CLOSE_REGISTRATION,
              ],
            },
            start_day_ongoing: { $lte: now },
          },
          {
            $set: { status: TOURNAMENT_STATUSES.ONGOING },
          },
        );

        if (closeRegistrationResult.modifiedCount > 0) {
          console.log(
            `[tournamentCron] Closed registration for ${closeRegistrationResult.modifiedCount} tournament(s).`,
          );
        }

        if (ongoingResult.modifiedCount > 0) {
          console.log(
            `[tournamentCron] Switched ${ongoingResult.modifiedCount} tournament(s) to ongoing.`,
          );
        }
      } catch (error) {
        console.error(
          "[tournamentCron] Error while updating tournament status:",
          error,
        );
      }
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    },
  );
};

module.exports = tournamentCron;
