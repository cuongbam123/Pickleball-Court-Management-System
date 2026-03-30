import React from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Button from "../../components/ui/Button";

const HomePage = () => {
  return (
    <MainLayout>
      <section className="mx-auto max-w-7xl px-4 py-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              Hệ thống quản lý sân & cộng đồng Pickleball
            </p>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">
              Đặt sân nhanh hơn
              <span className="block text-emerald-600">Quản lý dễ hơn</span>
              Kết nối người chơi tốt hơn
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Nền tảng dành cho người chơi, nhân viên và chủ sân với lịch đặt sân trực quan,
              sân ghép, giải đấu, xếp hạng kỹ năng và quản lý vận hành trong cùng một hệ thống.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/login" size="lg">
                Đăng nhập
              </Button>

              <Button as={Link} to="/register" variant="secondary" size="lg">
                Đăng ký
              </Button>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-4">
              <StatCard title="24/7" desc="Đặt sân online" />
              <StatCard title="Realtime" desc="Cập nhật lịch sân" />
              <StatCard title="All-in-one" desc="Booking & Community" />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Booking Calendar</p>
                <h3 className="text-xl font-bold text-slate-900">
                  Lịch sân hôm nay
                </h3>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                Đang hoạt động
              </div>
            </div>

            <div className="space-y-3">
              <BookingRow time="06:00 - 07:00" court="Sân 1" status="Trống" type="empty" />
              <BookingRow time="07:00 - 08:00" court="Sân 2" status="Đã cọc" type="deposit" />
              <BookingRow time="08:00 - 09:00" court="Sân 3" status="Đang chơi" type="playing" />
              <BookingRow time="09:00 - 10:00" court="Sân 4" status="Sân ghép" type="shared" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniInfo title="Giải đấu sắp tới" value="Spring Open" />
              <MiniInfo title="Xếp hạng nổi bật" value="Rank B" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:py-14">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Tính năng nổi bật
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Một hệ thống cho toàn bộ vận hành sân
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Từ đặt sân, thanh toán, sân ghép đến giải đấu và xếp hạng người chơi.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            title="Đặt sân trực quan"
            desc="Hiển thị lịch trống theo khung giờ rõ ràng, dễ thao tác trên cả desktop và mobile."
          />
          <FeatureCard
            title="Sân ghép linh hoạt"
            desc="Cho phép người chơi mua vé lẻ, tham gia ca chơi ghép và kết nối cộng đồng."
          />
          <FeatureCard
            title="Giải đấu & xếp hạng"
            desc="Tạo giải đấu, kiểm tra điều kiện tham gia và cập nhật rank kỹ năng."
          />
          <FeatureCard
            title="POS & thanh toán"
            desc="Hỗ trợ tính tiền sân, dịch vụ phát sinh và đồng bộ trạng thái thanh toán."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <HighlightCard
            title="Cho người chơi"
            items={[
              "Xem lịch sân và đặt sân online",
              "Tham gia sân ghép và giải đấu",
              "Theo dõi rank và điểm thành viên",
            ]}
          />
          <HighlightCard
            title="Cho nhân viên"
            items={[
              "Nhận khách và tạo booking offline",
              "Bán hàng tại quầy và tính tiền nhanh",
              "Cập nhật trạng thái sân theo thời gian thực",
            ]}
          />
          <HighlightCard
            title="Cho chủ sân"
            items={[
              "Quản lý chi nhánh, sân bãi và giá linh hoạt",
              "Phân quyền nhân viên rõ ràng",
              "Theo dõi vận hành và tối ưu doanh thu",
            ]}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="rounded-[32px] bg-slate-900 px-6 py-10 text-center lg:px-12">
          <p className="text-sm font-medium text-emerald-300">
            Bắt đầu trải nghiệm hệ thống
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            Sẵn sàng đặt sân hoặc quản lý sân của bạn?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Xây dựng trải nghiệm đặt sân mượt mà hơn cho khách hàng và vận hành chuyên nghiệp hơn cho chủ sân.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button as={Link} to="/register" size="lg">
              Tạo tài khoản
            </Button>
            <Button as={Link} to="/login" variant="secondary" size="lg">
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

const StatCard = ({ title, desc }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-lg font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
};

const BookingRow = ({ time, court, status, type }) => {
  const statusClasses = {
    empty: "bg-slate-100 text-slate-700",
    deposit: "bg-amber-100 text-amber-700",
    playing: "bg-emerald-100 text-emerald-700",
    shared: "bg-sky-100 text-sky-700",
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{time}</p>
        <p className="text-sm text-slate-500">{court}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[type]}`}>
        {status}
      </span>
    </div>
  );
};

const MiniInfo = ({ title, value }) => {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
};

const FeatureCard = ({ title, desc }) => {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-600">
        P
      </div>
      <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
};

const HighlightCard = ({ title, items }) => {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <p className="text-sm leading-6 text-slate-600">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;