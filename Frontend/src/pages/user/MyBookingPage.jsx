import React, { useState } from 'react';
import useBookingHistory from '../../features/booking/hooks/useBookingHistory';
import BookingHistoryTable from '../../features/booking/components/BookingHistoryTable';
import MainLayout from "../../layouts/MainLayout"; 
import Button from '../../components/ui/Button';

const MyBookingPage = () => {
  // Sử dụng mode 'me' để chỉ lấy đơn của chính mình
  const { historyData, isLoading } = useBookingHistory();
  const [tab, setTab] = useState('upcoming');

  // Lọc dữ liệu theo Tab: Sắp tới (chưa chơi) và Lịch sử (đã chơi/hủy)
  const filteredData = historyData.filter(item => {
    if (tab === 'upcoming') return ['holding', 'pending_deposit', 'deposited', 'playing'].includes(item.status);
    return ['completed', 'cancelled'].includes(item.status);
  });

  const renderUserActions = (booking) => (
    <div className="flex justify-center">
      {['holding', 'pending_deposit'].includes(booking.status) && (
        <Button 
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-4"
          onClick={() => window.location.href = `/payment/${booking._id}`}
        >
          Thanh toán cọc
        </Button>
      )}
      {booking.status === 'deposited' && (
        <span className="text-green-600 text-xs font-medium">Đã sẵn sàng</span>
      )}
    </div>
  );

  return (
    <MainLayout>
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Lịch sử đặt sân của tôi</h1>

      {/* Tabs điều hướng */}
      <div className="flex border-b border-slate-200">
        <button 
          className={`px-6 py-3 text-sm font-medium ${tab === 'upcoming' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          onClick={() => setTab('upcoming')}
        >
          Sắp tới
        </button>
        <button 
          className={`px-6 py-3 text-sm font-medium ${tab === 'past' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          onClick={() => setTab('past')}
        >
          Lịch sử chơi
        </button>
      </div>

      <BookingHistoryTable
        data={filteredData}
        isLoading={isLoading}
        showDepositColumn={false}
        renderActions={tab === 'upcoming' ? renderUserActions : null}
      />
    </div>
    </MainLayout>
  );
};

export default MyBookingPage;
