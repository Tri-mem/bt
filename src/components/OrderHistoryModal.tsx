import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Package, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Truck, 
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  ChevronRight,
  RefreshCw,
  ClipboardCheck,
  PackageCheck,
  MapPin,
  ArrowRight,
  Printer
} from 'lucide-react';
import { Order, OrderProgressStage } from '../types';
import { formatVND } from '../data/mockData';
import { printElectronicInvoice } from '../utils/electronicInvoice';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onSelectOrderToView: (order: Order) => void;
  onUpdateOrderStatus?: (orderId: string, status: OrderProgressStage) => void;
}

interface ServerQrTransaction {
  orderId: string;
  transactionId: string;
  amount: number;
  confirmedAt: string;
  accountNumber: string;
  accountHolder: string;
  bankCode: string;
  bankName: string;
  transferContent: string;
}

interface DisplayQrTransaction {
  transactionId: string;
  orderId: string;
  confirmedAt: string;
  amount: number;
  paymentMethodLabel: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  transferContent: string;
  customerName?: string;
  customerPhone?: string;
  itemSummary?: string;
  order?: Order;
}

function formatRealTimeDateTime(isoString: string): { dateStr: string; timeStr: string; fullStr: string } {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return { dateStr: isoString, timeStr: '', fullStr: isoString };
  }
  const timeStr = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const dateStr = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return {
    dateStr,
    timeStr,
    fullStr: `${timeStr} · ${dateStr}`,
  };
}

const ORDER_PROGRESS_STEPS: {
  id: OrderProgressStage;
  stepNumber: number;
  labelVi: string;
  labelEn: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'confirmed',
    stepNumber: 1,
    labelVi: 'Đã xác nhận',
    labelEn: 'Confirmed',
    icon: ClipboardCheck,
  },
  {
    id: 'packing',
    stepNumber: 2,
    labelVi: 'Đang đóng gói',
    labelEn: 'Packing',
    icon: PackageCheck,
  },
  {
    id: 'shipping',
    stepNumber: 3,
    labelVi: 'Đang vận chuyển',
    labelEn: 'Shipping',
    icon: Truck,
  },
  {
    id: 'delivered',
    stepNumber: 4,
    labelVi: 'Đã giao hàng',
    labelEn: 'Delivered',
    icon: CheckCircle2,
  },
];

function getStepIndex(status?: OrderProgressStage): number {
  const idx = ORDER_PROGRESS_STEPS.findIndex((s) => s.id === status);
  return idx >= 0 ? idx : 0;
}

