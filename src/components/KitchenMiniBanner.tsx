import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Sparkles,
  MapPin,
  Phone,
  ShoppingBag,
  CheckCircle2,
  Utensils,
  ChevronRight,
  Star,
} from 'lucide-react';
import kitchenHeroImg from '../assets/images/kitchenmini_banner_hero_1791429748513.jpg';
import kitchenBlenderImg from '../assets/images/kitchenmini_blender_juicer_1791429762104.jpg';
import kitchenMixerImg from '../assets/images/kitchenmini_stand_mixer_1791429773959.jpg';

export interface KitchenMiniSpotlight {
  id: string;
  categoryLabel: string;
  promoKicker: string;
  headline: string;
  description: string;
  title: string;
  subtitle: string;
  priceRange: string;
  featuredProduct: string;
  featuredPrice: string;
  specs: string;
  image: string;
  productUrl: string;
  items: {
    name: string;
    price: string;
    desc: string;
    url: string;
  }[];
}

const KITCHENMINI_BASE_URL = 'https://tt03990322.wixsite.com/kitchenmini';
const KITCHENMINI_ALL_PRODUCTS_URL =
  'https://tt03990322.wixsite.com/kitchenmini/category/all-products';

const KITCHENMINI_SPOTLIGHTS: KitchenMiniSpotlight[] = [
  {
    id: 'blender',
    categoryLabel: '01. Máy xay sinh tố',
    promoKicker: 'Ưu đãi giảm 15% đơn đầu tiên · Dòng Máy Xay Sinh Tố Hiện Đại',
    headline: 'KitchenMini — Máy Xay Sinh Tố & Cầm Tay Nhuyễn Mịn Tức Thì',
    description:
      'Chế biến thức uống tươi ngon và trộn đều mọi nguyên liệu trong tích tắc. Động cơ đồng nguyên chất 600W – 800W kết hợp cối nhựa BPA Free & thủy tinh cường lực an toàn tuyệt đối.',
    title: 'Máy Xay Mini Cá Nhân & Máy Xay Cầm Tay',
    subtitle: 'Chế biến thức uống tươi ngon và trộn đều mọi nguyên liệu trong tích tắc.',
    priceRange: 'Từ 269.000 ₫',
    featuredProduct: 'Máy Xay Mini Cá Nhân',
    featuredPrice: '399.000 ₫',
    specs: 'Công suất 600W – 800W · Nhựa BPA Free & Thủy tinh cường lực · Kèm ca đựng 500ml – 1000ml',
    image: kitchenBlenderImg,
    productUrl: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/máy-xay-mini-cá',
    items: [
      {
        name: 'Máy Xay Cầm Tay Đa Năng',
        price: '269.000 ₫',
        desc: 'Xay súp, cháo & sinh tố trực tiếp',
        url: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/máy-xay-cầm-tay',
      },
      {
        name: 'Máy Xay Mini Cá Nhân',
        price: '399.000 ₫',
        desc: 'Nhỏ gọn mang đi làm, tập gym',
        url: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/máy-xay-mini-cá',
      },
      {
        name: 'Cối Thủy Tinh Cường Lực',
        price: '699.000 ₫',
        desc: 'Xay đá & hạt cứng siêu khỏe',
        url: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/cối-thủy-tinh-cường',
      },
    ],
  },
  {
    id: 'juicer',
    categoryLabel: '02. Máy ép trái cây',
    promoKicker: 'Ưu đãi giảm 15% đơn đầu tiên · Dòng Máy Ép Trái Cây & Rau Quả',
    headline: 'KitchenMini — Máy Ép Trái Cây Giữ Trọn Vitamin Tự Nhiên',
    description:
      'Trích xuất tinh túy từ trái cây và rau củ tươi mỗi ngày mà không làm biến đổi dưỡng chất. Thiết kế phễu thép không gỉ công suất 800W – 1000W, ép kiệt bã và tháo lắp vệ sinh trong 30 giây.',
    title: 'Máy Ép Trái Cây & Máy Ép Rau Quả Tinh Gọn',
    subtitle: 'Trích xuất tinh túy từ trái cây tươi, giữ trọn vẹn vitamin và dưỡng chất tự nhiên.',
    priceRange: 'Từ 599.000 ₫',
    featuredProduct: 'Ép Trái Cây Đa Năng',
    featuredPrice: '999.000 ₫',
    specs: 'Công suất 800W – 1000W · Phễu thép không gỉ · Dung tích 1.2L – 1.8L · Vệ sinh nhanh',
    image: kitchenHeroImg,
    productUrl: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/ép-trái-cây-đa',
    items: [
      {
        name: 'Máy Ép Trái Cây Tinh Gọn',
        price: '599.000 ₫',
        desc: 'Thiết kế tối giản cho căn bếp nhỏ',
        url: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/máy-ép-trái-cây',
      },
      {
        name: 'Ép Trái Cây Đa Năng',
        price: '999.000 ₫',
        desc: 'Ống tiếp nguyên liệu lớn tiện lợi',
        url: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/ép-trái-cây-đa',
      },
      {
        name: 'Máy Ép Rau Quả Cao Cấp',
        price: '1.999.000 ₫',
        desc: 'Ép kiệt 95% nước từ rau lá & củ quả',
        url: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/máy-ép-rau-quả',
      },
    ],
  },
  {
    id: 'processor',
    categoryLabel: '03. Máy chế biến thực phẩm',
    promoKicker: 'Ưu đãi giảm 15% đơn đầu tiên · Dòng Máy Chế Biến Thực Phẩm Đa Năng',
    headline: 'KitchenMini — Máy Trộn Bộ Nhôm & Đánh Trứng Chuẩn Đầu Bếp',
    description:
      'Chế biến nhanh chóng, vận hành êm ái, tiết kiệm tối đa thời gian và công sức nấu nướng. Khung nhôm đúc bền bỉ công suất 1000W – 1200W cùng thố trộn inox 4L – 6L dung tích lớn.',
    title: 'Máy Trộn Bộ Nhôm & Máy Đánh Trứng Cầm Tay',
    subtitle: 'Chế biến nhanh chóng, vận hành êm ái, tiết kiệm tối đa thời gian và công sức nấu nướng.',
    priceRange: 'Từ 899.000 ₫',
    featuredProduct: 'Máy Trộn Bộ Nhôm Cao Cấp',
    featuredPrice: '1.500.000 ₫',
    specs: 'Công suất 1000W – 1200W · Thố trộn 4L – 6L · 2–3 cấp độ đánh · Khung nhôm đúc bền bỉ',
    image: kitchenMixerImg,
    productUrl: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/máy-trộn-bộ-nhôm',
    items: [
      {
        name: 'Máy Đánh Trứng Cầm Tay',
        price: '899.000 ₫',
        desc: 'Đánh bông kem & trứng siêu tốc',
        url: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/máy-đánh-trứng-cầm',
      },
      {
        name: 'Máy Trộn Bột Đa Năng',
        price: '1.350.000 ₫',
        desc: 'Nhào bột làm bánh mì, pizza mịn đều',
        url: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/máy-trộn-bột-đa',
      },
      {
        name: 'Máy Trộn Bộ Nhôm',
        price: '1.500.000 ₫',
        desc: 'Thân nhôm đúc nguyên khối 1200W',
        url: 'https://tt03990322.wixsite.com/kitchenmini/trang-s-n-ph-m/máy-trộn-bộ-nhôm',
      },
    ],
  },
];

