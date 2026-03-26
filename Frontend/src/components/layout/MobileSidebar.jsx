import React from "react";
import Sidebar from "./Sidebar";

const MobileSidebar = ({ open, onClose }) => {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-72 transform transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-md"
            aria-label="Close sidebar"
          >
            ✕
          </button>

          <Sidebar onNavigate={onClose} />
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;