import React, { useMemo } from "react";
import {
  Building2,
  CalendarDays,
  Clock,
  Eye,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";

const STATUS_LABELS = {
  recruiting: "Đang tuyển",
  locked: "Đã khóa",
  cancelled: "Đã hủy",
  completed: "Đã hoàn thành",
};

const formatMatchTime = (booking) => {
  const start = new Date(booking?.start_time);
  const end = new Date(booking?.end_time);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      date: "Chưa xác định",
      startTime: "--:--",
      endTime: "--:--",
    };
  }

  return {
    date: start.toLocaleDateString("vi-VN"),
    startTime: start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    endTime: end.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const CardComponents = ({
  sharedMatches,
  branches,
  courts,
  isLoading,
  onViewDetail,
}) => {
  const branchMap = useMemo(
    () => Object.fromEntries(branches.map((branch) => [branch._id, branch])),
    [branches],
  );

  const courtMap = useMemo(
    () => Object.fromEntries(courts.map((court) => [court._id, court])),
    [courts],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10">
        <p className="text-sm font-medium text-slate-500">Đang tải...</p>
      </div>
    );
  }

  if (!sharedMatches?.length) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
        <p className="text-sm font-medium text-slate-500">
          Không có trận đấu nào.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:gap-5 2xl:grid-cols-4">
      {sharedMatches.map((match) => {
        const booking = match.booking_id;
        const branch = branchMap[booking?.branch_id];
        const court = courtMap[booking?.court_id];
        const { date, startTime, endTime } = formatMatchTime(booking);
        const bookedSlots = match.booked_slots || 0;
        const maxSlots = match.max_slots || 0;
        const remainSlots = Math.max(maxSlots - bookedSlots, 0);
        const progress = maxSlots
          ? Math.min(Math.max((bookedSlots / maxSlots) * 100, 0), 100)
          : 0;

        return (
          <article
            key={match._id}
            className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
          >
            <div className="flex min-w-0 items-start justify-between gap-3 bg-slate-50 p-4 sm:p-5">
              <span className="inline-flex min-h-9 shrink-0 items-center rounded-lg bg-emerald-100 px-3 text-xs font-bold text-emerald-700 sm:text-sm">
                {STATUS_LABELS[match.status] || match.status}
              </span>

              <div className="min-w-0 text-right">
                <p className="flex items-center justify-end gap-1.5 text-xl font-extrabold text-orange-500 sm:text-2xl">
                  <Wallet size={20} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">
                    {(match.ticket_price || 0).toLocaleString("vi-VN")} đ
                  </span>
                </p>
                <p className="text-xs text-slate-500 sm:text-sm">/người</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <div className="space-y-3 text-sm text-slate-700">
                <InfoLine icon={CalendarDays} label="Ngày" value={date} />
                <InfoLine
                  icon={Clock}
                  label="Giờ"
                  value={`${startTime} - ${endTime}`}
                />
                <InfoLine
                  icon={MapPin}
                  label="Chi nhánh"
                  value={branch?.name || "Không xác định"}
                />
                <InfoLine
                  icon={Building2}
                  label="Sân"
                  value={court?.name || "Không xác định"}
                />
              </div>

              <div className="mt-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Users
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-emerald-700"
                  />
                  Người tham gia
                </p>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-700">
                    {bookedSlots} / {maxSlots}
                  </span>

                  <span className="text-right font-bold text-orange-500">
                    Còn {remainSlots} vị trí
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewDetail?.(match)}
              className="mt-auto flex min-h-12 w-full items-center justify-center gap-2 bg-emerald-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Eye size={18} aria-hidden="true" />
              Xem chi tiết
            </button>
          </article>
        );
      })}
    </div>
  );
};

const InfoLine = ({ icon: Icon, label, value }) => (
  <div className="flex min-w-0 items-start gap-3">
    <Icon
      size={18}
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-emerald-700"
    />
    <p className="min-w-0 flex-1 leading-6">
      <span className="font-semibold text-slate-500">{label}: </span>
      <span className="break-words font-medium text-slate-800">{value}</span>
    </p>
  </div>
);

export default CardComponents;
