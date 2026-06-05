import React, { useState, useEffect, useCallback, useRef } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import { getAvaliableTimeSlots } from "../api/bookingApi";
import { changeCourtStatus } from "../../facility/api/courtApi";
import { useSocket } from "../../../context/SocketContext";

const START_HOUR = 0;
const END_HOUR = 24;

export const useTimeGrid = (
  branchId,
  courtId,
  date,
  courtsList = [],
  selectedSlots = [],
  setSelectedSlots = null,
) => {
  const [courts, setCourts] = useState([]);
  const [slotsMap, setSlotsMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { socket, isConnected } = useSocket();

  // Refs để lưu giá trị mới nhất của selectedSlots mà không gây re-bind socket listener liên tục
  const selectedSlotsRef = useRef(selectedSlots);
  const setSelectedSlotsRef = useRef(setSelectedSlots);
  const activeTimersRef = useRef([]);

  useEffect(() => {
    selectedSlotsRef.current = selectedSlots;
    setSelectedSlotsRef.current = setSelectedSlots;
  }, [selectedSlots, setSelectedSlots]);

  useEffect(() => {
    return () => {
      // Cleanup all active timers on unmount to prevent state updates on unmounted components
      activeTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      activeTimersRef.current = [];
    };
  }, []);

  const fetchGridData = useCallback(async () => {
    if (!branchId || !date) {
      setCourts([]);
      setSlotsMap({});
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = dayjs(date).format("YYYY-MM-DD");

      // 1. Xác định danh sách các sân cần lấy dữ liệu
      let targetCourts = courtsList;
      if (courtId && courtId !== "") {
        targetCourts = courtsList.filter(
          (c) => String(c._id) === String(courtId),
        );
      }

      if (targetCourts.length === 0) {
        setCourts([]);
        setSlotsMap({});
        setIsLoading(false);
        return;
      }

      const gridDataPromises = targetCourts.map(async (courtObj) => {
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
        }

        const currentTime = dayjs();
        const slots = [];

        for (let hour = START_HOUR; hour < END_HOUR; hour++) {
          const slotStartStr = `${hour.toString().padStart(2, "0")}:00`;
          const slotEndStr = `${(hour + 1).toString().padStart(2, "0")}:00`;

          const slotStartObj = dayjs(`${formattedDate}T${slotStartStr}:00`);
          const slotEndObj = slotStartObj.add(1, "hour");

          const isPastSlot = slotStartObj.isBefore(currentTime);

          const matchedBooking = bookedSlots.find((b) => {
            const bStartStr = b.start_time || b.startTime;
            const bEndStr = b.end_time || b.endTime;

            if (!bStartStr || !bEndStr) return false;

            const bookingStartObj = dayjs(`${formattedDate}T${bStartStr}:00`);
            let bookingEndObj = dayjs(`${formattedDate}T${bEndStr}:00`);

            if (bookingEndObj.isBefore(bookingStartObj)) {
              bookingEndObj = bookingEndObj.add(1, "day");
            }

            return (
              slotStartObj.isBefore(bookingEndObj) &&
              slotEndObj.isAfter(bookingStartObj)
            );
          });

          let slotPrice = 0;
          const dayOfWeek = dayjs(formattedDate).day();
          const currentDayType =
            dayOfWeek === 0 || dayOfWeek === 6 ? "weekend" : "weekday";

          const matchedRule = pricingRules.find((r) => {
            if (r.is_deleted === true) return false;
            if (
              r.court_type &&
              r.court_type !== "all" &&
              r.court_type !== courtObj.type
            ) {
              return false;
            }
            if (r.day_type && r.day_type !== currentDayType) return false;

            const ruleStart = (r.start_time || "").padStart(5, "0");
            const ruleEnd = (r.end_time || "").padStart(5, "0");

            return slotStartStr >= ruleStart && slotStartStr < ruleEnd;
          });

          if (matchedRule) {
            slotPrice = Number(matchedRule.price_per_hour) || 0;
          }

          let slotStatus = "available";
          if (courtObj.status === "maintenance") {
            slotStatus = "maintenance";
          } else if (matchedBooking) {
            slotStatus = matchedBooking.status || "holding";
          }

          slots.push({
            time: `${slotStartStr} - ${slotEndStr}`,
            startTime: slotStartStr,
            endTime: slotEndStr,
            status: slotStatus,
            bookingInfo: matchedBooking || null,
            isPast: isPastSlot,
            pricePerHour: slotPrice,
            isNewUpdate: false,
          });
        }

        return {
          ...courtObj,
          currentLiveStatus: courtObj.tagStatus || "available",
          slots,
        };
      });

      const finalGridData = await Promise.all(gridDataPromises);

      // Chuẩn hóa dữ liệu sang dạng Key-Value (slotsMap) và danh sách courts
      const nextSlotsMap = {};
      const nextCourts = finalGridData.map((court) => {
        court.slots.forEach((slot) => {
          nextSlotsMap[`${court._id}_${slot.startTime}`] = slot;
        });
        const { slots, ...courtMeta } = court;
        return courtMeta;
      });

      setCourts(nextCourts);
      setSlotsMap(nextSlotsMap);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu lưới thời gian:", error);
    } finally {
      setIsLoading(false);
    }
  }, [branchId, courtId, date, courtsList]);

  useEffect(() => {
    fetchGridData();
  }, [fetchGridData]);

  // Logic tự động đồng bộ bù khi kết nối lại (Reconnect Sync)
  const [wasDisconnected, setWasDisconnected] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setWasDisconnected(true);
    } else if (isConnected && wasDisconnected) {
      console.log("🔄 Reconnected to socket server! Syncing booking schedule data...");
      fetchGridData();
      setWasDisconnected(false);
    }
  }, [isConnected, wasDisconnected, fetchGridData]);

  // Lắng nghe sự kiện WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleBookingChange = ({ action, booking }) => {
      // Định dạng ngày xem hiện tại và ngày của sự kiện đặt sân
      const bookingDate = dayjs(booking.start_time).format("YYYY-MM-DD");
      const currentGridDate = dayjs(date).format("YYYY-MM-DD");

      // Nếu booking không thuộc ngày hiện tại đang hiển thị -> bỏ qua
      if (bookingDate !== currentGridDate) return;

      const targetCourtId = String(booking.court_id);

      // Xác định các khung giờ bị ảnh hưởng
      const startH = dayjs(booking.start_time).hour();
      const endH = dayjs(booking.end_time).hour();

      let newStatus = "available";
      let newBookingInfo = null;

      if (action !== "cancel" && booking.status !== "cancelled") {
        newStatus = booking.status || "holding";
        newBookingInfo = {
          booking_id: booking._id,
          start_time: dayjs(booking.start_time).format("HH:mm"),
          end_time: dayjs(booking.end_time).format("HH:mm"),
          status: booking.status,
        };
      }

      // Lưu trữ các key cần cập nhật để tắt cờ isNewUpdate sau đó
      const updatedKeys = [];
      for (let hour = startH; hour < endH; hour++) {
        const startTimeStr = `${hour.toString().padStart(2, "0")}:00`;
        const key = `${targetCourtId}_${startTimeStr}`;
        updatedKeys.push(key);
      }

      setSlotsMap((prevMap) => {
        const nextMap = { ...prevMap };
        let conflictSlots = [];

        updatedKeys.forEach((key) => {
          if (nextMap[key]) {
            const hour = parseInt(key.split("_")[1].split(":")[0]);
            const startTimeStr = `${hour.toString().padStart(2, "0")}:00`;

            // Kiểm tra Race Condition: nếu ô này có người đặt mất khi user đang chọn
            if (newStatus !== "available" && setSelectedSlotsRef.current && selectedSlotsRef.current.length > 0) {
              const isSelected = selectedSlotsRef.current.some(
                (s) => String(s.courtId) === targetCourtId && s.startTime === startTimeStr,
              );
              if (isSelected) {
                conflictSlots.push(`${startTimeStr} - ${(hour + 1).toString().padStart(2, "0")}:00`);
              }
            }

            // Cập nhật ô
            nextMap[key] = {
              ...nextMap[key],
              status: newStatus,
              bookingInfo: newBookingInfo,
              isNewUpdate: true, // bật cờ animation nhấp nháy
            };
          }
        });

        // Xử lý Xung đột và loại bỏ khỏi selectedSlots
        if (conflictSlots.length > 0 && setSelectedSlotsRef.current) {
          setSelectedSlotsRef.current((prevSelected) => {
            return prevSelected.filter(
              (s) =>
                !(
                  String(s.courtId) === targetCourtId &&
                  dayjs(`${currentGridDate}T${s.startTime}:00`).hour() >= startH &&
                  dayjs(`${currentGridDate}T${s.startTime}:00`).hour() < endH
                ),
            );
          });

          // Hiển thị Toast thông báo lỗi ngay lập tức
          toast.error(
            `Rất tiếc! Khung giờ ${conflictSlots.join(", ")} của sân vừa được người khác đặt trước vài giây.`,
          );
        }

        return nextMap;
      });

      // Tự động tắt cờ nhấp nháy sau 1.5s
      if (updatedKeys.length > 0) {
        const timerId = setTimeout(() => {
          setSlotsMap((latestMap) => {
            const nextMap = { ...latestMap };
            let hasChanged = false;
            updatedKeys.forEach((key) => {
              if (nextMap[key] && nextMap[key].isNewUpdate) {
                nextMap[key] = {
                  ...nextMap[key],
                  isNewUpdate: false,
                };
                hasChanged = true;
              }
            });
            return hasChanged ? nextMap : latestMap;
          });
          // Xóa timer khỏi danh sách active
          activeTimersRef.current = activeTimersRef.current.filter((t) => t !== timerId);
        }, 1500);

        activeTimersRef.current.push(timerId);
      }
    };

    const handleCourtUpdated = (updatedCourt) => {
      const targetCourtId = String(updatedCourt._id);
      setCourts((prevCourts) => {
        return prevCourts.map((c) => {
          if (String(c._id) !== targetCourtId) return c;
          console.log(`⚡ Court tagStatus updated in real-time: ${updatedCourt.tagStatus}`);
          return {
            ...c,
            status: updatedCourt.status,
            currentLiveStatus: updatedCourt.tagStatus || "available",
          };
        });
      });
    };

    socket.on("booking_change", handleBookingChange);
    socket.on("court_updated", handleCourtUpdated);

    return () => {
      socket.off("booking_change", handleBookingChange);
      socket.off("court_updated", handleCourtUpdated);
    };
  }, [socket, date]);

  // Tái thiết lập cấu trúc gridData tương thích ngược cho component TimeGrid
  const timeHeaders = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => {
    const startH = i + START_HOUR;
    return `${startH.toString().padStart(2, "0")}:00`;
  });

  const gridData = React.useMemo(() => {
    return courts.map((court) => ({
      ...court,
      slots: timeHeaders.map((timeHeader) => {
        const key = `${court._id}_${timeHeader}`;
        return (
          slotsMap[key] || {
            time: `${timeHeader} - ${(parseInt(timeHeader) + 1).toString().padStart(2, "0")}:00`,
            startTime: timeHeader,
            endTime: `${(parseInt(timeHeader) + 1).toString().padStart(2, "0")}:00`,
            status: "available",
            bookingInfo: null,
            isPast: false,
            pricePerHour: 0,
            isNewUpdate: false,
          }
        );
      }),
    }));
  }, [courts, slotsMap, timeHeaders]);

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
    timeHeaders,
  };
};
