// pages/admin/AdminHome.jsx
import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { useAdminDashboard } from "../../features/admin/hooks/useAdminDashboard";
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
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Tổng quan hoạt động hệ thống dựa trên dữ liệu thời gian thực.
        </p>

        {isLoading && <StatCardSkeletonGrid className="mt-6" />}

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 border border-red-100 text-red-600">
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
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Box
              title="Chi nhánh"
              value={stats.totalBranches}
              unit="cơ sở"
            />
            <Box
              title="Sân đang hoạt động"
              value={stats.activeCourts}
              unit="sân"
            />
            <Box title="Nhân viên" value={stats.totalStaff} unit="người" />
            <Box
              title="Doanh thu tháng"
              value={formatCurrency(stats.monthlyRevenue)}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const Box = ({ title, value, unit = "" }) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-hover hover:border-blue-200 hover:bg-white hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="mt-3 flex items-baseline space-x-1">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {unit && (
          <span className="text-xs text-slate-400 font-medium">{unit}</span>
        )}
      </div>
    </div>
  );
};

export default AdminHome;
