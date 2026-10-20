import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  User,
  MapPin,
  Award,
  Coins,
  Package,
  Gift,
  LogOut,
  Save,
  CheckCircle2,
  Shield,
  Edit2,
  AlertCircle,
  Heart,
  ShoppingBag,
  Calendar,
  Phone,
  Mail,
  Clock,
  FileText,
  Sparkles,
  RotateCcw,
  Trash2,
  Plus,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Key,
  X,
} from 'lucide-react';
import { UserProfile, Order, Product, CartItem, Voucher } from '../types';
import { formatVND } from '../data/mockData';
import {
  USER_VALIDATION_RULES,
  sanitizeUserProfileInput,
  isGoogleAuthUser,
  changeRegisteredUserPassword,
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
  PhoneOtpSessionResult,
  updateUserTotpSettings,
  normalizePhoneToLocal,
} from '../firebase';
import {
  generatePhoneTotpSetup,
  verifyTotpCode,
  getTotpCurrentToken,
  getTotpSecondsRemaining,
  TotpSetupDetails,
} from '../services/totpAuthService';
import { checkIfWelcomeEmailSent } from '../utils/welcomeEmail';

export type ProfilePageTab = 'overview' | 'edit' | 'password' | 'orders' | 'wishlist';

interface ProfilePageProps {
  user: UserProfile | null;
  initialTab?: ProfilePageTab;
  onBackToHome: () => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onLogout: () => void;
  onOpenOrders: () => void;
  onOpenPromo: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  orders?: Order[];
  wishlistProducts?: Product[];
  cartItems?: CartItem[];
  appliedVoucher?: Voucher | null;
  onSelectOrderToView?: (order: Order) => void;
  onSelectProduct?: (product: Product) => void;
  onRemoveFromWishlist?: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
  onOpenCart?: () => void;
  onShowToast?: (type: 'success' | 'info' | 'error', title: string, description?: string) => void;
  onOpenGasConfig?: () => void;
}

