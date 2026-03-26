import React, { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import MobileSidebar from "../components/layout/MobileSidebar";
import Footer from "../components/layout/Footer";

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Sidebar mobile */}
        <MobileSidebar
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Right content */}
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar onToggleSidebar={() => setIsSidebarOpen(true)} />

          <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
            <div className="mx-auto w-full max-w-[1400px]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                {children}
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;