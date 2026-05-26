import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import dayjs from "dayjs";
import Button from "../../../components/ui/Button";
import { createBooking } from "../api/bookingApi";
import { createDepositPaymentUrl } from "../../payment/api/paymentApi";
import { getPaymentResultReturnUrl } from "../../payment/utils/paymentReturnUrl";
import {
  clearPendingBookingDraft,
  readPendingBookingDraft,
  writePendingBookingDraft,
} from "../constants/pendingBooking";

const BookingForm = ({
  selectedSlots,
  selectedDate,
  selectedBranch,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    branch_id: "",
    court_id: "",
    name: "",
    email: "",
    phone: "",
    duration: "1 giờ",
    price: "",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, access_token } = useAuthStore();

  // T4: Tự động fill thông tin khi có selectedSlots
  useEffect(() => {
    if (selectedSlots.length > 0 && selectedSlots[0].userInfo) {
      const info = selectedSlots[0].userInfo;
      setFormData((prev) => ({
        ...prev,
        name: info.name || "",
        email: info.email || "",
        phone: info.phone || "",
      }));
    }
  }, [selectedSlots]);

  useEffect(() => {
    const draft = location.state?.restoreBookingDraft || readPendingBookingDraft();
    if (!draft) return;

    if (draft.formData) {
      setFormData((prev) => ({
        ...prev,
        ...draft.formData,
      }));
    }
    clearPendingBookingDraft();
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const mergedTime =
    selectedSlots.length > 0
      ? `${selectedSlots[0].startTime} - ${selectedSlots[selectedSlots.length - 1].endTime}`
      : "";
  const durationHours = selectedSlots.length;
  const estimatedPrice = selectedSlots.reduce((total, slot) => {
    return total + (slot.pricePerHour || 0);
  }, 0);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Validate Mảng
    if (!selectedSlots || selectedSlots.length === 0) {
      return alert("Vui lòng chọn ít nhất 1 khung giờ trống trên lưới!");
    }
    if (!selectedBranch) {
      return alert("Không tìm thấy thông tin chi nhánh!");
    }
    if (!dayjs(selectedDate).isValid()) {
      return alert("Ngày chọn không hợp lệ!");
    }

    if (!user || !access_token) {
      const redirectPath =
        `${location.pathname}${location.search}${location.hash}` || "/booking";

      const normalizedSlots = selectedSlots.map((slot) => ({
        courtId: slot.courtId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        userInfo: {
          ...(slot.userInfo || {}),
          name: formData.name || slot.userInfo?.name || "",
          phone: formData.phone || slot.userInfo?.phone || "",
          email: formData.email || slot.userInfo?.email || "",
        },
        pricePerHour: slot.pricePerHour || 0,
      }));

      writePendingBookingDraft({
        returnUrl: redirectPath,
        redirect: redirectPath,
        selectedBranch,
        selectedDate: dayjs(selectedDate).toISOString(),
        selectedSlots: normalizedSlots,
        bookingSummary: {
          mergedTime,
          durationHours,
          estimatedPrice,
          depositAmount: Math.round(estimatedPrice / 2),
          courtId: normalizedSlots[0]?.courtId || "",
        },
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          note: formData.note,
        },
      });
      navigate(`/login?returnUrl=${encodeURIComponent(redirectPath)}`, {
        state: {
          from: redirectPath,
          returnUrl: redirectPath,
          reason: "booking_requires_login",
        },
      });
      return;
    }

    // 2. Tách giờ từ phần tử ĐẦU TIÊN và CUỐI CÙNG của mảng
    const [startHour, startMinute] = selectedSlots[0].startTime.split(":");
    const [endHour, endMinute] =
      selectedSlots[selectedSlots.length - 1].endTime.split(":");

    // 3. Convert ra chuẩn ISO có xử lý CA XUYÊN ĐÊM
    let startDayjs = dayjs(selectedDate)
      .hour(Number(startHour))
      .minute(Number(startMinute))
      .second(0);
    let endDayjs = dayjs(selectedDate)
      .hour(Number(endHour))
      .minute(Number(endMinute))
      .second(0);

    // FIX BẪY 1: Nếu giờ kết thúc nhỏ hơn giờ bắt đầu -> Chắc chắn nó đã bước sang ngày hôm sau
    if (endDayjs.isBefore(startDayjs)) {
      endDayjs = endDayjs.add(1, "day");
    }

    const startTime = startDayjs.toISOString();
    const endTime = endDayjs.toISOString();

    // 4. FIX BẪY 2: Đóng gói Payload đẩy đủ data từ Form
    const bookingPayload = {
      branch_id: selectedBranch,
      court_id: selectedSlots[0].courtId,
      start_time: startTime,
      end_time: endTime,
      buffer_time: 10,
      booking_type: "standard",
      customer_info: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      },
    };
    try {
      setIsSubmitting(true);
      // Gọi API tạo đơn đặt sân (Booking nháp)
      const response = await createBooking(bookingPayload);
      const createdBooking = response?.data?.data || {};
      const bookingId =
        createdBooking.booking_id || createdBooking._id || createdBooking.id;

      if (!bookingId) {
        throw new Error("Không lấy được mã lịch đặt sân sau khi giữ chỗ.");
      }

      // ==========================================
      // T3: XỬ LÝ THANH TOÁN DỰA TRÊN ROLE
      // ==========================================
      if (user.role === "staff" || user.role === "admin") {
        // Nếu là Staff / Admin -> Đặt sân nội bộ, không cần cọc
        alert("Giữ chỗ thành công! (Tài khoản nội bộ miễn cọc)");
        onSubmit?.(createdBooking);
        setIsSubmitting(false);

        // Refresh lại lưới thời gian hoặc dọn sạch Form
        // setSelectedSlots([]);
        // refreshGrid();
      } else {
        // Customer phải thanh toán cọc: sinh link VNPay rồi chuyển sang cổng thanh toán.
        const paymentResponse = await createDepositPaymentUrl(bookingId, {
          payment_method: "vnpay",
          redirect_url: getPaymentResultReturnUrl(),
        });
        const paymentUrl = paymentResponse?.data?.data?.payment_url;

        if (!paymentUrl) {
          throw new Error("Không tạo được link thanh toán VNPay.");
        }

        window.location.assign(paymentUrl);
      }
    } catch (error) {
      console.error("Lỗi khi tạo booking:", error);
      alert(error?.response?.data?.message || "Có lỗi xảy ra khi đặt sân!");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 sticky top-20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-300">
      <h3 className="text-base font-extrabold text-[#064e3b] mb-5 border-l-4 border-lime-400 pl-3 uppercase tracking-wider font-sans">
        Đặt sân trực tuyến
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Họ và tên (Cho sửa) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Họ và tên</label>
          <input
            required
            type="text"
            name="name"
            placeholder="Họ và tên người chơi"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-black outline-none transition-all focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20"
          />
        </div>

        {/* Email (KHÔNG cho sửa) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email liên hệ</label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            readOnly
            className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-400 px-3.5 py-2.5 text-sm outline-none cursor-not-allowed"
            title="Không thể chỉnh sửa Email"
          />
        </div>

        {/* Số điện thoại (Cho sửa) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Số điện thoại</label>
          <input
            required
            type="text"
            name="phone"
            placeholder="Số điện thoại liên hệ"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-black outline-none transition-all focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20"
          />
        </div>

        {/* Chọn ngày và giờ (Tự động điền từ Lưới) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Thời gian đặt</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={dayjs(selectedDate).format("DD/MM/YYYY")}
              className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none text-slate-600 font-medium text-center"
            />
            <input
              type="text"
              readOnly
              value={mergedTime} // Hiển thị giờ đã ghép (VD: 17:00 - 19:00)
              className="w-1/2 rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-2.5 text-sm outline-none text-[#064e3b] font-bold text-center"
              placeholder="Chọn giờ"
            />
          </div>
        </div>

        {/* Thời lượng */}
        {durationHours > 0 && (
          <div className="flex justify-between items-center bg-[#064e3b] text-white p-4 rounded-xl border border-emerald-950 mt-4 shadow-sm">
            <span className="font-semibold text-sm">Tổng tiền sân ({durationHours}h):</span>
            <span className="text-lg font-black text-lime-400">
              {estimatedPrice.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center bg-lime-400/10 text-emerald-950 p-4 rounded-xl border border-lime-400/20 mt-2">
          <span className="font-bold text-sm">Tiền cọc cần trả (50%):</span>
          <span className="text-lg font-black text-[#064e3b]">
            {(estimatedPrice / 2).toLocaleString("vi-VN")} đ
          </span>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ghi chú thêm</label>
          <textarea
            name="note"
            rows="2"
            placeholder="Yêu cầu đặc biệt (nếu có)..."
            value={formData.note}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-black outline-none transition focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#064e3b] text-lime-400 hover:bg-lime-400 hover:text-emerald-950 font-black py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <span>Xác nhận đặt sân</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
