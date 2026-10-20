import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Star,
  Smartphone,
  Laptop,
  Headphones,
  Flame,
  Gift,
  CalendarClock,
  ShoppingBag,
} from 'lucide-react';
import { PolicyTabId } from './PolicyModal';
import { Product } from '../types';
import { PRODUCTS, formatVND } from '../data/mockData';

interface BannerHeroProps {
  onExploreClick: () => void;
  onApplyVoucherClick: (code: string) => void;
  onOpenPolicy?: (tab: PolicyTabId) => void;
  onSelectProduct?: (product: Product) => void;
  onBuyNowProduct?: (product: Product) => void;
  onSelectCategory?: (categoryId: string) => void;
  onOpenPromo?: () => void;
  onOpenInstallment?: (product?: Product) => void;
}

interface HeroSlide {
  id: string;
  badge: string;
  titleLine1: string;
  titleHighlight: string;
  description: string;
  voucherCode: string;
  voucherLabel: string;
  externalUrl?: string;
  externalLabel?: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'novashop-tech',
    badge: 'Hệ Sinh Thái Công Nghệ Flagship • NovaShop 2026',
    titleLine1: 'Đẳng Cấp Công Nghệ',
    titleHighlight: 'Trải Nghiệm Đỉnh Cao',
    description:
      'Quy tụ những siêu phẩm công nghệ thế hệ mới nhất từ Apple, Samsung, Sony, Asus ROG đến Garmin. Thiết kế nguyên bản, cấu hình tối thượng cùng đặc quyền ưu đãi độc quyền.',
    voucherCode: 'NOVATECH',
    voucherLabel: '-100K',
  },
  {
    id: 'novashop-vip',
    badge: 'Đặc Quyền Lên Đời Siêu Phẩm • Trả Góp 0% Lãi Suất',
    titleLine1: 'Tuyệt Tác Phần Cứng',
    titleHighlight: 'Ưu Đãi Đến 500.000 ₫',
    description:
      'Sở hữu ngay iPhone 16 Pro Max, MacBook Pro M3, Tai nghe chống ồn Flagship và Gaming Gear với chương trình trả góp 0% duyệt hồ sơ tự động trong 5 phút.',
    voucherCode: 'VIP500',
    voucherLabel: '-500K',
  },
];

// Curated Flagship products showcased on the right stage of the Hero
const FLAGSHIP_SPOTLIGHT_IDS = ['prod-1', 'prod-2', 'prod-4', 'prod-3'];

interface TechNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pulsePhase: number;
}

interface SignalPulse {
  x: number;
  y: number;
  speed: number;
  length: number;
  color: string;
  alpha: number;
}

