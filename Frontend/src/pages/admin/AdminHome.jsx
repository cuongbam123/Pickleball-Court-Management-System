// pages/admin/AdminHome.jsx
import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { useAdminDashboard } from "../../features/admin/hooks/useAdminDashboard";
import { TrendingUp, Wallet, Building2, CalendarPlus } from "lucide-react";
import { StatCardSkeletonGrid } from "../../components/ui/SkeletonLoader";
import EmptyState from "../../components/ui/EmptyState";

const AdminHome = () => {
  const { stats, isLoading, error } = useAdminDashboard();

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
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            Bảng điều khiển hệ thống
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Theo dõi vận hành toàn chuỗi chi nhánh với các chỉ số tức thời về
            sân, booking mới và doanh thu.
          </p>
        </section>

        {isLoading && <StatCardSkeletonGrid className="mt-6" />}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            <p className="font-medium">Lỗi tải dữ liệu:</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        )}

        {!isLoading && !error && !stats && (
          <EmptyState
            variant="light"
            className="mt-6"
            title="Không có dữ liệu thống kê"
            description="Hệ thống chưa trả về số liệu dashboard. Vui lòng thử tải lại trang."
          />
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
              value={formatCurrency(
                stats.todayRevenue ?? stats.monthlyRevenue,
              )}
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
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {Icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-baseline space-x-1">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {value ?? 0}
        </span>
        {unit && (
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

export default AdminHome;
