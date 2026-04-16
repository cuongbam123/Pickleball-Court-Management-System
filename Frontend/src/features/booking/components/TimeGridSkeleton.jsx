import React from "react";

const TimeGridSkeleton = () => {
  // Giả lập 5 sân, mỗi sân 15 slot giờ (từ 5h đến 20h)
  const dummyCourts = Array.from({ length: 0 });
  const dummySlots = Array.from({ length: 24 });

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border p-4 shadow-sm animate-pulse">
      <table className="w-full min-w-[1000px] border-separate border-spacing-y-2 border-spacing-x-1">
        <thead>
          <tr>
            <th className="text-left p-2 min-w-[180px]">
              <div className="h-6 w-24 bg-slate-200 rounded"></div>
            </th>
            {dummySlots.map((_, idx) => (
              <th key={idx} className="w-16 pb-2">
                <div className="h-4 w-10 bg-slate-200 rounded mx-auto"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dummyCourts.map((_, cIdx) => (
            <tr key={`skeleton-court-${cIdx}`}>
              <td className="align-middle">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 h-14 flex flex-col justify-center">
                  <div className="h-4 w-20 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 w-12 bg-slate-200 rounded-full"></div>
                </div>
              </td>
              {dummySlots.map((_, sIdx) => (
                <td key={`skeleton-slot-${cIdx}-${sIdx}`}>
                  <div className="h-12 w-full bg-slate-100 rounded-md border border-slate-200"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimeGridSkeleton;