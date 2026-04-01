import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Nền tảng quản lý sân và cộng đồng Pickleball, hỗ trợ đặt sân, giải đấu
              và kết nối người chơi.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Khám phá</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
              <Link to="/booking" className="hover:text-emerald-600">Đặt sân</Link>
              <Link to="/shared-match" className="hover:text-emerald-600">Sân ghép</Link>
              <Link to="/tournaments" className="hover:text-emerald-600">Giải đấu</Link>
              <Link to="/ranking" className="hover:text-emerald-600">Xếp hạng</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Hệ thống</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
              <Link to="/branches" className="hover:text-emerald-600">Chi nhánh</Link>
              <Link to="/about" className="hover:text-emerald-600">Về chúng tôi</Link>
              <Link to="/contact" className="hover:text-emerald-600">Liên hệ</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Liên hệ</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Email: support@pickleballhub.vn</p>
              <p>Hotline: 0123 456 789</p>
              <p>Giờ hoạt động: 06:00 - 22:00</p>
            </div>
          </div>
        </div>

        <div className="my-8 h-px w-full bg-slate-200" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} Pickleball Hub. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-emerald-600">Chính sách bảo mật</Link>
            <Link to="/terms" className="hover:text-emerald-600">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;