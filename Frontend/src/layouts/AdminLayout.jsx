import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "../../src/components/layout/Sidebar";

const adminItems = [
  { label: "Tổng quan", to: "/home" },
  { label: "Quản lý sân", to: "/courts" },
  { label: "Chi nhánh", to: "/admin/branches" },
  { label: "Nhân viên", to: "/staff-management" },
  { label: "Giá", to: "/pricing" },
  { label: "Giải đấu", to: "/tournaments" },
];

const AdminLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar items={adminItems} />
      </div>

      {/* Sidebar mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar mobile drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Admin Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        <Sidebar items={adminItems} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex items-center gap-3 bg-white border-b px-4 py-3 lg:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;