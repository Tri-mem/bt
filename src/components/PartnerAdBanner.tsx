import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
  ArrowUpRight,
  Building,
  Utensils,
  X,
} from 'lucide-react';
import kitchenHeroImg from '../assets/images/kitchenmini_banner_hero_1791429748513.jpg';
import kitchenBlenderImg from '../assets/images/kitchenmini_blender_juicer_1791429762104.jpg';
import kitchenMixerImg from '../assets/images/kitchenmini_stand_mixer_1791429773959.jpg';
import loftSpktImg from '../assets/images/trothat_loft_spkt_101_1791375266535.jpg';

export interface PartnerAdListing {
  id: string;
  brandName: string;
  badgeText: string;
  title: string;
  locationInfo: string;
  priceFormatted: string;
  subInfo: string;
  ctaLabel: string;
  highlightTicker: string;
  image: string;
  targetUrl: string;
  isKitchenMini?: boolean;
}

const PARTNER_AD_LISTINGS: PartnerAdListing[] = [
  {
    id: 'KM-BLENDER-01',
    brandName: 'KitchenMini.Official',
    badgeText: 'Ưu đãi -15%',
    title: 'Máy Xay Sinh Tố & Máy Xay Cầm Tay Tối Giản Thông Minh',
    locationInfo: 'Hoàng Diệu 2, Thủ Đức · SĐT: 0399032262',
    priceFormatted: 'Từ 269.000₫',
    subInfo: 'Giảm 15% đơn đầu tiên',
    ctaLabel: 'Mua ngay',
    highlightTicker:
      'KitchenMini · Nâng tầm gian bếp hiện đại, tối giản & thông minh · Giảm ngay 15% cho Blender, Juicer & Food Processor · Liên hệ 0399032262',
    image: kitchenBlenderImg,
    targetUrl: 'https://tt03990322.wixsite.com/kitchenmini',
    isKitchenMini: true,
  },
  {
    id: 'KM-JUICER-02',
    brandName: 'KitchenMini.Official',
    badgeText: 'Bán chạy',
    title: 'Máy Ép Trái Cây & Ép Rau Quả Giữ Trọn Dưỡng Chất',
    locationInfo: 'Hoàng Diệu 2, Thủ Đức · SĐT: 0399032262',
    priceFormatted: '599.000₫ – 1.999.000₫',
    subInfo: 'Phễu thép không gỉ',
    ctaLabel: 'Khám phá',
    highlightTicker:
      'Máy Ép Trái Cây 599.000₫ · Ép Trái Cây Đa Năng 999.000₫ · Máy Ép Rau Quả 1.999.000₫ · Ưu đãi 15% tại tt03990322.wixsite.com/kitchenmini',
    image: kitchenHeroImg,
    targetUrl: 'https://tt03990322.wixsite.com/kitchenmini/category/all-products',
    isKitchenMini: true,
  },
  {
    id: 'KM-MIXER-03',
    brandName: 'KitchenMini.Official',
    badgeText: '1000W–1200W',
    title: 'Máy Trộn Bộ Nhôm & Máy Đánh Trứng Cầm Tay Đa Năng',
    locationInfo: 'Hoàng Diệu 2, Thủ Đức · SĐT: 0399032262',
    priceFormatted: '899.000₫ – 1.500.000₫',
    subInfo: 'Thố trộn 4L – 6L',
    ctaLabel: 'Xem ngay',
    highlightTicker:
      'Máy Trộn Bộ Nhôm 1.500.000₫ · Máy Trộn Bột Đa Năng 1.350.000₫ · Máy Đánh Trứng Cầm Tay 899.000₫ · Đặt hàng trực tuyến tại KitchenMini',
    image: kitchenMixerImg,
    targetUrl: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/máy-trộn-bộ-nhôm',
    isKitchenMini: true,
  },
  {
    id: 'TD-LC-101',
    brandName: 'TrọThật.ThủĐức',
    badgeText: '22.4 m²',
    title: 'Phòng Gác Lửng Đúc Bê Tông - Cách Cổng SPKT 600m',
    locationInfo: 'Hẻm 48 Đường số 17, P. Linh Chiểu, TP. Thủ Đức',
    priceFormatted: '3.200.000đ/tháng',
    subInfo: 'Gần ĐH SPKT (600m)',
    ctaLabel: 'Xem phòng',
    highlightTicker:
      'Đo laser Bosch 22.4m² · Cách ĐH SPKT 600m · Khóa vân tay 2 lớp · Không ngập nước · Hẻm 48 Đường 17 Linh Chiểu',
    image: loftSpktImg,
    targetUrl: 'https://lyduydang.ai.studio/#room-card-TD-LC-101',
    isKitchenMini: false,
  },
];

interface PartnerAdBannerProps {
  onCloseChange?: (closed: boolean) => void;
}

