import React from "react";
import StaffLayout from "../../layouts/StaffLayout";

const StaffHome = () => {
  return (
    <StaffLayout>
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Staff Workspace</h1>
        <p className="mt-2 text-slate-600">
          Đây là giao diện dành cho nhân viên, tập trung vào booking, POS và xử lý khách tại quầy.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Box title="Booking hôm nay" value="18" />
          <Box title="Khách tại quầy" value="7" />
          <Box title="Doanh thu ca" value="4.200.000đ" />
        </div>
      </div>
    </StaffLayout>
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

export default StaffHome;