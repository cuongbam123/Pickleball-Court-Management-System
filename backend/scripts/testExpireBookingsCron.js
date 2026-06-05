const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const http = require("http");
const mongoose = require("mongoose");
const { io: Client } = require("socket.io-client");
const cron = require("node-cron");

// Mock node-cron to intercept the cron schedule callback
let cronJobCallback = null;
cron.schedule = (pattern, callback) => {
  cronJobCallback = callback;
  return {
    start: () => {},
    stop: () => {},
  };
};

const { initSocket } = require("../src/config/socket");
const Booking = require("../src/models/bookings");
const expireBookingsJob = require("../src/jobs/expireBookingsJob");

const PORT = 5556;
const socketUrl = `http://localhost:${PORT}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log("🚀 Bắt đầu chạy Integration Test cho expireBookingsJob & Socket.io...");

  // 1. Kết nối database
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ Thiếu MONGO_URI trong file .env");
    process.exit(1);
  }
  await mongoose.connect(mongoUri, { dbName: "pickleball_db" });
  console.log("✅ Đã kết nối MongoDB.");

  // 2. Thiết lập Mock HTTP và Socket Server
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Mock Server");
  });
  initSocket(server);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`📡 Socket Server đang chạy tại: ${socketUrl}`);

  // 3. Khởi chạy Job (sẽ đăng ký callback qua mock cron.schedule)
  expireBookingsJob();
  if (!cronJobCallback) {
    console.error("❌ Thất bại: Cron job callback chưa được đăng ký!");
    process.exit(1);
  }
  console.log("⏰ Đã đăng ký Cron Job callback.");

  // 4. Kết nối Mock Client Socket.io
  const clientSocket = Client(socketUrl, {
    transports: ["websocket"],
    reconnection: false,
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout kết nối client socket")), 3000);
    clientSocket.on("connect", () => {
      clearTimeout(timeout);
      console.log(`🔌 Client Socket đã kết nối. ID: ${clientSocket.id}`);
      resolve();
    });
  });

  // Mảng lưu các sự kiện socket nhận được
  const receivedEvents = [];
  clientSocket.on("booking_change", (data) => {
    console.log("📥 Client Socket nhận sự kiện booking_change:", data);
    receivedEvents.push(data);
  });

  // 5. Tạo dữ liệu Mock Bookings trong DB để test
  console.log("\n🧹 Dọn dẹp dữ liệu cũ...");
  const dummyCourtId = new mongoose.Types.ObjectId();
  const dummyUserId = new mongoose.Types.ObjectId();

  const now = new Date();
  const pastTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 phút trước
  const futureTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 phút sau

  const mockBookingsData = [
    {
      // 1. Booking Standard quá hạn -> Phải bị hủy & Phát socket
      court_id: dummyCourtId,
      user_id: dummyUserId,
      booking_type: "standard",
      status: "holding",
      expires_at: pastTime,
      start_time: new Date(now.getTime() + 1 * 60 * 60 * 1000),
      end_time: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      branch_id: new mongoose.Types.ObjectId(),
      total_court_price: 150000,
      deposit_amount: 50000,
    },
    {
      // 2. Booking Shared Match quá hạn -> KHÔNG được hủy (chỉ hủy standard)
      court_id: dummyCourtId,
      user_id: dummyUserId,
      booking_type: "shared_match",
      status: "holding",
      expires_at: pastTime,
      start_time: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      end_time: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      branch_id: new mongoose.Types.ObjectId(),
      total_court_price: 150000,
      deposit_amount: 50000,
    },
    {
      // 3. Booking Standard chưa quá hạn -> KHÔNG được hủy
      court_id: dummyCourtId,
      user_id: dummyUserId,
      booking_type: "standard",
      status: "holding",
      expires_at: futureTime,
      start_time: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      end_time: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      branch_id: new mongoose.Types.ObjectId(),
      total_court_price: 150000,
      deposit_amount: 50000,
    },
  ];

  const createdBookings = await Booking.insertMany(mockBookingsData);
  console.log(`📝 Đã tạo ${createdBookings.length} mock booking trong database.`);

  const idStandardExpired = createdBookings[0]._id;
  const idTournamentExpired = createdBookings[1]._id;
  const idStandardNotExpired = createdBookings[2]._id;

  // 6. Thực thi Cron Job
  console.log("\n🧪 Chạy trigger Cron Job...");
  await cronJobCallback();
  
  // Chờ truyền phát Socket.io
  await sleep(1000);

  // 7. Truy vấn DB kiểm tra kết quả
  console.log("\n🔍 Kiểm tra dữ liệu trong DB sau khi chạy Job:");
  const booking1 = await Booking.findById(idStandardExpired);
  const booking2 = await Booking.findById(idTournamentExpired);
  const booking3 = await Booking.findById(idStandardNotExpired);

  let testPassed = true;

  // Kiểm tra Booking 1 (Standard Quá hạn)
  if (booking1.status === "cancelled" && booking1.cancelled_by === "system") {
    console.log("✅ Booking 1 (Standard Quá hạn): Đã hủy thành công.");
  } else {
    console.error(`❌ Booking 1 Sai trạng thái: ${booking1.status}`);
    testPassed = false;
  }

  // Kiểm tra Booking 2 (Shared Match Quá hạn)
  if (booking2.status === "holding") {
    console.log("✅ Booking 2 (Shared Match Quá hạn): Giữ nguyên trạng thái (chính xác).");
  } else {
    console.error(`❌ Booking 2 Sai trạng thái: ${booking2.status}`);
    testPassed = false;
  }

  // Kiểm tra Booking 3 (Standard Chưa quá hạn)
  if (booking3.status === "holding") {
    console.log("✅ Booking 3 (Standard Chưa quá hạn): Giữ nguyên trạng thái (chính xác).");
  } else {
    console.error(`❌ Booking 3 Sai trạng thái: ${booking3.status}`);
    testPassed = false;
  }

  // 8. Kiểm tra Socket Event
  console.log("\n🔍 Kiểm tra Socket Events truyền phát:");
  if (receivedEvents.length === 1) {
    const event = receivedEvents[0];
    if (event.action === "cancel" && event.booking._id === idStandardExpired.toString()) {
      console.log("✅ Đã nhận chính xác 1 sự kiện hủy socket cho Booking 1.");
    } else {
      console.error("❌ Sự kiện socket nhận được không chính xác:", event);
      testPassed = false;
    }
  } else {
    console.error(`❌ Nhận sai số lượng sự kiện socket: mong đợi 1, thực tế nhận được ${receivedEvents.length}`);
    testPassed = false;
  }

  // 9. Dọn dẹp dữ liệu
  console.log("\n🧹 Dọn dẹp dữ liệu kiểm thử...");
  await Booking.deleteMany({ _id: { $in: [idStandardExpired, idTournamentExpired, idStandardNotExpired] } });
  console.log("🧹 Đã xóa mock bookings.");

  // Đóng các kết nối
  clientSocket.disconnect();
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  console.log("🔌 Đã đóng toàn bộ kết nối.");

  if (testPassed) {
    console.log("\n🎉 TEST ĐẶC TÍNH MỚI TRÊN NHÁNH MAIN ĐÃ THÀNH CÔNG RỰC RỠ! 🎉\n");
    process.exit(0);
  } else {
    console.error("\n❌ CÓ LỖI XẢY RA TRONG QUÁ TRÌNH KIỂM THỬ! ❌\n");
    process.exit(1);
  }
}

runTest().catch((error) => {
  console.error("💥 Lỗi thực thi bài test:", error);
  process.exit(1);
});
