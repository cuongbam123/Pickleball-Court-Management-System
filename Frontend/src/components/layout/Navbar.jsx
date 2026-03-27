import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const Navbar = ({ onToggleSidebar }) => {
  const userRole = useAuthStore((state) => state.user?.role) || "User";

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
            aria-label="Open sidebar"
          >
            <span className="text-lg">☰</span>
          </button>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Pickleball Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              Quản lý sân • cộng đồng • vận hành
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:inline-flex">
            Thông báo
          </button>

          <div ref={dropdownRef} className="relative">
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-white uppercase">
                {userRole.charAt(0)}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold capitalize text-slate-900">{userRole}</p>
                <p className="text-xs text-slate-500">Người dùng</p>
              </div>
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
                <Link
                  to="/Logout"
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  onClick={() => setIsDropdownOpen(false)} 
                >
                  Đăng xuất
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
export default Navbar;