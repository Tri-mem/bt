import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  PackageCheck,
  Gift,
  Tag,
  ShieldCheck,
  Sparkles,
  Clock,
  ExternalLink,
  Volume2,
  VolumeX,
  PlusCircle,
  Inbox
} from 'lucide-react';
import { AppNotification, NotificationType } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  onNotificationAction?: (notification: AppNotification) => void;
  onSendTestNotification?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  onNotificationAction,
  onSendTestNotification,
  soundEnabled,
  onToggleSound,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'order' | 'promo' | 'system'>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);

  // Calculate unread counts
  const totalUnread = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const orderCount = useMemo(
    () => notifications.filter((n) => n.type === 'order').length,
    [notifications]
  );

  const promoCount = useMemo(
    () => notifications.filter((n) => n.type === 'promo' || n.type === 'voucher').length,
    [notifications]
  );

  const systemCount = useMemo(
    () => notifications.filter((n) => n.type === 'system' || n.type === 'security').length,
    [notifications]
  );

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        if (onlyUnread && n.isRead) return false;
        if (activeTab === 'all') return true;
        if (activeTab === 'order') return n.type === 'order';
        if (activeTab === 'promo') return n.type === 'promo' || n.type === 'voucher';
        if (activeTab === 'system') return n.type === 'system' || n.type === 'security';
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, activeTab, onlyUnread]);

  if (!isOpen) return null;

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'Gần đây';
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'order':
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
            <PackageCheck className="w-4 h-4" />
          </div>
        );
      case 'promo':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Tag className="w-4 h-4" />
          </div>
        );
      case 'voucher':
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
            <Gift className="w-4 h-4" />
          </div>
        );
      case 'security':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
      case 'system':
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  const getBadgeStyle = (type: NotificationType) => {
    switch (type) {
      case 'order':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'promo':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'voucher':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'security':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'system':
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative p-2 sm:p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shrink-0">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-slate-900 rounded-full animate-ping" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-base sm:text-xl font-black tracking-tight truncate">Trung Tâm Thông Báo</h3>
                {totalUnread > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/90 text-white font-extrabold text-[10px] sm:text-[11px] shadow-sm shrink-0">
                    {totalUnread} mới
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold text-[10px] sm:text-[11px] shrink-0">
                    Đã đọc hết
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200/80 mt-0.5 truncate">
                Cập nhật đơn hàng, ưu đãi flash sale & tin tức từ NovaShop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer border ${
                soundEnabled
                  ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/40 hover:bg-indigo-500/40'
                  : 'bg-white/10 text-slate-400 border-white/10 hover:bg-white/20'
              }`}
              title={soundEnabled ? 'Chuông thông báo: Bật' : 'Chuông thông báo: Tắt'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="p-2.5 sm:p-3 sm:px-6 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto scrollbar-none max-w-full">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('order')}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'order'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đơn hàng ({orderCount})
            </button>
            <button
              onClick={() => setActiveTab('promo')}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'promo'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khuyến mãi ({promoCount})
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'system'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hệ thống ({systemCount})
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 ml-auto">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setOnlyUnread(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-[11px]">Chỉ chưa đọc</span>
            </label>

            {totalUnread > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đã đọc tất cả</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={onClearAllNotifications}
                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                title="Xóa toàn bộ thông báo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[520px]">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.isRead) onMarkAsRead(notif.id);
                  if (notif.actionType && onNotificationAction) {
                    onNotificationAction(notif);
                  }
                }}
                className={`p-3 sm:p-4.5 transition-colors cursor-pointer flex items-start gap-2.5 sm:gap-3.5 group relative ${
                  notif.isRead ? 'bg-white hover:bg-slate-50/80' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                }`}
              >
                {/* Unread Glowing Dot Indicator */}
                {!notif.isRead && (
                  <div className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-500/50" />
                )}

                {/* Type Icon */}
                {getIconForType(notif.type)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {notif.title}
                      </span>
                      {notif.badge && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getBadgeStyle(
                            notif.type
                          )}`}
                        >
                          {notif.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(notif.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {notif.message}
                  </p>

                  {/* Action Link & Bottom Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    {notif.actionType ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notif.isRead) onMarkAsRead(notif.id);
                          if (onNotificationAction) onNotificationAction(notif);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <span>
                          {notif.actionType === 'open_orders'
                            ? 'Xem chi tiết đơn hàng'
                            : notif.actionType === 'open_promo'
                            ? 'Xem kho mã ưu đãi'
                            : notif.actionType === 'open_cart'
                            ? 'Xem giỏ hàng'
                            : 'Xem ngay'}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notif.id);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title={notif.isRead ? 'Đã đọc' : 'Đánh dấu đã đọc'}
                      >
                        <CheckCheck className={`w-3.5 h-3.5 ${notif.isRead ? 'text-indigo-600' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(notif.id);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa thông báo này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Không có thông báo nào</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {onlyUnread
                  ? 'Bạn đã đọc hết các thông báo trong mục này.'
                  : 'Hiện tại bạn chưa có thông báo mới nào. Mọi ưu đãi và cập nhật đơn hàng sẽ hiển thị ở đây.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer info & demo test trigger */}
        <div className="p-3 sm:px-6 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-[11px] font-medium text-slate-500">
              Hệ thống thông báo tức thời 24/7
            </span>
          </div>

          {onSendTestNotification && (
            <button
              onClick={onSendTestNotification}
              className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors cursor-pointer"
              title="Mô phỏng nhận thông báo ưu đãi ngẫu nhiên"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Gửi thông báo thử nghiệm</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
