import React from 'react';
import {
  User,
  Award,
  Coins,
  MapPin,
  Phone,
  Mail,
  Package,
  Heart,
  ShoppingBag,
  Edit2,
  Calendar,
  LogOut,
} from 'lucide-react';
import { UserProfile, Order } from '../types';
import { formatVND } from '../data/mockData';

interface UserProfileBannerProps {
  user: UserProfile;
  orders: Order[];
  wishlistCount: number;
  cartCount: number;
  onOpenProfileModal: (tab?: 'overview' | 'orders' | 'wishlist' | 'edit') => void;
  onOpenOrders: () => void;
  onOpenWishlist: () => void;
  onOpenCart: () => void;
  onLogout: () => void;
}

export const UserProfileBanner: React.FC<UserProfileBannerProps> = ({
  user,
  orders,
  wishlistCount,
  cartCount,
  onOpenProfileModal,
  onOpenOrders,
  onOpenWishlist,
  onOpenCart,
  onLogout,
}) => {
  const totalSpent = orders.reduce((acc, ord) => acc + ord.total, 0);

  return (
    <section
      id="authenticated-user-profile-section"
      aria-label="Hồ sơ người dùng đã đăng nhập"
      className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors duration-200"
    >
      {/* Top Accent Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500" />

      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: User Identity & Contact Details (Clickable to open full Profile Page) */}
        <div
          onClick={() => onOpenProfileModal('overview')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenProfileModal('overview');
            }
          }}
          title="Nhấn để mở Tài khoản của tôi"
          className="flex items-start sm:items-center gap-3.5 min-w-0 cursor-pointer group"
        >
          {user.avatar?.trim() ? (
            <img
              src={user.avatar.trim()}
              alt={user.fullName}
              width={56}
              height={56}
              referrerPolicy="no-referrer"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group-hover:underline">
                Hồ sơ thành viên
              </span>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                ·
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {user.fullName}
              </h2>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>VIP {user.memberTier}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 tabular-nums">
                <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{user.novaPoints.toLocaleString('vi-VN')} điểm</span>
              </span>
            </div>

            {/* Contact & Address Metadata Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span>{user.email}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span>{user.phone || 'Chưa cập nhật SĐT'}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Tham gia: {user.joinedDate}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">
                Giao hàng mặc định:{' '}
                <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                  {user.address || user.district || user.city
                    ? [user.address, user.district, user.city].filter(Boolean).join(', ')
                    : 'Chưa cập nhật địa chỉ giao hàng'}
                </strong>
              </span>
            </p>
          </div>
        </div>

        {/* Right: Related Account Stats & Quick Profile Actions */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between lg:justify-end gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
          {/* Quick Account Metrics */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 text-xs">
            <button
              type="button"
              onClick={onOpenOrders}
              className="px-2 sm:px-3 py-2 rounded-xl bg-indigo-50/60 dark:bg-slate-800 hover:bg-indigo-100/70 dark:hover:bg-slate-700 border border-indigo-200/70 dark:border-slate-700 text-left transition-colors cursor-pointer min-w-0"
              title="Xem lịch sử đơn hàng và tổng chi tiêu"
            >
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                Đơn mua ({orders.length})
              </span>
              <span className="font-extrabold text-indigo-700 dark:text-indigo-300 tabular-nums text-[11px] sm:text-xs block truncate">
                {formatVND(totalSpent)}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenWishlist}
              className="px-2 sm:px-3 py-2 rounded-xl bg-rose-50/60 dark:bg-slate-800 hover:bg-rose-100/70 dark:hover:bg-slate-700 border border-rose-200/70 dark:border-slate-700 text-left transition-colors cursor-pointer min-w-0"
              title="Xem danh sách sản phẩm yêu thích"
            >
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                Yêu thích
              </span>
              <span className="font-extrabold text-rose-700 dark:text-rose-300 tabular-nums text-[11px] sm:text-xs flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="truncate">{wishlistCount} SP</span>
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="px-2 sm:px-3 py-2 rounded-xl bg-amber-50/60 dark:bg-slate-800 hover:bg-amber-100/70 dark:hover:bg-slate-700 border border-amber-200/70 dark:border-slate-700 text-left transition-colors cursor-pointer min-w-0"
              title="Xem giỏ hàng hiện tại"
            >
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                Giỏ hàng
              </span>
              <span className="font-extrabold text-amber-800 dark:text-amber-300 tabular-nums text-[11px] sm:text-xs flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">{cartCount} SP</span>
              </span>
            </button>
          </div>

          {/* Primary Profile Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="open-full-profile-btn"
              type="button"
              onClick={() => onOpenProfileModal('overview')}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5" />
              <span>Tài khoản của tôi</span>
            </button>

            <button
              id="edit-profile-inline-btn"
              type="button"
              onClick={() => onOpenProfileModal('edit')}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Chỉnh sửa thông tin cá nhân & địa chỉ"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">Sửa thông tin</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="Đăng xuất tài khoản"
              aria-label="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
