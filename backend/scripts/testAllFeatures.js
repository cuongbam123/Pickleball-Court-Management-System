require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const connectDB = require("../src/config/db");
const app = require("../src/app");

const User = require("../src/models/users");
const Branch = require("../src/models/branches");
const Court = require("../src/models/court");
const PricingRule = require("../src/models/pricing_rules");
const Booking = require("../src/models/bookings");
const Order = require("../src/models/orders");
const Product = require("../src/models/products");
const SharedMatch = require("../src/models/sharedMatch");
const SharedTicket = require("../src/models/sharedTicket");
const Tournament = require("../src/models/tournaments");
const TournamentParticipant = require("../src/models/tournamentParticipants");

const PORT = 8089;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server;
let adminToken = "";
let customerToken = "";
let customerId = "";
let branchId = "";
let courtId = "";
let pricingRuleId = "";
let bookingId = "";
let orderId = "";
let productId = "";
let sharedMatchId = "";
let sharedTicketId = "";
let tournamentId = "";
let participantId = "";

const request = async (method, path, body = null, token = null) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);
  const status = res.status;
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    // If not json
  }

  return { status, data };
};

const runTests = async () => {
  try {
    console.log("=== STARTING INTEGRATION TESTS FOR ALL FEATURES ===");

    // 1. Connect DB and seed Admin
    await connectDB();
    console.log("Connected to database.");

    // Seed Admin
    const bcrypt = require("bcrypt");
    const adminPasswordHash = await bcrypt.hash("Password123!", 10);
    let adminUser = await User.findOne({ email: "admin_test@example.com" });
    if (!adminUser) {
      adminUser = await User.create({
        email: "admin_test@example.com",
        password: adminPasswordHash,
        full_name: "Test Admin",
        role: "admin",
        auth_provider: "local",
      });
    } else {
      adminUser.role = "admin";
      await adminUser.save();
    }
    console.log("Admin seeded:", adminUser.email);

    // 2. Start HTTP Server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Server listening on port ${PORT}`);

    // ==========================================
    // 1. AUTHENTICATION & USERS (Part 1)
    // ==========================================
    console.log("\n--- Testing 1. Authentication & Users ---");

    // POST /api/v1/auth/register (Customer)
    const customerEmail = `customer_${Date.now()}@example.com`;
    const regRes = await request("POST", "/auth/register", {
      email: customerEmail,
      password: "Password123!",
      full_name: "Customer Test",
    });
    console.log(`POST /auth/register: status ${regRes.status}`, regRes.data);
    if (regRes.status !== 201) throw new Error("Register failed");

    // POST /api/v1/auth/login (Customer)
    const custLoginRes = await request("POST", "/auth/login", {
      email: customerEmail,
      password: "Password123!",
    });
    console.log(`POST /auth/login (Customer): status ${custLoginRes.status}`);
    if (custLoginRes.status !== 200) throw new Error("Customer login failed");
    customerToken = custLoginRes.data.data.access_token;
    customerId = custLoginRes.data.data.user?._id || custLoginRes.data.data.user?.id;

    // POST /api/v1/auth/login (Admin)
    const adminLoginRes = await request("POST", "/auth/login", {
      email: "admin_test@example.com",
      password: "Password123!",
    });
    console.log(`POST /auth/login (Admin): status ${adminLoginRes.status}`);
    if (adminLoginRes.status !== 200) throw new Error("Admin login failed");
    adminToken = adminLoginRes.data.data.access_token;

    // GET /api/v1/users/me (Customer)
    const getMeRes = await request("GET", "/users/me", null, customerToken);
    console.log(`GET /users/me: status ${getMeRes.status}`, getMeRes.data);
    if (getMeRes.status !== 200) throw new Error("GET /users/me failed");

    // PUT /api/v1/users/me (Customer)
    const updateMeRes = await request("PUT", "/users/me", { full_name: "Customer Test Updated" }, customerToken);
    console.log(`PUT /users/me: status ${updateMeRes.status}`, updateMeRes.data);
    if (updateMeRes.status !== 200) throw new Error("PUT /users/me failed");

    // GET /api/v1/users (Admin)
    const getUsersRes = await request("GET", "/users", null, adminToken);
    console.log(`GET /users: status ${getUsersRes.status}`);
    if (getUsersRes.status !== 200) throw new Error("GET /users failed");

    // GET /api/v1/users/{id} (Admin)
    const getUserByIdRes = await request("GET", `/users/${customerId}`, null, adminToken);
    console.log(`GET /users/:id: status ${getUserByIdRes.status}`);
    if (getUserByIdRes.status !== 200) throw new Error("GET /users/:id failed");

    // ==========================================
    // 2. BRANCHES & COURTS
    // ==========================================
    console.log("\n--- Testing 2. Branches & Courts ---");

    // POST /api/v1/branches (Admin)
    const branchName = "Cơ sở test " + Date.now();
    const branchRes = await request("POST", "/branches", {
      name: branchName,
      address: "Hà Nội",
      hotline: "0123456789",
      open_time: "06:00",
      close_time: "22:00",
    }, adminToken);
    console.log(`POST /branches: status ${branchRes.status}`, branchRes.data);
    if (branchRes.status !== 201) throw new Error("Create branch failed");
    branchId = branchRes.data.data._id || branchRes.data.data.id;

    // GET /api/v1/branches
    const getBranchesRes = await request("GET", "/branches");
    console.log(`GET /branches: status ${getBranchesRes.status}`);

    // GET /api/v1/branches/{id}
    const getBranchByIdRes = await request("GET", `/branches/${branchId}`);
    console.log(`GET /branches/:id: status ${getBranchByIdRes.status}`);

    // PUT /api/v1/branches/{id}
    const putBranchRes = await request("PUT", `/branches/${branchId}`, {
      name: "Cơ sở test 1 Updated",
      address: "Hà Nội",
      hotline: "0999999999",
      open_time: "07:00",
      close_time: "23:00",
    }, adminToken);
    console.log(`PUT /branches/:id: status ${putBranchRes.status}`);

    // POST /api/v1/branches/{branchId}/courts (Admin)
    const courtRes = await request("POST", `/branches/${branchId}/courts`, {
      name: "Sân 1",
      type: "2-player",
    }, adminToken);
    console.log(`POST /branches/:branchId/courts: status ${courtRes.status}`, courtRes.data);
    if (courtRes.status !== 201) throw new Error("Create court failed");
    courtId = courtRes.data.data._id || courtRes.data.data.id;

    // GET /api/v1/branches/{branchId}/courts
    const getCourtsRes = await request("GET", `/branches/${branchId}/courts`);
    console.log(`GET /branches/:branchId/courts: status ${getCourtsRes.status}`);

    // GET /api/v1/courts/{id}
    const getCourtByIdRes = await request("GET", `/courts/${courtId}`);
    console.log(`GET /courts/:id: status ${getCourtByIdRes.status}`);

    // PUT /api/v1/courts/{id}
    const putCourtRes = await request("PUT", `/courts/${courtId}`, {
      name: "Sân 1 VIP",
      type: "4-player",
    }, adminToken);
    console.log(`PUT /courts/:id: status ${putCourtRes.status}`);

    // PATCH /api/v1/courts/{id}/status
    const patchCourtStatusRes = await request("PATCH", `/courts/${courtId}/status`, {
      status: "maintenance",
    }, adminToken);
    console.log(`PATCH /courts/:id/status: status ${patchCourtStatusRes.status}`);
    // Change back to active
    await Court.findByIdAndUpdate(courtId, { status: "active" });

    // PATCH /api/v1/courts/{id}/tag-status
    const patchCourtTagRes = await request("PATCH", `/courts/${courtId}/tag-status`, {
      tagStatus: "available",
    }, adminToken);
    console.log(`PATCH /courts/:id/tag-status: status ${patchCourtTagRes.status}`);

    // ==========================================
    // 1. AUTHENTICATION & USERS (Part 2 — Now that branch is ready)
    // ==========================================
    console.log("\n--- Testing 1. Users (Part 2) ---");

    // PUT /api/v1/users/{id} (Admin change role)
    const updateUserRes = await request("PUT", `/users/${customerId}`, { role: "staff", branch_id: branchId }, adminToken);
    console.log(`PUT /users/:id: status ${updateUserRes.status}`, updateUserRes.data);
    if (updateUserRes.status !== 200) throw new Error("PUT /users/:id failed");

    // Change back to customer for testing
    await User.findByIdAndUpdate(customerId, { role: "customer" });

    // PATCH /api/v1/users/{id}/rank
    const updateRankRes = await request("PATCH", `/users/${customerId}/rank`, { skill_rank: "C", elo_score: 1100 }, adminToken);
    console.log(`PATCH /users/:id/rank: status ${updateRankRes.status}`, updateRankRes.data);
    if (updateRankRes.status !== 200) throw new Error("PATCH /users/:id/rank failed");

    // ==========================================
    // 3. PRICING RULES
    // ==========================================
    console.log("\n--- Testing 3. Pricing Rules ---");

    // POST /api/v1/pricing-rules (Admin)
    const pricingRes = await request("POST", "/pricing-rules", {
      branch_id: branchId,
      court_type: "all",
      day_type: "weekday",
      time_type: "golden",
      start_time: "00:00",
      end_time: "23:59",
      price_per_hour: 120000,
    }, adminToken);
    console.log(`POST /pricing-rules: status ${pricingRes.status}`, pricingRes.data);
    if (pricingRes.status !== 201) throw new Error("Create pricing rule failed");
    pricingRuleId = pricingRes.data.data._id || pricingRes.data.data.id;

    // GET /api/v1/pricing-rules
    const getPricingRes = await request("GET", `/pricing-rules?branch_id=${branchId}`);
    console.log(`GET /pricing-rules: status ${getPricingRes.status}`);

    // GET /api/v1/pricing-rules/{id}
    const getPricingDetailRes = await request("GET", `/pricing-rules/${pricingRuleId}`);
    console.log(`GET /pricing-rules/:id: status ${getPricingDetailRes.status}`);

    // PUT /api/v1/pricing-rules/{id}
    const putPricingRes = await request("PUT", `/pricing-rules/${pricingRuleId}`, {
      price_per_hour: 130000,
    }, adminToken);
    console.log(`PUT /pricing-rules/:id: status ${putPricingRes.status}`);

    // ==========================================
    // 4. BOOKINGS
    // ==========================================
    console.log("\n--- Testing 4. Bookings ---");

    // GET /api/v1/bookings/avaliable
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const availRes = await request("GET", `/bookings/avaliable?court_id=${courtId}&date=${tomorrow}`, null, customerToken);
    console.log(`GET /bookings/avaliable: status ${availRes.status}`);

    // POST /api/v1/bookings/hold
    const startTimeIso = new Date(tomorrow + "T08:00:00.000Z").toISOString();
    const endTimeIso = new Date(tomorrow + "T10:00:00.000Z").toISOString();
    const holdRes = await request("POST", "/bookings/hold", {
      court_id: courtId,
      branch_id: branchId,
      start_time: startTimeIso,
      end_time: endTimeIso,
      buffer_time: 10,
    }, customerToken);
    console.log(`POST /bookings/hold: status ${holdRes.status}`, holdRes.data);
    if (holdRes.status !== 201) throw new Error("Hold booking failed");
    bookingId = holdRes.data.data.booking_id;

    // GET /api/v1/bookings
    const getBookingsRes = await request("GET", `/bookings?branch_id=${branchId}`, null, customerToken);
    console.log(`GET /bookings: status ${getBookingsRes.status}`);

    // GET /api/v1/bookings/{id}
    const getBookingDetailRes = await request("GET", `/bookings/${bookingId}`, null, customerToken);
    console.log(`GET /bookings/:id: status ${getBookingDetailRes.status}`);

    // POST /api/v1/bookings/{id}/pay-deposit
    const payDepRes = await request("POST", `/bookings/${bookingId}/pay-deposit`, {
      payment_method: "vnpay",
      redirect_url: "http://localhost:5173/payment-success",
    }, customerToken);
    console.log(`POST /bookings/:id/pay-deposit: status ${payDepRes.status}`, payDepRes.data);

    // ==========================================
    // 5. ORDERS & PAYMENTS
    // ==========================================
    console.log("\n--- Testing 5. Orders & Payments ---");

    // Fetch order generated by booking hold
    let orderDoc = await Order.findOne({ booking_id: new mongoose.Types.ObjectId(bookingId) });
    if (!orderDoc) {
      orderDoc = await Order.create({
        booking_id: new mongoose.Types.ObjectId(bookingId),
        user_id: new mongoose.Types.ObjectId(customerId),
        branch_id: new mongoose.Types.ObjectId(branchId),
        total_court_fee: 260000,
        total_pos_fee: 0,
        deposit_paid: 0,
        final_amount_due: 260000,
        payment_status: "pending_deposit",
      });
      console.log("Mock Order created in DB for testing POS:", orderDoc._id);
    }
    orderId = orderDoc._id.toString();
    console.log("Order generated:", orderId);

    if (orderId) {
      // GET /api/v1/orders
      const getOrdersRes = await request("GET", "/orders", null, adminToken);
      console.log(`GET /orders: status ${getOrdersRes.status}`);

      // GET /api/v1/orders/{id}
      const getOrderDetailRes = await request("GET", `/orders/${orderId}`, null, customerToken);
      console.log(`GET /orders/:id: status ${getOrderDetailRes.status}`);

      // POST /api/v1/orders/{id}/pay-deposit
      const orderPayDepRes = await request("POST", `/orders/${orderId}/pay-deposit`, {
        payment_method: "vnpay",
        redirect_url: "http://localhost:5173/payment-success",
      }, customerToken);
      console.log(`POST /orders/:id/pay-deposit: status ${orderPayDepRes.status}`);
    }

    // ==========================================
    // 6. POS & INVENTORY
    // ==========================================
    console.log("\n--- Testing 6. POS & Inventory ---");

    // POST /api/v1/products (Admin)
    const productName = "Nước suối Aquafina " + Date.now();
    const productRes = await request("POST", "/products", {
      name: productName,
      price: 15000,
      branch_id: branchId,
      stock: 50,
      type: "drink",
    }, adminToken);
    console.log(`POST /products: status ${productRes.status}`, productRes.data);
    if (productRes.status !== 201) throw new Error("Create product failed");
    productId = productRes.data.data._id || productRes.data.data.id;

    // GET /api/v1/products
    const getProductsRes = await request("GET", `/products?branch_id=${branchId}`, null, adminToken);
    console.log(`GET /products: status ${getProductsRes.status}`);

    // GET /api/v1/products/{id}
    const getProductDetailRes = await request("GET", `/products/${productId}`, null, adminToken);
    console.log(`GET /products/:id: status ${getProductDetailRes.status}`);

    // PUT /api/v1/products/{id}
    const putProductRes = await request("PUT", `/products/${productId}`, {
      price: 16000,
    }, adminToken);
    console.log(`PUT /products/:id: status ${putProductRes.status}`);

    // POST /api/v1/products/{id}/adjust-stock
    const adjustStockRes = await request("POST", `/products/${productId}/adjust-stock`, {
      change_amount: 10,
      reason: "restock",
      note: "Nhập thêm nước suối",
    }, adminToken);
    console.log(`POST /products/:id/adjust-stock: status ${adjustStockRes.status}`, adjustStockRes.data);

    if (orderId) {
      // POST /api/v1/orders/{orderId}/pos-items
      const addPosRes = await request("POST", `/orders/${orderId}/pos-items`, {
        items: [{ product_id: productId, quantity: 2 }],
      }, adminToken);
      console.log(`POST /orders/:id/pos-items: status ${addPosRes.status}`, addPosRes.data);

      // PATCH /api/v1/orders/{orderId}/pos-items
      const patchPosRes = await request("PATCH", `/orders/${orderId}/pos-items`, {
        product_id: productId,
        quantity: 3,
      }, adminToken);
      console.log(`PATCH /orders/:id/pos-items: status ${patchPosRes.status}`);
    }

    // ==========================================
    // 7. SHARED MATCHES
    // ==========================================
    console.log("\n--- Testing 7. Shared Matches ---");

    // POST /api/v1/shared-matches (Admin)
    const sharedRes = await request("POST", "/shared-matches", {
      court_id: courtId,
      branch_id: branchId,
      start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
      ticket_price: 30000,
      max_slots: 6,
    }, adminToken);
    console.log(`POST /shared-matches: status ${sharedRes.status}`, sharedRes.data);
    if (sharedRes.status !== 201) throw new Error("Create shared match failed");
    sharedMatchId = sharedRes.data.data.shared_match_id;

    // GET /api/v1/shared-matches
    const getSharedMatchesRes = await request("GET", "/shared-matches");
    console.log(`GET /shared-matches: status ${getSharedMatchesRes.status}`);

    // GET /api/v1/shared-matches/{id}
    const getSharedMatchDetailRes = await request("GET", `/shared-matches/${sharedMatchId}`);
    console.log(`GET /shared-matches/:id: status ${getSharedMatchDetailRes.status}`);

    // PUT /api/v1/shared-matches/{id}
    const putSharedMatchRes = await request("PUT", `/shared-matches/${sharedMatchId}`, {
      ticket_price: 35000,
      max_slots: 8,
    }, adminToken);
    console.log(`PUT /shared-matches/:id: status ${putSharedMatchRes.status}`);

    // POST /api/v1/shared-matches/{id}/tickets (Customer buy)
    const buyTicketRes = await request("POST", `/shared-matches/${sharedMatchId}/tickets`, {
      payment_method: "vnpay",
      redirect_url: "http://localhost:5173/payment-success"
    }, customerToken);
    console.log(`POST /shared-matches/:id/tickets: status ${buyTicketRes.status}`, buyTicketRes.data);
    if (buyTicketRes.status === 201 || buyTicketRes.status === 200) {
      sharedTicketId = buyTicketRes.data.data.ticket?._id || buyTicketRes.data.data.ticket?.id || buyTicketRes.data.data._id || buyTicketRes.data.data.id;
    }

    if (sharedTicketId) {
      // GET /api/v1/shared-matches/{id}/tickets
      const getTicketsRes = await request("GET", `/shared-matches/${sharedMatchId}/tickets`, null, customerToken);
      console.log(`GET /shared-matches/:id/tickets: status ${getTicketsRes.status}`);

      // DELETE /api/v1/shared-tickets/{id}
      const cancelTicketRes = await request("DELETE", `/shared-matches/tickets/${sharedTicketId}`, null, customerToken);
      console.log(`DELETE /shared-matches/tickets/:id: status ${cancelTicketRes.status}`);
    }

    // ==========================================
    // 8. TOURNAMENTS
    // ==========================================
    console.log("\n--- Testing 8. Tournaments ---");

    // POST /api/v1/tournaments (Admin)
    const tournamentName = "Pickleball Open Cup " + Date.now();
    const tournamentRes = await request("POST", "/tournaments", {
      name: tournamentName,
      required_rank: "C",
      entry_fee: 100000,
      max_participants: 16,
      start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      start_day_ongoing: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      branch_id: branchId,
    }, adminToken);
    console.log(`POST /tournaments: status ${tournamentRes.status}`, tournamentRes.data);
    if (tournamentRes.status !== 201) throw new Error("Create tournament failed");
    tournamentId = tournamentRes.data.data._id || tournamentRes.data.data.id;

    // GET /api/v1/tournaments
    const getTournamentsRes = await request("GET", "/tournaments");
    console.log(`GET /tournaments: status ${getTournamentsRes.status}`);

    // GET /api/v1/tournaments/{id}
    const getTournamentDetailRes = await request("GET", `/tournaments/${tournamentId}`);
    console.log(`GET /tournaments/:id: status ${getTournamentDetailRes.status}`);

    // PUT /api/v1/tournaments/{id}
    const putTournamentRes = await request("PUT", `/tournaments/${tournamentId}`, {
      max_participants: 32,
    }, adminToken);
    console.log(`PUT /tournaments/:id: status ${putTournamentRes.status}`);

    // POST /api/v1/tournaments/{id}/participants (Customer)
    const registerTournamentRes = await request("POST", `/tournaments/${tournamentId}/participants`, null, customerToken);
    console.log(`POST /tournaments/:id/participants (Customer): status ${registerTournamentRes.status}`, registerTournamentRes.data);

    // ==========================================
    // 9. REPORTS & AUDITS
    // ==========================================
    console.log("\n--- Testing 9. Reports & Audits ---");

    // GET /api/v1/reports/daily-revenue
    const reportDailyRes = await request("GET", `/reports/daily-revenue?startDate=${tomorrow}&endDate=${tomorrow}`, null, adminToken);
    console.log(`GET /reports/daily-revenue: status ${reportDailyRes.status}`);

    // GET /api/v1/reports/dashboard
    const reportDashRes = await request("GET", "/reports/dashboard", null, adminToken);
    console.log(`GET /reports/dashboard: status ${reportDashRes.status}`);

    // GET /api/v1/reports/transactions
    const reportTransRes = await request("GET", `/reports/transactions?startDate=${tomorrow}&endDate=${tomorrow}`, null, adminToken);
    console.log(`GET /reports/transactions: status ${reportTransRes.status}`);

    console.log("\n=== ALL TESTS TRIGGERS EXECUTED SUCCESSFULLY ===");

  } catch (error) {
    console.error("Test execution aborted with error:", error);
  } finally {
    // Clean up temporary collections
    console.log("\nCleaning up temporary test documents...");
    if (bookingId) await Booking.deleteOne({ _id: bookingId });
    if (orderId) await Order.deleteOne({ _id: orderId });
    if (productId) await Product.deleteOne({ _id: productId });
    if (sharedMatchId) await SharedMatch.deleteOne({ _id: sharedMatchId });
    if (tournamentId) await Tournament.deleteOne({ _id: tournamentId });
    if (courtId) await Court.deleteOne({ _id: courtId });
    if (branchId) await Branch.deleteOne({ _id: branchId });
    if (pricingRuleId) await PricingRule.deleteOne({ _id: pricingRuleId });
    if (customerId) await User.deleteOne({ _id: customerId });

    if (server) {
      server.close();
      console.log("Server closed.");
    }
    await mongoose.disconnect();
    console.log("Database disconnected. Exiting test.");
  }
};

runTests();
