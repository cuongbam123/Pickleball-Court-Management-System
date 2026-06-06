import React, { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from "lucide-react";

const STATUS_LABELS = {
  recruiting: "Đang tuyển",
  locked: "Đã khóa",
  cancelled: "Đã hủy",
  completed: "Đã hoàn thành",
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.id || "";
  return value;
};

const getBooking = (match) => match?.booking_id || null;
const getParticipants = (match) => match?.participants || [];
const getParticipantUser = (participant) => participant?.user_id;

const formatTimeRange = (booking) => {
  const start = new Date(booking?.start_time);
  const end = new Date(booking?.end_time);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      date: "Chưa xác định",
      time: "Chưa xác định",
    };
  }

  return {
    date: start.toLocaleDateString("vi-VN"),
    time: `${start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
  };
};

const SharedMatchDetailModal = ({
  open,
  match,
  branches = [],
  courts = [],
  isLoading = false,
  isJoining = false,
  error = "",
  onClose,
  onJoin,
}) => {
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [showMatchInfo, setShowMatchInfo] = useState(false);

  const branchMap = useMemo(
    () => Object.fromEntries(branches.map((branch) => [branch._id, branch])),
    [branches],
  );

  const courtMap = useMemo(
    () => Object.fromEntries(courts.map((court) => [court._id, court])),
    [courts],
  );

  if (!open || !match) return null;

  const booking = getBooking(match);
  const branch = branchMap[getId(booking?.branch_id)];
  const court = courtMap[getId(booking?.court_id)];
  const { date, time } = formatTimeRange(booking);

  const participants = getParticipants(match);
  const bookedSlots = match.booked_slots || participants.length || 0;
  const maxSlots = match.max_slots || 0;
  const emptySlots = Math.max(maxSlots - bookedSlots, 0);
  const progress = maxSlots
    ? Math.min(Math.max((bookedSlots / maxSlots) * 100, 0), 100)
    : 0;
  const ticketPrice = match.ticket_price || 0;
  const canJoin = match.status === "recruiting" && emptySlots > 0;

  const handleClose = () => {
    if (isJoining) return;
    setShowJoinConfirm(false);
    setShowMatchInfo(false);
    onClose?.();
  };

  const handleOpenConfirm = () => {
    if (!canJoin || isJoining) return;
    setShowJoinConfirm(true);
  };

  const handleConfirmJoin = async () => {
    try {
      await onJoin?.(match);
    } finally {
      setShowJoinConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl">
        <div className="flex items-center justify-between bg-emerald-800 px-4 py-4 text-white sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold sm:text-xl lg:text-2xl">
            Chi tiết ca ghép
          </h2>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            <X size={24} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-7 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 lg:p-8">
            <section className="min-w-0 sm:hidden">
              <button
                type="button"
                onClick={() => setShowMatchInfo((current) => !current)}
                aria-expanded={showMatchInfo}
                className="mb-4 flex w-full items-center justify-between gap-3 border-b border-slate-200 pb-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-600"
              >
                <span className="flex items-center gap-2">
                  <Ticket size={18} className="text-orange-500" />
                  Thông tin ca ghép
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-transform ${
                    showMatchInfo ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showMatchInfo && (
                <MatchInfoContent
                  date={date}
                  time={time}
                  branchName={branch?.name}
                  courtName={court?.name}
                  ticketPrice={ticketPrice}
                  status={STATUS_LABELS[match.status] || match.status}
                  bookedSlots={bookedSlots}
                  maxSlots={maxSlots}
                  progress={progress}
                />
              )}
            </section>

            <section className="hidden min-w-0 sm:block">
              <SectionTitle icon={Ticket} title="Thông tin ca ghép" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                <InfoItem
                  icon={<CalendarDays size={18} />}
                  label="Ngày"
                  value={date}
                />
                <InfoItem icon={<Clock size={18} />} label="Giờ" value={time} />
                <InfoItem
                  icon={<MapPin size={18} />}
                  label="Chi nhánh"
                  value={branch?.name || "Không xác định"}
                />
                <InfoItem
                  icon={<Building2 size={18} />}
                  label="Sân"
                  value={court?.name || "Không xác định"}
                />
                <InfoItem
                  label="Giá vé"
                  value={`${ticketPrice.toLocaleString("vi-VN")} đ`}
                />
                <InfoItem
                  label="Trạng thái"
                  value={STATUS_LABELS[match.status] || match.status}
                />
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-bold text-slate-600 sm:text-base">
                  Slot: {bookedSlots} / {maxSlots}
                </p>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="min-w-0">
              <SectionTitle
                icon={Users}
                title="Danh sách người tham gia"
                iconClassName="text-purple-700"
              />

              {isLoading && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <Loader2 size={16} className="animate-spin" />
                  Đang tải chi tiết...
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {participants.map((participant) => (
                  <ParticipantCard
                    key={participant._id}
                    participant={participant}
                  />
                ))}

                {Array.from({ length: emptySlots }).map((_, index) => (
                  <EmptySlotCard key={`empty-slot-${index}`} />
                ))}
              </div>
            </section>
          </div>

          <div className="border-t border-slate-200 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-600 sm:text-base">
                Tổng phí tham gia:
              </span>
              <span className="text-xl font-extrabold text-orange-500 sm:text-2xl lg:text-3xl">
                {ticketPrice.toLocaleString("vi-VN")} đ
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-12 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={isJoining || !canJoin}
                className="min-h-12 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isJoining ? "Đang tạo thanh toán..." : "Tham gia ngay"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showJoinConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Xác nhận tham gia
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Bạn sẽ được chuyển sang cổng thanh toán sau khi đồng ý.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowJoinConfirm(false)}
                disabled={isJoining}
                aria-label="Đóng xác nhận"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-extrabold uppercase text-emerald-700">
                  Phí tham gia
                </p>
                <p className="mt-1 text-2xl font-extrabold text-orange-500">
                  {ticketPrice.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-500">Ngày</p>
                  <p className="mt-1 font-bold text-slate-900">{date}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-500">Giờ</p>
                  <p className="mt-1 font-bold text-slate-900">{time}</p>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                Vui lòng kiểm tra thông tin trước khi thanh toán. Sau khi tạo
                link, trình duyệt sẽ tự chuyển sang VNPay.
              </p>
            </div>

            <div className="grid gap-3 border-t border-slate-200 px-5 py-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowJoinConfirm(false)}
                disabled={isJoining}
                className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmJoin}
                disabled={isJoining}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isJoining ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CreditCard size={18} />
                )}
                {isJoining ? "Đang tạo link..." : "Đồng ý thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title, iconClassName = "text-orange-500" }) => (
  <h3 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-extrabold uppercase tracking-wide text-slate-600 sm:text-sm">
    <Icon size={18} className={iconClassName} />
    {title}
  </h3>
);

const MatchInfoContent = ({
  date,
  time,
  branchName,
  courtName,
  ticketPrice,
  status,
  bookedSlots,
  maxSlots,
  progress,
}) => (
  <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
      <InfoItem icon={<CalendarDays size={18} />} label="Ngày" value={date} />
      <InfoItem icon={<Clock size={18} />} label="Giờ" value={time} />
      <InfoItem
        icon={<MapPin size={18} />}
        label="Chi nhánh"
        value={branchName || "Không xác định"}
      />
      <InfoItem
        icon={<Building2 size={18} />}
        label="Sân"
        value={courtName || "Không xác định"}
      />
      <InfoItem
        label="Giá vé"
        value={`${ticketPrice.toLocaleString("vi-VN")} đ`}
      />
      <InfoItem label="Trạng thái" value={status} />
    </div>

    <div className="mt-6">
      <p className="mb-3 text-sm font-bold text-slate-600 sm:text-base">
        Slot: {bookedSlots} / {maxSlots}
      </p>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  </>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="min-w-0">
    <p className="mb-1.5 flex items-center gap-2 text-xs font-extrabold uppercase text-slate-400">
      {icon}
      {label}
    </p>
    <p className="break-words text-base font-bold leading-6 text-slate-900 sm:text-lg">
      {value}
    </p>
  </div>
);

const ParticipantCard = ({ participant }) => {
  const user = getParticipantUser(participant);
  const name = user?.full_name || "Người chơi";
  const rank = user?.skill_rank || "Chưa có";

  return (
    <div className="flex min-h-36 min-w-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 text-center sm:min-h-40 sm:p-4">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-400 text-lg font-bold text-white sm:h-14 sm:w-14 sm:text-xl">
        {name.charAt(0).toUpperCase()}
      </div>
      <p className="max-w-full break-words text-sm font-bold leading-5 text-slate-900">
        {name}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">
        Rank {rank}
      </p>
    </div>
  );
};

const EmptySlotCard = () => (
  <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-sm font-semibold leading-5 text-slate-400 sm:min-h-40 sm:p-4">
    Chờ người tham gia
  </div>
);

export default SharedMatchDetailModal;
