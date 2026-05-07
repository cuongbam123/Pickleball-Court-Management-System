/* eslint-disable no-console */
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const newman = require("newman");

const Branch = require("../src/models/branches");
const User = require("../src/models/users");
const Tournament = require("../src/models/tournaments");
const TournamentParticipant = require("../src/models/tournamentParticipants");
const TournamentBracket = require("../src/models/tournamentBrackets");

const rootDir = path.resolve(__dirname, "..");
const docsDir = path.resolve(rootDir, "docs");
const collectionPath = path.resolve(
  docsDir,
  "postman-tournaments-brackets.collection.json",
);
const environmentPath = path.resolve(
  docsDir,
  "postman-tournaments-brackets.environment.json",
);
const runtimeEnvironmentPath = path.resolve(
  docsDir,
  "postman-tournaments-brackets.runtime.environment.json",
);
const logPath = path.resolve(docsDir, "test-brackets-report.log");

const getEnvValue = (key, fallback = "") => process.env[key] || fallback;
const fsp = fs.promises;

const resetLogFile = () => {
  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath);
  }
  fs.writeFileSync(logPath, "=== BRACKETS API TEST REPORT ===\n\n");
};

const appendLog = (message) => {
  fs.appendFileSync(logPath, `${message}\n`);
};

const connectDb = async () => {
  const mongoUri = getEnvValue("MONGO_URI");
  if (!mongoUri) {
    throw new Error("Thiếu MONGO_URI trong file .env");
  }

  await mongoose.connect(mongoUri, { dbName: "pickleball_db" });
  console.log("✅ Connected MongoDB");
};

const getOrCreateSeedBranch = async (seedTag) => {
  let branch = await Branch.findOne({ is_deleted: false }).lean();
  if (branch) return branch;

  branch = await Branch.create({
    name: `Seed Branch ${seedTag}`,
    address: "Seed address",
    hotline: "0900000000",
    open_time: "06:00",
    close_time: "22:00",
  });

  return branch.toObject();
};

const createSeedData = async () => {
  const seedTag = Date.now().toString();
  const now = new Date();

  const branch = await getOrCreateSeedBranch(seedTag);

  const tournamentOpen = await Tournament.create({
    name: `Seed Tournament Open ${seedTag}`,
    required_rank: "D",
    entry_fee: 0,
    max_participants: 16,
    current_participants: 0,
    status: "open_registration",
    start_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    start_day_ongoing: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
    end_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    branch_id: branch._id,
  });

  const tournamentClose = await Tournament.create({
    name: `Seed Tournament Close ${seedTag}`,
    required_rank: "D",
    entry_fee: 0,
    max_participants: 16,
    current_participants: 4,
    status: "close_registration",
    start_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    start_day_ongoing: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
    end_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    branch_id: branch._id,
  });

  const seedUsers = await User.insertMany([
    {
      email: `seed.bracket.1.${seedTag}@example.com`,
      full_name: "Seed Bracket User 1",
      role: "customer",
      auth_provider: "local",
      skill_rank: "A",
      elo_score: 1600,
    },
    {
      email: `seed.bracket.2.${seedTag}@example.com`,
      full_name: "Seed Bracket User 2",
      role: "customer",
      auth_provider: "local",
      skill_rank: "B",
      elo_score: 1450,
    },
    {
      email: `seed.bracket.3.${seedTag}@example.com`,
      full_name: "Seed Bracket User 3",
      role: "customer",
      auth_provider: "local",
      skill_rank: "C",
      elo_score: 1300,
    },
    {
      email: `seed.bracket.4.${seedTag}@example.com`,
      full_name: "Seed Bracket User 4",
      role: "customer",
      auth_provider: "local",
      skill_rank: "D",
      elo_score: 1100,
    },
  ]);

  const participantDocs = seedUsers.map((userDoc) => ({
    tournament_id: tournamentClose._id,
    user_id: userDoc._id,
    payment_status: "paid",
    result: "participant",
  }));

  await TournamentParticipant.insertMany(participantDocs);

  return {
    seedTag,
    tournamentOpenId: tournamentOpen._id.toString(),
    tournamentCloseId: tournamentClose._id.toString(),
    userIds: seedUsers.map((u) => u._id.toString()),
  };
};

const updatePostmanEnvironment = async (
  tournamentOpenId,
  tournamentCloseId,
  adminAccessToken,
) => {
  const raw = await fsp.readFile(environmentPath, "utf-8");
  const envJson = JSON.parse(raw);

  if (!Array.isArray(envJson.values)) {
    throw new Error("File environment Postman không hợp lệ (thiếu values).");
  }

  const updateVar = (key, value) => {
    const existing = envJson.values.find((item) => item.key === key);
    if (existing) {
      existing.value = value;
      existing.enabled = true;
      return;
    }

    envJson.values.push({ key, value, enabled: true });
  };

  updateVar("tournament_id_not_close", tournamentOpenId);
  updateVar("tournament_id_close_registration", tournamentCloseId);
  if (adminAccessToken) {
    updateVar("admin_access_token", adminAccessToken);
  }

  const jsonOutput = `${JSON.stringify(envJson, null, 2)}\n`;
  await fsp.writeFile(environmentPath, jsonOutput);
  await fsp.writeFile(runtimeEnvironmentPath, jsonOutput);
  console.log("✅ Updated Postman environment file");
};

