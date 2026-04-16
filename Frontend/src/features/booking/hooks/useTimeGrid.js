import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { getAvaliableTimeSlots } from "../api/bookingApi";
import { changeCourtStatus } from "../../facility/api/courtApi";

const START_HOUR = 0;
const END_HOUR = 24;

export const useTimeGrid = (branchId, courtId, date, courtsList = []) => {
  const [gridData, setGridData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGridData = useCallback(async () => {
    if (!branchId || !date) {
      setGridData([]);
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = dayjs(date).format("YYYY-MM-DD");

      // 1. Xác định danh sách các sân cần lấy dữ liệu
      // Nếu có courtId cụ thể -> chỉ lấy 1 sân đó. Nếu không -> lấy toàn bộ courtsList.
      let targetCourts = courtsList;
      if (courtId && courtId !== "") {
        targetCourts = courtsList.filter(
          (c) => String(c._id) === String(courtId),
        );
      }

      if (targetCourts.length === 0) {
        setGridData([]);
        setIsLoading(false);
        return;
      }
      const gridDataPromises = targetCourts.map(async (courtObj) => {
        // Gọi API cho từng sân
        let bookedSlots = [];
        let pricingRules = [];

        try {
          const bookingsRes = await getAvaliableTimeSlots({
            court_id: courtObj._id,
            date: formattedDate,
          });
          const responseData = bookingsRes?.data?.data || {};
          bookedSlots = responseData.booked_slots || [];
          pricingRules = responseData.pricing_rules || [];
        } catch (error) {
          console.warn(
            `Sân ${courtObj.name} trống hoặc lỗi API:`,
            error?.response?.status,
          );

          const errorData = error?.response?.data?.data || {};
          pricingRules = errorData.pricing_rules || [];
        } // Lấy mảng quy tắc giá

        const currentTime = dayjs();
        const slots = [];

        for (let hour = START_HOUR; hour < END_HOUR; hour++) {
          const slotStartStr = `${hour.toString().padStart(2, "0")}:00`;
          const slotEndStr = `${(hour + 1).toString().padStart(2, "0")}:00`;

          const slotStartObj = dayjs(`${formattedDate}T${slotStartStr}:00`);
          const slotEndObj = slotStartObj.add(1, "hour");

          // KIỂM TRA GIỜ QUÁ KHỨ: Nếu slotStartObj nhỏ hơn thời gian hiện tại -> Là giờ cũ
          const isPastSlot = slotStartObj.isBefore(currentTime);

          // XÁC ĐỊNH Ô CÓ ĐANG BỊ ĐẶT KHÔNG (Sửa bookings thành bookedSlots)
          const matchedBooking = bookedSlots.find((b) => {
            const bStartStr = b.start_time || b.startTime;
            const bEndStr = b.end_time || b.endTime;

            if (!bStartStr || !bEndStr) return false;

            const bookingStartObj = dayjs(`${formattedDate}T${bStartStr}:00`);
            let bookingEndObj = dayjs(`${formattedDate}T${bEndStr}:00`);

            // Xử lý ca đặt vắt qua ngày hôm sau
            if (bookingEndObj.isBefore(bookingStartObj)) {
              bookingEndObj = bookingEndObj.add(1, "day");
            }

            return (
              slotStartObj.isBefore(bookingEndObj) &&
              slotEndObj.isAfter(bookingStartObj)
            );
          });

          let slotPrice = null; // Giá sàn mặc định nếu không có rule

          // 1. Xác định ngày đang chọn là Ngày thường (weekday) hay Cuối tuần (weekend)
          const dayOfWeek = dayjs(formattedDate).day(); // 0: Chủ nhật, 6: Thứ 7
          const currentDayType =
            dayOfWeek === 0 || dayOfWeek === 6 ? "weekend" : "weekday";

          // 2. Tìm Rule phù hợp nhất trực tiếp từ mảng pricingRules
          const matchedRule = pricingRules.find((r) => {
            // Bỏ qua các rule đã bị xoá
            if (r.is_deleted === true) return false;

            // Bỏ qua nếu không đúng Loại Sân (VD: Rule cho sân 4-player nhưng sân hiện tại là 2-player)
            if (r.court_type && r.court_type !== courtObj.type) return false;

            // Bỏ qua nếu không đúng Loại Ngày (weekday / weekend)
            if (r.day_type && r.day_type !== currentDayType) return false;

            // Padding thêm số 0 để so sánh chuẩn xác (Biến "6:00" thành "06:00")
            const ruleStart = (r.start_time || "").padStart(5, "0");
            const ruleEnd = (r.end_time || "").padStart(5, "0");

            // Kiểm tra giờ bắt đầu của ô hiện tại có nằm trong khoảng rule không
            return slotStartStr >= ruleStart && slotStartStr < ruleEnd;
          });
          if (matchedRule) {
            slotPrice = matchedRule.price_per_hour;
          }
          // ------------------------------------------

          // XÁC ĐỊNH TRẠNG THÁI HIỂN THỊ CỦA Ô (Status)
          let slotStatus = "available";
          if (courtObj.status === "maintenance") {
            slotStatus = "maintenance";
          } else if (matchedBooking) {
            slotStatus =
              matchedBooking.status === "completed"
                ? "playing"
                : matchedBooking.status || "booked";
          }

          // ĐẨY VÀO MẢNG
          slots.push({
            time: `${slotStartStr} - ${slotEndStr}`,
            startTime: slotStartStr,
            endTime: slotEndStr,
            status: slotStatus,
            bookingInfo: matchedBooking || null,
            isPast: isPastSlot,
            pricePerHour: slotPrice, // <--- Cực kỳ quan trọng để Form tính Tổng tiền Tạm tính
          });
        }

        // Trả về dữ liệu của sân này kèm theo slots
        return {
          ...courtObj,
          currentLiveStatus: courtObj.tagStatus || "available",
          slots,
        };
      });

      // 3. Đợi tất cả các sân xử lý xong và set vào State
      const finalGridData = await Promise.all(gridDataPromises);
      setGridData(finalGridData);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu lưới thời gian:", error);
    } finally {
      setIsLoading(false);
    }
  }, [branchId, courtId, date, courtsList]);

  useEffect(() => {
    fetchGridData();
  }, [fetchGridData]);

  const quickUpdateTagStatus = async (updateCourtId, newTagStatus) => {
    try {
      await changeCourtStatus(updateCourtId, newTagStatus);
      toast.success(`Đã cập nhật trạng thái sân thành: ${newTagStatus}`);
      fetchGridData();
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Lỗi cập nhật trạng thái");
      return false;
    }
  };

  return {
    gridData,
    isLoading,
    refreshGrid: fetchGridData,
    quickUpdateTagStatus,
    timeHeaders: Array.from({ length: END_HOUR - START_HOUR }, (_, i) => {
      const startH = i + START_HOUR;
      return `${startH.toString().padStart(2, "0")}:00`;
    }),
  };
};
