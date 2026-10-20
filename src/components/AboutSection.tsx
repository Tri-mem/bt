import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Award, 
  Truck, 
  RotateCcw, 
  CreditCard, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Briefcase 
} from 'lucide-react';
import { Logo } from './Logo';

interface AboutSectionProps {
  onOpenPolicy?: (tab: any) => void;
  onExploreProducts?: () => void;
  onOpenFullAboutPage?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onOpenPolicy,
  onExploreProducts,
  onOpenFullAboutPage,
}) => {
  return (
    <section id="ve-chung-toi" className="my-12 scroll-mt-20">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-100 overflow-hidden">
        
        {/* Header Hero Banner */}
        <div className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 lg:p-14 overflow-hidden">
          {/* Decorative background glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <Logo size="lg" variant="dark" />
            </div>

            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold px-3.5 py-1.5 rounded-full">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>VỀ CHÚNG TÔI • HỆ THỐNG NOVASHOP VIỆT NAM</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Tiên Phong Công Nghệ, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300">
                Trọn Vẹn Niềm Tin Số
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              NovaShop ra đời với sứ mệnh mang tới người tiêu dùng Việt Nam trải nghiệm mua sắm thiết bị công nghệ chính hãng 100% minh bạch, kết hợp hệ thống thanh toán điện tử thông minh bảo mật đa tầng.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onOpenFullAboutPage && (
                <button
                  type="button"
                  onClick={onOpenFullAboutPage}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-900" />
                  <span>Trang Giới Thiệu NovaShop →</span>
                </button>
              )}

              <button
                type="button"
                onClick={onExploreProducts}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Khám Phá 60+ Sản Phẩm</span>
              </button>

              <a
                href="tel:0908061843"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-xs transition-all flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Hotline: 0908061843</span>
              </a>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
          <div className="p-6 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">50,000+</span>
            <p className="text-xs text-slate-600 font-medium">Khách hàng tin chọn</p>
          </div>
          <div className="p-6 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">100%</span>
            <p className="text-xs text-slate-600 font-medium">Chính hãng nguyên seal</p>
          </div>
          <div className="p-6 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">2 Giờ</span>
            <p className="text-xs text-slate-600 font-medium">Giao hàng hỏa tốc nội thành</p>
          </div>
          <div className="p-6 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">99.4%</span>
            <p className="text-xs text-slate-600 font-medium">Đánh giá hài lòng 5 sao</p>
          </div>
        </div>

        {/* Story & Core Values Grid */}
        <div className="p-6 sm:p-10 lg:p-12 space-y-12">
          
          {/* Section 1: Story & Vision */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Hành Trình Kiến Tạo</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Hệ Sinh Thái Mua Sắm & Thanh Toán Hiện Đại Cho Người Việt
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Được thành lập từ năm 2021 bởi những chuyên gia công nghệ tâm huyết, <strong>NovaShop</strong> đã và đang khẳng định vị thế là điểm đến tin cậy của hàng chục nghìn tín đồ công nghệ, chuyên gia đồ họa và game thủ trên toàn quốc.
              </p>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Chúng tôi hiểu rằng mỗi sản phẩm công nghệ không chỉ là thiết bị phần cứng, mà là công cụ đắc lực phục vụ công việc, sáng tạo và giải trí hàng ngày của bạn. Vì vậy, NovaShop kiên quyết chỉ phân phối sản phẩm chính ngạch, đi kèm chế độ bảo hành chuẩn ủy quyền và hỗ trợ kỹ thuật trọn đời.
              </p>
              
              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 font-medium">Bảo hành điện tử chính hãng 12 - 24 tháng</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 font-medium">Cổng thanh toán VietQR & Thẻ 3D Secure</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 font-medium">1 đổi 1 trong 30 ngày nếu phát sinh lỗi</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 font-medium">Đội ngũ kỹ thuật tư vấn chuẩn xác 24/7</span>
                </div>
              </div>
            </div>

            {/* Vision & Mission Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  🎯
                </div>
                <h4 className="font-extrabold text-indigo-950 text-sm">Tầm Nhìn 2030</h4>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  Trở thành chuỗi bán lẻ thiết bị công nghệ & dịch vụ số được người dùng Việt Nam yêu thích và tin tưởng nhất với hệ sinh thái trải nghiệm liền mạch từ online đến offline.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  🚀
                </div>
                <h4 className="font-extrabold text-emerald-950 text-sm">Sứ Mệnh Cốt Lõi</h4>
                <p className="text-xs text-emerald-900/80 leading-relaxed">
                  Bình dân hóa công nghệ đỉnh cao, bảo vệ quyền lợi người tiêu dùng bằng mức giá minh bạch, chính sách hậu mãi vượt trội và hệ thống thanh toán không tiền mặt an toàn.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: 4 Core Pillars */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="text-center max-w-xl mx-auto space-y-1.5">
              <h3 className="text-xl font-black text-slate-900">4 Cam Kết Vàng Từ NovaShop</h3>
              <p className="text-xs text-slate-500">
                Tiêu chuẩn dịch vụ khắt khe đảm bảo sự an tâm tuyệt đối của quý khách hàng
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all space-y-3 bg-white">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">100% Chính Hãng</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sản phẩm nguyên seal xuất xứ rõ ràng. Đền 200% giá trị đơn hàng nếu phát hiện hàng giả, hàng nhái.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all space-y-3 bg-white">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Thanh Toán An Toàn</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Chuyển khoản VietQR tự động xác nhận trong 5 giây, bảo mật thẻ quốc tế 3D-Secure chuẩn quốc tế.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all space-y-3 bg-white">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Giao Hàng Siêu Tốc</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Giao hỏa tốc 2 giờ tại nội thành TP.HCM & Hà Nội. Miễn phí ship toàn quốc cho đơn hàng từ 300.000₫.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all space-y-3 bg-white">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Đổi Trả 30 Ngày</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lỗi phần cứng do nhà sản xuất được 1 đổi 1 ngay lập tức. Hỗ trợ thu cũ đổi mới lên đời trợ giá cao.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Headquarters & Store Network */}
          <div className="pt-6 border-t border-slate-100">
            <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>Hệ Thống Trụ Sở & Điểm Trải Nghiệm</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">
                    Sẵn Sàng Đón Tiếp Quý Khách
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="tel:0908061843"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi Hotline Ngay</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Branch 1 - Main Headquarters */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">Trụ Sở Chính & Flagship Store</span>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-semibold">TP.HCM</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-medium">
                    📍 219/20 đường số 12, phường Bình Hưng Hòa, TP. Hồ Chí Minh
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    🕒 08:00 - 21:30 (Thứ 2 - Chủ Nhật)
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    📞 0908061843
                  </p>
                </div>

                {/* Branch 2 - Hanoi */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">Chi Nhánh & Trung Tâm Bảo Hành</span>
                    <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded font-semibold">Hà Nội</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-medium">
                    📍 Tòa nhà TechHub, Số 18 Duy Tân, Cầu Giấy, TP. Hà Nội
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    🕒 08:30 - 21:00 (Thứ 2 - Chủ Nhật)
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    📞 0908061843
                  </p>
                </div>

                {/* Branch 3 - Da Nang */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">Chi Nhánh Miền Trung</span>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">Đà Nẵng</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-medium">
                    📍 186 Nguyễn Văn Linh, Quận Thanh Khê, TP. Đà Nẵng
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    🕒 08:30 - 20:30 (Thứ 2 - Chủ Nhật)
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    📞 0908061843
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
