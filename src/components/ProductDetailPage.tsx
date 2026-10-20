import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
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
  Maximize2,
  X,
  Sparkles,
  PackageCheck,
  Award,
  Headphones,
  CheckCircle2,
  FileText,
  BadgeCheck,
  ThumbsUp,
  MessageSquarePlus,
  Send,
  HelpCircle,
  Tag
} from 'lucide-react';
import { Product } from '../types';
import { formatVND } from '../data/mockData';
import { smoothScrollToElement, smoothScrollToTop } from '../utils/smoothScroll';

interface ProductDetailPageProps {
  product: Product;
  onBackToHome: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string) => void;
  onBuyNow: (product: Product, quantity: number, color?: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onShare?: (product: Product) => void;
  onOpenInstallment?: (product: Product) => void;
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
  onOpenPolicy?: (tab: 'warranty' | 'shipping' | 'return' | 'payment') => void;
  onOpenCart?: () => void;
  onShowToast?: (type: 'success' | 'info' | 'error', title: string, description?: string) => void;
}

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';

interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  likes: number;
  avatarColor: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBackToHome,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist,
  onShare,
  onOpenInstallment,
  allProducts = [],
  onSelectProduct,
  onOpenPolicy,
  onOpenCart,
  onShowToast,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(product.image || FALLBACK_PRODUCT_IMAGE);
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews' | 'warranty'>('desc');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Review submission state
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([
    {
      id: 'rev-1',
      author: 'Nguyễn Văn Minh',
      rating: 5,
      date: '3 ngày trước',
      comment: 'Máy nguyên seal chính hãng, giao hàng hỏa tốc trong 1 tiếng rưỡi tại TP.HCM. Đóng gói cẩn thận 3 lớp, nhân viên tư vấn nhiệt tình. Rất hài lòng!',
      verified: true,
      likes: 14,
      avatarColor: 'bg-blue-600',
    },
    {
      id: 'rev-2',
      author: 'Trần Thị Thu Thảo',
      rating: 5,
      date: '1 tuần trước',
      comment: 'Màu sắc bên ngoài đẹp hơn trong hình. Hiệu năng mượt mà, màn hình sáng và sắc nét. Có bảo hành chính hãng đầy đủ nên rất an tâm.',
      verified: true,
      likes: 9,
      avatarColor: 'bg-emerald-600',
    },
    {
      id: 'rev-3',
      author: 'Lê Hoàng Nam',
      rating: 4,
      date: '2 tuần trước',
      comment: 'Sản phẩm dùng tốt, pin trâu đúng như mô tả. Đóng gói đẹp, giá cả hợp lý kèm voucher giảm giá sâu.',
      verified: true,
      likes: 5,
      avatarColor: 'bg-purple-600',
    },
  ]);

  // Touch swipe handling for mobile image carousel
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setSelectedImage(product.image || FALLBACK_PRODUCT_IMAGE);
    setSelectedColor(product.colors?.[0] || '');
    setQuantity(1);
    setIsLightboxOpen(false);
    smoothScrollToTop();
  }, [product]);

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

  const savingsAmount = product.originalPrice ? product.originalPrice - product.price : 0;

  const monthlyInstallment = Math.round(product.price / (product.price >= 10000000 ? 12 : 6));

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedColor);
    setAddedAnimation(true);
    if (onShowToast) {
      onShowToast('success', 'Đã thêm vào giỏ hàng!', `${product.name} (SL: ${quantity}) đã có trong giỏ hàng.`);
    }
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleBuyNow = () => {
    onBuyNow(product, quantity, selectedColor);
  };

  const handleShare = () => {
    if (onShare) {
      onShare(product);
    } else {
      try {
        const shareUrl = `${window.location.origin}?product=${product.id}`;
        if (navigator.share) {
          navigator.share({
            title: `${product.name} - NovaShop`,
            text: `Xem ngay ${product.name} với giá ưu đãi ${formatVND(product.price)} tại NovaShop!`,
            url: shareUrl,
          }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareUrl);
          setCopiedLink(true);
          if (onShowToast) {
            onShowToast('success', 'Đã sao chép liên kết!', 'Bạn có thể gửi liên kết sản phẩm này cho bạn bè.');
          }
          setTimeout(() => setCopiedLink(false), 2000);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) {
      if (onShowToast) {
        onShowToast('error', 'Chưa đủ thông tin', 'Vui lòng nhập tên của bạn và nội dung đánh giá.');
      }
      return;
    }
    const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-blue-600', 'bg-rose-600', 'bg-amber-600'];
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: newReviewAuthor.trim(),
      rating: newReviewRating,
      date: 'Vừa xong',
      comment: newReviewComment.trim(),
      verified: true,
      likes: 1,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };
    setReviewsList([newRev, ...reviewsList]);
    setNewReviewAuthor('');
    setNewReviewComment('');
    if (onShowToast) {
      onShowToast('success', 'Đánh giá thành công!', 'Cảm ơn bạn đã chia sẻ cảm nhận về sản phẩm.');
    }
  };

  // Filter related products (same category or others, excluding current product)
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.categoryName === product.categoryName))
    .slice(0, 4);

  return (
    <div id="product-detail-page" className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-20 sm:pb-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#1a2642] p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex-wrap">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <button
            type="button"
            onClick={onBackToHome}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Trang chủ
          </button>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {product.categoryName}
          </span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isWishlisted
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-800'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-rose-500 hover:bg-rose-50/50'
            }`}
            title={isWishlisted ? 'Xóa khỏi danh sách yêu thích' : 'Lưu vào yêu thích'}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{isWishlisted ? 'Đã yêu thích' : 'Yêu thích'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer"
            title="Chia sẻ sản phẩm"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Đã chép link</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Chia sẻ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Product Showcase Card */}
      <div className="bg-white dark:bg-[#1a2642] rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-md p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* Left Column: Image Gallery & Guarantees (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main Image Stage */}
            <div
              className="relative aspect-square w-full rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100/90 dark:from-slate-900/60 dark:to-slate-800/80 overflow-hidden border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-center p-4 sm:p-6 select-none cursor-pointer group"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={() => setIsLightboxOpen(true)}
              title="Nhấp để phóng to ảnh toàn màn hình"
            >
              <img
                src={activeImage}
                alt={product.name}
                width={700}
                height={700}
                className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105 filter drop-shadow-sm"
                style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                }}
              />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                {product.badge && (
                  <span className="bg-blue-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider shadow-xs">
                    {product.badge}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg shadow-xs">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              {/* Prev / Next buttons */}
              {galleryList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 shadow-md backdrop-blur-xs transition-transform active:scale-90 z-10 cursor-pointer hover:bg-white"
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 shadow-md backdrop-blur-xs transition-transform active:scale-90 z-10 cursor-pointer hover:bg-white"
                    aria-label="Ảnh kế tiếp"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-1 z-10">
                    <span>{currentImgIdx + 1} / {galleryList.length}</span>
                  </div>
                </>
              )}

              {/* Fullscreen icon button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-200 shadow-xs backdrop-blur-xs transition-transform active:scale-90 z-10 cursor-pointer hover:bg-white"
                title="Phóng to ảnh"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Strip */}
            {galleryList.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {galleryList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all p-1 bg-white dark:bg-slate-800 cursor-pointer ${
                      activeImage === img
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust & Guarantee Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/80">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex flex-col items-center text-center gap-1">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">100% Chính hãng</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Hoàn tiền 200% nếu giả</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex flex-col items-center text-center gap-1">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Giao hỏa tốc 2h</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Nội thành TP.HCM & HN</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex flex-col items-center text-center gap-1">
                <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Đổi mới 30 ngày</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Nếu có lỗi nhà sản xuất</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex flex-col items-center text-center gap-1">
                <BadgeCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Bảo hành VIP</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">12 - 24 tháng chuẩn hãng</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Specs, Colors & Actions (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div>
              {/* Category & Code */}
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                <span className="bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  {product.categoryName}
                </span>
                <span>•</span>
                <span className="text-slate-400">Mã SP: {product.id}</span>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight mb-3">
                {product.name}
              </h1>

              {/* Rating, Reviews count & Stock */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200/70 dark:border-amber-800/60">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    {product.rating}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('reviews');
                    smoothScrollToElement('product-tabs-section');
                  }}
                  className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  ({product.reviewCount} đánh giá từ khách hàng)
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Còn {product.stock} sản phẩm sẵn có</span>
                </div>
              </div>

              {/* Price Banner */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50/20 dark:from-slate-800/90 dark:via-indigo-950/30 dark:to-slate-800/90 border border-blue-200/80 dark:border-indigo-900/50 space-y-2">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-700 dark:text-blue-400 tracking-tight">
                    {formatVND(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm sm:text-base text-slate-400 line-through">
                      {formatVND(product.originalPrice)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-md shadow-xs">
                      Tiết kiệm {formatVND(savingsAmount)} (-{discountPercent}%)
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Giá đã bao gồm VAT và gói bảo hành chính hãng tiêu chuẩn NovaCare.</span>
                </p>
              </div>

              {/* 0% Installment Offer Box */}
              {product.price >= 500000 && (
                <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="keep-dark-text p-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shrink-0 flex items-center justify-center">
                      0%
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 flex-wrap">
                        <span>Hỗ trợ trả góp 0% Lãi suất:</span>
                        <span className="text-blue-700 dark:text-blue-400 font-extrabold">
                          chỉ từ ~{formatVND(monthlyInstallment)}/tháng
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Qua thẻ tín dụng 25+ ngân hàng hoặc CCCD gắn chip (xét duyệt online 5 phút).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenInstallment?.(product)}
                    className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 bg-white dark:bg-slate-800 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 transition-colors shrink-0 shadow-2xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Bảng tính trả góp →</span>
                  </button>
                </div>
              )}

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="mt-5 space-y-2">
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Màu sắc lựa chọn: <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedColor === color
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {selectedColor === color && <Check className="w-3.5 h-3.5" />}
                        <span>{color}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights Bullet List */}
              {product.highlights && product.highlights.length > 0 && (
                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Đặc điểm nổi bật
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector & Action CTAs */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Số lượng:
                  </span>
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="p-2 sm:p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                      className="p-2 sm:p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">
                    (Tối đa {product.stock} chiếc/đơn)
                  </span>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <button
                    id="add-to-cart-page-btn"
                    type="button"
                    onClick={handleAddToCart}
                    className={`py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all duration-200 cursor-pointer ${
                      addedAnimation
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 active:scale-[0.98]'
                    }`}
                  >
                    {addedAnimation ? (
                      <>
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Đã thêm vào giỏ!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 shrink-0" />
                        <span>Thêm vào giỏ</span>
                      </>
                    )}
                  </button>

                  <button
                    id="installment-page-btn"
                    type="button"
                    onClick={() => onOpenInstallment?.(product)}
                    className="keep-dark-text py-3 sm:py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    title="Đăng ký mua trả góp duyệt online 5 phút"
                  >
                    <CalendarClock className="w-4 h-4 text-slate-950 shrink-0" />
                    <span>TRẢ GÓP 0%</span>
                  </button>

                  <button
                    id="buy-now-page-btn"
                    type="button"
                    onClick={handleBuyNow}
                    className="py-3 sm:py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/25 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 shrink-0" />
                    <span>MUA NGAY</span>
                  </button>
                </div>
              </div>

              {/* Special Promotion Gifts Box */}
              <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Ưu đãi & Quà tặng kèm độc quyền tại NovaShop:</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 pl-6 list-disc">
                  <li>Tặng voucher giảm 10% cho phụ kiện mua kèm (bao da, cáp sạc, tai nghe).</li>
                  <li>Miễn phí cài đặt phần mềm và hỗ trợ kỹ thuật trọn đời máy.</li>
                  <li>Giao hàng hỏa tốc trong 2 giờ tại nội thành Hà Nội & TP. Hồ Chí Minh.</li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Tabs Navigation Section (Description / Specs / Reviews / Warranty) */}
      <section id="product-tabs-section" className="bg-white dark:bg-[#1a2642] rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-md p-4 sm:p-6 md:p-8 space-y-6">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'desc'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Mô tả sản phẩm
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Thông số kỹ thuật
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Đánh giá khách hàng</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              {reviewsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('warranty')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'warranty'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Chính sách bảo hành
          </button>
        </div>

        {/* Tab 1: Description */}
        {activeTab === 'desc' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Tổng quan chi tiết về {product.name}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Điểm nổi bật của sản phẩm:
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {product.highlights?.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Specs */}
        {activeTab === 'specs' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Bảng thông số kỹ thuật chi tiết
            </h3>
            {product.specs && Object.keys(product.specs).length > 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/80 text-xs sm:text-sm">
                {Object.entries(product.specs).map(([key, val], idx) => (
                  <div
                    key={key}
                    className={`grid grid-cols-12 px-4 py-3 ${
                      idx % 2 === 0
                        ? 'bg-slate-50/70 dark:bg-slate-800/40'
                        : 'bg-white dark:bg-slate-800/90'
                    }`}
                  >
                    <span className="col-span-5 sm:col-span-4 font-semibold text-slate-500 dark:text-slate-400">
                      {key}
                    </span>
                    <span className="col-span-7 sm:col-span-8 font-bold text-slate-900 dark:text-slate-100">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500">
                Đang cập nhật thông số kỹ thuật chi tiết từ nhà sản xuất.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Reviews Summary Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 items-center">
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pb-4 md:pb-0 md:pr-4">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100">
                  {product.rating}
                </span>
                <div className="flex items-center gap-1 my-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(product.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Dựa trên {product.reviewCount} lượt đánh giá thực tế
                </span>
              </div>

              <div className="md:col-span-8 space-y-1.5 text-xs">
                {[
                  { star: 5, pct: 86 },
                  { star: 4, pct: 10 },
                  { star: 3, pct: 3 },
                  { star: 2, pct: 1 },
                  { star: 1, pct: 0 },
                ].map((item) => (
                  <div key={item.star} className="flex items-center gap-3">
                    <span className="w-10 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                      {item.star} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-slate-400 font-semibold">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit new review form */}
            <form
              onSubmit={handleAddReview}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-blue-600" />
                <span>Viết đánh giá của bạn về sản phẩm:</span>
              </h4>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Đánh giá sao:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newReviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Họ và tên của bạn *"
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <textarea
                rows={3}
                placeholder="Chia sẻ trải nghiệm sử dụng sản phẩm này (độ hoàn thiện, tính năng, tốc độ giao hàng...)..."
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi nhận xét</span>
                </button>
              </div>
            </form>

            {/* Reviews list */}
            <div className="space-y-3">
              {reviewsList.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full ${rev.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                      >
                        {rev.author.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {rev.author}
                          </span>
                          {rev.verified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Đã mua hàng
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{rev.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {rev.comment}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-1">
                    <button
                      type="button"
                      className="hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Hữu ích ({rev.likes})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Warranty */}
        {activeTab === 'warranty' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Quy định bảo hành và hậu mãi NovaCare
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Bảo hành phần cứng 12 tháng</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Bảo hành chính hãng toàn diện tại tất cả trung tâm bảo hành ủy quyền của thương hiệu trên toàn quốc. Hỗ trợ mượn máy tương đương trong thời gian chờ bảo hành.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Chính sách 1 đổi 1 trong 30 ngày</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nếu phát sinh lỗi kỹ thuật từ nhà sản xuất trong vòng 30 ngày đầu, quý khách được đổi ngay thiết bị mới nguyên hộp 100% miễn phí.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenPolicy?.('warranty')}
                className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Xem chi tiết toàn bộ điều khoản bảo hành & đổi trả →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-blue-600" />
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Sản phẩm tương tự cùng danh mục
              </h2>
            </div>
            <button
              type="button"
              onClick={onBackToHome}
              className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map((relProd) => {
              const relDiscount = relProd.originalPrice
                ? Math.round(((relProd.originalPrice - relProd.price) / relProd.originalPrice) * 100)
                : 0;
              return (
                <div
                  key={relProd.id}
                  onClick={() => onSelectProduct?.(relProd)}
                  className="bg-white dark:bg-[#1a2642] rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-3 flex flex-col justify-between hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  <div className="aspect-square w-full rounded-xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center p-2 mb-2 overflow-hidden relative">
                    <img
                      src={relProd.image}
                      alt={relProd.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                    {relDiscount > 0 && (
                      <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        -{relDiscount}%
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {relProd.categoryName}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                      {relProd.name}
                    </h4>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-extrabold text-blue-700 dark:text-blue-400">
                        {formatVND(relProd.price)}
                      </span>
                      {relProd.originalPrice && (
                        <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                          {formatVND(relProd.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct?.(relProd);
                    }}
                    className="mt-2.5 w-full py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Sticky Bottom Action Bar on Mobile Screens */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-2.5 px-4 flex items-center justify-between gap-3 shadow-lg">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Giá sản phẩm</span>
          <span className="text-base font-extrabold text-blue-700 dark:text-blue-400">
            {formatVND(product.price)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="p-2.5 rounded-xl border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Thêm vào giỏ hàng"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="py-2.5 px-4 rounded-xl font-extrabold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4" />
            <span>MUA NGAY</span>
          </button>
        </div>
      </div>

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
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

          {/* Center Image */}
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
              src={activeImage}
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

          {/* Bottom Thumbnails */}
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
                    src={img}
                    alt={`Thumb ${idx}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
