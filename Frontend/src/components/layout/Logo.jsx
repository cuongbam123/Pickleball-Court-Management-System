import React from "react";
import { Link } from "react-router-dom";

const Logo = ({ to = "/home", compact = false, className }) => {
  return (
    <Link to={to} className={`flex items-center gap-3 ${className || ""}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-[#064e3b] shadow-md shrink-0 transition-transform hover:scale-105">
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Paddle head */}
          <path d="M7 12c-1.5-1.5-1.5-4 0-5.5s4-1.5 5.5 0l4.5 4.5c1.5 1.5 1.5 4 0 5.5s-4 1.5-5.5 0L7 12z" fill="currentColor" fillOpacity="0.15" />
          {/* Paddle handle */}
          <path d="M9 14l-5 5" />
          {/* Grip lines */}
          <path d="M5.5 17.5l1 1" />
          {/* Pickleball ball */}
          <circle cx="18" cy="6" r="2.5" fill="#a3e635" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {!compact && (
        <div className="leading-tight text-left">
          <p className="text-sm font-extrabold tracking-wide uppercase font-sans">Pickleball Hub</p>
          <p className="text-xs opacity-70 font-sans">Booking & Community</p>
        </div>
      )}
    </Link>
  );
};

export default Logo;