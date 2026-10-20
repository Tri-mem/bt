import React from 'react';
import { X, Heart, ShoppingCart, Trash2, Share2 } from 'lucide-react';
import { Product } from '../types';
import { formatVND } from '../data/mockData';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistProducts: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: Product, event: React.MouseEvent) => void;
  onSelectProduct: (product: Product) => void;
  onShare?: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlistProducts,
  onRemoveFromWishlist,
  onAddToCart,
  onSelectProduct,
  onShare,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div 
        id="wishlist-modal"
        className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl shrink-0">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">Sản Phẩm Yêu Thích</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">{wishlistProducts.length} sản phẩm đã lưu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-3 sm:p-6 divide-y divide-slate-100">
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-10 sm:py-12 space-y-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-300">
                <Heart className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Chưa có sản phẩm yêu thích nào</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Nhấn vào biểu tượng trái tim trên các thẻ sản phẩm để lưu lại xem sau.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {wishlistProducts.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center gap-2.5 sm:gap-3 py-2 hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer"
                  onClick={() => {
                    onClose();
                    onSelectProduct?.(product);
                  }}
                >
                  <img 
                    src={product.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'} 
                    alt={product.name} 
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                    className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl object-contain p-1 bg-white border border-slate-200 shrink-0" 
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                    <span className="text-[11px] text-slate-500">{product.categoryName}</span>
                    <div className="text-xs font-extrabold text-indigo-700 mt-1">
                      {formatVND(product.price)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onShare && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShare(product);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                        title="Chia sẻ sản phẩm"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart?.(product, e);
                      }}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                      title="Thêm vào giỏ"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Thêm giỏ</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromWishlist?.(product.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
