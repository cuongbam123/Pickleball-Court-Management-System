import React from "react";
import MainLayout from "../../layouts/MainLayout";
import TimeGrid from "../../features/booking/components/TimeGrid";
import BookingForm from "../../features/booking/components/BookingForm";
import { useBookingPage } from "../../features/booking/hooks/useBookingPage";
import { useTimeGrid } from "../../features/booking/hooks/useTimeGrid";
import { toast } from "react-toastify";
import dayjs from "dayjs";

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
    quickUpdateTagStatus,
  } = useBookingPage();

  const {
    gridData,
    isLoading: isGridLoading,
    timeHeaders,
  } = useTimeGrid(selectedBranch, selectedCourt, selectedDate, courtsList);

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
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 items-center">
          <div className="w-64">
            <label className="block text-xs font-medium text-slate-500 mb-1">Chi nhánh</label>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setSelectedCourt("");
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-64">
            <label className="block text-xs font-medium text-slate-500 mb-1">Sân cụ thể</label>
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              disabled={!selectedBranch}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-100"
            >
              <option value="">Tất cả sân trong chi nhánh</option>
              {courtsList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedBranch && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Tất cả sân trên hệ thống</h2>
            {isLoadingCourts ? (
              <div className="text-center text-slate-500 py-10">Đang tải danh sách sân...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {courtsList.map((court) => (
                  <div
                    key={court._id}
                    onClick={() => setSelectedBranch(court.branch_id?._id || court.branch_id)}
                    className="border border-slate-200 p-4 rounded-xl hover:border-blue-500 hover:shadow-md cursor-pointer transition-all bg-slate-50"
                  >
                    <h3 className="font-bold text-lg">{court.name}</h3>
                    <p className="text-sm text-slate-500">
                      Chi nhánh: {court.branch_id?.name || "Đang cập nhật"}
                    </p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                        {court.status === "active" ? "Hoạt động" : "Bảo trì"}
                      </span>
                      <button className="text-blue-600 text-sm font-medium">Xem chi nhánh &rarr;</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedBranch && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-hidden">
              <div className="flex gap-2 mb-4 border-b border-slate-200 overflow-x-auto pb-1">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = dayjs().add(i, "day");
                  const isSelected = dayjs(selectedDate).isSame(d, "day");
                  const dayIndex = d.day();
                  const dayName = dayIndex === 0 ? "Chủ nhật" : `Thứ ${dayIndex + 1}`;

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(d.toDate())}
                      className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
                        isSelected
                          ? "bg-blue-100 text-blue-700 rounded-t-lg"
                          : "text-slate-500 hover:text-slate-800"
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
                onQuickUpdateStatus={quickUpdateTagStatus}
              />
            </div>

            <div className="w-full lg:w-[350px] shrink-0">
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
