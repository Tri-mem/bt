import React, { useState, useMemo } from 'react';
import {
  X,
  Scale,
  ArrowLeftRight,
  Search,
  Star,
  ShoppingCart,
  Check,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  SlidersHorizontal,
  CheckCircle2,
  Minimize2,
  ChevronUp,
} from 'lucide-react';
import { Product } from '../types';
import { formatVND } from '../data/mockData';
import { normalizeVietnameseSearchText } from '../utils/smartSearch';

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  compareProducts: Product[];
  allProducts: Product[];
  onSelectSlotProduct: (slotIndex: 0 | 1, product: Product) => void;
  onRemoveCompareProduct: (productId: string) => void;
  onClearCompare: () => void;
  onSwapProducts: () => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onViewProductDetail: (product: Product) => void;
  onOpenInstallment?: (product: Product) => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  isOpen,
  onClose,
  compareProducts,
  allProducts,
  onSelectSlotProduct,
  onRemoveCompareProduct,
  onClearCompare,
  onSwapProducts,
  onAddToCart,
  onViewProductDetail,
  onOpenInstallment,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'diff' | 'highlights'>('all');
  const [activePickerSlot, setActivePickerSlot] = useState<0 | 1 | null>(null);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerScope, setPickerScope] = useState<'same-category' | 'all'>('same-category');

  const product1 = compareProducts[0] || null;
  const product2 = compareProducts[1] || null;

  // Determine the reference category for smart recommendations
  const referenceCategory = product1?.category || product2?.category || null;

  // Candidate products for the quick selector inside the table
  const candidateProducts = useMemo(() => {
    const selectedIds = new Set(compareProducts.map((p) => p.id));
    const normQuery = normalizeVietnameseSearchText(pickerSearch);

    let list = allProducts.filter((p) => !selectedIds.has(p.id) && p.id !== 'prod-test-10k' && p.id !== 'prod-test-20k');

    if (pickerScope === 'same-category' && referenceCategory && !normQuery) {
      const sameCat = list.filter((p) => p.category === referenceCategory);
      if (sameCat.length > 0) {
        list = sameCat;
      }
    }

    if (normQuery) {
      list = list.filter((p) => {
        const searchable = normalizeVietnameseSearchText(
          `${p.name} ${p.categoryName} ${Object.values(p.specs || {}).join(' ')}`
        );
        return searchable.includes(normQuery);
      });
    }

    // Sort by closeness in price to product1 if product1 exists
    if (product1 && !normQuery) {
      list = [...list].sort(
        (a, b) => Math.abs(a.price - product1.price) - Math.abs(b.price - product1.price)
      );
    }

    return list.slice(0, 12);
  }, [allProducts, compareProducts, pickerSearch, pickerScope, referenceCategory, product1]);

  // Unified technical specification keys across both products
  const specRows = useMemo(() => {
    const keys: string[] = [];
    const seen = new Set<string>();

    if (product1?.specs) {
      for (const k of Object.keys(product1.specs)) {
        if (!seen.has(k)) {
          seen.add(k);
          keys.push(k);
        }
      }
    }
    if (product2?.specs) {
      for (const k of Object.keys(product2.specs)) {
        if (!seen.has(k)) {
          seen.add(k);
          keys.push(k);
        }
      }
    }

    const rows = keys.map((key) => {
      const val1 = product1?.specs?.[key] || '—';
      const val2 = product2 ? product2.specs?.[key] || '—' : 'Chưa chọn SP 2';
      const isDifferent = Boolean(
        product1 &&
          product2 &&
          normalizeVietnameseSearchText(val1) !== normalizeVietnameseSearchText(val2)
      );
      return {
        label: key,
        val1,
        val2,
        isDifferent,
      };
    });

    if (filterMode === 'diff' && product1 && product2) {
      return rows.filter((r) => r.isDifferent);
    }

    return rows;
  }, [product1, product2, filterMode]);

  if (!isOpen) return null;

  const priceDiff =
    product1 && product2 ? Math.abs(product1.price - product2.price) : 0;
  const cheaperIndex =
    product1 && product2
      ? product1.price < product2.price
        ? 0
        : product2.price < product1.price
        ? 1
        : -1
      : -1;

  const renderSlotPicker = (slotIndex: 0 | 1) => {
    const currentProduct = slotIndex === 0 ? product1 : product2;
    return (
      <div className="bg-slate-50 rounded-xl p-3 border border-indigo-200 space-y-2.5 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            {currentProduct
              ? `Đổi sản phẩm cột ${slotIndex + 1}`
              : `Chọn nhanh sản phẩm thứ ${slotIndex + 1}`}
          </span>
          {currentProduct && (
            <button
              type="button"
              onClick={() => setActivePickerSlot(null)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 cursor-pointer"
            >
              Đóng
            </button>
          )}
        </div>

        {/* Search input inside picker */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Gõ tên máy, thương hiệu hoặc thông số..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800"
          />
          {pickerSearch && (
            <button
              type="button"
              onClick={() => setPickerSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter scope tabs */}
        {referenceCategory && (
          <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setPickerScope('same-category')}
              className={`flex-1 py-1 px-2 rounded-md font-semibold transition-colors cursor-pointer ${
                pickerScope === 'same-category'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cùng danh mục ({product1?.categoryName || product2?.categoryName})
            </button>
            <button
              type="button"
              onClick={() => setPickerScope('all')}
              className={`flex-1 py-1 px-2 rounded-md font-semibold transition-colors cursor-pointer ${
                pickerScope === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả sản phẩm
            </button>
          </div>
        )}

        {/* Quick candidate list */}
        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5">
          {candidateProducts.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500">
              Không tìm thấy sản phẩm phù hợp. Hãy thử chuyển sang &ldquo;Tất cả sản phẩm&rdquo;.
            </div>
          ) : (
            candidateProducts.map((cand) => (
              <button
                key={cand.id}
                type="button"
                onClick={() => {
                  onSelectSlotProduct(slotIndex, cand);
                  setActivePickerSlot(null);
                  setPickerSearch('');
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-white hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-300 transition-all text-left group cursor-pointer"
              >
                <img
                  src={cand.image || FALLBACK_IMAGE}
                  alt={cand.name}
                  className="w-10 h-10 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 line-clamp-1">
                    {cand.name}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] mt-0.5">
                    <span className="font-extrabold text-blue-600 tabular-nums">
                      {formatVND(cand.price)}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-amber-600 font-semibold">★ {cand.rating}</span>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white text-[11px] font-bold transition-colors shrink-0">
                  Chọn
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderProductHeaderCard = (product: Product | null, slotIndex: 0 | 1) => {
    const isPickerOpen = activePickerSlot === slotIndex || !product;

    if (!product || isPickerOpen) {
      return renderSlotPicker(slotIndex);
    }

    const discountPercent = product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;
    const isCheaper = cheaperIndex === slotIndex;

    return (
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 flex flex-col justify-between h-full relative">
        <div>
          {/* Top toolbar: Slot label + Change / Remove */}
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              Sản phẩm #{slotIndex + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActivePickerSlot(slotIndex);
                  setPickerSearch('');
                }}
                className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 transition-colors cursor-pointer"
                title="Đổi sang sản phẩm khác"
              >
                Đổi SP
              </button>
              <button
                type="button"
                onClick={() => onRemoveCompareProduct(product.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                title="Xóa khỏi bảng so sánh"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Product Thumbnail & Name */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5 sm:gap-3 mb-2.5">
            <div
              onClick={() => onViewProductDetail(product)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center shrink-0 cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <img
                src={product.image || FALLBACK_IMAGE}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
              />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="text-[11px] font-semibold text-slate-500 mb-0.5">
                {product.categoryName}
              </div>
              <h4
                onClick={() => onViewProductDetail(product)}
                className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 line-clamp-2 cursor-pointer leading-snug"
              >
                {product.name}
              </h4>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1.5">
                <span className="text-sm sm:text-base font-extrabold text-blue-600 tabular-nums">
                  {formatVND(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-[11px] text-slate-400 line-through tabular-nums">
                    {formatVND(product.originalPrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                    -{discountPercent}%
                  </span>
                )}
              </div>
              {isCheaper && priceDiff > 0 && (
                <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Tiết kiệm hơn {formatVND(priceDiff)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons inside header card */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => onAddToCart(product, e)}
            className="flex-1 py-1.5 px-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Mua ngay</span>
          </button>
          <button
            type="button"
            onClick={() => onViewProductDetail(product)}
            className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            title="Xem chi tiết sản phẩm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chi tiết</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Bảng So Sánh Thông Số Kỹ Thuật
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 tabular-nums">
                  {compareProducts.length}/2 sản phẩm
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Đối chiếu trực tiếp thông số cấu hình, giá bán và ưu điểm giữa 2 thiết bị
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {product1 && product2 && (
              <button
                type="button"
                onClick={onSwapProducts}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-colors cursor-pointer"
                title="Đảo vị trí 2 cột sản phẩm"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">Đảo cột</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-colors cursor-pointer"
              title="Thu nhỏ bảng để chọn tiếp sản phẩm trên trang"
            >
              <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Chọn thêm trên trang</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer"
              aria-label="Đóng bảng so sánh"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Controls Toolbar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-200/75 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả thông số
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('diff')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMode === 'diff'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chỉ điểm khác biệt
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('highlights')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMode === 'highlights'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đặc điểm nổi bật
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {!product2 && product1 && candidateProducts.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectSlotProduct(1, candidateProducts[0])}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ghép nhanh đối thủ cùng phân khúc</span>
              </button>
            )}
            {compareProducts.length > 0 && (
              <button
                type="button"
                onClick={onClearCompare}
                className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer"
              >
                Làm mới tất cả
              </button>
            )}
          </div>
        </div>

        {/* Main Scrollable Comparison Table Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-5">
          {/* 2-Column Product Selector Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch">
            <div className="hidden md:flex md:col-span-3 bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex-col justify-center">
              <div className="text-xs font-bold text-indigo-600 mb-1 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Tiêu chí đối chiếu</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có thể đổi nhanh bất kỳ sản phẩm nào ngay tại 2 cột bên cạnh hoặc đóng bảng để bấm nút{' '}
                <strong className="text-slate-900">&ldquo;So sánh&rdquo;</strong> trên các thẻ sản phẩm ngoài trang chủ.
              </p>
              {product1 && product2 && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1 text-[11px] text-slate-500">
                  <div>
                    Tổng số tiêu chí:{' '}
                    <strong className="text-slate-800 tabular-nums">{specRows.length + 5}</strong>
                  </div>
                  <div>
                    Điểm khác biệt cấu hình:{' '}
                    <strong className="text-indigo-600 tabular-nums">
                      {specRows.filter((r) => r.isDifferent).length} thông số
                    </strong>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-4.5 lg:col-span-4.5 md:col-span-4">
              {renderProductHeaderCard(product1, 0)}
            </div>

            <div className="md:col-span-5">
              {renderProductHeaderCard(product2, 1)}
            </div>
          </div>

          {/* Detailed Technical Specifications Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs">
                  <th className="py-3 px-3 sm:px-4 font-bold w-1/4 border-r border-slate-800">
                    Thông số kỹ thuật
                  </th>
                  <th className="py-3 px-3 sm:px-4 font-bold w-[37.5%] border-r border-slate-800">
                    {product1 ? product1.name : 'Sản phẩm #1'}
                  </th>
                  <th className="py-3 px-3 sm:px-4 font-bold w-[37.5%]">
                    {product2 ? product2.name : 'Sản phẩm #2 (Chọn ở trên)'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {/* General Overview Rows (shown in 'all' or 'diff' modes) */}
                {filterMode !== 'highlights' && (
                  <>
                    <tr className="bg-slate-50/70">
                      <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-600 border-r border-slate-200/80">
                        Mức giá ưu đãi
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 font-extrabold text-blue-600 tabular-nums border-r border-slate-200/80">
                        {product1 ? formatVND(product1.price) : '—'}
                        {cheaperIndex === 0 && priceDiff > 0 && (
                          <span className="ml-2 text-[11px] font-bold text-emerald-600">
                            (Rẻ hơn {formatVND(priceDiff)})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 font-extrabold text-blue-600 tabular-nums">
                        {product2 ? formatVND(product2.price) : '—'}
                        {cheaperIndex === 1 && priceDiff > 0 && (
                          <span className="ml-2 text-[11px] font-bold text-emerald-600">
                            (Rẻ hơn {formatVND(priceDiff)})
                          </span>
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-600 border-r border-slate-200/80">
                        Trả góp 0% ước tính
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-slate-700 tabular-nums border-r border-slate-200/80">
                        {product1 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-amber-700">
                              ~{formatVND(Math.round(product1.price / (product1.price >= 10000000 ? 12 : 6)))}/tháng
                            </span>
                            {onOpenInstallment && (
                              <button
                                type="button"
                                onClick={() => onOpenInstallment(product1)}
                                className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                              >
                                Xem bảng tính
                              </button>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-slate-700 tabular-nums">
                        {product2 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-amber-700">
                              ~{formatVND(Math.round(product2.price / (product2.price >= 10000000 ? 12 : 6)))}/tháng
                            </span>
                            {onOpenInstallment && (
                              <button
                                type="button"
                                onClick={() => onOpenInstallment(product2)}
                                className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                              >
                                Xem bảng tính
                              </button>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>

                    <tr className="bg-slate-50/70">
                      <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-600 border-r border-slate-200/80">
                        Đánh giá thực tế
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 border-r border-slate-200/80">
                        {product1 ? (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-900 tabular-nums">
                              {product1.rating}/5.0
                            </span>
                            <span className="text-xs text-slate-500 tabular-nums">
                              ({product1.reviewCount} đánh giá)
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4">
                        {product2 ? (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-900 tabular-nums">
                              {product2.rating}/5.0
                            </span>
                            <span className="text-xs text-slate-500 tabular-nums">
                              ({product2.reviewCount} đánh giá)
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-600 border-r border-slate-200/80">
                        Phiên bản màu sắc
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-slate-700 border-r border-slate-200/80">
                        {product1?.colors?.length ? product1.colors.join(' · ') : 'Tiêu chuẩn'}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-slate-700">
                        {product2
                          ? product2.colors?.length
                            ? product2.colors.join(' · ')
                            : 'Tiêu chuẩn'
                          : '—'}
                      </td>
                    </tr>

                    <tr className="bg-slate-50/70">
                      <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-600 border-r border-slate-200/80">
                        Tình trạng sẵn hàng
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 border-r border-slate-200/80">
                        {product1 ? (
                          <span className="text-emerald-700 font-semibold tabular-nums">
                            Còn {product1.stock} sản phẩm nguyên seal
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4">
                        {product2 ? (
                          <span className="text-emerald-700 font-semibold tabular-nums">
                            Còn {product2.stock} sản phẩm nguyên seal
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>

                    {/* Section Divider Row for Hardware Specs */}
                    <tr className="bg-indigo-50/90 border-y border-indigo-100">
                      <td
                        colSpan={3}
                        className="py-2 px-3 sm:px-4 text-xs font-extrabold text-indigo-950 tracking-wide"
                      >
                        Cấu hình & Thông số kỹ thuật chi tiết
                      </td>
                    </tr>

                    {specRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-xs text-slate-500">
                          Hai sản phẩm có thông số kỹ thuật tương đồng nhau. Hãy chuyển sang tab &ldquo;Tất cả thông số&rdquo; để xem toàn bộ.
                        </td>
                      </tr>
                    ) : (
                      specRows.map((row, idx) => (
                        <tr
                          key={row.label}
                          className={`${
                            row.isDifferent
                              ? 'bg-amber-50/35 hover:bg-amber-50/60'
                              : idx % 2 === 0
                              ? 'bg-white'
                              : 'bg-slate-50/50'
                          } transition-colors`}
                        >
                          <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 border-r border-slate-200/80 align-top">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span>{row.label}</span>
                              {row.isDifferent && (
                                <span className="text-[10px] font-semibold text-amber-700">
                                  Khác biệt
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-slate-800 border-r border-slate-200/80 align-top leading-relaxed">
                            {row.val1}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-slate-800 align-top leading-relaxed">
                            {row.val2}
                          </td>
                        </tr>
                      ))
                    )}
                  </>
                )}

                {/* Key Highlights Comparison */}
                {(filterMode === 'all' || filterMode === 'highlights') && (
                  <>
                    <tr className="bg-indigo-50/90 border-y border-indigo-100">
                      <td
                        colSpan={3}
                        className="py-2 px-3 sm:px-4 text-xs font-extrabold text-indigo-950 tracking-wide"
                      >
                        Đặc điểm & Công nghệ nổi bật
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 border-r border-slate-200/80 align-top">
                        Ưu điểm nổi bật
                      </td>
                      <td className="py-3 px-3 sm:px-4 border-r border-slate-200/80 align-top">
                        {product1?.highlights?.length ? (
                          <ul className="space-y-1.5">
                            {product1.highlights.map((hl, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-1.5 text-xs text-slate-700 leading-relaxed"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{hl}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 align-top">
                        {product2 ? (
                          product2.highlights?.length ? (
                            <ul className="space-y-1.5">
                              {product2.highlights.map((hl, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-1.5 text-xs text-slate-700 leading-relaxed"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{hl}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            '—'
                          )
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Chọn sản phẩm thứ 2 ở khung bên trên để đối chiếu ưu điểm
                          </span>
                        )}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FloatingCompareBarProps {
  compareProducts: Product[];
  onOpenModal: () => void;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
}

export const FloatingCompareBar: React.FC<FloatingCompareBarProps> = ({
  compareProducts,
  onOpenModal,
  onRemoveProduct,
  onClearAll,
}) => {
  if (compareProducts.length === 0) return null;

  return (
    <div
      id="floating-compare-bar"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-2xl bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-indigo-500/40 shadow-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 transition-all duration-300"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <Scale className="w-4 h-4 text-white" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none min-w-0 flex-1">
          {[0, 1].map((slotIdx) => {
            const item = compareProducts[slotIdx];
            if (!item) {
              return (
                <button
                  key={`empty-slot-${slotIdx}`}
                  type="button"
                  onClick={onOpenModal}
                  className="px-2.5 py-1.5 rounded-xl border border-dashed border-slate-600 hover:border-indigo-400 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chọn SP #{slotIdx + 1}</span>
                </button>
              );
            }
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1 min-w-0 max-w-[180px] sm:max-w-[210px] shrink-0"
              >
                <img
                  src={item.image || FALLBACK_IMAGE}
                  alt={item.name}
                  className="w-6 h-6 rounded-md object-contain bg-white p-0.5 shrink-0"
                />
                <span className="text-xs font-semibold text-slate-100 truncate">
                  {item.name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveProduct(item.id)}
                  className="text-slate-400 hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                  title="Bỏ chọn sản phẩm này"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>
            {compareProducts.length === 2 ? 'So sánh ngay (2/2)' : 'Mở bảng so sánh (1/2)'}
          </span>
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Xóa danh sách so sánh"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
