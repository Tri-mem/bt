import React, { useState, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  HelpCircle, 
  Check, 
  Sparkles, 
  Smartphone, 
  MapPin, 
  ArrowRight,
  Info,
  CalendarClock,
  BadgePercent,
  Coins
} from 'lucide-react';
import { Product, CartItem, Order, CustomerInfo, InstallmentOrderDetails, UserProfile } from '../types';
import { formatVND, SHIPPING_METHODS } from '../data/mockData';
import { 
  INSTALLMENT_BANKS, 
  FINANCE_COMPANIES, 
  calculateInstallment 
} from '../data/installmentData';

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  cartItems?: CartItem[];
  onOrderSuccess: (order: Order) => void;
  onToast?: (type: 'success' | 'info' | 'warning', title: string, message?: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
}

export const InstallmentModal: React.FC<InstallmentModalProps> = ({
  isOpen,
  onClose,
  product,
  cartItems = [],
  onOrderSuccess,
  onToast,
  currentUser,
  onOpenAuth,
}) => {
  // Method: 'credit_card' | 'finance_company'
  const [method, setMethod] = useState<'credit_card' | 'finance_company'>('credit_card');

  // Credit Card Options
  const [selectedBankId, setSelectedBankId] = useState<string>(INSTALLMENT_BANKS[0].id);
  const [selectedCardType, setSelectedCardType] = useState<'visa' | 'mastercard' | 'jcb'>('visa');
  const [cardTenure, setCardTenure] = useState<number>(6);

  // Finance Company Options
  const [selectedFinanceId, setSelectedFinanceId] = useState<string>(FINANCE_COMPANIES[0].id);
  const [prepayPercent, setPrepayPercent] = useState<number>(20);
  const [financeTenure, setFinanceTenure] = useState<number>(6);

  // Customer Form (left blank so the user enters their own details)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'store'>('home');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Submitting state & submission result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<{
    appCode: string;
    order: Order;
  } | null>(null);

  // Reset form to blank fields when opening
  React.useEffect(() => {
    if (isOpen) {
      setSubmittedApp(null);
      setIsSubmitting(false);
      setFullName('');
      setPhone('');
      setEmail('');
      setIdCardNumber('');
      setBirthYear('');
      setCardLast4('');
      setCity('');
      setDistrict('');
      setAddress('');
    }
  }, [isOpen]);

  // Determine pricing and product items
  const activeItems: CartItem[] = useMemo(() => {
    if (product) {
      return [{ product, quantity: 1 }];
    }
    if (cartItems.length > 0) {
      return cartItems;
    }
    return [];
  }, [product, cartItems]);

  const targetProduct = activeItems[0]?.product;
  const totalPrice = activeItems.reduce((acc, it) => acc + it.product.price * it.quantity, 0);

  const selectedBank = INSTALLMENT_BANKS.find((b) => b.id === selectedBankId) || INSTALLMENT_BANKS[0];
  const selectedFinance = FINANCE_COMPANIES.find((f) => f.id === selectedFinanceId) || FINANCE_COMPANIES[0];

  // Calculation results
  const cardCalc = useMemo(() => {
    return calculateInstallment({
      price: totalPrice,
      method: 'credit_card',
      providerId: selectedBankId,
      downPaymentPercent: 0,
      tenureMonths: cardTenure,
    });
  }, [totalPrice, selectedBankId, cardTenure]);

  const financeCalc = useMemo(() => {
    return calculateInstallment({
      price: totalPrice,
      method: 'finance_company',
      providerId: selectedFinanceId,
      downPaymentPercent: prepayPercent,
      tenureMonths: financeTenure,
    });
  }, [totalPrice, selectedFinanceId, prepayPercent, financeTenure]);

  if (!isOpen) return null;

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && onOpenAuth) {
      onToast?.('info', 'Vui lòng đăng nhập để đăng ký trả góp', 'Sau khi đăng nhập, bạn có thể hoàn tất hồ sơ trả góp 0%.');
      onOpenAuth();
      return;
    }
    if (!agreeTerms) {
      onToast?.('warning', 'Chưa đồng ý điều khoản', 'Vui lòng xác nhận đồng ý với điều khoản dịch vụ trả góp');
      return;
    }

    if (!fullName.trim() || !phone.trim()) {
      onToast?.('warning', 'Thiếu thông tin', 'Vui lòng điền họ tên và số điện thoại liên hệ');
      return;
    }

    if (deliveryType === 'home' && !address.trim()) {
      onToast?.('warning', 'Thiếu địa chỉ nhận máy', 'Vui lòng nhập địa chỉ giao hàng tận nơi chi tiết');
      return;
    }

    if (method === 'finance_company' && (!idCardNumber.trim() || idCardNumber.length < 9)) {
      onToast?.('warning', 'CCCD không hợp lệ', 'Vui lòng nhập đúng số Căn cước công dân gắn chip (9-12 số)');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const appCode = `TG-${Math.floor(100000 + Math.random() * 900000)}`;
      const activeCalc = method === 'credit_card' ? cardCalc : financeCalc;
      const providerName = method === 'credit_card' ? selectedBank.shortName : selectedFinance.shortName;

      const installmentDetails: InstallmentOrderDetails = {
        method,
        providerId: method === 'credit_card' ? selectedBank.id : selectedFinance.id,
        providerName,
        tenureMonths: activeCalc.tenureMonths,
        downPaymentPercent: activeCalc.downPaymentPercent,
        downPaymentAmount: activeCalc.downPaymentAmount,
        monthlyPayment: activeCalc.monthlyPayment,
        totalPayment: activeCalc.totalPayment,
        cardType: method === 'credit_card' ? selectedCardType : undefined,
        idCardNumber: method === 'finance_company' ? idCardNumber : undefined,
        birthYear: method === 'finance_company' ? birthYear : undefined,
        approvalCode: appCode,
      };

      const customer: CustomerInfo = {
        fullName,
        phone,
        email: email || 'khachhang@novashop.vn',
        city,
        district,
        address: deliveryType === 'home' ? address.trim() : 'Nhận tại Showroom NovaShop (219/20 đường số 12, P. Bình Hưng Hòa, TP.HCM)',
        note: `Đơn mua trả góp ${providerName} ${activeCalc.tenureMonths} tháng (${deliveryType === 'home' ? 'Giao tận nhà' : 'Lấy tại showroom'})`,
      };

      const newOrder: Order = {
        id: `NOVA-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toISOString(),
        items: activeItems,
        customer,
        shipping: SHIPPING_METHODS[0],
        paymentMethod: 'installment',
        paymentStatus: 'processing',
        orderStatus: 'confirmed',
        subtotal: totalPrice,
        shippingFee: 0,
        discount: 0,
        total: activeCalc.totalPayment,
        transactionId: appCode,
        installmentDetails,
      };

      setIsSubmitting(false);
      setSubmittedApp({ appCode, order: newOrder });
      onOrderSuccess(newOrder);
      onToast?.('success', 'Đăng ký trả góp thành công!', `Hồ sơ ${appCode} đã được gửi phê duyệt tự động`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div 
        id="installment-modal-container"
        className="relative bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-xs text-amber-400 shrink-0">
              <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="font-extrabold text-sm sm:text-lg tracking-tight truncate">Mua Trả Góp 0% Lãi Suất</h3>
                <span className="keep-dark-text px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] uppercase shrink-0">
                  Duyệt 5 phút
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200 truncate">
                Tài trợ 100% lãi suất và phí chuyển đổi - Nhận máy ngay hôm nay
              </p>
            </div>
          </div>

          <button
            id="close-installment-modal-btn"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 flex-1 bg-slate-50/50">

          {/* Success Screen after submission */}
          {submittedApp ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm text-center space-y-5 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs mb-2">
                  Đã tiếp nhận hồ sơ thành công
                </span>
                <h4 className="text-xl font-black text-slate-900">
                  Chúc mừng {fullName}!
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Mã hồ sơ trả góp của bạn: <strong className="text-indigo-600 font-mono text-sm">{submittedApp.appCode}</strong>
                </p>
              </div>

              {/* Installment Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Sản phẩm đăng ký:</span>
                  <span className="font-bold text-slate-900 text-right">{targetProduct?.name || 'Gói thiết bị công nghệ'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức trả góp:</span>
                  <span className="font-bold text-indigo-700">
                    {submittedApp.order.installmentDetails?.method === 'credit_card' 
                      ? `Thẻ tín dụng ${submittedApp.order.installmentDetails?.providerName}`
                      : `Công ty tài chính ${submittedApp.order.installmentDetails?.providerName}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kỳ hạn trả góp:</span>
                  <span className="font-bold text-slate-900">{submittedApp.order.installmentDetails?.tenureMonths} tháng</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trả trước khi nhận máy:</span>
                  <span className="font-bold text-slate-900">{formatVND(submittedApp.order.installmentDetails?.downPaymentAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-bold pt-1 border-t border-slate-200">
                  <span>Góp mỗi tháng:</span>
                  <span className="text-sm font-black">{formatVND(submittedApp.order.installmentDetails?.monthlyPayment || 0)}/tháng</span>
                </div>
              </div>

              <div className="text-left bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-xs space-y-1.5 text-slate-700">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Quy trình xử lý tiếp theo:</span>
                </div>
                <p>1. Trong vòng <strong>5 - 10 phút</strong>, chuyên viên xét duyệt NovaShop sẽ gọi tới số <strong>{phone}</strong> để xác nhận thông tin.</p>
                <p>2. Khi hồ sơ được hệ thống duyệt tự động, sản phẩm sẽ được gửi ngay đến <strong>{submittedApp.order.customer.address}</strong>.</p>
                <p>3. Quý khách được kiểm tra máy đầy đủ trước khi nhận và kích hoạt chế độ bảo hành chính hãng.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Hoàn tất & Tiếp tục mua sắm
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Info Banner */}
              {targetProduct && (
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3 sm:gap-4">
                  <img
                    src={targetProduct.image}
                    alt={targetProduct.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-200/60"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase">
                      {targetProduct.categoryName}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                      {targetProduct.name}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-base sm:text-lg font-black text-indigo-700">
                        {formatVND(totalPrice)}
                      </span>
                      {targetProduct.originalPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatVND(targetProduct.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end shrink-0 text-right text-xs">
                    <span className="text-slate-500">Dự kiến chỉ từ</span>
                    <span className="font-black text-emerald-600 text-base">
                      ~{formatVND(Math.round(totalPrice / 12))}/tháng
                    </span>
                    <span className="text-[10px] text-slate-400">Lãi suất 0%</span>
                  </div>
                </div>
              )}

              {/* Installment Method Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-2xl">
                <button
                  type="button"
                  id="tab-installment-credit-card"
                  onClick={() => setMethod('credit_card')}
                  className={`py-2.5 sm:py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    method === 'credit_card'
                      ? 'bg-white dark:!bg-indigo-600 text-indigo-700 dark:!text-white shadow-xs ring-1 ring-slate-200 dark:ring-indigo-500'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className={`w-4 h-4 shrink-0 ${method === 'credit_card' ? 'text-indigo-600 dark:!text-white' : 'text-indigo-600'}`} />
                  <span>Qua Thẻ Tín Dụng</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                    0% Lãi suất
                  </span>
                </button>

                <button
                  type="button"
                  id="tab-installment-finance"
                  onClick={() => setMethod('finance_company')}
                  className={`py-2.5 sm:py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    method === 'finance_company'
                      ? 'bg-white dark:!bg-indigo-600 text-indigo-700 dark:!text-white shadow-xs ring-1 ring-slate-200 dark:ring-indigo-500'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className={`w-4 h-4 shrink-0 ${method === 'finance_company' ? 'text-indigo-600 dark:!text-white' : 'text-indigo-600'}`} />
                  <span>Công Ty Tài Chính</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    Duyệt CCCD
                  </span>
                </button>
              </div>

              {/* FORM & SELECTION CONTENT */}
              <form onSubmit={handleSubmitApplication} className="space-y-6">

                {/* TAB 1: CREDIT CARD SELECTION */}
                {method === 'credit_card' && (
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
                    {/* Step 1: Pick Bank */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>1. Chọn ngân hàng phát hành thẻ tín dụng:</span>
                        </label>
                        <span className="text-[11px] text-slate-500">Hỗ trợ 25+ ngân hàng đối tác</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {INSTALLMENT_BANKS.map((bank) => {
                          const isChosen = selectedBankId === bank.id;
                          return (
                            <button
                              key={bank.id}
                              type="button"
                              onClick={() => {
                                setSelectedBankId(bank.id);
                                if (!bank.tenures.includes(cardTenure)) {
                                  setCardTenure(bank.tenures[0]);
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                isChosen
                                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">{bank.shortName}</span>
                                {isChosen && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                              </div>
                              <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                                {bank.badge || '0% Lãi suất'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Card Network (Visa, MasterCard, JCB) */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-2">
                        2. Chọn loại thẻ của bạn:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(['visa', 'mastercard', 'jcb'] as const).map((ct) => {
                          const isSupported = selectedBank.cardTypes.includes(ct);
                          const isSelected = selectedCardType === ct;
                          return (
                            <button
                              key={ct}
                              type="button"
                              disabled={!isSupported}
                              onClick={() => setSelectedCardType(ct)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                                !isSupported 
                                  ? 'opacity-30 bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {ct}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 3: Tenure Months */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-800">
                          3. Chọn kỳ hạn trả góp:
                        </label>
                        <span className="text-[11px] text-indigo-600 font-semibold">Tất cả kỳ hạn đều 0% lãi suất</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {selectedBank.tenures.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setCardTenure(m)}
                            className={`py-2 px-3 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                              cardTenure === m
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>{m} tháng</div>
                            <div className={`text-[10px] ${cardTenure === m ? 'text-indigo-100' : 'text-slate-500'}`}>
                              {formatVND(Math.round(totalPrice / m))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Financial Breakdown Table */}
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Giá niêm yết sản phẩm:</span>
                        <span className="font-bold text-slate-900">{formatVND(cardCalc.price)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Trả trước (Thẻ tín dụng hỗ trợ 100%):</span>
                        <span className="font-bold text-emerald-600">0₫</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Lãi suất ngân hàng:</span>
                        <span className="font-bold text-emerald-600">0%</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Phí chuyển đổi trả góp:</span>
                        <span className="font-bold text-emerald-600">0₫ (NovaShop tài trợ)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Tổng số tiền trả góp:</span>
                        <span className="font-bold text-slate-900">{formatVND(cardCalc.totalPayment)}</span>
                      </div>
                      <div className="pt-2 border-t border-indigo-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 text-xs">Mỗi tháng thanh toán:</span>
                          <p className="text-[11px] text-slate-500">Trong {cardCalc.tenureMonths} tháng</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base sm:text-lg font-black text-indigo-700">
                            {formatVND(cardCalc.monthlyPayment)}/tháng
                          </span>
                          <span className="block text-[10px] text-emerald-600 font-bold">Chênh lệch: 0₫</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: FINANCE COMPANY SELECTION */}
                {method === 'finance_company' && (
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
                    {/* Step 1: Pick Finance Company */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-800">
                          1. Chọn công ty tài chính đối tác:
                        </label>
                        <span className="text-[11px] text-slate-500">Chỉ cần CCCD gắn chip (18-60 tuổi)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {FINANCE_COMPANIES.map((fc) => {
                          const isChosen = selectedFinanceId === fc.id;
                          return (
                            <button
                              key={fc.id}
                              type="button"
                              onClick={() => {
                                setSelectedFinanceId(fc.id);
                                if (prepayPercent < fc.minDownPaymentRate) {
                                  setPrepayPercent(fc.minDownPaymentRate);
                                }
                              }}
                              className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                                isChosen
                                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-slate-900">{fc.shortName}</span>
                                  {fc.badge && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                      {fc.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Thời gian xét duyệt: <strong className="text-slate-700">{fc.approvalTime}</strong>
                                </p>
                                <p className="text-[10px] text-emerald-600 font-medium">
                                  {fc.requiredDocuments[0]}
                                </p>
                              </div>
                              {isChosen && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Down Payment Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-800">
                          2. Chọn số tiền trả trước khi nhận máy:
                        </label>
                        <span className="text-xs font-bold text-indigo-700">
                          {formatVND(financeCalc.downPaymentAmount)} ({financeCalc.downPaymentPercent}%)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[0, 10, 20, 30, 50, 70].map((rate) => {
                          const isDisabled = rate < selectedFinance.minDownPaymentRate;
                          return (
                            <button
                              key={rate}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => setPrepayPercent(rate)}
                              className={`py-2 px-2.5 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                                isDisabled
                                  ? 'opacity-30 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : prepayPercent === rate
                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div>{rate}%</div>
                              <div className={`text-[10px] truncate ${prepayPercent === rate ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {formatVND(Math.round((totalPrice * rate) / 100))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 3: Tenure Months */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-800">
                          3. Chọn kỳ hạn vay:
                        </label>
                        <span className="text-[11px] text-slate-500">Tỷ lệ duyệt thành công 98%</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {selectedFinance.tenures.map((m) => {
                          const planForM = calculateInstallment({
                            price: totalPrice,
                            method: 'finance_company',
                            providerId: selectedFinanceId,
                            downPaymentPercent: prepayPercent,
                            tenureMonths: m,
                          });
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setFinanceTenure(m)}
                              className={`py-2 px-3 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                                financeTenure === m
                                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div>{m} tháng</div>
                              <div className={`text-[10px] ${financeTenure === m ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {formatVND(planForM.monthlyPayment)}/tháng
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Financial Breakdown Table */}
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Giá máy:</span>
                        <span className="font-bold text-slate-900">{formatVND(financeCalc.price)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Số tiền trả trước ({financeCalc.downPaymentPercent}%):</span>
                        <span className="font-bold text-indigo-700">{formatVND(financeCalc.downPaymentAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Số tiền vay công ty tài chính:</span>
                        <span className="font-bold text-slate-900">{formatVND(financeCalc.loanAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Lãi suất ưu đãi:</span>
                        <span className="font-bold text-emerald-600">0% (Chương trình tài trợ độc quyền)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Bảo hiểm khoản vay & hồ sơ:</span>
                        <span className="font-bold text-emerald-600">Miễn phí 100%</span>
                      </div>
                      <div className="pt-2 border-t border-indigo-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 text-xs">Góp mỗi tháng ({financeCalc.tenureMonths} tháng):</span>
                          <p className="text-[11px] text-slate-500">Đã bao gồm toàn bộ phí</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base sm:text-lg font-black text-indigo-700">
                            {formatVND(financeCalc.monthlyPayment)}/tháng
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CUSTOMER CONTACT & APPLICATION FORM */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Thông tin người đăng ký xét duyệt:</span>
                    </h4>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Bảo mật thông tin 100%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Họ và tên (theo CCCD/Thẻ): <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="VD: Nguyễn Văn An"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Số điện thoại nhận SMS OTP: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="VD: 0912345678"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                      />
                    </div>

                    {method === 'finance_company' && (
                      <>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Số Căn cước công dân (12 số): <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={idCardNumber}
                            onChange={(e) => setIdCardNumber(e.target.value.replace(/\D/g, ''))}
                            maxLength={12}
                            required
                            placeholder="Nhập 12 số CCCD gắn chip"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            Năm sinh (từ 18 - 60 tuổi):
                          </label>
                          <input
                            type="text"
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value)}
                            placeholder="VD: 1998"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white font-mono"
                          />
                        </div>
                      </>
                    )}

                    {method === 'credit_card' && (
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          4 số cuối trên thẻ tín dụng:
                        </label>
                        <input
                          type="text"
                          value={cardLast4}
                          onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="VD: 8899"
                          maxLength={4}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white font-mono"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Email nhận hợp đồng điện tử:
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                      />
                    </div>
                  </div>

                  {/* Delivery Preference */}
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Hình thức nhận máy sau khi hồ sơ duyệt:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('home')}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                          deliveryType === 'home'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Giao hàng tận nơi miễn phí</span>
                        </div>
                        {deliveryType === 'home' && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType('store')}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                          deliveryType === 'store'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Nhận tại Showroom NovaShop (219/20 đường số 12)</span>
                        </div>
                        {deliveryType === 'store' && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>
                    </div>

                    {deliveryType === 'home' && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Nhập địa chỉ nhận máy chi tiết (Số nhà, Tên đường, Phường/Xã...)"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Terms & Consent */}
                  <label className="flex items-start gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                    />
                    <span className="text-[11px] text-slate-600 leading-snug">
                      Tôi xác nhận thông tin cung cấp là chính xác và đồng ý với các <span className="text-indigo-600 underline font-medium">Điều khoản & Điều kiện Trả góp 0%</span> của NovaShop.
                    </span>
                  </label>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-1 sm:pt-2">
                  <button
                    type="submit"
                    id="submit-installment-app-btn"
                    disabled={isSubmitting || totalPrice <= 0}
                    className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 hover:from-indigo-700 hover:to-slate-950 text-white font-extrabold text-xs sm:text-base shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 text-center"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Đang kết nối cổng thẩm định hồ sơ...</span>
                      </span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
                        <span className="leading-snug">
                          {method === 'credit_card'
                            ? `Xác Nhận Trả Góp 0% Qua ${selectedBank.shortName} (${formatVND(cardCalc.monthlyPayment)}/tháng)`
                            : `Đăng Ký Duyệt Online 5 Phút Qua ${selectedFinance.shortName} (${formatVND(financeCalc.monthlyPayment)}/tháng)`}
                        </span>
                        <ArrowRight className="w-4 h-4 ml-0.5 shrink-0 hidden sm:inline" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-slate-500 mt-2">
                    ⚡ Duyệt hồ sơ tự động 5 phút · Không thu phí giữ chỗ · Nhận máy kiểm tra trước khi ký nhận
                  </p>
                </div>

              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
