import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "../../src/components/layout/Sidebar";
import { useThemeMode } from "../hooks/useThemeMode";
import { useAuthStore } from "../store/authStore";

const adminItems = [
  { label: "Tổng quan", to: "/home" },
  { label: "Quản lý sân", to: "/admin/courts" },
  { label: "Chi nhánh", to: "/admin/branches" },
  { label: "Nhân viên", to: "/admin/staff" },
  { label: "Tất cả người dùng", to: "/admin/users" },
  { label: "Giá", to: "/pricing" },
  { label: "Giải đấu", to: "/tournaments" },
];

const AdminLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeMode();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || "customer";

  const allowedItems = adminItems.filter((item) => {
    if (userRole === "manager") {
      return ["/home", "/admin/staff", "/admin/users"].includes(item.to);
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-transparent dark:bg-slate-950">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar
          items={allowedItems}
          collapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Sidebar mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar mobile drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 transform bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-900 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Admin Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={22} />
          </button>
        </div>

        <Sidebar
          items={allowedItems}
          onItemClick={() => setIsOpen(false)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 lg:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Admin Dashboard</h1>
        </header>

        <main className="p-4 transition-all duration-300 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;