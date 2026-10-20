import React, { useState, useEffect } from 'react';
import { 
  X, 
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
  CalendarClock
} from 'lucide-react';

export type PolicyTabId = 'warranty' | 'return' | 'shipping' | 'security' | 'payment' | 'terms' | 'installment';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyTabId;
  onTabChange?: (tab: PolicyTabId) => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'warranty',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTabId>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const tabs: { id: PolicyTabId; label: string; icon: React.ElementType }[] = [
    { id: 'warranty', label: 'Bảo hành chính hãng', icon: ShieldCheck },
    { id: 'installment', label: 'Chính sách trả góp 0%', icon: CalendarClock },
    { id: 'return', label: 'Chính sách trả hàng & hoàn tiền', icon: RotateCcw },
    { id: 'shipping', label: 'Chính sách vận chuyển', icon: Truck },
    { id: 'security', label: 'Chính sách bảo mật', icon: Lock },
    { id: 'payment', label: 'Hướng dẫn thanh toán VietQR', icon: CreditCard },
    { id: 'terms', label: 'Quy chế hoạt động', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div 
        id="policy-services-modal"
        className="relative bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 flex items-center justify-between gap-2 bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">Trung Tâm Chính Sách & Dịch Vụ</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Cam kết chất lượng, bảo hành minh bạch và hỗ trợ 24/7</p>
            </div>
          </div>
          <button
            id="close-policy-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout: Left Tabs Sidebar, Right Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Tabs Menu */}
          <div className="w-full md:w-64 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200/80 p-2 sm:p-3 space-y-0 md:space-y-1 overflow-x-auto md:overflow-y-auto scrollbar-none shrink-0 flex md:flex-col gap-1.5 md:gap-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`policy-tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    onTabChange?.(tab.id);
                  }}
                  className={`md:w-full text-left px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap md:whitespace-normal shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Quick Contact Box in Sidebar */}
            <div className="hidden md:block mt-6 p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs space-y-2">
              <span className="font-bold text-indigo-900 block text-[11px] uppercase tracking-wider">Hỗ trợ 24/7 trực tiếp</span>
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <strong className="text-slate-900">0908061843</strong>
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>219/20 đường số 12, P. Bình Hưng Hòa, TP. Hồ Chí Minh</span>
              </p>
              <p className="text-[10px] font-semibold text-indigo-700 pt-1 border-t border-indigo-200/70">
                ✓ VietQR 24/7 • Giao Nhanh 2H • 100% Chính Hãng • Đổi Trả 30 Ngày
              </p>
            </div>
          </div>

          {/* Right Content Details */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-4 sm:space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
            
            {/* TAB 1: BẢO HÀNH CHÍNH HÃNG */}
            {activeTab === 'warranty' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Tiêu chuẩn bảo hành</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">Chính Sách Bảo Hành Chính Hãng 12 - 24 Tháng</h3>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-emerald-900">Cam kết 100% linh kiện chính hãng</p>
                    <p className="text-emerald-800">
                      Tất cả các sản phẩm thiết bị điện tử, điện thoại, máy tính xách tay và phụ kiện phân phối bởi NovaShop đều đi kèm bảo hành điện tử chính hãng từ 12 đến 24 tháng theo số Serial/IMEI.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">1. Điều kiện được tiếp nhận bảo hành:</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                    <li>Sản phẩm còn trong thời hạn bảo hành tính từ ngày xuất hóa đơn điện tử hoặc kích hoạt mã bảo hành online.</li>
                    <li>Tem niêm phong, số IMEI/Serial number còn nguyên vẹn, không bị cạo sửa, tẩy xóa hoặc rách nát.</li>
                    <li>Lỗi hư hỏng được xác định do lỗi kỹ thuật hoặc linh kiện từ nhà sản xuất (Apple, Samsung, Sony, Dell, Logitech,...).</li>
                    <li>Sản phẩm không thuộc các trường hợp từ chối bảo hành do ngoại lực tác động.</li>
                  </ul>

                  <h4 className="font-bold text-slate-900 text-sm pt-2">2. Các trường hợp từ chối bảo hành:</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                    <li>Sản phẩm bị ngấm nước hoặc chất lỏng vượt quá chuẩn kháng nước công bố của nhà sản xuất.</li>
                    <li>Sản phẩm bị móp méo, nứt vỡ màn hình, biến dạng do rơi rớt, va đập hoặc tự ý tháo mở, sửa chữa tại các đơn vị không được ủy quyền.</li>
                    <li>Hư hỏng do sử dụng sai nguồn điện, chập cháy nổ hoặc thiên tai, sét đánh.</li>
                  </ul>

                  <h4 className="font-bold text-slate-900 text-sm pt-2">3. Địa điểm và thời gian xử lý:</h4>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <p>📍 <strong>Trung tâm tiếp nhận:</strong> 219/20 đường số 12, phường Bình Hưng Hòa, thành phố Hồ Chí Minh</p>
                    <p>📞 <strong>Hotline bảo hành kỹ thuật:</strong> 0908061843 (Hỗ trợ 8h00 - 21h00 các ngày trong tuần)</p>
                    <p>⏱️ <strong>Thời gian xử lý:</strong> Từ 3 - 7 ngày làm việc. Quý khách được mượn máy tương đương dùng tạm trong quá trình chờ bảo hành đối với các sản phẩm điện thoại và laptop.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CHÍNH SÁCH TRẢ GÓP 0% */}
            {activeTab === 'installment' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Tài chính tiện lợi</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">Chính Sách Mua Hàng Trả Góp 0% Lãi Suất</h3>
                  <p className="text-xs text-slate-500">NovaShop liên kết trực tiếp với 25+ ngân hàng và 4 công ty tài chính hàng đầu</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                      <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px]">0%</span>
                      <span>Trả góp qua Thẻ tín dụng</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                      <li>Áp dụng cho thẻ tín dụng (Visa, MasterCard, JCB) của 25+ ngân hàng đối tác.</li>
                      <li><strong>Lãi suất 0%</strong> trong suốt kỳ hạn (3, 6, 9, 12, 18, 24 tháng).</li>
                      <li><strong>Miễn phí chuyển đổi hồ sơ</strong> (NovaShop tài trợ 100%).</li>
                      <li>Không cần trả trước, không cần giấy tờ, duyệt hạn mức online ngay lập tức.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-xs">
                      <span className="p-1.5 rounded-lg bg-indigo-600 text-white font-black text-[10px]">CCCD</span>
                      <span>Trả góp qua Công ty tài chính</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                      <li>Đối tác: Home Credit, FE Credit, HD SAISON, Mirae Asset.</li>
                      <li><strong>Chỉ cần CCCD gắn chip</strong> (độ tuổi từ 18 - 60 tuổi).</li>
                      <li>Không cần chứng minh thu nhập hay sao kê lương.</li>
                      <li>Trả trước chỉ từ 0% đến 20% giá trị sản phẩm, xét duyệt online 5 phút.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">Quy trình 3 bước mua trả góp 0% tại NovaShop:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-1.5">1</span>
                      <strong className="block text-slate-900">Chọn sản phẩm & Kỳ hạn</strong>
                      <span className="text-slate-500 text-[11px]">Bấm nút "TRẢ GÓP 0%" trên bất kỳ sản phẩm nào để mở bảng tính tài chính tự động.</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-1.5">2</span>
                      <strong className="block text-slate-900">Điền hồ sơ online 5 phút</strong>
                      <span className="text-slate-500 text-[11px]">Nhập họ tên, số điện thoại, CCCD hoặc thông tin thẻ để hệ thống gửi phê duyệt tự động.</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-1.5">3</span>
                      <strong className="block text-slate-900">Nhận máy tận nơi</strong>
                      <span className="text-slate-500 text-[11px]">Chuyên viên xác nhận và giao máy tận nhà hoặc nhận tại Showroom 123 Lê Lợi.</span>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm pt-2">Quyền lợi bảo hành khi mua trả góp:</h4>
                  <p className="text-slate-600">
                    Sản phẩm mua trả góp tại NovaShop được hưởng <strong>100% quyền lợi bảo hành chính hãng và chính sách đổi trả 1-1 trong 30 ngày</strong> hoàn toàn tương tự như hình thức thanh toán một lần.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN */}
            {activeTab === 'return' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Chính sách trả hàng, đổi mới 1-1 & hoàn tiền đảm bảo</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5 uppercase">CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN WEBSITE TMĐT NOVASHOP.VN</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Ban hành theo Luật Bảo vệ quyền lợi người tiêu dùng, Nghị định 52/2013/NĐ-CP & Cơ chế NovaShop Đảm Bảo (10 Điều khoản)</p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-amber-900">Cam kết Đổi mới 1-1 trong 30 ngày đầu & Hoàn tiền 100% trong 24 giờ</p>
                    <p className="text-amber-800">
                      Trong vòng 30 ngày kể từ ngày nhận hàng, nếu sản phẩm phát sinh lỗi kỹ thuật phần cứng từ nhà sản xuất, Người Mua được đổi ngay máy mới 100% nguyên seal cùng model hoặc hoàn tiền 100% hoàn toàn miễn phí vận chuyển thu hồi hai chiều.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">1 & 2. Phạm vi & Điều kiện áp dụng Trả hàng / Hoàn tiền</h4>
                    <p>Áp dụng khi: (a) Người Mua đã thanh toán nhưng không nhận được hàng hoặc nhận thiếu sản phẩm/phụ kiện/quà tặng; (b) Sản phẩm bị lỗi kỹ thuật phần cứng từ nhà sản xuất; (c) Sản phẩm bị hư hại, bể vỡ trong quá trình vận chuyển; (d) Giao sai model, màu sắc, cấu hình hoặc khác biệt rõ rệt so với mô tả; (e) Đổi nâng cấp lên dòng sản phẩm cao hơn khi hộp còn nguyên seal.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">3. Thời hạn gửi yêu cầu Đổi trả & Hoàn tiền</h4>
                    <p>• <strong>30 ngày đầu tiên:</strong> Đổi mới 1-1 nguyên seal hoặc Hoàn tiền 100% nếu sản phẩm phát sinh lỗi phần cứng từ nhà sản xuất.<br />• <strong>15 ngày đầu tiên:</strong> Yêu cầu Trả hàng / Hoàn tiền nếu giao sai sản phẩm, khác mô tả hoặc đổi nâng cấp máy nguyên seal.<br />• <strong>24 – 48 giờ đầu tiên:</strong> Khiếu nại giao thiếu hàng, thiếu phụ kiện hoặc kiện hàng móp méo do vận chuyển (kèm video mở hộp).</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">4. Các trường hợp Không áp dụng Trả hàng / Hoàn tiền</h4>
                    <p>Quá thời hạn quy định; sản phẩm không lỗi nhưng đã bóc seal/kích hoạt bảo hành điện tử (Active Online) đối với lý do đổi ý; hư hỏng do lỗi người dùng (rơi vỡ, cấn móp, vào nước, tự ý tháo mở/can thiệp phần cứng); số Serial/IMEI không trùng khớp; hoặc thiết bị còn khóa tài khoản iCloud/Google/Samsung Account.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">5 & 6. Tình trạng hàng hoàn trả, Đóng gói & Chi phí vận chuyển</h4>
                    <p>Sản phẩm hoàn trả cần đầy đủ hộp gốc trùng IMEI/Serial, phụ kiện sạc cáp và quà tặng đi kèm; đóng gói trong hộp carton cứng có chống sốc. <strong>NovaShop miễn phí 100% chi phí vận chuyển trả hàng 2 chiều</strong> (Shipper đến lấy hàng tận nhà miễn phí hoặc hoàn 100% phí gửi bưu cục).</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">7 & 8. Quy trình 4 bước & Thời gian hoàn tiền</h4>
                    <p>• <strong>Quy trình:</strong> (1) Gửi yêu cầu online/Hotline → (2) Shipper thu hồi tận nơi miễn phí → (3) Thẩm định kỹ thuật trong 24h → (4) Giao máy mới hoặc Hoàn tiền 100%.<br />• <strong>Thời gian hoàn tiền:</strong> VietQR Napas247 / Chuyển khoản / COD hoàn trong <strong>2 – 24 giờ</strong>; Ví MoMo/VNPay hoàn trong <strong>24 – 48 giờ</strong>; Thẻ quốc tế Visa/MasterCard/JCB hoàn hạn mức trong <strong>5 – 10 ngày làm việc</strong>. Hoàn lại 100% điểm NovaPoints đã dùng.</p>
                  </div>

                  <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-1 text-slate-800">
                    <h4 className="font-bold text-indigo-950 text-sm">9 & 10. Giải quyết tranh chấp & Trung tâm tiếp nhận Đổi trả NovaCare</h4>
                    <p>• Hỗ trợ cơ chế <em>Hoàn tiền ngay không cần trả hàng</em> đối với phụ kiện nhỏ hư hỏng nặng do vận chuyển hoặc đơn thất lạc.<br />• <strong>Địa chỉ nhận hàng đổi trả:</strong> 219/20 đường số 12, P. Bình Hưng Hòa, Q. Bình Tân, TP. Hồ Chí Minh • <strong>Hotline 24/7:</strong> 0908061843 • <strong>Email:</strong> support@novashop.vn</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CHÍNH SÁCH VẬN CHUYỂN */}
            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Chính sách vận chuyển, giao nhận & đồng kiểm toàn quốc</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5 uppercase">CHÍNH SÁCH VẬN CHUYỂN VÀ GIAO NHẬN HÀNG HÓA NOVASHOP.VN</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Ban hành theo Luật Bưu chính, Nghị định 52/2013/NĐ-CP & Quy chuẩn đóng gói an toàn NovaLogistics (10 Điều khoản)</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold">
                      <Truck className="w-4 h-4" />
                      <span>Giao Nhanh Tiêu Chuẩn Toàn Quốc (63 Tỉnh Thành)</span>
                    </div>
                    <p className="text-slate-600">
                      Thời gian toàn trình: <strong>1 – 3 ngày làm việc</strong>. Miễn phí vận chuyển 100% cho mọi đơn hàng từ <strong>300.000₫</strong> (Đơn dưới 300.000₫: đồng giá 30.000₫).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-800 font-bold">
                      <Clock className="w-4 h-4" />
                      <span>Giao Hỏa Tốc Now 2H (TP.HCM & Hà Nội)</span>
                    </div>
                    <p className="text-slate-600">
                      Nhận hàng tận tay trong <strong>1 – 2 giờ</strong> (bán kính ≤ 15km). Miễn phí 100% cho đơn từ <strong>2.000.000₫</strong> (Đơn dưới 2 triệu: 30.000₫ – 65.000₫).
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">1, 2 & 3. Phạm vi, Đối tác vận chuyển & Các phương thức giao hàng</h4>
                    <p>Hợp tác trực tiếp cùng <strong>Viettel Post, GHTK, GHN, SPX Express, J&amp;T Express, Ahamove, GrabExpress</strong> phủ sóng 63 tỉnh thành. Cung cấp 4 phương thức: (1) Hỏa tốc Now 2H; (2) Giao trong ngày; (3) Giao nhanh tiêu chuẩn; (4) Giao hàng cồng kềnh & lắp đặt tận nơi.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">4 & 5. Hàng hóa vận chuyển có điều kiện & Quy chuẩn đóng gói chống sốc 3 lớp</h4>
                    <p>• Pin sạc dự phòng & thiết bị pin Lithium dung lượng lớn đi liên miền được vận chuyển bằng tuyến đường bộ chuyên dụng an toàn phòng cháy.<br />• 100% kiện hàng được ghi hình camera khi đóng gói với 3 lớp bảo vệ: (Lớp 1) Màng co PE chống ẩm → (Lớp 2) Quấn 3 lớp xốp nổ Bubble Wrap & túi khí 6 mặt → (Lớp 3) Thùng carton 5 lớp dán <strong>Tem niêm phong bảo mật NovaShop</strong>.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">6. Quy định về Kiểm hàng (Đồng kiểm 100% miễn phí)</h4>
                    <p>Người Mua có quyền mở thùng carton bên ngoài trước mặt Shipper để kiểm tra ngoại quan hộp sản phẩm, tem niêm phong, đúng model, màu sắc, số lượng và quà tặng trước khi thanh toán (không bóc seal nilon chính hãng trên hộp máy khi chưa thanh toán). Nếu phát hiện bất thường, Người Mua được <strong>từ chối nhận hàng ngay mà không mất bất kỳ chi phí nào</strong>.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">7 & 8. Quy trình giao lại 3 lần & Bảo hiểm hàng hóa 100%</h4>
                    <p>Shipper gọi báo trước 15 – 30 phút và hỗ trợ <strong>giao lại miễn phí tối đa 03 lần</strong> nếu khách bận. Mọi đơn hàng đều được mua <strong>Bảo hiểm khai giá 100%</strong>; nếu thất lạc hoặc hư hỏng do lỗi vận chuyển, NovaShop gửi bù ngay máy mới 100% hoặc hoàn tiền 100% trong 24 giờ.</p>
                  </div>

                  <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-1 text-slate-800">
                    <h4 className="font-bold text-indigo-950 text-sm">9 & 10. Quyền, Nghĩa vụ & Trung tâm Điều phối Giao vận NovaLogistics</h4>
                    <p>• Tra cứu lộ trình vận đơn trực tuyến 24/7 tại mục <em>Đơn hàng của tôi</em> hoặc qua Email xác nhận đơn hàng tự động.<br />• <strong>Kho trung tâm:</strong> 219/20 đường số 12, P. Bình Hưng Hòa, Q. Bình Tân, TP. Hồ Chí Minh • <strong>Hotline Giao vận 24/7:</strong> 0908061843</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CHÍNH SÁCH BẢO MẬT */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Chính sách bảo mật dữ liệu cá nhân & An toàn thông tin</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5 uppercase">CHÍNH SÁCH BẢO MẬT WEBSITE TMĐT NOVASHOP.VN</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Ban hành theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân, Nghị định 52/2013/NĐ-CP & Chuẩn PCI-DSS Level 1 / SSL 256-Bit</p>
                </div>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl space-y-2 border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Chứng chỉ bảo mật quốc tế PCI-DSS Level 1, 3D-Secure 2.0 & 256-Bit SSL</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    NovaShop cam kết tôn trọng quyền riêng tư của Người dùng, tuyệt đối không lưu trữ mã CVV/CVC hoặc mật khẩu ngân hàng và bảo vệ dữ liệu cá nhân theo 16 điều khoản chính thức dưới đây.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">1. Giới thiệu</h4>
                    <p>Nền tảng NovaShop.vn được vận hành bởi Công ty Cổ phần Công nghệ NovaShop Việt Nam, tuân thủ Luật riêng tư (Nghị định 13/2023/NĐ-CP). Bằng việc đăng ký tài khoản hoặc sử dụng dịch vụ, bạn xác nhận đồng ý cho phép thu thập và xử lý dữ liệu cá nhân theo Chính sách này.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">2. Khi nào NovaShop thu thập dữ liệu cá nhân?</h4>
                    <p>Khi bạn đăng ký tài khoản, đặt hàng, gửi yêu cầu bảo hành/đổi trả, liên hệ tổng đài 0908061843, tương tác qua website/ứng dụng, liên kết tài khoản mạng xã hội, thanh toán VietQR Napas247/Thẻ quốc tế hoặc tham gia chương trình khuyến mãi.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">3. NovaShop thu thập những dữ liệu gì?</h4>
                    <p>Họ tên, ngày sinh, giới tính, email, số điện thoại, địa chỉ giao nhận/thanh toán, thông tin xuất hóa đơn VAT, thông tin đối soát thanh toán, hình ảnh/video đồng kiểm bảo hành, dữ liệu thiết bị (IP, trình duyệt) và lịch sử giao dịch.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">4. Tài khoản và Mật khẩu</h4>
                    <p>Người dùng có trách nhiệm bảo mật mật khẩu và mã xác thực OTP, khuyến nghị bật xác thực 2 yếu tố (2FA). NovaShop không bao giờ yêu cầu cung cấp mật khẩu hay mã OTP qua bất kỳ kênh không chính thức nào.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">5. Chính sách sử dụng Cookies</h4>
                    <p>Sử dụng Cookies và LocalStorage để duy trì phiên đăng nhập, lưu giỏ hàng, ghi nhớ giao diện Sáng/Tối và phân tích lưu lượng ẩn danh nhằm cải thiện tốc độ tải trang và đề xuất sản phẩm phù hợp.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">6. Chúng tôi sử dụng thông tin bạn cung cấp như thế nào?</h4>
                    <p>Xử lý đơn đặt hàng, điều phối giao hàng Hỏa tốc Now 2H/Toàn quốc, kích hoạt bảo hành điện tử 12-24 tháng theo IMEI/Serial, đổi mới 1-1 trong 30 ngày, đối soát thanh toán, xuất hóa đơn VAT, chống gian lận và chăm sóc khách hàng.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">7. Bảo vệ và lưu trữ thông tin khách hàng bằng cách nào?</h4>
                    <p>Lưu trữ sau hệ thống tường lửa WAF, mã hóa SSL 256-Bit, xác thực 3D-Secure 2.0 và chuẩn PCI-DSS Level 1. Dữ liệu giao dịch được lưu trữ tối thiểu 10 năm theo quy định kế toán và tự động hủy nhận dạng khi hết mục đích lưu giữ.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">8. NovaShop sẽ tiết lộ thông tin của bạn không?</h4>
                    <p>Chỉ chia sẻ trong phạm vi tối thiểu cần thiết cho đối tác vận chuyển (Viettel Post, GHTK, Ahamove), cổng thanh toán ngân hàng (Napas VietQR, Visa/MasterCard, MoMo), trung tâm bảo hành hãng và cơ quan nhà nước có thẩm quyền. Tuyệt đối không bán thông tin khách hàng.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">9 & 10. Thông tin về trẻ em & Bên thứ ba</h4>
                    <p>Dịch vụ không dành cho trẻ em dưới 13 tuổi nếu không có sự giám sát và đồng ý của cha/mẹ hoặc người giám hộ. Website sử dụng Google Analytics ẩn danh và có thể chứa liên kết đến cổng ngân hàng/tra cứu vận đơn độc lập.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">11 & 12. Loại trừ trách nhiệm & Chuyển dữ liệu ra nước ngoài</h4>
                    <p>Không chịu trách nhiệm nếu người dùng tự ý tiết lộ mật khẩu/OTP hoặc giao dịch ngoài Nền tảng. Việc lưu trữ đám mây quốc tế hoặc xác thực bảo hành toàn cầu tuân thủ đầy đủ Điều 25 Nghị định 13/2023/NĐ-CP.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">13 & 14. Rút lại sự đồng ý, Xóa bỏ & Cập nhật dữ liệu cá nhân</h4>
                    <p>Khách hàng có quyền tự chỉnh sửa thông tin trong mục Quản lý Tài khoản hoặc yêu cầu rút lại sự đồng ý, hạn chế xử lý, xóa bỏ dữ liệu cá nhân qua email <strong>dpo.vn@novashop.vn</strong> (xử lý trong 72 giờ).</p>
                  </div>

                  <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-1 text-slate-800">
                    <h4 className="font-bold text-indigo-950 text-sm">15 & 16. Thắc mắc, Khiếu nại (DPO) & Điều khoản chung</h4>
                    <p>• <strong>Đơn vị kiểm soát dữ liệu:</strong> Công ty Cổ phần Công nghệ NovaShop Việt Nam (MST: 0318689999)</p>
                    <p>• <strong>Địa chỉ:</strong> 219/20 đường số 12, P. Bình Hưng Hòa, Q. Bình Tân, TP. Hồ Chí Minh</p>
                    <p>• <strong>Hotline DPO & CSKH 24/7:</strong> 0908061843 | <strong>Email:</strong> dpo.vn@novashop.vn / cskh@novashop.vn</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: HƯỚNG DẪN VIETQR */}
            {activeTab === 'payment' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Thanh toán thông minh</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">Hướng Dẫn Thanh Toán Trực Tuyến Qua VietQR Napas 24/7</h3>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-indigo-900 text-xs sm:text-sm">Thông tin tài khoản nhận thanh toán trước qua Mã QR (VietQR Napas 247):</h4>
                  <div className="text-xs text-slate-700 space-y-1">
                    <div>• Chủ tài khoản: <strong>TRUONG MINH QUOC TRI</strong></div>
                    <div>• Số tài khoản: <strong>3180530681</strong></div>
                    <div>• Ngân hàng: <strong>BIDV - PGD Tân Sơn Nhì</strong></div>
                  </div>
                  <p className="text-xs text-slate-600 pt-1">
                    Lưu ý: Đối với khách hàng chọn thanh toán trước, đơn hàng <strong>chỉ được xác nhận đặt hàng thành công</strong> khi quý khách đã thanh toán qua mã QR đúng với số tiền của sản phẩm/đơn hàng đó.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">Các bước thanh toán bằng VietQR:</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                      <div>
                        <strong className="text-slate-900">Chọn phương thức VietQR tại bước thanh toán</strong>
                        <p className="text-slate-500 text-[11px]">Màn hình sẽ hiển thị mã QR động có gắn sẵn số tiền chính xác và mã đơn hàng tham chiếu.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                      <div>
                        <strong className="text-slate-900">Mở ứng dụng Ngân hàng hoặc Ví điện tử</strong>
                        <p className="text-slate-500 text-[11px]">Sử dụng bất kỳ app ngân hàng (Vietcombank, MB Bank, Techcombank, BIDV, Agribank, ACB, VPBank, TPBank...) hoặc ví MoMo/ZaloPay và chọn tính năng <strong>Quét QR</strong>.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                      <div>
                        <strong className="text-slate-900">Quét mã và xác nhận chuyển khoản</strong>
                        <p className="text-slate-500 text-[11px]">Thông tin số tiền và nội dung chuyển khoản được điền tự động. Khách hàng kiểm tra và xác nhận giao dịch.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                      <div>
                        <strong className="text-slate-900">Nhận hóa đơn điện tử thành công</strong>
                        <p className="text-slate-500 text-[11px]">Hệ thống lập tức kích hoạt đơn hàng sang trạng thái "Đã thanh toán" và gửi hóa đơn điện tử về email.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: QUY CHẾ HOẠT ĐỘNG */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Quy chế hoạt động sàn giao dịch TMĐT</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5 uppercase">QUY CHẾ HOẠT ĐỘNG WEBSITE CUNG CẤP DỊCH VỤ TMĐT NOVASHOP.VN</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Ban hành theo Nghị định 52/2013/NĐ-CP, Nghị định 85/2021/NĐ-CP và Nghị định 13/2023/NĐ-CP</p>
                </div>

                <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">I. Nguyên tắc chung</h4>
                    <p>
                      Website thương mại điện tử <strong>NovaShop.vn</strong> do Công ty Cổ phần Công nghệ NovaShop Việt Nam vận hành. Thành viên tham gia giao dịch trên cơ sở tự do thỏa thuận, tôn trọng quyền và lợi ích hợp pháp của các bên, tuân thủ pháp luật Việt Nam. Mọi hàng hóa, dịch vụ kinh doanh trên sàn đều là hàng chính hãng 100%, có đầy đủ chứng từ xuất xứ và không thuộc danh mục cấm kinh doanh.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">II. Quy định chung</h4>
                    <p>
                      Tên miền chính thức là <strong>www.novashop.vn</strong>. Thành viên bao gồm Người Mua (khách hàng đăng ký tài khoản đặt mua hàng hóa, hưởng điểm thưởng NovaPoints và mã giảm giá Voucher) và Đơn vị cung ứng / Đối tác phân phối chính hãng.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">III. Quy trình giao dịch</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>1. Quy trình cho Người Mua:</strong> Đăng nhập tài khoản → Tìm kiếm & tham khảo sản phẩm → Đặt hàng trực tuyến & áp dụng Voucher → Chọn giao nhận & thanh toán → Theo dõi vận đơn → Đồng kiểm ngoại quan & nhận hàng.</li>
                      <li><strong>2. Chính sách vận chuyển:</strong> Giao hỏa tốc Now 2H nội thành TP.HCM & Hà Nội; Giao tiêu chuẩn toàn quốc 1 - 4 ngày (Miễn phí cho đơn từ 300.000₫). Hỗ trợ đồng kiểm 100% khi nhận hàng.</li>
                      <li><strong>3. Chính sách bảo hành & đổi trả:</strong> Bảo hành điện tử chính hãng 12 - 24 tháng theo IMEI/Serial; Đổi mới 1-1 hoặc Hoàn tiền 100% trong 30 ngày đầu nếu có lỗi phần cứng từ nhà sản xuất.</li>
                      <li><strong>4. Xác nhận / Hủy đơn hàng:</strong> Người Mua có quyền hủy đơn hàng khi đơn đang ở trạng thái <em>“Chờ xác nhận”</em> hoặc trước khi bàn giao cho trạm giao vận.</li>
                      <li><strong>5. Giải quyết tranh chấp, khiếu nại:</strong> Thực hiện theo 4 bước (Tiếp nhận yêu cầu qua Hotline 0908061843/Email → Xác minh chứng cứ trong 2h → Đề xuất & thực thi đổi trả/hoàn tiền trong 24h - 07 ngày làm việc → Chuyển Cơ quan có thẩm quyền nếu không đạt thỏa thuận).</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">IV. Quy trình thanh toán</h4>
                    <p>
                      Hỗ trợ 4 hình thức: (1) Thanh toán khi nhận hàng (COD); (2) Chuyển khoản nhanh VietQR Napas 24/7 (TK: 3180530681 - BIDV - TRUONG MINH QUOC TRI); (3) Thẻ quốc tế Visa/MasterCard/JCB & Ví MoMo/VNPay; (4) Mua trả góp 0% lãi suất qua Thẻ tín dụng hoặc CCCD gắn chip.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">V. Đảm bảo an toàn giao dịch</h4>
                    <p>
                      Áp dụng chuẩn mã hóa SSL 256-Bit, chứng chỉ bảo mật quốc tế PCI-DSS Level 1 và xác thực OTP 3D-Secure 2.0. Tuyệt đối không lưu trữ mã CVV/CVC của khách hàng.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">VI. Bảo vệ thông tin cá nhân khách hàng</h4>
                    <p>
                      Thu thập và sử dụng thông tin (Họ tên, SĐT, Email, Địa chỉ) đúng mục đích xử lý đơn hàng, giao vận, xuất hóa đơn VAT và kích hoạt bảo hành theo Nghị định 13/2023/NĐ-CP. Khách hàng có toàn quyền chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân bất kỳ lúc nào.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">VII. Quản lý thông tin xấu & VIII. Xử lý lỗi kỹ thuật</h4>
                    <p>
                      Kiểm soát chặt chẽ nguồn gốc hàng hóa, nghiêm cấm hàng giả, hàng nhái và các hành vi tạo đơn ảo, gian lận Voucher. Cam kết duy trì hệ thống kỹ thuật ổn định 24/7 và bảo vệ quyền lợi Người Mua nếu phát sinh sự cố hệ thống.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">IX & X. Quyền và nghĩa vụ của Ban Quản lý & Thành viên</h4>
                    <p>
                      Ban Quản lý có trách nhiệm vận hành sàn minh bạch, bảo mật dữ liệu và giải quyết khiếu nại thỏa đáng. Thành viên có quyền hưởng đầy đủ cam kết dịch vụ và có nghĩa vụ bảo mật tài khoản, cung cấp thông tin nhận hàng trung thực, chính xác.
                    </p>
                  </div>

                  <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-1.5">
                    <h4 className="font-bold text-indigo-950 text-sm">XI & XII. Điều khoản áp dụng, Cam kết & Thông tin pháp lý</h4>
                    <p className="text-slate-700">
                      • <strong>Đơn vị chủ quản:</strong> Công ty Cổ phần Công nghệ NovaShop Việt Nam (MSDN: 0317892341)<br />
                      • <strong>Địa chỉ:</strong> 219/20 đường số 12, P. Bình Hưng Hòa, Q. Bình Tân, TP. Hồ Chí Minh<br />
                      • <strong>Chịu trách nhiệm quản lý nội dung:</strong> Nguyễn Thành Nam • <strong>Hotline:</strong> 0908061843 • <strong>Email:</strong> support@novashop.vn
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer info strip */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>Cần tư vấn thêm về chính sách? Gọi ngay Hotline: <strong className="text-slate-900">0908061843</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors"
          >
            Đã hiểu & Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
