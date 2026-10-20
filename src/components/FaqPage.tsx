import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  Search,
  Package,
  Truck,
  RotateCcw,
  CreditCard,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  FileText,
  X,
  FileQuestion,
  Headphones,
  ShoppingBag,
  Building2,
  Mail,
  Printer,
  BadgeCheck,
  Clock,
  Layers
} from 'lucide-react';
import { PolicyTabId } from './PolicyModal';
import { smoothScrollToElement } from '../utils/smoothScroll';

export type FaqCategory = 'all' | 'product' | 'shipping' | 'return' | 'payment';

export interface FaqItem {
  id: string;
  category: FaqCategory;
  categoryLabel: string;
  question: string;
  answer: string;
  highlights?: string[];
  relatedPolicyTab?: PolicyTabId;
  isPopular?: boolean;
}

const FAQ_DATA: FaqItem[] = [
  // --- SẢN PHẨM & XUẤT XỨ ---
  {
    id: 'faq-product-1',
    category: 'product',
    categoryLabel: 'Sản Phẩm & Xuất Xứ',
    question: 'Sản phẩm tại NovaShop có phải là hàng chính hãng 100% không? Làm sao để kiểm tra?',
    answer: 'NovaShop cam kết 100% thiết bị công nghệ (điện thoại, laptop, máy tính bảng, âm thanh, phụ kiện) đều là hàng chính hãng phân phối chính ngạch tại Việt Nam, nguyên đai nguyên kiện và nguyên seal từ nhà sản xuất. Mỗi sản phẩm đều có tem niêm phong, hóa đơn VAT điện tử và số IMEI/Serial number được kích hoạt bảo hành điện tử chính hãng từ Apple, Samsung, Sony, Dell, Asus... Quý khách có thể tự tra cứu số serial trực tiếp trên website chính thức của hãng ngay khi nhận hàng.',
    highlights: ['100% Chính Hãng Nguyên Seal', 'Bảo Hành Điện Tử IMEI/Serial', 'Đầy Đủ Hóa Đơn VAT Điện Tử'],
    relatedPolicyTab: 'warranty',
    isPopular: true,
  },
  {
    id: 'faq-product-2',
    category: 'product',
    categoryLabel: 'Sản Phẩm & Xuất Xứ',
    question: 'Sản phẩm mua tại NovaShop có đầy đủ phụ kiện và quà tặng kèm không?',
    answer: 'Toàn bộ sản phẩm được giao nguyên hộp, nguyên seal với đầy đủ phụ kiện theo tiêu chuẩn xuất xưởng của nhà sản xuất (hộp máy, củ sạc/dây sạc chính hãng, tài liệu hướng dẫn, cây lấy sim...). Các chương trình quà tặng ưu đãi độc quyền của NovaShop (tai nghe tặng kèm, củ sạc nhanh, ốp lưng, voucher...) sẽ được đóng gói cẩn thận cùng kiện hàng và thể hiện rõ ràng trên đơn hàng điện tử.',
    highlights: ['Nguyên Hộp Đầy Đủ Phụ Kiện Hãng', 'Quà Tặng Kèm Đóng Gói Riêng Biệt'],
    relatedPolicyTab: 'warranty',
  },
  {
    id: 'faq-product-3',
    category: 'product',
    categoryLabel: 'Sản Phẩm & Xuất Xứ',
    question: 'Làm thế nào để kích hoạt và tra cứu bảo hành điện tử sau khi mua máy?',
    answer: 'Hệ thống NovaShop tự động kích hoạt bảo hành điện tử ngay khi đơn hàng được giao thành công. Thông tin bảo hành được liên kết trực tiếp với Số Điện Thoại quý khách dùng để đặt hàng và số IMEI/Serial của máy. Quý khách có thể đem máy đến bất kỳ Trung tâm bảo hành ủy quyền chính hãng của thương hiệu trên toàn quốc hoặc liên hệ tổng đài NovaShop để được hỗ trợ kiểm tra.',
    highlights: ['Tự Động Kích Hoạt Bảo Hành', 'Liên Kết Số Điện Thoại & IMEI', 'Hỗ Trợ TTBH Ủy Quyền Toàn Quốc'],
    relatedPolicyTab: 'warranty',
    isPopular: true,
  },

  // --- VẬN CHUYỂN & GIAO HÀNG ---
  {
    id: 'faq-shipping-1',
    category: 'shipping',
    categoryLabel: 'Vận Chuyển & Giao Hàng',
    question: 'NovaShop giao hàng trong bao lâu? Có hỗ trợ giao hỏa tốc 2 giờ không?',
    answer: 'NovaShop cung cấp 2 giải pháp giao hàng linh hoạt:\n• Giao Hỏa Tốc 2 Giờ (NovaSpeed): Áp dụng cho các đơn hàng tại nội thành TP. Hồ Chí Minh và Hà Nội khi đặt hàng từ 8h00 đến 18h00 mỗi ngày.\n• Giao Hàng Tiêu Chuẩn Toàn Quốc: Thời gian từ 1 - 3 ngày làm việc thông qua các đơn vị vận chuyển uy tín (Viettel Post, GHTK, GHN). Kiện hàng luôn được đóng hộp xốp chống va đập và bảo hiểm 100% giá trị hàng hóa.',
    highlights: ['Giao 2 Giờ Nội Thành (NovaSpeed)', 'Toàn Quốc Từ 1 - 3 Ngày', 'Bảo Hiểm 100% Giá Trị Hàng Hóa'],
    relatedPolicyTab: 'shipping',
    isPopular: true,
  },
  {
    id: 'faq-shipping-2',
    category: 'shipping',
    categoryLabel: 'Vận Chuyển & Giao Hàng',
    question: 'Chính sách miễn phí vận chuyển (Freeship) áp dụng cho đơn hàng nào?',
    answer: 'NovaShop áp dụng Miễn Phí Vận Chuyển Toàn Quốc (Freeship 100%) cho mọi đơn hàng có giá trị từ 300.000đ trở lên. Đối với các đơn hàng dưới 300.000đ, phí giao hàng tiêu chuẩn đồng giá chỉ từ 25.000đ - 30.000đ tùy khu vực địa lý.',
    highlights: ['Freeship Toàn Quốc Từ 300K', 'Phí Đồng Giá Chỉ Từ 25K Cho Đơn Nhỏ'],
    relatedPolicyTab: 'shipping',
    isPopular: true,
  },
  {
    id: 'faq-shipping-3',
    category: 'shipping',
    categoryLabel: 'Vận Chuyển & Giao Hàng',
    question: 'Tôi có được quyền kiểm tra hàng (Đồng kiểm) trước khi thanh toán không?',
    answer: 'Hoàn toàn ĐƯỢC! NovaShop khuyến khích và thực hiện chính sách Đồng Kiểm 100% đối với mọi đơn hàng. Khi shipper giao tới, quý khách có quyền mở thùng carton bên ngoài để kiểm tra đúng chủng loại, màu sắc, số lượng sản phẩm, tem niêm phong còn nguyên vẹn trước khi ký nhận hoặc thanh toán (nếu chọn COD).',
    highlights: ['Đồng Kiểm 100% Trước Khi Nhận', 'Kiểm Tra Đúng Model & Tem Niêm Phong'],
    relatedPolicyTab: 'shipping',
  },

  // --- ĐỔI TRẢ & BẢO HÀNH ---
  {
    id: 'faq-return-1',
    category: 'return',
    categoryLabel: 'Đổi Trả & Bảo Hành',
    question: 'Chính sách đổi trả 1-1 trong 30 ngày tại NovaShop được áp dụng như thế nào?',
    answer: 'Trong 30 ngày đầu tiên kể từ ngày nhận hàng, nếu sản phẩm phát sinh bất kỳ lỗi kỹ thuật nào từ nhà sản xuất (phần cứng, màn hình, nguồn, camera, loa, kết nối...), NovaShop sẽ đổi mới 100% thiết bị nguyên seal cùng model hoàn toàn miễn phí. Quý khách không cần tốn thời gian chờ đợi gửi hãng thẩm định phức tạp; NovaShop hỗ trợ nhân viên đến thu hồi máy cũ và giao máy mới tận nhà.',
    highlights: ['1 Đổi 1 Trong 30 Ngày', 'Máy Mới 100% Nguyên Seal', 'Thu Hồi Đổi Máy Tận Nơi'],
    relatedPolicyTab: 'return',
    isPopular: true,
  },
  {
    id: 'faq-return-2',
    category: 'return',
    categoryLabel: 'Đổi Trả & Bảo Hành',
    question: 'Điều kiện cần có để được giải quyết đổi trả sản phẩm là gì?',
    answer: 'Để được đổi trả thuận tiện, sản phẩm cần đáp ứng các điều kiện cơ bản sau:\n1. Sản phẩm còn giữ đầy đủ phụ kiện, không bị cấn móp, nứt vỡ nặng do tác động ngoại lực hoặc ngấm nước.\n2. Còn đầy đủ vỏ hộp trùng số IMEI/Serial, sách hướng dẫn, túi chống sốc đi kèm.\n3. Đã đăng xuất khỏi tài khoản cá nhân (iCloud, Google, Samsung Account...).\n4. Cung cấp Số Điện Thoại đặt hàng hoặc Mã đơn hàng để nhân viên tra cứu nhanh trên hệ thống.',
    highlights: ['Hộp & Phụ Kiện Đầy Đủ', 'Không Rơi Vỡ Ngấm Nước', 'Đăng Xuất Tài Khoản Cá Nhân'],
    relatedPolicyTab: 'return',
  },
  {
    id: 'faq-return-3',
    category: 'return',
    categoryLabel: 'Đổi Trả & Bảo Hành',
    question: 'Thời gian bảo hành chính hãng là bao lâu và quy trình gửi bảo hành ra sao?',
    answer: 'Toàn bộ thiết bị chính hãng tại NovaShop có thời hạn bảo hành từ 12 đến 24 tháng theo quy chuẩn của từng hãng. Khi cần bảo hành, quý khách có 2 lựa chọn tiện lợi:\n• Cách 1: Đem máy trực tiếp đến Trung tâm bảo hành ủy quyền gần nhất của hãng trên cả nước.\n• Cách 2: Liên hệ hotline NovaShop 0908061843, đội ngũ hỗ trợ sẽ tiếp nhận và điều phối vận chuyển bảo hành miễn phí 2 chiều cho quý khách.',
    highlights: ['Bảo Hành 12 - 24 Tháng', 'Vận Chuyển Bảo Hành 2 Chiều Miễn Phí', 'Hỗ Trợ Toàn Bộ TTBH Toàn Quốc'],
    relatedPolicyTab: 'warranty',
    isPopular: true,
  },

  // --- THANH TOÁN & ĐẶT HÀNG ---
  {
    id: 'faq-payment-1',
    category: 'payment',
    categoryLabel: 'Thanh Toán & Đặt Hàng',
    question: 'NovaShop hỗ trợ các hình thức thanh toán nào? Quét mã VietQR có an toàn không?',
    answer: 'NovaShop hỗ trợ hệ sinh thái thanh toán đa kênh tiện lợi và bảo mật chuẩn quốc tế:\n• Chuyển khoản VietQR Napas 24/7: Hệ thống tự động tạo mã QR có sẵn số tiền và nội dung, quét trên ứng dụng ngân hàng và nhận thông báo xác nhận thành công chỉ sau 2 giây.\n• Thẻ tín dụng/ghi nợ Visa/Mastercard: Mã hóa SSL 256-bit chuẩn PCI-DSS Level 1 có xác thực OTP 3D-Secure.\n• Thanh toán tiền mặt khi nhận hàng (COD).\n• Trả góp 0% qua thẻ tín dụng liên kết hơn 25 ngân hàng hàng đầu.',
    highlights: ['VietQR Tự Động Xác Nhận 2s', 'Mã Hóa 3D-Secure SSL 256-bit', 'Hỗ Trợ COD & Trả Góp 0%'],
    relatedPolicyTab: 'payment',
    isPopular: true,
  },
  {
    id: 'faq-payment-2',
    category: 'payment',
    categoryLabel: 'Thanh Toán & Đặt Hàng',
    question: 'Làm sao để tôi theo dõi và tra cứu lộ trình đơn hàng của mình?',
    answer: 'Quý khách có thể dễ dàng kiểm tra đơn hàng bất kỳ lúc nào:\n1. Nhấp vào nút "Đơn Hàng" hoặc "Tra Cứu Đơn Hàng" trên thanh điều hướng đầu trang hoặc tại chân trang web.\n2. Nhập Mã đơn hàng hoặc Số Điện Thoại đặt mua.\n3. Hệ thống sẽ hiển thị toàn bộ lộ trình: Tiếp nhận, Đang chuẩn bị hàng, Đang giao hàng cùng mã vận đơn theo thời gian thực.',
    highlights: ['Tra Cứu Nhanh Bằng SĐT / Mã Đơn', 'Cập Nhật Lộ Trình Thời Gian Thực'],
    relatedPolicyTab: 'terms',
  },
];

