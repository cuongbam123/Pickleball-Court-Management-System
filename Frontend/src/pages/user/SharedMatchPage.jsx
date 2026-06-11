import React from "react";
import { useSharedMatch } from "../../features/shared-match/hook/sharedMatchHook";
import FilterComponents from "../../features/shared-match/components/filterComponents";
import HeroComponents from "../../features/shared-match/components/heroComponents";
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

          <HeroComponents/>

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

          <div id="shared-match-cards" className="mt-7 scroll-mt-24 sm:mt-8">
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