const buildAdminAccessToken = async () => {
  const jwtSecret = getEnvValue("JWT_SECRET");
  if (!jwtSecret) {
    throw new Error("Thiếu JWT_SECRET trong file .env");
  }

  const envRaw = await fsp.readFile(environmentPath, "utf-8");
  const envJson = JSON.parse(envRaw);
  const adminEmail = envJson.values?.find((item) => item.key === "admin_email")
    ?.value;

  let adminUser = null;
  if (adminEmail) {
    adminUser = await User.findOne({ email: adminEmail, is_deleted: false });
  }

  if (!adminUser) {
    adminUser = await User.findOne({ role: "admin", is_deleted: false });
  }

  if (!adminUser) {
    throw new Error(
      "Không tìm thấy user admin trong DB để tạo access token tự động.",
    );
  }

  const token = jwt.sign(
    {
      userId: adminUser._id,
      role: adminUser.role,
    },
    jwtSecret,
    { expiresIn: "30m" },
  );

  console.log(`✅ Prepared admin token for: ${adminUser.email}`);
  return token;
};

const runNewmanCollection = async () => {
  return new Promise((resolve) => {
    const run = newman.run(
      {
        collection: collectionPath,
        environment: runtimeEnvironmentPath,
        reporters: "cli",
      },
      () => {},
    );

    run.on("request", (err, args) => {
      const testName = args?.item?.name || "Unknown Test Case";
      const requestMethod = args?.request?.method || "UNKNOWN";
      const requestUrl = args?.request?.url?.toString?.() || "UNKNOWN_URL";
      const requestBody = args?.request?.body?.raw || "";
      const statusCode = args?.response?.code || "NO_STATUS";
      const statusText = args?.response?.status || "";
      const responseBody =
        args?.response?.stream?.toString?.() || args?.response?.body || "";

      appendLog(`---- [${testName}] ----`);
      appendLog(`REQUEST: ${requestMethod} ${requestUrl}`);
      appendLog(`REQ BODY: ${requestBody || "(empty)"}`);
      appendLog(`RESPONSE STATUS: ${statusCode} ${statusText}`.trim());
      appendLog(`RES BODY: ${responseBody || "(empty)"}`);
      appendLog("");

      if (err) {
        appendLog(`REQUEST ERROR: ${err.message}`);
        appendLog("");
      }
    });

    run.on("done", (err, summary) => {
      if (err || summary?.error) {
        appendLog("=== FINAL RESULT: FAIL ===");
        if (err) appendLog(`ERROR: ${err.message}`);
        if (summary?.error) appendLog(`SUMMARY ERROR: ${summary.error.message}`);
        console.error("❌ Newman: FAIL");
        resolve(false);
        return;
      }

      const failed = summary?.run?.failures?.length || 0;
      const assertionsTotal = summary?.run?.stats?.assertions?.total || 0;
      const assertionsFailed = summary?.run?.stats?.assertions?.failed || 0;
      appendLog("=== SUMMARY ===");
      appendLog(`Assertions total: ${assertionsTotal}`);
      appendLog(`Assertions failed: ${assertionsFailed}`);
      appendLog(`Failures: ${failed}`);
      appendLog(`=== FINAL RESULT: ${failed > 0 ? "FAIL" : "PASS"} ===`);

      if (failed > 0) {
        console.error("❌ Newman: FAIL");
        resolve(false);
        return;
      }

      console.log("✅ Newman: PASS");
      resolve(true);
    });
  });
};

const cleanupSeedData = async ({ seedTag, userIds, tournamentOpenId, tournamentCloseId }) => {
  await TournamentBracket.deleteMany({
    tournament_id: { $in: [tournamentOpenId, tournamentCloseId] },
  });

  await TournamentParticipant.deleteMany({
    tournament_id: { $in: [tournamentOpenId, tournamentCloseId] },
  });

  await Tournament.deleteMany({
    _id: { $in: [tournamentOpenId, tournamentCloseId] },
  });

  await User.deleteMany({ _id: { $in: userIds } });
  await Branch.deleteMany({ name: `Seed Branch ${seedTag}` });

  console.log("🧹 Cleanup seed data completed");
};

const main = async () => {
  let seedResult = null;

  try {
    resetLogFile();
    await connectDb();
    seedResult = await createSeedData();

    console.log("✅ Seeded test data");
    console.log(`- tournament_id_not_close: ${seedResult.tournamentOpenId}`);
    console.log(
      `- tournament_id_close_registration: ${seedResult.tournamentCloseId}`,
    );
    const adminAccessToken = await buildAdminAccessToken();

    await updatePostmanEnvironment(
      seedResult.tournamentOpenId,
      seedResult.tournamentCloseId,
      adminAccessToken,
    );

    await runNewmanCollection();
  } catch (error) {
    console.error("❌ Script error:", error.message);
    appendLog("=== SCRIPT ERROR ===");
    appendLog(error.message);
    process.exitCode = 1;
  } finally {
    if (seedResult) {
      try {
        await cleanupSeedData(seedResult);
      } catch (cleanupError) {
        console.error("⚠️ Cleanup error:", cleanupError.message);
        appendLog("=== CLEANUP ERROR ===");
        appendLog(cleanupError.message);
        process.exitCode = 1;
      }
    }
    await mongoose.disconnect();
    console.log("🔌 Disconnected MongoDB");
  }
};

main();
