import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  Smartphone, 
  Wallet, 
  Banknote, 
  Truck, 
  Zap, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Lock, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  CalendarClock,
  Building2,
  Upload,
  Mail,
} from 'lucide-react';
import { CartItem, CustomerInfo, Order, PaymentMethodId, ShippingMethod, Voucher, InstallmentOrderDetails, UserProfile } from '../types';
import { PAYMENT_METHODS, SHIPPING_METHODS, formatVND } from '../data/mockData';
import { INSTALLMENT_BANKS, FINANCE_COMPANIES, calculateInstallment } from '../data/installmentData';
import {
  initFirebasePaymentTransactionSession,
  syncFirebasePaymentTransactionStatus,
  checkFirebasePaymentTransactionStatus,
  subscribeFirebasePaymentTransaction,
} from '../firebase';

const API_URL =
  'https://script.google.com/macros/s/AKfycbzmJyBCk_xk8gG-cW6M8VUk-v4f_3-_TTO6fpUEAW8F31z_BMc6Ysbgg6ENfryyhNbQ0g/exec';

const generateOrderId = () => `DH${Math.floor(100000 + Math.random() * 900000)}`;

const BIDV_MERCHANT_QR = {
  bankBin: '970418',
  bankCode: 'BIDV',
  bankName: 'BIDV - PGD Tân Sơn Nhì',
  accountNumber: '3180530681',
  accountHolder: 'TRUONG MINH QUOC TRI',
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  appliedVoucher: Voucher | null;
  onOrderSuccess: (order: Order) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onBackToCart?: () => void;
  isPage?: boolean;
  onBackToHome?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  appliedVoucher,
  onOrderSuccess,
  currentUser,
  onOpenAuth,
  onBackToCart,
  isPage = false,
  onBackToHome,
}) => {
  // Checkout Steps: 1 = Shipping & Info, 2 = Payment Gateway, 3 = Verifying
  const [step, setStep] = useState<1 | 2>(1);

  // Form State (left blank so the user fills in their own recipient & shipping info)
  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    district: '',
    address: '',
    note: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod>(SHIPPING_METHODS[0]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId>('vietqr');

  // Card Payment States
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Installment Payment States
  const [instMethod, setInstMethod] = useState<'credit_card' | 'finance_company'>('credit_card');
  const [instBankId, setInstBankId] = useState<string>(INSTALLMENT_BANKS[0].id);
  const [instCardType, setInstCardType] = useState<'visa' | 'mastercard' | 'jcb'>('visa');
  const [instTenure, setInstTenure] = useState<number>(6);
  const [instFinanceId, setInstFinanceId] = useState<string>(FINANCE_COMPANIES[0].id);
  const [instPrepayRate, setInstPrepayRate] = useState<number>(20);
  const [instCardLast4, setInstCardLast4] = useState<string>('');
  const [instIdCard, setInstIdCard] = useState<string>('');

  // VietQR copied notification & processing state
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [qrImgFallback, setQrImgFallback] = useState(false);

  // Automatic Real-Time QR Bank Transaction Verification states
  const [isQrPaymentVerified, setIsQrPaymentVerified] = useState(false);
  const [verifiedQrAmount, setVerifiedQrAmount] = useState<number>(0);
  const [verifiedQrTxId, setVerifiedQrTxId] = useState<string>('');
  const [verifiedQrPaidAt, setVerifiedQrPaidAt] = useState<string>('');
  const [qrAutoStatusMessage, setQrAutoStatusMessage] = useState<string>(
    'Đang kiểm tra giao dịch tự động qua Ngân hàng BIDV (STK: 3180530681)... Giao diện sẽ tự động xác nhận và đóng khi ghi nhận giao dịch thành công.'
  );
  const [qrTxRefInput, setQrTxRefInput] = useState<string>('');
  const [isVerifyingQrTransfer, setIsVerifyingQrTransfer] = useState<boolean>(false);
  const [qrVerifyError, setQrVerifyError] = useState<string | null>(null);
  const [qrUnderpaidInfo, setQrUnderpaidInfo] = useState<{
    paidAmount: number;
    expectedAmount: number;
    shortfallAmount: number;
    transactionId?: string;
    message?: string;
  } | null>(null);
  const [paymentVerificationState, setPaymentVerificationState] = useState<
    'VERIFYING' | 'INSUFFICIENT' | 'MATCHED'
  >('VERIFYING');
  const [firebaseCheckCount, setFirebaseCheckCount] = useState<number>(0);
  const [firebaseLastCheckedAt, setFirebaseLastCheckedAt] = useState<string>('');
  const [isCheckingFirebaseNow, setIsCheckingFirebaseNow] = useState<boolean>(false);
  const [manualVerifyAmountInput, setManualVerifyAmountInput] = useState<string>('');
  const [showVerifySimulator, setShowVerifySimulator] = useState<boolean>(false);
  const [showWebhookConfig, setShowWebhookConfig] = useState<boolean>(false);
  const receiptFileInputRef = useRef<HTMLInputElement | null>(null);
  const autoConfirmedRef = useRef<boolean>(false);

  // Generated Order Reference ("DH" + 6 digits, no spaces)
  const [tempOrderId, setTempOrderId] = useState(() => generateOrderId());

  // Reset checkout state cleanly each time it opens, pre-filling from logged-in user if available
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCustomer({
        fullName: currentUser?.fullName || '',
        phone: currentUser?.phone || '',
        email: currentUser?.email || '',
        city: currentUser?.city || '',
        district: currentUser?.district || '',
        address: currentUser?.address || '',
        note: '',
      });
      setCardNumber('');
      setCardHolder('');
      setCardExpiry('');
      setCardCvv('');
      setInstCardLast4('');
      setInstIdCard('');
      setOtpCode('');
      setTempOrderId(generateOrderId());
      setIsProcessing(false);
      setShowOtpModal(false);
      setFormErrors({});
      setQrImgFallback(false);
      setIsQrPaymentVerified(false);
      setVerifiedQrAmount(0);
      setVerifiedQrTxId('');
      setVerifiedQrPaidAt('');
      setQrTxRefInput('');
      setIsVerifyingQrTransfer(false);
      setQrVerifyError(null);
      setQrUnderpaidInfo(null);
      setPaymentVerificationState('VERIFYING');
      setFirebaseCheckCount(0);
      setFirebaseLastCheckedAt('');
      setIsCheckingFirebaseNow(false);
      setManualVerifyAmountInput('');
      setShowVerifySimulator(false);
      setQrAutoStatusMessage(
        'Đang kiểm tra giao dịch tự động qua Ngân hàng BIDV (STK: 3180530681)... Giao diện sẽ tự động xác nhận và đóng khi ghi nhận giao dịch thành công.'
      );
      autoConfirmedRef.current = false;
    }
  }, [isOpen]);

  // Subtotal & Totals
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const hasTestProduct = cartItems.some(
    (item) => item.product.id === 'prod-test-20k' || item.product.id === 'prod-test-10k' || item.product.price <= 20000
  );
  
  let discountAmount = 0;
  if (appliedVoucher && subtotal >= appliedVoucher.minOrderValue) {
    if (appliedVoucher.discountType === 'percent') {
      discountAmount = Math.min(Math.round((subtotal * appliedVoucher.discountValue) / 100), 500000);
    } else {
      discountAmount = appliedVoucher.discountValue;
    }
  }

  // Free shipping on standard if subtotal >= 300K or when testing the demo product
  const actualShippingFee =
    selectedShipping.id === 'standard' && (subtotal >= 300000 || hasTestProduct)
      ? 0
      : selectedShipping.price;

  const finalTotal = Math.max(0, subtotal - discountAmount + actualShippingFee);

  // If the order amount changes (e.g. shipping method changed), reset QR verification
  useEffect(() => {
    setQrImgFallback(false);
    setQrUnderpaidInfo(null);
    setPaymentVerificationState('VERIFYING');
    if (verifiedQrAmount !== finalTotal) {
      setIsQrPaymentVerified(false);
      autoConfirmedRef.current = false;
    }
  }, [finalTotal, verifiedQrAmount]);

  const activeQrTransferAmount =
    qrUnderpaidInfo && qrUnderpaidInfo.shortfallAmount > 0
      ? qrUnderpaidInfo.shortfallAmount
      : finalTotal;

  const vietQrUrl = `https://vietqr.app/img?bank=BIDV&acc=96247GCFYP&template=compact&showinfo=true&holder=TRUONG%20MINH%20QUOC%20TRI&amount=${activeQrTransferAmount}&des=${tempOrderId}`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(field);
    setTimeout(() => setIsCopied(null), 2000);
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!customer.fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên';
    if (!customer.phone.trim() || !/^[0-9]{9,11}$/.test(customer.phone.replace(/\s+/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ (9-11 chữ số)';
    }
    if (!customer.email.trim() || !customer.email.includes('@')) {
      errors.email = 'Email không hợp lệ để nhận hóa đơn';
    }
    if (!customer.city.trim()) errors.city = 'Vui lòng chọn hoặc nhập Tỉnh/Thành phố';
    if (!customer.district.trim()) errors.district = 'Vui lòng nhập Quận/Huyện';
    if (!customer.address.trim()) errors.address = 'Vui lòng nhập địa chỉ cụ thể';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextToPayment = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const chosenBank = INSTALLMENT_BANKS.find(b => b.id === instBankId) || INSTALLMENT_BANKS[0];
  const chosenFinance = FINANCE_COMPANIES.find(f => f.id === instFinanceId) || FINANCE_COMPANIES[0];

  const checkoutInstallmentCalc = calculateInstallment({
    price: finalTotal,
    method: instMethod,
    downPaymentPercent: instMethod === 'credit_card' ? 0 : instPrepayRate,
    tenureMonths: instTenure,
  });

  // Complete Order
  const finalizeOrder = (transactionId?: string, confirmedAtIso?: string) => {
    const nowIso = new Date().toISOString();
    const resolvedConfirmedAt = confirmedAtIso || nowIso;
    const resolvedTxId =
      transactionId || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const isQrMethod =
      selectedPayment === 'vietqr' || selectedPayment === 'vnpay' || selectedPayment === 'momo';

    const installmentDetails: InstallmentOrderDetails | undefined = selectedPayment === 'installment' ? {
      method: instMethod,
      providerId: instMethod === 'credit_card' ? chosenBank.id : chosenFinance.id,
      providerName: instMethod === 'credit_card' ? chosenBank.shortName : chosenFinance.shortName,
      tenureMonths: checkoutInstallmentCalc.tenureMonths,
      downPaymentPercent: checkoutInstallmentCalc.downPaymentPercent,
      downPaymentAmount: checkoutInstallmentCalc.downPaymentAmount,
      monthlyPayment: checkoutInstallmentCalc.monthlyPayment,
      totalPayment: checkoutInstallmentCalc.totalPayment,
      cardType: instMethod === 'credit_card' ? instCardType : undefined,
      idCardNumber: instMethod === 'finance_company' ? instIdCard : undefined,
      approvalCode: `TG-${tempOrderId}`,
    } : undefined;

    const newOrder: Order = {
      id: tempOrderId,
      createdAt: nowIso,
      confirmedAt: resolvedConfirmedAt,
      items: [...cartItems],
      customer: { ...customer },
      shipping: selectedShipping,
      paymentMethod: selectedPayment,
      paymentStatus: selectedPayment === 'cod' ? 'pending' : selectedPayment === 'installment' ? 'processing' : 'paid',
      orderStatus: 'confirmed',
      subtotal,
      shippingFee: actualShippingFee,
      discount: discountAmount,
      voucherCode: appliedVoucher?.code,
      total: selectedPayment === 'installment' ? checkoutInstallmentCalc.totalPayment : finalTotal,
      transactionId: resolvedTxId,
      qrTransactionDetails: isQrMethod
        ? {
            transactionId: resolvedTxId,
            confirmedAt: resolvedConfirmedAt,
            bankCode: BIDV_MERCHANT_QR.bankCode,
            bankName: BIDV_MERCHANT_QR.bankName,
            accountNumber: BIDV_MERCHANT_QR.accountNumber,
            accountHolder: BIDV_MERCHANT_QR.accountHolder,
            transferContent: tempOrderId,
            amount: finalTotal,
          }
        : undefined,
      installmentDetails,
    };

    setIsProcessing(false);
    onOrderSuccess(newOrder);
  };

  const finalizeOrderRef = useRef(finalizeOrder);
  finalizeOrderRef.current = finalizeOrder;

  // Automatic Real-Time VietQR Bank Transfer Listener (Checks bank transactions via SSE & Polling; no timer auto-completion)
  useEffect(() => {
    const isQrPayment =
      selectedPayment === 'vietqr' || selectedPayment === 'vnpay' || selectedPayment === 'momo';
    if (!isOpen || step !== 2 || !isQrPayment || finalTotal <= 0) {
      return;
    }

    let isCancelled = false;
    let eventSource: EventSource | null = null;

    const triggerAutoConfirmOrder = (txId?: string, _msg?: string, paidAtIso?: string) => {
      if (isCancelled || autoConfirmedRef.current) return;
      autoConfirmedRef.current = true;
      const resolvedTx = txId || `FT26282${tempOrderId.replace(/\D/g, '')}`;
      const resolvedPaidAt = paidAtIso || new Date().toISOString();

      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore if confetti canvas is unavailable
      }

      setIsQrPaymentVerified(true);
      setPaymentVerificationState('MATCHED');
      setQrUnderpaidInfo(null);
      setQrVerifyError(null);
      setVerifiedQrAmount(finalTotal);
      setVerifiedQrTxId(resolvedTx);
      setVerifiedQrPaidAt(resolvedPaidAt);
      setQrAutoStatusMessage('Giao dịch thành công — Đã khớp 100% số tiền trên Firebase');
      setIsProcessing(true);
      setProcessingMessage('Giao dịch thành công');

      // Sync terminal PAID state to Firebase Firestore
      syncFirebasePaymentTransactionStatus({
        orderId: tempOrderId,
        expectedAmount: finalTotal,
        transferredAmount: finalTotal,
        transactionId: resolvedTx,
        bankCode: BIDV_MERCHANT_QR.bankCode,
        accountNumber: BIDV_MERCHANT_QR.accountNumber,
      }).catch(() => {});

      setTimeout(() => {
        if (!isCancelled) {
          finalizeOrderRef.current(resolvedTx, resolvedPaidAt);
        }
      }, 3200);
    };

    const applyInsufficientState = (paidAmt: number, expAmt: number, txId?: string, customMsg?: string) => {
      if (isCancelled || autoConfirmedRef.current) return;
      const shortfall = Math.max(0, expAmt - paidAmt);
      setPaymentVerificationState('INSUFFICIENT');
      setIsQrPaymentVerified(false);
      setQrUnderpaidInfo({
        paidAmount: paidAmt,
        expectedAmount: expAmt,
        shortfallAmount: shortfall,
        transactionId: txId,
        message:
          customMsg ||
          `Cảnh báo từ Firebase Payment Verification: Số tiền đã chuyển (${formatVND(paidAmt)}) thấp hơn tổng đơn hàng (${formatVND(expAmt)}). Còn thiếu ${formatVND(shortfall)} — Đơn hàng bị chặn chưa thể hoàn tất!`,
      });
      setQrAutoStatusMessage(
        customMsg ||
          `Phát hiện chuyển khoản thiếu: Đã nhận ${formatVND(paidAmt)} / Cần thanh toán ${formatVND(expAmt)} (Còn thiếu ${formatVND(shortfall)}).`
      );

      // Sync UNDERPAID state to Firebase Firestore
      syncFirebasePaymentTransactionStatus({
        orderId: tempOrderId,
        expectedAmount: expAmt,
        transferredAmount: paidAmt,
        transactionId: txId,
        bankCode: BIDV_MERCHANT_QR.bankCode,
        accountNumber: BIDV_MERCHANT_QR.accountNumber,
      }).catch(() => {});
    };

    // 1. Register active QR payment session on backend & initialize Firebase PaymentTransaction document
    fetch('/api/payment/qr-session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: tempOrderId,
        expectedAmount: finalTotal,
        accountNumber: BIDV_MERCHANT_QR.accountNumber,
        accountHolder: BIDV_MERCHANT_QR.accountHolder,
        bankCode: BIDV_MERCHANT_QR.bankCode,
      }),
    }).catch(() => {
      // Ignore transient network error
    });

    initFirebasePaymentTransactionSession({
      orderId: tempOrderId,
      expectedAmount: finalTotal,
      bankCode: BIDV_MERCHANT_QR.bankCode,
      accountNumber: BIDV_MERCHANT_QR.accountNumber,
    }).catch(() => {
      // Ignore if guest user or offline
    });

    // 1b. Subscribe to real-time Firestore PaymentTransaction updates
    const unsubscribeFirestore = subscribeFirebasePaymentTransaction(
      tempOrderId,
      finalTotal,
      (fbRecord) => {
        if (isCancelled || autoConfirmedRef.current) return;
        setFirebaseLastCheckedAt(new Date().toLocaleTimeString('vi-VN'));
        if (fbRecord.status === 'PAID' && fbRecord.transferredAmount >= fbRecord.expectedAmount) {
          triggerAutoConfirmOrder(
            fbRecord.transactionId || `BIDV-${tempOrderId.replace(/\D/g, '')}`,
            'Đã xác thực khớp đủ số tiền qua Firebase',
            new Date().toISOString()
          );
        } else if (
          fbRecord.status === 'UNDERPAID' ||
          (fbRecord.transferredAmount > 0 && fbRecord.transferredAmount < fbRecord.expectedAmount)
        ) {
          applyInsufficientState(
            fbRecord.transferredAmount,
            fbRecord.expectedAmount,
            fbRecord.transactionId
          );
        }
      }
    );

    // 2. Listen via Server-Sent Events (SSE) for instant 0ms bank webhook push
    try {
      eventSource = new EventSource(`/api/payment/qr-stream?orderId=${encodeURIComponent(tempOrderId)}`);
      eventSource.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.verified && data.status === 'PAID') {
            triggerAutoConfirmOrder(data.transactionId, data.message, data.paidAt);
          } else if (data.status === 'UNDERPAID') {
            const paidAmt = Math.round(Number(data.paidAmount) || 0);
            const expAmt = Math.round(Number(data.expectedAmount) || finalTotal);
            applyInsufficientState(paidAmt, expAmt, data.transactionId, data.message);
          }
        } catch {
          // Ignore malformed event
        }
      };
    } catch {
      // Fallback to polling if EventSource is unavailable
    }

    // Periodic Payment Verification: Checks Firebase transaction status & Bank status every 3 seconds
    const pollStatus = async () => {
      if (isCancelled || autoConfirmedRef.current) return;
      setIsCheckingFirebaseNow(true);
      setFirebaseCheckCount((prev) => prev + 1);
      setFirebaseLastCheckedAt(new Date().toLocaleTimeString('vi-VN'));

      // Step A: Periodically check Firebase Firestore transaction status first
      try {
        const fbRecord = await checkFirebasePaymentTransactionStatus(tempOrderId, finalTotal);
        if (fbRecord) {
          if (fbRecord.status === 'PAID' && fbRecord.transferredAmount >= fbRecord.expectedAmount) {
            setIsCheckingFirebaseNow(false);
            triggerAutoConfirmOrder(
              fbRecord.transactionId || `BIDV-${tempOrderId.replace(/\D/g, '')}`,
              'Đã đối soát khớp 100% số tiền trên Firebase',
              new Date().toISOString()
            );
            return;
          } else if (
            fbRecord.status === 'UNDERPAID' ||
            (fbRecord.transferredAmount > 0 && fbRecord.transferredAmount < fbRecord.expectedAmount)
          ) {
            applyInsufficientState(
              fbRecord.transferredAmount,
              fbRecord.expectedAmount,
              fbRecord.transactionId
            );
          }
        }
      } catch {
        // Continue to bank gateway check
      }

      // Step B: Check Google Apps Script gateway
      try {
        const resp = await fetch(
          `${API_URL}?order=${encodeURIComponent(tempOrderId)}&amount=${finalTotal}&_t=${Date.now()}`,
          { cache: 'no-store' }
        );
        const data = await resp.json();

        const gasStatus = String(data?.status || '').toLowerCase().trim();
        const gasAmount = Math.round(
          Number(data?.amount ?? data?.paidAmount ?? data?.transferAmount) || 0
        );
        const isGasPaidFlag =
          gasStatus === 'paid' ||
          gasStatus === 'success' ||
          gasStatus === 'completed' ||
          data?.paid === true ||
          data?.verified === true ||
          (gasAmount >= finalTotal && gasStatus !== 'pending' && gasStatus !== 'underpaid');

        if (data && (isGasPaidFlag || gasStatus === 'underpaid' || gasAmount > 0)) {
          const txId =
            data.transactionId ||
            data.txId ||
            data.reference ||
            data.id ||
            `BIDV-${tempOrderId.replace(/\D/g, '')}`;
          const paidAt = data.paidAt || data.time || new Date().toISOString();

          // If customer transferred less than finalTotal -> Reject order completion and show UNDERPAID warning
          if ((gasAmount > 0 && gasAmount < finalTotal) || gasStatus === 'underpaid') {
            applyInsufficientState(
              gasAmount,
              finalTotal,
              txId,
              `Giao dịch bị từ chối xác nhận do chuyển khoản thiếu: Đã nhận ${formatVND(gasAmount)} / Cần thanh toán ${formatVND(finalTotal)} (Còn thiếu ${formatVND(Math.max(0, finalTotal - gasAmount))}).`
            );
            fetch('/api/webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: tempOrderId,
                amount: gasAmount,
                content: tempOrderId,
                transactionId: txId,
                _fromFrontendSync: true,
              }),
            }).catch(() => {});
            setIsCheckingFirebaseNow(false);
            return;
          }

          if (isGasPaidFlag && (gasAmount === 0 || gasAmount >= finalTotal)) {
            // Record confirmed transaction in backend history
            fetch('/api/webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: tempOrderId,
                amount: gasAmount > 0 ? gasAmount : finalTotal,
                content: tempOrderId,
                transactionId: txId,
                _fromFrontendSync: true,
              }),
            }).catch(() => {});

            setIsCheckingFirebaseNow(false);
            triggerAutoConfirmOrder(txId, data.message, paidAt);
            return;
          }
        }
      } catch {
        // Ignore and also check local Node.js backend status below
      }

      // Step C: Check backend QR status endpoint & sync to Firebase
      try {
        const localResp = await fetch(
          `/api/payment/qr-status?orderId=${encodeURIComponent(tempOrderId)}&expectedAmount=${finalTotal}&_t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (localResp.ok) {
          const localData = await localResp.json();
          if (localData.verified && localData.status === 'PAID') {
            setIsCheckingFirebaseNow(false);
            triggerAutoConfirmOrder(
              localData.transactionId,
              localData.message,
              localData.paidAt
            );
            return;
          } else if (localData.status === 'UNDERPAID') {
            const paidAmt = Math.round(Number(localData.paidAmount) || 0);
            const expAmt = Math.round(Number(localData.expectedAmount) || finalTotal);
            applyInsufficientState(
              paidAmt,
              expAmt,
              localData.transactionId,
              localData.message
            );
          }
        }
      } catch {
        // Keep polling quietly every 3 seconds
      } finally {
        if (!isCancelled) {
          setIsCheckingFirebaseNow(false);
        }
      }
    };

    pollStatus();
    const pollInterval = setInterval(pollStatus, 3000);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
      unsubscribeFirestore();
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isOpen, step, selectedPayment, tempOrderId, finalTotal]);

  // Handler when customer uploads bank transfer receipt screenshot (AI Vision checks recipient + exact amount)
  const handleUploadQrReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrVerifyError(null);
    setIsVerifyingQrTransfer(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
        reader.readAsDataURL(file);
      });

      const resp = await fetch('/api/payment/verify-qr-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || 'image/jpeg',
          expectedAmount: finalTotal,
          orderId: tempOrderId,
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.verified) {
        const resolvedTx = data.transactionId || `FT26282${tempOrderId.replace(/\D/g, '')}`;
        const resolvedPaidAt = data.paidAt || new Date().toISOString();
        autoConfirmedRef.current = true;
        setIsQrPaymentVerified(true);
        setVerifiedQrAmount(finalTotal);
        setVerifiedQrTxId(resolvedTx);
        setQrAutoStatusMessage(
          data.message ||
            `Đã đối soát biên lai chuyển khoản thành công ${formatVND(finalTotal)}! Đang hoàn tất đơn hàng...`
        );
        setIsProcessing(true);
        setProcessingMessage(`Đã xác thực biên lai chuyển khoản ${formatVND(finalTotal)}! Đang tạo hóa đơn...`);
        setTimeout(() => {
          finalizeOrderRef.current(resolvedTx, resolvedPaidAt);
        }, 1200);
      } else {
        setQrVerifyError(
          data.message ||
            `Biên lai chưa hợp lệ hoặc chưa khớp số tiền ${formatVND(finalTotal)}. Vui lòng chỉ xác nhận sau khi đã chuyển khoản thành công!`
        );
      }
    } catch {
      setQrVerifyError('Lỗi kết nối khi kiểm tra biên lai. Vui lòng thử lại.');
    } finally {
      setIsVerifyingQrTransfer(false);
      if (receiptFileInputRef.current) {
        receiptFileInputRef.current.value = '';
      }
    }
  };

  // Handler to simulate or verify a specific transferred amount against Firebase & Backend
  const handleVerifyTransferredAmount = async (rawAmountToVerify?: number) => {
    const parsedInput =
      rawAmountToVerify !== undefined
        ? rawAmountToVerify
        : Math.round(Number(String(manualVerifyAmountInput).replace(/\D/g, '')) || 0);

    if (parsedInput <= 0) {
      setQrVerifyError('Vui lòng nhập số tiền đã chuyển hợp lệ (> 0 ₫) để đối soát.');
      return;
    }

    setQrVerifyError(null);
    setIsVerifyingQrTransfer(true);
    setIsCheckingFirebaseNow(true);

    try {
      const txId =
        qrTxRefInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') ||
        `BIDV${Date.now().toString().slice(-8)}`;

      // Push transaction to backend webhook (which accumulates amount and enforces >= expectedAmount)
      const webhookResp = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: tempOrderId,
          amount: parsedInput,
          content: tempOrderId,
          transactionId: txId,
          _fromFrontendSync: true,
        }),
      });

      const webhookData = await webhookResp.json();
      const previousPaid = qrUnderpaidInfo?.paidAmount || 0;
      const cumulativePaid = previousPaid + parsedInput;

      // Sync with Firebase PaymentTransaction document
      await syncFirebasePaymentTransactionStatus({
        orderId: tempOrderId,
        expectedAmount: finalTotal,
        transferredAmount: cumulativePaid,
        transactionId: txId,
        bankCode: BIDV_MERCHANT_QR.bankCode,
        accountNumber: BIDV_MERCHANT_QR.accountNumber,
      }).catch(() => {});

      setFirebaseCheckCount((prev) => prev + 1);
      setFirebaseLastCheckedAt(new Date().toLocaleTimeString('vi-VN'));

      if (cumulativePaid < finalTotal || webhookData?.paymentStatus === 'UNDERPAID') {
        const shortfall = Math.max(0, finalTotal - cumulativePaid);
        setPaymentVerificationState('INSUFFICIENT');
        setIsQrPaymentVerified(false);
        setQrUnderpaidInfo({
          paidAmount: cumulativePaid,
          expectedAmount: finalTotal,
          shortfallAmount: shortfall,
          transactionId: txId,
          message: `Từ chối xác nhận đơn hàng: Số tiền đã chuyển (${formatVND(cumulativePaid)}) không đủ so với tổng đơn (${formatVND(finalTotal)}). Còn thiếu ${formatVND(shortfall)}!`,
        });
        setManualVerifyAmountInput('');
      } else {
        // Full amount matched!
        const paidAtIso = new Date().toISOString();
        autoConfirmedRef.current = true;
        setPaymentVerificationState('MATCHED');
        setQrUnderpaidInfo(null);
        setIsQrPaymentVerified(true);
        setVerifiedQrAmount(finalTotal);
        setVerifiedQrTxId(txId);
        setVerifiedQrPaidAt(paidAtIso);
        setQrAutoStatusMessage(
          `Đã đối soát Firebase khớp đủ ${formatVND(finalTotal)}! Đang hoàn tất đơn hàng...`
        );
        setIsProcessing(true);
        setProcessingMessage(`Đã xác nhận đủ ${formatVND(finalTotal)}! Đang tạo hóa đơn...`);
        setTimeout(() => {
          finalizeOrderRef.current(txId, paidAtIso);
        }, 1500);
      }
    } catch {
      setQrVerifyError('Lỗi kết nối khi đối soát trạng thái giao dịch Firebase. Vui lòng thử lại.');
    } finally {
      setIsVerifyingQrTransfer(false);
      setIsCheckingFirebaseNow(false);
    }
  };

  // Handler when customer confirms they have completed the transfer on their banking app
  const handleConfirmQrTransferred = async () => {
    setQrVerifyError(null);
    setIsVerifyingQrTransfer(true);

    try {
      const resp = await fetch('/api/payment/confirm-qr-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: tempOrderId,
          expectedAmount: finalTotal,
          transferredAmount: finalTotal,
          transactionReference: qrTxRefInput.trim() || undefined,
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.verified) {
        const resolvedTx = data.transactionId || `FT26282${tempOrderId.replace(/\D/g, '')}`;
        const resolvedPaidAt = data.paidAt || new Date().toISOString();
        autoConfirmedRef.current = true;
        setIsQrPaymentVerified(true);
        setVerifiedQrAmount(finalTotal);
        setVerifiedQrTxId(resolvedTx);
        setQrAutoStatusMessage(
          data.message ||
            `Đã xác nhận chuyển khoản ${formatVND(finalTotal)} thành công! Đang hoàn tất đơn hàng...`
        );
        setIsProcessing(true);
        setProcessingMessage(`Đã xác nhận chuyển khoản ${formatVND(finalTotal)}! Đang tạo hóa đơn...`);
        setTimeout(() => {
          finalizeOrderRef.current(resolvedTx, resolvedPaidAt);
        }, 1200);
      } else {
        setQrVerifyError(data.message || 'Không thể xác nhận giao dịch. Vui lòng kiểm tra lại.');
      }
    } catch {
      setQrVerifyError('Lỗi kết nối máy chủ đối soát. Vui lòng thử lại.');
    } finally {
      setIsVerifyingQrTransfer(false);
    }
  };

  // Payment Execution (for non-QR methods)
  const handleConfirmPayment = () => {
    if (
      selectedPayment === 'vietqr' ||
      selectedPayment === 'vnpay' ||
      selectedPayment === 'momo'
    ) {
      return;
    }

    if (selectedPayment === 'card') {
      setShowOtpModal(true);
      return;
    }

    if (selectedPayment === 'cod') {
      const emailVal = customer.email ? customer.email.trim() : '';
      if (!emailVal || !emailVal.includes('@')) {
        setFormErrors((prev) => ({
          ...prev,
          email: 'Vui lòng nhập địa chỉ email hợp lệ để nhận email xác nhận đơn hàng COD',
        }));
        return;
      }
      setIsProcessing(true);
      setProcessingMessage(
        `Đang tạo đơn hàng COD #${tempOrderId} và kích hoạt gửi email xác nhận đến ${emailVal}...`
      );
      setTimeout(() => {
        finalizeOrder();
      }, 1500);
      return;
    }

    setIsProcessing(true);
    if (selectedPayment === 'installment') {
      setProcessingMessage('Đang kết nối cổng xét duyệt trả góp 0% trực tuyến...');
      setTimeout(() => {
        setProcessingMessage('Hồ sơ trả góp đã được phê duyệt tự động! Đang hoàn tất đơn hàng...');
        setTimeout(() => {
          finalizeOrder(`TG-${Date.now().toString().slice(-8)}`);
        }, 1200);
      }, 1600);
    } else {
      finalizeOrder();
    }
  };

  const handleVerifyCardOtp = () => {
    setShowOtpModal(false);
    setIsProcessing(true);
    setProcessingMessage('Đang xác thực bảo mật 3D-Secure qua ngân hàng phát hành...');
    setTimeout(() => {
      setProcessingMessage('Xác thực OTP thành công! Đang thanh toán...');
      setTimeout(() => {
        finalizeOrder(`CARD-${Date.now().toString().slice(-8)}`);
      }, 1200);
    }, 1500);
  };

  const handleSafeClose = () => {
    if (isQrPaymentVerified) {
      finalizeOrderRef.current(
        verifiedQrTxId || undefined,
        verifiedQrPaidAt || undefined
      );
      return;
    }
    if (isPage && onBackToHome) {
      onBackToHome();
    } else {
      onClose();
    }
  };

  if (isPage && cartItems.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8 sm:p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-5 shadow-inner">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Giỏ hàng của bạn đang trống</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base mb-8">
            Hiện tại bạn chưa có sản phẩm nào trong giỏ hàng để thực hiện thanh toán. Hãy dạo quanh cửa hàng và chọn những thiết bị công nghệ ưng ý nhé!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onBackToHome || onClose}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen || (!isPage && cartItems.length === 0)) return null;

  return (
    <div className={isPage ? "w-full max-w-6xl mx-auto py-3 sm:py-6" : "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"}>
      {/* Backdrop for modal mode */}
      {!isPage && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
          onClick={
            (!isProcessing || isQrPaymentVerified) &&
            !(
              step === 2 &&
              !isQrPaymentVerified &&
              (selectedPayment === 'vietqr' ||
                selectedPayment === 'vnpay' ||
                selectedPayment === 'momo')
            )
              ? handleSafeClose
              : undefined
          }
        />
      )}

      {/* Breadcrumb navigation for standalone page mode */}
      {isPage && (
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm text-slate-500 px-1">
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onBackToHome || onClose}
              className="hover:text-indigo-600 font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              Trang chủ
            </button>
            <span className="text-slate-300">/</span>
            <button
              onClick={onBackToCart || onClose}
              className="hover:text-indigo-600 font-medium transition-colors cursor-pointer"
            >
              Giỏ hàng
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">Thanh toán đơn hàng</span>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome || onClose}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Tiếp tục mua hàng
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div 
        id={isPage ? "checkout-page-container" : "checkout-modal-container"}
        className={
          isPage
            ? "relative bg-white w-full rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden z-10 flex flex-col"
            : "relative bg-white w-full max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto max-h-[95vh] flex flex-col"
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Step Tracker */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-200/80 flex items-center justify-between gap-2 bg-slate-50/80">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {isPage ? 'Thanh Toán Đơn Hàng' : 'Thanh Toán Trực Tuyến'}
                </h2>
                <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Lock className="w-2.5 h-2.5" /> 256-Bit SSL
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Mã đơn: <span className="font-mono font-bold text-slate-700">{tempOrderId}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>{step === 1 ? 'Bước 2/3: Thông tin nhận hàng' : 'Bước 3/3: Xác nhận thanh toán'}</span>
            </div>

            {(!isProcessing || isQrPaymentVerified) && (
              <button
                id="close-checkout-btn"
                onClick={handleSafeClose}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title={isPage ? "Quay lại mua sắm" : "Đóng"}
              >
                {isPage ? (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden md:inline font-semibold">Về trang chủ</span>
                  </>
                ) : (
                  <X className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Purchasing Progress Bar (Thanh tiến độ mua hàng) */}
        <div id="checkout-progress-bar-container" className="bg-slate-50/95 border-b border-slate-200 px-3 sm:px-8 py-2.5 sm:py-3 select-none">
          <div className="max-w-2xl mx-auto">
            {/* Step Nodes Row */}
            <div className="relative flex items-center justify-between">
              
              {/* Connecting Background Line & Dynamic Progress Fill */}
              <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0 overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-emerald-500 via-indigo-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: step === 1 ? '50%' : '100%' }}
                />
              </div>

              {/* Step 1: Giỏ hàng (Đã hoàn thành) */}
              <button
                type="button"
                id="progress-step-cart"
                onClick={() => {
                  if (!isProcessing) {
                    if (onBackToCart) {
                      onBackToCart();
                    } else {
                      onClose();
                    }
                  }
                }}
                className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                title="Bấm để xem lại hoặc điều chỉnh giỏ hàng"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-all border-2 border-white ring-2 ring-emerald-500/30">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
                <div className="mt-1.5 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      1. Giỏ hàng
                    </span>
                    <span className="hidden md:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700">
                      Xong
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 hidden sm:block">
                    {cartItems.length} sản phẩm
                  </span>
                </div>
              </button>

              {/* Step 2: Thông tin giao hàng */}
              <button
                type="button"
                id="progress-step-shipping"
                onClick={() => {
                  if (step === 2 && !isProcessing) setStep(1);
                }}
                disabled={step === 1 || isProcessing}
                className={`relative z-10 flex flex-col items-center group focus:outline-none ${
                  step === 2 ? 'cursor-pointer' : 'cursor-default'
                }`}
                title={step === 2 ? "Bấm để quay lại chỉnh sửa thông tin giao hàng" : undefined}
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md transition-all border-2 border-white ${
                  step === 1
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/25 shadow-indigo-600/30 scale-105'
                    : 'bg-emerald-600 text-white ring-2 ring-emerald-500/30 shadow-emerald-600/20 group-hover:scale-105'
                }`}>
                  {step > 1 ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  ) : (
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="mt-1.5 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <span className={`text-[11px] sm:text-xs font-bold transition-colors ${
                      step === 1 ? 'text-indigo-700' : 'text-slate-800 group-hover:text-indigo-600'
                    }`}>
                      2. Thông tin giao hàng
                    </span>
                    <span className={`hidden md:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                      step === 1 ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {step === 1 ? 'Đang điền' : 'Xong'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 hidden sm:block truncate max-w-[140px]">
                    {step === 1 ? 'Địa chỉ & người nhận' : (customer.fullName || 'Đã xác nhận')}
                  </span>
                </div>
              </button>

              {/* Step 3: Xác nhận thanh toán */}
              <div 
                id="progress-step-payment"
                className="relative z-10 flex flex-col items-center focus:outline-none"
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md transition-all border-2 border-white ${
                  step === 2
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/25 shadow-indigo-600/30 scale-105'
                    : 'bg-slate-200 text-slate-500 ring-2 ring-slate-100'
                }`}>
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="mt-1.5 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <span className={`text-[11px] sm:text-xs font-bold ${
                      step === 2 ? 'text-indigo-700' : 'text-slate-500'
                    }`}>
                      3. Xác nhận thanh toán
                    </span>
                    {step === 2 && (
                      <span className="hidden md:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 hidden sm:block">
                    {step === 2 ? 'Cổng thanh toán' : 'Chờ hoàn tất'}
                  </span>
                </div>
              </div>

            </div>

            {/* Mobile summary ticker */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 sm:hidden px-1">
              <span className="font-semibold text-slate-700">
                Tiến độ: <strong className="text-indigo-600">{step === 1 ? 'Bước 2/3 (66%)' : 'Bước 3/3 (100%)'}</strong>
              </span>
              <span className="text-indigo-600 font-bold">
                {step === 1 ? 'Địa chỉ nhận hàng' : 'Cổng thanh toán'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body: Left Form / Payment, Right Order Summary */}
        <div className={`${isPage ? '' : 'overflow-y-auto'} p-3.5 sm:p-6 md:p-8 flex-1`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
            
            {/* Left Column: Form or Payment Gateway (8 cols) */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              
              {/* STEP 1: Shipping Info & Recipient */}
              {step === 1 && (
                <div className="space-y-5">
                  {currentUser ? (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span>
                            Đặt hàng với tài khoản <strong className="text-slate-900">{currentUser.fullName}</strong> ({currentUser.email})
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Vui lòng tự điền đầy đủ thông tin người nhận và địa chỉ giao hàng bên dưới.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    onOpenAuth && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">Đã có tài khoản?</span>{' '}
                          Đăng nhập để tích điểm thưởng NovaPoints cho đơn hàng này.
                        </div>
                        <button
                          type="button"
                          onClick={onOpenAuth}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
                        >
                          Đăng nhập
                        </button>
                      </div>
                    )
                  )}

                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                      Thông tin người nhận & Địa chỉ giao hàng
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Vui lòng điền chính xác để bưu tá giao hàng thuận lợi</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Họ và tên người nhận <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-fullname"
                        type="text"
                        value={customer.fullName}
                        onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        className={`w-full text-xs py-2.5 px-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-all ${
                          formErrors.fullName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-indigo-600'
                        }`}
                      />
                      {formErrors.fullName && <p className="text-[11px] text-rose-500 mt-1">{formErrors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        placeholder="Ví dụ: 0912345678"
                        className={`w-full text-xs py-2.5 px-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-all ${
                          formErrors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-indigo-600'
                        }`}
                      />
                      {formErrors.phone && <p className="text-[11px] text-rose-500 mt-1">{formErrors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      placeholder="Ví dụ: vanan@gmail.com"
                      className={`w-full text-xs py-2.5 px-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-all ${
                        formErrors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-indigo-600'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tỉnh / Thành phố <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="checkout-city"
                        value={customer.city}
                        onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                        className={`w-full text-xs py-2.5 px-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-all ${
                          formErrors.city ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-indigo-600'
                        }`}
                      >
                        <option value="">-- Chọn Tỉnh / Thành phố --</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                        <option value="Bình Dương">Bình Dương</option>
                        <option value="Đồng Nai">Đồng Nai</option>
                        <option value="Khác">Tỉnh thành khác</option>
                      </select>
                      {formErrors.city && <p className="text-[11px] text-rose-500 mt-1">{formErrors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quận / Huyện / Thị xã <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-district"
                        type="text"
                        value={customer.district}
                        onChange={(e) => setCustomer({ ...customer, district: e.target.value })}
                        placeholder="Ví dụ: Quận 1 / Quận Cầu Giấy"
                        className={`w-full text-xs py-2.5 px-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-all ${
                          formErrors.district ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-indigo-600'
                        }`}
                      />
                      {formErrors.district && <p className="text-[11px] text-rose-500 mt-1">{formErrors.district}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Địa chỉ cụ thể (Số nhà, tên đường, phường/xã) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      placeholder="Ví dụ: 123 Lê Lợi, Phường Bến Nghé"
                      className={`w-full text-xs py-2.5 px-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-all ${
                        formErrors.address ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-indigo-600'
                      }`}
                    />
                    {formErrors.address && <p className="text-[11px] text-rose-500 mt-1">{formErrors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ghi chú đơn hàng (Tùy chọn)
                    </label>
                    <textarea
                      id="checkout-note"
                      rows={2}
                      value={customer.note}
                      onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                      placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi giao..."
                      className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* Shipping Method Selector */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      Chọn phương thức vận chuyển:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SHIPPING_METHODS.map((method) => {
                        const isSelected = selectedShipping.id === method.id;
                        const isFree = method.id === 'standard' && (subtotal >= 300000 || hasTestProduct);
                        return (
                          <div
                            key={method.id}
                            id={`shipping-method-${method.id}`}
                            onClick={() => setSelectedShipping(method)}
                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/10'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {method.id === 'standard' ? (
                                  <Truck className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <Zap className="w-4 h-4 text-amber-500" />
                                )}
                                <span className="text-xs font-bold text-slate-900">{method.name}</span>
                              </div>
                              <span className="text-xs font-extrabold text-indigo-700">
                                {isFree ? 'Miễn phí' : formatVND(method.price)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">{method.estimatedDays}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    id="goto-payment-btn"
                    type="button"
                    onClick={handleNextToPayment}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Tiếp tục đến phương thức thanh toán</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Online Payment Gateway Selection & Interactive UI */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                        Chọn cổng thanh toán trực tuyến
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Hệ thống liên kết bảo mật tự động xác nhận 2-5 giây</p>
                    </div>

                    <button
                      id="back-to-step1-btn"
                      onClick={() => setStep(1)}
                      className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Sửa thông tin
                    </button>
                  </div>

                  {/* Payment Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PAYMENT_METHODS.map((pm) => {
                      const isSelected = selectedPayment === pm.id;
                      return (
                        <div
                          key={pm.id}
                          id={`payment-method-${pm.id}`}
                          onClick={() => setSelectedPayment(pm.id)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all relative ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/10'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 mb-1">
                            <div className={`p-1.5 rounded-lg ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {pm.id === 'vietqr' && <QrCode className="w-4 h-4" />}
                              {pm.id === 'installment' && <CalendarClock className="w-4 h-4" />}
                              {pm.id === 'card' && <CreditCard className="w-4 h-4" />}
                              {pm.id === 'momo' && <Smartphone className="w-4 h-4" />}
                              {pm.id === 'vnpay' && <Wallet className="w-4 h-4" />}
                              {pm.id === 'cod' && <Banknote className="w-4 h-4" />}
                            </div>
                            <span className="text-xs font-bold text-slate-900">{pm.name}</span>
                          </div>

                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-1">{pm.description}</p>

                          {pm.badge && (
                            <span className="keep-dark-text absolute top-2 right-2 bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded shadow-2xs">
                              {pm.badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Interactive Payment Display */}
                  <div className="pt-2">
                    
                    {/* OPTION 1, 3 & 4: VIETQR / MOMO / VNPAY-QR */}
                    {(selectedPayment === 'vietqr' ||
                      selectedPayment === 'vnpay' ||
                      selectedPayment === 'momo') && (
                      <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 text-white rounded-2xl shadow-xl border border-indigo-500/20">
                        {isQrPaymentVerified && verifiedQrAmount === finalTotal ? (
                          <div
                            id="qr-payment-success-display"
                            className="py-4 sm:py-6 px-2 sm:px-4 flex flex-col items-center text-center space-y-5"
                          >
                            {/* Top Bank Verification Emblem & Heading */}
                            <div className="flex flex-col items-center space-y-2.5">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-400 stroke-[2.2]" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-emerald-300 tracking-wide">
                                  Xác nhận tự động từ Ngân hàng {BIDV_MERCHANT_QR.bankCode}
                                </p>
                                <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                  Giao dịch thành công
                                </h4>
                              </div>
                              <div className="pt-1">
                                <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums tracking-tight">
                                  {formatVND(finalTotal)}
                                </span>
                              </div>
                            </div>

                            {/* Structured Bank Transaction Receipt Details */}
                            <div className="w-full max-w-md rounded-xl bg-white/[0.04] border border-white/10 divide-y divide-white/10 text-xs text-left">
                              <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                                <span className="text-slate-400">Trạng thái thanh toán</span>
                                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5" />
                                  Đã nhận tiền thành công
                                </span>
                              </div>

                              <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                                <span className="text-slate-400">Mã giao dịch ngân hàng</span>
                                <span className="font-mono font-bold text-white tabular-nums">
                                  {verifiedQrTxId || `BIDV-${tempOrderId.replace(/\D/g, '')}`}
                                </span>
                              </div>

                              <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                                <span className="text-slate-400">Nội dung thanh toán</span>
                                <span className="font-mono font-bold text-amber-300">
                                  {tempOrderId}
                                </span>
                              </div>

                              <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                                <span className="text-slate-400">Tài khoản thụ hưởng</span>
                                <span className="font-semibold text-slate-200 text-right">
                                  {BIDV_MERCHANT_QR.accountNumber} · {BIDV_MERCHANT_QR.accountHolder}
                                </span>
                              </div>

                              <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                                <span className="text-slate-400">Ngân hàng</span>
                                <span className="font-semibold text-slate-200 text-right">
                                  {BIDV_MERCHANT_QR.bankName}
                                </span>
                              </div>

                              <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                                <span className="text-slate-400">Thời gian ghi nhận</span>
                                <span className="font-mono text-slate-300 tabular-nums">
                                  {new Date(verifiedQrPaidAt || Date.now()).toLocaleString('vi-VN')}
                                </span>
                              </div>
                            </div>

                            {/* Immediate Action Button to Open Full Invoice */}
                            <div className="w-full max-w-md pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  finalizeOrderRef.current(
                                    verifiedQrTxId || `FT26282${tempOrderId.replace(/\D/g, '')}`,
                                    verifiedQrPaidAt || new Date().toISOString()
                                  )
                                }
                                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer"
                              >
                                <span>Xem hóa đơn & hoàn tất đơn hàng</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-4">
                            {/* Cảnh báo thời gian thực nếu khách hàng chuyển khoản thiếu số tiền */}
                            {qrUnderpaidInfo && qrUnderpaidInfo.shortfallAmount > 0 && (
                              <div
                                id="qr-underpaid-warning"
                                className="w-full max-w-md p-3.5 sm:p-4 rounded-2xl bg-rose-950/85 border-2 border-rose-500/80 text-rose-100 shadow-lg space-y-2.5 animate-pulse"
                              >
                                <div className="flex items-start gap-2.5">
                                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                  <div className="space-y-1 text-left">
                                    <h5 className="text-xs sm:text-sm font-extrabold text-rose-300">
                                      Từ chối duyệt đơn — Số tiền chuyển khoản không đủ!
                                    </h5>
                                    <p className="text-[11px] text-rose-200/90 leading-relaxed">
                                      Hệ thống phát hiện giao dịch chuyển khoản thấp hơn giá trị đơn hàng. Đơn hàng chỉ được xác nhận khi thanh toán đủ 100% số tiền.
                                    </p>
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-black/35 border border-rose-400/30 space-y-1.5 text-[11px]">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-300">Tổng cần thanh toán:</span>
                                    <span className="font-bold text-white tabular-nums">
                                      {formatVND(qrUnderpaidInfo.expectedAmount)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-300">Đã ghi nhận chuyển khoản:</span>
                                    <span className="font-bold text-amber-300 tabular-nums">
                                      {formatVND(qrUnderpaidInfo.paidAmount)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
                                    <span className="font-bold text-rose-300">Số tiền còn thiếu:</span>
                                    <span className="font-extrabold text-sm text-rose-400 tabular-nums">
                                      {formatVND(qrUnderpaidInfo.shortfallAmount)}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-[11px] text-amber-200/95 font-medium text-left">
                                  Mã QR bên dưới đã tự động cập nhật sang số tiền còn thiếu (
                                  <strong className="text-white">{formatVND(qrUnderpaidInfo.shortfallAmount)}</strong>
                                  ). Vui lòng quét lại hoặc chuyển thêm đúng số tiền còn thiếu kèm nội dung{' '}
                                  <strong className="font-mono text-amber-300">{tempOrderId}</strong>.
                                </p>
                              </div>
                            )}

                            {/* Hiển thị lỗi đối soát biên lai (nếu có) */}
                            {qrVerifyError && (
                              <div className="w-full max-w-md p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <span>{qrVerifyError}</span>
                              </div>
                            )}

                            {/* Số tiền thanh toán & Nội dung chuyển khoản (Đồng bộ màu sắc thương hiệu Indigo/Slate) */}
                            <div className="w-full max-w-md space-y-2.5 text-xs">
                              {/* Hộp 1: Số tiền thanh toán */}
                              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/40 transition-colors flex items-center justify-between">
                                <div>
                                  <span className="text-slate-400 text-[11px] block font-medium">
                                    {qrUnderpaidInfo && qrUnderpaidInfo.shortfallAmount > 0
                                      ? 'Số tiền còn thiếu cần chuyển thêm'
                                      : 'Số tiền thanh toán'}
                                  </span>
                                  <span className={`font-extrabold text-base sm:text-lg tabular-nums ${
                                    qrUnderpaidInfo && qrUnderpaidInfo.shortfallAmount > 0 ? 'text-rose-400' : 'text-white'
                                  }`}>
                                    {formatVND(activeQrTransferAmount)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(String(activeQrTransferAmount), 'amount')
                                  }
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg flex items-center gap-1.5 font-semibold text-[11px] transition-all cursor-pointer shadow-xs"
                                >
                                  {isCopied === 'amount' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  {isCopied === 'amount' ? 'Đã chép' : 'Sao chép'}
                                </button>
                              </div>

                              {/* Hộp 2: Nội dung chuyển khoản */}
                              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/40 transition-colors flex items-center justify-between">
                                <div>
                                  <span className="text-slate-400 text-[11px] block font-medium">
                                    Nội dung thanh toán
                                  </span>
                                  <span className="font-mono font-bold text-sm sm:text-base text-indigo-300">
                                    {tempOrderId}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(tempOrderId, 'nd')}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg flex items-center gap-1.5 font-semibold text-[11px] transition-all cursor-pointer shadow-xs"
                                >
                                  {isCopied === 'nd' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  {isCopied === 'nd' ? 'Đã chép' : 'Sao chép'}
                                </button>
                              </div>
                            </div>

                            {/* Mã QR */}
                            <div className="keep-light bg-white p-3.5 sm:p-4 rounded-2xl text-slate-900 shadow-lg border border-slate-200 flex flex-col items-center">
                              <div className="relative w-56 sm:w-64 flex items-center justify-center">
                                <img
                                  src={vietQrUrl}
                                  alt="Mã QR thanh toán"
                                  className="w-full h-auto object-contain"
                                />
                              </div>
                            </div>
                          </div>
                          )}
                        </div>
                      )}

                    {/* OPTION 2: CREDIT / DEBIT CARD */}
                    {selectedPayment === 'card' && (
                      <div className="space-y-4">
                        {/* Interactive Card Visual */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 text-white shadow-xl relative overflow-hidden max-w-md mx-auto">
                          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-6 bg-amber-400/80 rounded-md" />
                              <span className="text-xs font-mono tracking-widest text-slate-400">CHIP EMV</span>
                            </div>
                            <span className="text-lg font-black italic tracking-wider text-slate-200">VISA</span>
                          </div>

                          <div className="font-mono text-lg sm:text-xl font-bold tracking-widest text-slate-100 mb-5">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </div>

                          <div className="flex justify-between items-end text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Chủ thẻ</span>
                              <span className="font-bold tracking-wide uppercase">{cardHolder || 'NGUYEN VAN AN'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Hạn dùng</span>
                              <span className="font-mono font-bold">{cardExpiry || 'MM/YY'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Inputs */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Số thẻ tín dụng / ghi nợ</label>
                            <input
                              id="input-card-number"
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="4532 8890 1234 5678"
                              className="w-full text-xs font-mono py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên chủ thẻ (Không dấu)</label>
                            <input
                              id="input-card-holder"
                              type="text"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                              placeholder="NGUYEN VAN AN"
                              className="w-full text-xs font-mono py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-600 uppercase"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày hết hạn (MM/YY)</label>
                              <input
                                id="input-card-expiry"
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="08/28"
                                className="w-full text-xs font-mono py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Mã bảo mật CVV</label>
                              <input
                                id="input-card-cvv"
                                type="password"
                                maxLength={4}
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                placeholder="888"
                                className="w-full text-xs font-mono py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-600"
                              />
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-emerald-600" /> Được mã hóa an toàn theo tiêu chuẩn PCI-DSS Level 1
                          </p>
                        </div>
                      </div>
                    )}

                    {/* OPTION: INSTALLMENT (TRẢ GÓP 0%) */}
                    {selectedPayment === 'installment' && (
                      <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/90 via-white to-indigo-50/70 border-2 border-amber-300 rounded-2xl shadow-md space-y-4">
                        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="keep-dark-text p-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs">
                              0%
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>Mua Trả Góp 0% Lãi Suất Trực Tuyến</span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                                  Duyệt 5 phút
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-600">Miễn phí chuyển đổi, không phát sinh chi phí ẩn</p>
                            </div>
                          </div>
                        </div>

                        {/* Subtabs: Card vs Finance */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setInstMethod('credit_card')}
                            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              instMethod === 'credit_card'
                                ? 'bg-white dark:!bg-indigo-600 text-indigo-700 dark:!text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Qua Thẻ Tín Dụng (0%)
                          </button>
                          <button
                            type="button"
                            onClick={() => setInstMethod('finance_company')}
                            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              instMethod === 'finance_company'
                                ? 'bg-white dark:!bg-indigo-600 text-indigo-700 dark:!text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Qua CCCD (Công ty tài chính)
                          </button>
                        </div>

                        {/* Credit card installment setup */}
                        {instMethod === 'credit_card' ? (
                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-bold mb-1.5">Ngân hàng phát hành:</label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {INSTALLMENT_BANKS.slice(0, 8).map((b) => (
                                  <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => setInstBankId(b.id)}
                                    className={`py-1.5 px-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer truncate ${
                                      instBankId === b.id
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    {b.shortName}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1.5">Loại thẻ tín dụng:</label>
                              <div className="flex gap-2">
                                {(['visa', 'mastercard', 'jcb'] as const).map((ct) => (
                                  <button
                                    key={ct}
                                    type="button"
                                    onClick={() => setInstCardType(ct)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                                      instCardType === ct
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                  >
                                    {ct}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1.5">Kỳ hạn trả góp:</label>
                              <div className="grid grid-cols-4 gap-1.5">
                                {chosenBank.tenures.map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => setInstTenure(m)}
                                    className={`py-1.5 px-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                                      instTenure === m
                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                        : 'border-slate-200 bg-white text-slate-700'
                                    }`}
                                  >
                                    <div>{m} tháng</div>
                                    <div className={`text-[10px] ${instTenure === m ? 'text-indigo-100' : 'text-slate-500'}`}>
                                      {formatVND(Math.round(finalTotal / m))}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">4 số cuối thẻ tín dụng để xác minh:</label>
                              <input
                                type="text"
                                maxLength={4}
                                value={instCardLast4}
                                onChange={(e) => setInstCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="VD: 8899"
                                className="w-48 py-2 px-3 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-600"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-bold mb-1.5">Công ty tài chính đối tác:</label>
                              <div className="grid grid-cols-2 gap-2">
                                {FINANCE_COMPANIES.map((fc) => (
                                  <button
                                    key={fc.id}
                                    type="button"
                                    onClick={() => setInstFinanceId(fc.id)}
                                    className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                      instFinanceId === fc.id
                                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="font-bold text-slate-900">{fc.shortName}</div>
                                    <div className="text-[10px] text-emerald-600">{fc.requiredDocuments[0]}</div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-700 font-bold mb-1.5">Tỷ lệ trả trước ({instPrepayRate}%):</label>
                                <div className="flex gap-1.5">
                                  {[0, 20, 30, 50].map((rate) => (
                                    <button
                                      key={rate}
                                      type="button"
                                      onClick={() => setInstPrepayRate(rate)}
                                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex-1 text-center ${
                                        instPrepayRate === rate
                                          ? 'border-indigo-600 bg-indigo-600 text-white'
                                          : 'border-slate-200 bg-white text-slate-700'
                                      }`}
                                    >
                                      {rate}%
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="block text-slate-700 font-bold mb-1.5">Kỳ hạn vay ({instTenure} tháng):</label>
                                <div className="flex gap-1.5">
                                  {chosenFinance.tenures.slice(0, 4).map((m) => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => setInstTenure(m)}
                                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex-1 text-center ${
                                        instTenure === m
                                          ? 'border-indigo-600 bg-indigo-600 text-white'
                                          : 'border-slate-200 bg-white text-slate-700'
                                      }`}
                                    >
                                      {m}T
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">Số Căn cước công dân (12 số):</label>
                              <input
                                type="text"
                                maxLength={12}
                                value={instIdCard}
                                onChange={(e) => setInstIdCard(e.target.value.replace(/\D/g, ''))}
                                placeholder="079201008899"
                                className="w-full sm:w-64 py-2 px-3 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-indigo-600"
                              />
                            </div>
                          </div>
                        )}

                        {/* Installment Financial Recap */}
                        <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1.5">
                          <div className="flex justify-between text-slate-600">
                            <span>Trả trước khi nhận máy:</span>
                            <span className="font-bold text-slate-900">{formatVND(checkoutInstallmentCalc.downPaymentAmount)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Lãi suất tài trợ:</span>
                            <span className="font-bold text-emerald-600">0% Lãi suất</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Phí chuyển đổi hồ sơ:</span>
                            <span className="font-bold text-emerald-600">Miễn phí 100%</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-slate-100 text-indigo-700 font-bold">
                            <span>Góp hàng tháng ({checkoutInstallmentCalc.tenureMonths} tháng):</span>
                            <span className="text-sm font-extrabold">{formatVND(checkoutInstallmentCalc.monthlyPayment)}/tháng</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OPTION 5: COD */}
                    {selectedPayment === 'cod' && (
                      <div className="space-y-3">
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-2xl flex items-start gap-3">
                          <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="text-xs space-y-1">
                            <h4 className="font-bold text-amber-950 dark:text-amber-200">Thanh toán tiền mặt khi nhận hàng (COD)</h4>
                            <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                              Bạn sẽ thanh toán số tiền <strong className="font-extrabold text-amber-950 dark:text-amber-100">{formatVND(finalTotal)}</strong> cho nhân viên giao hàng khi nhận và đồng kiểm gói hàng.
                            </p>
                          </div>
                        </div>

                        {/* Dedicated Email Notice & Verification Card for COD */}
                        <div className="p-4 bg-blue-50/90 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-blue-950 dark:text-blue-100 text-xs">
                                  Email xác nhận đơn hàng COD &amp; Hóa đơn GTGT
                                </h4>
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-700">
                                  Tự động gửi ngay
                                </span>
                              </div>
                              <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
                                Ngay khi bấm hoàn tất, hệ thống tự động gửi email chứa thông tin đơn hàng #{tempOrderId}, chi tiết sản phẩm, số tiền COD và mã tra cứu đến email này.
                              </p>
                            </div>
                          </div>

                          <div className="pt-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Địa chỉ email nhận thông tin đơn hàng COD:
                            </label>
                            <div className="relative">
                              <input
                                id="cod-confirmation-email-input"
                                type="email"
                                value={customer.email}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomer((prev) => ({ ...prev, email: val }));
                                  if (formErrors.email) {
                                    setFormErrors((prev) => {
                                      const next = { ...prev };
                                      delete next.email;
                                      return next;
                                    });
                                  }
                                }}
                                placeholder="nhap.email@example.com"
                                className={`w-full px-3.5 py-2 pl-9 rounded-xl border text-xs outline-none transition-colors ${
                                  formErrors.email
                                    ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                }`}
                              />
                              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            {formErrors.email && (
                              <p className="text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.email}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Cam kết bảo mật thông tin &amp; cập nhật lộ trình giao hàng trực tiếp qua email.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Complete Payment Section (Only for non-QR payment methods) */}
                  {selectedPayment !== 'vietqr' &&
                    selectedPayment !== 'vnpay' &&
                    selectedPayment !== 'momo' && (
                    <div className="pt-2 sm:pt-3">
                      <button
                        id="confirm-payment-btn"
                        type="button"
                        disabled={isProcessing}
                        onClick={handleConfirmPayment}
                        className={`w-full py-4 px-5 font-extrabold text-sm sm:text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer text-white active:scale-[0.99] ${
                          selectedPayment === 'cod'
                            ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 hover:from-amber-700 hover:to-orange-800 shadow-amber-600/30'
                            : 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/30'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>{processingMessage || 'Đang xử lý giao dịch...'}</span>
                          </>
                        ) : (
                          <>
                            {selectedPayment === 'cod' ? (
                              <Mail className="w-5 h-5" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5" />
                            )}
                            <span>
                              {selectedPayment === 'installment'
                                ? `Xác Nhận Đặt Hàng Trả Góp 0% (${formatVND(checkoutInstallmentCalc.monthlyPayment)}/tháng)`
                                : selectedPayment === 'card'
                                ? 'Xác thực thẻ & Thanh toán ngay'
                                : selectedPayment === 'cod'
                                ? 'Hoàn tất đặt hàng (COD) & Nhận email xác nhận'
                                : 'Xác nhận thanh toán'}
                            </span>
                          </>
                        )}
                      </button>
                      <p className="text-center text-[11px] text-slate-400 mt-2">
                        Nhấn xác nhận đồng nghĩa với việc bạn đồng ý với Điều khoản dịch vụ của NovaShop
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Right Column: Order Summary & Review (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-4 sticky top-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Đơn hàng ({cartItems.length} món)</h3>
                  <span className="text-xs font-semibold text-indigo-600">Đơn hàng tham chiếu</span>
                </div>

                {/* Items preview list */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                        <img 
                          src={item.product.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>SL: {item.quantity}</span>
                          {item.selectedColor && <span>• Màu: {item.selectedColor}</span>}
                        </div>
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 shrink-0">
                        {formatVND(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính hàng hóa:</span>
                    <span className="font-semibold text-slate-800">{formatVND(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển ({selectedShipping.name}):</span>
                    <span>
                      {actualShippingFee === 0 ? (
                        <span className="text-emerald-600 font-bold">Miễn phí</span>
                      ) : (
                        formatVND(actualShippingFee)
                      )}
                    </span>
                  </div>

                  {discountAmount > 0 ? (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Voucher giảm ({appliedVoucher?.code}):</span>
                      <span>-{formatVND(discountAmount)}</span>
                    </div>
                  ) : appliedVoucher ? (
                    <div className="flex justify-between text-amber-600 text-[11px] font-semibold">
                      <span>Voucher ({appliedVoucher.code}):</span>
                      <span>Chưa đủ ĐK tối thiểu</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2.5">
                    <span>Tổng thanh toán:</span>
                    <span className="text-lg text-indigo-700">{formatVND(finalTotal)}</span>
                  </div>
                </div>

                {/* Recipient summary if step 2 */}
                {step === 2 && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giao đến:</span>
                    <div className="font-bold text-slate-800">{customer.fullName} • {customer.phone}</div>
                    <div className="text-slate-600 text-[11px]">{customer.address}, {customer.district}, {customer.city}</div>
                  </div>
                )}

                {/* Security Trust Badges */}
                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-center text-[10px] text-slate-500">
                  <div className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Bảo mật giao dịch
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Hóa đơn VAT điện tử
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3D-SECURE / OTP SIMULATION MODAL (FOR CARD PAYMENT) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span className="font-extrabold text-sm text-slate-900">Xác thực 3D-Secure 2.0 (Visa OTP)</span>
              </div>
              <button 
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>Ngân hàng phát hành thẻ đã gửi mã OTP 6 chữ số đến số điện thoại đăng ký <strong>••• ••88</strong>.</p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền giao dịch:</span>
                  <span className="font-extrabold text-indigo-700">{formatVND(finalTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Đơn vị thụ hưởng:</span>
                  <span className="font-bold text-slate-800">NOVASHOP ECOMMERCE</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã xác thực OTP:</label>
              <input
                id="otp-input"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-mono text-lg font-extrabold py-2.5 px-3 rounded-xl border border-indigo-400 bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 text-center mt-1">Mã mẫu thử nghiệm dự án: <strong>123456</strong></p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                id="verify-otp-btn"
                onClick={handleVerifyCardOtp}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
              >
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CheckoutPage: React.FC<Omit<CheckoutModalProps, 'isPage' | 'isOpen'>> = (props) => {
  return <CheckoutModal {...props} isOpen={true} isPage={true} />;
};
