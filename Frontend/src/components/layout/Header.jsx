import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User } from "lucide-react";
import Logo from "./Logo";
import Button from "../ui/Button";

const Header = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGoProfile = () => {
    setIsUserMenuOpen(false);
    navigate("/profile");
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    navigate("/logout");
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <Logo />
          </div>

          <nav className="hidden items-center gap-6 lg:flex">
            <Link
              to="/home"
              className="text-sm font-medium text-slate-700 hover:text-emerald-600"
            >
              Trang chủ
            </Link>
            <Link
              to="/booking"
              className="text-sm font-medium text-slate-700 hover:text-emerald-600"
            >
              Đặt sân
            </Link>
            <Link
              to="/tournaments"
              className="text-sm font-medium text-slate-700 hover:text-emerald-600"
            >
              Giải đấu
            </Link>
            <Link
              to="/ranking"
              className="text-sm font-medium text-slate-700 hover:text-emerald-600"
            >
              Xếp hạng
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 px-2 py-2 hover:bg-slate-50 sm:gap-3 sm:px-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {(user?.full_name || "U").charAt(0).toUpperCase()}
                  </div>

                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.full_name || "Người dùng"}
                    </p>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={handleGoProfile}
                      className="w-full px-4 py-4 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                          {(user?.full_name || "U").charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {user?.full_name || "Người dùng"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {user?.email || "Chưa có email"}
                          </p>
                          <p className="mt-1 text-xs capitalize text-slate-500">
                            {user?.role || "customer"}
                          </p>
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={handleGoProfile}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <User size={16} />
                      Thông tin cá nhân
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  as={Link}
                  to="/login"
                  variant="ghost"
                  className="px-3 py-2 text-sm"
                >
                  Đăng nhập
                </Button>
                <Button as={Link} to="/register" className="px-3 py-2 text-sm">
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
              to="/booking"
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
