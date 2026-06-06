const mongoose = require("mongoose");
const { toZonedTime, format } = require("date-fns-tz");

const RevenueByDay = require("../models/revenueByDay");
const Booking = require("../models/bookings");
const User = require("../models/users");
const Court = require("../models/court");
const Branch = require("../models/branches");
const Order = require("../models/orders");
const TournamentParticipant = require("../models/tournamentParticipants");
const SharedTicket = require("../models/sharedTicket");
const PaymentTransaction = require("../models/payment_transactions");

const TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Lấy mốc thời gian bắt đầu và kết thúc của một ngày theo múi giờ VN (GMT+7)
 * @param {string} dateStr Định dạng YYYY-MM-DD
 */
const getDayBounds = (dateStr) => {
  const start = new Date(`${dateStr}T00:00:00+07:00`);
  const end = new Date(`${dateStr}T23:59:59.999+07:00`);
  return { start, end };
};

/**
 * Tính toán doanh thu thực tế cho 1 ngày cụ thể của tất cả các chi nhánh
 * @param {string} dateStr Định dạng YYYY-MM-DD
 */
const calculateRevenueForDate = async (dateStr) => {
  const { start, end } = getDayBounds(dateStr);

  // 1. Lấy tất cả giao dịch thanh toán thành công trong ngày
  const transactions = await PaymentTransaction.find({
    status: "paid",
    updatedAt: { $gte: start, $lte: end },
  }).lean();

  // 2. Lấy tất cả vé ghép đã thanh toán thành công trong ngày (vì vé ghép chưa lưu ở PaymentTransaction)
  const sharedTickets = await SharedTicket.find({
    payment_status: "paid",
    updatedAt: { $gte: start, $lte: end },
  })
    .populate({
      path: "shared_match_id",
      populate: {
        path: "booking_id",
        select: "branch_id",
      },
    })
    .lean();

  // 3. Lấy tất cả booking bị hủy có hoàn tiền trong ngày
  const cancelledBookings = await Booking.find({
    status: "cancelled",
    refund_status: "refunded",
    cancel_at: { $gte: start, $lte: end },
  }).lean();

  const cancelledBookingIds = cancelledBookings.map((b) => b._id);
  const paidBookingTxns = await PaymentTransaction.find({
    reference_type: "Booking",
    reference_id: { $in: cancelledBookingIds },
    status: "paid",
  }).select("reference_id").lean();

  const paidBookingIdsSet = new Set(paidBookingTxns.map((t) => t.reference_id.toString()));

  // 4. Lấy tất cả vé ghép bị hủy có hoàn tiền trong ngày
  const cancelledTickets = await SharedTicket.find({
    payment_status: "cancelled",
    updatedAt: { $gte: start, $lte: end },
  })
    .populate({
      path: "shared_match_id",
      populate: {
        path: "booking_id",
        select: "start_time branch_id",
      },
    })
    .lean();

  // Khởi tạo đối tượng gom nhóm doanh thu theo branch_id
  const branchRevenueMap = {};

  const getBranchData = (branchId) => {
    const idStr = branchId.toString();
    if (!branchRevenueMap[idStr]) {
      branchRevenueMap[idStr] = {
        branch_id: branchId,
        deposit_revenue: 0,
        pos_revenue: 0,
        total_revenue: 0,
      };
    }
    return branchRevenueMap[idStr];
  };

  // --- A. XỬ LÝ PAYMENT TRANSACTIONS ---
  for (const txn of transactions) {
    let branchId = null;

    if (txn.reference_type === "Booking") {
      const booking = await Booking.findById(txn.reference_id).select("branch_id").lean();
      if (booking) {
        branchId = booking.branch_id;
        if (branchId) {
          const data = getBranchData(branchId);
          data.deposit_revenue += txn.amount;
          data.total_revenue += txn.amount;
        }
      }
    } else if (txn.reference_type === "Order") {
      const order = await Order.findById(txn.reference_id).select("branch_id total_pos_fee").lean();
      if (order) {
        branchId = order.branch_id;
        if (branchId) {
          const data = getBranchData(branchId);
          data.pos_revenue += order.total_pos_fee || 0;
          data.total_revenue += txn.amount; // txn.amount là final_amount_due thực thu
        }
      }
    } else if (txn.reference_type === "TournamentParticipant") {
      // Phí giải đấu đóng góp vào tổng doanh thu của chi nhánh tổ chức giải
      const participant = await TournamentParticipant.findById(txn.reference_id)
        .populate({ path: "tournament_id", select: "branch_id" })
        .lean();
      if (participant && participant.tournament_id) {
        branchId = participant.tournament_id.branch_id;
        if (branchId) {
          const data = getBranchData(branchId);
          data.total_revenue += txn.amount;
        }
      }
    }
  }

  // --- B. XỬ LÝ SHARED TICKETS (THANH TOÁN THÀNH CÔNG) ---
  for (const ticket of sharedTickets) {
    if (ticket.shared_match_id && ticket.shared_match_id.booking_id) {
      const branchId = ticket.shared_match_id.booking_id.branch_id;
      if (branchId) {
        const data = getBranchData(branchId);
        const amount = ticket.paid_amount || ticket.ticket_price || 0;
        data.total_revenue += amount;
      }
    }
  }

  // --- C. XỬ LÝ HOÀN TIỀN BOOKING (GIẢM DOANH THU) ---
  for (const booking of cancelledBookings) {
    if (!paidBookingIdsSet.has(booking._id.toString())) {
      continue; // Bỏ qua nếu booking chưa từng được thanh toán cọc thành công
    }
    const branchId = booking.branch_id;
    if (branchId) {
      const data = getBranchData(branchId);
      // Tính lại số tiền hoàn dựa trên thời gian hủy
      const hoursUntilStart = (new Date(booking.start_time).getTime() - new Date(booking.cancel_at).getTime()) / (1000 * 60 * 60);
      let refundPercentage = 0;
      if (hoursUntilStart >= 6) {
        refundPercentage = 100;
      } else if (hoursUntilStart >= 3 && hoursUntilStart < 6) {
        refundPercentage = 70;
      }
      const refundAmount = Math.round((booking.deposit_amount * refundPercentage) / 100);

      if (refundAmount > 0) {
        data.deposit_revenue -= refundAmount;
        data.total_revenue -= refundAmount;
      }
    }
  }

  // --- D. XỬ LÝ HOÀN TIỀN VÉ GHÉP SHARED TICKETS (GIẢM DOANH THU) ---
  for (const ticket of cancelledTickets) {
    const paidAmount = ticket.paid_amount || 0;
    if (paidAmount <= 0) {
      continue; // Bỏ qua nếu vé chưa từng được thanh toán thành công
    }
    if (
      ticket.shared_match_id &&
      ticket.shared_match_id.booking_id &&
      ticket.shared_match_id.booking_id.branch_id
    ) {
      const branchId = ticket.shared_match_id.booking_id.branch_id;
      const data = getBranchData(branchId);
      
      const startTime = new Date(ticket.shared_match_id.booking_id.start_time);
      const cancelTime = new Date(ticket.updatedAt);
      const hoursUntilStart = (startTime.getTime() - cancelTime.getTime()) / (1000 * 60 * 60);

      let refundPercentage = 0;
      if (hoursUntilStart >= 5) {
        refundPercentage = 100;
      } else if (hoursUntilStart >= 2 && hoursUntilStart < 5) {
        refundPercentage = 50;
      }
      const refundAmount = Math.round((paidAmount * refundPercentage) / 100);

      if (refundAmount > 0) {
        data.total_revenue -= refundAmount;
      }
    }
  }

  // Đảm bảo không có doanh thu âm
  Object.values(branchRevenueMap).forEach((data) => {
    data.deposit_revenue = Math.max(0, data.deposit_revenue);
    data.pos_revenue = Math.max(0, data.pos_revenue);
    data.total_revenue = Math.max(0, data.total_revenue);
  });

  return Object.values(branchRevenueMap);
};

