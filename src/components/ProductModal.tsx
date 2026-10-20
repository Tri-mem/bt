import React, { useState, useRef } from 'react';
import { 
  X, 
  Star, 
  ShoppingCart, 
  Zap, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Check, 
  Plus, 
  Minus, 
  Heart, 
  Share2, 
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Product } from '../types';
import { formatVND } from '../data/mockData';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string) => void;
  onBuyNow: (product: Product, quantity: number, color?: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onShare?: (product: Product) => void;
  onOpenInstallment?: (product: Product) => void;
}

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist,
  onShare,
  onOpenInstallment,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(product?.image || '');
  const [selectedColor, setSelectedColor] = useState<string>(product?.colors?.[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);

  React.useEffect(() => {
    if (product) {
      setSelectedImage(product.image || FALLBACK_PRODUCT_IMAGE);
      setSelectedColor(product.colors?.[0] || '');
      setQuantity(1);
      setIsLightboxOpen(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const rawGallery =
    product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
  const galleryList = rawGallery
    .map((img) => img?.trim())
    .filter((img): img is string => Boolean(img));
  if (galleryList.length === 0) {
    galleryList.push(FALLBACK_PRODUCT_IMAGE);
  }

  const activeImage =
    selectedImage && galleryList.includes(selectedImage)
      ? selectedImage
      : product.image?.trim() || galleryList[0] || FALLBACK_PRODUCT_IMAGE;

  const currentImgIdx = Math.max(0, galleryList.indexOf(activeImage));

  const handleNextImage = () => {
    const nextIdx = (currentImgIdx + 1) % galleryList.length;
    setSelectedImage(galleryList[nextIdx]);
  };

  const handlePrevImage = () => {
    const prevIdx = (currentImgIdx - 1 + galleryList.length) % galleryList.length;
    setSelectedImage(galleryList[prevIdx]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handlePrevImage();
      } else {
        handleNextImage();
      }
    }
    touchStartX.current = null;
  };

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    onAddToCart?.(product, quantity, selectedColor);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleBuyNow = () => {
    onBuyNow?.(product, quantity, selectedColor);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
          onClick={onClose} 
        />

        {/* Modal Card */}
        <div 
          id="product-detail-modal"
          className="relative bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto max-h-[94vh] sm:max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            id="close-product-modal-btn"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-xs border border-slate-200/60 cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Content Scrollable Container */}
          <div className="overflow-y-auto p-3.5 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              
              {/* Left: Gallery & Main Image (Responsive & Mobile-Optimized) */}
              <div className="flex flex-col gap-2.5 sm:gap-3">
                <div 
                  className="relative aspect-[4/3] sm:aspect-square max-h-[250px] sm:max-h-[360px] md:max-h-[420px] w-full rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100/90 overflow-hidden border border-slate-200/70 shadow-2xs flex items-center justify-center p-3 sm:p-4 group select-none cursor-pointer"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => setIsLightboxOpen(true)}
                  title="Nhấp để phóng to ảnh xem chi tiết"
                >
                  <img
                    src={activeImage || FALLBACK_PRODUCT_IMAGE}
                    alt={product.name}
                    width={600}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain object-center transition-all duration-300 filter drop-shadow-xs"
                    style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';
                    }}
                  />

                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg uppercase tracking-wide shadow-xs">
                      {product.badge}
                    </span>
                  )}

                  {/* Next / Previous image buttons overlay */}
                  {galleryList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevImage();
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md backdrop-blur-xs transition-transform active:scale-90 z-10 cursor-pointer"
                        aria-label="Ảnh trước"
                        title="Ảnh trước"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextImage();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md backdrop-blur-xs transition-transform active:scale-90 z-10 cursor-pointer"
                        aria-label="Ảnh kế tiếp"
                        title="Ảnh kế tiếp"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Photo index pill */}
                      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1 z-10">
                        <span>{currentImgIdx + 1} / {galleryList.length}</span>
                      </div>
                    </>
                  )}

                  {/* Action buttons (Top-Left below badge on mobile, Top-Right on desktop): Wishlist & Share */}
                  <div className="absolute bottom-2.5 left-2.5 sm:bottom-auto sm:left-auto sm:top-3 sm:right-3 flex flex-row sm:flex-col gap-1.5 sm:gap-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <button
                      id="modal-wishlist-btn"
                      onClick={() => onToggleWishlist?.(product.id)}
                      className={`p-2 sm:p-2.5 rounded-full transition-all duration-150 shadow-xs border border-slate-200/60 cursor-pointer ${
                        isWishlisted 
                          ? 'bg-rose-50 text-rose-600 shadow-sm' 
                          : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white'
                      }`}
                      title={isWishlisted ? 'Xóa khỏi danh sách yêu thích' : 'Lưu vào yêu thích'}
                    >
                      <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    {onShare && (
                      <button
                        id="modal-share-btn"
                        onClick={() => onShare(product)}
                        className="p-2 sm:p-2.5 rounded-full transition-all duration-150 shadow-xs bg-white/90 text-slate-500 hover:text-blue-600 hover:bg-white cursor-pointer active:scale-95 border border-slate-200/60"
                        title="Chia sẻ sản phẩm"
                      >
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>

                  {/* Fullscreen zoom hint button (Bottom-Right) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightboxOpen(true);
                    }}
                    className="absolute bottom-2.5 right-2.5 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white text-slate-600 shadow-xs backdrop-blur-xs transition-transform active:scale-90 z-10 cursor-pointer"
                    title="Phóng to ảnh toàn màn hình"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnails (Compact on Mobile) */}
                {galleryList.length > 1 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {galleryList.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all p-1 bg-white cursor-pointer ${
                          activeImage === img 
                            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs' 
                            : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={img || FALLBACK_PRODUCT_IMAGE} 
                          alt={`${product.name} thumbnail ${idx}`} 
                          width={64}
                          height={64}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain" 
                          style={{ objectFit: 'contain' }}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 flex flex-col items-center gap-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Chính hãng 100%</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 flex flex-col items-center gap-0.5">
                    <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Giao hỏa tốc 2h</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 flex flex-col items-center gap-0.5">
                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Đổi trả 30 ngày</span>
                  </div>
                </div>
              </div>

              {/* Right: Info, Price, Options & Actions */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                    <span>{product.categoryName}</span>
                    <span>•</span>
                    <span className="text-slate-400">Mã: {product.id}</span>
                  </div>

                  <h1 className="text-lg sm:text-2xl font-bold text-slate-900 mb-2 leading-tight">
                    {product.name}
                  </h1>

                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                      <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-xs sm:text-sm text-slate-800">{product.rating}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      ({product.reviewCount} đánh giá)
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs font-medium text-emerald-600">
                      Còn {product.stock} sản phẩm
                    </span>
                  </div>

                  {/* Price block */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-baseline gap-3 mb-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-blue-700">
                      {formatVND(product.price)}
                    </span>
                    {product.originalPrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-slate-400 line-through">
                          {formatVND(product.originalPrice)}
                        </span>
                        <span className="bg-rose-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded">
                          -{discountPercent}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 0% Installment Offer Banner */}
                  {product.price >= 500000 && (
                    <div className="mb-3.5 p-2.5 sm:p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="keep-dark-text p-1.5 sm:p-2 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] sm:text-xs shrink-0 flex items-center justify-center">
                          0%
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5 flex-wrap">
                            <span>Trả góp 0% Lãi suất:</span>
                            <span className="text-blue-700 font-extrabold">
                              chỉ từ ~{formatVND(Math.round(product.price / (product.price >= 10000000 ? 12 : 6)))}/tháng
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-600">
                            Thẻ tín dụng 25+ ngân hàng hoặc CCCD gắn chip (duyệt online 5 phút)
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenInstallment?.(product)}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 transition-colors shrink-0 shadow-2xs cursor-pointer"
                      >
                        Bảng tính trả góp →
                      </button>
                    </div>
                  )}

                  {/* Highlights */}
                  {product.highlights && product.highlights.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                        Đặc điểm nổi bật
                      </h3>
                      <ul className="space-y-1.5">
                        {product.highlights.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Colors */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                        Màu sắc: <span className="text-blue-600 font-normal">{selectedColor}</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              selectedColor === color
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity & CTA */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Số lượng:
                      </span>
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-800">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                          disabled={quantity >= product.stock}
                          className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs text-slate-400">
                        (Tối đa {product.stock} sản phẩm)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                      <button
                        id="add-to-cart-modal-btn"
                        type="button"
                        onClick={handleAddToCart}
                        className={`py-2.5 sm:py-3 px-2.5 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-all duration-200 cursor-pointer ${
                          addedAnimation
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-[0.98]'
                        }`}
                      >
                        {addedAnimation ? (
                          <>
                            <Check className="w-4 h-4 shrink-0" /> Đã thêm!
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 shrink-0" /> Thêm giỏ hàng
                          </>
                        )}
                      </button>

                      <button
                        id="installment-product-modal-btn"
                        type="button"
                        onClick={() => onOpenInstallment?.(product)}
                        className="keep-dark-text py-2.5 sm:py-3 px-2.5 sm:px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                        title="Đăng ký mua trả góp 0% duyệt nhanh 5 phút"
                      >
                        <CalendarClock className="w-4 h-4 text-slate-950 shrink-0" />
                        <span>TRẢ GÓP 0%</span>
                      </button>

                      <button
                        id="buy-now-modal-btn"
                        type="button"
                        onClick={handleBuyNow}
                        className="col-span-2 sm:col-span-1 py-3 sm:py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Zap className="w-4 h-4 shrink-0" /> Mua ngay
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Product Description & Technical Specifications Section */}
            <div className="mt-6 pt-5 border-t border-slate-200/80 grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Description */}
              <div className="lg:col-span-5 space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Mô tả sản phẩm
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Technical Specs Table */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="lg:col-span-7 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Thông số kỹ thuật chi tiết
                  </h3>
                  <div className="rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 text-xs">
                    {Object.entries(product.specs).map(([key, val], idx) => (
                      <div
                        key={key}
                        className={`grid grid-cols-12 px-3.5 py-2 ${
                          idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'
                        }`}
                      >
                        <span className="col-span-5 font-semibold text-slate-500">{key}</span>
                        <span className="col-span-7 font-bold text-slate-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20">
                {currentImgIdx + 1} / {galleryList.length}
              </span>
              <span className="text-xs text-slate-300 font-medium truncate max-w-[200px] sm:max-w-md">
                {product.name}
              </span>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Đóng phóng to"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Center Image with Navigation */}
          <div 
            className="relative flex-1 flex items-center justify-center my-2 max-w-5xl mx-auto w-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            {galleryList.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 sm:left-4 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-xs transition-transform active:scale-90 z-20 cursor-pointer"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={activeImage || FALLBACK_PRODUCT_IMAGE}
              alt={product.name}
              className="max-h-[75vh] max-w-full object-contain filter drop-shadow-2xl transition-all duration-200"
            />

            {galleryList.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 sm:right-4 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-xs transition-transform active:scale-90 z-20 cursor-pointer"
                aria-label="Ảnh sau"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails */}
          {galleryList.length > 1 && (
            <div 
              className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 p-1 bg-white/10 transition-all shrink-0 cursor-pointer ${
                    activeImage === img 
                      ? 'border-blue-500 scale-105' 
                      : 'border-white/30 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img || FALLBACK_PRODUCT_IMAGE}
                    alt={`Thumb ${idx}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
