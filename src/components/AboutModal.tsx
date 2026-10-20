import React from 'react';
import { 
  X, 
  Building2, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  RotateCcw, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Award,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Logo } from './Logo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreProducts?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onExploreProducts,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-slate-900 text-white p-4 sm:p-8 flex items-start justify-between border-b border-slate-800">
          <div className="space-y-2 sm:space-y-3 pr-4 sm:pr-6">
            <Logo size="sm" variant="dark" />
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-400/30">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>HỒ SƠ DOANH NGHIỆP</span>
            </div>
            <h3 className="text-base sm:text-2xl font-black text-white leading-snug">
              Giới Thiệu Về Hệ Thống NovaShop
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Thương hiệu bán lẻ thiết bị công nghệ chính hãng & thanh toán trực tuyến uy tín
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors shrink-0 cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-4 sm:space-y-6 text-slate-700 text-xs sm:text-sm">
          
          {/* Numbers banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-indigo-600">50,000+</div>
              <div className="text-[11px] text-slate-500">Khách hàng</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-indigo-600">100%</div>
              <div className="text-[11px] text-slate-500">Chính hãng</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-indigo-600">2 Giờ</div>
              <div className="text-[11px] text-slate-500">Ship hỏa tốc</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-indigo-600">99.4%</div>
              <div className="text-[11px] text-slate-500">Hài lòng</div>
            </div>
          </div>

          {/* Story */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Câu Chuyện Thương Hiệu</span>
            </h4>
            <p className="leading-relaxed text-slate-600">
              Thành lập từ năm 2021, <strong>NovaShop</strong> ra đời với mục tiêu mang đến một tiêu chuẩn mua sắm thiết bị công nghệ hoàn toàn mới cho người tiêu dùng Việt Nam: chính hãng 100%, giá cả minh bạch, giao hàng hỏa tốc và thanh toán không tiền mặt an toàn tuyệt đối.
            </p>
            <p className="leading-relaxed text-slate-600">
              Tại NovaShop, mọi sản phẩm từ iPhone, MacBook, loa Bluetooth đến bàn phím cơ và màn hình đồ họa đều được nhập khẩu chính ngạch, có đầy đủ hóa đơn VAT và bảo hành điện tử chính hãng từ 12 đến 24 tháng.
            </p>
          </div>

          {/* Core Values */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>4 Giá Trị Cốt Lõi Vượt Trội</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>100% Hàng Chính Hãng</span>
                </div>
                <p className="text-[11px] text-slate-500">Nguyên seal nhà sản xuất. Đền 200% giá trị nếu phát hiện hàng nhái.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cổng Thanh Toán Hiện Đại</span>
                </div>
                <p className="text-[11px] text-slate-500">VietQR Napas 24/7 tự động xác nhận đơn trong 5s và thẻ 3D Secure an toàn.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Giao Hàng Hỏa Tốc 2 Giờ</span>
                </div>
                <p className="text-[11px] text-slate-500">Nội thành TP.HCM và Hà Nội nhận ngay trong 2h. Miễn phí ship toàn quốc từ 300K.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>1 Đổi 1 Trong 30 Ngày</span>
                </div>
                <p className="text-[11px] text-slate-500">Đổi mới miễn phí nếu lỗi phần cứng từ nhà sản xuất. Hỗ trợ kỹ thuật 24/7.</p>
              </div>
            </div>
          </div>

          {/* Contact and address */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <h4 className="font-bold text-indigo-950 text-xs sm:text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Thông Tin Liên Hệ & Trụ Sở Chính</span>
            </h4>
            <div className="space-y-1.5 text-xs text-indigo-900/90">
              <p>📍 <strong>Trụ sở chính:</strong> 219/20 đường số 12, phường Bình Hưng Hòa, TP. Hồ Chí Minh</p>
              <p>📞 <strong>Hotline tư vấn & CSKH:</strong> <a href="tel:0908061843" className="font-bold text-indigo-600 hover:underline">0908061843</a> (Hỗ trợ 24/7)</p>
              <p>✉️ <strong>Email hỗ trợ:</strong> support@novashop.vn</p>
              <p>🕒 <strong>Giờ làm việc:</strong> 08:00 - 21:30 (Mở cửa tất cả các ngày trong tuần)</p>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onExploreProducts?.();
            }}
            className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Xem Danh Mục Sản Phẩm</span>
          </button>
        </div>

      </div>
    </div>
  );
};
