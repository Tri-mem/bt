import { InstallmentBank, FinanceCompany, InstallmentCalculation, InstallmentMethodType } from '../types';

export const INSTALLMENT_BANKS: InstallmentBank[] = [
  {
    id: 'techcombank',
    name: 'Ngân hàng TMCP Kỹ thương Việt Nam',
    shortName: 'Techcombank',
    cardTypes: ['visa', 'mastercard'],
    tenures: [3, 6, 9, 12],
    interestRate: 0,
    conversionFeeRate: 0, // 0% tài trợ
    minAmount: 1000000,
    logoColor: '#E21A22',
    badge: '0% Phí chuyển đổi',
  },
  {
    id: 'vpbank',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    shortName: 'VPBank',
    cardTypes: ['visa', 'mastercard', 'jcb'],
    tenures: [3, 6, 9, 12, 18],
    interestRate: 0,
    conversionFeeRate: 0,
    minAmount: 1000000,
    logoColor: '#00903E',
    badge: 'Duyệt online 100%',
  },
  {
    id: 'vietcombank',
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    shortName: 'Vietcombank',
    cardTypes: ['visa', 'mastercard', 'jcb'],
    tenures: [3, 6, 9, 12],
    interestRate: 0,
    conversionFeeRate: 0,
    minAmount: 1500000,
    logoColor: '#005A36',
    badge: 'Phổ biến nhất',
  },
  {
    id: 'mbbank',
    name: 'Ngân hàng Quân đội',
    shortName: 'MB Bank',
    cardTypes: ['visa', 'mastercard', 'jcb'],
    tenures: [3, 6, 9, 12],
    interestRate: 0,
    conversionFeeRate: 0,
    minAmount: 1000000,
    logoColor: '#102A83',
    badge: 'Miễn phí hồ sơ',
  },
  {
    id: 'tpbank',
    name: 'Ngân hàng TMCP Tiên Phong',
    shortName: 'TPBank',
    cardTypes: ['visa', 'mastercard'],
    tenures: [3, 6, 9, 12, 24],
    interestRate: 0,
    conversionFeeRate: 0,
    minAmount: 1000000,
    logoColor: '#5C1D82',
    badge: 'Kỳ hạn đến 24T',
  },
  {
    id: 'acb',
    name: 'Ngân hàng TMCP Á Châu',
    shortName: 'ACB',
    cardTypes: ['visa', 'mastercard', 'jcb'],
    tenures: [3, 6, 9, 12],
    interestRate: 0,
    conversionFeeRate: 0,
    minAmount: 1000000,
    logoColor: '#00529C',
  },
  {
    id: 'sacombank',
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    shortName: 'Sacombank',
    cardTypes: ['visa', 'mastercard', 'jcb'],
    tenures: [3, 6, 9, 12],
    interestRate: 0,
    conversionFeeRate: 0,
    minAmount: 1000000,
    logoColor: '#004B87',
  },
  {
    id: 'vib',
    name: 'Ngân hàng Quốc Tế VIB',
    shortName: 'VIB',
    cardTypes: ['visa', 'mastercard'],
    tenures: [3, 6, 9, 12],
    interestRate: 0,
    conversionFeeRate: 0,
    minAmount: 1000000,
    logoColor: '#005696',
    badge: 'Cashback 1%',
  },
  {
    id: 'hsbc',
    name: 'Ngân hàng TNHH MTV HSBC Việt Nam',
    shortName: 'HSBC',
    cardTypes: ['visa', 'mastercard'],
    tenures: [3, 6, 9, 12],
    interestRate: 0,
    conversionFeeRate: 0,
    minAmount: 2000000,
    logoColor: '#DB0011',
  },
  {
    id: 'shinhan',
    name: 'Ngân hàng Shinhan Việt Nam',
    shortName: 'Shinhan Bank',
    cardTypes: ['visa'],
    tenures: [3, 6, 9, 12],
    interestRate: 0,
    conversionFeeRate: 0,
    minAmount: 1000000,
    logoColor: '#004C97',
  },
];