export const PartnerAdBanner: React.FC<PartnerAdBannerProps> = ({ onCloseChange }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  // Auto-cycle continuously every 6.5s so user has plenty of time to read each slide
  useEffect(() => {
    if (isClosed) return;
    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % PARTNER_AD_LISTINGS.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isClosed, selectedIndex]);

  if (isClosed) {
    return null;
  }

  const activeListing = PARTNER_AD_LISTINGS[selectedIndex] || PARTNER_AD_LISTINGS[0];

  return (
    <aside
      id="partner-ad-trothat-banner"
      aria-label="Quảng cáo đối tác KitchenMini & TrọThật"
      className="fixed bottom-2 inset-x-2 sm:left-auto sm:bottom-4 sm:right-4 z-30 w-auto sm:w-[calc(100vw-1.5rem)] max-w-full sm:max-w-[385px] rounded-xl sm:rounded-2xl bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border border-amber-300/85 dark:border-slate-700/90 shadow-lg shadow-slate-900/10 dark:shadow-black/40 overflow-hidden transition-all duration-300 ease-out"
    >
      {/* Desktop Slim Header Bar (Hidden on mobile to keep mobile ultra-compact) */}
      <div className="hidden sm:flex px-3 py-1.5 bg-gradient-to-r from-amber-50/90 via-slate-50 to-teal-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-b border-slate-200/70 dark:border-slate-800 items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 shrink-0">
            {activeListing.isKitchenMini ? (
              <Utensils className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            )}
            <span>{activeListing.brandName}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsClosed(true);
            onCloseChange?.(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 -mr-0.5 rounded-md bg-slate-200/75 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
          aria-label="Đóng quảng cáo"
        >
          <span>Đóng</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Compact Horizontal Row */}
      <div className="flex items-center gap-2 p-1.5 sm:p-3">
        <a
          key={activeListing.id}
          id={`partner-ad-main-link-${activeListing.id}`}
          href={activeListing.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Nhấn để mở "${activeListing.title}"`}
          className="group flex-1 min-w-0 flex items-center gap-2 sm:gap-3 hover:bg-amber-50/40 dark:hover:bg-slate-800/50 rounded-lg transition-colors focus:outline-none animate-ad-slide"
        >
          {/* Compact Thumbnail: 42x42px on mobile, 68x68px on desktop */}
          <div className="relative w-10.5 h-10.5 sm:w-[68px] sm:h-[68px] rounded-lg sm:rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-slate-700 shrink-0">
            {!imgError[activeListing.id] ? (
              <img
                src={activeListing.image}
                alt={activeListing.title}
                referrerPolicy="no-referrer"
                onError={() =>
                  setImgError((prev) => ({ ...prev, [activeListing.id]: true }))
                }
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-900 to-slate-900 flex items-center justify-center text-amber-300">
                {activeListing.isKitchenMini ? (
                  <Utensils className="w-4 h-4 sm:w-6 sm:h-6" />
                ) : (
                  <Building className="w-4 h-4 sm:w-6 sm:h-6" />
                )}
              </div>
            )}
            <div className="hidden sm:block absolute bottom-0 inset-x-0 bg-slate-950/85 text-[9px] text-amber-300 font-bold text-center py-0.5 tabular-nums">
              {activeListing.badgeText}
            </div>
          </div>

          {/* Compact Horizontal Info */}
          <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="sm:hidden text-[9px] font-extrabold text-amber-700 dark:text-amber-400 shrink-0">
                {activeListing.brandName}
              </span>
              <span className="sm:hidden text-slate-300 dark:text-slate-600 text-[9px]" aria-hidden="true">·</span>
              <h4 className="text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors truncate leading-tight">
                {activeListing.title}
              </h4>
            </div>

            <p className="hidden sm:flex text-[11px] text-slate-500 dark:text-slate-400 items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="truncate">{activeListing.locationInfo}</span>
            </p>

            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-baseline gap-1.5 min-w-0 truncate">
                <span className="text-[11px] sm:text-sm font-black text-amber-700 dark:text-amber-300 tabular-nums whitespace-nowrap">
                  {activeListing.priceFormatted}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  · {activeListing.subInfo}
                </span>
              </div>

              <span className="keep-dark-text inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-amber-500 group-hover:bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-extrabold shrink-0 shadow-2xs transition-colors whitespace-nowrap">
                <span>{activeListing.ctaLabel}</span>
                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
            </div>
          </div>
        </a>

        {/* Mobile Direct Close Button on the Right Edge */}
        <button
          id="close-partner-ad-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsClosed(true);
            onCloseChange?.(true);
          }}
          className="sm:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 active:scale-95 transition-all cursor-pointer shrink-0"
          aria-label="Đóng quảng cáo"
          title="Đóng quảng cáo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
