import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
    <div className="mx-auto w-full max-w-[95%] lg:max-w-[90%] space-y-6 px-4 py-8 font-sans">
      
      {/* Title with Back Button */}
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#064e3b] hover:border-lime-400 shadow-sm transition-all hover:scale-105"
          title="Quay lại Hồ sơ"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-black text-[#064e3b] uppercase tracking-wide">
          Lịch sử đặt sân của tôi
        </h1>
      </div>

      {/* Tabs điều hướng */}
      <div className="flex border-b border-slate-200">
        <button 
          className={`px-6 py-3 text-sm font-semibold transition-colors duration-250 cursor-pointer ${tab === 'upcoming' ? 'border-b-2 border-[#064e3b] text-[#064e3b]' : 'text-slate-500 hover:text-[#064e3b]'}`}
          onClick={() => setTab('upcoming')}
        >
          Sắp tới
        </button>
        <button 
          className={`px-6 py-3 text-sm font-semibold transition-colors duration-250 cursor-pointer ${tab === 'past' ? 'border-b-2 border-[#064e3b] text-[#064e3b]' : 'text-slate-500 hover:text-[#064e3b]'}`}
          onClick={() => setTab('past')}
        >
          Lịch sử chơi
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-6 overflow-hidden">
        <BookingHistoryTable
          data={filteredData}
          isLoading={isLoading}
          showDepositColumn={false}
          renderActions={tab === 'upcoming' ? renderUserActions : null}
        />
      </div>
    </div>
    </MainLayout>
  );
};

export default MyBookingPage;
