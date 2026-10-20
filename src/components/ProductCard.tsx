import React, { useState } from 'react';
import { Star, ShoppingCart, Heart, Check, Share2, Scale } from 'lucide-react';
import { Product } from '../types';
import { formatVND } from '../data/mockData';

export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden relative ${className}`}
      aria-label="Đang tải dữ liệu sản phẩm..."
    >
      {/* Image Skeleton */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full bg-slate-100 overflow-hidden">
        <div className="w-full h-full bg-slate-200" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />

        {/* Skeleton Badge */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 w-12 sm:w-16 h-4 sm:h-5 rounded-lg bg-slate-300/80" />

        {/* Skeleton Action buttons */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex flex-col gap-1.5 z-10">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200/90 shadow-xs" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="h-3 w-16 sm:w-20 bg-slate-200 rounded-md" />
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-amber-200/80" />
              <div className="h-3 w-6 sm:w-8 bg-slate-200 rounded-md" />
            </div>
          </div>

          {/* Product Name (2 Lines) */}
          <div className="space-y-1 mb-2">
            <div className="h-3.5 sm:h-4 w-11/12 bg-slate-200 rounded-md" />
            <div className="h-3.5 sm:h-4 w-2/3 bg-slate-200 rounded-md" />
          </div>

          {/* Color options pill skeleton */}
          <div className="h-2.5 sm:h-3 w-20 sm:w-28 bg-slate-200/70 rounded-md mb-2" />

          {/* Installment prompt skeleton */}
          <div className="h-6 sm:h-7 w-full bg-slate-100 rounded-lg border border-slate-200/60" />
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div className="space-y-1">
            <div className="h-4 sm:h-5 w-20 sm:w-24 bg-slate-200 rounded-md" />
            <div className="h-2.5 sm:h-3 w-12 sm:w-16 bg-slate-200/60 rounded-md" />
          </div>

          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-slate-200 shrink-0" />
        </div>
      </div>
    </div>
  );
};

interface ProductCardProps {
  product?: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, event: React.MouseEvent) => void;
  isAddedJustNow?: boolean;
  onShare?: (product: Product) => void;
  onOpenInstallment?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  isCompared?: boolean;
  onCompare?: (product: Product) => void;
  isLoading?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
  isAddedJustNow = false,
  onShare,
  onOpenInstallment,
  onQuickView,
  isCompared = false,
  onCompare,
  isLoading = false,
  className = '',
}) => {
  const [justCopied, setJustCopied] = useState<boolean>(false);

  if (isLoading || !product) {
    return <ProductCardSkeleton className={className} />;
  }

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const monthlyInstallment = Math.round(product.price / (product.price >= 10000000 ? 12 : 6));

  const badgeMap: Record<string, string> = {
    'Hot': 'bg-rose-500/90 text-white',
    'Mới': 'bg-blue-500/90 text-white',
    'Giảm sốc': 'bg-amber-500/90 text-white font-bold',
    'Bán chạy': 'bg-emerald-500/90 text-white',
  };
  const badgeColor = (product.badge && badgeMap[product.badge]) || 'bg-blue-500/90 text-white';

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(product);
    } else {
      try {
        const shareUrl = `${window.location.origin}?product=${product.id}`;
        if (navigator.share) {
          navigator.share({
            title: `${product.name} - NovaShop`,
            text: `Xem ngay ${product.name} giá ưu đãi ${formatVND(product.price)} tại NovaShop!`,
            url: shareUrl,
          }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareUrl);
          setJustCopied(true);
          setTimeout(() => setJustCopied(false), 2000);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div 
      id={`product-card-${product.id}`}
      className={`group bg-white rounded-2xl border transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden relative cursor-pointer ${
        isCompared
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
          : 'border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-lg hover:shadow-slate-900/5'
      }`}
      onClick={() => onSelectProduct?.(product)}
    >
      {/* Image container: responsive aspect ratio & object-contain for optimal mobile display */}
      <div className="product-img-studio relative aspect-[4/3] sm:aspect-square w-full overflow-hidden flex items-center justify-center p-2.5 sm:p-4">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'}
          alt={product.name}
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300 filter drop-shadow-2xs"
          style={{ objectFit: 'contain', maxWidth: '100%', height: '100%' }}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';
          }}
        />

        {/* Badge */}
        {product.badge && (
          <span className={`absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold rounded-lg shadow-xs uppercase tracking-wider ${badgeColor}`}>
            {product.badge}
          </span>
        )}

        {/* Discount tag */}
        {discountPercent > 0 && (
          <span className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 bg-rose-600 text-white text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
            -{discountPercent}%
          </span>
        )}

        {/* Action buttons (Top-Right): Wishlist & Share */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex flex-col gap-1.5 z-10">
          {/* Wishlist toggle */}
          <button
            id={`wishlist-toggle-${product.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist?.(product.id);
            }}
            className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 shadow-xs cursor-pointer ${
              isWishlisted 
                ? 'bg-rose-50 text-rose-600 shadow-sm' 
                : 'bg-white/90 backdrop-blur-xs text-slate-400 hover:text-rose-500 hover:bg-white'
            }`}
            title={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Share button */}
          <button
            id={`share-btn-${product.id}`}
            type="button"
            onClick={handleShareClick}
            className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 shadow-xs cursor-pointer ${
              justCopied
                ? 'bg-emerald-600 text-white shadow-emerald-200 scale-105'
                : 'bg-white/90 backdrop-blur-xs text-slate-500 hover:text-blue-600 hover:bg-white active:scale-95'
            }`}
            title={justCopied ? 'Đã sao chép link!' : 'Chia sẻ sản phẩm'}
          >
            {justCopied ? (
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            ) : (
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-slate-500 mb-1">
            <span className="font-semibold text-indigo-600/90 truncate">{product.categoryName}</span>
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-700">{product.rating}</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight sm:leading-snug mb-1.5 min-h-[30px] sm:min-h-[38px]">
            {product.name}
          </h3>

          {/* Color options pill */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 mb-1.5 text-[10px] sm:text-[11px]">
              <span className="text-slate-400">{product.colors.length} màu</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium truncate">
                {product.colors.join(' • ')}
              </span>
            </div>
          )}

          {/* Installment calculation interactive prompt */}
          {product.price >= 500000 && (
            <div className="mb-2">
              <button
                type="button"
                id={`installment-calc-btn-${product.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInstallment?.(product);
                }}
                className="w-full text-left py-1 px-1.5 sm:py-1 sm:px-2 rounded-lg bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/75 text-amber-900 transition-colors flex items-center justify-between gap-1 group/inst cursor-pointer min-w-0"
                title="Xem chi tiết bảng tính trả góp 0%"
              >
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold truncate min-w-0">
                  <span className="font-bold text-amber-700 shrink-0">Góp 0%:</span>
                  <span className="text-slate-700 tabular-nums truncate">~{formatVND(monthlyInstallment)}/th</span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-amber-600 font-bold group-hover/inst:translate-x-0.5 transition-transform shrink-0">
                  →
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Pricing & Action buttons (So sánh + Mua) */}
        <div className="pt-2 border-t border-slate-100 mt-auto space-y-2">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="min-w-0">
              <div className="text-xs sm:text-sm md:text-base font-extrabold text-blue-600 tabular-nums truncate">
                {formatVND(product.price)}
              </div>
              {product.originalPrice && (
                <div className="text-[10px] sm:text-[11px] text-slate-400 line-through tabular-nums truncate">
                  {formatVND(product.originalPrice)}
                </div>
              )}
            </div>

            <button
              id={`add-to-cart-btn-${product.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(product, e);
              }}
              className={`p-2 sm:p-2.5 min-w-[34px] min-h-[34px] sm:min-w-0 sm:min-h-0 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer ${
                isAddedJustNow
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-blue-600 text-white shadow-2xs active:scale-95'
              }`}
              title="Thêm vào giỏ hàng"
            >
              {isAddedJustNow ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden md:inline">Đã thêm</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden md:inline">Mua</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              id={`detail-btn-${product.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProduct?.(product);
              }}
              className="w-full py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/90 hover:border-blue-300 transition-all duration-200 cursor-pointer"
              title="Xem thông tin chi tiết sản phẩm"
            >
              <span className="truncate">Xem chi tiết</span>
            </button>

            {onCompare ? (
              <button
                id={`compare-btn-${product.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare(product);
                }}
                className={`w-full py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 border transition-all duration-200 cursor-pointer ${
                  isCompared
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200/90 hover:border-indigo-300'
                }`}
                title="So sánh thông số kỹ thuật sản phẩm này"
              >
                <Scale className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isCompared ? 'Đang so sánh' : 'So sánh'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProduct?.(product);
                }}
                className="w-full py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 transition-all duration-200 cursor-pointer"
              >
                <span className="truncate">Chi tiết</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