export const KitchenMiniBanner: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activeProductIdx, setActiveProductIdx] = useState<number>(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Automatically advance main ad slide every 7.5 seconds continuously
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % KITCHENMINI_SPOTLIGHTS.length);
      setActiveProductIdx(0);
    }, 7500);
    return () => clearInterval(slideTimer);
  }, [activeIndex]);

  // Also auto-highlight each of the 3 products within the current slide every 2.5s
  useEffect(() => {
    const itemTimer = setInterval(() => {
      setActiveProductIdx((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(itemTimer);
  }, [activeIndex]);

  const currentSpotlight = KITCHENMINI_SPOTLIGHTS[activeIndex] || KITCHENMINI_SPOTLIGHTS[0];
  const highlightedItem =
    currentSpotlight.items[activeProductIdx] || currentSpotlight.items[0];

  return (
    <section
      id="kitchenmini-promo-banner"
      aria-label="Quảng cáo đối tác KitchenMini - Thiết bị nhà bếp hiện đại"
      className="mb-8 relative rounded-3xl bg-gradient-to-br from-[#18181b] via-[#1f242d] to-[#17253b] text-white overflow-hidden shadow-lg border border-slate-700/90 dark:border-amber-400/40"
    >
      {/* Continuous 360-degree sealed perimeter border ring */}
      <div className="absolute inset-0 rounded-3xl border border-white/15 dark:border-amber-400/35 pointer-events-none z-20" />

      {/* Subtle warm radial glow */}
      <div className="absolute -top-24 -right-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Partner Attribution & Quick Link Bar */}
      <div className="relative z-10 px-5 sm:px-8 py-2.5 bg-white/[0.04] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300 min-w-0">
          <span className="font-semibold text-amber-300 flex items-center gap-1.5 shrink-0">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>KitchenMini Official</span>
          </span>
          <span className="text-slate-500" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-300 truncate">
            Đối tác Gia Dụng & Thiết Bị Nhà Bếp Thông Minh
          </span>
          <span className="hidden md:inline text-slate-500" aria-hidden="true">
            ·
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>Hoàng Diệu 2, Thủ Đức</span>
          </span>
          <span className="hidden lg:inline text-slate-500" aria-hidden="true">
            ·
          </span>
          <span className="hidden lg:inline-flex items-center gap-1 text-slate-400 tabular-nums">
            <Phone className="w-3 h-3 text-emerald-400" />
            <span>0399032262</span>
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href={KITCHENMINI_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>tt03990322.wixsite.com/kitchenmini</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Content Grid - Automatically transitions every 3.5s */}
      <div className="relative z-10 p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left Column: Dynamic Campaign Story, Offer & CTAs */}
        <div className="lg:col-span-6 space-y-4">
          <div
            key={`km-left-copy-${currentSpotlight.id}`}
            className="space-y-3.5 animate-ad-slide"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{currentSpotlight.promoKicker}</span>
              <span className="text-slate-500" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>5.0 Đánh giá</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight [text-wrap:balance]">
              {currentSpotlight.headline}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              {currentSpotlight.description} Đang giới thiệu:{' '}
              <strong className="text-amber-300">{highlightedItem.name}</strong> với mức giá ưu đãi chỉ{' '}
              <strong className="text-emerald-300 tabular-nums">{highlightedItem.price}</strong>.
            </p>
          </div>

          {/* Auto-advancing Category Progress Tabs */}
          <div
            className="grid grid-cols-3 gap-2 pt-1"
            role="tablist"
            aria-label="Danh mục sản phẩm KitchenMini tự động chạy"
          >
            {KITCHENMINI_SPOTLIGHTS.map((spot, idx) => {
              const isActive = activeIndex === idx;
              return (
                <button
                  key={spot.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveIndex(idx);
                    setActiveProductIdx(0);
                  }}
                  className={`relative overflow-hidden rounded-xl p-2.5 text-left border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-400/60 text-white shadow-xs'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="text-[11px] font-bold truncate">
                    {spot.categoryLabel}
                  </div>
                  <div className="text-[10px] text-emerald-300 font-semibold tabular-nums truncate mt-0.5">
                    {spot.priceRange}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Primary & Secondary Action Links */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              id="kitchenmini-banner-primary-cta"
              href={highlightedItem.url || currentSpotlight.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="keep-dark-text px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-amber-950/30 inline-flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Mua Ngay: {highlightedItem.name}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              id="kitchenmini-banner-catalog-cta"
              href={KITCHENMINI_ALL_PRODUCTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/20 font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <span>Xem Tất Cả 9 Sản Phẩm</span>
              <ChevronRight className="w-4 h-4 text-amber-300" />
            </a>
          </div>

          {/* Unboxed Customer Proof & Store Highlights */}
          <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Chất liệu BPA Free & Thép không gỉ</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Công suất mạnh mẽ 600W – 1200W</span>
            <span aria-hidden="true">·</span>
            <span>Đặt hàng trực tuyến nhanh chóng</span>
          </div>
        </div>

        {/* Right Column: Auto-Rotating Visual & Direct Product Links */}
        <div
          key={`km-right-showcase-${currentSpotlight.id}`}
          className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch animate-ad-slide"
        >
          {/* Spotlight Visual Card */}
          <a
            href={highlightedItem.url || currentSpotlight.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:col-span-7 group relative rounded-2xl overflow-hidden bg-slate-900 border border-white/15 flex flex-col justify-end min-h-[250px] sm:min-h-[280px]"
            title={`Xem ${highlightedItem.name} trên KitchenMini`}
          >
            {!imgErrors[currentSpotlight.id] ? (
              <img
                src={currentSpotlight.image}
                alt={currentSpotlight.title}
                referrerPolicy="no-referrer"
                onError={() =>
                  setImgErrors((prev) => ({ ...prev, [currentSpotlight.id]: true }))
                }
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-amber-950 flex items-center justify-center">
                <Utensils className="w-12 h-12 text-amber-300/60" />
              </div>
            )}

            {/* Measured contrast scrim for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

            <div className="relative z-10 p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px] text-amber-300 font-semibold">
                <span>{currentSpotlight.categoryLabel}</span>
                <span className="tabular-nums text-emerald-300 font-bold">
                  {currentSpotlight.priceRange}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                {currentSpotlight.title}
              </h3>
              <p className="text-[11px] text-slate-300 line-clamp-2">
                {currentSpotlight.specs}
              </p>
              <div className="pt-1 inline-flex items-center gap-1 text-xs font-bold text-amber-300 group-hover:translate-x-0.5 transition-transform">
                <span>
                  Đang chiếu: {highlightedItem.name} ({highlightedItem.price})
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </a>

          {/* Direct Product Catalog List (3 real items per category, auto-highlighted in sequence) */}
          <div className="sm:col-span-5 flex flex-col justify-between rounded-2xl bg-slate-900/75 border border-white/15 p-4 space-y-3">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-amber-300">
                Sản phẩm nổi bật · {currentSpotlight.categoryLabel}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {currentSpotlight.subtitle}
              </p>
            </div>

            <div className="space-y-2">
              {currentSpotlight.items.map((item, idx) => {
                const isItemHighlighted = activeProductIdx === idx;
                return (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                      isItemHighlighted
                        ? 'bg-amber-500/20 border-amber-400/60 shadow-xs'
                        : 'bg-white/[0.04] hover:bg-amber-500/15 border-white/10 hover:border-amber-400/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold transition-colors truncate ${
                          isItemHighlighted
                            ? 'text-amber-300'
                            : 'text-white group-hover:text-amber-300'
                        }`}
                      >
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">
                        {item.desc}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-300 tabular-nums mt-0.5">
                        {item.price}
                      </div>
                    </div>
                    <ArrowUpRight
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isItemHighlighted
                          ? 'text-amber-300 translate-x-0.5 -translate-y-0.5'
                          : 'text-slate-400 group-hover:text-amber-300'
                      }`}
                    />
                  </a>
                );
              })}
            </div>

            <a
              href={KITCHENMINI_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pt-1 flex items-center justify-between text-[11px] font-semibold text-slate-300 hover:text-amber-300 transition-colors border-t border-white/10"
            >
              <span>Đặt trực tuyến tại KitchenMini</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
