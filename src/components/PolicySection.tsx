import React from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  Lock, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Clock, 
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { PolicyTabId } from './PolicyModal';

interface PolicySectionProps {
  activeTab: PolicyTabId;
  onTabChange: (tab: PolicyTabId) => void;
  onOpenModal?: (tab: PolicyTabId) => void;
  onOpenFullPolicyPage?: (tab: PolicyTabId) => void;
}

export const PolicySection: React.FC<PolicySectionProps> = ({
  activeTab,
  onTabChange,
  onOpenModal,
  onOpenFullPolicyPage,
}) => {
  const tabs: { 
    id: PolicyTabId; 
    shortTitle: string; 
    fullTitle: string; 
    subtitle: string; 
    icon: React.ElementType;
    badge: string;
    badgeColor: string;
  }[] = [
    {
      id: 'warranty',
      shortTitle: 'Bảo Hành Chính Hãng',
      fullTitle: 'Chính Sách Bảo Hành Chính Hãng 12 - 24 Tháng',
      subtitle: 'Kích hoạt điện tử theo IMEI/Serial, bảo hành tại trung tâm ủy quyền',
      icon: ShieldCheck,
      badge: '12-24 Tháng',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    {
      id: 'return',
      shortTitle: 'Chính Sách Trả Hàng & Hoàn Tiền',
      fullTitle: 'Chính Sách Trả Hàng Và Hoàn Tiền Website TMĐT NovaShop.vn',
      subtitle: '10 điều khoản quy định đổi mới 1-1 trong 30 ngày, thu hồi miễn phí 2 chiều & hoàn tiền 24H',
      icon: RotateCcw,
      badge: '10 Mục • 30N',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'shipping',
      shortTitle: 'Chính Sách Vận Chuyển',
      fullTitle: 'Chính Sách Vận Chuyển & Giao Nhận Hàng Hóa NovaShop.vn',
      subtitle: '10 điều khoản giao hỏa tốc 2H, Freeship từ 300K, đóng gói 3 lớp & đồng kiểm 100%',
      icon: Truck,
      badge: '10 Mục • 2H',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'security',
      shortTitle: 'Chính Sách Bảo Mật',
      fullTitle: 'Chính Sách Bảo Mật Dữ Liệu Cá Nhân Website TMĐT NovaShop.vn',
      subtitle: '16 điều khoản bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP & chuẩn SSL 256-bit',
      icon: Lock,
      badge: '16 Mục • SSL',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'payment',
      shortTitle: 'Hướng Dẫn Thanh Toán VietQR',
      fullTitle: 'Hướng Dẫn Thanh Toán Trực Tuyến Qua VietQR Napas 24/7',
      subtitle: 'Quét mã QR tự động xác nhận 2 giây, hỗ trợ thẻ quốc tế và ví điện tử',
      icon: CreditCard,
      badge: 'Xác nhận 2s',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'terms',
      shortTitle: 'Quy Chế Hoạt Động',
      fullTitle: 'Quy Chế Hoạt Động Website Cung Cấp Dịch Vụ TMĐT NovaShop.vn',
      subtitle: '12 chương quy định giao dịch, thanh toán, bảo mật và quyền lợi thành viên',
      icon: FileText,
      badge: '12 Mục',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  return (
    <section id="chinh-sach-dich-vu" className="mt-14 mb-10 scroll-mt-24">
      <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/90 shadow-sm space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>TRUNG TÂM CHÍNH SÁCH & DỊCH VỤ KHÁCH HÀNG</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              NovaShop Care • Cam Kết Chất Lượng & Dịch Vụ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Nhấp chọn từng mục chính sách bên dưới để xem chi tiết điều kiện bảo hành, quy trình đổi trả, biểu phí vận chuyển và hướng dẫn thanh toán trực tuyến.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenFullPolicyPage && (
              <button
                type="button"
                id="btn-open-full-policy-page"
                onClick={() => onOpenFullPolicyPage(activeTab)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Mở toàn bộ trang web chính sách chi tiết"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Xem Trang Chính Sách Đầy Đủ →</span>
              </button>
            )}
            {onOpenModal && (
              <button
                type="button"
                id="btn-open-policy-modal"
                onClick={() => onOpenModal(activeTab)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Mở toàn màn hình dạng hộp thoại"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Cửa sổ popup</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 Interactive Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`policy-nav-btn-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`relative p-3 sm:p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-600/30 scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-indigo-600 border border-slate-200/60'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                    isActive ? 'bg-white/20 text-white border-white/20' : tab.badgeColor
                  }`}>
                    {tab.badge}
                  </span>
                </div>

                <div>
                  <h3 className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {tab.shortTitle}
                  </h3>
                </div>

                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-600 rotate-45 rounded-xs" />
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Display Panel for Selected Policy */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-5 sm:p-8 space-y-6">
          
          {/* TAB 1: BẢO HÀNH CHÍNH HÃNG */}
          {activeTab === 'warranty' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Hậu Mãi Chính Hãng</span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    Chính Sách Bảo Hành Chính Hãng 12 - 24 Tháng
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl self-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Kích hoạt điện tử theo IMEI/Serial</span>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="font-bold text-emerald-950">Cam kết 100% phân phối hàng chính hãng có tem niêm phong</p>
                  <p className="text-emerald-800 text-xs">
                    Tất cả các sản phẩm thiết bị điện tử, điện thoại, máy tính xách tay và phụ kiện âm thanh tại NovaShop đều được bảo hành chính hãng từ 12 đến 24 tháng theo đúng tiêu chuẩn của hãng (Apple, Samsung, Sony, Dell, Logitech,...).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
                <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Điều kiện được tiếp nhận bảo hành:</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600 text-xs">
                    <li>Sản phẩm còn trong thời hạn bảo hành tính từ ngày mua hoặc kích hoạt bảo hành điện tử.</li>
                    <li>Tem niêm phong, mã vạch IMEI và số Serial nguyên vẹn, không có dấu hiệu cạo sửa hay tẩy xóa.</li>
                    <li>Lỗi hư hỏng được xác định do lỗi kỹ thuật hoặc lỗi linh kiện từ nhà sản xuất.</li>
                    <li>Khách hàng cung cấp số điện thoại đặt hàng hoặc mã đơn hàng trên website NovaShop.</li>
                  </ul>
                </div>

                <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>Các trường hợp từ chối bảo hành:</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600 text-xs">
                    <li>Sản phẩm bị vào nước hoặc chất lỏng vượt quá tiêu chuẩn kháng nước công bố.</li>
                    <li>Sản phẩm bị rơi vỡ, nứt mẻ, biến dạng khung vỏ, màn hình bị chảy mực do va chạm ngoại lực.</li>
                    <li>Sản phẩm có dấu hiệu tháo gỡ hoặc can thiệp phần cứng bởi các đơn vị không được ủy quyền.</li>
                    <li>Hư hỏng do sử dụng nguồn điện không ổn định, chập cháy, sét đánh hoặc thiên tai.</li>
                  </ul>
                </div>
              </div>

              {/* Direct Address & Hotline */}
              <div className="p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Trung tâm tiếp nhận & bảo hành:</span>
                    <strong className="text-indigo-950">219/20 đường số 12, phường Bình Hưng Hòa, TP. Hồ Chí Minh</strong>
                  </div>
                  <div className="text-slate-600 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Hotline hỗ trợ kỹ thuật & tiếp nhận bảo hành:</span>
                    <strong className="text-indigo-700 font-bold text-sm">0908061843</strong>
                    <span className="text-slate-400 text-[11px]">(8h00 - 21h00 các ngày trong tuần)</span>
                  </div>
                </div>

                <div className="bg-white px-3.5 py-2 rounded-xl border border-indigo-100 font-semibold text-slate-700 shrink-0 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Thời gian xử lý: 3 - 7 ngày làm việc</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN */}
          {activeTab === 'return' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Chính Sách Trả Hàng, Đổi Mới 1-1 & Hoàn Tiền Đảm Bảo</span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 uppercase">
                    CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN WEBSITE TMĐT NOVASHOP.VN
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl self-start">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>10 Điều khoản • Đổi mới 1-1 trong 30 ngày</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="font-bold text-amber-950">Đặc quyền NovaShop Đảm Bảo: Đổi mới 1-1 trong 30 ngày & Hoàn tiền 100% trong 24 giờ</p>
                  <p className="text-amber-800 text-xs">
                    Trong 30 ngày đầu tiên tính từ thời điểm nhận hàng, nếu sản phẩm gặp lỗi phần cứng do nhà sản xuất, khách hàng được đổi ngay 1 sản phẩm mới 100% nguyên seal cùng mã hoặc hoàn tiền 100% qua ngân hàng, miễn phí 100% cước phí thu hồi hai chiều.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">Mục 1 – 3: Phạm vi, Điều kiện áp dụng & Thời hạn gửi yêu cầu</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Áp dụng khi sản phẩm lỗi kỹ thuật phần cứng NSX (trong 30 ngày), giao sai model/màu sắc hoặc khác mô tả (trong 15 ngày), thiếu phụ kiện hoặc hư hại do vận chuyển (trong 24 – 48 giờ).
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">Mục 4 – 6: Trường hợp không áp dụng, Đóng gói & Chi phí trả hàng</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Quy định rõ các trường hợp từ chối (rơi vỡ, vào nước, đã bóc seal/Active Online khi đổi ý, khóa iCloud/Google). Miễn phí 100% phí vận chuyển thu hồi tận nhà 2 chiều khi lỗi từ NSX hoặc vận chuyển.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">Mục 7 – 8: Quy trình 4 bước & Thời gian hoàn tiền</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Thẩm định kỹ thuật trong 24h. Hoàn tiền qua VietQR Napas247/Ngân hàng trong <strong>2 – 24 giờ</strong>, Ví MoMo/VNPay trong <strong>24 – 48 giờ</strong>, Thẻ tín dụng quốc tế trong <strong>5 – 10 ngày làm việc</strong> kèm hoàn 100% NovaPoints.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">Mục 9 – 10: Giải quyết tranh chấp & Trung tâm tiếp nhận NovaCare</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Hỗ trợ cơ chế <em>Hoàn tiền ngay không cần trả hàng</em> cho phụ kiện hư hỏng nặng do vận chuyển. Tiếp nhận tại <strong>219/20 đường số 12, P. Bình Hưng Hòa, TP.HCM</strong> • Hotline <strong>0908061843</strong>.
                  </p>
                </div>
              </div>

              {onOpenFullPolicyPage && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenFullPolicyPage('return')}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đọc Toàn Văn 10 Điều Khoản Chính Sách Trả Hàng & Hoàn Tiền →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHÍNH SÁCH VẬN CHUYỂN */}
          {activeTab === 'shipping' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Chính Sách Vận Chuyển, Giao Nhận & Đồng Kiểm Toàn Quốc</span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 uppercase">
                    CHÍNH SÁCH VẬN CHUYỂN VÀ GIAO NHẬN HÀNG HÓA NOVASHOP.VN
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl self-start">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>10 Điều khoản • Freeship từ 300.000₫</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">Mục 1 – 3: Đối tác vận chuyển, Phương thức giao & Biểu phí</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Hợp tác cùng <strong>Viettel Post, GHTK, GHN, SPX Express, Ahamove, GrabExpress</strong> phủ sóng 63 tỉnh thành. Giao Hỏa Tốc Now 2H nội thành HN & TP.HCM; Freeship toàn quốc cho mọi đơn từ <strong>300.000₫</strong>.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">Mục 4 – 5: Hàng vận chuyển có điều kiện & Đóng gói 3 lớp</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Quy định vận chuyển an toàn đường bộ đối với pin sạc dự phòng Lithium dung lượng lớn. 100% đơn hàng được ghi hình camera khi đóng gói chống sốc 3 lớp kèm <strong>Tem niêm phong bảo mật NovaShop</strong>.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">Mục 6 – 7: Quy định Đồng kiểm 100% & Giao lại miễn phí 3 lần</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Người Mua được mở kiện kiểm tra ngoại quan hộp máy, tem niêm phong, đúng model, màu sắc và quà tặng trước khi thanh toán; từ chối nhận hàng miễn phí nếu sai lệch. Hỗ trợ giao lại tối đa 03 lần.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">Mục 8 – 10: Bảo hiểm hàng hóa 100% & Bồi thường rủi ro</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Mọi bưu kiện đều có Bảo hiểm khai giá 100%. Nếu thất lạc hoặc hư hại do lỗi Đơn vị vận chuyển, NovaShop gửi bù ngay sản phẩm mới 100% hoặc hoàn tiền 100% trong 24 giờ.
                  </p>
                </div>
              </div>

              {onOpenFullPolicyPage && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenFullPolicyPage('shipping')}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Đọc Toàn Văn 10 Điều Khoản Chính Sách Vận Chuyển →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CHÍNH SÁCH BẢO MẬT */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Chính Sách Bảo Mật Dữ Liệu Cá Nhân & An Toàn Thông Tin</span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 uppercase">
                    CHÍNH SÁCH BẢO MẬT WEBSITE THƯƠNG MẠI ĐIỆN TỬ NOVASHOP.VN
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl self-start">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>Nghị định 13/2023/NĐ-CP • PCI-DSS & SSL 256-bit</span>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>Cam kết bảo vệ quyền riêng tư theo 16 điều khoản chuẩn pháp luật Việt Nam & PCI-DSS Level 1</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Công ty Cổ phần Công nghệ NovaShop Việt Nam</strong> thực hiện nghiêm túc trách nhiệm bảo mật thông tin theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân. Toàn bộ luồng dữ liệu giao dịch được mã hóa SSL 256-Bit, xác thực 3D-Secure 2.0 và tuyệt đối không lưu trữ mã bảo mật thẻ CVV/CVC.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Mục 1 – 4: Phạm vi thu thập, Dữ liệu & Bảo mật tài khoản</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Quy định rõ thời điểm thu thập dữ liệu khi đăng ký/đặt hàng, danh mục dữ liệu cơ bản & giao dịch cần thiết, nguyên tắc bảo mật mật khẩu, mã OTP và xác thực hai yếu tố (2FA).
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Mục 5 – 8: Cookies, Mục đích sử dụng, Lưu trữ & Chia sẻ</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Sử dụng thông tin để xử lý đơn hàng, giao hỏa tốc 2H, kích hoạt bảo hành điện tử IMEI/Serial, đối soát VietQR Napas247. Chỉ chia sẻ tối thiểu cho đơn vị vận chuyển/ngân hàng có cam kết NDA.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Mục 9 – 12: Bảo vệ trẻ em, Bên thứ ba & Chuyển dữ liệu</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Bảo vệ dữ liệu trẻ em dưới 13 tuổi (cần sự đồng ý của phụ huynh/người giám hộ), minh bạch công cụ phân tích ẩn danh Google Analytics, giới hạn trách nhiệm và tuân thủ Điều 25 Nghị định 13/2023/NĐ-CP.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Mục 13 – 16: Rút lại sự đồng ý, Sửa đổi dữ liệu & Liên hệ DPO</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Quyền tự chỉnh sửa thông tin, rút lại sự đồng ý hoặc yêu cầu xóa dữ liệu cá nhân trong vòng 72 giờ qua Ban Bảo vệ Dữ liệu Cá nhân (DPO): <strong>dpo.vn@novashop.vn</strong> hoặc Hotline <strong>0908061843</strong>.
                  </p>
                </div>
              </div>

              {onOpenFullPolicyPage && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenFullPolicyPage('security')}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Đọc Toàn Văn 16 Điều Khoản Chính Sách Bảo Mật →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HƯỚNG DẪN THANH TOÁN VIETQR */}
          {activeTab === 'payment' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Thanh Toán Thông Minh</span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    Hướng Dẫn Thanh Toán Trực Tuyến Qua VietQR Napas 24/7
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl self-start">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>Xác nhận tự động trong 2 giây</span>
                </div>
              </div>

              <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="font-bold text-purple-950">Công nghệ VietQR Napas chuẩn quốc gia 24/7</p>
                  <p className="text-purple-800 text-xs">
                    Không cần nhập số tài khoản thủ công, không lo chuyển nhầm số tiền hay sai nội dung. Mã QR động được sinh riêng theo từng đơn hàng với số tiền và nội dung chuyển khoản được cấu hình tự động.
                  </p>
                </div>
              </div>

              {/* 4 Steps VietQR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">1</span>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">Chọn VietQR</h5>
                  <p className="text-slate-500">Tại bước thanh toán đơn hàng, tick chọn phương thức "Chuyển khoản VietQR 24/7".</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">2</span>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">Mở App Ngân Hàng</h5>
                  <p className="text-slate-500">Mở app Vietcombank, MB Bank, Techcombank, BIDV, ACB hoặc MoMo/ZaloPay và chọn Quét QR.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">3</span>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">Quét Mã & Xác Nhận</h5>
                  <p className="text-slate-500">Quét mã QR trên màn hình; thông tin người nhận và số tiền sẽ được điền chuẩn xác 100%.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">4</span>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">Nhận Hóa Đơn Điện Tử</h5>
                  <p className="text-slate-500">Hệ thống kích hoạt đơn hàng sang trạng thái "Đã thanh toán" và xuất hóa đơn ngay lập tức.</p>
                </div>
              </div>

              {/* Supported Gateways list */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-800">Các phương thức thanh toán trực tuyến được hỗ trợ:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-700">VietQR Napas</span>
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-700">Visa / Mastercard / JCB</span>
                  <span className="bg-pink-100 text-pink-700 px-2.5 py-1 rounded-lg font-bold border border-pink-200">Ví MoMo</span>
                  <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-bold border border-blue-200">VNPay-QR</span>
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold border border-amber-200">COD Tiền Mặt</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: QUY CHẾ HOẠT ĐỘNG */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Quy Chế Hoạt Động Sàn Giao Dịch TMĐT</span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 uppercase">
                    QUY CHẾ HOẠT ĐỘNG WEBSITE CUNG CẤP DỊCH VỤ TMĐT NOVASHOP.VN
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl self-start">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Nghị định 52/2013/NĐ-CP & 85/2021/NĐ-CP</span>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <p>
                  Quy chế hoạt động của Website cung cấp dịch vụ thương mại điện tử <strong>NovaShop.vn</strong> (do Công ty Cổ phần Công nghệ NovaShop Việt Nam vận hành) gồm <strong>12 chương mục chính thức</strong> quy định toàn diện về quyền và nghĩa vụ của các bên tham gia giao dịch:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">I & II. Nguyên tắc chung & Quy định chung</h4>
                    <p className="text-xs text-slate-600">
                      Cam kết kinh doanh 100% sản phẩm chính hãng, công khai minh bạch giá niêm yết (đã gồm VAT), định nghĩa rõ quyền hạn của Người Mua, Đơn vị cung ứng, hệ thống Voucher và điểm thưởng NovaPoints.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">III & IV. Quy trình giao dịch & Thanh toán</h4>
                    <p className="text-xs text-slate-600">
                      Quy trình 7 bước đặt mua hàng trực tuyến, chính sách giao hỏa tốc 2H & đồng kiểm 100%, bảo hành 12-24 tháng, đổi mới 1-1 trong 30 ngày, hủy đơn hàng và 4 bước giải quyết tranh chấp/khiếu nại.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">V, VI, VII & VIII. An toàn giao dịch & Bảo vệ dữ liệu</h4>
                    <p className="text-xs text-slate-600">
                      Bảo mật đường truyền SSL 256-Bit & PCI-DSS Level 1, bảo vệ thông tin cá nhân người tiêu dùng theo Nghị định 13/2023/NĐ-CP, kiểm soát thông tin xấu và trách nhiệm xử lý sự cố kỹ thuật 24/7.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">IX, X, XI & XII. Quyền, Nghĩa vụ & Điều khoản cam kết</h4>
                    <p className="text-xs text-slate-600">
                      Phân định rõ trách nhiệm của Ban Quản lý NovaShop.vn và quyền lợi, nghĩa vụ của Thành viên; hiệu lực thi hành và đầu mối tiếp nhận hỗ trợ pháp lý qua Hotline <strong>0908061843</strong>.
                    </p>
                  </div>
                </div>

                {onOpenFullPolicyPage && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenFullPolicyPage('terms')}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Đọc Toàn Văn 12 Chương Quy Chế Hoạt Động →</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
