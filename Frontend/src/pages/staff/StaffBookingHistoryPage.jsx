import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useBookingHistory from '../../features/booking/hooks/useBookingHistory';
import BookingHistoryTable from '../../features/booking/components/BookingHistoryTable';
import StaffLayout from '../../layouts/StaffLayout';
import { getOrders } from '../../features/order/api/orderApi';

const StaffBookingHistoryPage = () => {
  const navigate = useNavigate();
  const [isResolvingOrder, setIsResolvingOrder] = useState(false);

  // 1. GỌI HOOK LẤY DỮ LIỆU
  // Hook của chúng ta đã rất thông minh, tự động check Role từ Zustand 
  // nên không cần truyền biến phân biệt 'all' hay 'me' nữa.
  const {
    historyData,
    isLoading,
    filters,
    branches,   
    courtsList,
    setFilters,
    isBranchLocked,
    changeBookingStatus,
    handleCancelBooking
  } = useBookingHistory({ status: '' }); // Mặc định lấy tất cả trạng thái

  // 2. XỬ LÝ SỰ KIỆN NÚT BẤM CÓ CẢNH BÁO (Confirm)
  const handleCheckIn = async (bookingId) => {
    if (window.confirm('Xác nhận khách đã đến sân và bắt đầu tính giờ?')) {
      const res = await changeBookingStatus(bookingId, 'playing');
      if (res.success) {
        alert('Check-in thành công!');
      } else {
        alert('Lỗi: ' + res.message);
      }
    }
  };

  const handleViewInvoice = async (bookingId) => {
    try {
      setIsResolvingOrder(true);
      const response = await getOrders({ booking_id: bookingId });
      const orders = response?.data?.data || [];
      const orderId = orders[0]?._id;

      if (!orderId) {
        alert('Chưa tìm thấy hóa đơn cho lịch đặt sân này.');
        return;
      }

      navigate(`/admin/orders/${orderId}`);
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể mở hóa đơn.');
    } finally {
      setIsResolvingOrder(false);
    }
  };

  const handleCancel = async (bookingId) => {
    // Cho phép staff nhập lý do hủy, nếu bấm Cancel thì hàm trả về null -> Không làm gì cả
    const reason = window.prompt('Nhập lý do hủy đơn (Bỏ trống cũng được):', 'Khách yêu cầu hủy');
    if (reason !== null) { 
      const res = await handleCancelBooking(bookingId, reason);
      if (res.success) {
        alert('Hủy đơn thành công!');
      } else {
        alert('Lỗi: ' + res.message);
      }
    }
  };

  // 3. ĐỊNH NGHĨA CỘT HÀNH ĐỘNG DÀNH RIÊNG CHO STAFF
  // Hàm này sẽ được truyền xuống component Table
  const renderStaffActions = (row) => {
    return (
      <div className="flex justify-center gap-2">
        {/* Nút Check-in: Chỉ hiện khi trạng thái là 'deposited' (Đã cọc) */}
        {row.status === 'deposited' && (
          <button
            onClick={() => handleCheckIn(row._id)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            Check-in
          </button>
        )}

        {/* Nút Hủy: Hiện khi chưa chơi (holding hoặc deposited) */}
        {(row.status === 'holding' || row.status === 'pending_deposit' || row.status === 'deposited') && (
          <button
            onClick={() => handleCancel(row._id)}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-500 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
          >
            Hủy đơn
          </button>
        )}

        {/* Đang chơi thì báo chờ thanh toán ở quầy POS */}
        {row.status === 'playing' && (
          <span className="text-xs italic text-blue-600 font-medium">Đang chơi...</span>
        )}

        {row.status === 'completed' && (
          <button
            type="button"
            disabled={isResolvingOrder}
            onClick={() => handleViewInvoice(row._id)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            Xem hóa đơn
          </button>
        )}

        {(row.status === 'deposited' || row.status === 'playing') && (
          <Link
            to={`/staff/checkout/${row._id}`}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Checkout
          </Link>
        )}
      </div>
    );
  };

  // 4. VẼ GIAO DIỆN TRANG CHÍNH
  return (
    <StaffLayout>
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Box Tiêu đề & Thanh Công Cụ Lọc */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Quản lý Đặt sân</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. MAP DATA CHI NHÁNH VÀO DROPDOWN */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Chi nhánh</label>
          <select
            className="p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
            value={filters.branch_id || ''}
            disabled={isBranchLocked}
            onChange={(e) => setFilters({ ...filters, branch_id: e.target.value, court_id: '' })}
          >
            {!isBranchLocked && <option value="">Tất cả chi nhánh</option>}
            {isBranchLocked && !filters.branch_id && (
              <option value="">Chưa gán chi nhánh</option>
            )}
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name} {/* Thay branch.name bằng tên trường đúng trong DB của bạn */}
              </option>
            ))}
          </select>
        </div>

          {/* 2. Lọc theo Sân (Court) */}
          <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Sân</label>
          <select
            className="p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white"
            value={filters.court_id || ''}
            onChange={(e) => setFilters({ ...filters, court_id: e.target.value })}
          >
            <option value="">Tất cả các sân</option>
            {courtsList.map((court) => (
              <option key={court._id} value={court._id}>
                {court.name} {/* Thay court.name bằng tên trường đúng trong DB của bạn */}
              </option>
            ))}
          </select>
        </div>
            
          {/* 3. Lọc theo Ngày */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Ngày chơi</label>
            <input
              type="date"
              className="p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white"
              value={filters.date || ''}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>

          {/* 4. Lọc theo Trạng thái */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Trạng thái</label>
            <select
              className="p-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white"
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="holding">Chờ cọc</option>
              <option value="deposited">Đã cọc (Chờ chơi)</option>
              <option value="playing">Đang chơi</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

        </div>
      </div>

      {/* Gọi Component Bảng và truyền "quyền sinh sát" (renderStaffActions) xuống cho nó */}
      <BookingHistoryTable
        data={historyData}
        isLoading={isLoading}
        showDepositColumn={false}
        renderActions={renderStaffActions}
      />
      
    </div>
    </StaffLayout>
  );
};

export default StaffBookingHistoryPage;
