import React from "react";
import clsx from "clsx";
import TimeGridSkeleton from "./TimeGridSkeleton";

const TimeGrid = ({ 
  isLoading, 
  gridData, 
  timeHeaders, 
  selectedSlots = [],
  onSelectSlot,
  onQuickUpdateStatus
}) => {
  if (isLoading) return <TimeGridSkeleton gridData={gridData} timeHeaders={timeHeaders} />;
  if (!gridData || gridData.length === 0) return <div className="p-4 text-slate-500">Không có dữ liệu sân.</div>;

  const getSlotColor = (slot) => {
    if (slot.isPast) {
      return "bg-slate-800 border-slate-900 cursor-not-allowed opacity-90";
    }

    if ([ "deposited", "holding", "completed", "playing"].includes(slot.status)) {
      return "bg-slate-300 cursor-not-allowed border-slate-400 opacity-60"; 
    }

    if (slot.status === "maintenance") {
      return "bg-stone-200 cursor-not-allowed border-stone-300 text-stone-400";
    }

    if (slot.status === "available") {
      return "bg-green-50 hover:bg-green-200 cursor-pointer border-green-200";
    }

    return "bg-white";
  };

  // Hàm helper lấy màu cho Trạng thái Live tại quầy (tagStatus)
  const getLiveTagBadge = (tagStatus) => {
    switch (tagStatus) {
      case "playing": return <span className="px-2 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded-full font-bold">Đang đánh</span>;
      case "booked": return <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-700 rounded-full font-bold">Kín</span>;
      default: return <span className="px-2 py-0.5 text-[10px] bg-green-100 text-green-700 rounded-full font-bold">Trống</span>;
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border p-4 shadow-sm">
      <table className="w-full min-w-[1000px] border-separate border-spacing-y-2 border-spacing-x-1">
        <thead>
          <tr>
            <th className="text-left font-medium text-slate-500 p-2 min-w-[180px]">Danh sách sân</th>
            {timeHeaders.map((time) => (
              <th key={time} className="text-center font-medium text-slate-500 text-sm w-16 pb-2">
                {time}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gridData.map((court) => (
            <tr key={court._id}>
              {/* Cột thông tin sân + Live Status */}
              <td className="align-middle">
                <div className="flex flex-col items-start justify-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800 text-sm">{court.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    {getLiveTagBadge(court.currentLiveStatus)}
                    
                    {/* Nút thao tác nhanh cho Staff mở sân ngay tại quầy */}
                    {onQuickUpdateStatus && (
                      <select 
                        className="text-[10px] bg-white border border-slate-300 rounded outline-none p-0.5 cursor-pointer"
                        value={court.currentLiveStatus}
                        onChange={(e) => onQuickUpdateStatus(court._id, e.target.value)}
                      >
                        <option value="available">Báo Trống</option>
                        <option value="playing">Mở Sân (Khách vào)</option>
                        <option value="booked">Báo Kín</option>
                      </select>
                    )}
                  </div>
                </div>
              </td>

              {/* Các cột Render Slot thời gian theo Lịch */}
              {court.slots.map((slot, index) => {
                // KIỂM TRA XEM Ô NÀY CÓ ĐANG ĐƯỢC USER CLICK CHỌN KHÔNG
                const isSelected = selectedSlots.some(
                  (s) => s.courtId === court._id && s.startTime === slot.startTime
                );

                return (
                  <td 
                    key={index} 
                    // BỔ SUNG ĐIỀU KIỆN CHẶN CLICK VÀO GIỜ QUÁ KHỨ (!slot.isPast)
                    onClick={() => !slot.isPast && slot.status === 'available' && onSelectSlot(court, slot)}
                    className={clsx(
                      "h-12 border rounded-md transition-colors",
                      // NẾU ĐANG CHỌN THÌ BÔI ĐEN, NẾU KHÔNG THÌ LẤY MÀU DỰA TRÊN OBJECT SLOT
                      isSelected 
                        ? "bg-slate-800 border-slate-900 shadow-inner" // Màu khi người dùng đang bấm chọn (giữ nguyên)
                        : getSlotColor(slot) // Truyền toàn bộ object `slot` vào đây
                    )}
                  ></td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimeGrid;