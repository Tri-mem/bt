import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  Truck,
  CreditCard,
  Headphones,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  Send,
  Calendar,
  FileText,
  BadgeCheck,
  ChevronRight
} from 'lucide-react';
import { formatVND } from '../data/mockData';
import { Logo } from './Logo';
import { smoothScrollToElement } from '../utils/smoothScroll';

interface AboutPageProps {
  onBackToHome: () => void;
  onExploreProducts: () => void;
  onOpenPolicy: (tab: 'warranty' | 'shipping' | 'return' | 'payment' | 'security' | 'terms') => void;
  onShowToast?: (type: 'success' | 'info' | 'error', title: string, description?: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onBackToHome,
  onExploreProducts,
  onOpenPolicy,
  onShowToast,
}) => {
  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactTopic, setContactTopic] = useState('support');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<'hcm' | 'hn' | 'dn'>('hcm');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactMessage.trim()) {
      if (onShowToast) {
        onShowToast('error', 'Vui lòng điền đủ thông tin', 'Họ tên, số điện thoại và nội dung là bắt buộc.');
      }
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onShowToast) {
        onShowToast(
          'success',
          'Đã tiếp nhận yêu cầu liên hệ!',
          `Cảm ơn bạn ${contactName}. Bộ phận CSKH NovaShop sẽ liên hệ lại qua số ${contactPhone} trong vòng 30 phút.`
        );
      }
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    }, 600);
  };

  const branches = [
    {
      id: 'hcm' as const,
      city: 'TP. Hồ Chí Minh',
      name: 'Trụ Sở Chính & Flagship Store NovaShop',
      address: '219/20 đường số 12, Phường Bình Hưng Hòa, Quận Bình Tân, TP. Hồ Chí Minh',
      hotline: '0908061843',
      email: 'hcm@novashop.vn',
      hours: '08:00 - 21:30 (Cả Thứ Bảy, Chủ Nhật & Ngày Lễ)',
      features: ['Trải nghiệm sản phẩm thực tế', 'Kỹ thuật viên Apple & Android hỗ trợ trực tiếp', 'Khu vực thanh toán VietQR & Trả góp 0%', 'Kho hàng giao hỏa tốc 2 giờ'],
      badge: 'Trụ sở điều hành chính'
    },
    {
      id: 'hn' as const,
      city: 'Hà Nội',
      name: 'Chi Nhánh & Trung Tâm Bảo Hành NovaCare Miền Bắc',
      address: 'Tòa nhà TechHub, Tầng 3, Số 18 Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
      hotline: '024.7788.9922',
      email: 'hanoi@novashop.vn',
      hours: '08:30 - 21:00 (Từ Thứ Hai đến Chủ Nhật)',
      features: ['Trung tâm tiếp nhận bảo hành chính hãng', 'Khu vực demo Laptop & Màn hình đồ họa', 'Đổi trả bảo hành 1-1 trong 30 ngày', 'Giao hỏa tốc nội thành Hà Nội'],
      badge: 'TT Bảo hành ủy quyền'
    },
    {
      id: 'dn' as const,
      city: 'Đà Nẵng',
      name: 'Showroom & Điểm Phân Phối NovaShop Miền Trung',
      address: 'Số 186 Đường Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, TP. Đà Nẵng',
      hotline: '0236.3399.882',
      email: 'danang@novashop.vn',
      hours: '08:00 - 21:00 (Hàng ngày)',
      features: ['Showroom thiết bị âm thanh & phụ kiện cao cấp', 'Trạm giao nhận hỏa tốc khu vực miền Trung', 'Hỗ trợ kỹ thuật phần cứng & phần mềm'],
      badge: 'Chi nhánh miền Trung'
    }
  ];

  const milestones = [
    {
      year: '2021',
      title: 'Thành lập & Khởi nguyên thương hiệu',
      desc: 'Công ty Cổ phần Công nghệ NovaShop Việt Nam chính thức được cấp phép hoạt động, khởi đầu với sứ mệnh phân phối thiết bị công nghệ chính ngạch tại TP. Hồ Chí Minh.'
    },
    {
      year: '2022',
      title: 'Tiên phong tích hợp cổng thanh toán VietQR Napas',
      desc: 'Nâng cấp toàn diện hạ tầng thanh toán tự động, liên kết cùng 30+ ngân hàng Việt Nam và các cổng thanh toán đạt tiêu chuẩn an toàn bảo mật dữ liệu quốc tế.'
    },
    {
      year: '2023',
      title: 'Mở rộng mạng lưới phục vụ toàn quốc & Cột mốc 25.000 khách hàng',
      desc: 'Khai trương chi nhánh Hà Nội & Đà Nẵng, triển khai quy trình cam kết giao hàng hỏa tốc trong 2 giờ tại các đô thị trọng điểm và bảo hành 1 đổi 1 trong 30 ngày.'
    },
    {
      year: '2024 - 2026',
      title: 'Hệ sinh thái bán lẻ & Thanh toán đa kênh hàng đầu',
      desc: 'Chạm mốc 50.000+ khách hàng hài lòng, trở thành đối tác phân phối ủy quyền của các thương hiệu hàng đầu: Apple, Samsung, Sony, Asus, Dell, Sennheiser.'
    }
  ];

  const leadership = [
    {
      name: 'Nguyễn Thành Nam',
      role: 'Tổng Giám Đốc Điều Hành (CEO)',
      exp: '14+ năm kinh nghiệm quản trị chuỗi bán lẻ công nghệ và thương mại điện tử',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Trần Minh Đức',
      role: 'Giám Đốc Công Nghệ & Vận Hành (CTO)',
      exp: 'Chuyên gia an ninh mạng & kiến trúc hệ thống thanh toán trực tuyến VietQR / PCI-DSS',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Lê Hoàng Yến',
      role: 'Trưởng Ban Chăm Sóc Khách Hàng (Customer Success)',
      exp: '8+ năm dẫn dắt đội ngũ NovaCare với tiêu chuẩn giải quyết khiếu nại trong 2 giờ',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
    }
  ];

  return (
    <div className="w-full space-y-5 sm:space-y-8 section-view-enter pb-12 sm:pb-16">
      {/* Breadcrumb Navigation Bar */}
      <nav className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-slate-200/80 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onBackToHome}
            className="hover:text-indigo-600 font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Trang chủ</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Giới thiệu về chúng tôi</span>
        </div>

        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer py-1 px-2.5 sm:px-3 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại cửa hàng</span>
        </button>
      </nav>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-12 lg:p-16 border border-indigo-900/50 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4 sm:space-y-6">
          <div className="flex items-center gap-4">
            <Logo size="lg" variant="dark" />
          </div>

          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-400/30 text-[10px] sm:text-xs font-bold tracking-wide uppercase">
            <Building2 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span>Hồ Sơ Năng Lực Doanh Nghiệp Chính Thức</span>
          </div>

          <h1 className="text-xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            NovaShop — Tiên Phong Công Nghệ, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-blue-200">
              Trọn Vẹn Niềm Tin Số
            </span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-3xl">
            Chào mừng quý khách đến với <strong>NovaShop</strong> — Hệ thống thương mại điện tử chuyên cung cấp thiết bị công nghệ chính hãng, điện thoại, máy tính xách tay và giải pháp thanh toán số bảo mật hàng đầu Việt Nam. Chúng tôi đồng hành cùng hàng vạn người tiêu dùng hiện đại nâng tầm chất lượng cuộc sống.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
            <button
              onClick={onExploreProducts}
              className="px-4 sm:px-6 py-2.5 sm:py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Khám Phá 60+ Thiết Bị Chính Hãng</span>
            </button>

            <button
              type="button"
              onClick={() => smoothScrollToElement('about-branches-section')}
              className="px-4 sm:px-5 py-2.5 sm:py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>Hệ Thống Chi Nhánh</span>
            </button>

            <button
              type="button"
              onClick={() => smoothScrollToElement('about-contact-form')}
              className="px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4 text-sky-300" />
              <span>Liên Hệ & Góp Ý</span>
            </button>

            <a
              href="tel:0908061843"
              className="px-4 sm:px-5 py-2.5 sm:py-3.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-sky-300" />
              <span>Hotline: 0908061843</span>
            </a>
          </div>
        </div>

        {/* Highlight Stats Bar */}
        <div className="mt-12 pt-8 border-t border-indigo-800/40 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">50,000+</div>
            <div className="text-xs text-slate-300 font-medium">Khách hàng tin chọn toàn quốc</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
            <div className="text-xs text-slate-300 font-medium">Hàng chính hãng nguyên seal</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-sky-400">2 Giờ</div>
            <div className="text-xs text-slate-300 font-medium">Giao hỏa tốc nội thành</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-indigo-400">99.4%</div>
            <div className="text-xs text-slate-300 font-medium">Tỷ lệ đánh giá 5 sao hài lòng</div>
          </div>
        </div>
      </section>

      {/* Legal & Corporate Registration Overview */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Thông Tin Pháp Lý & Đăng Ký Doanh Nghiệp</h2>
            <p className="text-xs text-slate-500">Hoạt động tuân thủ theo quy định của pháp luật Thương mại điện tử Việt Nam</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-slate-400 font-medium">Tên doanh nghiệp đầy đủ</span>
            <p className="text-sm font-bold text-slate-800">CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVASHOP VIỆT NAM</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-slate-400 font-medium">Mã số thuế / Mã số doanh nghiệp</span>
            <p className="text-sm font-bold text-indigo-600 font-mono">0317892341</p>
            <p className="text-[11px] text-slate-500">Cấp bởi Sở Tài chính Thành phố Hồ Chí Minh</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-slate-400 font-medium">Trụ sở điều hành chính</span>
            <p className="text-sm font-semibold text-slate-800 leading-snug">
              219/20 đường số 12, Phường Bình Hưng Hòa, Quận Bình Tân, TP. Hồ Chí Minh
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-slate-400 font-medium">Tổng đài hỗ trợ 24/7</span>
            <p className="text-sm font-bold text-slate-800 font-mono">0908061843 (Cước gọi miễn phí)</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-slate-400 font-medium">Hòm thư điện tử chính thức</span>
            <p className="text-sm font-bold text-slate-800 font-mono">support@novashop.vn</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-slate-400 font-medium">Tiêu chuẩn bảo mật thanh toán</span>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Chứng chỉ quốc tế PCI-DSS Level 1</span>
            </p>
          </div>
        </div>
      </section>

      {/* Brand Story & Mission - Vision */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Câu Chuyện Thương Hiệu NovaShop</h2>
              <p className="text-xs text-slate-500">Hành trình xây dựng thương hiệu từ đam mê công nghệ</p>
            </div>
          </div>

          <div className="space-y-3.5 text-slate-600 text-xs sm:text-sm leading-relaxed">
            <p>
              NovaShop được khởi xướng với một niềm tin mãnh liệt: <strong className="text-slate-900">Người tiêu dùng Việt Nam xứng đáng được tiếp cận với những thiết bị công nghệ tiên tiến nhất với mức giá minh bạch, nguồn gốc chuẩn chỉ và trải nghiệm dịch vụ hậu mãi xuất sắc.</strong>
            </p>
            <p>
              Trong bối cảnh thị trường công nghệ còn tồn tại nhiều hàng trôi nổi, xách tay thiếu bảo hành hoặc rủi ro thanh toán lừa đảo, NovaShop chọn hướng đi kiên định với <strong>100% hàng nhập khẩu chính ngạch nguyên seal</strong>, hóa đơn VAT đầy đủ và bảo hành điện tử chính hãng từ 12 đến 24 tháng.
            </p>
            <p>
              Đặc biệt, NovaShop là một trong những đơn vị tiên phong áp dụng hệ thống tạo mã <strong>VietQR Napas tự động</strong> chuẩn ngân hàng, giúp khách hàng thanh toán tức thì mà không cần nhập tay số tài khoản hay lo lắng chuyển nhầm tiền.
            </p>
          </div>

          {/* 4 Golden Commitments */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm mb-3">4 Cam Kết Vàng Đối Với Mỗi Khách Hàng:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-900">100% Hàng Chính Hãng</strong>
                  <span>Phát hiện hàng giả bồi thường 200% giá trị đơn hàng ngay lập tức.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-blue-900">1 Đổi 1 Trong 30 Ngày</strong>
                  <span>Nếu thiết bị phát sinh lỗi từ nhà sản xuất, đổi ngay máy mới nguyên hộp.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-indigo-900">Giao Hàng Hỏa Tốc 2 Giờ</strong>
                  <span>Đội ngũ giao vận nội thành chuyên biệt, đóng gói 3 lớp chống sốc.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-xs text-amber-950">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-900">Thanh Toán An Toàn Tuyệt Đối</strong>
                  <span>Hỗ trợ VietQR quét mã tức thời, thẻ quốc tế 3D Secure, COD kiểm tra trước.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vision & Mission Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Tầm Nhìn Đến 2030</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trở thành thương hiệu bán lẻ thiết bị công nghệ & giải pháp thanh toán số được tin cậy số 1 tại Việt Nam, kết nối hàng triệu người tiêu dùng với những đỉnh cao công nghệ toàn cầu.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Sứ Mệnh Của Chúng Tôi</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xóa bỏ rào cản công nghệ, mang đến cho người tiêu dùng sự an tâm tuyệt đối trong từng lượt giao dịch và bảo vệ quyền lợi chính đáng của khách hàng qua chính sách bảo hành tận tâm.
            </p>
          </div>
        </div>
      </section>

      {/* Milestones & Growth Timeline */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Cột Mốc Phát Triển Của NovaShop</h2>
              <p className="text-xs text-slate-500">Những dấu ấn khẳng định sự phát triển không ngừng</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {milestones.map((m, idx) => (
            <div
              key={m.year}
              className="p-5 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-200 transition-all duration-200 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-indigo-600 font-mono">{m.year}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Giai đoạn 0{idx + 1}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">{m.title}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showrooms & Service Centers Network */}
      <section id="about-branches-section" data-scroll-section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Hệ Thống Trụ Sở & Trung Tâm Trải Nghiệm</h2>
              <p className="text-xs text-slate-500">Mạng lưới 3 miền sẵn sàng tiếp đón và phục vụ quý khách</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedBranch === b.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {b.city}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Branch Detail */}
        {(() => {
          const current = branches.find((b) => b.id === selectedBranch) || branches[0];
          return (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-5 border border-indigo-900/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="inline-block text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30 mb-2">
                    {current.badge}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold">{current.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${current.hotline}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi Ngay: {current.hotline}</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-2 border-t border-indigo-800/50">
                <div className="space-y-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" /> Địa chỉ tiếp đón:
                  </span>
                  <p className="font-semibold text-white">{current.address}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Giờ làm việc:
                  </span>
                  <p className="font-semibold text-white">{current.hours}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-sky-400" /> Email hỗ trợ:
                  </span>
                  <p className="font-semibold text-white font-mono">{current.email}</p>
                </div>
              </div>

              <div className="pt-3">
                <span className="text-xs font-bold text-slate-200 block mb-2">Dịch vụ cung cấp tại chi nhánh:</span>
                <div className="flex flex-wrap gap-2">
                  {current.features.map((feat, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/10 text-slate-200 rounded-lg text-xs font-medium border border-white/15 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Leadership & Technical Advisors */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Đội Ngũ Quản Trị & Chuyên Gia Kỹ Thuật</h2>
            <p className="text-xs text-slate-500">Những con người tâm huyết đứng sau chất lượng phục vụ tại NovaShop</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leadership.map((person, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-all flex flex-col items-center text-center space-y-3"
            >
              <img
                src={person.avatar}
                alt={person.name}
                className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900">{person.name}</h4>
                <p className="text-xs font-semibold text-indigo-600">{person.role}</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{person.exp}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Authorized Brands & Payment Partners */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
          Đối Tác Chiến Lược & Cổng Thanh Toán Trực Tuyến Được Cấp Phép
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-2">
          {['VietQR Napas', 'Apple Authorized', 'Samsung Official', 'Sony Vietnam', 'ASUS ROG', 'VISA / MasterCard', 'MoMo', 'VNPay'].map((partner) => (
            <div
              key={partner}
              className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs"
            >
              {partner}
            </div>
          ))}
        </div>
      </section>

      {/* Online Contact & Feedback Form */}
      <section id="about-contact-form" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gửi Thư Góp Ý & Liên Hệ Hợp Tác</h2>
            <p className="text-xs text-slate-500">NovaShop luôn lắng nghe mọi phản hồi để không ngừng nâng cao chất lượng</p>
          </div>
        </div>

        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Họ và tên quý khách *</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Số điện thoại liên hệ *</label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="0908xxxxxx"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Địa chỉ Email (Nếu có)</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Chủ đề liên hệ</label>
            <select
              value={contactTopic}
              onChange={(e) => setContactTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-700 cursor-pointer"
            >
              <option value="support">Tư vấn chọn mua thiết bị công nghệ</option>
              <option value="warranty">Hỗ trợ bảo hành & Kỹ thuật thiết bị</option>
              <option value="feedback">Góp ý chất lượng dịch vụ & Nhân viên</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Nội dung chi tiết *</label>
            <textarea
              required
              rows={4}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Quý khách vui lòng nhập chi tiết câu hỏi hoặc yêu cầu hỗ trợ..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Thông tin của quý khách được bảo mật theo tiêu chuẩn riêng tư.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Thư Liên Hệ'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Bottom CTA to Return to Shopping */}
      <section className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white font-bold px-3 py-1 rounded-full text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>MUA SẮM CÔNG NGHỆ KHÔNG LO VỀ GIÁ</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Sẵn Sàng Trải Nghiệm Mua Sắm Tại NovaShop?</h3>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
            Khám phá ngay bộ sưu tập 60+ sản phẩm hàng đầu: PS5, Nintendo Switch OLED, Apple HomePod mini, iPhone 16 Pro, MacBook Pro M3, Flycam DJI và nhận ngay voucher ưu đãi lên đến 1.000.000đ.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            onClick={onExploreProducts}
            className="px-6 py-3.5 bg-white text-indigo-900 hover:bg-slate-100 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            <span>Xem Danh Mục Sản Phẩm</span>
          </button>

          <button
            onClick={onBackToHome}
            className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <span>Về Trang Chủ</span>
          </button>
        </div>
      </section>
    </div>
  );
};
