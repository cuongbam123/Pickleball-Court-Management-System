import React from "react";
import { Link } from "react-router-dom";

const Logo = ({ to = "/home", compact = false }) => {
  return (
    <Link to={to} className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 font-bold text-white shadow-sm">
        P
      </div>

      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Pickleball Hub</p>
          <p className="text-xs text-slate-500">Booking & Community</p>
        </div>
      )}
    </Link>
  );
};

export default Logo;