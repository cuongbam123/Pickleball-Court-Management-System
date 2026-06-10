import React from "react";
import { Copy, Download, Share2 } from "lucide-react";
import bannerSharedMatches from "../../../assets/bannerSharedMatches.png";

const HeroComponents = () => {
  const scrollToMatches = () => {
    document
      .getElementById("shared-match-cards")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-emerald-950 px-5 py-4 shadow-xl sm:rounded-[28px] sm:px-12 sm:py-8 lg:px-20 lg:py-10">
      <img
        src={bannerSharedMatches}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain object-center"
      />
      <div className="absolute inset-0 bg-emerald-950/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/30 via-transparent to-emerald-950/10" />

      <div className="relative z-10 max-w-[240px] pt-1 sm:max-w-[580px] sm:pt-8 lg:pt-10">
        <span className="inline-flex w-fit items-center rounded-full bg-yellow-300/25 px-3 py-1 text-[10px] font-semibold text-yellow-100 ring-1 ring-yellow-200/25 backdrop-blur sm:px-4 sm:py-1.5 sm:text-sm">
          Pickleball Hub
        </span>

        <h1 className="mt-3 text-[22px] font-extrabold leading-[1.02] text-white drop-shadow-sm sm:mt-5 sm:text-5xl sm:leading-[1.08] lg:text-[54px]">
          Tìm đồng đội,
          <span className="block text-yellow-300">tham gia trận đấu ngay</span>
        </h1>

        <p className="mt-5 hidden max-w-md text-base leading-6 text-emerald-50 drop-shadow-sm sm:block">
          Pickleball Hub đem đến mạng lưới tìm đồng đội, còn nên tham gia trận
          đấu tinh thần ngay.
        </p>
      </div>

      <div className="absolute bottom-[18%] left-1/2 z-10 -translate-x-1/2 sm:bottom-[24%]">
        <button
          type="button"
          onClick={scrollToMatches}
          className="inline-flex h-9 whitespace-nowrap items-center justify-center rounded-full bg-yellow-300 px-6 text-xs font-extrabold text-emerald-950 shadow-[0_0_28px_rgba(250,204,21,0.55)] transition hover:-translate-y-0.5 hover:bg-yellow-200 active:scale-95 sm:h-12 sm:px-11 sm:text-sm"
        >
          Tìm trận ngay
        </button>
      </div>
    </div>
  );
};

const HeroIconButton = ({ icon: Icon, label }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/30 active:scale-95"
  >
    <Icon size={20} aria-hidden="true" />
  </button>
);

export default HeroComponents;