interface FaqPageProps {
  onBackToHome: () => void;
  onExploreProducts: () => void;
  onOpenPolicy: (tab: PolicyTabId) => void;
  onOpenOrders?: () => void;
  onShowToast?: (type: 'success' | 'info' | 'error', title: string, description?: string) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({
  onBackToHome,
  onExploreProducts,
  onOpenPolicy,
  onOpenOrders,
  onShowToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<string[]>([
    'faq-product-1',
    'faq-shipping-1',
    'faq-return-1'
  ]);

  const categories: { id: FaqCategory; label: string; icon: React.ElementType; count: number }[] = useMemo(() => {
    return [
      { id: 'all', label: 'Tất Cả Câu Hỏi', icon: HelpCircle, count: FAQ_DATA.length },
      { id: 'product', label: 'Sản Phẩm & Xuất Xứ', icon: Package, count: FAQ_DATA.filter(i => i.category === 'product').length },
      { id: 'shipping', label: 'Vận Chuyển & Giao Hàng', icon: Truck, count: FAQ_DATA.filter(i => i.category === 'shipping').length },
      { id: 'return', label: 'Đổi Trả & Bảo Hành', icon: RotateCcw, count: FAQ_DATA.filter(i => i.category === 'return').length },
      { id: 'payment', label: 'Thanh Toán & Đặt Hàng', icon: CreditCard, count: FAQ_DATA.filter(i => i.category === 'payment').length },
    ];
  }, []);

  const filteredFaqs = useMemo(() => {
    let result = FAQ_DATA;
    if (activeCategory !== 'all') {
      result = result.filter(item => item.category === activeCategory);
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(item =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.highlights?.some(h => h.toLowerCase().includes(q)) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExpandAll = () => {
    setExpandedIds(filteredFaqs.map(i => i.id));
  };

  const handleCollapseAll = () => {
    setExpandedIds([]);
  };

  const handlePrintFaq = () => {
    window.print();
  };

  return (
    <div className="space-y-5 sm:space-y-8 section-view-enter pb-12 sm:pb-16">
      
      {/* Breadcrumb Navigation & Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs text-slate-500 bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            onClick={onBackToHome}
            className="hover:text-indigo-600 transition-colors font-semibold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang Chủ</span>
          </button>
          <span>/</span>
          <span className="text-slate-900 font-bold shrink-0">Hỏi Đáp (FAQ)</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handlePrintFaq}
            className="hidden sm:inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In tài liệu</span>
          </button>
          <button
            onClick={onBackToHome}
            className="px-2.5 sm:px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-12 overflow-hidden border border-indigo-950 shadow-xl">
        <div className="absolute top-0 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] sm:text-xs font-bold px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>TRUNG TÂM GIẢI ĐÁP & HỖ TRỢ KHÁCH HÀNG</span>
          </div>

          <h1 className="text-xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Câu Hỏi Thường Gặp (FAQ) <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-indigo-300 to-emerald-300">
              Sản Phẩm, Thanh Toán VietQR & Bảo Hành
            </span>
          </h1>

          <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Tất cả những thông tin giải đáp chính thống về nguồn gốc sản phẩm chính hãng, thanh toán tự động qua mã QR, thời gian giao hỏa tốc 2 giờ và quy trình bảo hành đổi mới 1-1 trong 30 ngày.
          </p>

          {/* Quick Search */}
          <div className="pt-1 sm:pt-2 max-w-xl">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm thắc mắc (VD: hóa đơn VAT, đổi trả, bảo hành...)"
                className="w-full pl-10 sm:pl-12 pr-9 sm:pr-10 py-2.5 sm:py-3.5 bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-900 border border-slate-700/80 focus:border-indigo-400 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 outline-hidden transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs & Filter Toolbar */}
      <div id="faq-list-section" data-scroll-section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    smoothScrollToElement('faq-list-section', { offset: 12, highlight: false });
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Actions (Expand/Collapse all) */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0 self-end md:self-auto">
            <span className="text-slate-400 text-xs hidden sm:inline">
              Hiển thị {filteredFaqs.length} câu hỏi
            </span>
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2.5 py-1 text-xs text-indigo-600 hover:bg-indigo-50 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Mở tất cả
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Thu gọn
            </button>
          </div>
        </div>
      </div>

      {/* Main FAQ Accordion */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileQuestion className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">Không tìm thấy câu hỏi phù hợp</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Không có kết quả nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;. Quý khách có thể thử với từ khóa khác hoặc liên hệ hotline để được giải đáp ngay.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Xem tất cả câu hỏi
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedIds.includes(faq.id);

            let categoryBadgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
            if (faq.category === 'product') {
              categoryBadgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
            } else if (faq.category === 'shipping') {
              categoryBadgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            } else if (faq.category === 'return') {
              categoryBadgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
            } else if (faq.category === 'payment') {
              categoryBadgeBg = 'bg-sky-50 text-sky-700 border-sky-200';
            }

            return (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-indigo-200 shadow-md shadow-indigo-100/60 ring-1 ring-indigo-100'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Accordion Question Trigger */}
                <button
                  type="button"
                  onClick={() => toggleExpand(faq.id)}
                  aria-expanded={isExpanded}
                  className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-hidden"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${categoryBadgeBg}`}>
                        {faq.category === 'product' && <Package className="w-3 h-3" />}
                        {faq.category === 'shipping' && <Truck className="w-3 h-3" />}
                        {faq.category === 'return' && <RotateCcw className="w-3 h-3" />}
                        {faq.category === 'payment' && <CreditCard className="w-3 h-3" />}
                        <span>{faq.categoryLabel}</span>
                      </span>

                      {faq.isPopular && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          <Sparkles className="w-2.5 h-2.5 fill-rose-500" />
                          Phổ biến
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm sm:text-base font-bold transition-colors ${
                      isExpanded ? 'text-indigo-900' : 'text-slate-900 hover:text-indigo-600'
                    }`}>
                      {faq.question}
                    </h3>
                  </div>

                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 mt-1 ${
                    isExpanded ? 'bg-indigo-600 text-white rotate-180 shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Accordion Answer Content */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-slate-700 border-t border-slate-100 space-y-4">
                    <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line pt-2">
                      {faq.answer}
                    </div>

                    {/* Highlights pills */}
                    {faq.highlights && faq.highlights.length > 0 && (
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {faq.highlights.map((h, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200/80"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer Policy Links inside FAQ item */}
                    <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 text-xs">
                      {faq.relatedPolicyTab ? (
                        <button
                          type="button"
                          onClick={() => onOpenPolicy(faq.relatedPolicyTab!)}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold transition-colors cursor-pointer group"
                        >
                          <span>Xem điều khoản chính sách đầy đủ</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ) : null}

                      <span className="text-[11px] text-slate-400">
                        Cập nhật bởi Ban Pháp Chế & Dịch Vụ NovaShop
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Help Desks & Contact Information */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Vẫn Chưa Tìm Thấy Câu Trả Lời?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Đội ngũ chăm sóc khách hàng NovaShop sẵn sàng hỗ trợ bạn 24/7.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenPolicy('warranty')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chính Sách Toàn Diện</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3.5">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Hotline Bán Hàng & Hỗ Trợ</div>
              <a href="tel:0908061843" className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-colors">
                0908061843 (24/7)
              </a>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3.5">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Hòm Thư Doanh Nghiệp & CSKH</div>
              <a href="mailto:support@novashop.vn" className="text-sm font-black text-slate-900 hover:text-amber-600 transition-colors">
                support@novashop.vn
              </a>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3.5">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Tra Cứu Tiến Độ Đơn Hàng</div>
              {onOpenOrders ? (
                <button
                  type="button"
                  onClick={onOpenOrders}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer pt-0.5 block"
                >
                  Mở hộp thoại tra cứu →
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-700">Cập nhật 24/7</span>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
