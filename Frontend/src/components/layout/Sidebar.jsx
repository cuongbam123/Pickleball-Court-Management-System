import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
const menuItems = [
  { label: "Tổng quan", path: "/", roles: ["admin", "staff", "customer"] },
  { label: "Quản lý sân", path: "/facility", roles: ["admin", "staff"] },
  { label: "Lịch đặt sân", path: "/booking",roles: ["admin", "staff", "customer"] },
  { label: "POS", path: "/pos",roles: ["admin","customer"] },
  { label: "Giải đấu", path: "/tournament",roles: ["admin", "staff", "customer"] },
  { label: "Admin", path: "/admin",roles: ["admin"] },
];

const Sidebar = ({ onNavigate }) => {
  const location = useLocation();
  const currentRole = useAuthStore((state) => state.role) || "customer";
  const allowedMenuItems = menuItems.filter((item) =>
    item.roles.includes(currentRole)
  );
  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-800 bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg font-black text-white shadow-lg">
            P
          </div>

          <div>
            <h2 className="text-base font-bold tracking-wide text-white">
              Pickleball Hub
            </h2>
            <p className="text-xs text-slate-400">
              Dashboard System
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 py-4">
        <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Navigation
        </p>

          <nav className="space-y-1">
            {allowedMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`group flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <span className="mr-3 inline-block h-2.5 w-2.5 rounded-full bg-current opacity-80" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            System Status
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Layout ready for booking, POS và role-based dashboard.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;