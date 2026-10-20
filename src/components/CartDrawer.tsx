import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  CalendarClock
} from 'lucide-react';
import { CartItem, Voucher } from '../types';
import { formatVND, VOUCHERS } from '../data/mockData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, color?: string) => void;
  onRemoveItem: (productId: string, color?: string) => void;
  onClearCart: () => void;
  appliedVoucher: Voucher | null;
  onApplyVoucher: (voucher: Voucher | null) => void;
  onProceedToCheckout: () => void;
  onOpenInstallment?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  appliedVoucher,
  onApplyVoucher,
  onProceedToCheckout,
  onOpenInstallment,
}) => {
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherError, setVoucherError] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Calculate discount
  let discountAmount = 0;
  if (appliedVoucher) {
    if (subtotal >= appliedVoucher.minOrderValue) {
      if (appliedVoucher.discountType === 'percent') {
        const calculated = Math.round((subtotal * appliedVoucher.discountValue) / 100);
        discountAmount = Math.min(calculated, 500000);
      } else {
        discountAmount = appliedVoucher.discountValue;
      }
    }
  }

  const hasTestProduct = cartItems.some(
    (item) => item.product.id === 'prod-test-20k' || item.product.id === 'prod-test-10k' || item.product.price <= 20000
  );
  const estimatedShipping = subtotal >= 300000 || hasTestProduct ? 0 : 30000;
  const totalAmount = Math.max(0, subtotal - discountAmount + estimatedShipping);

  const handleApplyCoupon = (codeToApply?: string) => {
    setVoucherError('');
    const code = (codeToApply || voucherInput).trim().toUpperCase();
    if (!code) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }

    const found = VOUCHERS.find((v) => v.code.toUpperCase() === code);
    if (!found) {
      setVoucherError('Mã giảm giá không tồn tại hoặc đã hết hạn');
      return;
    }

    if (subtotal < found.minOrderValue) {
      setVoucherError(`Đơn hàng cần tối thiểu ${formatVND(found.minOrderValue)} để sử dụng mã này`);
      return;
    }

    onApplyVoucher(found);
    setVoucherInput('');
    setVoucherError('');
  };

  const handleRemoveVoucher = () => {
    onApplyVoucher(null);
    setVoucherError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div 
          id="cart-drawer-panel"
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Giỏ hàng của bạn</h2>
                <p className="text-xs text-slate-500">
                  {cartItems.length} loại sản phẩm ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} món)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cartItems.length > 0 && (
                <button
                  id="clear-cart-btn"
                  onClick={onClearCart}
                  className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors"
                  title="Xóa toàn bộ giỏ"
                >
                  Xóa tất cả
                </button>
              )}
              <button
                id="close-cart-btn"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Đóng giỏ hàng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Giỏ hàng đang trống</h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Hãy lựa chọn những sản phẩm công nghệ tuyệt vời để thêm vào giỏ hàng ngay nhé!
                  </p>
                </div>
                <button
                  id="empty-cart-explore-btn"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Khám phá sản phẩm ngay
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item, idx) => (
                  <div 
                    key={`${item.product.id}-${item.selectedColor || ''}-${idx}`} 
                    className="flex gap-3 py-2"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/70">
                      <img 
                        src={item.product.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'} 
                        alt={item.product.name} 
                        width={80}
                        height={80}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain p-1 bg-white"
                        style={{ objectFit: 'contain' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                            {item.product.name}
                          </h4>
                          <button
                            id={`remove-cart-item-${item.product.id}`}
                            onClick={() => onRemoveItem(item.product.id, item.selectedColor)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.selectedColor && (
                          <span className="inline-block text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
                            Màu: {item.selectedColor}
                          </span>
                        )}

                        <div className="text-xs font-extrabold text-indigo-600 mt-1">
                          {formatVND(item.product.price)}
                        </div>
                      </div>

                      {/* Quantity Adjuster */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 shadow-2xs">
                          <button
                            id={`cart-minus-${item.product.id}`}
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedColor)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            id={`cart-plus-${item.product.id}`}
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedColor)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-xs font-bold text-slate-900">
                          {formatVND(item.product.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Voucher and Total calculation */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-200/80 bg-slate-50/70 space-y-4">
              
              {/* Voucher section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" /> Mã giảm giá / Voucher
                  </span>
                  {appliedVoucher && (
                    <button 
                      onClick={handleRemoveVoucher}
                      className="text-rose-500 hover:underline text-[11px]"
                    >
                      Bỏ áp dụng
                    </button>
                  )}
                </div>

                {appliedVoucher ? (
                  discountAmount > 0 ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-emerald-800">{appliedVoucher.code}</span>
                          <p className="text-[11px] text-emerald-700">{appliedVoucher.description}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-emerald-700 shrink-0">
                        -{formatVND(discountAmount)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-800">{appliedVoucher.code}</span>
                          <p className="text-[11px] text-amber-700">
                            Cần mua thêm {formatVND(appliedVoucher.minOrderValue - subtotal)} để kích hoạt giảm giá (Đơn tối thiểu {formatVND(appliedVoucher.minOrderValue)})
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-amber-700 shrink-0 text-[11px]">
                        Chưa đạt
                      </span>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        id="cart-voucher-input"
                        type="text"
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value)}
                        placeholder="Nhập mã (vd: NOVATECH, GIAM10)"
                        className="flex-1 py-1.5 px-3 text-xs uppercase bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                      <button
                        id="apply-voucher-btn"
                        onClick={() => handleApplyCoupon()}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors shrink-0"
                      >
                        Áp dụng
                      </button>
                    </div>

                    {voucherError && (
                      <div className="flex items-center gap-1.5 text-[11px] text-rose-600">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{voucherError}</span>
                      </div>
                    )}

                    {/* Quick voucher chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">Gợi ý:</span>
                      {VOUCHERS.slice(0, 3).map((v) => (
                        <button
                          key={v.code}
                          onClick={() => handleApplyCoupon(v.code)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                          {v.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Calculation Summary */}
              <div className="space-y-1.5 text-xs border-t border-slate-200/80 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-slate-800">{formatVND(subtotal)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển (dự kiến):</span>
                  <span>
                    {estimatedShipping === 0 ? (
                      <span className="text-emerald-600 font-semibold">
                        {hasTestProduct && subtotal < 300000 ? 'Miễn phí (SP kiểm thử 20K)' : 'Miễn phí (Đơn ≥ 300K)'}
                      </span>
                    ) : (
                      formatVND(estimatedShipping)
                    )}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Giảm giá voucher:</span>
                    <span>-{formatVND(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Tổng cộng:</span>
                  <span className="text-base text-indigo-700">{formatVND(totalAmount)}</span>
                </div>
              </div>

              {/* Proceed to Checkout CTA */}
              <div className="space-y-2 pt-1">
                <button
                  id="proceed-to-checkout-btn"
                  onClick={onProceedToCheckout}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-700 hover:to-blue-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
                >
                  <span>Tiến hành thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {subtotal >= 500000 && onOpenInstallment && (
                  <button
                    id="cart-installment-btn"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenInstallment();
                    }}
                    className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 active:scale-[0.99] border border-amber-300 text-amber-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
                  >
                    <CalendarClock className="w-4 h-4 text-amber-700" />
                    <span>Mua trả góp 0% giỏ hàng (từ ~{formatVND(Math.round(totalAmount / 6))}/th)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