/**
 * Tổng hợp doanh thu cho một ngày cụ thể và lưu vào database
 * @param {string} dateStr Định dạng YYYY-MM-DD
 */
const aggregateAndSaveRevenue = async (dateStr) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const branchRevenues = await calculateRevenueForDate(dateStr);
    const activeBranches = await Branch.find({ is_deleted: false }).select("_id").lean();
    const activeBranchIds = activeBranches.map((b) => b._id.toString());

    // Cập nhật doanh thu cho các chi nhánh có giao dịch phát sinh
    for (const revenueData of branchRevenues) {
      const branchIdStr = revenueData.branch_id.toString();

      await RevenueByDay.findOneAndUpdate(
        { date: dateStr, branch_id: revenueData.branch_id },
        {
          $set: {
            deposit_revenue: revenueData.deposit_revenue,
            pos_revenue: revenueData.pos_revenue,
            total_revenue: revenueData.total_revenue,
            is_deleted: false,
          },
        },
        { upsert: true, returnDocument: "after", session }
      );

      // Loại khỏi danh sách chi nhánh trống
      const index = activeBranchIds.indexOf(branchIdStr);
      if (index > -1) {
        activeBranchIds.splice(index, 1);
      }
    }

    // Đối với các chi nhánh không phát sinh giao dịch nào trong ngày, set doanh thu = 0
    for (const branchId of activeBranchIds) {
      await RevenueByDay.findOneAndUpdate(
        { date: dateStr, branch_id: branchId },
        {
          $set: {
            deposit_revenue: 0,
            pos_revenue: 0,
            total_revenue: 0,
            is_deleted: false,
          },
        },
        { upsert: true, returnDocument: "after", session }
      );
    }

    await session.commitTransaction();
    console.log(`[ReportService] Đã tổng hợp và lưu doanh thu thành công cho ngày: ${dateStr}`);
    return true;
  } catch (error) {
    await session.abortTransaction();
    console.error(`[ReportService] Lỗi khi tổng hợp doanh thu ngày ${dateStr}:`, error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Lấy báo cáo doanh thu hàng ngày trong khoảng thời gian
 */
const getDailyRevenue = async (query, user) => {
  const { branch_id, startDate, endDate } = query;

  // Phân quyền cho Staff: Chỉ được xem chi nhánh của mình
  let targetBranchId = branch_id;
  if (user.role === "staff") {
    if (!user.branch_id) {
      const error = new Error("Tài khoản nhân viên chưa được gán chi nhánh");
      error.status = 403;
      throw error;
    }
    targetBranchId = user.branch_id.toString();
  }

  // Lấy danh sách các ngày YYYY-MM-DD trong khoảng
  const dateList = [];
  let currentDate = new Date(`${startDate}T00:00:00+07:00`);
  const endLimitDate = new Date(`${endDate}T00:00:00+07:00`);

  while (currentDate <= endLimitDate) {
    const formatted = format(currentDate, "yyyy-MM-dd", { timeZone: TIMEZONE });
    dateList.push(formatted);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const todayStr = format(toZonedTime(new Date(), TIMEZONE), "yyyy-MM-dd", { timeZone: TIMEZONE });
  const results = [];

  // Xác định các chi nhánh cần truy vấn báo cáo
  let branchesToQuery = [];
  if (targetBranchId) {
    branchesToQuery.push(targetBranchId);
  } else {
    const activeBranches = await Branch.find({ is_deleted: false }).select("_id").lean();
    branchesToQuery = activeBranches.map((b) => b._id.toString());
  }

  // Lấy tất cả bản ghi hiện có trong database để tránh N+1 query
  const existingRecords = await RevenueByDay.find({
    date: { $in: dateList },
    branch_id: { $in: branchesToQuery },
    is_deleted: false,
  }).lean();

  const recordMap = {};
  existingRecords.forEach((rec) => {
    const key = `${rec.branch_id.toString()}_${rec.date}`;
    recordMap[key] = rec;
  });

  for (const bId of branchesToQuery) {
    for (const dateStr of dateList) {
      let record = null;
      const key = `${bId}_${dateStr}`;

      if (dateStr === todayStr) {
        // Hôm nay: Tính toán động real-time
        const liveRevenues = await calculateRevenueForDate(dateStr);
        const liveBranchData = liveRevenues.find((r) => r.branch_id.toString() === bId);
        record = {
          date: dateStr,
          branch_id: bId,
          total_revenue: liveBranchData ? liveBranchData.total_revenue : 0,
          deposit_revenue: liveBranchData ? liveBranchData.deposit_revenue : 0,
          pos_revenue: liveBranchData ? liveBranchData.pos_revenue : 0,
        };
      } else {
        // Ngày cũ: Lấy từ map đã cache
        record = recordMap[key];

        // Nếu ngày cũ chưa được tổng hợp trong database, tiến hành tổng hợp và lưu động
        if (!record) {
          await aggregateAndSaveRevenue(dateStr);

          // Sau khi tổng hợp, truy vấn lại các bản ghi mới tạo của ngày đó để cập nhật vào map
          const newRecords = await RevenueByDay.find({
            date: dateStr,
            branch_id: { $in: branchesToQuery },
            is_deleted: false,
          }).lean();

          newRecords.forEach((rec) => {
            const newKey = `${rec.branch_id.toString()}_${rec.date}`;
            recordMap[newKey] = rec;
          });

          record = recordMap[key] || {
            date: dateStr,
            branch_id: bId,
            total_revenue: 0,
            deposit_revenue: 0,
            pos_revenue: 0,
          };
        }
      }

      results.push({
        _id: record._id || `calc_${bId}_${dateStr}`,
        date: record.date,
        branch_id: record.branch_id,
        total_revenue: record.total_revenue || 0,
        deposit_revenue: record.deposit_revenue || 0,
        pos_revenue: record.pos_revenue || 0,
      });
    }
  }

  // Sắp xếp kết quả theo ngày giảm dần như tài liệu yêu cầu
  return results.sort((a, b) => b.date.localeCompare(a.date));
};

/**
 * Lấy báo cáo tổng quan Dashboard
 */
const getDashboardAnalytics = async (query, user) => {
  const { branch_id, date } = query;

  // Mặc định là ngày hôm nay
  const todayStr = format(toZonedTime(new Date(), TIMEZONE), "yyyy-MM-dd", { timeZone: TIMEZONE });
  const dateStr = date || todayStr;

  const start = new Date(`${dateStr}T00:00:00+07:00`);
  const end = new Date(`${dateStr}T23:59:59.999+07:00`);

  // Phân quyền cho Staff: Chỉ được xem của chi nhánh mình
  let targetBranchId = branch_id;
  if (user.role === "staff") {
    if (!user.branch_id) {
      const error = new Error("Tài khoản nhân viên chưa được gán chi nhánh");
      error.status = 403;
      throw error;
    }
    targetBranchId = user.branch_id.toString();
  }

  // 1. Số người dùng mới đăng ký hôm nay (global hoặc filter nếu có nhu cầu, hiện tại là global)
  const newUsersCount = await User.countDocuments({
    createdAt: { $gte: start, $lte: end },
    is_deleted: false,
    role: "customer",
  });

  // 2. Trạng thái bookings hôm nay
  const bookingFilter = {
    start_time: { $gte: start, $lte: end },
    is_deleted: false,
  };
  if (targetBranchId) {
    bookingFilter.branch_id = targetBranchId;
  }

  const bookings = await Booking.find(bookingFilter).select("status start_time end_time").lean();

  const bookingsByStatus = {
    completed: 0,
    playing: 0,
    deposited: 0,
    cancelled: 0,
  };

  bookings.forEach((b) => {
    if (bookingsByStatus[b.status] !== undefined) {
      bookingsByStatus[b.status]++;
    }
  });

  // 3. Tổng số trận đấu hôm nay (chỉ tính các booking đã đóng phí và đang chơi/hoàn thành)
  const totalMatchesToday = bookingsByStatus.completed + bookingsByStatus.playing + bookingsByStatus.deposited;

  // 4. Tổng doanh thu trong ngày
  let totalRevenueToday = 0;
  if (dateStr === todayStr) {
    const liveRevenues = await calculateRevenueForDate(dateStr);
    if (targetBranchId) {
      const branchData = liveRevenues.find((r) => r.branch_id.toString() === targetBranchId);
      totalRevenueToday = branchData ? branchData.total_revenue : 0;
    } else {
      totalRevenueToday = liveRevenues.reduce((sum, r) => sum + r.total_revenue, 0);
    }
  } else {
    const query = { date: dateStr, is_deleted: false };
    if (targetBranchId) {
      query.branch_id = targetBranchId;
    }
    let records = await RevenueByDay.find(query).lean();

    // Nếu ngày cũ chưa có bản ghi, tiến hành tổng hợp động và lưu vào database
    if (records.length === 0) {
      await aggregateAndSaveRevenue(dateStr);
      records = await RevenueByDay.find(query).lean();
    }

    totalRevenueToday = records.reduce((sum, r) => sum + r.total_revenue, 0);
  }

  // 5. Tỷ lệ lấp đầy sân (occupancy_rate_percentage)
  const courtQuery = { is_deleted: false, status: "active" };
  if (targetBranchId) {
    courtQuery.branch_id = targetBranchId;
  }
  const activeCourts = await Court.find(courtQuery).populate("branch_id", "open_time close_time").lean();

  let totalAvailableHours = 0;
  activeCourts.forEach((court) => {
    const branch = court.branch_id;
    let openH = 6, openM = 0;
    let closeH = 22, closeM = 0;

    if (branch && branch.open_time && branch.close_time) {
      const [oH, oM] = branch.open_time.split(":").map(Number);
      const [cH, cM] = branch.close_time.split(":").map(Number);
      openH = oH; openM = oM;
      closeH = cH; closeM = cM;
    }

    const availableHours = (closeH * 60 + closeM - (openH * 60 + openM)) / 60;
    totalAvailableHours += Math.max(0, availableHours);
  });

  let totalBookedHours = 0;
  bookings.forEach((b) => {
    if (["completed", "playing", "deposited"].includes(b.status)) {
      const durationHours = (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / (1000 * 60 * 60);
      totalBookedHours += Math.max(0, durationHours);
    }
  });

  let occupancyRate = 0;
  if (totalAvailableHours > 0) {
    occupancyRate = (totalBookedHours / totalAvailableHours) * 100;
  }
  occupancyRate = Math.min(100, Math.round(occupancyRate * 10) / 10);

  return {
    summary: {
      total_matches_today: totalMatchesToday,
      new_users_today: newUsersCount,
      occupancy_rate_percentage: occupancyRate,
      total_revenue_today: totalRevenueToday,
    },
    bookings_by_status: bookingsByStatus,
  };
};

/**
 * Lấy danh sách giao dịch chi tiết phục vụ cho Drill-down dòng tiền
 */
const getTransactions = async (query, user) => {
  const { startDate, endDate, branch_id, payment_method } = query;

  // 1. Phân quyền: Nhân viên (staff) chỉ xem giao dịch chi nhánh của mình
  let targetBranchId = branch_id;
  if (user.role === "staff") {
    if (!user.branch_id) {
      const error = new Error("Tài khoản nhân viên chưa được gán chi nhánh");
      error.status = 403;
      throw error;
    }
    targetBranchId = user.branch_id.toString();
  }

  // 2. Chuyển đổi khoảng ngày sang mốc thời gian VN (GMT+7)
  const startBound = new Date(`${startDate}T00:00:00+07:00`);
  const endBound = new Date(`${endDate}T23:59:59.999+07:00`);

  // 3. Khởi tạo bộ lọc tìm kiếm
  const filter = {
    status: "paid", // Chỉ xem các giao dịch đã hoàn thành thanh toán
    updatedAt: { $gte: startBound, $lte: endBound },
    is_deleted: { $ne: true },
  };

  // Lọc theo phương thức thanh toán
  if (payment_method) {
    if (payment_method === "transfer") {
      filter.payment_method = { $in: ["transfer", "vnpay", "momo"] };
    } else {
      filter.payment_method = payment_method;
    }
  }

  // 4. Tìm danh sách giao dịch
  const transactions = await PaymentTransaction.find(filter)
    .sort({ updatedAt: -1 })
    .lean();

  const populatedTransactions = [];

  // 5. Duyệt qua từng giao dịch để populate thông tin và lọc theo chi nhánh
  for (const txn of transactions) {
    let populatedTxn = { ...txn };
    let matchBranch = true;

    if (txn.reference_type === "Booking") {
      const booking = await Booking.findById(txn.reference_id)
        .populate("user_id", "full_name email phone")
        .populate("court_id", "name")
        .populate("branch_id", "name")
        .lean();

      if (booking) {
        if (booking.user_id) {
          booking.user_id.name = booking.user_id.full_name;
        }
        // Kiểm tra trùng khớp chi nhánh
        if (targetBranchId && booking.branch_id?._id?.toString() !== targetBranchId) {
          matchBranch = false;
        }
        populatedTxn.reference_details = booking;
        populatedTxn.branch = booking.branch_id;
        populatedTxn.customer = booking.user_id;
        populatedTxn.court = booking.court_id;
        populatedTxn.summary = `Thanh toán cọc sân: Sân ${booking.court_id?.name || ""} (${booking.branch_id?.name || ""})`;
        
        // Tìm hóa đơn liên quan để đối soát thanh toán cuối
        const relatedOrder = await Order.findOne({ booking_id: booking._id, is_deleted: false }).lean();
        
        // Truy vấn tất cả giao dịch liên quan
        const referenceIds = [booking._id];
        if (relatedOrder) {
          referenceIds.push(relatedOrder._id);
        }
        
        const relatedTxns = await PaymentTransaction.find({
          reference_id: { $in: referenceIds },
          status: "paid",
          is_deleted: { $ne: true }
        }).sort({ updatedAt: 1 }).lean();

        populatedTxn.breakdown = {
          total_bill: booking.total_court_price || 0,
          deposit_paid: booking.deposit_amount || 0,
          remaining_due: Math.max(0, (booking.total_court_price || 0) - (booking.deposit_amount || 0)),
          is_fully_paid: relatedOrder ? relatedOrder.payment_status === "fully_paid" : false,
          payment_status: relatedOrder ? relatedOrder.payment_status : "deposit_paid",
        };

        populatedTxn.payment_history = relatedTxns.map((t) => ({
          _id: t._id,
          amount: t.amount,
          payment_method: t.payment_method,
          paid_at: t.updatedAt,
          type: t.reference_type === "Booking" ? "Đặt cọc" : "Thanh toán cuối/POS",
        }));
      } else {
        matchBranch = false;
      }
    } else if (txn.reference_type === "Order") {
      const order = await Order.findById(txn.reference_id)
        .populate("user_id", "full_name email phone")
        .populate("branch_id", "name")
        .populate("booking_id")
        .lean();

      if (order) {
        if (order.user_id) {
          order.user_id.name = order.user_id.full_name;
        }
        if (targetBranchId && order.branch_id?._id?.toString() !== targetBranchId) {
          matchBranch = false;
        }
        populatedTxn.reference_details = order;
        populatedTxn.branch = order.branch_id;
        populatedTxn.customer = order.user_id;
        populatedTxn.summary = `Thanh toán hóa đơn POS & Thu nốt: Chi nhánh ${order.branch_id?.name || ""}`;
        
        // Tìm các giao dịch liên quan qua booking_id
        const referenceIds = [order._id];
        if (order.booking_id) {
          referenceIds.push(order.booking_id._id || order.booking_id);
        }

        const relatedTxns = await PaymentTransaction.find({
          reference_id: { $in: referenceIds },
          status: "paid",
          is_deleted: { $ne: true }
        }).sort({ updatedAt: 1 }).lean();

        populatedTxn.breakdown = {
          total_bill: (order.total_court_fee || 0) + (order.total_pos_fee || 0),
          deposit_paid: order.deposit_paid || 0,
          remaining_due: order.final_amount_due || 0,
          is_fully_paid: order.payment_status === "fully_paid",
          payment_status: order.payment_status,
        };

        populatedTxn.payment_history = relatedTxns.map((t) => ({
          _id: t._id,
          amount: t.amount,
          payment_method: t.payment_method,
          paid_at: t.updatedAt,
          type: t.reference_type === "Booking" ? "Đặt cọc" : "Thanh toán cuối/POS",
        }));
      } else {
        matchBranch = false;
      }
    } else if (txn.reference_type === "TournamentParticipant") {
      const participant = await TournamentParticipant.findById(txn.reference_id)
        .populate("user_id", "full_name email phone")
        .populate({
          path: "tournament_id",
          populate: { path: "branch_id", select: "name" },
        })
        .lean();

      if (participant && participant.tournament_id) {
        if (participant.user_id) {
          participant.user_id.name = participant.user_id.full_name;
        }
        const branch = participant.tournament_id.branch_id;
        if (targetBranchId && branch?._id?.toString() !== targetBranchId) {
          matchBranch = false;
        }
        populatedTxn.reference_details = participant;
        populatedTxn.branch = branch;
        populatedTxn.customer = participant.user_id;
        populatedTxn.summary = `Phí tham gia giải đấu: ${participant.tournament_id?.name || ""}`;
        populatedTxn.breakdown = {
          total_bill: txn.amount,
          deposit_paid: txn.amount,
          remaining_due: 0,
        };
      } else {
        matchBranch = false;
      }
    } else {
      if (targetBranchId) {
        matchBranch = false;
      }
    }

    // Mock thông tin người trực ca / thu ngân thực hiện giao dịch (do db chưa lưu cashier_id)
    populatedTxn.cashier = {
      name: txn.payment_method === "cash" ? "Thu ngân tại quầy" : "Hệ thống Cổng thanh toán",
      role: txn.payment_method === "cash" ? "Staff" : "System Gate",
    };

    if (matchBranch) {
      populatedTransactions.push(populatedTxn);
    }
  }

  return populatedTransactions;
};

module.exports = {
  calculateRevenueForDate,
  aggregateAndSaveRevenue,
  getDailyRevenue,
  getDashboardAnalytics,
  getTransactions,
};
