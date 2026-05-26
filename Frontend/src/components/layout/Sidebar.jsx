// import React from "react";
// import { Link, useLocation } from "react-router-dom";
// import { useAuthStore } from "../../store/authStore";
// const menuItems = [
//   { label: "Tổng quan", path: "/", roles: ["admin", "staff", "customer"] },
//   { label: "Quản lý sân", path: "/facility", roles: ["admin", "staff"] },
//   { label: "Lịch đặt sân", path: "/booking",roles: ["admin", "staff", "customer"] },
//   { label: "POS", path: "/pos",roles: ["admin","customer"] },
//   { label: "Giải đấu", path: "/tournament",roles: ["admin", "staff", "customer"] },
//   { label: "Admin", path: "/admin",roles: ["admin"] },
// ];

// const Sidebar = ({ onNavigate }) => {
//   const location = useLocation();
//   const currentRole = useAuthStore((state) => state.role) || "customer";
//   const allowedMenuItems = menuItems.filter((item) =>
//     item.roles.includes(currentRole)
//   );
//   return (
//     <aside className="flex h-full w-72 flex-col border-r border-slate-800 bg-slate-950 text-white">
//       <div className="border-b border-slate-800 px-5 py-5">
//         <div className="flex items-center gap-3">
//           <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg font-black text-white shadow-lg">
//             P
//           </div>

//           <div>
//             <h2 className="text-base font-bold tracking-wide text-white">
//               Pickleball Hub
//             </h2>
//             <p className="text-xs text-slate-400">
//               Dashboard System
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="px-3 py-4">
//         <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
//           Navigation
//         </p>

//           <nav className="space-y-1">
//             {allowedMenuItems.map((item) => {
//             const isActive = location.pathname === item.path;
//             return (
//               <Link
//                 key={item.path}
//                 to={item.path}
//                 onClick={onNavigate}
//                 className={`group flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
//                   isActive
//                     ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
//                     : "text-slate-300 hover:bg-slate-900 hover:text-white"
//                 }`}
//               >
//                 <span className="mr-3 inline-block h-2.5 w-2.5 rounded-full bg-current opacity-80" />
//                 {item.label}
//               </Link>
//             );
//           })}
//         </nav>
//       </div>

//       <div className="mt-auto p-4">
//         <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
//           <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
//             System Status
//           </p>
//           <p className="mt-2 text-sm text-slate-300">
//             Layout ready for booking, POS và role-based dashboard.
//           </p>
//         </div>
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, LogOut, Moon, Sun } from "lucide-react";

const Sidebar = ({
  items = [],
  collapsed = false,
  onToggleCollapse,
  isDarkMode = false,
  onToggleTheme,
  onItemClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className={clsx(
        "flex min-h-screen flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/95 lg:block",
        collapsed ? "w-[88px]" : "w-72",
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200/80 p-4 dark:border-slate-700">
        <Logo compact={collapsed} />
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:inline-flex"
            title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        ) : null}
      </div>

      <div className="flex-1 px-3 py-4">
        {!collapsed ? (
          <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Điều hướng
          </p>
        ) : null}
        {items.map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onItemClick}
              className={clsx(
                "mb-1.5 flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center gap-0" : "gap-2",
                isActive
                  ? "bg-emerald-50 text-[#064e3b] shadow-sm ring-1 ring-emerald-100 dark:bg-emerald-950/20 dark:text-lime-400 dark:ring-lime-450/20"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
              )}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={clsx(
                  "h-2.5 w-2.5 rounded-full transition",
                  isActive ? "bg-[#064e3b] dark:bg-lime-400" : "bg-slate-300 dark:bg-slate-500",
                )}
              />
              {!collapsed ? item.label : null}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-slate-200/80 p-3 dark:border-slate-700">
        <button
          type="button"
          onClick={onToggleTheme}
          className="mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          title={isDarkMode ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed ? (isDarkMode ? "Light mode" : "Dark mode") : null}
        </button>
        <button
          type="button"
          onClick={() => navigate("/logout")}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/20"
          title="Đăng xuất"
        >
          <LogOut size={16} />
          {!collapsed ? "Đăng xuất" : null}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;