export const FINANCE_COMPANIES: FinanceCompany[] = [
  {
    id: 'home_credit',
    name: 'Công ty Tài chính TNHH MTV Home Credit Việt Nam',
    shortName: 'Home Credit',
    minDownPaymentRate: 0, // Trả trước 0%
    tenures: [6, 9, 12],
    interestRateMonthly: 0, // 0% gói trợ giá đặc biệt
    approvalTime: '3 - 5 phút',
    requiredDocuments: ['Chỉ cần CCCD gắn chip (từ 18 - 60 tuổi)', 'Không cần chứng minh thu nhập'],
    logoColor: '#E21A22',
    badge: 'Trả trước từ 0đ',
    popular: true,
  },
  {
    id: 'fe_credit',
    name: 'Công ty Tài chính VPBank SMBC (FE Credit)',
    shortName: 'FE Credit',
    minDownPaymentRate: 0,
    tenures: [6, 9, 12, 18],
    interestRateMonthly: 0,
    approvalTime: '5 - 10 phút',
    requiredDocuments: ['CCCD gắn chip chính chủ', 'Duyệt hồ sơ online 100%'],
    logoColor: '#008744',
    badge: 'Hạn mức đến 70Tr',
  },
  {
    id: 'hd_saison',
    name: 'Công ty Tài chính TNHH HD SAISON',
    shortName: 'HD SAISON',
    minDownPaymentRate: 10,
    tenures: [6, 9, 12, 18, 24],
    interestRateMonthly: 0,
    approvalTime: '5 - 15 phút',
    requiredDocuments: ['CCCD gắn chip hoặc CMND + Bằng lái xe', 'Hỗ trợ linh hoạt đến 24 tháng'],
    logoColor: '#D32F2F',
    badge: 'Lãi suất 0%',
  },
  {
    id: 'mirae_asset',
    name: 'Công ty Tài chính Mirae Asset Việt Nam',
    shortName: 'Mirae Asset',
    minDownPaymentRate: 20,
    tenures: [6, 9, 12, 18],
    interestRateMonthly: 0,
    approvalTime: '10 - 20 phút',
    requiredDocuments: ['CCCD gắn chip', 'Hộ khẩu hoặc VNeID mức 2'],
    logoColor: '#F58220',
    badge: 'Bảo mật cao',
  },
];

/**
 * Calculate precise installment plan
 */
export function calculateInstallment({
  price,
  method,
  downPaymentPercent = 0,
  tenureMonths = 6,
}: {
  price: number;
  method: InstallmentMethodType;
  providerId?: string;
  downPaymentPercent?: number; // 0, 10, 20, 30, 50, 70
  tenureMonths?: number; // 3, 6, 9, 12, 18, 24
}): InstallmentCalculation {
  const safePrice = Math.max(0, price);
  const percent = method === 'credit_card' ? 0 : Math.max(0, Math.min(70, downPaymentPercent));
  const downPaymentAmount = Math.round((safePrice * percent) / 100);
  const loanAmount = Math.max(0, safePrice - downPaymentAmount);

  // Interest and fees:
  // For NovaShop 0% installment promotion, interest rate is 0%
  const interestRate = 0;
  const conversionFee = 0; // NovaShop sponsors 100% conversion fee for credit cards
  const insuranceFee = method === 'finance_company' && percent < 20 ? 0 : 0; // Free insurance

  const monthlyPayment = tenureMonths > 0 ? Math.round(loanAmount / tenureMonths) : loanAmount;
  const totalPayment = downPaymentAmount + monthlyPayment * tenureMonths + conversionFee + insuranceFee;
  const differenceAmount = Math.max(0, totalPayment - safePrice);

  return {
    price: safePrice,
    downPaymentPercent: percent,
    downPaymentAmount,
    loanAmount,
    tenureMonths,
    monthlyPayment,
    interestRate,
    conversionFee,
    insuranceFee,
    totalPayment,
    differenceAmount,
  };
}

/**
 * Get monthly minimum estimate for badges (e.g. "Chỉ từ ~250.000₫/tháng")
 */
export function getEstimatedMonthlyInstallment(price: number): number {
  if (price <= 0) return 0;
  // Based on 12 months for high-ticket, or 6 months for lower prices
  const months = price >= 10000000 ? 12 : 6;
  return Math.round(price / months);
}
