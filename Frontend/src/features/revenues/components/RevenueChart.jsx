import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import dayjs from "dayjs";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <p className="mb-2 font-bold text-slate-800 dark:text-slate-100">
          Ngày {dayjs(label).format("DD/MM/YYYY")}
        </p>
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="text-slate-900 dark:text-white">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ reportData }) => {
  // Gom nhóm dữ liệu theo ngày từ tất cả các chi nhánh có trong báo cáo
  const getChartData = () => {
    const dataByDate = {};
    
    reportData.forEach((record) => {
      const dateStr = record.date;
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = {
          date: dateStr,
          "Tiền cọc sân": 0,
          "Doanh thu POS": 0,
          "Tổng doanh thu": 0,
        };
      }
      dataByDate[dateStr]["Tiền cọc sân"] += record.deposit_revenue || 0;
      dataByDate[dateStr]["Doanh thu POS"] += record.pos_revenue || 0;
      dataByDate[dateStr]["Tổng doanh thu"] += record.total_revenue || 0;
    });

    return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = getChartData();

  if (chartData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-slate-500 dark:text-slate-400">
        Không có dữ liệu biểu đồ
      </div>
    );
  }

  return (
    <div className="h-96 w-full text-slate-900 dark:text-white">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
        >
          <defs>
            {/* Tạo dải màu chuyển sắc gradient mượt mà cho đường diện tích tổng doanh thu */}
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-slate-200 dark:stroke-slate-800"
            vertical={false}
          />
          
          <XAxis
            dataKey="date"
            tickFormatter={(date) => dayjs(date).format("DD/MM")}
            tickLine={false}
            axisLine={false}
            className="text-xs fill-slate-500 dark:fill-slate-400 font-medium"
            dy={8}
          />
          
          <YAxis
            tickFormatter={(val) => {
              if (val >= 1000000) return `${val / 1000000}M`;
              if (val >= 1000) return `${val / 1000}K`;
              return val;
            }}
            tickLine={false}
            axisLine={false}
            className="text-xs fill-slate-500 dark:fill-slate-400 font-medium"
            dx={-8}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.05)" }} />
          
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            className="text-xs font-semibold"
          />

          {/* Cột xếp chồng: Tiền cọc + POS */}
          <Bar
            dataKey="Tiền cọc sân"
            stackId="a"
            fill="#10b981" // Emerald
            barSize={24}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="Doanh thu POS"
            stackId="a"
            fill="#8b5cf6" // Violet
            barSize={24}
            radius={[4, 4, 0, 0]}
          />

          {/* Đường diện tích phủ lên biểu diễn Tổng doanh thu */}
          <Area
            type="monotone"
            dataKey="Tổng doanh thu"
            stroke="#3b82f6" // Blue
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorTotal)"
            dot={{ r: 4, strokeWidth: 1.5, fill: "#fff" }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