const POPULAR_CITIES = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Cần Thơ',
  'Hải Phòng',
  'Bình Dương',
  'Đồng Nai',
  'Khánh Hòa',
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  initialTab = 'overview',
  onBackToHome,
  onUpdateUser,
  onLogout,
  onOpenOrders,
  onOpenPromo,
  onOpenAuth,
  orders = [],
  wishlistProducts = [],
  cartItems = [],
  appliedVoucher = null,
  onSelectOrderToView,
  onSelectProduct,
  onRemoveFromWishlist,
  onAddToCart,
  onOpenCart,
  onShowToast,
  onOpenGasConfig,
}) => {
  const [activeTab, setActiveTab] = useState<ProfilePageTab>(initialTab);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState(user?.city || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [address, setAddress] = useState(user?.address || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Change password states (for non-Google registered accounts)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Phone 2FA verification states (Firebase Phone Authentication)
  const [verifyPhoneInput, setVerifyPhoneInput] = useState(user?.phone || '');
  const [phoneOtpSession, setPhoneOtpSession] = useState<PhoneOtpSessionResult | null>(null);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [isPhoneOtpLoading, setIsPhoneOtpLoading] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState('');
  const [phoneOtpSuccess, setPhoneOtpSuccess] = useState('');

  // Google Authenticator TOTP 2FA states
  const [showTotpSetupModal, setShowTotpSetupModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [profileTotpSetup, setProfileTotpSetup] = useState<TotpSetupDetails | null>(null);
  const [profileTotpDigits, setProfileTotpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [profileTotpLoading, setProfileTotpLoading] = useState(false);
  const [profileTotpError, setProfileTotpError] = useState('');
  const [profileTotpSuccess, setProfileTotpSuccess] = useState('');
  const [copiedProfileSecret, setCopiedProfileSecret] = useState(false);
  const [copiedProfileBackupCodes, setCopiedProfileBackupCodes] = useState(false);
  const [profileTotpSecondsRemaining, setProfileTotpSecondsRemaining] = useState(30);

  useEffect(() => {
    if (!showTotpSetupModal) return;
    const updateTick = () => {
      setProfileTotpSecondsRemaining(getTotpSecondsRemaining());
    };
    updateTick();
    const interval = setInterval(updateTick, 1000);
    return () => clearInterval(interval);
  }, [showTotpSetupModal]);

  const isGoogleUser = isGoogleAuthUser(user);
  const isPhoneVerified = Boolean(user?.phoneVerified || user?.authProvider === 'phone');

  useEffect(() => {
    if (initialTab === 'password' && isGoogleUser) {
      setActiveTab('overview');
    } else {
      setActiveTab(initialTab);
    }
  }, [initialTab, isGoogleUser]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setVerifyPhoneInput(user.phone || '');
      setEmail(user.email || '');
      setCity(user.city || '');
      setDistrict(user.district || '');
      setAddress(user.address || '');
      setValidationError('');
      setPasswordError('');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="w-full py-12 sm:py-20 animate-fadeIn">
        <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <User className="w-7 h-7" />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Bạn chưa đăng nhập tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Vui lòng đăng nhập để xem và chỉnh sửa hồ sơ cá nhân, địa chỉ giao hàng mặc định cũng như theo dõi điểm thưởng NovaPoints của bạn.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về trang chủ</span>
            </button>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, ord) => sum + ord.total, 0);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleResetForm = () => {
    setFullName(user.fullName || '');
    setPhone(user.phone || '');
    setEmail(user.email || '');
    setCity(user.city || '');
    setDistrict(user.district || '');
    setAddress(user.address || '');
    setValidationError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanCity = city.trim();
    const cleanDistrict = district.trim();
    const cleanAddress = address.trim();

    if (!cleanName || cleanName.length > USER_VALIDATION_RULES.fullNameMaxLength) {
      setValidationError(`Họ và tên cần từ 1 đến ${USER_VALIDATION_RULES.fullNameMaxLength} ký tự.`);
      return;
    }
    if (
      !cleanPhone ||
      cleanPhone.length < USER_VALIDATION_RULES.phoneMinLength ||
      cleanPhone.length > USER_VALIDATION_RULES.phoneMaxLength ||
      !USER_VALIDATION_RULES.phonePattern.test(cleanPhone)
    ) {
      setValidationError('Số điện thoại cần từ 9 đến 15 chữ số hợp lệ.');
      return;
    }
    if (
      !cleanEmail ||
      cleanEmail.length > USER_VALIDATION_RULES.emailMaxLength ||
      !USER_VALIDATION_RULES.emailPattern.test(cleanEmail)
    ) {
      setValidationError('Địa chỉ Email không hợp lệ.');
      return;
    }
    if (!cleanCity || cleanCity.length > USER_VALIDATION_RULES.cityMaxLength) {
      setValidationError('Vui lòng nhập Tỉnh / Thành phố hợp lệ.');
      return;
    }
    if (!cleanDistrict || cleanDistrict.length > USER_VALIDATION_RULES.districtMaxLength) {
      setValidationError('Vui lòng nhập Quận / Huyện hợp lệ.');
      return;
    }
    if (!cleanAddress || cleanAddress.length > USER_VALIDATION_RULES.addressMaxLength) {
      setValidationError('Vui lòng nhập Địa chỉ chi tiết hợp lệ.');
      return;
    }

    const sanitized = sanitizeUserProfileInput(
      {
        fullName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        avatar: user.avatar || '',
        city: cleanCity,
        district: cleanDistrict,
        address: cleanAddress,
        joinedDate: user.joinedDate,
      },
      user.id,
      user.email
    );

    onUpdateUser({
      ...user,
      fullName: sanitized.fullName,
      phone: sanitized.phone,
      email: sanitized.email,
      city: sanitized.city,
      district: sanitized.district,
      address: sanitized.address,
    });

    setSavedSuccess(true);
    if (onShowToast) {
      onShowToast('success', 'Đã lưu hồ sơ thành công!', 'Thông tin cá nhân và địa chỉ giao hàng đã được cập nhật.');
    }
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại của bạn.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Mật khẩu mới cần có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    const result = changeRegisteredUserPassword(user, currentPassword, newPassword);
    if (!result.success) {
      setPasswordError(result.message);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordSuccess(result.message);
    if (onShowToast) {
      onShowToast('success', 'Đổi mật khẩu thành công!', result.message);
    }
    setTimeout(() => setPasswordSuccess(''), 4000);
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8 && /[A-Z0-9]/.test(pwd)) score += 1;
    if (pwd.length >= 10 && /[^A-Za-z0-9]/.test(pwd)) score += 1;
    if (score <= 1) return { level: 1, label: 'Trung bình', color: 'bg-amber-500' };
    if (score === 2) return { level: 2, label: 'Khá mạnh', color: 'bg-teal-500' };
    return { level: 3, label: 'Rất mạnh', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSendProfilePhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPhoneOtpError('');
    setPhoneOtpSuccess('');
    setIsPhoneOtpLoading(true);
    try {
      const session = await sendFirebasePhoneOtp(
        verifyPhoneInput,
        'profile-firebase-recaptcha-container'
      );
      setPhoneOtpSession(session);
      setPhoneOtpCode('');
    } catch (err: unknown) {
      setPhoneOtpError(
        err instanceof Error ? err.message : 'Không thể gửi mã OTP lúc này.'
      );
    } finally {
      setIsPhoneOtpLoading(false);
    }
  };

  const handleVerifyProfilePhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtpSession || !user) return;
    setPhoneOtpError('');
    setIsPhoneOtpLoading(true);
    try {
      const updated = await verifyFirebasePhoneOtp({
        otpCode: phoneOtpCode,
        session: phoneOtpSession,
        existingUser: user,
      });
      onUpdateUser(updated);
      setPhoneOtpSession(null);
      setPhoneOtpCode('');
      setPhoneOtpSuccess(
        `Đã xác thực bảo mật số điện thoại ${updated.phone} qua Firebase Authentication thành công!`
      );
      if (onShowToast) {
        onShowToast(
          'success',
          'Đã xác thực SĐT (Firebase Auth)!',
          `Số điện thoại ${updated.phone} đã được kích hoạt bảo mật 2 lớp.`
        );
      }
    } catch (err: unknown) {
      setPhoneOtpError(
        err instanceof Error ? err.message : 'Mã xác thực OTP không hợp lệ.'
      );
    } finally {
      setIsPhoneOtpLoading(false);
    }
  };

  const renderPhoneSecurityCard = () => (
    <div
      id="profile-phone-security-card"
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4"
    >
      <div id="profile-firebase-recaptcha-container" />
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Xác thực Số điện thoại & Bảo mật 2 lớp (Firebase Authentication)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Xác minh số điện thoại chính chủ bằng mã SMS OTP để bảo vệ tài khoản và đơn hàng giá trị cao.
          </p>
        </div>

        <span
          className={`text-xs font-bold px-3 py-1 rounded-lg ${
            isPhoneVerified
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}
        >
          {isPhoneVerified ? 'Đã xác thực SĐT (2FA)' : 'Chưa xác thực OTP'}
        </span>
      </div>

      {phoneOtpSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{phoneOtpSuccess}</span>
        </div>
      )}

      {phoneOtpError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="font-semibold">{phoneOtpError}</span>
        </div>
      )}

      {!phoneOtpSession ? (
        <form onSubmit={handleSendProfilePhoneOtp} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Số điện thoại nhận mã OTP bảo mật
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={verifyPhoneInput}
                maxLength={USER_VALIDATION_RULES.phoneMaxLength}
                onChange={(e) => setVerifyPhoneInput(e.target.value)}
                placeholder="Nhập số điện thoại (VD: 0901234567)"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none tabular-nums"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isPhoneOtpLoading}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            <span>{isPhoneVerified ? 'Xác thực lại SĐT' : 'Gửi mã xác thực OTP'}</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyProfilePhoneOtp} className="space-y-3">
          {phoneOtpSession.mode === 'firebase_sandbox' && phoneOtpSession.sandboxOtpCode && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-amber-900 dark:text-amber-200">
                Mã SMS OTP Bảo mật (Firebase Auth) gửi tới{' '}
                <strong className="tabular-nums">{phoneOtpSession.localPhone}</strong>:{' '}
                <strong className="font-mono text-sm text-blue-600 dark:text-blue-400 tabular-nums">
                  {phoneOtpSession.sandboxOtpCode}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setPhoneOtpCode(phoneOtpSession.sandboxOtpCode || '')}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer"
              >
                Điền mã OTP
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Nhập mã OTP 6 chữ số đã gửi tới {phoneOtpSession.localPhone}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={phoneOtpCode}
                onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Nhập 6 chữ số OTP"
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none tabular-nums"
                required
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPhoneOtpSession(null);
                  setPhoneOtpCode('');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPhoneOtpLoading || phoneOtpCode.length < 6}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận OTP</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );

  // ==========================================
  // GOOGLE AUTHENTICATOR (TOTP) PROFILE HANDLERS
  // ==========================================
  const handleStartProfileTotpSetup = async () => {
    if (!user) return;
    const targetPhone = user.phone || verifyPhoneInput;
    if (!targetPhone || targetPhone.length < 9) {
      setProfileTotpError('Vui lòng cập nhật số điện thoại trước khi thiết lập Google Authenticator.');
      return;
    }
    setProfileTotpError('');
    setProfileTotpSuccess('');
    setProfileTotpLoading(true);
    try {
      const setup = await generatePhoneTotpSetup(targetPhone, user.totpSecret);
      setProfileTotpSetup(setup);
      setProfileTotpDigits(['', '', '', '', '', '']);
      setShowTotpSetupModal(true);
    } catch (err: unknown) {
      setProfileTotpError(
        err instanceof Error ? err.message : 'Không thể khởi tạo mã Google Authenticator.'
      );
    } finally {
      setProfileTotpLoading(false);
    }
  };

  const handleProfileTotpDigitChange = (index: number, rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) {
      const next = [...profileTotpDigits];
      next[index] = '';
      setProfileTotpDigits(next);
      return;
    }

    if (digitsOnly.length > 1) {
      const chars = digitsOnly.slice(0, 6).split('');
      const next = [...profileTotpDigits];
      chars.forEach((ch, idx) => {
        if (index + idx < 6) {
          next[index + idx] = ch;
        }
      });
      setProfileTotpDigits(next);
      return;
    }

    const next = [...profileTotpDigits];
    next[index] = digitsOnly;
    setProfileTotpDigits(next);
  };

  const handleAutofillProfileTotp = () => {
    if (!profileTotpSetup) return;
    const currentCode = getTotpCurrentToken(profileTotpSetup.secretBase32) || profileTotpSetup.sampleCurrentToken;
    const chars = currentCode.slice(0, 6).split('');
    setProfileTotpDigits([
      chars[0] || '',
      chars[1] || '',
      chars[2] || '',
      chars[3] || '',
      chars[4] || '',
      chars[5] || '',
    ]);
  };

  const handleVerifyProfileTotp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileTotpSetup || !user) return;
    const code = profileTotpDigits.join('').trim();
    if (code.length !== 6) {
      setProfileTotpError('Vui lòng nhập đủ 6 chữ số từ ứng dụng Google Authenticator.');
      return;
    }

    setProfileTotpLoading(true);
    setTimeout(() => {
      setProfileTotpLoading(false);
      const res = verifyTotpCode(profileTotpSetup.secretBase32, code, profileTotpSetup.backupCodes);
      if (!res.success) {
        setProfileTotpError(res.error || 'Mã xác thực không chính xác hoặc đã hết hạn.');
        return;
      }

      const updated = updateUserTotpSettings(user, {
        totpEnabled: true,
        totpSecret: profileTotpSetup.secretBase32,
        backupCodes: profileTotpSetup.backupCodes,
      });
      onUpdateUser(updated);
      setShowTotpSetupModal(false);
      setProfileTotpSuccess('Đã kích hoạt bảo mật Google Authenticator (TOTP) thành công!');
      if (onShowToast) {
        onShowToast(
          'success',
          'Google Authenticator đã kích hoạt!',
          `Đã bảo vệ SĐT ${updated.phone} bằng mã TOTP RFC 6238.`
        );
      }
    }, 300);
  };

  const handleDisableProfileTotp = () => {
    if (!user) return;
    if (confirm('Bạn có chắc chắn muốn tắt xác thực 2 lớp Google Authenticator?')) {
      const updated = updateUserTotpSettings(user, {
        totpEnabled: false,
      });
      onUpdateUser(updated);
      setProfileTotpSuccess('Đã tắt xác thực Google Authenticator.');
      if (onShowToast) {
        onShowToast(
          'info',
          'Đã tắt Google Authenticator',
          'Tài khoản của bạn đã chuyển về đăng nhập tiêu chuẩn.'
        );
      }
    }
  };

  const handleCopyProfileSecret = async () => {
    if (!profileTotpSetup?.secretBase32) return;
    try {
      await navigator.clipboard.writeText(profileTotpSetup.secretBase32);
      setCopiedProfileSecret(true);
      setTimeout(() => setCopiedProfileSecret(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyProfileBackupCodes = async (codes: string[]) => {
    if (!codes || codes.length === 0) return;
    const text =
      `NOVASHOP - MÃ KHÔI PHỤC DỰ PHÒNG GOOGLE AUTHENTICATOR (SĐT: ${user?.phone})\n` +
      codes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\nLưu ý: Mỗi mã dùng 1 lần để đăng nhập khi mất điện thoại.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedProfileBackupCodes(true);
      setTimeout(() => setCopiedProfileBackupCodes(false), 2500);
    } catch {
      // fallback
    }
  };

  const renderGoogleAuthenticatorCard = () => {
    const isTotpActive = Boolean(user?.totpEnabled && user?.totpSecret);
    return (
      <div
        id="profile-google-authenticator-card"
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Bảo mật 2 lớp Google Authenticator (TOTP RFC 6238)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tạo mã xác thực 6 số trên điện thoại mỗi 30 giây, không phụ thuộc mạng viễn thông SMS và chống sim swap.
            </p>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-lg ${
              isTotpActive
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isTotpActive ? 'Đã kích hoạt TOTP 2FA' : 'Chưa kích hoạt'}
          </span>
        </div>

        {profileTotpSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{profileTotpSuccess}</span>
          </div>
        )}

        {profileTotpError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{profileTotpError}</span>
          </div>
        )}

        {isTotpActive ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-slate-800/80 border border-teal-200/70 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Số điện thoại liên kết 2FA:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {user?.phone || 'Chưa cập nhật'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                Bảo vệ đăng nhập & đơn hàng
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBackupCodesModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Xem mã khôi phục dự phòng</span>
              </button>

              <button
                type="button"
                onClick={handleStartProfileTotpSetup}
                disabled={profileTotpLoading}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Quét lại mã QR</span>
              </button>

              <button
                type="button"
                onClick={handleDisableProfileTotp}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer ml-auto"
              >
                <span>Tắt TOTP</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Kích hoạt Google Authenticator cho số điện thoại {user?.phone || ''}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                Sau khi kích hoạt, bạn sẽ dùng mã 6 số từ ứng dụng Google Authenticator trên điện thoại để đăng nhập an toàn, ngay cả khi điện thoại không có sóng di động hay kết nối internet.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartProfileTotpSetup}
              disabled={profileTotpLoading}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              <span>Cấu hình Google Authenticator ngay</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPasswordChangeCard = () => {
    if (isGoogleUser) return null;
    return (
      <div
        id="profile-change-password-card"
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Đổi mật khẩu tài khoản</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dành cho tài khoản đăng ký trực tiếp trên NovaShop. Nên cập nhật mật khẩu định kỳ để bảo vệ tài khoản.
            </p>
          </div>

          {(currentPassword || newPassword || confirmNewPassword) && (
            <button
              type="button"
              onClick={handleResetPasswordForm}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm mới ô nhập</span>
            </button>
          )}
        </div>

        {passwordSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="font-semibold">{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="profile-current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang sử dụng"
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                aria-label={showCurrentPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="profile-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                  aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Độ mạnh mật khẩu:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{passwordStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-colors ${
                          passwordStrength.level >= step
                            ? passwordStrength.color
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="profile-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                  aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmNewPassword && (
                <p
                  className={`mt-1.5 text-[11px] font-semibold ${
                    confirmNewPassword === newPassword
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {confirmNewPassword === newPassword
                    ? '✓ Mật khẩu xác nhận trùng khớp'
                    : '✕ Mật khẩu xác nhận chưa khớp'}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              id="profile-change-password-submit-btn"
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Cập nhật mật khẩu mới</span>
            </button>
          </div>
        </form>
      </div>
    );
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'Diamond':
        return 'from-cyan-500 to-blue-600 text-white';
      case 'Gold':
        return 'keep-dark-text from-amber-400 to-amber-500 text-slate-950';
      case 'Silver':
        return 'keep-dark-text from-slate-200 to-slate-300 text-slate-900';
      default:
        return 'from-amber-600 to-amber-700 text-white';
    }
  };

  const fullAddressDisplay =
    user.address || user.district || user.city
      ? [user.address, user.district, user.city].filter(Boolean).join(', ')
      : 'Chưa cập nhật địa chỉ giao hàng mặc định';

  return (
    <div id="user-profile-page" className="w-full space-y-5 sm:space-y-6 animate-fadeIn pb-12 sm:pb-16">
      {/* Breadcrumb & Back Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Trang chủ</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 dark:text-white font-bold">Tài khoản của tôi</span>
        </div>

        <button
          id="profile-page-back-home-btn"
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại mua sắm</span>
        </button>
      </nav>

      {/* Top Profile Hero Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 text-white p-5 sm:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
            {user.avatar?.trim() ? (
              <img
                src={user.avatar.trim()}
                alt={user.fullName}
                width={84}
                height={84}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/60 shadow-md shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-inner shrink-0">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white truncate">
                  {user.fullName}
                </h1>
                <span
                  className={`text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-gradient-to-r ${getTierBadgeStyle(
                    user.memberTier
                  )} shadow-xs uppercase tracking-wider shrink-0`}
                >
                  Hội viên VIP {user.memberTier}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-blue-100">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Phone className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  <span>{user.phone || 'Chưa cập nhật SĐT'}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 tabular-nums text-blue-200 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>Tham gia: {user.joinedDate}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs">
                <span className="inline-flex items-center gap-1.5 text-amber-300 font-extrabold tabular-nums">
                  <Coins className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{user.novaPoints.toLocaleString('vi-VN')} NovaPoints</span>
                </span>
                <span className="text-white/40" aria-hidden="true">·</span>
                <span className="text-blue-100 truncate max-w-md">
                  Giao hàng: <strong className="text-white font-semibold">{fullAddressDisplay}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Profile Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Navigation Sidebar (4 cols on lg) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs space-y-1">
            <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Danh mục quản lý tài khoản
            </div>

            <button
              id="profile-tab-overview"
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4 shrink-0" />
                <span>Tổng quan hồ sơ</span>
              </span>
              <ChevronRight className="w-4 h-4 opacity-75" />
            </button>

            <button
              id="profile-tab-edit"
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Edit2 className="w-4 h-4 shrink-0" />
                <span>Chỉnh sửa thông tin & Địa chỉ</span>
              </span>
              <ChevronRight className="w-4 h-4 opacity-75" />
            </button>

            {!isGoogleUser && (
              <button
                id="profile-tab-password"
                type="button"
                onClick={() => setActiveTab('password')}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'password'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>Đổi mật khẩu</span>
                </span>
                <ChevronRight className="w-4 h-4 opacity-75" />
              </button>
            )}

            <button
              id="profile-tab-orders"
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4 shrink-0" />
                <span>Lịch sử đơn hàng</span>
              </span>
              <span
                className={`text-xs font-extrabold tabular-nums px-2 py-0.5 rounded-md ${
                  activeTab === 'orders'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {orders.length}
              </span>
            </button>

            <button
              id="profile-tab-wishlist"
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 shrink-0" />
                <span>Yêu thích & Giỏ hàng</span>
              </span>
              <span
                className={`text-xs font-extrabold tabular-nums px-2 py-0.5 rounded-md ${
                  activeTab === 'wishlist'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {wishlistProducts.length + totalCartItems}
              </span>
            </button>

            {onOpenGasConfig && (
              <button
                id="profile-tab-gas-config"
                type="button"
                onClick={onOpenGasConfig}
                className="w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50/70 hover:bg-blue-100/70 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-between cursor-pointer border border-blue-200/80 dark:border-slate-700"
              >
                <span className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>Email Chào Mừng (GAS)</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-200/70 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                  Cấu hình
                </span>
              </button>
            )}

            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onBackToHome();
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>

          {/* Security & Sync Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-100">
              <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Bảo mật & Đồng bộ Cloud</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Mọi thay đổi về họ tên, số điện thoại và địa chỉ giao hàng mặc định đều được đồng bộ tự động vào biểu mẫu thanh toán nhanh của NovaShop.
            </p>
            <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              Mã định danh: #{user.id.slice(0, 12)}
            </div>
          </div>
        </aside>

        {/* Right Main Content Area (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-5">
          {savedSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold">
                  Đã lưu cập nhật hồ sơ cá nhân và đồng bộ lên hệ thống thành công!
                </span>
              </div>
              {activeTab === 'edit' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shrink-0"
                >
                  Xem hồ sơ
                </button>
              )}
            </div>
          )}

          {validationError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span className="font-semibold">{validationError}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* KPI Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-left hover:border-blue-400 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Tổng đơn hàng
                  </span>
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums mt-1 block">
                    {orders.length} đơn
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-left hover:border-teal-400 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Tổng chi tiêu
                  </span>
                  <span className="text-base sm:text-lg font-black text-teal-700 dark:text-teal-300 tabular-nums mt-1 block truncate">
                    {formatVND(totalSpent)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('wishlist')}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-left hover:border-rose-400 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Đã yêu thích
                  </span>
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums mt-1 block">
                    {wishlistProducts.length} SP
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCart) onOpenCart();
                    else setActiveTab('wishlist');
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-left hover:border-blue-400 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Trong giỏ hàng
                  </span>
                  <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 tabular-nums mt-1 block">
                    {totalCartItems} SP
                  </span>
                </button>
              </div>

              {/* Member Privileges & Points Progress */}
              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-900 dark:to-slate-800 border border-amber-200/80 dark:border-slate-700 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-300">
                      Đặc quyền Hội viên VIP {user.memberTier} · Tích lũy điểm thưởng mọi đơn hàng
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenPromo}
                    className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer shrink-0"
                  >
                    Đổi voucher ưu đãi →
                  </button>
                </div>
                <div className="w-full bg-amber-200/60 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (user.novaPoints / 5000) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-slate-300 tabular-nums">
                  <span>Điểm hiện có: <strong>{user.novaPoints.toLocaleString('vi-VN')}</strong> / 5.000 điểm</span>
                  <span>
                    {user.novaPoints >= 5000
                      ? 'Đã đạt hạng cao nhất VIP Diamond'
                      : `Cần thêm ${(5000 - user.novaPoints).toLocaleString('vi-VN')} điểm để thăng hạng VIP Diamond`}
                  </span>
                </div>
              </div>

              {/* Google Apps Script Welcome Email Status Card */}
              <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/70 dark:from-slate-850 dark:to-slate-800 border border-blue-200/90 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                        Email Chào Mừng Thành Viên (Google Apps Script)
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                        {checkIfWelcomeEmailSent(user.id, user.email) ? '✓ Đã gửi thư chào mừng' : 'Sẵn sàng gửi tự động'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Khi đăng nhập lần đầu, hệ thống NovaShop tự động gọi Google Apps Script Web App để gửi thư chào mừng cá nhân hóa kèm mã Voucher <strong>WELCOME100</strong> (100K) và cộng <strong>1.000 NovaPoints</strong> tới <strong>{user.email}</strong>.
                    </p>
                  </div>
                </div>

                {onOpenGasConfig && (
                  <button
                    type="button"
                    onClick={onOpenGasConfig}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Cấu hình & Kiểm thử</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Detailed Personal Information & Default Address Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Thông tin cá nhân & Địa chỉ nhận hàng mặc định</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Thông tin này được tự động điền khi bạn đặt hàng và xuất hóa đơn điện tử.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isGoogleUser && (
                      <button
                        id="overview-switch-to-password-btn"
                        type="button"
                        onClick={() => setActiveTab('password')}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Đổi mật khẩu</span>
                      </button>
                    )}
                    <button
                      id="overview-switch-to-edit-btn"
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa thông tin</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      Họ và tên khách hàng
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                      {user.fullName}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Số điện thoại liên hệ nhận hàng
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          isPhoneVerified
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isPhoneVerified ? 'Đã xác thực OTP' : 'Chưa xác thực OTP'}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums mt-1 block">
                      {user.phone || 'Chưa cập nhật số điện thoại'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      Email nhận thông báo & Hóa đơn VAT
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white mt-1 block truncate">
                      {user.email}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      Mã ưu đãi đang áp dụng
                    </span>
                    <span className="font-bold text-teal-700 dark:text-teal-300 mt-1 block">
                      {appliedVoucher
                        ? `${appliedVoucher.code} (${appliedVoucher.description})`
                        : 'Chưa chọn mã ưu đãi'}
                    </span>
                  </div>

                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        Địa chỉ giao hàng mặc định
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                        {fullAddressDisplay}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0 self-start sm:self-center"
                    >
                      Cập nhật địa chỉ →
                    </button>
                  </div>

                  {!isGoogleUser && (
                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">
                          Bảo mật mật khẩu tài khoản
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                          Tài khoản đăng ký bằng mật khẩu ••••••••••
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('password')}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0 self-start sm:self-center"
                      >
                        Đổi mật khẩu →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Phone 2FA Security Card */}
              {renderPhoneSecurityCard()}

              {/* Google Authenticator TOTP Security Card */}
              {renderGoogleAuthenticatorCard()}

              {/* Latest Order Quick Preview */}
              {orders.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Đơn hàng gần nhất</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>Xem tất cả ({orders.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          #{orders[0].id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                          {new Date(orders[0].createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {orders[0].orderStatus === 'shipping'
                            ? 'Đang giao hàng'
                            : orders[0].orderStatus === 'delivered'
                            ? 'Đã giao thành công'
                            : 'Đã xác nhận'}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                        {orders[0].items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="font-black text-slate-900 dark:text-white tabular-nums">
                        {formatVND(orders[0].total)}
                      </span>
                      {onSelectOrderToView && (
                        <button
                          type="button"
                          onClick={() => onSelectOrderToView(orders[0])}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                        >
                          Xem hóa đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDIT PROFILE & SHIPPING ADDRESS */}
          {activeTab === 'edit' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Chỉnh sửa hồ sơ & Địa chỉ nhận hàng</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cập nhật thông tin chính xác để quá trình giao nhận và đối soát đơn hàng diễn ra nhanh chóng nhất.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục ban đầu</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Họ và tên người nhận hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="profile-edit-fullname"
                    type="text"
                    value={fullName}
                    maxLength={USER_VALIDATION_RULES.fullNameMaxLength}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên đầy đủ của bạn"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Số điện thoại liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="profile-edit-phone"
                      type="tel"
                      value={phone}
                      maxLength={USER_VALIDATION_RULES.phoneMaxLength}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="VD: 0901234567"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none tabular-nums"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Địa chỉ Email nhận hóa đơn điện tử <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="profile-edit-email"
                      type="email"
                      value={email}
                      maxLength={USER_VALIDATION_RULES.emailMaxLength}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="VD: khachhang@email.com"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>Địa chỉ giao hàng mặc định</span>
                    </span>
                  </div>

                  {/* Quick Select Popular Cities */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Chọn nhanh Tỉnh / Thành phố:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_CITIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCity(c)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            city === c
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        Tỉnh / Thành phố <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="profile-edit-city"
                        type="text"
                        value={city}
                        maxLength={USER_VALIDATION_RULES.cityMaxLength}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="VD: TP. Hồ Chí Minh"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        Quận / Huyện / Thành phố trực thuộc <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="profile-edit-district"
                        type="text"
                        value={district}
                        maxLength={USER_VALIDATION_RULES.districtMaxLength}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="VD: Quận 1, TP. Thủ Đức..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Địa chỉ chi tiết (Số nhà, tên đường, phường/xã) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="profile-edit-address"
                      type="text"
                      value={address}
                      maxLength={USER_VALIDATION_RULES.addressMaxLength}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="VD: Số 123 Đường Nguyễn Huệ, Phường Bến Nghé"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetForm();
                      setActiveTab('overview');
                    }}
                    className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Hủy thay đổi
                  </button>

                  <button
                    id="profile-save-submit-btn"
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu thông tin hồ sơ</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'edit' && !isGoogleUser && renderPasswordChangeCard()}

          {/* TAB: CHANGE PASSWORD (FOR NON-GOOGLE USERS) */}
          {activeTab === 'password' && !isGoogleUser && renderPasswordChangeCard()}

          {/* TAB 3: ORDERS HISTORY */}
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Lịch sử đơn hàng của {user.fullName} ({orders.length})
                </h2>
                <button
                  type="button"
                  onClick={onOpenOrders}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Mở trình tra cứu chi tiết →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
                  <Package className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Bạn chưa có đơn hàng nào
                  </p>
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                  >
                    Khám phá sản phẩm ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 space-y-2.5 text-xs sm:text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            #{ord.id}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-500 tabular-nums">
                            {new Date(ord.createdAt).toLocaleDateString('vi-VN')}{' '}
                            {new Date(ord.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <span className="font-bold text-teal-700 dark:text-teal-300">
                          {ord.orderStatus === 'shipping'
                            ? 'Đang vận chuyển'
                            : ord.orderStatus === 'delivered'
                            ? 'Đã giao hàng'
                            : 'Đã xác nhận'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2">
                            <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                              {item.product.name} × {item.quantity}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 tabular-nums shrink-0">
                              {formatVND(item.product.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-slate-500 text-xs">
                          Thanh toán: <strong className="text-slate-700 dark:text-slate-300">{ord.paymentMethod.toUpperCase()}</strong>
                        </span>
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-sm text-slate-900 dark:text-white tabular-nums">
                            {formatVND(ord.total)}
                          </span>
                          {onSelectOrderToView && (
                            <button
                              type="button"
                              onClick={() => onSelectOrderToView(ord)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Xem biên lai</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WISHLIST & CART */}
          {activeTab === 'wishlist' && (
            <div className="space-y-5">
              {/* Current Cart Summary */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="text-xs sm:text-sm">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Giỏ hàng hiện tại: {totalCartItems} sản phẩm
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 tabular-nums">
                      Tạm tính: <strong className="text-teal-700 dark:text-teal-300">{formatVND(cartSubtotal)}</strong>
                    </p>
                  </div>
                </div>
                {onOpenCart && (
                  <button
                    type="button"
                    onClick={onOpenCart}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Mở giỏ hàng & Thanh toán
                  </button>
                )}
              </div>

              {/* Wishlist Items */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Danh sách sản phẩm yêu thích ({wishlistProducts.length})
                </h3>
                {wishlistProducts.length === 0 ? (
                  <div className="py-10 text-center border border-slate-200/70 dark:border-slate-800 rounded-2xl space-y-2">
                    <Heart className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs sm:text-sm text-slate-500">
                      Bạn chưa lưu sản phẩm yêu thích nào.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wishlistProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:border-blue-400 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div
                          onClick={() => onSelectProduct?.(prod)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <img
                            src={prod.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-contain bg-slate-50 p-1.5 shrink-0 border border-slate-100"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {prod.name}
                            </p>
                            <p className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
                              {formatVND(prod.price)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onAddToCart && (
                            <button
                              type="button"
                              onClick={() => onAddToCart(prod)}
                              title="Thêm vào giỏ"
                              className="p-2 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          {onRemoveFromWishlist && (
                            <button
                              type="button"
                              onClick={() => onRemoveFromWishlist(prod.id)}
                              title="Bỏ yêu thích"
                              className="p-2 rounded-xl bg-rose-50 dark:bg-slate-800 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: GOOGLE AUTHENTICATOR SETUP MODAL */}
      {showTotpSetupModal && profileTotpSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Cấu hình Google Authenticator
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    SĐT liên kết: <strong className="tabular-nums">{profileTotpSetup.phone}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTotpSetupModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileTotpError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{profileTotpError}</span>
              </div>
            )}

            {/* QR Code and Secret Key */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-center">
                <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-600">
                  {profileTotpSetup.qrCodeDataUrl ? (
                    <img
                      src={profileTotpSetup.qrCodeDataUrl}
                      alt="TOTP QR Code"
                      className="w-40 h-40 object-contain"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400">
                      Đang tải mã QR...
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  <span>Khóa bí mật (nhập thủ công):</span>
                  <button
                    type="button"
                    onClick={handleCopyProfileSecret}
                    className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedProfileSecret ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600">Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono font-bold text-xs tracking-wider text-slate-800 dark:text-slate-200 select-all break-all text-center">
                  {profileTotpSetup.formattedSecret}
                </div>
              </div>

              <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-decimal list-inside bg-teal-50/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-teal-100 dark:border-slate-700">
                <li>Mở ứng dụng <strong>Google Authenticator</strong> trên điện thoại.</li>
                <li>Chạm vào dấu <strong>(+)</strong> → chọn <strong>Quét mã QR</strong>.</li>
                <li>Nhập mã OTP 6 chữ số đang xoay vòng vào bên dưới để xác nhận.</li>
              </ol>
            </div>

            {/* 6 Digit Verification Form */}
            <form onSubmit={handleVerifyProfileTotp} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                    Nhập mã xác thực 6 số trên app
                  </label>
                  <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300 flex items-center gap-1 tabular-nums">
                    <Clock className="w-3 h-3" />
                    <span>Mã đổi sau {profileTotpSecondsRemaining}s</span>
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {profileTotpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleProfileTotpDigitChange(idx, e.target.value)}
                      className="w-full aspect-square text-center text-lg font-bold font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all tabular-nums"
                      autoComplete="off"
                    />
                  ))}
                </div>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={handleAutofillProfileTotp}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Kiểm thử nhanh: Điền mã hợp lệ hiện tại</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTotpSetupModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={profileTotpLoading || profileTotpDigits.join('').length < 6}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {profileTotpLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Xác nhận & Kích hoạt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BACKUP RECOVERY CODES MODAL */}
      {showBackupCodesModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Mã khôi phục dự phòng
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    SĐT: {user.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBackupCodesModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có thể sử dụng các mã này để đăng nhập vào NovaShop trong trường hợp không có điện thoại hoặc ứng dụng Google Authenticator không khả dụng:
            </p>

            <div className="grid grid-cols-2 gap-2 p-3 bg-amber-50/70 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700 rounded-2xl">
              {(user.backupCodes && user.backupCodes.length > 0
                ? user.backupCodes
                : ['8392-4109', '5920-1847', '4819-2048', '9102-3847', '2948-1092', '6719-2849', '3829-1094', '4910-2839']
              ).map((code, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-slate-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 text-center tracking-wider"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() =>
                  handleCopyProfileBackupCodes(
                    user.backupCodes || [
                      '8392-4109',
                      '5920-1847',
                      '4819-2048',
                      '9102-3847',
                      '2948-1092',
                      '6719-2849',
                      '3829-1094',
                      '4910-2839',
                    ]
                  )
                }
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedProfileBackupCodes ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã sao chép tất cả!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép tất cả mã</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowBackupCodesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
