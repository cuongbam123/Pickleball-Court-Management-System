/* eslint-disable no-console */
const http = require("http");
const { io: Client } = require("socket.io-client");
const { initSocket, emitBookingChange, emitCourtUpdate } = require("../src/config/socket");

// Cấu hình biến môi trường giả lập
process.env.CORS_ORIGIN = "http://localhost:5173";

const PORT = 5555;
const socketUrl = `http://localhost:${PORT}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log("🚀 Bắt đầu kiểm tra liên kết Socket.io...");

  // 1. Tạo HTTP server giả lập
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Mock Server");
  });

  // 2. Khởi tạo socket.io server bằng module thực tế
  initSocket(server);

  // Khởi động server
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`📡 Mock Server đang chạy tại: ${socketUrl}`);

  let testPassed = true;
  let receivedBookingEvent = null;
  let receivedCourtEvent = null;

  // 3. Khởi tạo Client Socket.io kết nối tới server
  const clientSocket = Client(socketUrl, {
    transports: ["websocket"],
    reconnection: false,
  });

  // Chờ client kết nối
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout khi kết nối Client Socket")), 3000);
    clientSocket.on("connect", () => {
      clearTimeout(timeout);
      console.log(`🔌 Client đã kết nối thành công. ID: ${clientSocket.id}`);
      resolve();
    });
  });

  // Đăng ký lắng nghe sự kiện
  clientSocket.on("booking_change", (data) => {
    console.log("📥 Client nhận sự kiện booking_change:", data);
    receivedBookingEvent = data;
  });

  clientSocket.on("court_updated", (data) => {
    console.log("📥 Client nhận sự kiện court_updated:", data);
    receivedCourtEvent = data;
  });

  // 4. Test Case 1: Phát sự kiện thay đổi Booking
  console.log("\n🧪 Test Case 1: emitBookingChange");
  const mockBooking = {
    _id: "60d5ec4b8d781b2a9c8e4567",
    court_id: "60d5ec4b8d781b2a9c8e1111",
    start_time: "2026-06-05T14:00:00.000Z",
    end_time: "2026-06-05T15:00:00.000Z",
    status: "holding",
    extra_field_should_be_filtered: "should not be here",
  };

  emitBookingChange("create", mockBooking);

  // Đợi event được phát và nhận bởi client
  await sleep(500);

  if (!receivedBookingEvent) {
    console.error("❌ Thất bại: Không nhận được sự kiện booking_change");
    testPassed = false;
  } else {
    // Xác thực cấu trúc dữ liệu gửi đi đã được filter qua helper
    const { action, booking } = receivedBookingEvent;
    if (
      action === "create" &&
      booking._id === mockBooking._id &&
      booking.court_id === mockBooking.court_id &&
      booking.start_time === mockBooking.start_time &&
      booking.end_time === mockBooking.end_time &&
      booking.status === mockBooking.status &&
      booking.extra_field_should_be_filtered === undefined
    ) {
      console.log("✅ Thành công: Cấu trúc dữ liệu booking chính xác và đã lọc các trường thừa.");
    } else {
      console.error("❌ Thất bại: Dữ liệu booking nhận được không khớp hoặc chưa lọc trường thừa:", booking);
      testPassed = false;
    }
  }

  // 5. Test Case 2: Phát sự kiện cập nhật thông tin sân
  console.log("\n🧪 Test Case 2: emitCourtUpdate");
  const mockCourt = {
    _id: "60d5ec4b8d781b2a9c8e1111",
    name: "Sân số 1 (Vip)",
    branch_id: "60d5ec4b8d781b2a9c8e2222",
    status: "active",
    tagStatus: "playing",
    extra_field_should_be_filtered: "should not be here",
  };

  emitCourtUpdate(mockCourt);

  await sleep(500);

  if (!receivedCourtEvent) {
    console.error("❌ Thất bại: Không nhận được sự kiện court_updated");
    testPassed = false;
  } else {
    const { _id, name, branch_id, status, tagStatus, extra_field_should_be_filtered } = receivedCourtEvent;
    if (
      _id === mockCourt._id &&
      name === mockCourt.name &&
      branch_id === mockCourt.branch_id &&
      status === mockCourt.status &&
      tagStatus === mockCourt.tagStatus &&
      extra_field_should_be_filtered === undefined
    ) {
      console.log("✅ Thành công: Cấu trúc dữ liệu sân chính xác và đã lọc các trường thừa.");
    } else {
      console.error("❌ Thất bại: Dữ liệu sân nhận được không khớp:", receivedCourtEvent);
      testPassed = false;
    }
  }

  // 6. Cleanup dọn dẹp kết nối
  console.log("\n🧹 Đang đóng kết nối...");
  clientSocket.disconnect();
  await new Promise((resolve) => server.close(resolve));
  console.log("🔌 Đã tắt Mock Server thành công.");

  if (testPassed) {
    console.log("\n🎉 TẤT CẢ CÁC BÀI TEST ĐÃ VƯỢT QUA THÀNH CÔNG! 🎉");
    process.exit(0);
  } else {
    console.error("\n❌ CÓ BÀI TEST BỊ THẤT BẠI! ❌");
    process.exit(1);
  }
}

runTest().catch((error) => {
  console.error("💥 Lỗi chạy thử nghiệm:", error);
  process.exit(1);
});
