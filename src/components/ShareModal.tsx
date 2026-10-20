import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Send, 
  Smartphone, 
  QrCode,
  ExternalLink
} from 'lucide-react';
import { Product } from '../types';
import { formatVND } from '../data/mockData';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onToast?: (type: 'success' | 'info' | 'error', title: string, description?: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  product,
  onToast,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  // Construct absolute share URL with product query param for direct landing
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://novashop.vn';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const shareUrl = `${origin}${pathname}?product=${encodeURIComponent(product.id)}`;
  const shareTitle = `${product.name} - Giá tốt tại NovaShop`;
  const shareText = `Xem ngay ${product.name} đang có giá ưu đãi ${formatVND(product.price)} tại NovaShop!`;

  // Copy to clipboard
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      onToast?.('success', 'Đã sao chép liên kết!', product.name);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link', err);
      onToast?.('error', 'Không thể sao chép liên kết');
    }
  };

  // Native Web Share API (Mobile / Tablet)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        onToast?.('success', 'Chia sẻ thành công!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const isNativeShareSupported = typeof navigator !== 'undefined' && !!navigator.share;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        id="share-product-modal"
        className="relative bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Chia Sẻ Sản Phẩm</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Gửi link cho bạn bè hoặc đăng lên mạng xã hội</p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Product Preview Card */}
          <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <img 
              src={product.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'} 
              alt={product.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200/90 shrink-0 bg-white"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';
              }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block truncate">
                {product.categoryName}
              </span>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug mt-0.5">
                {product.name}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs font-extrabold text-indigo-700">
                  {formatVND(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-[10px] text-slate-400 line-through">
                    {formatVND(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex flex-wrap items-center justify-between gap-1">
              <span>Sao chép đường dẫn sản phẩm</span>
              {copied && (
                <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" /> Đã sao chép!
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="share-link-input"
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-hidden select-all font-mono truncate"
              />
              <button
                id="copy-share-link-btn"
                onClick={handleCopyLink}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 shrink-0 shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Platforms Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Chia sẻ trực tiếp lên mạng xã hội</label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
              {/* Facebook */}
              <a
                id="share-fb-btn"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-center group cursor-pointer min-w-0"
                title="Chia sẻ lên Facebook"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-700 group-hover:text-blue-600 truncate w-full">Facebook</span>
              </a>

              {/* Zalo */}
              <a
                id="share-zalo-btn"
                href={`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all text-center group cursor-pointer min-w-0"
                title="Chia sẻ qua Zalo"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0068FF] text-white flex items-center justify-center font-black text-[10px] sm:text-xs shadow-xs group-hover:scale-105 transition-transform">
                  Zalo
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-700 group-hover:text-sky-600 truncate w-full">Zalo</span>
              </a>

              {/* Telegram */}
              <a
                id="share-telegram-btn"
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all text-center group cursor-pointer min-w-0"
                title="Chia sẻ qua Telegram"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-700 group-hover:text-sky-600 truncate w-full">Telegram</span>
              </a>

              {/* X / Twitter */}
              <a
                id="share-twitter-btn"
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-slate-500 hover:bg-slate-100 transition-all text-center group cursor-pointer min-w-0"
                title="Chia sẻ lên X (Twitter)"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black border border-slate-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-700 group-hover:text-slate-900 truncate w-full">X / Twitter</span>
              </a>

              {/* WhatsApp */}
              <a
                id="share-whatsapp-btn"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-center group cursor-pointer min-w-0"
                title="Chia sẻ qua WhatsApp"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-700 group-hover:text-emerald-600 truncate w-full">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Quick Actions: Native Device Share & QR Code */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {isNativeShareSupported && (
              <button
                id="native-device-share-btn"
                onClick={handleNativeShare}
                className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Chia sẻ qua ứng dụng trên máy</span>
              </button>
            )}

            <button
              id="toggle-qr-code-btn"
              onClick={() => setShowQr(!showQr)}
              className={`py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                showQr ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>{showQr ? 'Ẩn mã QR' : 'Mã QR quét nhanh'}</span>
            </button>
          </div>

          {/* QR Code Container */}
          {showQr && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-2 animate-in fade-in">
              <p className="text-[11px] font-medium text-slate-500">Quét bằng Camera điện thoại để mở sản phẩm:</p>
              <div className="keep-light p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <img 
                  src={qrImageUrl} 
                  alt={`QR Code ${product.name}`}
                  className="w-40 h-40 object-contain"
                />
              </div>
              <span className="text-[10px] text-slate-400">Tự động điều hướng đến chi tiết sản phẩm trên NovaShop</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
