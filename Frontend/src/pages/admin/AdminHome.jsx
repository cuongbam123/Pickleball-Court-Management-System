// pages/admin/AdminHome.jsx
import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { useAdminDashboard } from "../../features/admin/hooks/useAdminDashboard";
import { TrendingUp, Wallet, Building2, CalendarPlus } from "lucide-react";

const AdminHome = () => {
  const { stats, isLoading, error } = useAdminDashboard();

  //format tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Admin Overview
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Bảng điều khiển hệ thống</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Theo dõi vận hành toàn chuỗi chi nhánh với các chỉ số tức thời về sân, booking mới và doanh thu.
          </p>
        </section>

        {isLoading && (
          <div className="mt-10 flex flex-col items-center justify-center space-y-2 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-500 text-sm">Đang đồng bộ dữ liệu...</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 border border-red-100 text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            <p className="font-medium">Lỗi tải dữ liệu:</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        )}

        {!isLoading && !error && stats && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Box
              title="Tổng chi nhánh"
              value={stats.totalBranches}
              unit="cơ sở"
              icon={Building2}
            />
            <Box
              title="Sân trống / hoạt động"
              value={stats.activeCourts}
              unit="sân"
              icon={TrendingUp}
            />
            <Box
              title="Booking mới hôm nay"
              value={stats.newBookingsToday ?? 0}
              unit="đơn"
              icon={CalendarPlus}
            />
            <Box
              title="Doanh thu hôm nay"
              value={formatCurrency(stats.todayRevenue ?? stats.monthlyRevenue)}
              icon={Wallet}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const Box = ({ title, value, unit = "", icon: Icon }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {Icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-baseline space-x-1">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{value ?? 0}</span>
        {unit && <span className="text-xs text-slate-400 font-medium dark:text-slate-500">{unit}</span>}
      </div>
    </div>
  );
};

export default AdminHome;