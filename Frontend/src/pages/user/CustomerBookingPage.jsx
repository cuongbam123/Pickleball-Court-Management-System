import React from "react";
import MainLayout from "../../layouts/MainLayout";
import TimeGrid from "../../features/booking/components/TimeGrid";
import BookingForm from "../../features/booking/components/BookingForm";
import { useBookingPage } from "../../features/booking/hooks/useBookingPage";
import { useTimeGrid } from "../../features/booking/hooks/useTimeGrid";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Spiral from "../../components/ui/Spiral";
import { MapPin, Sparkles, ChevronDown } from "lucide-react";

const CustomerBookingPage = () => {
  const {
    branches,
    courtsList,
    selectedBranch,
    setSelectedBranch,
    selectedCourt,
    setSelectedCourt,
    selectedDate,
    setSelectedDate,
    selectedSlots,
    isLoadingCourts,
    handleSelectSlot,
    setSelectedSlots,
  } = useBookingPage();

  const {
    gridData,
    isLoading: isGridLoading,
    timeHeaders,
  } = useTimeGrid(
    selectedBranch,
    selectedCourt,
    selectedDate,
    courtsList,
    selectedSlots,
    setSelectedSlots,
  );

  const filteredGridData = React.useMemo(() => {
    if (!gridData || gridData.length === 0) return [];

    if (!selectedCourt || selectedCourt === "") {
      return gridData;
    }

    return gridData.filter((court) => String(court._id) === String(selectedCourt));
  }, [gridData, selectedCourt]);

  React.useEffect(() => {
    if (!Array.isArray(selectedSlots) || selectedSlots.length === 0) return;
    if (!Array.isArray(gridData) || gridData.length === 0) return;

    const hasUnhydratedPrice = selectedSlots.some(
      (slot) => slot.pricePerHour === undefined || slot.pricePerHour === null,
    );
    if (!hasUnhydratedPrice) return;

    let hasChanged = false;
    const nextSelectedSlots = selectedSlots.map((selected) => {
      const court = gridData.find(
        (c) => String(c._id) === String(selected.courtId),
      );
      const matchedGridSlot = court?.slots?.find(
        (s) =>
          s.startTime === selected.startTime && s.endTime === selected.endTime,
      );

      if (!matchedGridSlot) return selected;

      hasChanged = true;
      return {
        ...selected,
        ...matchedGridSlot,
        courtId: selected.courtId,
        userInfo: selected.userInfo || matchedGridSlot.userInfo || {},
      };
    });

    if (hasChanged) {
      setSelectedSlots(nextSelectedSlots);
    }
  }, [gridData, selectedSlots, setSelectedSlots]);

  const handleBookingSubmit = async () => {
    try {
      toast.success("Giữ chỗ thành công!");
      setSelectedSlots([]);
    } catch (error) {
      console.error("Lỗi khi giữ chỗ:", error);
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi đặt sân!");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 mx-auto w-full max-w-[95%] lg:max-w-[90%] px-4 py-12 font-sans bg-slate-50/50">
        
        {/* Floating Control Panel for Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-wrap gap-6 items-center backdrop-blur-md bg-opacity-95 relative z-10 transition-all">
          <div className="w-72 min-w-[260px] relative">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              <MapPin size={14} className="text-[#064e3b]" />
              Chi nhánh câu lạc bộ
            </label>
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setSelectedCourt("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-3 text-sm text-slate-800 outline-none transition-all duration-300 focus:bg-white focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 focus:shadow-sm appearance-none cursor-pointer"
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <div className="w-72 min-w-[260px] relative">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              <Sparkles size={14} className="text-[#064e3b]" />
              Sân thi đấu cụ thể
            </label>
            <div className="relative">
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                disabled={!selectedBranch}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-3 text-sm text-slate-800 outline-none transition-all duration-300 focus:bg-white focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 focus:shadow-sm appearance-none cursor-pointer disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Tất cả sân trong chi nhánh</option>
                {courtsList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        {!selectedBranch && (
          <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-8">
            <h2 className="text-3xl font-extrabold mb-8 text-black tracking-tight font-sans">
              Tất cả sân trên hệ thống
            </h2>
            {isLoadingCourts ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Spiral size="md" className="text-[#064e3b]" />
                <span className="text-sm font-semibold text-slate-500">Đang tải danh sách sân...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {courtsList.map((court) => {
                  const isVip = court.name.toLowerCase().includes("vip");
                  return (
                    <div
                      key={court._id}
                      onClick={() => setSelectedBranch(court.branch_id?._id || court.branch_id)}
                      className="group border border-slate-150 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Court 2D CSS Schema */}
                      <div className="relative w-full h-32 bg-[#064e3b] overflow-hidden flex items-center justify-center border-b border-emerald-800">
                        {/* Court Lines */}
                        <div className="absolute inset-2 border border-white/25 flex flex-col justify-between">
                          <div className="h-[35%] w-full border-b border-white/20 flex">
                            <div className="w-1/2 h-full border-r border-white/20" />
                            <div className="w-1/2 h-full" />
                          </div>
                          
                          {/* Kitchen */}
                          <div className="h-[30%] w-full bg-emerald-800/30 border-b border-white/20" />
                          
                          <div className="h-[35%] w-full flex">
                            <div className="w-1/2 h-full border-r border-white/20" />
                            <div className="w-1/2 h-full" />
                          </div>
                        </div>
                        
                        {/* Net */}
                        <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-slate-100/60 shadow-sm" />
                        
                        {/* Ball */}
                        <div className="absolute top-[52%] left-[62%] w-2.5 h-2.5 rounded-full bg-lime-400 shadow-[0_0_6px_#a3e635] animate-pulse" />

                        {/* Overlaid Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          <span className="text-[9px] px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white rounded-md font-bold uppercase tracking-wider">
                            Tiêu Chuẩn
                          </span>
                          {isVip && (
                            <span className="text-[9px] px-2 py-0.5 bg-lime-400 text-emerald-950 rounded-md font-bold uppercase tracking-wider shadow-sm">
                              SUPER VIP
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-extrabold text-[18px] text-slate-800 group-hover:text-[#064e3b] font-sans leading-snug transition-colors">
                            {court.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            📍 {court.branch_id?.name || "Đang cập nhật"}
                          </p>
                          
                          {/* Amenities */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            <span className="text-[9px] px-2 py-0.5 bg-slate-50 text-slate-500 rounded font-semibold">📶 Wifi</span>
                            <span className="text-[9px] px-2 py-0.5 bg-slate-50 text-slate-500 rounded font-semibold">❄️ Máy lạnh</span>
                            <span className="text-[9px] px-2 py-0.5 bg-slate-50 text-slate-500 rounded font-semibold">🥤 Nước</span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[11px] text-slate-450 uppercase tracking-wider font-semibold">Giá từ</span>
                            <span className="text-base font-black text-emerald-800">
                              {court.price_per_hour ? `${court.price_per_hour.toLocaleString()} đ` : "120.000 đ"}/giờ
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center gap-2">
                            {court.status === "active" ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00C853] bg-[#E8F5E9] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#00C853] animate-pulse" />
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                                </span>
                                Bảo trì
                              </span>
                            )}
                            
                            <button className="bg-[#064e3b] text-lime-400 hover:bg-lime-400 hover:text-emerald-950 text-[11px] font-black py-2 px-3 rounded-xl min-h-[40px] inline-flex items-center justify-center transition-all duration-300 shadow-sm">
                              Đặt ngay &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedBranch && (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 w-full bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-6 overflow-hidden">
              <div className="flex gap-2 mb-6 border-b border-slate-150 overflow-x-auto pb-1">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = dayjs().add(i, "day");
                  const isSelected = dayjs(selectedDate).isSame(d, "day");
                  const dayIndex = d.day();
                  const dayName = dayIndex === 0 ? "Chủ nhật" : `Thứ ${dayIndex + 1}`;

                  return (
                     <button
                       key={i}
                       onClick={() => setSelectedDate(d.toDate())}
                       className={`px-5 py-3 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                         isSelected
                           ? "bg-[#064e3b] text-white rounded-t-xl font-bold shadow-md"
                           : "text-slate-600 hover:text-[#064e3b] hover:bg-slate-50 rounded-t-xl"
                       }`}
                     >
                      {i === 0 ? "Hôm nay" : `${dayName} (${d.format("DD/MM")})`}
                    </button>
                  );
                })}
              </div>

              <TimeGrid
                isLoading={isGridLoading}
                gridData={filteredGridData}
                timeHeaders={timeHeaders}
                selectedSlots={selectedSlots}
                onSelectSlot={handleSelectSlot}
              />
            </div>

            <div className="w-full lg:w-[360px] shrink-0">
              <BookingForm
                selectedSlots={selectedSlots}
                selectedDate={selectedDate}
                selectedBranch={selectedBranch}
                onSubmit={handleBookingSubmit}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CustomerBookingPage;
