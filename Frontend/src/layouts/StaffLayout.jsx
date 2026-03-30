import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "../../src/components/layout/Sidebar";

const staffItems = [
  { label: "Tổng quan", to: "/home" },
  { label: "Đặt sân", to: "/booking" },
  { label: "POS", to: "/pos" },
  { label: "Khách tại quầy", to: "/walk-in" },
  { label: "Lịch sân", to: "/schedule" },
];

const StaffLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar items={staffItems} />
      </div>

      {/* Sidebar mobile */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute top-0 left-0 h-full transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="relative h-full">
            <Sidebar
              items={staffItems}
              onItemClick={() => setIsOpen(false)}
            />

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-2 hover:bg-slate-100"
            >
              <X size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold">Staff Dashboard</h1>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default StaffLayout;