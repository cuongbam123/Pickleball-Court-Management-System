import React from "react";
import UserLayout from "../../layouts/UserLayout";
import Button from "../../components/ui/Button";

const UserHome = ({ user }) => {
  return (
    <UserLayout user={user}>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              Chào mừng quay lại
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">
              Xin chào {user?.full_name || "người chơi"}
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Bạn có thể đặt sân, tham gia sân ghép, theo dõi giải đấu và xem xếp hạng của mình ngay tại đây.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button as="a" href="/booking" size="lg">
                Đặt sân ngay
              </Button>
              <Button as="a" href="/tournaments" variant="secondary" size="lg">
                Xem giải đấu
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">Tổng quan người chơi</h3>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Card title="Rank hiện tại" value="B" />
              <Card title="Điểm thành viên" value="1.250" />
              <Card title="Lịch sắp tới" value="2 ca" />
              <Card title="Giải đấu" value="1 giải" />
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
};

const Card = ({ title, value }) => {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default UserHome;