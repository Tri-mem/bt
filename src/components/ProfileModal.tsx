import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Award,
  Coins,
  Package,
  Gift,
  LogOut,
  Save,
  CheckCircle2,
  Shield,
  Edit2,
  AlertCircle,
  User,
  Heart,
  ShoppingBag,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  ChevronRight,
  Clock,
  FileText,
} from 'lucide-react';
import { UserProfile, Order, Product, CartItem, Voucher } from '../types';
import { formatVND } from '../data/mockData';
import { USER_VALIDATION_RULES, sanitizeUserProfileInput } from '../firebase';
import { checkIfWelcomeEmailSent } from '../utils/welcomeEmail';
import { Settings } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onLogout: () => void;
  onOpenOrders: () => void;
  onOpenPromo: () => void;
  orders?: Order[];
  wishlistProducts?: Product[];
  cartItems?: CartItem[];
  appliedVoucher?: Voucher | null;
  onSelectOrderToView?: (order: Order) => void;
  onSelectProduct?: (product: Product) => void;
  onOpenCart?: () => void;
  initialTab?: 'overview' | 'orders' | 'wishlist' | 'edit';
  onOpenGasConfig?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout,
  onOpenOrders,
  onOpenPromo,
  orders = [],
  wishlistProducts = [],
  cartItems = [],
  appliedVoucher = null,
  onSelectOrderToView,
  onSelectProduct,
  onOpenCart,
  initialTab = 'overview',
  onOpenGasConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wishlist'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState(user?.city || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [address, setAddress] = useState(user?.address || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setCity(user.city || '');
      setDistrict(user.district || '');
      setAddress(user.address || '');
      setValidationError('');
    }
    if (isOpen) {
      if (initialTab === 'edit') {
        setActiveTab('overview');
        setIsEditing(true);
      } else {
        setActiveTab(initialTab);
        setIsEditing(false);
      }
    }
  }, [user, isOpen, initialTab]);

  if (!isOpen || !user) return null;

  const totalSpent = orders.reduce((sum, ord) => sum + ord.total, 0);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanCity = city.trim();
    const cleanDistrict = district.trim();
    const cleanAddress = address.trim();

    if (!cleanName || cleanName.length > USER_VALIDATION_RULES.fullNameMaxLength) {
      setValidationError(`Họ và tên cần từ 1 đến ${USER_VALIDATION_RULES.fullNameMaxLength} ký tự.`);
      return;
    }
    if (
      !cleanPhone ||
      cleanPhone.length < USER_VALIDATION_RULES.phoneMinLength ||
      cleanPhone.length > USER_VALIDATION_RULES.phoneMaxLength ||
      !USER_VALIDATION_RULES.phonePattern.test(cleanPhone)
    ) {
      setValidationError('Số điện thoại cần từ 9 đến 15 chữ số hợp lệ.');
      return;
    }
    if (
      !cleanEmail ||
      cleanEmail.length > USER_VALIDATION_RULES.emailMaxLength ||
      !USER_VALIDATION_RULES.emailPattern.test(cleanEmail)
    ) {
      setValidationError('Địa chỉ Email không hợp lệ.');
      return;
    }
    if (!cleanCity || cleanCity.length > USER_VALIDATION_RULES.cityMaxLength) {
      setValidationError('Vui lòng nhập Tỉnh / Thành phố hợp lệ.');
      return;
    }
    if (!cleanDistrict || cleanDistrict.length > USER_VALIDATION_RULES.districtMaxLength) {
      setValidationError('Vui lòng nhập Quận / Huyện hợp lệ.');
      return;
    }
    if (!cleanAddress || cleanAddress.length > USER_VALIDATION_RULES.addressMaxLength) {
      setValidationError('Vui lòng nhập Địa chỉ chi tiết hợp lệ.');
      return;
    }

    const sanitized = sanitizeUserProfileInput(
      {
        fullName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        avatar: user.avatar || '',
        city: cleanCity,
        district: cleanDistrict,
        address: cleanAddress,
        joinedDate: user.joinedDate,
      },
      user.id,
      user.email
    );

    onUpdateUser({
      ...user,
      fullName: sanitized.fullName,
      phone: sanitized.phone,
      email: sanitized.email,
      city: sanitized.city,
      district: sanitized.district,
      address: sanitized.address,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'Diamond':
        return 'from-cyan-500 to-blue-600 text-white';
      case 'Gold':
        return 'keep-dark-text from-amber-400 to-amber-500 text-slate-950';
      case 'Silver':
        return 'keep-dark-text from-slate-200 to-slate-300 text-slate-900';
      default:
        return 'from-amber-600 to-amber-700 text-white';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="user-profile-modal"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Profile Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 px-4 sm:px-6 pt-4 sm:pt-6 pb-3.5 sm:pb-5 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {user.avatar?.trim() ? (
              <img
                src={user.avatar.trim()}
                alt={user.fullName}
                width={68}
                height={68}
                referrerPolicy="no-referrer"
                className="w-14 h-14 sm:w-[68px] sm:h-[68px] rounded-2xl object-cover border-2 border-white/50 shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-[68px] sm:h-[68px] rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-inner shrink-0">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap pr-6 sm:pr-0">
                <h2 className="text-base sm:text-xl font-black text-white truncate">
                  {user.fullName}
                </h2>
                <span
                  className={`text-[9px] sm:text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-md bg-gradient-to-r ${getTierBadgeStyle(
                    user.memberTier
                  )} shadow-xs uppercase tracking-wider shrink-0`}
                >
                  Hội viên VIP {user.memberTier}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 mt-1.5 text-[11px] sm:text-xs text-blue-100">
                <span className="flex items-center gap-1 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 tabular-nums">
                  <Phone className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  <span>{user.phone || 'Chưa cập nhật SĐT'}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 mt-1.5 sm:mt-2 text-[11px] sm:text-xs">
                <span className="flex items-center gap-1 text-amber-300 font-bold tabular-nums">
                  <Coins className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  {user.novaPoints.toLocaleString('vi-VN')} NovaPoints
                </span>
                <span className="text-white/50" aria-hidden="true">
                  ·
                </span>
                <span className="flex items-center gap-1 text-blue-100 text-[10px] sm:text-[11px] tabular-nums">
                  <Calendar className="w-3 h-3 text-sky-300 shrink-0" />
                  Ngày tham gia: {user.joinedDate}
                </span>
                <span className="text-white/50 hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span className="text-blue-200 text-[10px] sm:text-[11px] font-mono hidden sm:inline">
                  ID: #{user.id.slice(0, 10)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs inside Profile */}
          <div className="flex items-center gap-1.5 mt-3.5 sm:mt-5 pt-2.5 sm:pt-3 border-t border-white/15 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'keep-light bg-white text-slate-900 shadow-xs'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Thông tin & Hồ sơ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'keep-light bg-white text-slate-900 shadow-xs'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Đơn hàng ({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'wishlist'
                  ? 'keep-light bg-white text-slate-900 shadow-xs'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Yêu thích & Giỏ hàng ({wishlistProducts.length + totalCartItems})</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã lưu cập nhật hồ sơ cá nhân đồng bộ lên hệ thống!</span>
            </div>
          )}

          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {activeTab === 'overview' && (
            <>
              {/* Account Activity Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-left hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Tổng đơn hàng
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                    {orders.length} đơn
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-left hover:border-teal-400 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Tổng chi tiêu
                  </span>
                  <span className="text-sm sm:text-base font-black text-teal-700 dark:text-teal-300 tabular-nums mt-0.5 block truncate">
                    {formatVND(totalSpent)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('wishlist')}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-left hover:border-rose-400 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Đã yêu thích
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                    {wishlistProducts.length} SP
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCart) {
                      onClose();
                      onOpenCart();
                    } else {
                      setActiveTab('wishlist');
                    }
                  }}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-left hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Trong giỏ hàng
                  </span>
                  <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 tabular-nums mt-0.5 block">
                    {totalCartItems} SP
                  </span>
                </button>
              </div>

              {/* Member Privileges & Points Progress */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-800 dark:to-slate-800/90 border border-amber-200/80 dark:border-slate-700 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      Hạng thẻ VIP {user.memberTier} · Tích lũy 1% điểm thưởng mọi đơn hàng
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPromo();
                    }}
                    className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer shrink-0"
                  >
                    Đổi ưu đãi →
                  </button>
                </div>
                <div className="w-full bg-amber-200/50 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (user.novaPoints / 5000) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-slate-300 tabular-nums">
                  <span>Điểm hiện có: {user.novaPoints.toLocaleString('vi-VN')} / 5.000 điểm</span>
                  <span>
                    {user.novaPoints >= 5000
                      ? 'Đã đạt hạng cao nhất VIP Diamond'
                      : `Cần thêm ${(5000 - user.novaPoints).toLocaleString('vi-VN')} điểm để lên VIP Diamond`}
                  </span>
                </div>
              </div>

              {/* Google Apps Script Welcome Email Status Card */}
              <div className="border border-blue-200/90 dark:border-blue-900/60 bg-blue-50/60 dark:bg-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Email Chào Mừng Lần Đầu (Google Apps Script)
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                        {checkIfWelcomeEmailSent(user.id, user.email) ? '✓ Đã nhận thư' : 'Tự động gửi'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      Tự động gửi thư chào mừng kèm Voucher 100K & 1.000 NovaPoints tới <strong>{user.email}</strong> khi đăng nhập lần đầu.
                    </p>
                  </div>
                </div>
                {onOpenGasConfig && (
                  <button
                    type="button"
                    onClick={() => onOpenGasConfig()}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Cấu hình GAS</span>
                  </button>
                )}
              </div>

              {/* Personal Profile Details & Delivery Address */}
              <div className="border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Thông tin cá nhân & Địa chỉ giao hàng mặc định
                  </h3>
                  {!isEditing && (
                    <button
                      id="profile-edit-btn"
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Chỉnh sửa hồ sơ
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Họ và tên người nhận
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        maxLength={USER_VALIDATION_RULES.fullNameMaxLength}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Số điện thoại liên hệ
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          maxLength={USER_VALIDATION_RULES.phoneMaxLength}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Địa chỉ Email nhận hóa đơn điện tử
                        </label>
                        <input
                          type="email"
                          value={email}
                          maxLength={USER_VALIDATION_RULES.emailMaxLength}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Tỉnh / Thành phố
                        </label>
                        <input
                          type="text"
                          value={city}
                          maxLength={USER_VALIDATION_RULES.cityMaxLength}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Quận / Huyện / Thành phố trực thuộc
                        </label>
                        <input
                          type="text"
                          value={district}
                          maxLength={USER_VALIDATION_RULES.districtMaxLength}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Địa chỉ chi tiết (Số nhà, tên đường, phường/xã)
                      </label>
                      <input
                        type="text"
                        value={address}
                        maxLength={USER_VALIDATION_RULES.addressMaxLength}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setValidationError('');
                        }}
                        className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-teal-700 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Lưu cập nhật
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Họ và tên khách hàng
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {user.fullName}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Số điện thoại xác thực
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            user.phoneVerified || user.authProvider === 'phone'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {user.phoneVerified || user.authProvider === 'phone'
                            ? 'Đã xác thực OTP'
                            : 'Chưa xác thực OTP'}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                        {user.phone || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Email nhận thông báo & hóa đơn VAT
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                        {user.email}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Mã ưu đãi đang kích hoạt
                      </span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 mt-0.5 block">
                        {appliedVoucher ? `${appliedVoucher.code} (${appliedVoucher.description})` : 'Chưa chọn mã ưu đãi'}
                      </span>
                    </div>
                    <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Địa chỉ nhận hàng mặc định
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {user.address || user.district || user.city
                          ? [user.address, user.district, user.city].filter(Boolean).join(', ')
                          : 'Chưa cập nhật địa chỉ giao hàng'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Latest Order Quick Preview */}
              {orders.length > 0 && (
                <div className="border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Đơn hàng gần nhất của bạn
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>Xem tất cả ({orders.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          #{orders[0].id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                          {new Date(orders[0].createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {orders[0].orderStatus === 'shipping'
                            ? 'Đang giao hàng'
                            : orders[0].orderStatus === 'delivered'
                            ? 'Đã giao thành công'
                            : 'Đã xác nhận'}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                        {orders[0].items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="font-black text-slate-900 dark:text-white tabular-nums">
                        {formatVND(orders[0].total)}
                      </span>
                      {onSelectOrderToView && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectOrderToView(orders[0]);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Hóa đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: ORDERS HISTORY IN PROFILE */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Lịch sử đơn hàng của {user.fullName} ({orders.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOrders();
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Mở trình tra cứu chi tiết →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <Package className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bạn chưa có đơn hàng nào
                  </p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          #{ord.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-500 tabular-nums">
                          {new Date(ord.createdAt).toLocaleDateString('vi-VN')}{' '}
                          {new Date(ord.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className="font-bold text-teal-700 dark:text-teal-300">
                        {ord.orderStatus === 'shipping'
                          ? 'Đang vận chuyển'
                          : ord.orderStatus === 'delivered'
                          ? 'Đã giao hàng'
                          : 'Đã xác nhận'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                            {item.product.name} × {item.quantity}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 tabular-nums shrink-0">
                            {formatVND(item.product.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-slate-500">
                        Thanh toán: <strong className="text-slate-700 dark:text-slate-300">{ord.paymentMethod.toUpperCase()}</strong>
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-sm text-slate-900 dark:text-white tabular-nums">
                          {formatVND(ord.total)}
                        </span>
                        {onSelectOrderToView && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectOrderToView(ord);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Xem biên lai</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST & CART ITEMS IN PROFILE */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              {/* Current Cart Summary */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Giỏ hàng hiện tại: {totalCartItems} sản phẩm
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 tabular-nums">
                      Tạm tính: <strong>{formatVND(cartSubtotal)}</strong>
                    </p>
                  </div>
                </div>
                {onOpenCart && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCart();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Mở giỏ hàng
                  </button>
                )}
              </div>

              {/* Wishlist Items */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Danh sách sản phẩm yêu thích ({wishlistProducts.length})
                </h4>
                {wishlistProducts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center border border-slate-200/70 dark:border-slate-700 rounded-2xl">
                    Bạn chưa lưu sản phẩm yêu thích nào.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {wishlistProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          if (onSelectProduct) {
                            onClose();
                            onSelectProduct(prod);
                          }
                        }}
                        className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-teal-400 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <img
                          src={prod.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-contain bg-slate-50 p-1 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {prod.name}
                          </p>
                          <p className="text-xs font-black text-blue-600 dark:text-blue-400 tabular-nums">
                            {formatVND(prod.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Security Status & Logout Button */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 min-w-0">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">Hồ sơ được bảo mật & đồng bộ thời gian thực</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="py-1.5 sm:py-2 px-3 sm:px-3.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
};
