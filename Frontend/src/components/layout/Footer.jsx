import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="border-t border-slate-100 bg-white font-sans">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo className="text-primary-dark" />
            <p className="text-sm leading-relaxed text-slate-700">
              Nền tảng quản lý sân và cộng đồng Pickleball, hỗ trợ đặt sân, giải đấu
              và kết nối người chơi.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">Khám phá</h3>
            <div className="flex flex-col gap-2.5 text-sm text-slate-700">
              <Link to="/booking" className="hover:text-primary-dark transition-colors">Đặt sân</Link>
              <Link to="/shared-matches" className="hover:text-primary-dark transition-colors">Sân ghép</Link>
              <Link to="/tournaments" className="hover:text-primary-dark transition-colors">Giải đấu</Link>
              <Link to="/ranking" className="hover:text-primary-dark transition-colors">Xếp hạng</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">Hệ thống</h3>
            <div className="flex flex-col gap-2.5 text-sm text-slate-700">
              <Link to="/branches" className="hover:text-primary-dark transition-colors">Chi nhánh</Link>
              <Link to="/about" className="hover:text-primary-dark transition-colors">Về chúng tôi</Link>
              <Link to="/contact" className="hover:text-primary-dark transition-colors">Liên hệ</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">Liên hệ</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <p>📧 Email: support@pickleballhub.vn</p>
              <p>📞 Hotline: 0123 456 789</p>
              <p>⏰ Giờ hoạt động: 06:00 - 22:00</p>
            </div>
          </div>
        </div>

        <div className="my-8 h-px w-full bg-slate-100" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} Pickleball Hub. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-primary-dark transition-colors">Chính sách bảo mật</Link>
            <Link to="/terms" className="hover:text-primary-dark transition-colors">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;