export const BannerHero: React.FC<BannerHeroProps> = ({
  onExploreClick,
  onApplyVoucherClick,
  onSelectProduct,
  onBuyNowProduct,
  onSelectCategory,
  onOpenPromo,
  onOpenInstallment,
}) => {
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [activeProductIdx, setActiveProductIdx] = useState<number>(0);
  const [isHoveringStage, setIsHoveringStage] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const flagshipProducts = React.useMemo(() => {
    const found = FLAGSHIP_SPOTLIGHT_IDS.map((id) =>
      PRODUCTS.find((p) => p.id === id)
    ).filter((p): p is Product => Boolean(p));
    return found.length > 0 ? found : PRODUCTS.slice(0, 4);
  }, []);

  const currentProduct =
    flagshipProducts[activeProductIdx] || flagshipProducts[0];

  // Auto-advance hero slide every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [activeSlideIdx]);

  // Auto-cycle Flagship Product Stage every 5 seconds unless user is hovering/interacting
  useEffect(() => {
    if (isHoveringStage || flagshipProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveProductIdx((prev) => (prev + 1) % flagshipProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHoveringStage, flagshipProducts.length]);

  const currentSlide = HERO_SLIDES[activeSlideIdx] || HERO_SLIDES[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || 1100);
    let height = (canvas.height = canvas.offsetHeight || 380);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 1100;
      height = canvas.height = canvas.offsetHeight || 380;
    };

    window.addEventListener('resize', handleResize);

    const palette = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24'];
    const nodeCount = 34;

    const nodes: TechNode[] = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.45,
      radius: 1.4 + (i % 3) * 0.7,
      color: palette[i % palette.length],
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const pulses: SignalPulse[] = Array.from({ length: 7 }, (_, i) => ({
      x: Math.random() * width,
      y: ((i + 1) / 8) * height + (Math.random() - 0.5) * 20,
      speed: 2.2 + Math.random() * 2.4,
      length: 55 + Math.random() * 65,
      color: i % 2 === 0 ? '#22d3ee' : '#38bdf8',
      alpha: 0.25 + Math.random() * 0.3,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of pulses) {
        p.x += p.speed;
        if (p.x - p.length > width) {
          p.x = -20;
          p.y = 30 + Math.random() * (height - 60);
        }

        const grad = ctx.createLinearGradient(p.x - p.length, p.y, p.x, p.y);
        grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
        grad.addColorStop(0.7, `rgba(56, 189, 248, ${p.alpha * 0.5})`);
        grad.addColorStop(1, `rgba(34, 211, 238, ${p.alpha})`);

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.moveTo(p.x - p.length, p.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.pulsePhase += 0.03;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        if (mouseRef.current.active) {
          const dxMouse = mouseRef.current.x - n.x;
          const dyMouse = mouseRef.current.y - n.y;
          const distMouse = Math.hypot(dxMouse, dyMouse);
          if (distMouse < 160) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - distMouse / 160) * 0.28})`;
            ctx.lineWidth = 1;
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
            ctx.stroke();
          }
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 125) {
            const opacity = (1 - dist / 125) * 0.22;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(125, 211, 252, ${opacity})`;
            ctx.lineWidth = 0.85;
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        const pulseAlpha = 0.45 + Math.sin(n.pulsePhase) * 0.25;
        ctx.beginPath();
        ctx.fillStyle = n.color;
        ctx.globalAlpha = pulseAlpha;
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const discountAmount =
    currentProduct?.originalPrice &&
    currentProduct.originalPrice > currentProduct.price
      ? currentProduct.originalPrice - currentProduct.price
      : 0;

  const discountPercent =
    currentProduct?.originalPrice &&
    currentProduct.originalPrice > currentProduct.price
      ? Math.round(
          ((currentProduct.originalPrice - currentProduct.price) /
            currentProduct.originalPrice) *
            100
        )
      : 0;

  const handleCategorySpotlight = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    onExploreClick();
  };

  return (
    <div id="hero-banner-section" data-scroll-section className="space-y-3.5 sm:space-y-5 mb-5 sm:mb-8">
      {/* Main Flagship Hero Card with Interactive Spotlight Stage */}
      <div
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            active: true,
          };
        }}
        onMouseLeave={() => {
          mouseRef.current.active = false;
        }}
        className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#182644] via-[#1b2b4d] to-[#1e294f] text-slate-100 overflow-hidden shadow-xl border border-slate-700/70 dark:border-blue-400/20"
      >
        {/* Continuous 360-degree sealed perimeter border ring */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/10 dark:border-blue-300/15 pointer-events-none z-20" />

        {/* Subtle architectural grid base */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148, 163, 184, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.14) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Animated floating aurora orbs */}
        <div className="hero-animate animate-hero-orb-1 absolute -right-12 -top-16 w-80 h-80 bg-cyan-500/12 rounded-full blur-3xl pointer-events-none" />
        <div className="hero-animate animate-hero-orb-2 absolute left-1/4 -bottom-20 w-80 h-80 bg-indigo-500/12 rounded-full blur-3xl pointer-events-none" />

        {/* Interactive 60fps Tech Constellation Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        <div className="relative z-10 px-3.5 sm:px-8 lg:px-11 py-5 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
          {/* Left Column (lg:col-span-7): Brand Headline, Value Proposition & Voucher CTAs */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <div
              key={currentSlide.id}
              className="space-y-2.5 sm:space-y-4 animate-ad-slide"
            >
              <div className="inline-flex items-center gap-1.5 sm:gap-2 max-w-full bg-cyan-500/10 border border-cyan-400/35 text-cyan-300 text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full backdrop-blur-xs">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-300 shrink-0" />
                <span className="truncate">{currentSlide.badge}</span>
              </div>

              <h1 className="text-xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                {currentSlide.titleLine1}{' '}
                <span className="sm:block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200">
                  {currentSlide.titleHighlight}
                </span>
              </h1>

              <p className="text-xs sm:text-base text-slate-300 max-w-xl leading-relaxed">
                {currentSlide.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                {currentSlide.externalUrl ? (
                  <a
                    href={currentSlide.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="keep-dark-text flex-1 sm:flex-initial justify-center px-3.5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-amber-950/30 flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <span>{currentSlide.externalLabel || 'Khám phá ngay'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  </a>
                ) : (
                  <button
                    id="hero-explore-btn"
                    onClick={onExploreClick}
                    className="flex-1 sm:flex-initial justify-center px-3.5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-900/30 flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <span>Khám phá sản phẩm</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  </button>
                )}

                <button
                  onClick={() => onApplyVoucherClick(currentSlide.voucherCode)}
                  className="flex-1 sm:flex-initial justify-center px-3 sm:px-4 py-2.5 sm:py-3 bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 hover:text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/20 backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title={`Áp dụng mã ${currentSlide.voucherCode}`}
                >
                  <Gift className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>
                    Mã: <strong className="text-amber-300">{currentSlide.voucherCode}</strong> ({currentSlide.voucherLabel})
                  </span>
                </button>
              </div>
            </div>

            {/* Slide Indicator Dots & Quick Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
              <div className="flex items-center gap-4 sm:gap-6 text-xs">
                <div>
                  <span className="font-black text-base sm:text-lg text-white tabular-nums">50.000+</span>
                  <span className="text-slate-400 block text-[10px] sm:text-[11px]">Khách hàng tin dùng</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="font-black text-base sm:text-lg text-cyan-300 tabular-nums">4.9 ★</span>
                  <span className="text-slate-400 block text-[10px] sm:text-[11px]">Đánh giá hài lòng</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="font-black text-base sm:text-lg text-amber-300 tabular-nums">25+</span>
                  <span className="text-slate-400 block text-[10px] sm:text-[11px]">Ngân hàng trả góp 0%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {HERO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSlideIdx(idx)}
                    aria-label={`Chuyển đến slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeSlideIdx === idx
                        ? 'w-6 sm:w-7 bg-cyan-400'
                        : 'w-2 bg-white/25 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (lg:col-span-5): Interactive Flagship Product Spotlight Stage */}
          {currentProduct && (
            <div
              className="lg:col-span-5"
              onMouseEnter={() => setIsHoveringStage(true)}
              onMouseLeave={() => setIsHoveringStage(false)}
            >
              <div className="relative rounded-2xl bg-slate-900/80 border border-white/15 backdrop-blur-md p-3.5 sm:p-4 shadow-2xl space-y-3">
                {/* Spotlight Top Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[10px] sm:text-[11px] font-bold">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Tâm Điểm Flagship Nổi Bật</span>
                  </div>
                  {discountPercent > 0 && (
                    <span className="keep-dark-text px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] tabular-nums">
                      Giảm {discountPercent}% (-{formatVND(discountAmount)})
                    </span>
                  )}
                </div>

                {/* Main Spotlight Product Card */}
                <div
                  onClick={() => onSelectProduct?.(currentProduct)}
                  className="group flex items-center gap-3.5 sm:gap-4 p-2.5 sm:p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer"
                >
                  <div className="keep-light relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center overflow-hidden shadow-md">
                    <img
                      src={currentProduct.image}
                      alt={currentProduct.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-semibold">
                      <span className="truncate">{currentProduct.categoryName}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-0.5 text-amber-300 font-bold tabular-nums shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {currentProduct.rating}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                      {currentProduct.name}
                    </h3>

                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm sm:text-base font-black text-amber-300 tabular-nums">
                        {formatVND(currentProduct.price)}
                      </span>
                      {currentProduct.originalPrice && (
                        <span className="text-[11px] text-slate-400 line-through tabular-nums">
                          {formatVND(currentProduct.originalPrice)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBuyNowProduct) {
                            onBuyNowProduct(currentProduct);
                          } else {
                            onSelectProduct?.(currentProduct);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Mua ngay</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct?.(currentProduct);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Xem cấu hình
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interactive Flagship Thumbnail Switcher (4 Crown-Jewel Products) */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {flagshipProducts.map((prod, idx) => {
                    const isSelected = idx === activeProductIdx;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => setActiveProductIdx(idx)}
                        className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 shadow-xs'
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] opacity-75 hover:opacity-100'
                        }`}
                        title={prod.name}
                      >
                        <div className="keep-light w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-200 truncate w-full text-center">
                          {prod.name.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Ornamental Section Separator & Animated Gradient Horizon (Framing transition from Hero to Product Catalog) */}
      <div
        id="hero-product-separator"
        className="relative py-2.5 sm:py-4 select-none"
      >
        {/* Subtle ambient radial glow behind the centerpiece */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1/4 top-1/2 -translate-y-1/2 h-12 bg-gradient-to-r from-blue-500/10 via-indigo-500/15 to-amber-500/10 blur-2xl rounded-full"
        />

        {/* Top Animated Gradient Line & Ornamental Crest */}
        <div className="relative flex items-center justify-center gap-3 sm:gap-5">
          {/* Left Animated Gradient Wing */}
          <div className="relative flex-1 h-[1.5px] overflow-hidden rounded-full bg-gradient-to-r from-transparent via-blue-500/45 to-indigo-500/80 dark:via-cyan-400/45 dark:to-indigo-400/90">
            <div className="animate-separator-shimmer absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />
          </div>

          {/* Left Ornamental Diamond Filigree */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 dark:bg-cyan-400/60" />
            <span className="w-2 h-2 rotate-45 border border-indigo-500/70 dark:border-cyan-400/80 bg-indigo-500/20 dark:bg-cyan-400/20" />
          </div>

          {/* Centerpiece Ornamental Section Framing Badge */}
          <button
            type="button"
            onClick={onExploreClick}
            className="relative group shrink-0 cursor-pointer"
            title="Cuộn mượt đến danh sách sản phẩm"
          >
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 opacity-35 dark:opacity-55 blur-xs group-hover:opacity-75 transition-opacity animate-separator-gradient" />
            <div className="relative flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400 animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.14em] bg-gradient-to-r from-slate-900 via-indigo-700 to-blue-700 dark:from-white dark:via-cyan-200 dark:to-amber-200 bg-clip-text text-transparent">
                Tâm Điểm Tuyệt Phẩm Công Nghệ 2026
              </span>
              <span className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-cyan-300 tabular-nums">
                {PRODUCTS.length} Siêu Phẩm Chính Hãng
              </span>
            </div>
          </button>

          {/* Right Ornamental Diamond Filigree */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rotate-45 border border-amber-500/70 dark:border-amber-400/80 bg-amber-500/20 dark:bg-amber-400/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 dark:bg-amber-400/60" />
          </div>

          {/* Right Animated Gradient Wing */}
          <div className="relative flex-1 h-[1.5px] overflow-hidden rounded-full bg-gradient-to-l from-transparent via-amber-500/45 to-indigo-500/80 dark:via-amber-400/45 dark:to-indigo-400/90">
            <div className="animate-separator-shimmer absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />
          </div>
        </div>

        {/* Interactive Ornamental Sub-Navigation Ribbon framing the Product List */}
        <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => handleCategorySpotlight('phones')}
            className="px-2.5 sm:px-3.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Flagship Smartphone</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 text-xs hidden sm:inline">✦</span>

          <button
            type="button"
            onClick={() => handleCategorySpotlight('laptops')}
            className="px-2.5 sm:px-3.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Laptop className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>MacBook & Đồ Họa</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 text-xs hidden sm:inline">✦</span>

          <button
            type="button"
            onClick={() => handleCategorySpotlight('audio')}
            className="px-2.5 sm:px-3.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Headphones className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Âm Thanh Hi-Res</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 text-xs hidden sm:inline">✦</span>

          <button
            type="button"
            onClick={() => {
              if (onOpenInstallment) {
                onOpenInstallment(currentProduct);
              } else {
                onExploreClick();
              }
            }}
            className="px-2.5 sm:px-3.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <CalendarClock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Đặc Quyền Trả Góp 0%</span>
          </button>

          {onOpenPromo && (
            <>
              <span className="text-slate-300 dark:text-slate-700 text-xs hidden sm:inline">✦</span>
              <button
                type="button"
                onClick={onOpenPromo}
                className="px-2.5 sm:px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-[10px] sm:text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                <span>Săn Voucher -500K</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
