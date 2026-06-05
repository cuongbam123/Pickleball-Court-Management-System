import React from "react";
import { useSharedMatch } from "../../features/shared-match/hook/sharedMatchHook";
import FilterComponents from "../../features/shared-match/components/filterComponents";
import CardComponents from "../../features/shared-match/components/cardComponents";
import SharedMatchDetailModal from "../../features/shared-match/components/SharedMatchDetailModal";
import MainLayout from "../../layouts/MainLayout";

const SharedMatchPage = () => {
  const sharedMatchData = useSharedMatch();

  const handleJoinMatch = async (match) => {
    await sharedMatchData.buyTicket(match);
  };

  return (
    <MainLayout>
      <section className="min-w-0 bg-slate-50">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9 2xl:px-10">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-5 py-7 shadow-xl sm:px-7 sm:py-9 lg:px-10 lg:py-12">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-72 sm:w-72" />
            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/10 blur-3xl sm:h-72 sm:w-72" />

            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex min-h-10 items-center rounded-full bg-white/15 px-4 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur">
                Pickleball Hub
              </span>

              <h1 className="mt-5 text-[30px] font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                Tìm đồng đội,
                <span className="block text-yellow-300">
                  tham gia trận đấu ngay
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base sm:leading-7 lg:text-lg">
                Kết nối với người chơi gần bạn, tham gia các trận đấu đang tuyển
                thành viên và tận hưởng những giờ chơi pickleball đầy hứng khởi.
              </p>

              <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  className="min-h-11 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:px-6"
                >
                  Tìm trận ngay
                </button>

                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10 sm:px-6"
                >
                  Tạo trận đấu
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-5 lg:p-6">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Tìm kiếm trận đấu
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Lọc nhanh theo chi nhánh và sân phù hợp.
                </p>
              </div>
            </div>
            <FilterComponents {...sharedMatchData} />
          </div>

          <div className="mt-7 sm:mt-8">
            <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                  Danh sách trận đấu
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Chọn một ca ghép để xem chi tiết người tham gia.
                </p>
              </div>

              <span className="inline-flex min-h-10 w-fit items-center rounded-xl bg-emerald-100 px-4 text-sm font-bold text-emerald-700">
                {sharedMatchData.sharedMatches?.length || 0} trận
              </span>
            </div>

            <CardComponents
              {...sharedMatchData}
              onViewDetail={sharedMatchData.openMatchDetail}
            />
          </div>
        </div>
      </section>

      <SharedMatchDetailModal
        open={!!sharedMatchData.selectedMatch}
        match={sharedMatchData.selectedMatch}
        branches={sharedMatchData.branches}
        courts={sharedMatchData.courts}
        isLoading={sharedMatchData.isDetailLoading}
        isJoining={sharedMatchData.isBuyingTicket}
        error={sharedMatchData.detailError}
        onClose={sharedMatchData.closeMatchDetail}
        onJoin={handleJoinMatch}
      />
    </MainLayout>
  );
};

export default SharedMatchPage;
