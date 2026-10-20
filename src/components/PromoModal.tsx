import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  Flame, 
  Clock, 
  ShoppingBag,
  Truck,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Voucher } from '../types';
import { VOUCHERS, formatVND } from '../data/mockData';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVoucher: (voucher: Voucher) => void;
  appliedVoucher: Voucher | null;
  onExploreProducts: () => void;
  onToast?: (type: 'success' | 'info' | 'error' | 'warning', title: string, description?: string) => void;
}

export const PromoModal: React.FC<PromoModalProps> = ({
  isOpen,
  onClose,
  onApplyVoucher,
  appliedVoucher,
  onExploreProducts,
  onToast,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [dontShowToday, setDontShowToday] = useState<boolean>(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Lock background page scroll when promo modal is open so the frame stays completely fixed
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close and remember preference if checked
  const handleClose = () => {
    if (dontShowToday) {
      try {
        localStorage.setItem('novashop_promo_dismissed_date', new Date().toDateString());
      } catch (e) {
        // ignore
      }
    }
    onClose();
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleClose();
  };

  // If user clicks the backdrop, smoothly close
  const handleBackdropClick = () => {
    handleClose();
  };

  const handleCopyCode = async (voucher: Voucher) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(voucher.code);
        setCopiedCode(voucher.code);
        onToast?.('success', `Đã sao chép mã: ${voucher.code}`);
        setTimeout(() => setCopiedCode(null), 3000);
      }
    } catch {
      onToast?.('error', 'Không thể sao chép mã');
    }
  };

  const handleApplyNow = (voucher: Voucher) => {
    onApplyVoucher(voucher);
    onToast?.('success', `Đã kích hoạt voucher ${voucher.code}!`, voucher.description);
    handleClose();
    onExploreProducts();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      {/* Dimmed backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleBackdropClick}
      />

      {/* Main Promo Dialog - Fixed frame, does not move on wheel scroll */}
      <div 
        id="promo-discount-modal"
        className="relative bg-white dark:bg-slate-900 w-full max-w-md sm:max-w-[500px] max-h-[88vh] sm:max-h-[84vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-250 border border-indigo-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Festive Header Banner (Fixed top of modal) */}
        <div className="relative shrink-0 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-3.5 sm:px-6 sm:py-4.5 overflow-hidden border-b border-white/10">
          {/* Background decorative circles & sparkles */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/15 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/15 rounded-full blur-lg pointer-events-none" />

          {/* Dấu X đóng quảng cáo */}
          <button
            ref={closeBtnRef}
            id="close-promo-modal-btn"
            type="button"
            onClick={handleButtonClick}
            className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-4 z-30 p-1.5 sm:p-2 text-white/80 hover:text-white transition-colors cursor-pointer select-none"
            title="Đóng"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </button>

          <div className="relative z-10 space-y-1 sm:space-y-1.5 pr-8 sm:pr-12">
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-500/20 text-sky-300 border border-blue-400/30 text-[9px] sm:text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="w-3 h-3 fill-sky-300 text-sky-300 shrink-0" />
              <span>Đại Tiệc Công Nghệ NovaShop 2026</span>
            </div>

            <h2 className="text-base sm:text-xl font-black tracking-tight leading-snug text-white">
              Ưu Đãi Khủng · <span className="text-sky-300">Giảm Tới 500.000₫</span>
            </h2>

            <p className="hidden sm:block text-xs text-slate-300 max-w-sm leading-relaxed">
              Chào mừng bạn đến với NovaShop! Thu thập ngay các mã giảm giá và quà tặng công nghệ độc quyền bên dưới.
            </p>

            {/* Urgency ticker */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-sky-200/90 font-medium">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse text-sky-300 shrink-0" />
              <span className="truncate">Tự động kích hoạt trực tiếp khi thanh toán</span>
            </div>
          </div>
        </div>

        {/* Voucher List Content (Scrollable inner body) */}
        <div className="flex-1 min-h-0 p-3 sm:p-4.5 space-y-2 sm:space-y-3 overflow-y-auto overscroll-contain bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs font-semibold px-0.5">
            <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 font-bold">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              Mã giảm giá ({VOUCHERS.length})
            </span>
            <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Áp dụng tại giỏ hàng
            </span>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {VOUCHERS.map((voucher) => {
              const isApplied = appliedVoucher?.code === voucher.code;
              const isCopied = copiedCode === voucher.code;

              return (
                <div 
                  key={voucher.code}
                  className={`group relative rounded-xl sm:rounded-2xl p-2.5 sm:p-4 transition-all duration-200 border ${
                    isApplied 
                      ? 'bg-emerald-50 dark:bg-emerald-950/55 border-emerald-500 dark:border-emerald-400 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    {/* Left details */}
                    <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Coupon badge code */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/25 text-indigo-800 dark:text-indigo-200 font-mono font-black text-[11px] sm:text-xs tracking-wider border border-indigo-200 dark:border-indigo-400/40">
                          {voucher.code}
                        </span>

                        {/* Special tags */}
                        {voucher.code === 'WELCOME10' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-300" /> Quà mới -10%
                          </span>
                        )}
                        {voucher.code === 'NOVATECH' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/25 text-rose-700 dark:text-rose-200 text-[9px] sm:text-[10px] font-bold">
                            Hot
                          </span>
                        )}
                        {voucher.code === 'FREESHIP' && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/25 text-sky-700 dark:text-sky-200 text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5">
                            <Truck className="w-2.5 h-2.5" /> Freeship
                          </span>
                        )}
                        {voucher.code === 'VIP500' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/25 text-amber-800 dark:text-amber-200 text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 fill-amber-600 text-amber-600" /> -500K
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] sm:text-[13px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-1 sm:line-clamp-none">
                        {voucher.description}
                      </p>

                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                        Đơn tối thiểu:{' '}
                        <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                          {formatVND(voucher.minOrderValue)}
                        </span>
                      </p>
                    </div>

                    {/* Right action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Copy button (Desktop & Tablet, or secondary icon on mobile) */}
                      <button
                        id={`copy-voucher-btn-${voucher.code}`}
                        type="button"
                        onClick={() => handleCopyCode(voucher)}
                        className={`p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 hover:border-indigo-400 hover:text-indigo-600 shadow-2xs'
                        }`}
                        title="Sao chép mã"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Chép mã</span>
                          </>
                        )}
                      </button>

                      {/* Apply button */}
                      <button
                        id={`apply-voucher-btn-${voucher.code}`}
                        type="button"
                        onClick={() => handleApplyNow(voucher)}
                        className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                          isApplied
                            ? 'bg-emerald-600 dark:bg-emerald-500 text-white cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white active:scale-95'
                        }`}
                      >
                        {isApplied ? (
                          <span>Đang dùng</span>
                        ) : (
                          <>
                            <span>Dùng ngay</span>
                            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee banner (hidden on mobile to keep modal concise) */}
          <div className="hidden sm:flex p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/90 dark:border-slate-700 items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Mã giảm giá áp dụng cùng lúc với các chương trình khuyến mãi và quà tặng chính hãng.</span>
          </div>
        </div>

        {/* Footer Actions (Fixed bottom of modal) */}
        <div className="shrink-0 px-3.5 py-3 sm:px-5 sm:py-3.5 bg-slate-50/80 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-3">
          <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <input 
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-pointer"
            />
            <span>Không hiện lại hôm nay</span>
          </label>

          <button
            id="explore-products-from-promo-btn"
            onClick={() => {
              handleClose();
              onExploreProducts();
            }}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Mua sắm ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
