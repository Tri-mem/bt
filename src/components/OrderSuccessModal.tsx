import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Printer, 
  ArrowRight, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  X,
  FileText,
  Download,
  Copy,
  Check,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Order } from '../types';
import { formatVND } from '../data/mockData';
import { Logo } from './Logo';
import {
  getElectronicInvoiceMetadata,
  printElectronicInvoice,
  downloadElectronicInvoiceHtml,
  sendOrderConfirmationEmail,
} from '../utils/electronicInvoice';

interface OrderSuccessModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onViewOrders: () => void;
  initialViewMode?: 'summary' | 'invoice';
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onClose,
  onViewOrders,
  initialViewMode = 'summary',
}) => {
  const [viewMode, setViewMode] = useState<'summary' | 'invoice'>(initialViewMode);
  const [printStatusMessage, setPrintStatusMessage] = useState<string | null>(null);
  const [copiedLookupCode, setCopiedLookupCode] = useState(false);

  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendEmailMessage, setResendEmailMessage] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      setViewMode(initialViewMode);
      setPrintStatusMessage(null);
      setCopiedLookupCode(false);
      setResendEmailMessage(null);
      setResendSuccess(null);
      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Fallback gracefully if canvas-confetti context isn't supported
      }
    }
  }, [isOpen, order?.id, initialViewMode]);

  if (!isOpen || !order) return null;

  const invoiceMeta = getElectronicInvoiceMetadata(order);
  const signedDateStr = new Date(
    order.qrTransactionDetails?.confirmedAt || order.confirmedAt || order.createdAt || Date.now()
  ).toLocaleString('vi-VN');

  const paymentMethodLabel = {
    vietqr: 'VietQR Napas 24/7 — BIDV 3180530681 (TRUONG MINH QUOC TRI)',
    card: 'Thẻ Quốc tế 3D-Secure (Đã thanh toán)',
    momo: 'Ví Điện Tử MoMo (Đã thanh toán)',
    vnpay: 'VNPay-QR Napas 24/7 — BIDV 3180530681 (TRUONG MINH QUOC TRI)',
    cod: 'Thanh toán tiền mặt khi nhận hàng (COD)',
    installment: `Trả Góp 0% (${order.installmentDetails?.providerName || 'Đối tác tài chính'} - ${order.installmentDetails?.tenureMonths || 6} tháng)`,
  }[order.paymentMethod] || 'Trực tuyến';

  const handlePrint = () => {
    setViewMode('invoice');
    printElectronicInvoice(order);
    setPrintStatusMessage(
      `Đã chuẩn bị Hóa đơn điện tử GTGT #${invoiceMeta.invoiceNumber} (chuẩn A4) và kích hoạt lệnh in / Lưu PDF.`
    );
  };

  const handleDownloadInvoice = () => {
    downloadElectronicInvoiceHtml(order);
    setPrintStatusMessage(
      `Đã tải xuống tệp Hóa đơn điện tử Hoa-Don-Dien-Tu-NovaShop-${order.id}.html (mở bằng trình duyệt để xem & in PDF A4).`
    );
  };

  const handleCopyLookupCode = () => {
    try {
      navigator.clipboard.writeText(invoiceMeta.lookupCode);
      setCopiedLookupCode(true);
      setTimeout(() => setCopiedLookupCode(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleResendEmail = async () => {
    if (!order || !order.customer.email || isResendingEmail) return;
    setIsResendingEmail(true);
    setResendEmailMessage(null);
    try {
      const res = await sendOrderConfirmationEmail(order, order.customer.email);
      setResendSuccess(res.ok);
      setResendEmailMessage(
        res.ok
          ? `Đã gửi lại email xác nhận đơn hàng thành công tới ${order.customer.email}!`
          : `Không thể gửi email: ${res.message || 'Lỗi kết nối'}`
      );
    } catch {
      setResendSuccess(false);
      setResendEmailMessage('Đã có lỗi xảy ra khi gửi lại email. Vui lòng thử lại sau.');
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div
      id="order-success-modal-root"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div 
        className="no-print fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div 
        id="order-success-invoice-modal"
        className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header — Low-glare in Dark Mode */}
        <div className="no-print px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-extrabold text-white truncate">
                {order.paymentStatus === 'paid' ? 'Giao dịch thành công!' : 'Đặt hàng thành công!'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                {order.paymentStatus === 'paid'
                  ? 'Đơn hàng của bạn đã được thanh toán và phát hành Hóa đơn Điện tử thành công'
                  : order.paymentMethod === 'installment'
                  ? 'Hồ sơ mua trả góp 0% và Hóa đơn Điện tử đã được phê duyệt tự động'
                  : 'Đơn hàng COD đã được xác nhận kèm Hóa đơn Điện tử chính hãng'}
              </p>
            </div>
          </div>
          <button
            id="close-success-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs: Order Summary vs Official A4 Electronic VAT Invoice */}
        <div className="no-print px-4 sm:px-6 pt-2.5 bg-slate-100/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              id="tab-order-summary-view"
              type="button"
              onClick={() => setViewMode('summary')}
              className={`px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'summary'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 shadow-2xs'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Chi tiết đơn hàng</span>
            </button>

            <button
              id="tab-electronic-invoice-view"
              type="button"
              onClick={() => setViewMode('invoice')}
              className={`px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'invoice'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-blue-600 dark:border-blue-400 shadow-2xs'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Hóa đơn điện tử GTGT (Bản in A4)</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                Đã ký số
              </span>
            </button>
          </div>

          <div className="pb-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="hidden md:inline font-mono">
              Số HĐ: <strong className="text-rose-600 dark:text-rose-400">{invoiceMeta.invoiceNumber}</strong> • Ký hiệu:{' '}
              <strong className="text-slate-700 dark:text-slate-300">{invoiceMeta.serialCode}</strong>
            </span>
          </div>
        </div>

        {/* Status Toast / Feedback when printing or downloading */}
        {printStatusMessage && (
          <div className="no-print px-4 sm:px-6 py-2.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{printStatusMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Tải tệp HĐĐT (.HTML)</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintStatusMessage(null)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div
          id="order-success-scroll-container"
          className="overflow-y-auto p-3.5 sm:p-6 md:p-7 space-y-4 sm:space-y-6 flex-1"
        >
          {/* VIEW 1: INTERACTIVE ORDER SUMMARY (Hidden during print) */}
          <div className={`${viewMode === 'summary' ? 'block' : 'hidden'} no-print space-y-4 sm:space-y-6`}>
            {/* Brand Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 sm:pb-4">
              <Logo size="sm" />
              <div className="text-left sm:text-right text-[10px] sm:text-[11px] text-slate-500">
                <span className="font-bold text-slate-800 block">HỆ THỐNG NOVASHOP VIỆT NAM</span>
                <span>Hotline: 0908061843 • support@novashop.vn</span>
              </div>
            </div>

            {/* Bank-Verified Payment Success Banner (For QR & Online Paid Orders) */}
            {order.paymentStatus === 'paid' && (
              <div
                id="bank-verified-receipt-card"
                className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 border border-slate-800 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-400/60 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-300">
                        Xác nhận dữ liệu giao dịch từ ngân hàng
                      </p>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                        Giao dịch thanh toán thành công
                      </h3>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[11px] text-slate-400 block">Số tiền đã nhận</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
                      {formatVND(order.qrTransactionDetails?.amount ?? order.total)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                    <span className="text-slate-400">Mã giao dịch ngân hàng</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {order.qrTransactionDetails?.transactionId || order.transactionId || 'TXN-998811'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                    <span className="text-slate-400">Nội dung thanh toán</span>
                    <span className="font-mono font-bold text-amber-300">
                      {order.qrTransactionDetails?.transferContent || order.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                    <span className="text-slate-400">Ngân hàng / Cổng thụ hưởng</span>
                    <span className="font-semibold text-slate-200">
                      {order.paymentMethod === 'card'
                        ? 'Cổng Thẻ Quốc Tế 3D-Secure 2.0'
                        : order.qrTransactionDetails?.bankName || 'BIDV - PGD Tân Sơn Nhì'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                    <span className="text-slate-400">Tài khoản nhận</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {order.paymentMethod === 'card'
                        ? 'NOVASHOP ECOMMERCE (PCI-DSS)'
                        : order.qrTransactionDetails
                        ? `${order.qrTransactionDetails.accountNumber} · ${order.qrTransactionDetails.accountHolder}`
                        : '3180530681 · TRUONG MINH QUOC TRI'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/10 sm:border-b-0">
                    <span className="text-slate-400">Thời gian xác nhận</span>
                    <span className="font-mono text-slate-200 tabular-nums">
                      {new Date(
                        order.qrTransactionDetails?.confirmedAt || order.confirmedAt || order.createdAt
                      ).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">Trạng thái đơn hàng</span>
                    <span className="font-bold text-emerald-400">Đã thanh toán</span>
                  </div>
                </div>
              </div>
            )}

            {/* Top Order Highlights */}
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mã đơn hàng:</span>
                <span className="text-sm sm:text-lg font-mono font-black text-indigo-700">{order.id}</span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Thời gian đặt:</span>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái thanh toán:</span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                  order.paymentStatus === 'paid' 
                    ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300' 
                    : order.paymentMethod === 'installment'
                    ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                    : 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {order.paymentStatus === 'paid'
                    ? 'Đã Thanh Toán Trực Tuyến'
                    : order.paymentMethod === 'installment'
                    ? 'Hồ Sơ Trả Góp 0% Đã Duyệt'
                    : 'Chờ Thanh Toán COD'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mã giao dịch (Txn ID):</span>
                <span className="font-mono text-xs font-bold text-slate-700">{order.transactionId || 'TXN-998811'}</span>
              </div>
            </div>

            {/* Email Confirmation Status Card */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-blue-950 dark:text-blue-100 text-xs sm:text-sm">
                      Email xác nhận đơn hàng {order.paymentMethod === 'cod' ? '(COD)' : ''}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-700">
                      Tự động gửi
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                    Hệ thống đã gửi toàn bộ thông tin đơn hàng #{order.id} và hóa đơn điện tử đến:{' '}
                    <strong className="underline decoration-blue-400 font-bold">{order.customer.email}</strong>.
                    {order.paymentMethod === 'cod' && (
                      <span className="block mt-0.5 text-amber-800 dark:text-amber-300 font-medium">
                        💵 Số tiền thanh toán tiền mặt khi shipper giao hàng: <strong>{formatVND(order.total)}</strong>.
                      </span>
                    )}
                  </p>
                  {resendEmailMessage && (
                    <p
                      className={`text-[11px] font-semibold mt-1 ${
                        resendSuccess
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {resendEmailMessage}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={isResendingEmail}
                onClick={handleResendEmail}
                className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isResendingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi lại...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi lại email</span>
                  </>
                )}
              </button>
            </div>

            {/* Customer & Shipping Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Địa chỉ giao hàng
                </h4>
                <p className="font-extrabold text-slate-800 text-sm">{order.customer.fullName}</p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" /> {order.customer.phone}
                </p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400" /> {order.customer.email}
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {order.customer.address}, {order.customer.district}, {order.customer.city}
                </p>
                {order.customer.note && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Ghi chú: "{order.customer.note}"
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Vận chuyển &amp; Thanh toán
                </h4>
                <div>
                  <span className="text-slate-400 text-[10px] block">Hình thức vận chuyển:</span>
                  <span className="font-bold text-slate-800">{order.shipping.name}</span>
                  <span className="text-slate-500 text-[11px] block">{order.shipping.estimatedDays}</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 text-[10px] block">Cổng thanh toán:</span>
                  <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> {paymentMethodLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Installment Plan Banner if applicable */}
            {order.installmentDetails && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <span className="keep-dark-text px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">0% LÃI SUẤT</span>
                    Hồ Sơ Mua Trả Góp {order.installmentDetails.providerName}
                  </span>
                  <span className="font-mono text-slate-600 font-bold">Mã hồ sơ: {order.installmentDetails.approvalCode || order.id}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-white p-2 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] text-slate-400 block">Kỳ hạn:</span>
                    <span className="font-bold text-slate-800">{order.installmentDetails.tenureMonths} tháng</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] text-slate-400 block">Trả trước ({order.installmentDetails.downPaymentPercent}%):</span>
                    <span className="font-bold text-slate-800">{formatVND(order.installmentDetails.downPaymentAmount)}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] text-slate-400 block">Góp mỗi tháng:</span>
                    <span className="font-black text-indigo-700">{formatVND(order.installmentDetails.monthlyPayment)}/tháng</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] text-slate-400 block">Lãi suất &amp; phí:</span>
                    <span className="font-bold text-emerald-600">0₫ (Miễn phí)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Purchased Items Table */}
            <div className="border border-slate-200/80 rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="bg-slate-100/80 px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold text-slate-700 grid grid-cols-12">
                <span className="col-span-6 sm:col-span-7">Sản phẩm</span>
                <span className="col-span-2 text-center">SL</span>
                <span className="col-span-4 sm:col-span-3 text-right">Thành tiền</span>
              </div>
              <div className="divide-y divide-slate-100 p-1.5 sm:p-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="px-1.5 sm:px-2 py-2 sm:py-2.5 text-[11px] sm:text-xs grid grid-cols-12 items-center gap-1">
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-2 min-w-0">
                      <img 
                        src={item.product.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'} 
                        alt={item.product.name} 
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover border border-slate-200 shrink-0" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{item.product.name}</div>
                        {item.selectedColor && <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">Màu: {item.selectedColor}</span>}
                      </div>
                    </div>
                    <span className="col-span-2 text-center font-bold text-slate-700">{item.quantity}</span>
                    <span className="col-span-4 sm:col-span-3 text-right font-extrabold text-slate-900 tabular-nums">
                      {formatVND(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính hàng hóa:</span>
                <span className="font-semibold text-slate-800">{formatVND(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí giao hàng:</span>
                <span>{order.shippingFee === 0 ? <strong className="text-emerald-600">Miễn phí</strong> : formatVND(order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Giảm giá Voucher ({order.voucherCode || 'Đã áp dụng'}):</span>
                  <span>-{formatVND(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                <span>
                  {order.paymentStatus === 'paid'
                    ? 'Tổng tiền đã thanh toán:'
                    : order.paymentMethod === 'installment'
                    ? 'Tổng giá trị hợp đồng trả góp 0%:'
                    : 'Tổng thanh toán khi nhận hàng (COD):'}
                </span>
                <span className="text-base text-indigo-700">{formatVND(order.total)}</span>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 italic">
                Bằng chữ: <strong className="text-slate-700">{invoiceMeta.amountInWords}</strong>
              </div>
            </div>
          </div>

          {/* VIEW 2: OFFICIAL A4 ELECTRONIC VAT INVOICE SHEET (Always printed during @media print) */}
          <div
            id="printable-a4-invoice-sheet"
            className={`${
              viewMode === 'invoice' ? 'block' : 'hidden print:block'
            } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-2 border-blue-900 dark:border-blue-500/40 rounded-2xl p-4 sm:p-7 shadow-md space-y-4`}
          >
            {/* Top Seller & Serial Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-blue-900">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-900 text-white font-black text-xs tracking-wider">
                  NOVASHOP.VN — HÓA ĐƠN ĐIỆN TỬ
                </div>
                <h3 className="text-xs sm:text-sm font-black text-blue-900 uppercase pt-1">
                  {invoiceMeta.sellerName}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-700">
                  Mã số thuế (Tax ID): <strong className="text-slate-900 font-mono">{invoiceMeta.sellerTaxId}</strong>
                </p>
                <p className="text-[11px] sm:text-xs text-slate-700">
                  Địa chỉ: {invoiceMeta.sellerAddress}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-700">
                  Điện thoại: <strong>{invoiceMeta.sellerPhone}</strong> • Email: <strong>{invoiceMeta.sellerEmail}</strong>
                </p>
                <p className="text-[11px] sm:text-xs text-slate-700">
                  Số tài khoản: <strong className="font-mono text-slate-900">{invoiceMeta.sellerBankAccount}</strong>
                </p>
              </div>

              <div className="sm:text-right bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs shrink-0 space-y-1">
                <div>
                  Mẫu số: <strong className="text-slate-900 font-mono">{invoiceMeta.formCode}</strong>
                </div>
                <div>
                  Ký hiệu: <strong className="text-slate-900 font-mono">{invoiceMeta.serialCode}</strong>
                </div>
                <div>
                  Số HĐ:{' '}
                  <strong className="text-rose-600 text-sm font-mono font-black">
                    {invoiceMeta.invoiceNumber}
                  </strong>
                </div>
                <div className="pt-1 border-t border-dashed border-slate-300">
                  Mã đơn: <strong className="text-blue-900 font-mono">#{order.id}</strong>
                </div>
              </div>
            </div>

            {/* Invoice Title & Tax Authority Code */}
            <div className="text-center space-y-1 py-1">
              <h1 className="text-lg sm:text-2xl font-black text-blue-900 tracking-wide uppercase">
                HÓA ĐƠN GIÁ TRỊ GIA TĂNG
              </h1>
              <p className="text-[11px] sm:text-xs font-bold text-slate-600">
                (BẢN THỂ HIỆN CỦA HÓA ĐƠN ĐIỆN TỬ)
              </p>
              <p className="text-xs text-slate-700">{invoiceMeta.issueDateFormatted}</p>
              <div className="pt-1">
                <span className="inline-block px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-mono text-[11px] font-bold">
                  Mã của Cơ quan thuế: {invoiceMeta.taxAuthorityCode}
                </span>
              </div>
            </div>

            {/* Buyer Information Box */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                <div>
                  Họ tên người mua hàng: <strong className="text-slate-900">{order.customer.fullName}</strong>
                </div>
                <div>
                  Số điện thoại liên hệ: <strong className="text-slate-900 tabular-nums">{order.customer.phone}</strong>
                </div>
                <div>
                  Email nhận HĐĐT: <strong className="text-slate-900">{order.customer.email}</strong>
                </div>
                <div>
                  Mã giao dịch (Txn ID):{' '}
                  <strong className="font-mono text-slate-900">
                    {order.qrTransactionDetails?.transactionId || order.transactionId || 'TXN-998811'}
                  </strong>
                </div>
                <div className="sm:col-span-2">
                  Địa chỉ giao hàng:{' '}
                  <strong className="text-slate-900">
                    {order.customer.address}, {order.customer.district}, {order.customer.city}
                  </strong>
                </div>
                <div>
                  Hình thức thanh toán: <strong className="text-slate-900">{invoiceMeta.paymentMethodText}</strong>
                </div>
                <div>
                  Trạng thái thanh toán:{' '}
                  <strong className="text-emerald-700">{invoiceMeta.paymentStatusText}</strong>
                </div>
              </div>
            </div>

            {/* Itemized VAT Invoice Table */}
            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white text-[11px] sm:text-xs">
                    <th className="py-2.5 px-2 text-center border-r border-blue-800 w-10">STT</th>
                    <th className="py-2.5 px-3 text-left border-r border-blue-800">Tên hàng hóa, dịch vụ</th>
                    <th className="py-2.5 px-2 text-center border-r border-blue-800 w-14">ĐVT</th>
                    <th className="py-2.5 px-2 text-center border-r border-blue-800 w-12">SL</th>
                    <th className="py-2.5 px-3 text-right border-r border-blue-800 w-28">Đơn giá</th>
                    <th className="py-2.5 px-3 text-right w-32">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700 border-r border-slate-300">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300">
                        <div className="font-bold text-slate-900">
                          {item.product.name}
                          {item.selectedColor ? ` — Phân loại: ${item.selectedColor}` : ''}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Bảo hành điện tử chính hãng 12–24 tháng • Mã SP: NV-
                          {String(item.product.id).padStart(4, '0')}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-700 border-r border-slate-300">
                        Chiếc
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-900 border-r border-slate-300 tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 border-r border-slate-300 tabular-nums">
                        {formatVND(item.product.price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                        {formatVND(item.product.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Amount in Words */}
            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              <div className="flex justify-between px-3.5 py-2 border-b border-slate-200 bg-white">
                <span className="text-slate-600">
                  Cộng tiền hàng hóa, dịch vụ (Đã bao gồm thuế GTGT {invoiceMeta.vatRatePercent}%):
                </span>
                <strong className="text-slate-900 tabular-nums">{formatVND(order.subtotal)}</strong>
              </div>
              <div className="flex flex-wrap justify-between gap-2 px-3.5 py-1.5 border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500">
                <span>
                  Trong đó: Tiền trước thuế: {formatVND(invoiceMeta.preTaxSubtotal)} • Thuế GTGT (
                  {invoiceMeta.vatRatePercent}%): {formatVND(invoiceMeta.vatAmount)}
                </span>
                <span>Đơn vị vận chuyển: {order.shipping.name}</span>
              </div>
              <div className="flex justify-between px-3.5 py-2 border-b border-slate-200 bg-white">
                <span className="text-slate-600">Phí vận chuyển &amp; bảo hiểm hàng hóa:</span>
                <strong className="text-slate-900">
                  {order.shippingFee === 0 ? '0 ₫ (Miễn phí)' : formatVND(order.shippingFee)}
                </strong>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between px-3.5 py-2 border-b border-slate-200 bg-white text-emerald-700">
                  <span>Chiết khấu thương mại / Voucher ({order.voucherCode || 'Ưu đãi'}):</span>
                  <strong className="tabular-nums">-{formatVND(order.discount)}</strong>
                </div>
              )}
              <div className="flex justify-between items-center px-3.5 py-2.5 bg-blue-50 text-blue-900 font-black text-sm">
                <span>TỔNG CỘNG TIỀN THANH TOÁN:</span>
                <span className="text-base tabular-nums">{formatVND(order.total)}</span>
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-lg bg-slate-50 border-l-4 border-blue-900 text-xs">
              Số tiền viết bằng chữ:{' '}
              <strong className="italic text-slate-900">{invoiceMeta.amountInWords}</strong>
            </div>

            {/* Digital Signatures Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-xs">
              <div className="text-center space-y-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="font-extrabold text-slate-800 uppercase">NGƯỜI MUA HÀNG</div>
                <div className="text-[11px] text-slate-500">(Chữ ký số / Xác nhận đặt hàng trực tuyến)</div>
                <div className="pt-2 font-bold text-slate-900">{order.customer.fullName}</div>
                <div className="text-[11px] font-semibold text-emerald-700">
                  ✓ Đã xác nhận giao dịch điện tử
                </div>
              </div>

              <div className="text-center space-y-1.5 p-3 rounded-xl border-2 border-emerald-600 bg-emerald-50/70">
                <div className="font-extrabold text-slate-800 uppercase">NGƯỜI BÁN HÀNG</div>
                <div className="text-[11px] text-emerald-800 font-extrabold">
                  ✓ SIGNATURE VALID — ĐÃ KÝ SỐ HỢP LỆ
                </div>
                <div className="text-[11px] text-slate-800 text-left space-y-0.5 bg-white/90 p-2.5 rounded-lg border border-emerald-300">
                  <div>
                    Ký bởi: <strong className="text-emerald-950">{invoiceMeta.sellerName}</strong>
                  </div>
                  <div>
                    Mã số thuế: <strong className="font-mono">{invoiceMeta.sellerTaxId}</strong>
                  </div>
                  <div>
                    Ký ngày: <strong className="font-mono">{signedDateStr}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Electronic Invoice Lookup Footer */}
            <div className="pt-3 border-t border-dashed border-slate-300 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Mã tra cứu HĐĐT:{' '}
                  <strong className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                    {invoiceMeta.lookupCode}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyLookupCode}
                  className="no-print inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  {copiedLookupCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Chép mã</span>
                    </>
                  )}
                </button>
              </div>
              <span>Khởi tạo từ phần mềm Hóa đơn điện tử NovaShop eInvoice</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="no-print p-3.5 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="print-invoice-btn"
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> In hóa đơn điện tử (PDF)
            </button>

            <button
              id="download-invoice-btn"
              type="button"
              onClick={handleDownloadInvoice}
              className="flex-1 sm:flex-initial py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Tải xuống bản Hóa đơn Điện tử chuẩn A4 (.HTML)"
            >
              <Download className="w-4 h-4 text-blue-600" /> Tải bản HĐĐT
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="view-all-orders-btn"
              type="button"
              onClick={() => {
                onClose();
                onViewOrders();
              }}
              className="flex-1 sm:flex-initial py-2.5 px-3 sm:px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors text-center cursor-pointer"
            >
              Xem đơn hàng
            </button>

            <button
              id="continue-shopping-btn"
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial py-2.5 px-4 sm:px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              Tiếp tục mua sắm <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
