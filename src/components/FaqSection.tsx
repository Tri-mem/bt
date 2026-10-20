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
  ExternalLink,
  X,
  FileQuestion,
  Headphones,
  ArrowRight,
  BadgeCheck
} from 'lucide-react';
import { PolicyTabId } from './PolicyModal';

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

interface FaqSectionProps {
  onOpenPolicy?: (tab: PolicyTabId) => void;
  onOpenOrders?: () => void;
  onContactSupport?: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  onOpenPolicy,
  onOpenOrders,
  onContactSupport,
}) => {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<string[]>(['faq-product-1', 'faq-shipping-1', 'faq-return-1']);

  const categories: { id: FaqCategory; label: string; icon: React.ElementType; count: number }[] = useMemo(() => {
    return [
      { id: 'all', label: 'Tất Cả Thắc Mắc', icon: HelpCircle, count: FAQ_DATA.length },
      { id: 'product', label: 'Sản Phẩm & Xuất Xứ', icon: Package, count: FAQ_DATA.filter(i => i.category === 'product').length },
      { id: 'shipping', label: 'Vận Chuyển & Giao Hàng', icon: Truck, count: FAQ_DATA.filter(i => i.category === 'shipping').length },
      { id: 'return', label: 'Đổi Trả & Bảo Hành', icon: RotateCcw, count: FAQ_DATA.filter(i => i.category === 'return').length },
      { id: 'payment', label: 'Thanh Toán & Đặt Hàng', icon: CreditCard, count: FAQ_DATA.filter(i => i.category === 'payment').length },
    ];
  }, []);

  // Filtered FAQ items based on category and search query
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

  return (
    <section id="faq-section" className="my-12 scroll-mt-20">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-100 overflow-hidden">
        
        {/* Header Hero Banner */}
        <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-12 overflow-hidden">
          {/* Decorative ambient glows */}
          <div className="absolute top-0 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold px-3.5 py-1.5 rounded-full">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>HỎI ĐÁP & HỖ TRỢ KHÁCH HÀNG • FAQ</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Các Câu Hỏi Thường Gặp <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-indigo-300 to-emerald-300">
                Về Sản Phẩm, Giao Hàng & Đổi Trả
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Giải đáp nhanh chóng những câu hỏi phổ biến nhất của quý khách về nguồn gốc thiết bị, quy cách đóng gói, chính sách miễn phí giao hàng và quy trình bảo hành đổi mới 1-1 trong 30 ngày.
            </p>

            {/* Quick Search Bar */}
            <div className="pt-2 max-w-xl">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm câu hỏi (ví dụ: đổi trả, bảo hành, freeship, kiểm hàng, IMEI...)"
                  className="w-full pl-12 pr-10 py-3.5 bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-900 border border-slate-700/80 focus:border-indigo-400 rounded-2xl text-sm text-white placeholder-slate-400 outline-hidden transition-all shadow-inner"
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
        <div className="border-b border-slate-200 bg-slate-50/80 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
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

        {/* FAQ Accordion List */}
        <div className="p-4 sm:p-6 lg:p-8">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileQuestion className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-base">Không tìm thấy câu hỏi phù hợp</h4>
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
            <div className="space-y-3.5">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedIds.includes(faq.id);
                
                // Color badge based on category
                let categoryBadgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                if (faq.category === 'product') {
                  categoryBadgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
                } else if (faq.category === 'shipping') {
                  categoryBadgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                } else if (faq.category === 'return') {
                  categoryBadgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
                } else if (faq.category === 'payment') {
                  categoryBadgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
                }

                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'border-indigo-200 bg-white shadow-md shadow-indigo-100/60 ring-1 ring-indigo-100'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Accordion Header / Question Trigger */}
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

                    {/* Accordion Content / Answer Body */}
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
                                className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200/80"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{h}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Bottom action for related policy */}
                        {faq.relatedPolicyTab && onOpenPolicy && (
                          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                            <span className="text-[11px] text-slate-400">
                              Cần xem quy định pháp lý chi tiết hơn?
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenPolicy(faq.relatedPolicyTab!)}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs font-bold transition-colors cursor-pointer group"
                            >
                              <span>Xem văn bản chính sách</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Support Assistance Box */}
        <div className="bg-slate-50 border-t border-slate-200/80 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Box 1: Hotline 24/7 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tổng đài giải đáp 24/7</p>
                <a 
                  href="tel:0908061843" 
                  className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  0908061843
                </a>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Miễn phí cước gọi
                </p>
              </div>
            </div>

            {/* Box 2: Order Lookup */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 flex-1">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tra cứu đơn hàng</p>
                <p className="text-xs text-slate-600">Kiểm tra tiến độ giao hàng tức thì</p>
                {onOpenOrders && (
                  <button
                    type="button"
                    onClick={onOpenOrders}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer inline-flex items-center gap-1 pt-0.5"
                  >
                    <span>Tra cứu ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Box 3: 30-Day Return Policy */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 flex-1">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Đổi mới 1-1 trong 30 ngày</p>
                <p className="text-xs text-slate-600">Lỗi do nhà sản xuất đổi ngay máy mới</p>
                {onOpenPolicy && (
                  <button
                    type="button"
                    onClick={() => onOpenPolicy('return')}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer inline-flex items-center gap-1 pt-0.5"
                  >
                    <span>Xem quy trình đổi trả</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