function formatOffsetTime(isoBase: string, addMinutes: number): string {
  const base = new Date(isoBase);
  if (isNaN(base.getTime())) return '';
  const target = new Date(base.getTime() + addMinutes * 60 * 1000);
  const time = target.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const date = target.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
  return `${time} · ${date}`;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  onSelectOrderToView,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions'>('orders');
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderProgressStage>('all');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);
  const [serverQrTxs, setServerQrTxs] = useState<ServerQrTransaction[]>([]);
  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, OrderProgressStage>>({});
  const [inspectedStepByOrder, setInspectedStepByOrder] = useState<Record<string, OrderProgressStage>>({});

  const getEffectiveOrderStatus = (order: Order): OrderProgressStage => {
    return localStatusOverrides[order.id] || order.orderStatus || 'confirmed';
  };

  const handleSetOrderStage = (order: Order, nextStage: OrderProgressStage) => {
    setLocalStatusOverrides((prev) => ({ ...prev, [order.id]: nextStage }));
    setInspectedStepByOrder((prev) => ({ ...prev, [order.id]: nextStage }));
    onUpdateOrderStatus?.(order.id, nextStage);
  };

  const handleCopyTracking = (trackingCode: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(trackingCode);
      setCopiedTrackingId(trackingCode);
      setTimeout(() => setCopiedTrackingId(null), 2000);
    }
  };

  // Fetch server-confirmed QR transactions when modal opens or switches to 'transactions' tab
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch('/api/payment/qr-transactions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.transactions)) {
          setServerQrTxs(data.transactions);
        }
      })
      .catch(() => {
        // ignore network error
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, orders.length]);

  // Combine confirmed QR orders from local state + server QR sessions
  const qrTransactions = useMemo<DisplayQrTransaction[]>(() => {
    const map = new Map<string, DisplayQrTransaction>();

    // 1. From orders with VietQR / VNPay-QR confirmed payment
    for (const order of orders) {
      const isQrOrder =
        (order.paymentMethod === 'vietqr' || order.paymentMethod === 'vnpay') &&
        order.paymentStatus === 'paid';
      if (!isQrOrder && !order.qrTransactionDetails) continue;

      const qrDetails = order.qrTransactionDetails;
      const txId =
        qrDetails?.transactionId ||
        order.transactionId ||
        `FT26282${order.id.replace(/\D/g, '')}`;
      const confirmedAt = qrDetails?.confirmedAt || order.confirmedAt || order.createdAt;

      map.set(order.id, {
        transactionId: txId,
        orderId: order.id,
        confirmedAt,
        amount: qrDetails?.amount ?? order.total,
        paymentMethodLabel:
          order.paymentMethod === 'vnpay' ? 'VNPay-QR Napas 247' : 'VietQR Napas 247 (BIDV)',
        bankName: qrDetails?.bankName || 'BIDV - PGD Tân Sơn Nhì',
        accountNumber: qrDetails?.accountNumber || '3180530681',
        accountHolder: qrDetails?.accountHolder || 'TRUONG MINH QUOC TRI',
        transferContent: qrDetails?.transferContent || order.id,
        customerName: order.customer.fullName,
        customerPhone: order.customer.phone,
        itemSummary: order.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', '),
        order,
      });
    }

    // 2. Merge any confirmed server QR sessions not yet in map or enrich timestamp/txId
    for (const stx of serverQrTxs) {
      const existing = map.get(stx.orderId);
      if (existing) {
        if (stx.transactionId) existing.transactionId = stx.transactionId;
        if (stx.confirmedAt) existing.confirmedAt = stx.confirmedAt;
      } else {
        map.set(stx.orderId, {
          transactionId: stx.transactionId,
          orderId: stx.orderId,
          confirmedAt: stx.confirmedAt,
          amount: stx.amount,
          paymentMethodLabel: 'VietQR Napas 247 (BIDV)',
          bankName: stx.bankName || 'BIDV - PGD Tân Sơn Nhì',
          accountNumber: stx.accountNumber || '3180530681',
          accountHolder: stx.accountHolder || 'TRUONG MINH QUOC TRI',
          transferContent: stx.transferContent || stx.orderId,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime()
    );
  }, [orders, serverQrTxs]);

  if (!isOpen) return null;

  const q = filterQuery.toLowerCase().trim();

  const filteredOrders = orders.filter((order) => {
    const effectiveStatus = getEffectiveOrderStatus(order);
    if (statusFilter !== 'all' && effectiveStatus !== statusFilter) {
      return false;
    }
    if (!q) return true;
    return (
      order.id.toLowerCase().includes(q) ||
      (order.transactionId && order.transactionId.toLowerCase().includes(q)) ||
      order.customer.fullName.toLowerCase().includes(q) ||
      order.customer.phone.includes(q) ||
      order.items.some((i) => i.product.name.toLowerCase().includes(q))
    );
  });

  const filteredTransactions = qrTransactions.filter((tx) => {
    if (!q) return true;
    return (
      tx.transactionId.toLowerCase().includes(q) ||
      tx.orderId.toLowerCase().includes(q) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
      (tx.customerPhone && tx.customerPhone.includes(q)) ||
      (tx.itemSummary && tx.itemSummary.toLowerCase().includes(q))
    );
  });

  const totalQrConfirmedAmount = qrTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const handleCopyTxId = (txId: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txId);
      setCopiedTxId(txId);
      setTimeout(() => setCopiedTxId(null), 2000);
    }
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
        id="order-history-modal"
        className="relative bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              {activeTab === 'orders' ? (
                <Package className="w-5 h-5" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Quản Lý Đơn Hàng & Giao Dịch QR
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Tra cứu tiến độ vận chuyển 4 bước và lịch sử giao dịch quét mã QR thời gian thực
              </p>
            </div>
          </div>
          <button
            id="close-order-history-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs: Đơn hàng | Giao dịch */}
        <div className="px-4 sm:px-6 pt-2.5 bg-slate-50/50 border-b border-slate-200/80 flex items-center gap-2 shrink-0">
          <button
            id="tab-order-history-orders"
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Đơn hàng</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${
                activeTab === 'orders'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            id="tab-order-history-transactions"
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'transactions'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>Giao dịch</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${
                activeTab === 'transactions'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {qrTransactions.length}
            </span>
          </button>
        </div>

        {/* Search / Filter bar + Step Progress Filter Pills */}
        <div className="p-3 sm:p-4 sm:px-6 border-b border-slate-100 bg-white shrink-0 space-y-2.5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={
                activeTab === 'orders'
                  ? 'Tìm theo mã đơn hàng (NOVA-...), số điện thoại hoặc tên sản phẩm...'
                  : 'Tìm theo ID giao dịch (FT...), mã đơn hàng (NOVA-...) hoặc tên khách hàng...'
              }
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {activeTab === 'orders' && orders.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({orders.length})
              </button>
              {ORDER_PROGRESS_STEPS.map((step) => {
                const count = orders.filter((o) => getEffectiveOrderStatus(o) === step.id).length;
                const isSelected = statusFilter === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setStatusFilter(step.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>
                      {step.stepNumber}. {step.labelVi}
                    </span>
                    <span className="opacity-80 tabular-nums">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tab 1: Order List */}
        {activeTab === 'orders' && (
          <div className="overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 space-y-4 flex-1">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Package className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Chưa có đơn hàng nào</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Khi bạn hoàn tất mua sắm và thanh toán, các đơn hàng sẽ tự động lưu tại đây để bạn theo dõi tiến độ giao hàng 4 bước trực quan.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const currentStatus = getEffectiveOrderStatus(order);
                const currentStepIdx = getStepIndex(currentStatus);
                const inspectedStage = inspectedStepByOrder[order.id] || currentStatus;
                const inspectedIdx = getStepIndex(inspectedStage);
                const progressPercentage = ((currentStepIdx + 1) / ORDER_PROGRESS_STEPS.length) * 100;
                const trackFillPercent = (currentStepIdx / (ORDER_PROGRESS_STEPS.length - 1)) * 100;
                const trackingNumber = `NVX-${order.id.replace(/\D/g, '') || '882910'}${
                  order.shipping.id === 'express' ? 'HT' : 'VN'
                }`;
                const carrierName =
                  order.shipping.id === 'express'
                    ? 'NovaSpeed Express (Giao hỏa tốc 2H)'
                    : 'Viettel Post / GHTK Chính Ngạch';

                const stepMetaByStage: Record<
                  OrderProgressStage,
                  {
                    subLabel: string;
                    timeLabel: string;
                    locationLabel: string;
                    detailDesc: string;
                  }
                > = {
                  confirmed: {
                    subLabel:
                      order.paymentStatus === 'paid'
                        ? 'Đã duyệt thanh toán'
                        : order.paymentMethod === 'installment'
                        ? 'Đã duyệt trả góp 0%'
                        : 'Xác nhận đơn COD',
                    timeLabel: formatOffsetTime(order.createdAt, 0),
                    locationLabel: 'Hệ thống điều phối đơn hàng NovaShop',
                    detailDesc:
                      order.paymentStatus === 'paid'
                        ? 'Đơn hàng đã được xác nhận thanh toán trực tuyến thành công và chuyển sang bộ phận kho vận.'
                        : 'Đơn hàng đã được xác nhận thông tin người nhận và khởi tạo phiếu xuất kho chính hãng.',
                  },
                  packing: {
                    subLabel: 'Kiểm định & Niêm phong',
                    timeLabel: formatOffsetTime(order.createdAt, 15),
                    locationLabel: 'Trung tâm Kho vận & Kiểm định NovaCare TP.HCM',
                    detailDesc:
                      'Kỹ thuật viên đã đối chiếu số Serial/IMEI chính ngạch, bọc xốp chống sốc 3 lớp và dán tem niêm phong bảo mật NovaShop.',
                  },
                  shipping: {
                    subLabel: order.shipping.estimatedDays || 'Đang trung chuyển',
                    timeLabel: formatOffsetTime(order.createdAt, 45),
                    locationLabel: `Bưu cục điều phối ${carrierName} → ${order.customer.city || 'Khu vực nhận hàng'}`,
                    detailDesc: `Kiện hàng mã vận đơn ${trackingNumber} đang trên tuyến giao tới ${order.customer.address}, ${order.customer.district}, ${order.customer.city} (Bảo hiểm hàng hóa 100%).`,
                  },
                  delivered: {
                    subLabel: 'Đồng kiểm & Kích hoạt BH',
                    timeLabel: formatOffsetTime(
                      order.createdAt,
                      order.shipping.id === 'express' ? 115 : 1440
                    ),
                    locationLabel: `${order.customer.address}, ${order.customer.district}, ${order.customer.city}`,
                    detailDesc:
                      'Giao hàng thành công • Người nhận đã đồng kiểm ngoại quan nguyên seal và hệ thống đã kích hoạt bảo hành điện tử chính hãng 12–24 tháng.',
                  },
                };

                const inspectedMeta = stepMetaByStage[inspectedStage];
                const nextStepObj =
                  currentStepIdx < ORDER_PROGRESS_STEPS.length - 1
                    ? ORDER_PROGRESS_STEPS[currentStepIdx + 1]
                    : null;

                return (
                  <div 
                    key={order.id} 
                    id={`order-history-item-${order.id}`}
                    className="pt-4 first:pt-0 pb-2 space-y-3"
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {order.id}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 flex items-center gap-1 tabular-nums">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}{' '}
                          {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          order.paymentMethod === 'installment'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : order.paymentStatus === 'paid' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.paymentMethod === 'installment'
                            ? `Trả Góp 0% (${order.installmentDetails?.providerName || 'Duyệt hồ sơ'} · ${order.installmentDetails?.tenureMonths || 6}T)`
                            : order.paymentStatus === 'paid' 
                            ? 'Đã Thanh Toán Online' 
                            : 'Chờ Thanh Toán COD'}
                        </span>

                        <button
                          id={`print-invoice-history-btn-${order.id}`}
                          type="button"
                          onClick={() => printElectronicInvoice(order)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          title="In Hóa đơn Điện tử chuẩn A4 (PDF)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>In HĐĐT</span>
                        </button>

                        <button
                          id={`view-invoice-btn-${order.id}`}
                          onClick={() => onSelectOrderToView(order)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline px-2 py-1 cursor-pointer"
                        >
                          <span>Chi tiết hóa đơn</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Visual Step-by-Step Progress Tracker (Confirmed -> Packing -> Shipping -> Delivered) */}
                    <div
                      id={`order-progress-tracker-${order.id}`}
                      className="bg-slate-50/90 p-3 sm:p-4 rounded-2xl border border-slate-200/80 space-y-3.5"
                    >
                      {/* Tracker Top Header: Current Status Summary + Tracking Code + Advance Stage Action */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Tiến độ đơn hàng:</span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold tabular-nums ${
                              currentStatus === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            }`}
                          >
                            Bước {currentStepIdx + 1}/4 · {ORDER_PROGRESS_STEPS[currentStepIdx].labelVi} ({ORDER_PROGRESS_STEPS[currentStepIdx].labelEn}) · {progressPercentage}%
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleCopyTracking(trackingNumber)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-mono text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Sao chép mã vận đơn"
                          >
                            <span>Mã vận đơn: {trackingNumber}</span>
                            {copiedTrackingId === trackingNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>

                          {nextStepObj ? (
                            <button
                              type="button"
                              onClick={() => handleSetOrderStage(order, nextStepObj.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                              title={`Chuyển sang trạng thái: ${nextStepObj.labelVi}`}
                            >
                              <span>Chuyển: {nextStepObj.labelVi}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetOrderStage(order, 'confirmed')}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Đặt lại tiến trình từ bước 1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Xem lại từ đầu</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 4-Step Visual Progress Stepper with Connecting Progress Line */}
                      <div className="relative pt-1 pb-0.5">
                        {/* Connecting Horizontal Track Line (Behind Nodes) */}
                        <div
                          aria-hidden="true"
                          className="absolute top-5 sm:top-6 left-[12.5%] right-[12.5%] h-1.5 bg-slate-200 rounded-full overflow-hidden"
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                              currentStatus === 'delivered'
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600'
                            }`}
                            style={{ width: `${trackFillPercent}%` }}
                          />
                        </div>

                        {/* 4 Step Nodes: Confirmed -> Packing -> Shipping -> Delivered */}
                        <div className="relative z-10 grid grid-cols-4 gap-1 sm:gap-2">
                          {ORDER_PROGRESS_STEPS.map((step, idx) => {
                            const StepIcon = step.icon;
                            const isCompleted =
                              idx < currentStepIdx || currentStatus === 'delivered';
                            const isCurrent =
                              idx === currentStepIdx && currentStatus !== 'delivered';
                            const isInspected = inspectedStage === step.id;
                            const meta = stepMetaByStage[step.id];

                            return (
                              <button
                                key={step.id}
                                type="button"
                                onClick={() => handleSetOrderStage(order, step.id)}
                                className={`group flex flex-col items-center text-center min-w-0 p-1.5 rounded-xl transition-all cursor-pointer ${
                                  isInspected
                                    ? 'bg-white/90 shadow-2xs ring-1 ring-slate-200/90'
                                    : 'hover:bg-white/60'
                                }`}
                                title={`${step.stepNumber}. ${step.labelVi} (${step.labelEn}) — Nhấn để cập nhật hoặc xem chi tiết`}
                              >
                                {/* Circular Step Node */}
                                <div
                                  className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 mb-1.5 ${
                                    isCompleted
                                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs'
                                      : isCurrent
                                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm scale-105'
                                      : 'bg-white text-slate-400 border-2 border-slate-300 group-hover:border-indigo-400 group-hover:text-indigo-500'
                                  }`}
                                >
                                  <StepIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                  {isCompleted && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-700 border-2 border-white text-white flex items-center justify-center text-[8px] font-black">
                                      ✓
                                    </span>
                                  )}
                                </div>

                                {/* Step Title (Vietnamese + English) */}
                                <span
                                  className={`text-[10px] sm:text-xs font-extrabold truncate w-full ${
                                    isCompleted
                                      ? 'text-emerald-800'
                                      : isCurrent
                                      ? 'text-indigo-700'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {step.labelVi}
                                </span>

                                <span
                                  className={`text-[9px] sm:text-[10px] font-semibold truncate w-full ${
                                    isCompleted
                                      ? 'text-emerald-600'
                                      : isCurrent
                                      ? 'text-indigo-600'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {step.labelEn} · {meta.subLabel}
                                </span>

                                {/* Timestamp */}
                                <span className="text-[8px] sm:text-[10px] text-slate-400 tabular-nums truncate w-full mt-0.5">
                                  {idx <= currentStepIdx ? meta.timeLabel : `Dự kiến: ${meta.timeLabel}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active / Inspected Step Live Logistics Checkpoint Detail Box */}
                      <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                inspectedIdx <= currentStepIdx
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {ORDER_PROGRESS_STEPS[inspectedIdx].labelEn}
                            </span>
                            <span className="font-bold text-slate-800 truncate">
                              {ORDER_PROGRESS_STEPS[inspectedIdx].labelVi}: {inspectedMeta.subLabel}
                            </span>
                            <span className="text-slate-400 hidden sm:inline">•</span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span className="truncate">{inspectedMeta.locationLabel}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {inspectedMeta.detailDesc}
                          </p>
                        </div>

                        <div className="text-[10px] sm:text-[11px] text-slate-500 font-semibold tabular-nums shrink-0 sm:text-right">
                          <span className="block text-slate-400">Đơn vị điều phối</span>
                          <strong className="text-slate-700">{carrierName}</strong>
                        </div>
                      </div>
                    </div>

                  {/* Items preview in order */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-100">
                        <img 
                          src={item.product.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'} 
                          alt={item.product.name} 
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 truncate">{item.product.name}</p>
                          <span className="text-[11px] text-slate-500">Số lượng: {item.quantity}</span>
                        </div>
                        <span className="font-extrabold text-slate-900 shrink-0">{formatVND(item.product.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Total */}
                  <div className="pt-1 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-slate-500 block">
                      Người nhận: <strong>{order.customer.fullName}</strong> ({order.customer.phone})
                    </span>
                    <div className="self-end sm:self-auto text-right">
                      <span className="text-slate-500 mr-2">Tổng thanh toán:</span>
                      <span className="text-sm font-black text-indigo-700">{formatVND(order.total)}</span>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Confirmed QR Transactions List */}
        {activeTab === 'transactions' && (
          <div className="overflow-y-auto p-3.5 sm:p-6 space-y-3.5 flex-1 bg-slate-50/40">
            {/* Summary Banner for Confirmed QR Transactions */}
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border border-teal-500/30 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                    Đối Soát Giao Dịch Quét Mã VietQR Napas 247
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-teal-200/90 truncate">
                    TK thụ hưởng: BIDV · 3180530681 · TRUONG MINH QUOC TRI
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right ml-auto">
                <div>
                  <span className="text-[10px] text-slate-300 block">Số giao dịch thành công</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-400 tabular-nums">
                    {qrTransactions.length} giao dịch
                  </span>
                </div>
                <div className="pl-3 border-l border-white/15">
                  <span className="text-[10px] text-slate-300 block">Tổng tiền đã xác nhận</span>
                  <span className="text-xs sm:text-sm font-black text-amber-300 tabular-nums">
                    {formatVND(totalQrConfirmedAmount)}
                  </span>
                </div>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 sm:py-12 px-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <QrCode className="w-7 h-7 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Chưa có giao dịch quét mã QR nào được ghi nhận
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Khi quý khách thanh toán đơn hàng bằng hình thức quét mã <strong>VietQR / VNPay-QR</strong> và được hệ thống xác nhận thành công, toàn bộ thông tin <strong>ID giao dịch</strong> và <strong>thời gian thực tế</strong> sẽ hiển thị chi tiết tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => {
                  const { fullStr, timeStr, dateStr } = formatRealTimeDateTime(tx.confirmedAt);
                  const isCopied = copiedTxId === tx.transactionId;

                  return (
                    <div
                      key={`${tx.orderId}-${tx.transactionId}`}
                      id={`qr-transaction-item-${tx.orderId}`}
                      className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400/80 p-3.5 sm:p-4 shadow-2xs transition-all space-y-3"
                    >
                      {/* Top Row: Transaction ID + Confirmed Badge + Real-time Timestamp */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono font-black text-xs sm:text-sm">
                            <QrCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>ID GD: {tx.transactionId}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyTxId(tx.transactionId)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Sao chép ID giao dịch"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>Sao chép ID</span>
                              </>
                            )}
                          </button>

                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Đã xác nhận thành công</span>
                          </span>
                        </div>

                        <div
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg tabular-nums"
                          title={`Thời gian thực tế xác nhận: ${fullStr}`}
                        >
                          <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>Thời gian thực tế:</span>
                          <strong className="text-slate-900">{timeStr}</strong>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-700">{dateStr}</span>
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block">Mã đơn hàng & Nội dung CK</span>
                          <div className="font-mono font-bold text-indigo-700 flex items-center gap-1.5">
                            <span>#{tx.orderId}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-[11px] text-slate-600">{tx.paymentMethodLabel}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>Tài khoản nhận QR</span>
                          </span>
                          <div className="font-bold text-slate-800 truncate">
                            {tx.bankName} · <span className="font-mono">{tx.accountNumber}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{tx.accountHolder}</div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex flex-col justify-center sm:items-end">
                          <span className="text-[10px] text-emerald-700 font-medium">
                            Số tiền thanh toán qua QR
                          </span>
                          <span className="text-sm sm:text-base font-black text-emerald-700 tabular-nums">
                            {formatVND(tx.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Customer, Product Summary & View Invoice Button */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <div className="text-slate-500 min-w-0 flex-1 truncate">
                          {tx.customerName ? (
                            <span>
                              Khách hàng: <strong className="text-slate-800">{tx.customerName}</strong>
                              {tx.customerPhone ? ` (${tx.customerPhone})` : ''}
                              {tx.itemSummary ? ` · ${tx.itemSummary}` : ''}
                            </span>
                          ) : (
                            <span>
                              Nội dung đối soát: <strong className="font-mono text-slate-800">{tx.transferContent}</strong>
                            </span>
                          )}
                        </div>

                        {tx.order && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              id={`print-qr-tx-invoice-btn-${tx.orderId}`}
                              type="button"
                              onClick={() => printElectronicInvoice(tx.order!)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-bold text-xs transition-colors cursor-pointer"
                              title="In Hóa đơn Điện tử chuẩn A4 (PDF)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>In HĐĐT</span>
                            </button>

                            <button
                              id={`view-qr-tx-invoice-btn-${tx.orderId}`}
                              type="button"
                              onClick={() => onSelectOrderToView(tx.order!)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                            >
                              <span>Xem hóa đơn</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
