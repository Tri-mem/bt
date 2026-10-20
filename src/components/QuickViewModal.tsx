import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShoppingCart,
  Zap,
  Check,
  Heart,
  Share2,
  Scale,
  Eye,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { Product } from '../types';
import { formatVND } from '../data/mockData';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string) => void;
  onBuyNow: (product: Product, quantity: number, color?: string) => void;
  onOpenFullDetail: (product: Product) => void;
  onCompare?: (product: Product) => void;
  isCompared?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onShare?: (product: Product) => void;
  onOpenInstallment?: (product: Product) => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  onOpenFullDetail,
  onCompare,
  isCompared = false,
  isWishlisted = false,
  onToggleWishlist,
  onShare,
  onOpenInstallment,
}) => {
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setActiveImage(product.image || FALLBACK_IMAGE);
      setSelectedColor(product.colors?.[0] || '');
      setQuantity(1);
      setJustAdded(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const gallery =
    product.gallery && product.gallery.length > 0
      ? product.gallery.filter(Boolean)
      : [product.image || FALLBACK_IMAGE];

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const monthlyInstallment = Math.round(
    product.price / (product.price >= 10000000 ? 12 : 6)
  );

  const quickSpecs = Object.entries(product.specs || {}).slice(0, 4);
  const quickHighlights = (product.highlights || []).slice(0, 3);

  const handleQuickAdd = () => {
    onAddToCart(product, quantity, selectedColor || undefined);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="quick-view-modal"
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
              <Eye className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">
                Xem Nhanh Thông Tin Sản Phẩm
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullDetail(product);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-cyan-300 flex items-center gap-1 border border-white/15 transition-colors cursor-pointer"
            >
              <span>Chi tiết đầy đủ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer"
              aria-label="Đóng xem nhanh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* Left Column: Product Visual & Thumbnails */}
          <div className="md:col-span-5 space-y-3">
            <div className="relative aspect-square w-full rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex items-center justify-center overflow-hidden">
              <img
                src={activeImage || product.image || FALLBACK_IMAGE}
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
              />

              {product.badge && (
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-blue-600 text-white shadow-xs">
                  {product.badge}
                </span>
              )}

              {discountPercent > 0 && (
                <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-600 text-white shadow-xs">
                  -{discountPercent}%
                </span>
              )}

              {/* Quick Wishlist & Share icons */}
              <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                {onToggleWishlist && (
                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    className={`p-2 rounded-full shadow-xs border transition-colors cursor-pointer ${
                      isWishlisted
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : 'bg-white/90 text-slate-500 hover:text-rose-500 border-slate-200/80'
                    }`}
                    title={isWishlisted ? 'Bỏ yêu thích' : 'Yêu thích'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isWishlisted ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                  </button>
                )}
                {onShare && (
                  <button
                    type="button"
                    onClick={() => onShare(product)}
                    className="p-2 rounded-full bg-white/90 text-slate-500 hover:text-blue-600 border border-slate-200/80 shadow-xs transition-colors cursor-pointer"
                    title="Chia sẻ sản phẩm"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Thumbnail strip */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {gallery.slice(0, 5).map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-12 h-12 rounded-xl border p-1 bg-slate-50 shrink-0 transition-all cursor-pointer ${
                      activeImage === imgUrl
                        ? 'border-blue-600 ring-2 ring-blue-500/20 bg-white'
                        : 'border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-200/70">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Chính hãng 100%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-200/70">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold">Giao nhanh 2h</span>
              </div>
            </div>
          </div>

          {/* Right Column: Key Info, Quick Specs & Instant Actions */}
          <div className="md:col-span-7 space-y-3.5">
            <div>
              {/* Category, Rating, Stock */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-bold text-indigo-600">{product.categoryName}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {product.rating}
                  <span className="font-normal text-slate-500">
                    ({product.reviewCount} đánh giá)
                  </span>
                </span>
                <span>·</span>
                <span className="text-emerald-700 font-semibold">
                  Còn {product.stock} máy
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {product.name}
              </h2>

              <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Pricing & Installment Box */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg sm:text-xl font-black text-blue-600 tabular-nums">
                    {formatVND(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-slate-400 line-through tabular-nums">
                      {formatVND(product.originalPrice)}
                    </span>
                  )}
                </div>
                {product.price >= 500000 && (
                  <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                    Trả góp 0%: chỉ từ{' '}
                    <strong className="tabular-nums">
                      ~{formatVND(monthlyInstallment)}/tháng
                    </strong>
                  </div>
                )}
              </div>

              {product.price >= 500000 && onOpenInstallment && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInstallment(product);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  Tính trả góp 0%
                </button>
              )}
            </div>

            {/* Quick 4 Specs Grid */}
            {quickSpecs.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-700">
                  Thông số kỹ thuật nổi bật:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickSpecs.map(([label, value]) => (
                    <div
                      key={label}
                      className="p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs"
                    >
                      <div className="text-[11px] text-slate-500 truncate">{label}</div>
                      <div className="font-bold text-slate-800 truncate mt-0.5">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Highlights */}
            {quickHighlights.length > 0 && (
              <ul className="space-y-1">
                {quickHighlights.map((hl, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 text-xs text-slate-600"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{hl}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Color & Quantity Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Màu sắc / Phiên bản:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          selectedColor === color
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Số lượng:
                </span>
                <div className="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-extrabold text-slate-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                    className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleQuickAdd}
                className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  justAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã thêm vào giỏ!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Thêm vào giỏ</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBuyNow(product, quantity, selectedColor || undefined);
                }}
                className="flex-1 min-w-[130px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Mua ngay</span>
              </button>

              {onCompare && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCompare(product);
                  }}
                  className={`py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    isCompared
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200'
                  }`}
                  title="Đưa vào bảng so sánh thông số"
                >
                  <Scale className="w-4 h-4" />
                  <span>{isCompared ? 'Đang so sánh' : 'So sánh'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
