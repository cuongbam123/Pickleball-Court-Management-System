import React from "react";
import Spiral from "./Spiral";

export default function PageLoader({ text = "Đang tải dữ liệu...", className }) {
  return (
    <div
      className={
        className ||
        "flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 p-8 text-center"
      }
    >
      <Spiral size="lg" className="text-blue-600" />
      {text && (
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
