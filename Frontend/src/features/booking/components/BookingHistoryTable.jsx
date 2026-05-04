import React from 'react';
import dayjs from 'dayjs';
// Nhớ kiểm tra lại đường dẫn import Table này cho đúng với thư mục của bạn nhé!
import Table from '../../../components/ui/Table'; 

const BookingHistoryTable = ({ data, isLoading, renderActions }) => {
  
  // 1. HÀM PHỤ TRỢ: Tự động đổi màu Trạng thái
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_deposit':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Chờ cọc</span>;
      case 'deposited':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Đã cọc / Chờ chơi</span>;
      case 'playing':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 animate-pulse">Đang chơi...</span>;
      case 'completed':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Đã hủy</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // 2. KHAI BÁO CẤU TRÚC CÁC CỘT (Columns) CHO TABLE
  const columns = [
    {
      title: "Mã đơn",
      key: "id",
      render: (row) => (
        <span className="font-mono text-sm text-slate-500">
          #{row._id?.slice(-6).toUpperCase()}
        </span>
      )
    },
    {
      title: "Ngày chơi",
      key: "date",
      render: (row) => (
        <span className="font-medium text-slate-700">
          {dayjs(row.start_time).format('DD/MM/YYYY')}
        </span>
      )
    },
    {
      title: "Khung giờ",
      key: "time",
      render: (row) => (
        <span className="font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
          {dayjs(row.start_time).format('HH:mm')} - {dayjs(row.end_time).format('HH:mm')}
        </span>
      )
    },
    {
      title: "Sân",
      key: "court",
      render: (row) => (
        <span className="text-slate-600 font-medium">
          {row.court_id?.name || 'Sân đã xóa'}
        </span>
      )
    },
    {
      title: "Tiền sân",
      key: "price",
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.total_court_price?.toLocaleString('vi-VN')} đ
        </span>
      )
    },
    {
      title: "Tiền cọc",
      key: "price_deposit",
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.deposit_amount?.toLocaleString('vi-VN')} đ
        </span>
      )
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (row) => getStatusBadge(row.status)
    }
  ];

if (renderActions) {
    columns.push({
      title: "Hành động",
      key: "actions",
      render: (row) => {
        if (row.status === 'cancelled') {
          return <span className="text-xs italic text-slate-400">Đã hủy</span>;
        }
        
        if (row.status === 'completed') {
          return <span className="text-xs italic text-slate-400">Đã kết thúc</span>;
        }

        // Các trạng thái bình thường khác thì vẫn nhường quyền cho trang Cha vẽ nút
        return renderActions(row);
      }
    });
  }

  // 3. TRUYỀN DATA VÀO COMPONENT TABLE DÙNG CHUNG
  return (
    <Table 
      columns={columns} 
      data={data || []} 
      loading={isLoading} 
      rowKey="_id" 
      emptyText="Chưa có lịch sử đặt sân nào."
    />
  );
};

export default BookingHistoryTable;