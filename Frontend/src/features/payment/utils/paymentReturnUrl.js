export const getPaymentResultReturnUrl = () => {
  return `${window.location.origin}/payment-result`;
};

/** Đường dẫn lịch đặt sân theo role sau thanh toán */
export const getBookingHistoryPathByRole = (role) => {
  switch (role) {
    case "admin":
    case "super_admin":
    case "staff":
      return "/admin/booking-history";
    case "manager":
      return "/home";
    case "customer":
    default:
      return "/my-bookings";
  }
};
