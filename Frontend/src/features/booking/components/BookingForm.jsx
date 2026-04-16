import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import dayjs from "dayjs";
import Button from "../../../components/ui/Button";
import { createBooking, payBooking } from "../api/bookingApi";

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
  const navigate = useNavigate();

  const { user, access_token } = useAuthStore();
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      alert("Vui lòng đăng nhập để tiếp tục đặt sân!");
      // Chuyển hướng sang trang login, có thể truyền thêm tham số redirect để login xong quay lại đây
      navigate("/login?redirect=/booking");
      return; // Dừng lại, không chạy code API bên dưới
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
      buffer_time: 0,
      booking_type: "standard",
      customer_info: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      },
    };
    try {
      // Gọi API tạo đơn đặt sân (Booking nháp)
      const response = await createBooking(bookingPayload);
      const bookingId = response?.data?.data?._id;

      // ==========================================
      // T3: XỬ LÝ THANH TOÁN DỰA TRÊN ROLE
      // ==========================================
      if (user.role === "staff" || user.role === "admin") {
        // Nếu là Staff / Admin -> Đặt sân nội bộ, không cần cọc
        alert("Giữ chỗ thành công! (Tài khoản nội bộ miễn cọc)");

        // Refresh lại lưới thời gian hoặc dọn sạch Form
        // setSelectedSlots([]);
        // refreshGrid();
      } else {
        // Nếu là Customer -> Bắt buộc phải cọc
        alert(
          "Đặt sân thành công! Đang chuyển hướng sang trang thanh toán cọc...",
        );
      }
    } catch (error) {
      console.error("Lỗi khi tạo booking:", error);
      alert(error?.response?.data?.message || "Có lỗi xảy ra khi đặt sân!");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-4">
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-orange-400 pl-2">
        Đặt sân theo yêu cầu
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Họ và tên (Cho sửa) */}
        <input
          required
          type="text"
          name="name"
          placeholder="Họ và tên"
          value={formData.name}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
        />
        {/* Email (KHÔNG cho sửa) */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          readOnly
          className="w-full rounded-lg border border-slate-300 bg-slate-100 text-slate-500 px-3 py-2 outline-none cursor-not-allowed"
          title="Không thể chỉnh sửa Email"
        />
        {/* Số điện thoại (Cho sửa) */}
        <input
          required
          type="text"
          name="phone"
          placeholder="Số điện thoại"
          value={formData.phone}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
        />
        {/* Chọn ngày và giờ (Tự động điền từ Lưới) */}
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={dayjs(selectedDate).format("DD/MM/YYYY")}
            className="w-1/2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none"
          />
          <input
            type="text"
            readOnly
            value={mergedTime} // Hiển thị giờ đã ghép (VD: 17:00 - 19:00)
            className="w-1/2 rounded-lg border border-slate-300 bg-blue-50 px-3 py-2 outline-none text-blue-700 font-bold text-center"
            placeholder="Chọn giờ"
          />
        </div>
        {/* Thời lượng */}
        {durationHours > 0 && (
          <div className="flex justify-between items-center bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 shadow-sm mt-4">
            <span className="font-medium">Tổng tiền sân:</span>
            <span className="text-xl font-bold">
              {estimatedPrice.toLocaleString("vi-VN")} VNĐ
            </span>
          </div>
        )}
        <div className="flex justify-between items-center bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 mt-2">
          <span className="font-medium">Giá cọc:</span>
          <span className="text-xl font-bold">
            {(estimatedPrice / 2).toLocaleString("vi-VN")} VNĐ
          </span>
        </div>
        {/* Ghi chú */}
        <textarea
          name="note"
          rows="3"
          placeholder="Ghi chú"
          value={formData.note}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
        ></textarea>
        <Button
          type="submit"
          className="w-full bg-blue-200 text-blue-800 hover:bg-blue-300 font-bold py-3 rounded-xl transition-colors"
        >
          Đặt sân
        </Button>
        submit
      </form>
    </div>
  );
};

export default BookingForm;
