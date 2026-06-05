import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User } from "lucide-react";
import Logo from "./Logo";
import Button from "../ui/Button";
import { useAuthStore } from "../../store/authStore";

const Header = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleOpenAdminMenu = () => {
    if (userRole === "admin" || userRole === "staff") {
      setIsOpen(!isOpen);
    } else {
      alert("Bạn không có quyền truy cập khu vực này!");
    }
  };

  const handleGoProfile = () => {
    setIsUserMenuOpen(false);
    navigate("/profile");
  };

  const handleHistory = () => {
    setIsUserMenuOpen(false);
    navigate("/my-bookings");
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    navigate("/logout");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#064e3b]/95 backdrop-blur-md text-white border-b border-emerald-800 shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <Logo className="text-white" />
          </div>

          <nav className="hidden items-center gap-2 lg:flex">
            <Link
              to="/home"
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-white hover:text-lime-400 hover:bg-white/5 transition-all duration-200"
            >
              Trang chủ
            </Link>
            <Link
              to={userRole === "staff" ? "/staff/booking" : "/booking"}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-white hover:text-lime-400 hover:bg-white/5 transition-all duration-200"
            >
              Đặt sân
            </Link>
            <Link
              to="/tournaments"
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-white hover:text-lime-400 hover:bg-white/5 transition-all duration-200"
            >
              Giải đấu
            </Link>
            <Link
              to="/shared-matches"
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-white hover:text-lime-400 hover:bg-white/5 transition-all duration-200"
            >
              Trận chia sẻ
            </Link>
            <Link
              to="/ranking"
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-white hover:text-lime-400 hover:bg-white/5 transition-all duration-200"
            >
              Xếp hạng
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <button
                  type="button"
                  className="relative p-2 text-white/80 hover:text-lime-400 hover:bg-white/5 rounded-xl transition-all"
                  aria-label="Thông báo"
                >
                  <svg
                    className="w-5.5 h-5.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#064e3b] animate-pulse" />
                </button>

                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-xl border border-white/20 px-2 py-2 hover:bg-white/10 sm:gap-3 sm:px-3 text-white transition-all"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 text-sm font-bold text-emerald-950 shadow-sm border border-emerald-900/10">
                      {(user?.full_name || "U").charAt(0).toUpperCase()}
                    </div>

                    <div className="hidden text-left sm:block">
                      <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                        {user?.full_name || "Người dùng"}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-lime-400 text-emerald-950 uppercase tracking-wider">
                          VIP
                        </span>
                      </p>
                    </div>

                    <ChevronDown
                      size={16}
                      className={`text-white/80 transition-transform ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-emerald-900 bg-[#043327] shadow-xl text-white">
                      <button
                        type="button"
                        onClick={handleGoProfile}
                        className="w-full px-4 py-4 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 text-sm font-bold text-emerald-950">
                            {(user?.full_name || "U").charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                              {user?.full_name || "Người dùng"}
                            </p>
                            <p className="truncate text-xs text-white/70">
                              {user?.email || "Chưa có email"}
                            </p>
                            <p className="mt-1 text-xs capitalize text-lime-400 font-bold">
                              {user?.role || "customer"}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="border-t border-emerald-800" />

                      <button
                        type="button"
                        onClick={handleGoProfile}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        <User size={16} className="text-lime-400" />
                        Thông tin cá nhân
                      </button>
                      <button 
                        type="button"
                        onClick={handleHistory}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        <ChevronDown size={16} className="rotate-90 text-lime-400" />
                        Lịch sử đặt sân
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-950/40 transition-colors border-t border-emerald-800"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  as={Link}
                  to="/login"
                  variant="ghost"
                  className="px-3 py-2 text-sm text-white hover:text-lime-400 hover:bg-white/10"
                >
                  Đăng nhập
                </Button>
                <Button as={Link} to="/register" className="px-3 py-2 text-sm bg-lime-400 text-emerald-950 hover:bg-lime-300">
                  Đăng ký
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute top-0 left-0 h-full w-72 max-w-[85%] bg-white shadow-xl transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <Logo />
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-2 text-slate-700 hover:bg-slate-100"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-4">
            <Link
              to="/home"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
            >
              Trang chủ
            </Link>
            <Link
              to={userRole === "staff" ? "/staff/booking" : "/booking"}
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
            >
              Đặt sân
            </Link>
            <Link
              to="/tournaments"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
            >
              Giải đấu
            </Link>
            <Link
              to="/ranking"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600"
            >
              Xếp hạng
            </Link>
          </nav>

          {!user && (
            <div className="flex flex-col gap-3 border-t border-slate-200 p-4">
              <Button
                as={Link}
                to="/login"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                Đăng nhập
              </Button>
              <Button as={Link} to="/register" onClick={() => setIsOpen(false)}>
                Đăng ký
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
