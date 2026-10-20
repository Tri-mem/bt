export interface Product {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  description: string;
  highlights: string[];
  specs: Record<string, string>;
  badge?: 'Hot' | 'Mới' | 'Giảm sốc' | 'Bán chạy' | 'Test QR 10K' | 'Test QR 20K';
  stock: number;
  colors?: string[];
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  memberTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  novaPoints: number;
  city?: string;
  district?: string;
  address?: string;
  joinedDate: string;
  authProvider?: 'google' | 'phone' | 'password';
  phoneVerified?: boolean;
  phoneVerifiedAt?: string;
  twoFactorEnabled?: boolean;
  totpEnabled?: boolean;
  totpSecret?: string;
  backupCodes?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface Voucher {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  description: string;
}

export type PaymentMethodId = 'vietqr' | 'card' | 'momo' | 'vnpay' | 'cod' | 'installment';

export type InstallmentMethodType = 'credit_card' | 'finance_company';

export interface InstallmentBank {
  id: string;
  name: string;
  shortName: string;
  cardTypes: ('visa' | 'mastercard' | 'jcb')[];
  tenures: number[]; // e.g. [3, 6, 9, 12, 18, 24]
  interestRate: number; // 0%
  conversionFeeRate: number; // 0%
  minAmount: number;
  logoColor: string;
  badge?: string;
}

export interface FinanceCompany {
  id: string;
  name: string;
  shortName: string;
  minDownPaymentRate: number; // e.g. 0 or 20%
  tenures: number[]; // [6, 9, 12, 18, 24]
  interestRateMonthly: number; // 0% or low promo rate
  approvalTime: string;
  requiredDocuments: string[];
  logoColor: string;
  badge?: string;
  popular?: boolean;
}

export interface InstallmentCalculation {
  price: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  tenureMonths: number;
  monthlyPayment: number;
  interestRate: number;
  conversionFee: number;
  insuranceFee: number;
  totalPayment: number;
  differenceAmount: number;
}

export interface InstallmentOrderDetails {
  method: InstallmentMethodType;
  providerId: string;
  providerName: string;
  tenureMonths: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  monthlyPayment: number;
  totalPayment: number;
  cardType?: string;
  idCardNumber?: string;
  birthYear?: string;
  approvalCode?: string;
}

export interface PaymentOption {
  id: PaymentMethodId;
  name: string;
  description: string;
  iconName: string;
  badge?: string;
}

export interface ShippingMethod {
  id: 'standard' | 'express';
  name: string;
  price: number;
  estimatedDays: string;
  icon: string;
}

export interface CustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  address: string;
  note: string;
}

export interface QrTransactionDetails {
  transactionId: string;
  confirmedAt: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  transferContent: string;
  amount: number;
}

export type OrderProgressStage = 'confirmed' | 'packing' | 'shipping' | 'delivered';

export interface Order {
  id: string;
  createdAt: string;
  confirmedAt?: string;
  items: CartItem[];
  customer: CustomerInfo;
  shipping: ShippingMethod;
  paymentMethod: PaymentMethodId;
  paymentStatus: 'paid' | 'pending' | 'processing';
  orderStatus: OrderProgressStage;
  subtotal: number;
  shippingFee: number;
  discount: number;
  voucherCode?: string;
  total: number;
  transactionId?: string;
  qrTransactionDetails?: QrTransactionDetails;
  installmentDetails?: InstallmentOrderDetails;
  emailSent?: boolean;
  emailSentTo?: string;
  emailSentAt?: string;
}

export interface FilterState {
  category: string;
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

export type NotificationType = 'order' | 'promo' | 'system' | 'voucher' | 'security';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string; // ISO date string
  isRead: boolean;
  badge?: string;
  actionType?: 'open_orders' | 'open_promo' | 'open_product' | 'open_policy' | 'open_installment' | 'open_cart';
  targetId?: string;
}
