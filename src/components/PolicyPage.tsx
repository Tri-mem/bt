import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Truck,
  Lock,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ShoppingBag,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  Printer,
  Share2,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Building2,
  Check,
  Zap,
  Headphones
} from 'lucide-react';
import { PolicyTabId } from './PolicyModal';
import { smoothScrollToElement, smoothScrollToTop } from '../utils/smoothScroll';

interface PolicyPageProps {
  initialTab?: PolicyTabId;
  onBackToHome: () => void;
  onExploreProducts: () => void;
  onOpenFaq?: () => void;
  onShowToast?: (type: 'success' | 'info' | 'error', title: string, description?: string) => void;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({
  initialTab = 'warranty',
  onBackToHome,
  onExploreProducts,
  onOpenFaq,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTabId>(
    initialTab === 'installment' ? 'payment' : initialTab
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [warrantyImei, setWarrantyImei] = useState('');
  const [isSearchingImei, setIsSearchingImei] = useState(false);
  const [imeiResult, setImeiResult] = useState<{
    found: boolean;
    productName?: string;
    serial?: string;
    warrantyMonths?: number;
    expireDate?: string;
    status?: string;
  } | null>(null);

  // Return request form state
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnPhone, setReturnPhone] = useState('');
  const [returnReason, setReturnReason] = useState('defective');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'installment' ? 'payment' : initialTab);
    }
    smoothScrollToTop(480);
  }, [initialTab]);

  const handleTabChange = (tabId: PolicyTabId) => {
    setActiveTab(tabId);
    setTimeout(() => {
      smoothScrollToElement('policy-tabs-section', { offset: 10 });
    }, 30);
  };

  const handleImeiCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyImei.trim()) {
      onShowToast?.('error', 'Chưa nhập thông tin', 'Vui lòng nhập số Serial / IMEI hoặc mã đơn hàng để tra cứu.');
      return;
    }

    setIsSearchingImei(true);
    setImeiResult(null);

    setTimeout(() => {
      setIsSearchingImei(false);
      // Demo smart match
      const imeiUpper = warrantyImei.trim().toUpperCase();
      if (imeiUpper.includes('NOVA') || imeiUpper.length >= 8) {
        setImeiResult({
          found: true,
          productName: 'Xiaomi Mi 50W Power Bank 20000mAh (PB200SZM) Chính Hãng',
          serial: imeiUpper,
          warrantyMonths: 18,
          expireDate: '15/10/2027',
          status: 'Đang trong thời hạn bảo hành chính hãng (Bảo hành 1-đổi-1 30 ngày đã xác nhận)'
        });
        onShowToast?.('success', 'Tìm thấy thông tin bảo hành!', `Thiết bị có hạn bảo hành chính hãng đến 15/10/2027.`);
      } else {
        setImeiResult({
          found: true,
          productName: 'Thiết bị phụ kiện NovaShop Authentic',
          serial: imeiUpper,
          warrantyMonths: 12,
          expireDate: '23/09/2027',
          status: 'Hợp lệ - Bảo hành điện tử kích hoạt qua số điện thoại mua hàng'
        });
        onShowToast?.('info', 'Đã kích hoạt bảo hành điện tử', 'Sản phẩm được bảo hành toàn quốc tại hệ thống NovaCare.');
      }
    }, 600);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId.trim() || !returnPhone.trim()) {
      onShowToast?.('error', 'Vui lòng nhập đủ thông tin', 'Mã đơn hàng và số điện thoại mua hàng là bắt buộc.');
      return;
    }

    setIsSubmittingReturn(true);
    setTimeout(() => {
      setIsSubmittingReturn(false);
      onShowToast?.(
        'success',
        'Đã gửi yêu cầu đổi trả thành công!',
        `Chuyên viên hỗ trợ NovaShop sẽ liên hệ qua SĐT ${returnPhone} trong 15 phút để điều phối shipper thu hồi tận nhà.`
      );
      setReturnOrderId('');
      setReturnPhone('');
    }, 700);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      onShowToast?.('success', 'Đã sao chép liên kết!', 'Bạn có thể chia sẻ liên kết trang chính sách này.');
    }
  };

  const tabs: { id: PolicyTabId; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'warranty', label: 'Bảo Hành Chính Hãng 12 - 24T', icon: ShieldCheck, badge: 'Đổi mới 30N' },
    { id: 'return', label: 'Chính Sách Trả Hàng & Hoàn Tiền', icon: RotateCcw, badge: '10 Mục' },
    { id: 'shipping', label: 'Chính Sách Vận Chuyển', icon: Truck, badge: '10 Mục' },
    { id: 'security', label: 'Chính Sách Bảo Mật', icon: Lock, badge: '16 Mục' },
    { id: 'payment', label: 'Thanh Toán VietQR & Trả Góp', icon: CreditCard, badge: '0% Lãi' },
    { id: 'terms', label: 'Quy Chế Hoạt Động', icon: FileText, badge: '12 Mục' },
  ];

  const faqs = [
    {
      q: 'Tôi có được mở hộp kiểm tra hàng (đồng kiểm) trước khi thanh toán không?',
      a: 'HOÀN TOÀN CÓ THỂ. NovaShop áp dụng chính sách 100% đồng kiểm toàn quốc cùng các đối tác Giao Hàng Tiết Kiệm, Viettel Post, Ahamove. Quý khách có quyền mở bưu phẩm kiểm tra ngoại quan máy, đúng model, màu sắc và đầy đủ phụ kiện trước khi thanh toán cho shipper.'
    },
    {
      q: 'Trong 30 ngày đầu nếu máy bị lỗi phần cứng từ nhà sản xuất thì xử lý thế nào?',
      a: 'NovaShop cam kết ĐỔI MỚI 1-1 NGAY LẬP TỨC sản phẩm cùng model nguyên seal mới 100%. Quý khách không phải chờ đợi gửi đi thẩm định lâu. Chúng tôi sẽ điều phối nhân viên đến tận nhà thu hồi máy lỗi và bàn giao máy mới miễn phí 100% cước phí.'
    },
    {
      q: 'Sản phẩm mua tại NovaShop có xuất được hóa đơn điện tử VAT cho công ty không?',
      a: 'Tất cả sản phẩm tại NovaShop là hàng chính ngạch 100%, giá niêm yết đã bao gồm thuế VAT. Quý khách chỉ cần tích chọn "Xuất hóa đơn VAT cho doanh nghiệp" khi thanh toán hoặc cung cấp mã số thuế, hóa đơn điện tử sẽ được gửi qua email trong vòng 2 - 4 giờ làm việc.'
    },
    {
      q: 'Nếu tôi ở tỉnh xa thì quy trình gửi bảo hành có phức tạp không?',
      a: 'Cực kỳ đơn giản! Quý khách không cần mang máy đi đâu cả. Chỉ cần liên hệ tổng đài 0908061843 hoặc đăng ký trên website, nhân viên Viettel Post sẽ đến tận nhà quý khách để đóng gói niêm phong và gửi về trung tâm NovaCare. Toàn bộ cước vận chuyển 2 chiều do NovaShop chi trả.'
    },
    {
      q: 'NovaShop có hỗ trợ trả góp 0% lãi suất không?',
      a: 'Có, NovaShop hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng của hơn 25 ngân hàng liên kết toàn quốc (kỳ hạn 3, 6, 9, 12 tháng) và hỗ trợ trả góp qua CCCD gắn chip xét duyệt trực tuyến chỉ trong 5 phút.'
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-8 pb-12 sm:pb-16 section-view-enter">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs text-slate-500 bg-white/80 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            onClick={onBackToHome}
            className="hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            Trang chủ
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-900 font-bold truncate">Chính Sách & Dịch Vụ</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handlePrint}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            title="In trang chính sách"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In quy định</span>
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            title="Chia sẻ liên kết"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>
          <button
            onClick={onBackToHome}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Mua Sắm</span>
          </button>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-4 sm:p-10 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] sm:text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Chính Sách & Cam Kết Dịch Vụ Khách Hàng</span>
          </div>

          <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Minh Bạch Tuyệt Đối. <br className="hidden sm:inline" />
            Bảo Vệ Quyền Lợi Người Dùng Trong Từng Giao Dịch.
          </h1>

          <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
            Hệ thống chính sách bảo hành chính hãng từ 12 - 24 tháng, cam kết đổi mới 1-1 trong 30 ngày, 
            miễn phí đồng kiểm khi nhận hàng và hỗ trợ kỹ thuật tận nơi 24/7 trên toàn quốc.
          </p>

          {/* 8 Consolidated Core Policy & Service Commitments (Merged from Homepage) */}
          <div className="pt-2 sm:pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleTabChange('payment')}
              className="p-3 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xs rounded-xl border border-white/15 hover:border-cyan-400/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-cyan-300 font-extrabold text-xs sm:text-sm truncate">VietQR 24/7</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate">Tự động xác nhận 2 giây</div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('shipping')}
              className="p-3 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xs rounded-xl border border-white/15 hover:border-amber-400/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-extrabold text-xs sm:text-sm truncate">Giao Nhanh 2H</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate">Nội thành HN & TP.HCM</div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('warranty')}
              className="p-3 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xs rounded-xl border border-white/15 hover:border-emerald-400/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-extrabold text-xs sm:text-sm truncate">100% Chính Hãng</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate">Bảo hành 12 - 24 tháng</div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('return')}
              className="p-3 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xs rounded-xl border border-white/15 hover:border-indigo-400/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <RotateCcw className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-indigo-300 font-extrabold text-xs sm:text-sm truncate">Đổi Trả 30 Ngày</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate">Đổi mới 1-1 nếu lỗi NSX</div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('shipping')}
              className="p-3 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xs rounded-xl border border-white/15 hover:border-blue-400/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-blue-300 font-extrabold text-xs sm:text-sm truncate">Miễn Phí Vận Chuyển</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate">Mọi đơn hàng từ 300.000₫</div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('security')}
              className="p-3 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xs rounded-xl border border-white/15 hover:border-teal-400/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-teal-300 font-extrabold text-xs sm:text-sm truncate">Bảo Mật Thanh Toán</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate">Chuẩn PCI-DSS & SSL 256-Bit</div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('return')}
              className="p-3 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xs rounded-xl border border-white/15 hover:border-amber-400/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-extrabold text-xs sm:text-sm truncate">Đổi Mới 1-1 Tận Nơi</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate">30 ngày đầu tiên nếu lỗi</div>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('warranty')}
              className="p-3 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xs rounded-xl border border-white/15 hover:border-purple-400/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Headphones className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-purple-300 font-extrabold text-xs sm:text-sm truncate">Hỗ Trợ 24/7</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate">Hotline: 0908061843</div>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Menu Navigation Bar */}
      <div id="policy-tabs-section" data-scroll-section className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div id="policy-content-section" data-scroll-section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-8">
        {/* ================= TAB 1: WARRANTY ================= */}
        {activeTab === 'warranty' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-slate-200 pb-6 space-y-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold mb-3 border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>CHÍNH SÁCH BẢO HÀNH CHÍNH HÃNG & HỖ TRỢ 24/7</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Cam Kết 100% Chính Hãng (BH 12 - 24 Tháng) & Hỗ Trợ Kỹ Thuật 24/7
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Áp dụng cho toàn bộ các thiết bị điện thoại, máy tính bảng, laptop, tai nghe và phụ kiện chính hãng phân phối tại hệ thống NovaShop.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">100% Chính Hãng • BH 12 - 24 Tháng</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Nguyên seal nhà sản xuất, đầy đủ hóa đơn VAT điện tử, kích hoạt bảo hành điện tử theo IMEI/Serial chính ngạch toàn quốc.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Hỗ Trợ 24/7 • Hotline: 0908061843</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Đội ngũ chuyên viên kỹ thuật NovaCare trực tuyến 24/7, hỗ trợ kiểm tra lỗi từ xa và điều phối bảo hành 2 chiều miễn phí.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tra cứu bảo hành điện tử nhanh */}
            <div className="bg-linear-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-400" />
                    <span>Tra Cứu Hạn Bảo Hành Điện Tử (e-Warranty)</span>
                  </h3>
                  <p className="text-xs text-slate-300">Nhập số Serial, mã IMEI thiết bị hoặc mã đơn hàng để kiểm tra thời hạn bảo hành</p>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full font-bold self-start">
                  Cập nhật thời gian thực
                </span>
              </div>

              <form onSubmit={handleImeiCheck} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nhập IMEI / Serial Number (Ví dụ: NOVA8899 hoặc số Serial trên hộp)..."
                  value={warrantyImei}
                  onChange={(e) => setWarrantyImei(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  disabled={isSearchingImei}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer shrink-0"
                >
                  {isSearchingImei ? 'Đang tra cứu...' : 'Tra Cứu Ngay'}
                </button>
              </form>

              {imeiResult && (
                <div className="p-4 bg-white/10 border border-white/20 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{imeiResult.productName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                    <div>Mã Serial/IMEI: <strong className="text-white">{imeiResult.serial}</strong></div>
                    <div>Thời hạn bảo hành: <strong className="text-white">{imeiResult.warrantyMonths} Tháng</strong></div>
                    <div>Hết hạn ngày: <strong className="text-amber-300">{imeiResult.expireDate}</strong></div>
                  </div>
                  <div className="text-slate-400 pt-1 border-t border-white/10">Trạng thái: {imeiResult.status}</div>
                </div>
              )}
            </div>

            {/* Chi tiết 4 Bước bảo hành */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Quy Trình Tiếp Nhận & Xử Lý Bảo Hành 4 Bước Tiện Lợi:</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm">1</div>
                  <h4 className="font-bold text-slate-900 text-sm">Báo lỗi qua tổng đài</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Khách hàng gọi hotline 0908061843 hoặc nhắn tin fanpage báo tình trạng thiết bị.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm">2</div>
                  <h4 className="font-bold text-slate-900 text-sm">Thu hồi máy tận nơi</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Shipper Viettel Post / GHTK đến tận nhà đóng gói niêm phong. Khách không cần di chuyển.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm">3</div>
                  <h4 className="font-bold text-slate-900 text-sm">Kỹ thuật kiểm tra</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kỹ thuật viên NovaCare thẩm định lỗi trong 24 giờ và kích hoạt đổi mới 1-1 hoặc sửa chữa.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm">4</div>
                  <h4 className="font-bold text-slate-900 text-sm">Giao trả miễn phí</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Giao trả thiết bị đã hoàn tất bảo hành về tận tay quý khách. Miễn 100% chi phí vận chuyển.
                  </p>
                </div>
              </div>
            </div>

            {/* Điều kiện chấp nhận bảo hành */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Trường Hợp Được Bảo Hành Miễn Phí</span>
                </h4>
                <ul className="text-xs text-emerald-800 space-y-2 list-disc list-inside leading-relaxed">
                  <li>Sản phẩm gặp lỗi kỹ thuật từ phần cứng của nhà sản xuất (nguồn, màn hình, bo mạch, pin, cổng kết nối).</li>
                  <li>Sản phẩm còn trong thời hạn bảo hành điện tử tính từ ngày kích hoạt đơn hàng.</li>
                  <li>Tem bảo hành và số Serial/IMEI trên thiết bị còn nguyên vẹn, trùng khớp với hệ thống dữ liệu NovaShop.</li>
                  <li>Sản phẩm không có dấu hiệu can thiệp phần cứng từ bên thứ ba chưa được ủy quyền.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-3">
                <h4 className="font-bold text-rose-900 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Trường Hợp Từ Chối Bảo Hành Miễn Phí (Hỗ trợ sửa chữa có phí)</span>
                </h4>
                <ul className="text-xs text-rose-800 space-y-2 list-disc list-inside leading-relaxed">
                  <li>Thiết bị bị rơi vỡ, cấn móp biến dạng khung sườn, nứt vỡ kính do ngoại lực tác động.</li>
                  <li>Thiết bị có dấu hiệu ngấm nước, ẩm ướt hoặc hóa chất ăn mòn linh kiện bên trong.</li>
                  <li>Khách hàng tự ý can thiệp nạp ROM cook, can thiệp sâu can thiệp bootloader gây brick thiết bị.</li>
                  <li>Hết thời hạn bảo hành tiêu chuẩn (NovaShop hỗ trợ sửa chữa dịch vụ tính phí ưu đãi giảm 20%).</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN (RETURN & REFUND POLICY) ================= */}
        {activeTab === 'return' && (
          <div className="space-y-8 animate-fade-in">
            {/* Document Header */}
            <div className="border-b border-slate-200 pb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>CHÍNH SÁCH TRẢ HÀNG, ĐỔI MỚI 1-1 & HOÀN TIỀN ĐẢM BẢO</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Cập nhật & Hiệu lực: Năm 2026 • Theo Luật Bảo vệ quyền lợi người tiêu dùng & Nghị định 52/2013/NĐ-CP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
                CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN WEBSITE THƯƠNG MẠI ĐIỆN TỬ NOVASHOP.VN
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Chính sách Trả hàng và Hoàn tiền này quy định chi tiết các điều kiện, thời hạn, quy trình thu hồi tận nơi, chi phí vận chuyển hoàn trả và phương thức hoàn tiền cho Người Mua trên nền tảng <strong>NovaShop.vn</strong> do <strong>Công ty Cổ phần Công nghệ NovaShop Việt Nam</strong> vận hành, cam kết <strong>Đổi mới 1-1 trong 30 ngày đầu</strong> và <strong>Hoàn tiền 100% trong 24 giờ</strong>.
              </p>
            </div>

            {/* 3 Cam kết cốt lõi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-base sm:text-lg">
                  <RotateCcw className="w-5 h-5 shrink-0" />
                  <span>Đổi Mới 1-1 Trong 30 Ngày</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Máy nguyên seal 100% cùng model</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nếu sản phẩm phát sinh lỗi kỹ thuật phần cứng từ nhà sản xuất trong 30 ngày đầu kể từ khi nhận hàng, NovaShop đổi ngay máy mới nguyên seal miễn phí 100% cước phí thu hồi hai chiều.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-base sm:text-lg">
                  <CreditCard className="w-5 h-5 shrink-0" />
                  <span>Hoàn Tiền Siêu Tốc 24H</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Qua VietQR Napas247 / Ngân hàng</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trường hợp sản phẩm hết hàng để đổi mới hoặc khách hàng đủ điều kiện trả hàng hoàn tiền, 100% giá trị thanh toán sẽ được chuyển khoản hoàn lại trong vòng 2 – 24 giờ làm việc.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-extrabold text-base sm:text-lg">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>Cam Kết Đền Bù 200%</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Bảo đảm 100% hàng chính ngạch</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Toàn bộ sản phẩm phân phối trên NovaShop.vn đều là hàng chính hãng có đầy đủ hóa đơn VAT. Hoàn tiền gấp đôi (200%) nếu phát hiện hàng giả, hàng nhái hoặc hàng dựng.
                </p>
              </div>
            </div>

            {/* Quick Table of Contents (1 - 10) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <span>Mục Lục Chính Sách Trả Hàng Và Hoàn Tiền (10 Điều Khoản Chính Thức)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                {[
                  { id: 'ret-1', num: '1.', title: 'Phạm vi & Đối tượng áp dụng' },
                  { id: 'ret-2', num: '2.', title: 'Điều kiện áp dụng đổi trả' },
                  { id: 'ret-3', num: '3.', title: 'Thời hạn gửi yêu cầu' },
                  { id: 'ret-4', num: '4.', title: 'Trường hợp không áp dụng' },
                  { id: 'ret-5', num: '5.', title: 'Tình trạng & Đóng gói hoàn trả' },
                  { id: 'ret-6', num: '6.', title: 'Chi phí vận chuyển trả hàng' },
                  { id: 'ret-7', num: '7.', title: 'Quy trình thực hiện 4 bước' },
                  { id: 'ret-8', num: '8.', title: 'Phương thức & Thời gian hoàn tiền' },
                  { id: 'ret-9', num: '9.', title: 'Quyền của các bên & Tranh chấp' },
                  { id: 'ret-10', num: '10.', title: 'Trung tâm tiếp nhận & Liên hệ' },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <span className="font-extrabold text-indigo-600 shrink-0">{item.num}</span>
                    <span className="truncate">{item.title}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* 10 Detailed Clauses */}
            <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {/* SECTION 1 */}
              <div id="ret-1" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">1</span>
                  <span>PHẠM VI VÀ ĐỐI TƯỢNG ÁP DỤNG</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>1.1.</strong> Chính sách Trả hàng và Hoàn tiền này áp dụng cho tất cả Người Mua, Đơn vị cung ứng / Đối tác phân phối chính hãng, các Đơn vị vận chuyển liên kết và nhân viên giao nhận tham gia giao dịch trên Website thương mại điện tử <strong>NovaShop.vn</strong>.
                  </p>
                  <p>
                    <strong>1.2.</strong> Theo cơ chế <strong>&ldquo;NovaShop Đảm Bảo&rdquo;</strong>, khoản tiền thanh toán cho đơn hàng của Người Mua được hệ thống bảo vệ an toàn. Người Mua có quyền gửi yêu cầu <strong>Đổi mới 1-1</strong> hoặc <strong>Trả hàng / Hoàn tiền</strong> trực tiếp trên hệ thống hoặc qua tổng đài Chăm sóc khách hàng khi sản phẩm gặp sự cố kỹ thuật hoặc không đúng cam kết.
                  </p>
                  <p>
                    <strong>1.3.</strong> NovaShop bảo lưu quyền cập nhật, sửa đổi hoặc bổ sung Chính sách Trả hàng và Hoàn tiền này vào bất kỳ thời điểm nào nhằm nâng cao quyền lợi người tiêu dùng và phù hợp với quy định của pháp luật Việt Nam hiện hành.
                  </p>
                </div>
              </div>

              {/* SECTION 2 */}
              <div id="ret-2" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">2</span>
                  <span>ĐIỀU KIỆN ÁP DỤNG TRẢ HÀNG VÀ HOÀN TIỀN</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>2.1.</strong> Người Mua có quyền gửi yêu cầu <strong>Đổi mới 1-1 sản phẩm nguyên seal</strong> hoặc <strong>Trả hàng và Hoàn tiền 100%</strong> trong các trường hợp sau đây:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Không nhận được hàng hoặc nhận thiếu hàng:</strong> Người Mua đã hoàn tất thanh toán (hoặc đơn hàng báo giao thành công) nhưng thực tế chưa nhận được kiện hàng, hoặc kiện hàng bị thiếu sản phẩm chính, thiếu phụ kiện tiêu chuẩn trong hộp, thiếu quà tặng khuyến mãi đi kèm;</li>
                    <li><strong>Sản phẩm phát sinh lỗi kỹ thuật phần cứng từ nhà sản xuất:</strong> Thiết bị gặp lỗi nguồn, màn hình (điểm chết vượt chuẩn hãng, sọc màn, liệt cảm ứng), bo mạch chủ, pin sụt nguồn bất thường, camera, loa/mic, cổng sạc hoặc kết nối không dây (Wi-Fi/Bluetooth/5G) được Trung tâm kỹ thuật NovaCare hoặc Trung tâm bảo hành ủy quyền của hãng xác nhận;</li>
                    <li><strong>Sản phẩm bị hư hại trong quá trình vận chuyển:</strong> Kiện hàng khi mở hộp đồng kiểm phát hiện thân máy bị nứt vỡ, cấn móp khung sườn, biến dạng hoặc thấm ướt do lỗi bảo quản của đơn vị vận chuyển;</li>
                    <li><strong>Giao sai sản phẩm hoặc khác biệt rõ rệt so với mô tả:</strong> Sản phẩm nhận được bị sai model, sai màu sắc, sai dung lượng RAM/ROM, sai cấu hình hoặc khác biệt cơ bản so với thông số kỹ thuật niêm yết trên website NovaShop.vn;</li>
                    <li><strong>Sản phẩm không đúng cam kết chính hãng:</strong> Sản phẩm có dấu hiệu là hàng giả, hàng nhái, không tra cứu được Serial/IMEI chính hãng hoặc đã bị kích hoạt bảo hành điện tử từ trước khi giao (đối với cam kết máy mới 100% nguyên seal);</li>
                    <li><strong>Nhu cầu đổi nâng cấp lên dòng sản phẩm cao hơn (Đổi ý có điều kiện):</strong> Áp dụng cho khách hàng thành viên muốn nâng cấp lên model có giá trị cao hơn khi sản phẩm ban đầu còn nguyên seal hộp chưa kích hoạt, hoặc áp dụng theo biểu phí chương trình <em>Thu cũ – Đổi mới lên đời</em> tại NovaShop.</li>
                  </ul>
                </div>
              </div>

              {/* SECTION 3 */}
              <div id="ret-3" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">3</span>
                  <span>THỜI HẠN GỬI YÊU CẦU ĐỔI TRẢ VÀ HOÀN TIỀN</span>
                </h3>
                <div className="space-y-3">
                  <p>
                    <strong>3.1.</strong> Tùy thuộc vào từng lý do yêu cầu đổi trả, Người Mua có thể gửi yêu cầu trong các mốc thời hạn ưu việt sau đây (tính từ thời điểm đơn hàng được cập nhật trạng thái <em>&ldquo;Giao hàng thành công&rdquo;</em>):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
                      <div className="font-extrabold text-indigo-900 text-sm">Trong vòng 30 Ngày đầu</div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Áp dụng cho mọi sản phẩm điện thoại, laptop, máy tính bảng, tai nghe, đồng hồ thông minh và phụ kiện chính hãng phát sinh <strong>lỗi kỹ thuật phần cứng từ nhà sản xuất</strong> (Đổi mới 1-1 nguyên seal hoặc Hoàn tiền 100%).
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                      <div className="font-extrabold text-emerald-900 text-sm">Trong vòng 15 Ngày đầu</div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Áp dụng cho các yêu cầu Trả hàng / Hoàn tiền do nhận sản phẩm <strong>khác biệt rõ rệt với mô tả, sai model/màu sắc</strong> hoặc nhu cầu <strong>đổi nâng cấp sản phẩm nguyên seal</strong> theo cơ chế NovaShop Đảm Bảo.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                      <div className="font-extrabold text-amber-900 text-sm">Trong vòng 24 – 48 Giờ đầu</div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Áp dụng cho các khiếu nại về <strong>giao thiếu sản phẩm, thiếu phụ kiện/quà tặng, hộp móp méo hoặc bể vỡ ngoại quan</strong> do vận chuyển (kèm theo video quay quá trình mở kiện hàng).
                      </p>
                    </div>
                  </div>
                  <p>
                    <strong>3.2.</strong> Kể từ ngày thứ 31 trở đi sau khi nhận hàng, sản phẩm sẽ được chuyển sang áp dụng <strong>Chính sách Bảo hành chính hãng 12 – 24 tháng</strong> hoàn toàn miễn phí tại hệ thống NovaCare và các Trung tâm bảo hành ủy quyền toàn quốc.
                  </p>
                </div>
              </div>

              {/* SECTION 4 */}
              <div id="ret-4" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">4</span>
                  <span>CÁC TRƯỜNG HỢP KHÔNG ÁP DỤNG TRẢ HÀNG VÀ HOÀN TIỀN</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>4.1.</strong> NovaShop có quyền từ chối tiếp nhận yêu cầu Trả hàng / Hoàn tiền hoặc Đổi mới 1-1 miễn phí trong các trường hợp sau:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Người Mua gửi yêu cầu sau khi đã hết thời hạn quy định tại Mục 3;</li>
                    <li>Sản phẩm không có lỗi kỹ thuật và đúng mô tả đơn hàng, nhưng Người Mua đã bóc seal niêm phong hộp, đã bật nguồn kích hoạt bảo hành điện tử (Active Online trên hệ thống Apple/Samsung/Xiaomi/Sony...) và yêu cầu trả hàng với lý do <em>&ldquo;Đổi ý / Không còn nhu cầu sử dụng&rdquo;</em>;</li>
                    <li>Sản phẩm bị hư hỏng do lỗi chủ quan của Người Mua: rơi rớt, va đập mạnh, cấn móp khung vỏ, nứt vỡ màn hình/mặt kính, trầy xước sâu, ngấm nước/hóa chất, cháy nổ do dùng sai nguồn điện hoặc phụ kiện sạc không chính hãng;</li>
                    <li>Sản phẩm có dấu hiệu đã bị tự ý tháo mở ốc vít, rách tem niêm phong bảo hành hoặc can thiệp sửa chữa phần cứng/phần mềm trái phép (Root, Jailbreak, nạp ROM tùy chỉnh gây mất IMEI/brick máy) tại các cơ sở bên ngoài;</li>
                    <li>Số Serial / IMEI trên thân thiết bị bị cạo sửa, mờ nhòe hoặc không trùng khớp với vỏ hộp và dữ liệu xuất kho trên hóa đơn điện tử của NovaShop;</li>
                    <li>Thiết bị còn bị khóa bởi các tài khoản bảo mật cá nhân của Người Mua (iCloud / Find My iPhone, Google Account FRP, Samsung Account, Mi Cloud, mật khẩu màn hình) mà Người Mua không thể cung cấp mật khẩu để thoát tài khoản;</li>
                    <li>Các danh mục sản phẩm đặc thù không hỗ trợ trả hàng theo lý do đổi ý khi đã mở bao bì: Phần mềm bản quyền kỹ thuật số (Key Office/Windows/Antivirus đã cào mã), thẻ cào/SIM dữ liệu đã kích hoạt, miếng dán màn hình/kính cường lực đã bóc lớp keo dán;</li>
                    <li>Người Mua không cung cấp được bằng chứng xác thực (video mở hộp / hình ảnh đồng kiểm) đối với các khiếu nại báo mất hàng hoặc vỡ nát ngoại quan sau khi đã ký xác nhận nhận hàng nguyên vẹn với bưu tá.</li>
                  </ul>
                </div>
              </div>

              {/* SECTION 5 */}
              <div id="ret-5" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">5</span>
                  <span>TÌNH TRẠNG HÀNG HÓA VÀ QUY ĐỊNH ĐÓNG GÓI HOÀN TRẢ</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>5.1. Yêu cầu về tính toàn vẹn của bộ sản phẩm hoàn trả:</strong> Để quá trình thẩm định và hoàn tiền diễn ra nhanh chóng trong 24 giờ, sản phẩm gửi trả về NovaShop cần đảm bảo:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Bao gồm đầy đủ thân máy chính, vỏ hộp gốc trùng số Serial/IMEI, toàn bộ phụ kiện tiêu chuẩn đi kèm (cáp sạc, củ sạc, tai nghe, que lấy sim, sách hướng dẫn sử dụng);</li>
                    <li>Hoàn trả đầy đủ các sản phẩm quà tặng khuyến mãi, phụ kiện tặng kèm trong đơn hàng (nếu khách hàng yêu cầu hoàn tiền toàn bộ đơn hàng);</li>
                    <li>Người Mua chủ động sao lưu và xóa toàn bộ dữ liệu cá nhân, tháo thẻ SIM, thẻ nhớ ngoài và <strong>đăng xuất hoàn toàn khỏi iCloud / Google / Samsung Account</strong> trước khi đóng gói gửi trả.</li>
                  </ul>
                  <p>
                    <strong>5.2. Quy định đóng gói hàng hoàn trả:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Người Mua vui lòng đặt hộp sản phẩm vào trong thùng carton cứng (tận dụng lại thùng đóng gói 3 lớp ban đầu của NovaShop hoặc thùng tương đương), bọc màng xốp nổ (bubble wrap) chống sốc xung quanh và dán kín bằng băng keo;</li>
                    <li>Tuyệt đối không dán trực tiếp băng keo hoặc viết chữ bằng bút dạ lên bề mặt vỏ hộp gốc của nhà sản xuất (Apple, Samsung, Sony, Dell...);</li>
                    <li>Ghi rõ <strong>Mã đơn hàng (VD: ORD-...)</strong>, Số điện thoại và nội dung <em>&ldquo;Đổi trả NovaShop&rdquo;</em> bên ngoài kiện carton và quay lại video/chụp ảnh kiện hàng trước khi bàn giao cho nhân viên thu hồi.</li>
                  </ul>
                </div>
              </div>

              {/* SECTION 6 */}
              <div id="ret-6" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">6</span>
                  <span>CHI PHÍ VẬN CHUYỂN TRẢ HÀNG VÀ HÌNH THỨC THU HỒI</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>6.1. Miễn phí 100% chi phí vận chuyển trả hàng 2 chiều:</strong> Trong mọi trường hợp sản phẩm được xác định có lỗi kỹ thuật từ nhà sản xuất, giao sai sản phẩm, thiếu phụ kiện hoặc hư hại trong quá trình vận chuyển, <strong>NovaShop chi trả 100% cước phí vận chuyển thu hồi và giao máy mới</strong>. Người Mua không phải thanh toán bất kỳ khoản phí nào.
                  </p>
                  <p>
                    <strong>6.2. Các hình thức gửi trả hàng linh hoạt dành cho Người Mua:</strong>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Cách 1: Lấy hàng hoàn trả tận nhà</h4>
                      <p className="text-xs text-slate-600">
                        Hệ thống NovaShop tự động tạo mã vận đơn thu hồi; bưu tá của Viettel Post / GHTK / Ahamove sẽ đến tận địa chỉ của Người Mua để nhận lại kiện hàng hoàn toàn miễn phí.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Cách 2: Gửi trả tại bưu cục / Tự sắp xếp</h4>
                      <p className="text-xs text-slate-600">
                        Người Mua có thể mang kiện hàng ra bưu cục gần nhất. Nếu Người Mua tạm ứng phí gửi hàng, NovaShop sẽ hoàn trả 100% cước phí vận chuyển theo hóa đơn bưu chính kèm vào số tiền hoàn đơn hàng.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Cách 3: Đổi trả trực tiếp tại Trung tâm</h4>
                      <p className="text-xs text-slate-600">
                        Người Mua tại TP. Hồ Chí Minh có thể mang sản phẩm trực tiếp đến Trung tâm kỹ thuật NovaCare (219/20 đường số 12, P. Bình Hưng Hòa, Q. Bình Tân) để được kiểm tra và đổi máy mới ngay trong 30 phút.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 7 */}
              <div id="ret-7" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">7</span>
                  <span>QUY TRÌNH THỰC HIỆN ĐỔI TRẢ VÀ HOÀN TIỀN (4 BƯỚC CHUẨN HÓA)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">01</div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Gửi yêu cầu trực tuyến</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Điền biểu mẫu <em>Đăng ký Đổi trả / Hoàn tiền</em> bên dưới hoặc gọi Hotline <strong>0908061843</strong>, cung cấp mã đơn hàng cùng ảnh/video tình trạng sản phẩm.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">02</div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Xác nhận & Điều phối thu hồi</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Trong vòng <strong>15 phút – 02 giờ</strong>, chuyên viên CSKH liên hệ xác nhận và điều phối Shipper đến tận nơi nhận lại hàng hoàn trả miễn phí.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">03</div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Thẩm định kỹ thuật 24H</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Ngay khi bưu kiện về tới Trung tâm NovaCare, kỹ thuật viên kiểm tra đối chiếu Serial/IMEI và xác nhận tình trạng lỗi trong tối đa <strong>24 giờ làm việc</strong>.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">04</div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Giao máy mới / Hoàn tiền 100%</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Xuất kho giao ngay sản phẩm mới 100% nguyên seal tới khách hàng hoặc kích hoạt lệnh hoàn tiền 100% qua ngân hàng kèm thông báo qua Email/SMS.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 8 */}
              <div id="ret-8" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">8</span>
                  <span>PHƯƠNG THỨC VÀ THỜI GIAN HOÀN TIỀN CHO NGƯỜI MUA</span>
                </h3>
                <div className="space-y-3">
                  <p>
                    <strong>8.1.</strong> Ngay sau khi yêu cầu hoàn tiền được phê duyệt, NovaShop thực hiện hoàn trả 100% số tiền khách hàng đã thanh toán theo bảng thời gian cam kết dưới đây:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden tabular-nums">
                      <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Phương Thức Thanh Toán Ban Đầu</th>
                          <th className="p-3">Kênh Nhận Tiền Hoàn Trả</th>
                          <th className="p-3">Thời Gian Tiền Về Tài Khoản</th>
                          <th className="p-3">Phí Giao Dịch Hoàn Tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        <tr className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">Chuyển khoản VietQR Napas247</td>
                          <td className="p-3">Chuyển khoản liên ngân hàng 24/7 về STK của Người Mua</td>
                          <td className="p-3 font-bold text-emerald-600">Trong vòng 2 – 24 giờ làm việc</td>
                          <td className="p-3 font-semibold text-emerald-700">Miễn phí 100%</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">Thanh toán tiền mặt khi nhận hàng (COD)</td>
                          <td className="p-3">Chuyển khoản ngân hàng chính chủ hoặc Tiền mặt tại Quầy</td>
                          <td className="p-3 font-bold text-emerald-600">Trong vòng 24 giờ làm việc</td>
                          <td className="p-3 font-semibold text-emerald-700">Miễn phí 100%</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">Ví điện tử (MoMo / VNPay-QR)</td>
                          <td className="p-3">Hoàn trực tiếp về số dư Ví điện tử đã thanh toán</td>
                          <td className="p-3 font-bold text-indigo-600">Từ 24 – 48 giờ làm việc</td>
                          <td className="p-3 font-semibold text-emerald-700">Miễn phí 100%</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">Thẻ Tín dụng / Ghi nợ Quốc tế (Visa, Master, JCB) / Trả góp</td>
                          <td className="p-3">Hoàn hạn mức trực tiếp về Thẻ tín dụng/Ghi nợ qua Ngân hàng phát hành</td>
                          <td className="p-3 font-bold text-amber-700">5 – 10 ngày làm việc (theo quy trình Ngân hàng)</td>
                          <td className="p-3 font-semibold text-emerald-700">Miễn phí 100% (Kể cả phí hủy trả góp)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>8.2. Hoàn trả Điểm thưởng NovaPoints & Mã giảm giá (Voucher):</strong> Khi đơn hàng được hoàn tiền toàn bộ, số điểm thưởng <strong>NovaPoints</strong> mà Người Mua đã sử dụng để giảm giá trong đơn hàng đó sẽ được hệ thống tự động cộng hoàn trả 100% vào tài khoản thành viên. Nếu Voucher áp dụng trong đơn hàng vẫn còn thời hạn hiệu lực, mã Voucher cũng sẽ được khôi phục để Người Mua sử dụng cho đơn hàng tiếp theo.
                  </p>
                </div>
              </div>

              {/* SECTION 9 */}
              <div id="ret-9" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">9</span>
                  <span>QUYỀN LỢI, NGHĨA VỤ CỦA CÁC BÊN & CƠ CHẾ GIẢI QUYẾT TRANH CHẤP</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>9.1. Quyền của Người Mua:</strong> Người Mua có quyền yêu cầu thẩm định độc lập tại Trung tâm bảo hành chính hãng của nhà sản xuất (Apple, Samsung, Sony, Dell, Asus...) nếu chưa đồng ý với kết luận kỹ thuật ban đầu; có quyền nhận lại 100% số tiền đã thanh toán và không phải chịu bất kỳ khoản phí ẩn nào khi sản phẩm có lỗi từ nhà sản xuất hoặc đơn vị vận chuyển.
                  </p>
                  <p>
                    <strong>9.2. Quyền của Người Bán / Đơn vị cung ứng:</strong> Bộ phận kho vận và Đối tác cung ứng trên NovaShop có quyền kiểm tra đối chiếu tình trạng thực tế của hàng hoàn trả so với biên bản xuất kho. Trường hợp phát hiện sản phẩm hoàn trả bị tráo đổi linh kiện, không trùng Serial/IMEI hoặc bị hư hỏng nặng do lỗi đóng gói sơ sài của Người Mua, đơn vị tiếp nhận có quyền gửi phản hồi kèm video đồng kiểm trong vòng <strong>02 ngày lịch</strong> để Ban Quản lý NovaShop xem xét giải quyết.
                  </p>
                  <p>
                    <strong>9.3. Cơ chế &ldquo;Hoàn tiền ngay không cần trả hàng&rdquo;:</strong> Trong một số trường hợp đặc biệt (ví dụ: phụ kiện giá trị nhỏ bị vỡ nát hoàn toàn do vận chuyển, hoặc kiện hàng được xác nhận thất lạc 100% trên tuyến giao vận), NovaShop sẽ kích hoạt chế độ <strong>Hoàn tiền ngay lập tức</strong> cho Người Mua mà Người Mua không cần phải thực hiện thủ tục gửi trả lại hàng.
                  </p>
                </div>
              </div>

              {/* SECTION 10 */}
              <div id="ret-10" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">10</span>
                  <span>TRUNG TÂM TIẾP NHẬN ĐỔI TRẢ & LIÊN HỆ HỖ TRỢ KHÁCH HÀNG</span>
                </h3>
                <div className="space-y-3">
                  <p>
                    <strong>10.1.</strong> Mọi yêu cầu gửi hàng đổi trả, bảo hành 1-đổi-1 hoặc tra cứu tiến độ hoàn tiền, Quý khách hàng vui lòng liên hệ trực tiếp tại:
                  </p>
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2 text-xs sm:text-sm text-slate-800">
                    <div className="font-extrabold text-indigo-950 uppercase">
                      TRUNG TÂM ĐỔI TRẢ & BẢO HÀNH NOVACARE — CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVASHOP VIỆT NAM
                    </div>
                    <p>• <strong>Địa chỉ nhận hàng hoàn trả trực tiếp / qua bưu điện:</strong> 219/20 đường số 12, Phường Bình Hưng Hòa, Quận Bình Tân, Thành phố Hồ Chí Minh, Việt Nam</p>
                    <p>• <strong>Người nhận trên phiếu gửi hàng:</strong> Trung tâm Đổi trả & Bảo hành NovaShop Việt Nam</p>
                    <p>• <strong>Hotline hỗ trợ Đổi trả & Hoàn tiền 24/7 (Miễn phí):</strong> <a href="tel:0908061843" className="font-bold text-indigo-700 underline">0908061843</a></p>
                    <p>• <strong>Email tiếp nhận chứng từ / video mở hộp:</strong> <a href="mailto:support@novashop.vn" className="font-bold text-indigo-700 underline">support@novashop.vn</a> | <a href="mailto:cskh@novashop.vn" className="font-bold text-indigo-700 underline">cskh@novashop.vn</a></p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                      <strong>ĐẠI DIỆN CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVASHOP VIỆT NAM</strong>
                      <p>Ban Quản Lý Chất Lượng & Chăm Sóc Khách Hàng Sàn TMĐT NovaShop.vn (Đã ký và đóng dấu)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabChange('shipping')}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition-colors self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Xem Chính Sách Vận Chuyển →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form đăng ký đổi trả trực tuyến */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Đăng Ký Yêu Cầu Đổi Trả / Hoàn Tiền Trực Tuyến</h3>
                  <p className="text-xs text-slate-500">
                    Điền mã đơn hàng và số điện thoại đã đặt hàng, bộ phận hỗ trợ khách hàng sẽ liên hệ lại ngay trong 15 phút để điều phối thu hồi tận nơi miễn phí.
                  </p>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold self-start">
                  Miễn phí thu hồi 2 chiều
                </span>
              </div>

              <form onSubmit={handleReturnSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Mã đơn hàng (Ví dụ: ORD-17901...)"
                  value={returnOrderId}
                  onChange={(e) => setReturnOrderId(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại người mua..."
                  value={returnPhone}
                  onChange={(e) => setReturnPhone(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="defective">Sản phẩm phát sinh lỗi kỹ thuật phần cứng (Đổi mới 1-1)</option>
                  <option value="wrong_item">Giao nhầm mã hàng / sai màu sắc / thiếu phụ kiện</option>
                  <option value="shipping_damage">Kiện hàng bị móp méo / hư hại trong vận chuyển</option>
                  <option value="refund_request">Yêu cầu trả hàng & hoàn tiền 100% qua ngân hàng</option>
                  <option value="change_mind">Muốn đổi nâng cấp lên dòng máy cao hơn</option>
                </select>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingReturn}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    {isSubmittingReturn ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu Thu Hồi & Đổi Trả'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CHÍNH SÁCH VẬN CHUYỂN (SHIPPING POLICY) ================= */}
        {activeTab === 'shipping' && (
          <div className="space-y-8 animate-fade-in">
            {/* Document Header */}
            <div className="border-b border-slate-200 pb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                  <Truck className="w-3.5 h-3.5" />
                  <span>CHÍNH SÁCH VẬN CHUYỂN, GIAO NHẬN & ĐỒNG KIỂM TOÀN QUỐC</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Cập nhật & Hiệu lực: Năm 2026 • Theo Luật Bưu chính & Nghị định 52/2013/NĐ-CP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
                CHÍNH SÁCH VẬN CHUYỂN VÀ GIAO NHẬN HÀNG HÓA WEBSITE TMĐT NOVASHOP.VN
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Chính sách vận chuyển này quy định chi tiết các phương thức giao nhận, biểu phí cước vận chuyển, danh mục hàng hóa hỗ trợ vận chuyển, tiêu chuẩn đóng gói chống sốc 3 lớp, quy định <strong>Đồng kiểm mở hộp 100%</strong> và trách nhiệm bồi thường rủi ro của các đơn vị vận chuyển trên nền tảng <strong>NovaShop.vn</strong>.
              </p>
            </div>

            {/* 3 Core Shipping Commitments */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Giao Hỏa Tốc Now 2H</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nhận hàng siêu tốc tận tay chỉ từ <strong>1 – 2 giờ</strong> kể từ khi xác nhận đơn hàng tại nội thành TP. Hồ Chí Minh và Hà Nội (bán kính ≤ 15km).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Freeship Toàn Quốc Từ 300K</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Miễn phí 100% cước vận chuyển tiêu chuẩn tới 63 tỉnh thành cho mọi đơn hàng có giá trị từ <strong>300.000₫</strong> trở lên.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Đồng Kiểm 100% & Bảo Hiểm Hàng</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Quyền mở kiện kiểm tra ngoại quan trước khi thanh toán. 100% đơn hàng được đóng gói chống sốc 3 lớp và mua bảo hiểm khai giá 100%.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Table of Contents (1 - 10) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Mục Lục Chính Sách Vận Chuyển (10 Điều Khoản Chính Thức)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                {[
                  { id: 'ship-1', num: '1.', title: 'Phạm vi & Đối tác vận chuyển' },
                  { id: 'ship-2', num: '2.', title: 'Phương thức & Thời gian giao' },
                  { id: 'ship-3', num: '3.', title: 'Biểu phí & Chính sách Freeship' },
                  { id: 'ship-4', num: '4.', title: 'Hàng hạn chế / Có điều kiện' },
                  { id: 'ship-5', num: '5.', title: 'Quy chuẩn đóng gói 3 lớp' },
                  { id: 'ship-6', num: '6.', title: 'Quy định Đồng kiểm mở hộp' },
                  { id: 'ship-7', num: '7.', title: 'Quy trình giao nhận & Giao lại' },
                  { id: 'ship-8', num: '8.', title: 'Trách nhiệm & Bồi thường ĐVVC' },
                  { id: 'ship-9', num: '9.', title: 'Quyền & Nghĩa vụ của các bên' },
                  { id: 'ship-10', num: '10.', title: 'Tra cứu vận đơn & Liên hệ' },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <span className="font-extrabold text-indigo-600 shrink-0">{item.num}</span>
                    <span className="truncate">{item.title}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* 10 Detailed Clauses */}
            <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {/* SECTION 1 */}
              <div id="ship-1" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">1</span>
                  <span>PHẠM VI ÁP DỤNG VÀ ĐỐI TÁC VẬN CHUYỂN LIÊN KẾT</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>1.1.</strong> Chính sách vận chuyển này quy định về quy trình tiếp nhận, đóng gói, điều phối giao hàng, kiểm hàng (đồng kiểm) và quyền, nghĩa vụ của Người Mua, Người Bán/Nhà phân phối cùng các Đơn vị cung cấp dịch vụ vận chuyển trên nền tảng <strong>NovaShop.vn</strong>.
                  </p>
                  <p>
                    <strong>1.2. Phạm vi giao hàng:</strong> NovaShop hỗ trợ giao hàng tận nơi trên phạm vi toàn quốc tới tất cả <strong>63 tỉnh, thành phố</strong> tại Việt Nam (bao gồm cả khu vực quận/huyện ngoại thành, xã/thị trấn và các tuyến huyện đảo có bưu cục kết nối).
                  </p>
                  <p>
                    <strong>1.3. Đối tác vận chuyển chiến lược:</strong> Để đảm bảo tốc độ giao nhận và độ an toàn cao nhất cho thiết bị công nghệ, NovaShop hợp tác trực tiếp qua hệ thống API vận đơn tự động cùng các đơn vị vận chuyển hàng đầu Việt Nam: <strong>Viettel Post, Giao Hàng Tiết Kiệm (GHTK), Giao Hàng Nhanh (GHN), SPX Express, J&amp;T Express, Ahamove và GrabExpress</strong>.
                  </p>
                </div>
              </div>

              {/* SECTION 2 */}
              <div id="ship-2" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">2</span>
                  <span>CÁC PHƯƠNG THỨC VẬN CHUYỂN VÀ THỜI GIAN TOÀN TRÌNH</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>2.1.</strong> Khi đặt hàng trên NovaShop.vn, Người Mua có thể tùy chọn một trong các phương thức vận chuyển phù hợp với nhu cầu nhận hàng:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Phương thức Giao Hỏa Tốc – Ưu Tiên (NovaSpeed Now 2H):</strong> Giao hàng siêu tốc bằng đội ngũ đối tác Ahamove / GrabExpress / Nhân viên giao nhận chuyên trách của NovaShop. Thời gian nhận hàng dự kiến chỉ từ <strong>1 – 2 giờ</strong> kể từ thời điểm đơn hàng được xác nhận thành công (áp dụng trong khung giờ từ 08:00 đến 20:00 tất cả các ngày trong tuần, kể cả Thứ Bảy &amp; Chủ Nhật tại nội thành TP. Hồ Chí Minh và Hà Nội trong bán kính 15km). Đơn đặt sau 19:30 sẽ được ưu tiên giao trước 09:30 sáng hôm sau.
                    </li>
                    <li>
                      <strong>Phương thức Giao Trong Ngày (Same-Day Delivery):</strong> Áp dụng cho các đơn hàng tại khu vực TP. Hồ Chí Minh, Hà Nội, Đà Nẵng, Cần Thơ đặt trước 14:00 sẽ được bàn giao tận tay Người Mua trước 21:00 cùng ngày.
                    </li>
                    <li>
                      <strong>Phương thức Giao Nhanh Tiêu Chuẩn Toàn Quốc:</strong> Điều phối qua mạng lưới Viettel Post / GHTK / GHN. Thời gian toàn trình dự kiến:
                      <ul className="list-circle pl-5 mt-1 space-y-1 text-slate-600">
                        <li>Khu vực trung tâm TP. Hồ Chí Minh, Hà Nội, Đà Nẵng và các tỉnh lân cận: <strong>1 – 2 ngày làm việc</strong>;</li>
                        <li>Khu vực thành phố/thị xã thuộc các tỉnh thành khác trên cả nước: <strong>2 – 3 ngày làm việc</strong>;</li>
                        <li>Khu vực huyện/xã vùng sâu, miền núi hoặc tuyến hải đảo: <strong>3 – 5 ngày làm việc</strong>.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Phương thức Giao Hàng Cồng Kềnh &amp; Lắp Đặt Kỹ Thuật Tận Nơi:</strong> Dành cho các sản phẩm có kích thước hoặc trọng lượng lớn (Màn hình đồ họa kích thước lớn, bộ PC Gaming, loa tháp công suất lớn, thiết bị gia dụng thông minh). Kỹ thuật viên NovaShop sẽ liên hệ hẹn giờ trước và hỗ trợ lắp đặt, hướng dẫn sử dụng trực tiếp tại địa chỉ của khách hàng.
                    </li>
                  </ul>
                </div>
              </div>

              {/* SECTION 3 */}
              <div id="ship-3" className="scroll-mt-28 space-y-4 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">3</span>
                  <span>BIỂU PHÍ VẬN CHUYỂN VÀ CHÍNH SÁCH MIỄN PHÍ GIAO HÀNG (FREESHIP)</span>
                </h3>
                <p>
                  <strong>3.1.</strong> Chi phí vận chuyển được tính toán tự động và hiển thị minh bạch ngay tại bước Thanh toán trước khi Người Mua nhấn xác nhận đặt hàng, cụ thể theo bảng biểu phí chuẩn dưới đây:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-2xl overflow-hidden tabular-nums">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Phương Thức Giao Hàng</th>
                        <th className="p-3.5">Khu Vực Áp Dụng</th>
                        <th className="p-3.5">Thời Gian Toàn Trình</th>
                        <th className="p-3.5">Cước Phí Tiêu Chuẩn</th>
                        <th className="p-3.5">Chính Sách Miễn Phí (Freeship)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-bold text-slate-900">Giao Hỏa Tốc Now 2H</td>
                        <td className="p-3.5">Nội thành TP.HCM &amp; Hà Nội (≤ 15km)</td>
                        <td className="p-3.5 font-bold text-blue-600">1 – 2 Giờ</td>
                        <td className="p-3.5">30.000₫ – 65.000₫</td>
                        <td className="p-3.5 font-bold text-emerald-600">Miễn phí 100% cho đơn từ 2.000.000₫</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-bold text-slate-900">Giao Nhanh Tiêu Chuẩn</td>
                        <td className="p-3.5">Toàn quốc (63 tỉnh, thành phố)</td>
                        <td className="p-3.5 font-semibold text-slate-800">1 – 3 Ngày làm việc</td>
                        <td className="p-3.5">Đồng giá 30.000₫</td>
                        <td className="p-3.5 font-bold text-emerald-600">Miễn phí 100% cho mọi đơn từ 300.000₫</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-bold text-slate-900">Giao Hàng Cồng Kềnh / Hẹn Giờ</td>
                        <td className="p-3.5">TP.HCM, Hà Nội, Đà Nẵng, Cần Thơ</td>
                        <td className="p-3.5">Theo khung giờ khách hẹn</td>
                        <td className="p-3.5">50.000₫</td>
                        <td className="p-3.5 font-bold text-emerald-600">Miễn phí 100% cho đơn từ 2.000.000₫</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-bold text-slate-900">Nhận Trực Tiếp Tại Showroom</td>
                        <td className="p-3.5">219/20 đường số 12, Q. Bình Tân, TP.HCM</td>
                        <td className="p-3.5 font-semibold text-indigo-600">Nhận ngay sau 15 phút</td>
                        <td className="p-3.5 font-bold text-emerald-600">0₫ (Miễn phí)</td>
                        <td className="p-3.5 font-bold text-emerald-600">Luôn miễn phí + Hỗ trợ cài đặt máy</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 4 */}
              <div id="ship-4" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">4</span>
                  <span>HÀNG HÓA KHÔNG HỖ TRỢ VẬN CHUYỂN VÀ VẬN CHUYỂN CÓ ĐIỀU KIỆN</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>4.1. Hàng hóa không hỗ trợ vận chuyển:</strong> Tuân thủ quy định của Luật Bưu chính và pháp luật Việt Nam, NovaShop và các Đơn vị vận chuyển tuyệt đối không nhận vận chuyển các mặt hàng thuộc danh mục cấm lưu thông, chất dễ cháy nổ, hóa chất độc hại, vũ khí, hàng hóa vi phạm quyền sở hữu trí tuệ (hàng giả, hàng nhái) hoặc hàng hóa không có đầy đủ hóa đơn chứng từ chứng minh nguồn gốc xuất xứ.
                  </p>
                  <p>
                    <strong>4.2. Hàng hóa vận chuyển có điều kiện (Thiết bị chứa Pin Lithium-ion &amp; Hàng giá trị cao):</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Quy định an toàn hàng không đối với Pin sạc dự phòng &amp; Thiết bị chứa pin dung lượng lớn:</strong> Theo quy định an toàn bay của Cục Hàng không Việt Nam, các kiện hàng là Pin sạc dự phòng (Power Bank), trạm sạc di động hoặc phụ kiện tích điện rời khi giao liên miền (ví dụ: TP.HCM đi Hà Nội/Miền Bắc) sẽ được điều phối vận chuyển bằng <strong>tuyến đường bộ chuyên dụng</strong> có dán nhãn cảnh báo an toàn pin Lithium. Thời gian toàn trình của tuyến đường bộ có thể cộng thêm từ <strong>1 – 2 ngày làm việc</strong> so với đường hàng không;</li>
                    <li><strong>Quy định vận chuyển đơn hàng giá trị đặc biệt cao (Trên 50.000.000 VNĐ):</strong> Đối với các đơn hàng thiết bị công nghệ cao cấp có tổng giá trị trên 50.000.000₫, NovaShop áp dụng quy trình <strong>Vận chuyển bảo đảm đặc biệt (Khai giá bảo hiểm 100%)</strong>, yêu cầu thanh toán trả trước (hoặc đặt cọc xác thực) và xác minh mã OTP chính chủ của Người Mua tại thời điểm ký nhận bàn giao.</li>
                  </ul>
                </div>
              </div>

              {/* SECTION 5 */}
              <div id="ship-5" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">5</span>
                  <span>QUY CHUẨN ĐÓNG GÓI HÀNG HÓA & NIÊM PHONG CHỐNG SỐC 3 LỚP</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>5.1.</strong> Để bảo vệ tuyệt đối các thiết bị điện tử nhạy cảm với va đập và độ ẩm, tất cả bưu kiện xuất kho tại NovaShop đều bắt buộc tuân thủ quy chuẩn đóng gói chống sốc 3 lớp nghiêm ngặt trước khi bàn giao cho Đơn vị vận chuyển:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Lớp 1 (Bảo vệ nguyên bản):</strong> Hộp sản phẩm nguyên seal của nhà sản xuất được bọc màng co PE chống ẩm, chống bụi bẩn;</li>
                    <li><strong>Lớp 2 (Giảm chấn đa chiều):</strong> Quấn tối thiểu 3 lớp màng xốp hơi (Bubble Wrap) hạt lớn quanh hộp sản phẩm, kết hợp chèn túi khí định hình (Air Cushion) hoặc mút xốp EPE lấp đầy toàn bộ khoảng trống ở cả 6 mặt;</li>
                    <li><strong>Lớp 3 (Hộp Carton chịu lực &amp; Niêm phong bảo mật):</strong> Đóng trong thùng carton 3 – 5 lớp sóng cứng chịu lực nén cao, dán kín bằng băng keo chuyên dụng có logo và <strong>Tem niêm phong bảo mật chống bóc mở (Tamper-Evident Security Seal)</strong> của NovaShop cùng nhãn cảnh báo <em>&ldquo;Hàng Điện Tử Dễ Vỡ – Giá Trị Cao – Xin Nhẹ Tay&rdquo;</em>.</li>
                  </ul>
                  <p>
                    <strong>5.2. Camera giám sát đóng gói 100%:</strong> Mọi bàn đóng gói tại trung tâm kho vận NovaShop đều được trang bị hệ thống camera độ phân giải cao ghi hình liên tục quá trình quét mã Serial/IMEI, kiểm tra ngoại quan hộp và dán tem niêm phong cho từng mã đơn hàng. Dữ liệu video được lưu trữ tối thiểu 60 ngày để phục vụ đối chiếu minh bạch khi cần thiết.
                  </p>
                </div>
              </div>

              {/* SECTION 6 */}
              <div id="ship-6" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">6</span>
                  <span>QUY ĐỊNH VỀ KIỂM HÀNG (ĐỒNG KIỂM) KHI NHẬN HÀNG</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>6.1. Quyền lợi Đồng kiểm 100% miễn phí:</strong> Nhằm mang lại sự an tâm tuyệt đối, NovaShop áp dụng chương trình <strong>Đồng kiểm (Kiểm tra hàng trước khi nhận và thanh toán)</strong> cho toàn bộ đơn hàng trên toàn quốc mà không thu thêm bất kỳ phụ phí nào.
                  </p>
                  <p>
                    <strong>6.2. Phạm vi và cách thức thực hiện Đồng kiểm cùng nhân viên giao nhận:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Khi nhận bưu kiện từ Shipper, Người Mua kiểm tra tình trạng bên ngoài của thùng carton và tem niêm phong bảo mật của NovaShop;</li>
                    <li>Người Mua có quyền yêu cầu Shipper chứng kiến việc cắt băng keo thùng carton bên ngoài để kiểm tra: <strong>(i) Đúng tên sản phẩm, đúng model, màu sắc, dung lượng bộ nhớ trên nhãn hộp; (ii) Đủ số lượng sản phẩm và quà tặng khuyến mãi đi kèm; (iii) Hộp sản phẩm bên trong còn nguyên lớp seal nilon của nhà sản xuất, không bị móp méo hay rách nát</strong>;</li>
                    <li><strong>Quy định bảo vệ Seal chính hãng khi đồng kiểm:</strong> Vì đặc thù thiết bị công nghệ chính hãng (Apple, Samsung, Sony, Xiaomi...), việc đồng kiểm trước khi thanh toán chỉ dừng ở bước kiểm tra ngoại quan hộp máy và thông số trên vỏ hộp. Người Mua <strong>không được xé lớp seal nilon chính hãng trên hộp sản phẩm, không mở hộp lấy máy ra dùng thử hoặc kích hoạt nguồn</strong> khi chưa hoàn tất thanh toán cho Shipper;</li>
                    <li>Sau khi thanh toán nhận hàng, Người Mua tiến hành mở seal hộp sản phẩm và <strong>bắt buộc nên quay video clip quá trình khui hộp liên tục, rõ nét số Serial/IMEI</strong> để được NovaShop bảo vệ quyền lợi Đổi mới 1-1 ngay lập tức nếu phát hiện lỗi bên trong hộp.</li>
                  </ul>
                  <p>
                    <strong>6.3. Quyền từ chối nhận hàng ngay khi đồng kiểm:</strong> Nếu trong quá trình đồng kiểm cùng Shipper, Người Mua phát hiện kiện hàng có dấu hiệu bị cậy mở, rách mất tem niêm phong, hộp máy bị biến dạng nặng hoặc giao sai mẫu mã đã đặt, Người Mua có toàn quyền <strong>từ chối nhận hàng ngay tại chỗ và không phải trả bất kỳ khoản phí vận chuyển nào</strong>.
                  </p>
                </div>
              </div>

              {/* SECTION 7 */}
              <div id="ship-7" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">7</span>
                  <span>QUY TRÌNH GIAO NHẬN, GIAO LẠI VÀ XỬ LÝ ĐƠN HÀNG KHÔNG THÀNH CÔNG</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>7.1. Thông báo trước khi giao hàng:</strong> Trước khi tiến hành phát hàng từ 15 – 30 phút, nhân viên giao nhận (Shipper) sẽ gọi điện thoại hoặc nhắn tin thông báo cho Người Mua theo số điện thoại đăng ký trên đơn hàng.
                  </p>
                  <p>
                    <strong>7.2. Hỗ trợ giao lại miễn phí tối đa 03 lần:</strong> Trường hợp Người Mua bận đột xuất hoặc chưa thể nhận hàng ở lần phát đầu tiên, Shipper sẽ hỗ trợ hẹn giờ giao lại miễn phí tối đa <strong>03 lần phát hàng</strong> trong vòng 72 giờ làm việc tiếp theo. Người Mua cũng có thể ủy quyền cho người thân, đồng nghiệp hoặc lễ tân tòa nhà nhận thay (vui lòng thông báo trước qua điện thoại với Shipper).
                  </p>
                  <p>
                    <strong>7.3. Xử lý đơn hàng chuyển hoàn:</strong> Nếu sau 03 lần liên hệ phát hàng không thành công hoặc số điện thoại không thể liên lạc được trong 03 ngày liên tiếp, đơn hàng sẽ được tạm chuyển hoàn về kho NovaShop. Đối với các đơn hàng đã thanh toán trả trước qua VietQR/Thẻ, bộ phận CSKH NovaShop sẽ chủ động liên hệ qua Email/SĐT để hỗ trợ giao lại lần mới hoặc hoàn trả 100% số tiền đơn hàng cho Người Mua.
                  </p>
                </div>
              </div>

              {/* SECTION 8 */}
              <div id="ship-8" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">8</span>
                  <span>TRÁCH NHIỆM CỦA ĐƠN VỊ VẬN CHUYỂN VÀ CHÍNH SÁCH BỒI THƯỜNG RỦI RO</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>8.1. Trách nhiệm của Đơn vị vận chuyển:</strong> Các đối tác vận chuyển liên kết (Viettel Post, GHTK, GHN, SPX Express, Ahamove, GrabExpress) chịu trách nhiệm tiếp nhận nguyên đai nguyên kiện từ kho NovaShop, vận chuyển an toàn, thực hiện đúng quy trình đồng kiểm và cung cấp đầy đủ chứng từ giao nhận điện tử (hình ảnh giao hàng thành công, chữ ký xác nhận hoặc nhật ký cuộc gọi).
                  </p>
                  <p>
                    <strong>8.2. Chính sách Bảo hiểm hàng hóa 100% và Đền bù tức thì cho Người Mua:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Tất cả các đơn hàng thiết bị công nghệ gửi đi từ NovaShop đều được mua <strong>Gói Bảo Hiểm Giá Trị Hàng Hóa (Khai giá 100% giá trị hóa đơn)</strong>;</li>
                    <li>Trong trường hợp xảy ra sự cố hy hữu như thất lạc bưu kiện, mất mát hoặc hư hỏng hàng hóa do lỗi của Đơn vị vận chuyển trong quá trình trung chuyển, <strong>NovaShop chịu trách nhiệm xử lý trực tiếp với Đơn vị vận chuyển và cam kết gửi bù ngay một sản phẩm mới 100% khác hoặc hoàn tiền 100% cho Người Mua trong vòng 24 giờ</strong> mà không để Người Mua phải chờ đợi thủ tục bồi thường của nhà vận chuyển;</li>
                    <li>Trường hợp phát sinh chậm trễ giao hàng quá thời gian cam kết do nguyên nhân từ phía Đơn vị vận chuyển, NovaShop sẽ thông báo kịp thời cho Người Mua, hỗ trợ hối thúc ưu tiên phát hàng hoặc tặng kèm <strong>Voucher xin lỗi trị giá từ 50.000₫ – 200.000₫</strong> vào tài khoản của Người Mua.</li>
                  </ul>
                </div>
              </div>

              {/* SECTION 9 */}
              <div id="ship-9" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">9</span>
                  <span>QUYỀN VÀ NGHĨA VỤ CỦA NGƯỜI MUA VÀ NGƯỜI BÁN KHI GIAO NHẬN</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">a) Quyền và nghĩa vụ của Người Mua:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>Cung cấp chính xác họ tên, địa chỉ giao nhận chi tiết và số điện thoại liên lạc đang hoạt động;</li>
                      <li>Được theo dõi hành trình vận đơn trực tuyến theo thời gian thực và thực hiện quyền đồng kiểm ngoại quan trước khi nhận;</li>
                      <li>Thanh toán đầy đủ giá trị đơn hàng (đối với đơn COD) và giữ lại biên nhận/hóa đơn điện tử để đối chiếu bảo hành.</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">b) Quyền và nghĩa vụ của NovaShop / Người Bán:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>Chuẩn bị đúng sản phẩm mới 100% chính hãng, đóng gói chống sốc 3 lớp có niêm phong và bàn giao đúng hạn cho nhà vận chuyển;</li>
                      <li>Gửi thông báo xác nhận đơn hàng, hóa đơn điện tử và mã vận đơn tự động trực tiếp trên ứng dụng;</li>
                      <li>Chịu trách nhiệm giải quyết triệt để mọi khiếu nại phát sinh trong khâu giao nhận nhằm bảo vệ quyền lợi Người Mua.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECTION 10 */}
              <div id="ship-10" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">10</span>
                  <span>TRA CỨU HÀNH TRÌNH ĐƠN HÀNG & ĐẦU MỐI HỖ TRỢ GIAO VẬN</span>
                </h3>
                <div className="space-y-3">
                  <p>
                    <strong>10.1.</strong> Người Mua có thể kiểm tra trạng thái xử lý và định vị lộ trình giao hàng bất kỳ lúc nào tại mục <strong>&ldquo;Đơn hàng của tôi&rdquo;</strong> trên thanh điều hướng NovaShop.vn hoặc qua email xác nhận đơn hàng tự động. Nếu cần thay đổi địa chỉ nhận hàng gấp hoặc hỗ trợ điều phối Shipper, vui lòng liên hệ:
                  </p>
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs sm:text-sm text-slate-800">
                    <div className="font-extrabold text-blue-950 uppercase">
                      TRUNG TÂM ĐIỀU PHỐI HẬU CẦN & GIAO VẬN NOVALOGISTICS — CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVASHOP VIỆT NAM
                    </div>
                    <p>• <strong>Kho trung tâm &amp; Điểm nhận hàng trực tiếp:</strong> 219/20 đường số 12, Phường Bình Hưng Hòa, Quận Bình Tân, Thành phố Hồ Chí Minh, Việt Nam</p>
                    <p>• <strong>Hotline Điều phối Giao vận &amp; Hỏa tốc 2H (Miễn phí):</strong> <a href="tel:0908061843" className="font-bold text-blue-700 underline">0908061843</a> (Hoạt động 08:00 – 22:00 tất cả các ngày)</p>
                    <p>• <strong>Email hỗ trợ vận đơn &amp; đồng kiểm:</strong> <a href="mailto:support@novashop.vn" className="font-bold text-blue-700 underline">support@novashop.vn</a></p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                      <strong>ĐẠI DIỆN CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVASHOP VIỆT NAM</strong>
                      <p>Ban Điều Phối Vận Hành &amp; Giao Nhận Sàn Giao Dịch TMĐT NovaShop.vn (Đã ký và đóng dấu)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabChange('return')}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition-colors self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Xem Chính Sách Trả Hàng &amp; Hoàn Tiền →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: CHÍNH SÁCH BẢO MẬT (PRIVACY POLICY - ARTICLE 77244) ================= */}
        {activeTab === 'security' && (
          <div className="space-y-8 animate-fade-in">
            {/* Document Header */}
            <div className="border-b border-slate-200 pb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>CHÍNH SÁCH BẢO MẬT DỮ LIỆU CÁ NHÂN & AN TOÀN THÔNG TIN</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Cập nhật & Hiệu lực: Năm 2026 • Theo Nghị định 13/2023/NĐ-CP & 52/2013/NĐ-CP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
                CHÍNH SÁCH BẢO MẬT WEBSITE THƯƠNG MẠI ĐIỆN TỬ NOVASHOP.VN
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Chính sách bảo mật này mô tả cách thức <strong>Công ty Cổ phần Công nghệ NovaShop Việt Nam</strong> thu thập, sử dụng, tiết lộ, lưu trữ và bảo vệ dữ liệu cá nhân của Người dùng trên nền tảng <strong>NovaShop.vn</strong> theo đúng quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân và tiêu chuẩn bảo mật thanh toán quốc tế <strong>SSL 256-Bit / PCI-DSS Level 1</strong>.
              </p>
            </div>

            {/* Technical Security Highlights Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs sm:text-sm">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Mã Hóa Đường Truyền SSL 256-Bit</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mọi luồng dữ liệu truyền tải giữa thiết bị của bạn và máy chủ NovaShop đều được mã hóa bằng chứng chỉ số SSL/TLS an toàn cao cấp.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Chuẩn PCI-DSS Level 1 & 3D-Secure 2.0</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Không lưu trữ mã CVV/CVC. Giao dịch thẻ quốc tế và VietQR Napas247 được xác thực đa lớp trực tiếp qua cổng thanh toán ngân hàng.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs sm:text-sm">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Tuân Thủ Nghị Định 13/2023/NĐ-CP</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tôn trọng quyền của chủ thể dữ liệu: quyền được biết, đồng ý, truy cập, chỉnh sửa, rút lại sự đồng ý và yêu cầu xóa dữ liệu cá nhân.
                </p>
              </div>
            </div>

            {/* Quick Table of Contents (1 - 16) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Mục Lục Chính Sách Bảo Mật (16 Điều Khoản Chính Thức)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'priv-1', num: '1.', title: 'Giới thiệu chung' },
                  { id: 'priv-2', num: '2.', title: 'Khi nào thu thập dữ liệu cá nhân?' },
                  { id: 'priv-3', num: '3.', title: 'Thu thập những dữ liệu gì?' },
                  { id: 'priv-4', num: '4.', title: 'Tài khoản và Mật khẩu' },
                  { id: 'priv-5', num: '5.', title: 'Chính sách sử dụng Cookies' },
                  { id: 'priv-6', num: '6.', title: 'Mục đích sử dụng thông tin' },
                  { id: 'priv-7', num: '7.', title: 'Bảo vệ và lưu trữ thông tin' },
                  { id: 'priv-8', num: '8.', title: 'Tiết lộ thông tin cho bên thứ ba' },
                  { id: 'priv-9', num: '9.', title: 'Thông tin về trẻ em' },
                  { id: 'priv-10', num: '10.', title: 'Thông tin thu thập bởi bên thứ ba' },
                  { id: 'priv-11', num: '11.', title: 'Loại trừ trách nhiệm bảo mật' },
                  { id: 'priv-12', num: '12.', title: 'Chuyển dữ liệu ra nước ngoài' },
                  { id: 'priv-13', num: '13.', title: 'Rút lại sự đồng ý & Xóa dữ liệu' },
                  { id: 'priv-14', num: '14.', title: 'Cập nhật / Sửa đổi dữ liệu cá nhân' },
                  { id: 'priv-15', num: '15.', title: 'Thắc mắc, Khiếu nại & Liên hệ DPO' },
                  { id: 'priv-16', num: '16.', title: 'Điều khoản và Điều kiện chung' },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <span className="font-extrabold text-indigo-600 shrink-0">{item.num}</span>
                    <span className="truncate">{item.title}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* 16 Sections Content */}
            <div className="space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {/* SECTION 1 */}
              <div id="priv-1" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">1</span>
                  <span>GIỚI THIỆU</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>1.1.</strong> Chào mừng bạn đến với nền tảng thương mại điện tử <strong>NovaShop.vn</strong> (bao gồm website và ứng dụng di động NovaShop) được vận hành bởi <strong>Công ty Cổ phần Công nghệ NovaShop Việt Nam</strong> và các đơn vị liên kết (gọi riêng và gọi chung là &ldquo;NovaShop&rdquo;, &ldquo;chúng tôi&rdquo;, hay &ldquo;của chúng tôi&rdquo;). NovaShop nghiêm túc thực hiện trách nhiệm của mình liên quan đến bảo mật thông tin theo các quy định về bảo vệ bí mật thông tin cá nhân của pháp luật Việt Nam (bao gồm Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân, Nghị định số 52/2013/NĐ-CP và Luật Bảo vệ quyền lợi người tiêu dùng) (&ldquo;Luật riêng tư&rdquo;) và cam kết tôn trọng quyền riêng tư và sự quan tâm của tất cả người dùng đối với Nền tảng và các dịch vụ của chúng tôi (&ldquo;Các Dịch Vụ&rdquo;).
                  </p>
                  <p>
                    <strong>1.2.</strong> &ldquo;Dữ Liệu Cá Nhân&rdquo; hay &ldquo;dữ liệu cá nhân&rdquo; có nghĩa là dữ liệu, dù đúng hay không, về một cá nhân mà thông qua đó có thể xác định được danh tính, hoặc từ dữ liệu đó và thông tin khác mà một tổ chức có hoặc có khả năng tiếp cận. Các ví dụ thường gặp về dữ liệu cá nhân có thể bao gồm họ tên, số định danh cá nhân (CCCD/CMND), địa chỉ nhận hàng, số điện thoại, địa chỉ thư điện tử (email) và thông tin giao dịch thanh toán.
                  </p>
                  <p>
                    <strong>1.3.</strong> Bằng việc sử dụng Các Dịch Vụ, đăng ký một tài khoản với chúng tôi, truy cập Nền tảng của chúng tôi, hoặc đặt mua sản phẩm trên NovaShop.vn, bạn xác nhận và đồng ý rằng bạn chấp nhận các phương pháp, yêu cầu, và/hoặc chính sách được mô tả trong Chính sách bảo mật này, và theo đây bạn xác nhận bạn đã biết rõ và đồng ý toàn bộ cho phép chúng tôi thu thập, sử dụng, tiết lộ và/hoặc xử lý dữ liệu cá nhân của bạn như đã mô tả trong đây. <strong>NẾU BẠN KHÔNG ĐỒNG Ý CHO PHÉP XỬ LÝ DỮ LIỆU CÁ NHÂN CỦA BẠN NHƯ MÔ TẢ TRONG CHÍNH SÁCH NÀY, VUI LÒNG KHÔNG SỬ DỤNG CÁC DỊCH VỤ CỦA CHÚNG TÔI HAY TRUY CẬP NỀN TẢNG CỦA CHÚNG TÔI.</strong>
                  </p>
                  <p>
                    <strong>1.4.</strong> Chính sách bảo mật này áp dụng chung cho tất cả Người mua, Thành viên và Đối tác cung ứng đang sử dụng Dịch vụ của NovaShop, trừ khi có tuyên bố rõ ràng ngược lại.
                  </p>
                </div>
              </div>

              {/* SECTION 2 */}
              <div id="priv-2" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">2</span>
                  <span>KHI NÀO NOVASHOP SẼ THU THẬP DỮ LIỆU CÁ NHÂN?</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>2.1.</strong> Chúng tôi sẽ/có thể thu thập dữ liệu cá nhân về bạn vào các thời điểm sau đây:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Khi bạn đăng ký và/hoặc sử dụng Các Dịch Vụ hoặc Nền tảng của chúng tôi, hoặc mở một tài khoản thành viên với chúng tôi;</li>
                    <li>Khi bạn gửi bất kỳ biểu mẫu nào, bao gồm đơn đặt hàng, phiếu đăng ký bảo hành điện tử IMEI/Serial, yêu cầu đổi trả 1-1 hoặc các mẫu đơn khác liên quan đến bất kỳ sản phẩm và dịch vụ nào của chúng tôi, bằng hình thức trực tuyến hay dưới hình thức văn bản;</li>
                    <li>Khi bạn ký kết bất kỳ thỏa thuận nào hoặc cung cấp các tài liệu hoặc thông tin khác liên quan đến tương tác giữa bạn với chúng tôi, hoặc khi bạn sử dụng các sản phẩm và dịch vụ của chúng tôi;</li>
                    <li>Khi bạn tương tác với chúng tôi, chẳng hạn như thông qua các cuộc gọi điện thoại tới tổng đài <strong>0908061843</strong> (có thể được ghi âm để nâng cao chất lượng dịch vụ), thư từ, gặp gỡ trực tiếp tại trung tâm, các nền tảng truyền thông xã hội và email;</li>
                    <li>Khi bạn sử dụng các dịch vụ điện tử của chúng tôi, hoặc tương tác với chúng tôi qua Nền tảng hoặc Trang Web của chúng tôi, bao gồm thông qua tập tin cookie mà chúng tôi có thể triển khai khi bạn tương tác với Nền tảng;</li>
                    <li>Khi bạn cấp quyền trên thiết bị của bạn để chia sẻ thông tin (như vị trí địa lý hoặc hình ảnh/camera) với ứng dụng hoặc Nền tảng của chúng tôi;</li>
                    <li>Khi bạn liên kết tài khoản NovaShop với tài khoản mạng xã hội (Google, Facebook, Apple ID, Zalo) hoặc sử dụng các tính năng mạng xã hội khác phù hợp với chính sách của nhà cung cấp;</li>
                    <li>Khi bạn thực hiện các giao dịch thông qua Dịch vụ của chúng tôi (đặt hàng, thanh toán VietQR Napas247, thẻ quốc tế Visa/MasterCard/JCB, ví điện tử MoMo/VNPay, đăng ký trả góp 0%);</li>
                    <li>Khi bạn cung cấp ý kiến đánh giá sản phẩm, phản hồi hoặc gửi khiếu nại cho chúng tôi;</li>
                    <li>Khi bạn đăng ký tham gia chương trình khuyến mãi Flash Sale, vòng quay may mắn, tích điểm NovaPoints hoặc sự kiện tri ân khách hàng;</li>
                    <li>Khi bạn gửi dữ liệu cá nhân của bạn cho chúng tôi vì bất kỳ lý do hợp pháp nào khác.</li>
                  </ul>
                  <p>
                    <strong>2.2.</strong> Các trường hợp trên không nhằm mục đích liệt kê đầy đủ các trường hợp và chỉ đưa ra một số trường hợp phổ biến về thời điểm dữ liệu cá nhân của bạn có thể bị thu thập.
                  </p>
                  <p>
                    <strong>2.3.</strong> Trong một số trường hợp, bạn có thể cung cấp dữ liệu cá nhân của các cá nhân khác cho chúng tôi (ví dụ: người thân, bạn bè hoặc người nhận hàng thay). Nếu bạn cung cấp cho chúng tôi dữ liệu cá nhân của họ, bạn tuyên bố và đảm bảo rằng bạn đã nhận được sự đồng ý hợp pháp của họ để xử lý dữ liệu cá nhân theo Chính sách này.
                  </p>
                </div>
              </div>

              {/* SECTION 3 */}
              <div id="priv-3" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">3</span>
                  <span>NOVASHOP SẼ THU THẬP NHỮNG DỮ LIỆU GÌ?</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>3.1.</strong> Tùy thuộc vào quy định của Luật riêng tư (Nghị định 13/2023/NĐ-CP), dữ liệu cá nhân mà NovaShop có thể thu thập bao gồm dữ liệu cá nhân cơ bản và dữ liệu cá nhân nhạy cảm (khi cần thiết để thực hiện giao dịch thanh toán hoặc xác minh danh tính), bao gồm nhưng không giới hạn ở:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">a) Nhóm dữ liệu định danh & Liên hệ cơ bản:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-xs">
                        <li>Họ và tên, ngày tháng năm sinh, giới tính;</li>
                        <li>Địa chỉ email và số điện thoại liên lạc;</li>
                        <li>Địa chỉ thanh toán và địa chỉ giao nhận hàng hóa chi tiết;</li>
                        <li>Mã số thuế doanh nghiệp / Thông tin xuất hóa đơn điện tử VAT;</li>
                        <li>Hình ảnh, âm thanh hoặc video (ví dụ: video đồng kiểm mở hộp hoặc ảnh chụp tình trạng thiết bị khi yêu cầu bảo hành/đổi trả).</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">b) Nhóm dữ liệu giao dịch & Thiết bị kỹ thuật:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-xs">
                        <li>Thông tin thanh toán ngân hàng, lịch sử đối soát VietQR Napas247 (NovaShop tuyệt đối không lưu mã bảo mật thẻ CVV/CVC);</li>
                        <li>Thông tin về định danh do cơ quan nhà nước cấp (CCCD gắn chip) khi khách hàng đăng ký hồ sơ mua trả góp hoặc xác minh chống gian lận;</li>
                        <li>Thông tin thiết bị truy cập (địa chỉ IP, loại trình duyệt, hệ điều hành, mã thiết bị, dữ liệu vị trí địa lý khi cấp quyền);</li>
                        <li>Lịch sử tìm kiếm, sản phẩm đã xem, giỏ hàng và tương tác trên Nền tảng.</li>
                      </ul>
                    </div>
                  </div>
                  <p>
                    <strong>3.2.</strong> Bạn đồng ý không cung cấp cho chúng tôi bất cứ thông tin nào không chính xác hoặc gây hiểu nhầm và bạn đồng ý sẽ thông báo cho chúng tôi về bất cứ thông tin nào không chính xác hoặc khi có sự thay đổi thông tin. Chúng tôi bảo lưu quyền yêu cầu các tài liệu cần thiết khác để xác minh bất cứ thông tin nào do bạn cung cấp.
                  </p>
                  <p>
                    <strong>3.3.</strong> Nếu bạn đăng nhập để trở thành Người sử dụng Nền tảng của chúng tôi bằng Tài khoản Mạng Xã hội (Google, Facebook...) hoặc liên kết tài khoản của bạn, chúng tôi có quyền truy cập thông tin mà bạn đã tự nguyện cung cấp cho nhà cung cấp dịch vụ đó và sẽ quản lý, sử dụng các dữ liệu cá nhân này theo đúng quy định tại Chính sách này tại mọi thời điểm.
                  </p>
                </div>
              </div>

              {/* SECTION 4 */}
              <div id="priv-4" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">4</span>
                  <span>TÀI KHOẢN VÀ MẬT KHẨU</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>4.1.</strong> Để sử dụng đầy đủ các tính năng đặt hàng, theo dõi vận đơn, tích điểm NovaPoints và quản lý bảo hành điện tử trên Nền tảng, bạn cần tạo một tài khoản người dùng bao gồm tên đăng nhập (email/số điện thoại) và mật khẩu bảo mật.
                  </p>
                  <p>
                    <strong>4.2.</strong> Bạn hoàn toàn chịu trách nhiệm giữ bí mật mật khẩu, mã xác thực một lần (OTP) và thông tin tài khoản của mình. Chúng tôi khuyến nghị bạn thiết lập mật khẩu mạnh (tối thiểu 8 ký tự bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt) và kích hoạt <strong>Xác thực hai yếu tố (2FA)</strong>.
                  </p>
                  <p>
                    <strong>4.3.</strong> Nhân viên của NovaShop hoặc đơn vị vận chuyển <strong>không bao giờ</strong> yêu cầu bạn cung cấp mật khẩu tài khoản, mã OTP ngân hàng hoặc mã CVV/CVC dưới bất kỳ hình thức nào. Nếu dùng chung thiết bị với người khác, bạn cần đăng xuất khỏi tài khoản sau mỗi phiên sử dụng.
                  </p>
                </div>
              </div>

              {/* SECTION 5 */}
              <div id="priv-5" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">5</span>
                  <span>COOKIES VÀ CÔNG NGHỆ THEO DÕI TƯƠNG TỰ</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>5.1.</strong> Đôi khi chúng tôi hoặc các nhà cung cấp dịch vụ được cho phép và các đối tác quảng cáo của chúng tôi có thể sử dụng &ldquo;cookie&rdquo;, bộ nhớ cục bộ (LocalStorage) hoặc các tính năng tương tự để cho phép chúng tôi hoặc các bên thứ ba thu thập hoặc chia sẻ thông tin liên quan đến việc sử dụng của bạn đối với Dịch vụ hoặc Nền tảng của chúng tôi.
                  </p>
                  <p>
                    <strong>5.2.</strong> Các tính năng này giúp chúng tôi cải thiện Nền tảng và Các Dịch Vụ chúng tôi cung cấp, bao gồm:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Vận hành thiết yếu:</strong> Duy trì phiên đăng nhập an toàn, lưu giữ các sản phẩm trong giỏ hàng, danh sách yêu thích, so sánh cấu hình thiết bị và ghi nhớ tùy chọn giao diện (Chế độ Sáng/Tối);</li>
                    <li><strong>Hiệu suất & Phân tích:</strong> Đo lường tốc độ tải trang, thống kê lưu lượng truy cập ẩn danh nhằm nâng cấp trải nghiệm người dùng;</li>
                    <li><strong>Cá nhân hóa:</strong> Đề xuất các thiết bị công nghệ, phụ kiện tương thích và mã giảm giá phù hợp với nhu cầu tìm kiếm của bạn.</li>
                  </ul>
                  <p>
                    <strong>5.3.</strong> &ldquo;Cookie&rdquo; là các tệp định danh nhỏ được lưu trữ trên máy tính hoặc thiết bị di động của bạn nhằm ghi nhận thông tin kỹ thuật về cách thức và thời điểm Các Dịch Vụ hoặc Nền tảng được truy cập. Thời gian lưu trữ cookie có thể dao động từ phiên làm việc hiện tại đến tối đa 30 ngày trên trình duyệt web.
                  </p>
                  <p>
                    <strong>5.4.</strong> Bạn có thể từ chối hoặc xóa cookie bằng cách điều chỉnh cài đặt trên trình duyệt của bạn. Tuy nhiên, vui lòng lưu ý rằng nếu bạn vô hiệu hóa hoàn toàn cookie, một số chức năng như lưu giỏ hàng tự động hoặc thanh toán nhanh có thể không hoạt động đầy đủ.
                  </p>
                </div>
              </div>

              {/* SECTION 6 */}
              <div id="priv-6" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">6</span>
                  <span>CHÚNG TÔI SỬ DỤNG THÔNG TIN BẠN CUNG CẤP CHO CHÚNG TÔI NHƯ THẾ NÀO?</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>6.1.</strong> Chúng tôi có thể thu thập, sử dụng, tiết lộ và/hoặc xử lý dữ liệu cá nhân của bạn cho một hoặc nhiều mục đích sau đây (&ldquo;Mục Đích&rdquo;):
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Xem xét, xác nhận và xử lý đơn đặt hàng, giao dịch thanh toán của bạn trên Nền tảng NovaShop.vn;</li>
                    <li>Quản lý, điều hành, cung cấp và quản trị việc bạn sử dụng và truy cập Các Dịch Vụ và Nền tảng của chúng tôi;</li>
                    <li>Điều phối giao nhận hàng hóa (Giao Hỏa Tốc Now 2H, Giao nhanh toàn quốc), thực hiện quy trình đồng kiểm minh bạch và gửi thông báo hành trình đơn hàng theo thời gian thực;</li>
                    <li>Kích hoạt và tra cứu thời hạn <strong>Bảo hành điện tử chính hãng (12 – 24 tháng)</strong> theo số Serial/IMEI, tiếp nhận và xử lý yêu cầu <strong>Đổi mới 1-1 trong 30 ngày</strong> và hoàn tiền;</li>
                    <li>Xử lý đối soát thanh toán tự động qua mã QR <strong>VietQR Napas247</strong>, cổng thẻ quốc tế <strong>3D-Secure 2.0</strong>, ví điện tử và xét duyệt hồ sơ trả góp 0% lãi suất;</li>
                    <li>Phát hành và gửi hóa đơn điện tử giá trị gia tăng (VAT) hợp lệ về địa chỉ email chính chủ của khách hàng;</li>
                    <li>Giải đáp các thắc mắc, phản hồi, khiếu nại hoặc tranh chấp từ bạn thông qua tổng đài Chăm sóc khách hàng <strong>0908061843</strong>;</li>
                    <li>Nhận dạng, xác minh danh tính, đánh giá pháp lý và phòng chống các hành vi gian lận thương mại, giả mạo thanh toán hoặc tấn công mạng;</li>
                    <li>Tiến hành các hoạt động nghiên cứu, phân tích dữ liệu và khảo sát chất lượng dịch vụ nhằm cải tiến sản phẩm và giao diện Nền tảng;</li>
                    <li>Gửi thông báo về các chương trình khuyến mãi, Flash Sale, ưu đãi Voucher và điểm thưởng NovaPoints (khi bạn đã đồng ý đăng ký nhận thông tin tiếp thị và bạn có thể hủy đăng ký bất kỳ lúc nào);</li>
                    <li>Thực hiện các nghĩa vụ báo cáo, kiểm toán, kế toán và tuân thủ các yêu cầu hợp pháp của cơ quan nhà nước có thẩm quyền theo quy định pháp luật Việt Nam.</li>
                  </ul>
                  <p>
                    <strong>6.2.</strong> Vì các Mục Đích mà chúng tôi sẽ/có thể thu thập, sử dụng, tiết lộ hoặc xử lý dữ liệu cá nhân của bạn phụ thuộc vào hoàn cảnh hiện có, mục đích đó có thể không xuất hiện bên trên. Tuy nhiên, chúng tôi sẽ thông báo cho bạn biết mục đích khác đó tại thời điểm xin sự cho phép của bạn, trừ khi việc xử lý dữ liệu áp dụng mà không có sự đồng ý của bạn được phép theo các quy định của Luật riêng tư.
                  </p>
                </div>
              </div>

              {/* SECTION 7 */}
              <div id="priv-7" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">7</span>
                  <span>NOVASHOP BẢO VỆ VÀ LƯU TRỮ THÔNG TIN KHÁCH HÀNG BẰNG CÁCH NÀO?</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>7.1.</strong> Chúng tôi thực hiện các biện pháp bảo mật kỹ thuật và quản trị nghiêm ngặt để đảm bảo sự an toàn của dữ liệu cá nhân của bạn trên các hệ thống của chúng tôi. Dữ liệu cá nhân của người dùng được lưu trữ đằng sau các mạng bảo mật (Tường lửa ứng dụng web WAF, hệ thống phát hiện và ngăn chặn xâm nhập IDS/IPS) và chỉ có thể được truy cập bởi một số nhân viên có thẩm quyền đặc biệt đến các hệ thống của chúng tôi và được yêu cầu bảo mật tuyệt đối thông tin đó.
                  </p>
                  <p>
                    <strong>7.2.</strong> Toàn bộ thông tin giao dịch và thanh toán trực tuyến trên NovaShop.vn được bảo vệ bởi giao thức mã hóa <strong>SSL 256-Bit (Transport Layer Security)</strong>, xác thực hai lớp <strong>3D-Secure 2.0 (Verified by Visa / MasterCard Identity Check)</strong> và tuân thủ tiêu chuẩn <strong>PCI-DSS Level 1</strong>.
                  </p>
                  <p>
                    <strong>7.3.</strong> Chúng tôi sẽ duy trì dữ liệu cá nhân tuân theo các quy định của pháp luật về bảo vệ bí mật thông tin cá nhân và/hoặc các điều luật hiện hành khác (tối thiểu <strong>10 năm</strong> đối với chứng từ kế toán, hóa đơn điện tử và lịch sử giao dịch theo Luật Kế toán và Nghị định 52/2013/NĐ-CP). Chúng tôi sẽ hủy hoặc xóa thông tin nhận dạng ra khỏi dữ liệu cá nhân của bạn khi chúng tôi có lý do hợp lý để xác định rằng: (i) việc lưu giữ dữ liệu cá nhân đó không còn phục vụ mục đích thu thập dữ liệu cá nhân đó nữa; (ii) việc lưu giữ không còn cần thiết cho bất kỳ mục đích hợp pháp hay mục đích kinh doanh nào và (iii) không còn các lợi ích hợp pháp nào khác để tiếp tục lưu giữ các dữ liệu cá nhân này.
                  </p>
                  <p>
                    <strong>7.4.</strong> Nếu bạn ngưng sử dụng Nền tảng của chúng tôi, hoặc quyền của bạn được sử dụng Nền tảng và/hoặc Các Dịch Vụ bị chấm dứt hoặc hủy bỏ, chúng tôi có thể tiếp tục lưu, sử dụng và/hoặc tiết lộ dữ liệu cá nhân của bạn tuân theo Chính sách bảo mật này và các nghĩa vụ của chúng tôi theo các quy định của pháp luật về bảo vệ bí mật thông tin cá nhân.
                  </p>
                </div>
              </div>

              {/* SECTION 8 */}
              <div id="priv-8" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">8</span>
                  <span>NOVASHOP SẼ TIẾT LỘ THÔNG TIN CỦA BẠN KHÔNG?</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>8.1.</strong> Trong quá trình thực hiện hoạt động kinh doanh, chúng tôi sẽ/có thể cần phải sử dụng, xử lý, tiết lộ và/hoặc chuyển giao dữ liệu cá nhân của bạn cho các nhà cung cấp dịch vụ bên thứ ba, đại lý và/hoặc các công ty liên kết của chúng tôi chỉ trong phạm vi cần thiết để thực hiện một hay nhiều Mục Đích nói trên, bao gồm:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Đối tác vận chuyển và giao nhận bưu chính:</strong> Viettel Post, Giao Hàng Tiết Kiệm (GHTK), Giao Hàng Nhanh (GHN), Ahamove để thực hiện giao hàng tận nơi và đồng kiểm (chỉ cung cấp họ tên, số điện thoại nhận hàng, địa chỉ giao nhận và mã đơn hàng);</li>
                    <li><strong>Tổ chức tài chính, ngân hàng và cổng thanh toán:</strong> Công ty Cổ phần Thanh toán Quốc gia Việt Nam (Napas - VietQR), các ngân hàng thương mại (BIDV, Vietcombank, Techcombank, MB Bank, VPBank...), tổ chức thẻ quốc tế (Visa, MasterCard, JCB) và ví điện tử (MoMo, VNPay) để xác thực và hoàn tất giao dịch thanh toán/trả góp;</li>
                    <li><strong>Trung tâm bảo hành ủy quyền chính hãng:</strong> Apple, Samsung, Sony, Xiaomi, Dell, Asus, Anker, Logitech... để kích hoạt và đối chiếu bảo hành điện tử chính hãng theo số Serial/IMEI;</li>
                    <li><strong>Cơ quan nhà nước có thẩm quyền:</strong> Cục Thương mại điện tử và Kinh tế số (Bộ Công Thương), cơ quan Thuế, cơ quan Công an hoặc Tòa án khi có yêu cầu hợp pháp bằng văn bản theo quy định pháp luật Việt Nam.</li>
                  </ul>
                  <p>
                    <strong>8.2.</strong> Chúng tôi yêu cầu tất cả các bên thứ ba tiếp nhận dữ liệu phải ký kết Thỏa thuận bảo mật thông tin (NDA) và cam kết đảm bảo an toàn cho dữ liệu cá nhân của bạn, tuyệt đối không được sử dụng thông tin của Người mua ngoài mục đích thực hiện đơn hàng.
                  </p>
                  <p>
                    <strong>8.3.</strong> Ngoài các trường hợp nêu tại Mục 8.1, NovaShop cam kết <strong>tuyệt đối không bán, trao đổi hoặc chia sẻ</strong> thông tin cá nhân của khách hàng cho bất kỳ bên thứ ba nào vì mục đích quảng cáo hay thương mại.
                  </p>
                </div>
              </div>

              {/* SECTION 9 */}
              <div id="priv-9" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">9</span>
                  <span>THÔNG TIN VỀ TRẺ EM</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>9.1.</strong> Các Dịch Vụ này không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố tình thu thập hay lưu giữ bất kỳ dữ liệu cá nhân hay thông tin không nhận dạng cá nhân nào của bất kỳ ai dưới 13 tuổi, bất kỳ phần nào của Nền tảng của chúng tôi hoặc Các Dịch Vụ khác cũng không hướng tới trẻ em dưới 13 tuổi.
                  </p>
                  <p>
                    <strong>9.2.</strong> Cha/mẹ hoặc người giám hộ hợp pháp của trẻ em dưới 13 tuổi vui lòng giám sát và đảm bảo trẻ em dưới 13 tuổi mà mình đang giám hộ không tự ý đăng tải hoặc cung cấp thông tin cá nhân cho NovaShop. Trong trường hợp thông tin cá nhân của trẻ em dưới 13 tuổi hoặc từ 7 tuổi đến dưới 16 tuổi được cung cấp cho NovaShop để phục vụ giao dịch, cha/mẹ hoặc người giám hộ hợp pháp xác nhận đồng ý với việc xử lý thông tin của trẻ em có liên quan theo Nghị định 13/2023/NĐ-CP và đồng ý chịu sự điều chỉnh của Chính sách này thay mặt cho người được giám hộ.
                  </p>
                  <p>
                    <strong>9.3.</strong> Chúng tôi sẽ khóa bất kỳ tài khoản nào chỉ được sử dụng bởi đối tượng trẻ em dưới 13 tuổi mà không có sự đồng ý của cha/mẹ hoặc người giám hộ và sẽ gỡ và/hoặc xóa bất kỳ dữ liệu cá nhân nào mà chúng tôi xác định là đã được gửi bởi trẻ em dưới 13 tuổi mà không có sự đồng ý hợp lệ.
                  </p>
                </div>
              </div>

              {/* SECTION 10 */}
              <div id="priv-10" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">10</span>
                  <span>THÔNG TIN THU THẬP BỞI CÁC BÊN THỨ BA</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>10.1.</strong> Nền tảng của chúng tôi có thể sử dụng Google Analytics, một dịch vụ phân tích web được cung cấp bởi Google, Inc. (&ldquo;Google&rdquo;). Google Analytics sử dụng cookie để giúp Nền tảng phân tích cách người dùng tương tác với trang web nhằm cải thiện tốc độ phản hồi và trải nghiệm mua sắm.
                  </p>
                  <p>
                    <strong>10.2.</strong> Đôi khi chúng tôi và/hoặc đối tác có thể cung cấp các tính năng hoặc liên kết dẫn tới ứng dụng/trang web của bên thứ ba (ví dụ: cổng xác thực ngân hàng, bản đồ định vị Google Maps, trang kiểm tra vận đơn hoặc trang tra cứu bảo hành chính hãng của Apple/Samsung). Các sản phẩm hoặc dịch vụ của bên thứ ba đó không thuộc quyền sở hữu hay kiểm soát của NovaShop, và chúng tôi khuyến nghị bạn đọc kỹ điều khoản dịch vụ và chính sách bảo mật của các bên thứ ba đó trước khi cung cấp thông tin cho họ.
                  </p>
                </div>
              </div>

              {/* SECTION 11 */}
              <div id="priv-11" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">11</span>
                  <span>LOẠI TRỪ TRÁCH NHIỆM VỀ NGHĨA VỤ BẢO MẬT VÀ CÁC TRANG WEB BÊN THỨ BA</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>11.1.</strong> <strong>CHÚNG TÔI KHÔNG ĐẢM BẢO TÍNH BẢO MẬT ĐỐI VỚI DỮ LIỆU CÁ NHÂN VÀ/HOẶC THÔNG TIN KHÁC MÀ BẠN TỰ Ý CUNG CẤP TRÊN CÁC TRANG WEB CỦA BÊN THỨ BA.</strong> Mặc dù chúng tôi áp dụng các biện pháp bảo mật kỹ thuật cao nhất để duy trì sự an toàn của dữ liệu cá nhân của bạn trên NovaShop.vn, NovaShop không chịu trách nhiệm đối với các thiệt hại phát sinh do lỗi chủ quan của người dùng như: tự ý tiết lộ mật khẩu/mã OTP cho người khác, truy cập vào các đường dẫn giả mạo (phishing) bên ngoài tên miền chính thức của NovaShop, hoặc thực hiện giao dịch chuyển khoản bên ngoài hệ thống thanh toán được niêm yết trên Nền tảng.
                  </p>
                  <p>
                    <strong>11.2.</strong> Các trang web được liên kết có các chính sách về quyền riêng tư cũng như các biện pháp bảo mật riêng và độc lập. Vì vậy, chúng tôi không có trách nhiệm hay nghĩa vụ pháp lý đối với nội dung, các biện pháp bảo mật (hoặc sự thiếu biện pháp bảo mật) và các hoạt động của các trang web được liên kết này.
                  </p>
                </div>
              </div>

              {/* SECTION 12 */}
              <div id="priv-12" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">12</span>
                  <span>THÔNG TIN CỦA BẠN SẼ ĐƯỢC CHUYỂN RA NƯỚC NGOÀI?</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>12.1.</strong> Thông tin và/hoặc dữ liệu cá nhân của bạn có thể được chuyển ra nước ngoài, lưu trữ hoặc xử lý bên ngoài quốc gia của bạn (ví dụ: trên hạ tầng máy chủ đám mây bảo mật tiêu chuẩn quốc tế hoặc hệ thống xác thực bảo hành toàn cầu của các hãng công nghệ) cho một hoặc nhiều Mục Đích nêu tại Chính sách này. NovaShop sẽ chỉ chuyển dữ liệu cá nhân của bạn ra nước ngoài khi tuân thủ đầy đủ các quy định của pháp luật Việt Nam về bảo vệ dữ liệu cá nhân (bao gồm các quy định tại Điều 25 Nghị định 13/2023/NĐ-CP) và đảm bảo bên tiếp nhận áp dụng tiêu chuẩn bảo vệ dữ liệu tương đương.
                  </p>
                </div>
              </div>

              {/* SECTION 13 */}
              <div id="priv-13" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">13</span>
                  <span>BẠN CÓ THỂ RÚT LẠI SỰ ĐỒNG Ý, YÊU CẦU HẠN CHẾ XỬ LÝ HOẶC XÓA BỎ DỮ LIỆU CÁ NHÂN ĐÃ CUNG CẤP CHO CHÚNG TÔI BẰNG CÁCH NÀO?</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>13.1.</strong> Bạn có thể rút lại sự đồng ý cho phép thu thập, sử dụng và/hoặc tiết lộ và/hoặc yêu cầu hạn chế xử lý, phản đối xử lý hoặc xóa bỏ dữ liệu cá nhân của bạn mà chúng tôi đang lưu giữ hoặc kiểm soát bằng cách gửi email cho <strong>Chuyên viên Bảo vệ Dữ liệu Cá nhân (DPO)</strong> của chúng tôi tại địa chỉ email <strong>dpo.vn@novashop.vn</strong> hoặc <strong>cskh@novashop.vn</strong>, hoặc gọi tới tổng đài <strong>0908061843</strong>. Chúng tôi sẽ tiếp nhận và xử lý yêu cầu của bạn theo đúng Chính sách bảo mật này và quy định tại Nghị định 13/2023/NĐ-CP (trong thời hạn <strong>72 giờ</strong> kể từ khi nhận được yêu cầu hợp lệ).
                  </p>
                  <p>
                    <strong>13.2.</strong> Tuy nhiên, việc bạn rút lại sự đồng ý hoặc yêu cầu xóa dữ liệu cá nhân thiết yếu có thể đồng nghĩa với việc chúng tôi sẽ không thể tiếp tục cung cấp Các Dịch Vụ cho bạn (chẳng hạn như không thể giao hàng, kích hoạt bảo hành điện tử hoặc duy trì tài khoản thành viên) và chúng tôi có thể cần phải chấm dứt mối quan hệ hiện tại và/hoặc hợp đồng dịch vụ của bạn với chúng tôi.
                  </p>
                  <p>
                    <strong>13.3.</strong> Việc rút lại sự đồng ý không làm ảnh hưởng đến tính hợp pháp của việc xử lý dữ liệu đã được thực hiện dựa trên sự đồng ý của bạn trước thời điểm rút lại sự đồng ý, cũng như không áp dụng đối với các dữ liệu mà NovaShop có nghĩa vụ phải lưu trữ theo quy định của pháp luật về kế toán, thuế và thương mại điện tử.
                  </p>
                </div>
              </div>

              {/* SECTION 14 */}
              <div id="priv-14" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">14</span>
                  <span>CẬP NHẬT HOẶC SỬA ĐỔI DỮ LIỆU CÁ NHÂN CỦA BẠN</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>14.1.</strong> Khi bạn cung cấp dữ liệu cá nhân của bạn cho chúng tôi, xin vui lòng đảm bảo dữ liệu đó là chính xác và đầy đủ. Nếu bạn có tài khoản trên NovaShop.vn, bạn có thể trực tiếp truy cập và tự chỉnh sửa thông tin cá nhân, địa chỉ giao hàng và số điện thoại tại mục <strong>Quản lý Tài khoản</strong> bất kỳ lúc nào. Nếu bạn không có tài khoản hoặc cần cập nhật thông tin trên đơn hàng đã xác nhận, bạn có thể gửi yêu cầu bằng văn bản hoặc email tới Chuyên viên Bảo vệ Dữ liệu Cá nhân của chúng tôi theo thông tin tại Mục 15.
                  </p>
                  <p>
                    <strong>14.2.</strong> Chúng tôi sẽ tiến hành cập nhật, chỉnh sửa dữ liệu cá nhân của bạn trong thời gian sớm nhất (không quá 72 giờ kể từ khi xác minh chính chủ yêu cầu) và hoàn toàn miễn phí đối với mọi yêu cầu cập nhật thông tin định danh và giao nhận thông thường.
                  </p>
                  <p>
                    <strong>14.3.</strong> Chúng tôi bảo lưu quyền từ chối sửa dữ liệu cá nhân của bạn trong trường hợp các quy định của pháp luật về bảo vệ dữ liệu cá nhân, kế toán hoặc giải quyết tranh chấp yêu cầu giữ nguyên trạng lịch sử chứng từ gốc của giao dịch đã hoàn tất.
                  </p>
                </div>
              </div>

              {/* SECTION 15 */}
              <div id="priv-15" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">15</span>
                  <span>THẮC MẮC, QUAN NGẠI HOẶC KHIẾU NẠI? LIÊN HỆ VỚI CHÚNG TÔI</span>
                </h3>
                <div className="space-y-3">
                  <p>
                    <strong>15.1.</strong> Nếu bạn có bất kỳ thắc mắc, quan ngại hoặc khiếu nại nào về các phương pháp bảo vệ quyền riêng tư hoặc cách thức chúng tôi xử lý dữ liệu cá nhân của bạn, vui lòng liên hệ trực tiếp với bộ phận chuyên trách của chúng tôi:
                  </p>
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2 text-xs sm:text-sm text-slate-800">
                    <div className="font-extrabold text-indigo-950 uppercase">
                      CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVASHOP VIỆT NAM — BAN BẢO VỆ DỮ LIỆU CÁ NHÂN (DPO)
                    </div>
                    <p>• <strong>Người phụ trách / Chuyên viên Bảo vệ Dữ liệu Cá nhân (DPO):</strong> Ban Pháp Chế & An Toàn Thông Tin NovaShop</p>
                    <p>• <strong>Địa chỉ trụ sở tiếp nhận:</strong> 219/20 đường số 12, Phường Bình Hưng Hòa, Quận Bình Tân, Thành phố Hồ Chí Minh, Việt Nam</p>
                    <p>• <strong>Điện thoại / Hotline hỗ trợ 24/7:</strong> <a href="tel:0908061843" className="font-bold text-indigo-700 underline">0908061843</a></p>
                    <p>• <strong>Email chuyên trách Bảo vệ dữ liệu (DPO):</strong> <a href="mailto:dpo.vn@novashop.vn" className="font-bold text-indigo-700 underline">dpo.vn@novashop.vn</a> | <a href="mailto:cskh@novashop.vn" className="font-bold text-indigo-700 underline">cskh@novashop.vn</a></p>
                  </div>
                  <p>
                    <strong>15.2.</strong> Mọi thắc mắc hoặc khiếu nại liên quan đến việc thu thập, sử dụng và bảo mật thông tin cá nhân sẽ được Ban Bảo vệ Dữ liệu Cá nhân tiếp nhận, kiểm tra xác minh và phản hồi chính thức bằng văn bản/email trong vòng tối đa <strong>72 giờ làm việc</strong>.
                  </p>
                </div>
              </div>

              {/* SECTION 16 */}
              <div id="priv-16" className="scroll-mt-28 space-y-3 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">16</span>
                  <span>ĐIỀU KHOẢN VÀ ĐIỀU KIỆN</span>
                </h3>
                <div className="space-y-3">
                  <p>
                    <strong>16.1.</strong> Xin vui lòng đọc thêm <strong>Quy Chế Hoạt Động Website Cung Cấp Dịch Vụ TMĐT NovaShop.vn</strong> cũng như các chính sách liên quan (Chính sách vận chuyển, Chính sách đổi trả và hoàn tiền, Chính sách bảo hành) thiết lập việc sử dụng, lời từ chối trách nhiệm và giới hạn trách nhiệm điều chỉnh việc sử dụng Nền tảng và Các Dịch Vụ của chúng tôi.
                  </p>
                  <p>
                    <strong>16.2.</strong> NovaShop có quyền sửa đổi, cập nhật hoặc bổ sung Chính sách bảo mật này vào bất kỳ thời điểm nào để phù hợp với sự thay đổi của pháp luật Việt Nam và hoạt động vận hành của Nền tảng. Phiên bản cập nhật sẽ được đăng tải công khai trên website NovaShop.vn kèm theo thời điểm có hiệu lực mới nhất.
                  </p>
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                      <strong>ĐẠI DIỆN CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVASHOP VIỆT NAM</strong>
                      <p>Ban Quản Lý & Bảo Vệ Dữ Liệu Cá Nhân Sàn Giao Dịch TMĐT NovaShop.vn (Đã ký và đóng dấu)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabChange('terms')}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition-colors self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Xem Quy Chế Hoạt Động →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: PAYMENT & VIETQR ================= */}
        {activeTab === 'payment' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-slate-200 pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-3 border border-emerald-200">
                <CreditCard className="w-3.5 h-3.5" />
                <span>PHƯƠNG THỨC THANH TOÁN TIỆN LỢI</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Thanh Toán Không Tiền Mặt VietQR Chuẩn Napas247 & Thẻ Quốc Tế
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Đa dạng phương thức thanh toán an toàn, tự động khớp lệnh chỉ sau 2 giây và hỗ trợ trả góp 0% qua 25 ngân hàng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs">Phổ Biến Nhất</span>
                  <h4 className="font-bold text-slate-900 text-base">1. Quét Mã VietQR Napas247 Tự Động</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mở ứng dụng bất kỳ ngân hàng nào (BIDV, Vietcombank, MB Bank, Techcombank, VPBank...) quét mã QR được tạo sẵn. 
                  Hệ thống tự động điền đúng số tiền tương ứng với sản phẩm/đơn hàng và nội dung chuyển khoản. Đơn hàng thanh toán trước chỉ được xác nhận thành công khi khách hàng đã hoàn tất thanh toán đúng số tiền trên mã QR.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
                  <div>Chủ tài khoản: <strong>TRUONG MINH QUOC TRI</strong></div>
                  <div>Ngân hàng: <strong>BIDV - PGD Tân Sơn Nhì</strong></div>
                  <div>Số tài khoản: <strong>3180530681</strong></div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs">Linh Hoạt</span>
                  <h4 className="font-bold text-slate-900 text-base">2. Trả Góp 0% Lãi Suất</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Áp dụng cho đơn hàng từ 3.000.000đ trở lên. Quý khách có thể trả góp qua thẻ tín dụng (Visa/MasterCard/JCB) 
                  của hơn 25 ngân hàng với kỳ hạn linh hoạt 3, 6, 9 hoặc 12 tháng. Thủ tục online 100%, không cần thế chấp hay chứng minh thu nhập.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">Vietcombank</span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">Techcombank</span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">MB Bank</span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">VPBank</span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">TPBank</span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">ACB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: QUY CHẾ HOẠT ĐỘNG (OPERATING REGULATIONS) ================= */}
        {activeTab === 'terms' && (
          <div className="space-y-8 animate-fade-in">
            {/* Document Header */}
            <div className="border-b border-slate-200 pb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200">
                  <FileText className="w-3.5 h-3.5" />
                  <span>QUY CHẾ HOẠT ĐỘNG SÀN GIAO DỊCH TMĐT</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Cập nhật & Hiệu lực: Năm 2026 • Theo Nghị định 52/2013/NĐ-CP & 85/2021/NĐ-CP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
                QUY CHẾ HOẠT ĐỘNG WEBSITE CUNG CẤP DỊCH VỤ TMĐT NOVASHOP.VN
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Văn bản quy định chi tiết nguyên tắc chung, quy trình giao dịch, thanh toán, vận chuyển, bảo hành, bảo vệ dữ liệu cá nhân, quản lý thông tin và phân định quyền, nghĩa vụ của Ban Quản lý cùng các Thành viên tham gia trên nền tảng thương mại điện tử <strong>NovaShop.vn</strong>.
              </p>

              {/* Quick Jump Table of Contents (I - XII) */}
              <div className="pt-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                  <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mục Lục Quy Chế Hoạt Động (12 Chương):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'reg-sec-1', label: 'I. Nguyên tắc chung' },
                      { id: 'reg-sec-2', label: 'II. Quy định chung' },
                      { id: 'reg-sec-3', label: 'III. Quy trình giao dịch' },
                      { id: 'reg-sec-4', label: 'IV. Quy trình thanh toán' },
                      { id: 'reg-sec-5', label: 'V. Đảm bảo an toàn giao dịch' },
                      { id: 'reg-sec-6', label: 'VI. Bảo vệ thông tin cá nhân' },
                      { id: 'reg-sec-7', label: 'VII. Quản lý thông tin xấu' },
                      { id: 'reg-sec-8', label: 'VIII. Trách nhiệm khi phát sinh lỗi kỹ thuật' },
                      { id: 'reg-sec-9', label: 'IX. Quyền & nghĩa vụ của Ban Quản lý' },
                      { id: 'reg-sec-10', label: 'X. Quyền & trách nhiệm của Thành viên' },
                      { id: 'reg-sec-11', label: 'XI. Điều khoản áp dụng' },
                      { id: 'reg-sec-12', label: 'XII. Điều khoản cam kết & Liên hệ' },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(sec.id);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="text-left px-3 py-2 rounded-xl bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold border border-slate-200/80 hover:border-indigo-200 transition-colors cursor-pointer truncate"
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed 12 Sections */}
            <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {/* I. NGUYÊN TẮC CHUNG */}
              <div id="reg-sec-1" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">I</span>
                  <span>NGUYÊN TẮC CHUNG</span>
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Website thương mại điện tử <strong>NovaShop.vn</strong> do <strong>Công ty Cổ phần Công nghệ NovaShop Việt Nam</strong> (“Công ty” hoặc “NovaShop”) thực hiện hoạt động và vận hành. Đối tượng phục vụ là tất cả các khách hàng, thương nhân, tổ chức, cá nhân có nhu cầu mua sắm, đặt hàng thiết bị công nghệ, điện tử, phụ kiện chính hãng và các đối tác cung ứng hợp pháp được NovaShop công nhận.
                  </li>
                  <li>
                    Nguyên tắc này áp dụng cho các thành viên đăng ký sử dụng, tạo lập tài khoản người mua, tham gia đặt hàng, giới thiệu, mua bán sản phẩm, cung cấp dịch vụ hoặc hưởng các chương trình khuyến mại hàng hóa trên NovaShop.vn.
                  </li>
                  <li>
                    Thương nhân, tổ chức, cá nhân tham gia giao dịch tại NovaShop.vn tự do thỏa thuận trên cơ sở tôn trọng quyền và lợi ích hợp pháp của các bên tham gia hoạt động mua bán sản phẩm, dịch vụ thông qua hợp đồng/đơn đặt hàng điện tử, không trái với quy định của pháp luật.
                  </li>
                  <li>
                    Sản phẩm, dịch vụ tham gia giao dịch trên NovaShop.vn phải đáp ứng đầy đủ các quy định của pháp luật có liên quan (có nguồn gốc xuất xứ rõ ràng, hóa đơn chứng từ hợp pháp, tem hợp quy), không thuộc các trường hợp cấm kinh doanh, cấm quảng cáo theo quy định của pháp luật Việt Nam.
                  </li>
                  <li>
                    Hoạt động mua bán hàng hóa, cung ứng dịch vụ qua NovaShop.vn phải được thực hiện công khai, minh bạch, đảm bảo quyền lợi chính đáng của người tiêu dùng.
                  </li>
                  <li>
                    Tất cả các nội dung trong Quy chế này tuân thủ theo hệ thống pháp luật hiện hành của Việt Nam. Thành viên khi tham gia vào NovaShop.vn phải tự tìm hiểu trách nhiệm pháp lý của mình đối với luật pháp hiện hành của Việt Nam và cam kết thực hiện đúng những nội dung trong Quy chế hoạt động này.
                  </li>
                </ul>
              </div>

              {/* II. QUY ĐỊNH CHUNG */}
              <div id="reg-sec-2" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">II</span>
                  <span>QUY ĐỊNH CHUNG</span>
                </h3>
                <div className="space-y-2.5">
                  <p>
                    <strong>1. Tên Miền Website Thương Mại Điện Tử:</strong> Website cung cấp dịch vụ thương mại điện tử NovaShop.vn do Công ty Cổ phần Công nghệ NovaShop Việt Nam phát triển và vận hành với tên miền giao dịch chính thức là: <strong>www.novashop.vn</strong>.
                  </p>
                  <p><strong>2. Định nghĩa chung:</strong></p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Đơn vị vận hành / Người Bán (NovaShop & Đối tác chính hãng):</strong> Là Công ty Cổ phần Công nghệ NovaShop Việt Nam cùng các nhà phân phối, thương hiệu công nghệ ủy quyền chính thức cung cấp hàng hóa, dịch vụ trên nền tảng.
                    </li>
                    <li>
                      <strong>Người Mua (Khách hàng):</strong> Là thương nhân, tổ chức, cá nhân có nhu cầu tìm hiểu thông tin hoặc mua sản phẩm, dịch vụ được đăng bán trên NovaShop.vn. Người Mua bắt buộc phải đăng ký tài khoản thành viên và đăng nhập để thực hiện quy trình đặt mua hàng trực tuyến hoặc đăng ký trả góp.
                    </li>
                    <li>
                      <strong>Thành Viên:</strong> Bao gồm cả Người Mua và các đối tác tham gia giao dịch trên Website thương mại điện tử NovaShop.vn. Thành viên đăng ký kê khai ban đầu các thông tin cá nhân bắt buộc, được Ban quản lý NovaShop.vn chính thức công nhận và cho phép sử dụng dịch vụ.
                    </li>
                    <li>
                      <strong>Phiếu Ưu Đãi / Mã Giảm Giá (Voucher):</strong> Là các mã khuyến mại điện tử do NovaShop phát hành nhằm giảm trừ trực tiếp vào giá trị đơn hàng hoặc phí vận chuyển khi Người Mua thỏa mãn điều kiện giá trị đơn hàng tối thiểu. Voucher không có giá trị quy đổi thành tiền mặt.
                    </li>
                    <li>
                      <strong>Điểm Thưởng Thành Viên (NovaPoints):</strong> Là điểm tích lũy dành cho Thành Viên khi hoàn tất đơn hàng hợp lệ trên NovaShop.vn (mỗi 10.000₫ giá trị thanh toán tương ứng 01 NovaPoint, tối đa 50.000 điểm/đơn hàng).
                    </li>
                  </ul>
                </div>
              </div>

              {/* III. QUY TRÌNH GIAO DỊCH */}
              <div id="reg-sec-3" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-4 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">III</span>
                  <span>QUY TRÌNH GIAO DỊCH</span>
                </h3>

                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">1. Quy trình dành cho Người Mua hàng:</h4>
                    <p>Khi có nhu cầu mua hàng trên NovaShop.vn, Người Mua thực hiện theo các bước sau:</p>
                    <ol className="list-decimal pl-5 space-y-1.5">
                      <li><strong>Bước 1:</strong> Đăng nhập vào tài khoản cá nhân trên NovaShop.vn (hoặc Đăng ký tài khoản mới / Đăng nhập nhanh qua Google).</li>
                      <li><strong>Bước 2:</strong> Tìm kiếm, tham khảo thông tin chi tiết về sản phẩm (thông số kỹ thuật, màu sắc, giá niêm yết đã gồm VAT, chính sách bảo hành, khuyến mại đi kèm).</li>
                      <li><strong>Bước 3:</strong> Nhấn chọn <em>“Thêm vào giỏ”</em> hoặc <em>“Mua ngay”</em> (hoặc <em>“Trả góp 0%”</em>). Kiểm tra giỏ hàng, chọn áp dụng Mã giảm giá (Voucher) phù hợp.</li>
                      <li><strong>Bước 4:</strong> Điền đầy đủ thông tin người nhận (Họ tên, Số điện thoại, Địa chỉ giao hàng, Ghi chú), lựa chọn phương thức vận chuyển (Giao tiêu chuẩn hoặc Giao hỏa tốc 2H) và phương thức thanh toán (COD, VietQR Napas 24/7, Thẻ tín dụng/Visa/MasterCard, Ví MoMo/VNPay).</li>
                      <li><strong>Bước 5:</strong> Nhấn <em>“Xác nhận đặt hàng”</em>. Đối với phương thức thanh toán trước qua mã QR (VietQR), Người Mua thực hiện quét mã thanh toán đúng số tiền đơn hàng để hệ thống xác nhận thành công.</li>
                      <li><strong>Bước 6:</strong> NovaShop kiểm tra, xác nhận đơn hàng, đóng gói sản phẩm và bàn giao cho đơn vị vận chuyển. Người Mua theo dõi lộ trình đơn hàng tại mục <em>“Tra cứu đơn hàng”</em>.</li>
                      <li><strong>Bước 7:</strong> Người Mua nhận hàng, thực hiện đồng kiểm ngoại quan cùng nhân viên giao nhận và ký nhận (thanh toán tiền mặt nếu chọn COD).</li>
                    </ol>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">2. Quy trình dành cho Đơn vị cung ứng / Gian hàng đối tác:</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>Chuẩn bị nội dung mô tả sản phẩm, bảng thông số kỹ thuật, hình ảnh thực tế và chứng nhận xuất xứ chính hãng (CO/CQ).</li>
                      <li>Niêm yết giá bán minh bạch (đã bao gồm thuế GTGT - VAT) và cập nhật số lượng tồn kho theo thời gian thực.</li>
                      <li>Tiếp nhận thông tin đơn đặt hàng từ hệ thống, xuất hóa đơn điện tử VAT, đóng gói chống sốc 3 lớp có niêm phong tem bảo mật NovaShop và bàn giao cho đơn vị vận chuyển đúng cam kết.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">3. Chính sách giao nhận, vận chuyển và đồng kiểm:</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>NovaShop hợp tác cùng các đơn vị vận chuyển chuyên nghiệp (Viettel Post, Giao Hàng Tiết Kiệm, GHN, Ahamove, GrabExpress) để giao hàng trên toàn lãnh thổ Việt Nam.</li>
                      <li><strong>Thời gian giao hàng:</strong> Giao hỏa tốc nội thành TP.HCM & Hà Nội trong 2 - 4 giờ; Giao tiêu chuẩn toàn quốc từ 1 - 4 ngày làm việc. Miễn phí vận chuyển cho đơn hàng từ 300.000₫.</li>
                      <li><strong>Chính sách đồng kiểm:</strong> Người Mua có quyền mở kiện bưu phẩm kiểm tra ngoại quan (kiểm tra hộp máy, tem niêm phong, đúng model, màu sắc, số lượng và quà tặng kèm) trước khi thanh toán và nhận hàng.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">4. Chính sách bảo hành và bảo trì sản phẩm:</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>100% sản phẩm thiết bị công nghệ phân phối trên NovaShop.vn được hưởng chế độ bảo hành điện tử chính hãng từ <strong>12 đến 24 tháng</strong> theo số Serial/IMEI tại các Trung tâm bảo hành ủy quyền của hãng trên toàn quốc hoặc tại Trung tâm kỹ thuật NovaCare.</li>
                      <li>Điều kiện bảo hành miễn phí: Sản phẩm bị lỗi kỹ thuật do nhà sản xuất, còn trong thời hạn bảo hành điện tử, số Serial/IMEI và tem niêm phong còn nguyên vẹn, không bị rơi vỡ, cấn móp biến dạng hay ngấm chất lỏng.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">5. Chính sách Trả hàng và Hoàn tiền (Đổi mới 1-1 trong 30 ngày):</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>Người Mua có quyền yêu cầu <strong>Đổi mới 1-1 sản phẩm nguyên seal</strong> hoặc <strong>Trả hàng/Hoàn tiền 100%</strong> trong vòng <strong>30 ngày đầu tiên</strong> kể từ ngày nhận hàng nếu: Sản phẩm phát sinh lỗi phần cứng từ nhà sản xuất; Giao sai mẫu mã, màu sắc, thiếu phụ kiện so với đơn đặt hàng; hoặc Sản phẩm bị hư hại trong quá trình vận chuyển.</li>
                      <li>Trường hợp hết sản phẩm cùng model để đổi mới, NovaShop hoàn trả 100% số tiền Người Mua đã thanh toán qua chuyển khoản ngân hàng trong vòng 24 giờ làm việc. Miễn phí 100% chi phí vận chuyển thu hồi và đổi trả 2 chiều.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">6. Quy trình xác nhận và hủy đơn hàng:</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><strong>Xác nhận đơn hàng:</strong> Ngay sau khi Người Mua đặt hàng thành công, hệ thống gửi thông báo xác nhận kèm Mã đơn hàng (VD: <code>ORD-...</code>) và cập nhật trạng thái trong mục Lịch sử đơn hàng.</li>
                      <li><strong>Hủy đơn hàng từ phía Người Mua:</strong> Người Mua có thể yêu cầu hủy đơn hàng ngay lập tức nếu đơn hàng đang ở trạng thái <em>“Chờ xác nhận”</em> hoặc <em>“Đang đóng gói”</em> trước khi bàn giao cho đơn vị vận chuyển bằng cách liên hệ Hotline 0908061843 hoặc thao tác trên hệ thống.</li>
                      <li><strong>Hủy đơn hàng từ hệ thống:</strong> NovaShop có quyền tự động hủy đơn hàng và thông báo cho Người Mua trong trường hợp phát hiện hành vi đầu cơ, gian lận Voucher, thông tin địa chỉ/số điện thoại sai lệch không thể liên hệ sau 03 lần gọi, hoặc đơn thanh toán trả trước chưa hoàn tất chuyển khoản.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">7. Quy trình giải quyết tranh chấp, xử lý khiếu nại:</h4>
                    <p>Khi phát sinh tranh chấp hoặc khiếu nại liên quan đến giao dịch trên NovaShop.vn, NovaShop khuyến khích giải pháp thương lượng, hòa giải trên tinh thần bảo vệ tối đa quyền lợi chính đáng của Người tiêu dùng theo quy trình 4 bước:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><strong>Bước 1 (Tiếp nhận khiếu nại):</strong> Người Mua gửi yêu cầu khiếu nại hoặc đăng ký Trả hàng/Hoàn tiền trực tuyến tại trang Chính sách & Dịch vụ, qua Hotline miễn phí <strong>0908061843</strong> hoặc Email <strong>support@novashop.vn</strong>.</li>
                      <li><strong>Bước 2 (Xác minh & Thẩm định):</strong> Bộ phận Chăm sóc Khách hàng & Pháp chế của NovaShop tiếp nhận thông tin trong vòng 02 giờ làm việc, hướng dẫn Người Mua cung cấp bằng chứng (hình ảnh, video mở hộp, hóa đơn điện tử) để đối chiếu với nhật ký đóng gói và vận chuyển.</li>
                      <li><strong>Bước 3 (Đề xuất & Thực thi phương án xử lý):</strong> Trong thời hạn từ <strong>24 giờ đến tối đa 07 ngày làm việc</strong> kể từ khi nhận đủ thông tin, NovaShop đưa ra quyết định xử lý: Đổi mới 1-1 tận nơi, bảo hành miễn phí, bù phụ kiện thiếu hoặc hoàn tiền 100% cho Người Mua.</li>
                      <li><strong>Bước 4 (Cơ quan có thẩm quyền):</strong> Trong trường hợp vụ việc vượt quá khả năng hòa giải hoặc một trong các bên không đồng ý với phương án giải quyết cuối cùng, các bên có quyền đưa vụ việc ra giải quyết tại Cơ quan Bảo vệ quyền lợi người tiêu dùng hoặc Tòa án nhân dân có thẩm quyền theo quy định của pháp luật Việt Nam.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* IV. QUY TRÌNH THANH TOÁN */}
              <div id="reg-sec-4" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">IV</span>
                  <span>QUY TRÌNH THANH TOÁN</span>
                </h3>
                <p>Người Mua trên NovaShop.vn có thể tham khảo và lựa chọn một trong các phương thức thanh toán an toàn, minh bạch sau đây:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">Cách 1: Thanh toán khi nhận hàng (COD)</h4>
                    <p className="text-xs text-slate-600">
                      Người Mua đặt hàng trên website, nhân viên vận chuyển giao hàng đến tận địa chỉ nhận hàng. Người Mua mở kiện kiểm tra ngoại quan sản phẩm rồi mới thanh toán tiền mặt trực tiếp cho nhân viên giao nhận.
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">Cách 2: Thanh toán chuyển khoản nhanh VietQR Napas 24/7</h4>
                    <p className="text-xs text-slate-600">
                      Hệ thống khởi tạo mã QR động chứa chính xác số tiền và mã đơn hàng. Người Mua quét mã bằng ứng dụng Ngân hàng về tài khoản thụ hưởng chính thức: <strong>TRUONG MINH QUOC TRI - STK: 3180530681 - Ngân hàng BIDV (PGD Tân Sơn Nhì)</strong>.
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">Cách 3: Thanh toán qua Thẻ quốc tế & Ví điện tử</h4>
                    <p className="text-xs text-slate-600">
                      Hỗ trợ thanh toán trực tuyến qua thẻ Visa, MasterCard, JCB (bảo mật 3D-Secure 2.0 OTP) và các ví điện tử thông dụng như MoMo, VNPay-QR.
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">Cách 4: Mua hàng Trả góp 0% lãi suất</h4>
                    <p className="text-xs text-slate-600">
                      Hỗ trợ trả góp 0% lãi suất kỳ hạn 3, 6, 9, 12, 18, 24 tháng qua Thẻ tín dụng của hơn 25 ngân hàng hoặc đăng ký trả góp qua Công ty tài chính bằng CCCD gắn chip duyệt hồ sơ trực tuyến trong 5 phút.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 pt-1">
                  <strong>Cơ chế đảm bảo thanh toán:</strong> Đối với mọi giao dịch thanh toán trả trước, số tiền thanh toán của Người Mua được hệ thống ghi nhận và bảo vệ. Nếu đơn hàng bị hủy hoặc không thể giao thành công vì bất kỳ lý do khách quan nào, NovaShop cam kết hoàn trả 100% số tiền đã thanh toán về tài khoản ngân hàng của Người Mua trong vòng 24 giờ.
                </p>
              </div>

              {/* V. ĐẢM BẢO AN TOÀN GIAO DỊCH */}
              <div id="reg-sec-5" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">V</span>
                  <span>ĐẢM BẢO AN TOÀN GIAO DỊCH</span>
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Ban Quản lý đã sử dụng các dịch vụ và giao thức bảo mật tiên tiến nhất để bảo vệ thông tin về nội dung sản phẩm và giao dịch tài chính trên NovaShop.vn. Để đảm bảo các giao dịch được tiến hành thành công, hạn chế tối đa rủi ro có thể phát sinh, toàn bộ đường truyền dữ liệu đều được mã hóa theo chuẩn quốc tế <strong>SSL 256-Bit (Secure Sockets Layer)</strong> và tuân thủ tiêu chuẩn bảo mật <strong>PCI-DSS Level 1</strong>.
                  </li>
                  <li>
                    NovaShop tuyệt đối không lưu trữ thông tin số thẻ ngân hàng, mã bảo mật CVV/CVC hoặc mật khẩu интернет banking của khách hàng trên hệ thống máy chủ.
                  </li>
                  <li>
                    Người Mua không nên đưa thông tin chi tiết về việc thanh toán hoặc mã xác thực OTP cho bất kỳ ai bằng email, tin nhắn hoặc hình thức liên lạc khác ngoài hệ thống chính thức của NovaShop.vn. NovaShop không chịu trách nhiệm về những thiệt hại hay rủi ro thành viên có thể gánh chịu trong việc tự ý trao đổi thông tin thanh toán qua các kênh không chính thống.
                  </li>
                  <li>
                    Người Mua tuyệt đối không sử dụng bất kỳ chương trình, công cụ hay hình thức nào khác để can thiệp vào hệ thống hay làm thay đổi cấu trúc dữ liệu. Mọi hành vi phát tán, truyền bá hay cổ vũ cho bất kỳ hoạt động nào nhằm can thiệp, phá hoại hay xâm nhập hệ thống website đều bị nghiêm cấm và sẽ bị xử lý theo quy định của pháp luật.
                  </li>
                </ul>
              </div>

              {/* VI. CHÍNH SÁCH BẢO VỆ THÔNG TIN CÁ NHÂN CỦA NGƯỜI TIÊU DÙNG */}
              <div id="reg-sec-6" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">VI</span>
                  <span>CHÍNH SÁCH BẢO VỆ THÔNG TIN CÁ NHÂN CỦA NGƯỜI TIÊU DÙNG</span>
                </h3>
                <p>Thực hiện theo quy định tại Điều 68 đến Điều 73 Nghị định 52/2013/NĐ-CP và Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân:</p>
                <div className="space-y-2.5 pl-2">
                  <p>
                    <strong>1. Mục đích và phạm vi thu thập thông tin:</strong> Việc thu thập dữ liệu chủ yếu trên Sàn giao dịch TMĐT NovaShop.vn bao gồm: Họ và tên, email, số điện thoại liên lạc, địa chỉ nhận hàng, tên đăng nhập và lịch sử đơn hàng. Đây là các thông tin cần thiết để NovaShop xác nhận đặt hàng, giao vận và kích hoạt bảo hành điện tử nhằm đảm bảo quyền lợi cho người tiêu dùng.
                  </p>
                  <p>
                    <strong>2. Phạm vi sử dụng thông tin:</strong> Website NovaShop.vn sử dụng thông tin thành viên cung cấp để: (a) Xử lý đơn hàng và giao hàng đến địa chỉ Người Mua yêu cầu; (b) Xuất hóa đơn điện tử VAT và kích hoạt chế độ bảo hành chính hãng theo IMEI/Serial; (c) Gửi thông báo về trạng thái đơn hàng và chương trình ưu đãi thành viên; (d) Liên lạc và giải quyết với thành viên trong những trường hợp đặc biệt hoặc khi có khiếu nại.
                  </p>
                  <p>
                    <strong>3. Thời gian lưu trữ thông tin:</strong> Dữ liệu cá nhân của thành viên sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ hoặc tự thành viên đăng nhập và thực hiện hủy bỏ. Còn lại trong mọi trường hợp thông tin cá nhân thành viên sẽ được bảo mật trên máy chủ của NovaShop.vn theo thời hạn quy định của pháp luật.
                  </p>
                  <p>
                    <strong>4. Những người hoặc tổ chức có thể được tiếp cận với thông tin:</strong> Ban Quản trị NovaShop.vn, các đối tác vận chuyển thực hiện việc giao nhận hàng hóa (chỉ tiếp cận Họ tên, SĐT, Địa chỉ giao hàng), và Cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp bằng văn bản.
                  </p>
                  <p>
                    <strong>5. Địa chỉ của đơn vị thu thập và quản lý thông tin cá nhân:</strong> Công ty Cổ phần Công nghệ NovaShop Việt Nam • Trụ sở: 219/20 đường số 12, Phường Bình Hưng Hòa, Quận Bình Tân, TP. Hồ Chí Minh • Điện thoại: 0908061843 • Email: support@novashop.vn.
                  </p>
                  <p>
                    <strong>6. Phương thức và công cụ để người tiêu dùng tiếp cận và chỉnh sửa dữ liệu:</strong> Thành viên có quyền tự kiểm tra, cập nhật, điều chỉnh hoặc hủy bỏ thông tin cá nhân của mình bằng cách đăng nhập vào tài khoản tại mục <em>“Hồ sơ cá nhân”</em> trên website hoặc yêu cầu Ban Quản trị NovaShop.vn thực hiện việc này qua Hotline/Email.
                  </p>
                </div>
              </div>

              {/* VII. QUẢN LÝ THÔNG TIN XẤU */}
              <div id="reg-sec-7" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">VII</span>
                  <span>QUẢN LÝ THÔNG TIN TRÊN WEBSITE (QUẢN LÝ THÔNG TIN XẤU)</span>
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Quy định về đăng tải thông tin sản phẩm:</strong> Mọi sản phẩm đăng bán trên NovaShop.vn phải là hàng hóa chính hãng, có nguồn gốc xuất xứ rõ ràng, đầy đủ thông số kỹ thuật theo quy định tại Nghị định 85/2021/NĐ-CP. Nghiêm cấm tuyệt đối việc kinh doanh hàng giả, hàng nhái, hàng xâm phạm quyền sở hữu trí tuệ, hàng nhập lậu hoặc hàng hóa thuộc danh mục cấm kinh doanh theo quy định của pháp luật.
                  </li>
                  <li>
                    <strong>Quy định đối với hành vi của Thành viên:</strong> Thành viên không được sử dụng dịch vụ của NovaShop.vn để đăng tải các nội dung, bình luận, đánh giá xuyên tạc, vu khống, vi phạm thuần phong mỹ tục, bàn luận về chính trị, tôn giáo hoặc phát tán mã độc, đường dẫn lừa đảo (phishing).
                  </li>
                  <li>
                    <strong>Cơ chế rà soát và kiểm soát thông tin:</strong> Ban Quản lý NovaShop.vn áp dụng bộ lọc kiểm duyệt tự động kết hợp đội ngũ kiểm soát nội dung 24/7. Mọi thông tin sản phẩm, đánh giá hoặc tài khoản vi phạm Quy chế sẽ bị gỡ bỏ ngay lập tức và khóa tài khoản vĩnh viễn mà không cần báo trước.
                  </li>
                </ul>
              </div>

              {/* VIII. TRÁCH NHIỆM TRONG TRƯỜNG HỢP PHÁT SINH LỖI KỸ THUẬT */}
              <div id="reg-sec-8" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">VIII</span>
                  <span>TRÁCH NHIỆM TRONG TRƯỜNG HỢP PHÁT SINH LỖI KỸ THUẬT</span>
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Website thương mại điện tử NovaShop.vn cam kết nỗ lực đảm bảo sự an toàn và ổn định của toàn bộ hệ thống kỹ thuật để Thành viên thực hiện giao dịch thông suốt 24/7. Tuy nhiên, trong trường hợp xảy ra sự cố do lỗi kỹ thuật của NovaShop.vn, Ban Quản lý sẽ ngay lập tức áp dụng các biện pháp khắc phục để đảm bảo quyền lợi tối đa cho Người Mua hàng.
                  </li>
                  <li>
                    Khi thực hiện các giao dịch trên Sàn, bắt buộc các thành viên phải thực hiện đúng theo các quy trình hướng dẫn. Ban Quản lý NovaShop.vn cam kết cung cấp chất lượng dịch vụ tốt nhất cho các thành viên tham gia giao dịch.
                  </li>
                  <li>
                    Trường hợp phát sinh lỗi kỹ thuật, lỗi phần mềm hoặc các lỗi khách quan khác dẫn đến thành viên không thể tham gia giao dịch được thì các thành viên thông báo cho Ban Quản lý qua địa chỉ email <strong>support@novashop.vn</strong> hoặc Hotline <strong>0908061843</strong>, chúng tôi sẽ khắc phục lỗi trong thời gian sớm nhất. Tuy nhiên, Ban Quản lý sẽ không chịu trách nhiệm giải quyết trong trường hợp thông báo của các thành viên không đến được Ban Quản lý, phát sinh từ lỗi kỹ thuật, lỗi đường truyền, phần mềm hoặc các lỗi khác không do Ban Quản lý gây ra.
                  </li>
                </ul>
              </div>

              {/* IX. QUYỀN VÀ NGHĨA VỤ CỦA BAN QUẢN LÝ WEBSITE TMĐT NOVASHOP.VN */}
              <div id="reg-sec-9" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">IX</span>
                  <span>QUYỀN VÀ NGHĨA VỤ CỦA BAN QUẢN LÝ WEBSITE TMĐT NOVASHOP.VN</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1.5">1. Quyền của Ban Quản lý Website TMĐT NovaShop.vn:</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>Yêu cầu Thành viên tham gia sử dụng dịch vụ phải cung cấp thông tin cá nhân và thông tin nhận hàng chính xác, trung thực.</li>
                      <li>Có quyền từ chối, tạm ngừng hoặc chấm dứt quyền sử dụng tài khoản và dịch vụ của Thành viên nếu có cơ sở xác thực rằng Thành viên cung cấp thông tin sai lệch, thực hiện hành vi gian lận thương mại, lạm dụng mã khuyến mại hoặc vi phạm pháp luật hiện hành.</li>
                      <li>Giữ bản quyền sử dụng dịch vụ và các nội dung, thiết kế, hình ảnh, thương hiệu trên Website TMĐT NovaShop.vn theo các quy định pháp luật về bảo hộ sở hữu trí tuệ tại Việt Nam. Nghiêm cấm mọi hành vi sao chép, sử dụng trái phép.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1.5">2. Nghĩa vụ và trách nhiệm của Ban Quản lý Website TMĐT NovaShop.vn:</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>Đăng ký thiết lập website thương mại điện tử theo đúng quy định của pháp luật và công bố công khai các thông tin pháp lý của doanh nghiệp trên trang chủ website.</li>
                      <li>Xây dựng và công bố công khai Quy chế hoạt động, Chính sách bảo mật, Chính sách vận chuyển, Chính sách bảo hành và Chính sách đổi trả/hoàn tiền; thường xuyên theo dõi và bảo đảm việc thực hiện nghiêm túc các quy định này.</li>
                      <li>Đảm bảo an toàn, ổn định cho hệ thống kỹ thuật, bảo mật tuyệt đối dữ liệu cá nhân của Người tiêu dùng và thông tin giao dịch thanh toán.</li>
                      <li>Tiếp nhận, phản hồi và giải quyết kịp thời các khiếu nại, tranh chấp phát sinh của Người Mua; chịu trách nhiệm bồi thường 200% giá trị nếu phát hiện hàng hóa phân phối trên hệ thống không phải hàng chính hãng.</li>
                      <li>Phối hợp và cung cấp thông tin, dữ liệu giao dịch khi có yêu cầu từ Cơ quan quản lý Nhà nước có thẩm quyền.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* X. QUYỀN VÀ TRÁCH NHIỆM CỦA THÀNH VIÊN THAM GIA */}
              <div id="reg-sec-10" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">X</span>
                  <span>QUYỀN VÀ TRÁCH NHIỆM CỦA THÀNH VIÊN THAM GIA NOVASHOP.VN</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1.5">1. Quyền của Thành viên (Người Mua / Người Sử Dụng):</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>Khi đăng ký trở thành Thành viên của NovaShop.vn và được chấp thuận, Thành viên được cấp một tài khoản cá nhân để mua sắm, theo dõi đơn hàng, quản lý danh sách yêu thích, tích lũy điểm thưởng NovaPoints và sử dụng các mã giảm giá (Voucher).</li>
                      <li>Được hưởng đầy đủ các chính sách ưu đãi, cam kết chất lượng 100% chính hãng, quyền đồng kiểm khi nhận hàng, bảo hành 12 - 24 tháng và đổi mới 1-1 trong 30 ngày đầu tiên.</li>
                      <li>Có quyền đóng góp ý kiến, gửi khiếu nại trực tiếp đến Ban Quản lý về chất lượng sản phẩm, dịch vụ giao nhận hoặc thái độ phục vụ qua Hotline và Email CSKH.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1.5">2. Nghĩa vụ và trách nhiệm của Thành viên:</h4>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>Thành viên tự chịu trách nhiệm về bảo mật và lưu giữ tên đăng ký, mật khẩu và hộp thư điện tử của mình; kịp thời thông báo cho Ban Quản lý NovaShop.vn về những hành vi sử dụng trái phép, lạm dụng hoặc vi phạm bảo mật của bên thứ ba.</li>
                      <li>Cung cấp đầy đủ, chính xác thông tin cá nhân, số điện thoại và địa chỉ nhận hàng khi đặt mua sản phẩm; thực hiện thanh toán đầy đủ theo phương thức đã lựa chọn.</li>
                      <li>Cam kết không sử dụng dịch vụ của Website TMĐT NovaShop.vn vào những mục đích bất hợp pháp, lừa đảo, đặt đơn hàng ảo không có ý định nhận hàng, hoặc can thiệp phá hoại hệ thống kỹ thuật.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* XI. ĐIỀU KHOẢN ÁP DỤNG */}
              <div id="reg-sec-11" className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">XI</span>
                  <span>ĐIỀU KHOẢN ÁP DỤNG</span>
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Quy chế hoạt động của Website cung cấp dịch vụ thương mại điện tử NovaShop.vn chính thức có hiệu lực thi hành kể từ ngày ký Quyết định ban hành và được đăng tải công khai trên website <strong>www.novashop.vn</strong>.
                  </li>
                  <li>
                    Website thương mại điện tử NovaShop.vn có quyền và có thể thay đổi, bổ sung Quy chế này bằng cách thông báo công khai trên website cho các Thành viên được biết trước khi áp dụng. Quy chế sửa đổi có hiệu lực kể từ ngày Quyết định về việc sửa đổi Quy chế có hiệu lực. Việc Thành viên tiếp tục sử dụng dịch vụ sau khi Quy chế sửa đổi được công bố và thực thi đồng nghĩa với việc Thành viên đã đọc, hiểu và chấp nhận Quy chế sửa đổi này.
                  </li>
                </ul>
              </div>

              {/* XII. ĐIỀU KHOẢN CAM KẾT & ĐỊA CHỈ LIÊN HỆ */}
              <div id="reg-sec-12" className="p-5 sm:p-6 bg-linear-to-br from-indigo-50/90 via-white to-slate-50 rounded-2xl border border-indigo-200/90 space-y-4 scroll-mt-32">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black">XII</span>
                  <span>ĐIỀU KHOẢN CAM KẾT</span>
                </h3>
                <p>
                  Mọi Thành viên và đối tác khi sử dụng Website thương mại điện tử <strong>NovaShop.vn</strong> để thực hiện giao dịch mua bán trực tuyến đồng nghĩa với việc các bên có liên quan đã chấp thuận tuân theo Quy chế này. Mọi thắc mắc, yêu cầu hỗ trợ hoặc khiếu nại của khách hàng xin vui lòng liên hệ trực tiếp với NovaShop theo thông tin chính thức dưới đây:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 bg-white rounded-xl border border-indigo-100 space-y-2 text-xs">
                    <div className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVASHOP VIỆT NAM</span>
                    </div>
                    <p className="text-slate-600">
                      • <strong>Địa chỉ trụ sở:</strong> 219/20 đường số 12, Phường Bình Hưng Hòa, Quận Bình Tân, Thành phố Hồ Chí Minh, Việt Nam
                    </p>
                    <p className="text-slate-600">
                      • <strong>Mã số doanh nghiệp:</strong> 0317892341 do Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh cấp lần đầu ngày 15/03/2021
                    </p>
                    <p className="text-slate-600">
                      • <strong>Người đại diện / Chịu trách nhiệm quản lý nội dung:</strong> Ông Nguyễn Thành Nam
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-indigo-100 space-y-2 text-xs">
                    <div className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>TỔNG ĐÀI TIẾP NHẬN & HỖ TRỢ KHÁCH HÀNG</span>
                    </div>
                    <p className="text-slate-600">
                      • <strong>Hotline CSKH & Giải quyết khiếu nại 24/7:</strong> <a href="tel:0908061843" className="text-indigo-600 font-bold hover:underline">0908061843</a> (Miễn phí)
                    </p>
                    <p className="text-slate-600">
                      • <strong>Email hỗ trợ pháp lý & CSKH:</strong> <a href="mailto:support@novashop.vn" className="text-indigo-600 font-bold hover:underline">support@novashop.vn</a>
                    </p>
                    <p className="text-slate-600">
                      • <strong>Website chính thức:</strong> <span className="font-semibold text-slate-800">www.novashop.vn</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-900">Câu Hỏi Thường Gặp Về Chính Sách & Dịch Vụ (FAQ)</h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-sm text-slate-900 hover:text-indigo-600 flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 pt-2 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-slate-800">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hỗ Trợ Khách Hàng Tận Tâm 24/7</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">
            Cần Giải Đáp Thêm Về Bảo Hành, Đổi Trả Hoặc Thanh Toán?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Đội ngũ NovaCare luôn sẵn sàng hỗ trợ quý khách tra cứu hạn bảo hành điện tử, hướng dẫn thanh toán VietQR tự động và xử lý đổi trả tận nơi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onOpenFaq && (
            <button
              onClick={onOpenFaq}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-colors shadow-md cursor-pointer flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Xem Hỏi Đáp FAQ</span>
            </button>
          )}
          <button
            onClick={onExploreProducts}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors border border-white/20 cursor-pointer flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Tiếp Tục Mua Sắm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
