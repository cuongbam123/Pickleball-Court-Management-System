import React, { useState, lazy, Suspense } from "react";
import { useRevenues } from "../hooks/useRevenues";
import { useBranches } from "../../facility/hooks/useBranches";
import { StatCardSkeletonGrid, Skeleton } from "../../../components/ui/SkeletonLoader";
import Button from "../../../components/ui/Button";
import { Calendar, RefreshCw, Wallet, Coins, CreditCard, TrendingUp } from "lucide-react";
import dayjs from "dayjs";

// Import các component Cấp 2 và Cấp 3 mới tạo
import TransactionLogTable from "./TransactionLogTable";
import TransactionDetailDrawer from "./TransactionDetailDrawer";

// Lazy load biểu đồ Recharts để tránh nặng bundle chính
const RevenueChart = lazy(() => import("./RevenueChart"));

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const RevenueDashboard = () => {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    branchId,
    setBranchId,
    reportData,
    isLoading,
    isSyncing,
    triggerSync,
    refresh,
    userRole,

    // Các state và hàm Drill-down lấy từ hook
    drillDownLevel,
    setDrillDownLevel,
    selectedMethod,
    setSelectedMethod,
    selectedTxn,
    setSelectedTxn,
    transactions,
    isTxnsLoading,
  } = useRevenues();

  const { branches, isLoading: isLoadingBranches } = useBranches();
  
  // Quản lý việc đồng bộ hóa thủ công
  const [syncDate, setSyncDate] = useState(() => dayjs().format("YYYY-MM-DD"));

  // Tính toán số liệu phân rã dựa trên danh sách giao dịch
  // Đảm bảo Tiền mặt + Chuyển khoản = Tổng thực thu
  const getOverallSummaries = () => {
    let cash = 0;
    let transfer = 0;
    transactions.forEach((txn) => {
      if (txn.payment_method === "cash") {
        cash += txn.amount || 0;
      } else {
        // transfer, vnpay, momo đều tính vào chuyển khoản/ví điện tử
        transfer += txn.amount || 0;
      }
    });
    return { cash, transfer, overall: cash + transfer };
  };

  const { cash, transfer, overall } = getOverallSummaries();

  const handleSyncClick = async () => {
    if (!syncDate) return;
    await triggerSync(syncDate);
  };

  // Mở màn hình Cấp độ 2 (TransactionLog)
  const handleCardClick = (method) => {
    setSelectedMethod(method);
    setDrillDownLevel(2);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Re-sync Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Báo cáo Doanh thu & Dòng tiền
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quản lý dòng tiền chi tiết, đối soát giao dịch và chốt ca thu ngân
          </p>
        </div>

        {/* Nút Đồng bộ thủ công chỉ dành cho Admin */}
        {userRole === "admin" && (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 md:inline px-2">
              Đồng bộ doanh thu:
            </span>
            <input
              type="date"
              value={syncDate}
              max={dayjs().format("YYYY-MM-DD")}
              onChange={(e) => setSyncDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-transparent px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <Button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-xl"
              size="sm"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Đang đồng bộ..." : "Đồng bộ"}
            </Button>
          </div>
        )}
      </div>

      {/* 2. Bộ lọc Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Từ ngày
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Đến ngày
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Chi nhánh
          </label>
          {userRole === "admin" ? (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              readOnly
              value={
                branches.find((b) => b._id === branchId)?.name ||
                "Chi nhánh của bạn"
              }
              className="w-full rounded-2xl border border-slate-100 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 focus:outline-none cursor-not-allowed"
            />
          )}
        </div>

        <div className="flex items-end self-end">
          <Button
            onClick={refresh}
            disabled={isLoading}
            className="rounded-2xl px-5 py-3 shadow-md shadow-blue-500/10 font-bold"
          >
            Lọc dữ liệu
          </Button>
        </div>
      </div>

      {/* 3. Thẻ thống kê (Stat Cards) - Cấp độ 1 */}
      {isLoading ? (
        <StatCardSkeletonGrid count={3} className="grid-cols-1 md:grid-cols-3 gap-5" />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          
          {/* Card 1: TỔNG THỰC THU (Không click được) */}
          <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all">
            <div className="rounded-2xl bg-blue-100 p-4 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tổng thực thu
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(overall)}
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5">
                Tiền mặt + Chuyển khoản
              </span>
            </div>
          </div>

          {/* Card 2: TIỀN MẶT (Có hiệu ứng Hover mở rộng & Click được) */}
          <div
            onClick={() => handleCardClick("cash")}
            className="group relative overflow-hidden flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:border-emerald-500/30 cursor-pointer"
          >
            <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:scale-95 transition-transform">
              <Coins size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tiền mặt
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(cash)}
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5">
                Thu tại quầy / két sắt
              </span>
            </div>

            {/* Hover Premium overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-teal-600/95 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none p-4 rounded-3xl">
              <TrendingUp className="animate-bounce mb-1" size={20} />
              <span className="text-xs font-bold tracking-wide">Xem nhật ký dòng tiền →</span>
            </div>
          </div>

          {/* Card 3: CHUYỂN KHOẢN / VÍ ĐIỆN TỬ (Có hiệu ứng Hover mở rộng & Click được) */}
          <div
            onClick={() => handleCardClick("transfer")}
            className="group relative overflow-hidden flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:border-violet-500/30 cursor-pointer"
          >
            <div className="rounded-2xl bg-violet-100 p-4 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 group-hover:scale-95 transition-transform">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Chuyển khoản / Ví
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(transfer)}
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5">
                VNPay, Momo, Ngân hàng
              </span>
            </div>

            {/* Hover Premium overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/90 to-purple-600/95 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none p-4 rounded-3xl">
              <TrendingUp className="animate-bounce mb-1" size={20} />
              <span className="text-xs font-bold tracking-wide">Xem nhật ký dòng tiền →</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Đồ thị doanh thu & Chi tiết */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">
          Biểu đồ Doanh thu Theo Ngày
        </h2>
        {isLoading ? (
          <Skeleton height="350px" className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
        ) : (
          <Suspense
            fallback={
              <Skeleton height="350px" className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
            }
          >
            <RevenueChart reportData={reportData} />
          </Suspense>
        )}
      </div>

      {/* ================= DRILL-DOWN LEVEL 2 & 3 COMPONENTS ================= */}
      
      {/* Cấp độ 2: Nhật ký giao dịch (Modal) */}
      <TransactionLogTable
        open={drillDownLevel >= 2 && selectedMethod !== null}
        onClose={() => {
          setDrillDownLevel(1);
          setSelectedMethod(null);
        }}
        paymentMethod={selectedMethod}
        transactions={transactions}
        isLoading={isTxnsLoading}
        onViewDetail={(txn) => {
          setSelectedTxn(txn);
          setDrillDownLevel(3);
        }}
      />

      {/* Cấp độ 3: Chi tiết chứng từ (Side-Drawer) */}
      <TransactionDetailDrawer
        open={drillDownLevel === 3 && selectedTxn !== null}
        onClose={() => {
          setDrillDownLevel(2);
          setSelectedTxn(null);
        }}
        transaction={selectedTxn}
      />
    </div>
  );
};

export default RevenueDashboard;
