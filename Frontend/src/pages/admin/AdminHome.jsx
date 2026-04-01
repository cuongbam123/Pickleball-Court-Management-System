import React from "react";
import AdminLayout from "../../layouts/AdminLayout";

const AdminHome = () => {
  return (
    <AdminLayout>
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Đây là giao diện dành cho admin, tập trung vào quản lý chi nhánh, sân bãi, giá và nhân sự.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Box title="Chi nhánh" value="3" />
          <Box title="Sân đang hoạt động" value="24" />
          <Box title="Nhân viên" value="12" />
          <Box title="Doanh thu tháng" value="125.000.000đ" />
        </div>
      </div>
    </AdminLayout>
  );
};

const Box = ({ title, value }) => {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default AdminHome;