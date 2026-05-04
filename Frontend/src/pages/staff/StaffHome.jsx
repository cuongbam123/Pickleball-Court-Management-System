import React from "react";
import StaffLayout from "../../layouts/StaffLayout";
import { CalendarClock, CircleGauge, MapPinned } from "lucide-react";

const StaffHome = () => {
  return (
    <StaffLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-700">
            Manager Focus
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Vận hành chi nhánh trong ngày</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Giao diện được tối ưu cho quản lý tại chi nhánh: ưu tiên màn hình cho lịch sân, booking mới và trạng thái vận hành tức thời.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Box title="Booking mới" value="18" icon={CalendarClock} />
          <Box title="Sân đang trống" value="7" icon={CircleGauge} />
          <Box title="Chi nhánh quản lý" value="1" unit="cơ sở" icon={MapPinned} />
        </div>

        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Khu vực sơ đồ sân</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Khối này được chừa diện tích lớn để hiển thị layout sân theo thời gian thực cho Manager. Khi bạn đồng bộ data lịch sân, phần này có thể gắn trực tiếp Time Grid.
          </p>
        </section>
      </div>
    </StaffLayout>
  );
};

const Box = ({ title, value, unit, icon: Icon }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        {Icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-lime-100 text-lime-700">
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
        {value} {unit ? <span className="text-sm font-medium text-slate-400 dark:text-slate-500">{unit}</span> : null}
      </p>
    </div>
  );
};

export default StaffHome;