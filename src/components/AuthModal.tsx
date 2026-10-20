import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  QrCode,
  KeyRound,
  Copy,
  Check,
  Shield,
  Clock,
  ArrowLeft,
  Key,
  Settings,
} from 'lucide-react';
import { Product, UserProfile } from '../types';
import { formatVND } from '../data/mockData';
import {
  signInWithGooglePopup,
  signInWithGoogleAccountFallback,
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
  clearFirebaseRecaptchaVerifier,
  normalizePhoneToE164,
  normalizePhoneToLocal,
  PhoneOtpSessionResult,
  USER_VALIDATION_RULES,
  sanitizeUserProfileInput,
  saveRegisteredAccount,
  findRegisteredAccount,
  getRegisteredAccounts,
  registerPhoneUserWithTotp,
  RegisteredAccountEntry,
} from '../firebase';
import {
  generatePhoneTotpSetup,
  verifyTotpCode,
  getTotpCurrentToken,
  getTotpSecondsRemaining,
  TotpSetupDetails,
} from '../services/totpAuthService';
import {
  TelegramOtpSession,
  sendTelegramPhoneOtp,
  verifyTelegramOtpCode,
  formatTelegramBotMessage,
} from '../services/telegramOtpService';
import { TelegramBotConfigModal } from './TelegramBotConfigModal';

export interface PendingPurchaseContext {
  type: 'buy_now' | 'buy_from_card' | 'add_to_cart' | 'proceed_to_checkout' | 'open_installment';
  product?: Product;
  quantity?: number;
  color?: string;
  cartCount?: number;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'phone_otp' | 'phone_totp';
  onLoginSuccess: (user: UserProfile, isNewUser?: boolean) => void;
  pendingPurchase?: PendingPurchaseContext | null;
}

const RECAPTCHA_CONTAINER_ID = 'firebase-auth-recaptcha-container';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
  pendingPurchase,
}) => {
  // Mode: strictly 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(
    initialMode === 'register' || initialMode === 'phone_otp' || initialMode === 'phone_totp'
      ? 'register'
      : 'login'
  );
  // Registration method: Google Authenticator TOTP (Recommended), Standard, or Firebase Phone SMS OTP
  const [registerMethod, setRegisterMethod] = useState<'phone_totp' | 'standard' | 'phone_otp'>(
    initialMode === 'phone_otp'
      ? 'phone_otp'
      : initialMode === 'register'
      ? 'phone_totp'
      : 'phone_totp'
  );

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Login 2FA prompt (for accounts protected with Google Authenticator)
  const [loginTotpAccount, setLoginTotpAccount] = useState<RegisteredAccountEntry | null>(null);
  const [loginTotpDigits, setLoginTotpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [useBackupCodeLogin, setUseBackupCodeLogin] = useState(false);
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const loginTotpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Google Authenticator TOTP registration state
  const [phoneTotpNumber, setPhoneTotpNumber] = useState('');
  const [phoneTotpFullName, setPhoneTotpFullName] = useState('');
  const [phoneTotpPassword, setPhoneTotpPassword] = useState('');
  const [totpSetup, setTotpSetup] = useState<TotpSetupDetails | null>(null);
  const [totpStep, setTotpStep] = useState<'input' | 'scan_verify' | 'backup_codes'>('input');
  const [totpDigits, setTotpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [totpSecondsRemaining, setTotpSecondsRemaining] = useState<number>(30);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [totpRegisteredUser, setTotpRegisteredUser] = useState<UserProfile | null>(null);
  const totpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Phone OTP registration state (Telegram Bot OTP bám sát yêu cầu đề bài)
  const [telegramVerifyToken, setTelegramVerifyToken] = useState<string>('');
  const [telegramVerifyStatus, setTelegramVerifyStatus] = useState<string>('pending');
  const [telegramContactShared, setTelegramContactShared] = useState<boolean>(false);
  const [telegramBotUrl, setTelegramBotUrl] = useState<string>('');
  const [isInitiatingTelegram, setIsInitiatingTelegram] = useState<boolean>(false);
  const [smsNotice, setSmsNotice] = useState<string>('');
  const [telegramSession, setTelegramSession] = useState<TelegramOtpSession | null>(null);
  const [otpMethod, setOtpMethod] = useState<'telegram' | 'sms'>('telegram');
  const [copiedTelegramOtp, setCopiedTelegramOtp] = useState<boolean>(false);
  const [showTelegramConfigModal, setShowTelegramConfigModal] = useState<boolean>(false);
  const [phoneOtpNumber, setPhoneOtpNumber] = useState('');
  const [phoneOtpFullName, setPhoneOtpFullName] = useState('');
  const [otpSession, setOtpSession] = useState<PhoneOtpSessionResult | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState<number>(300);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState<boolean>(false);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Register form state
  const [regStep, setRegStep] = useState<'phone_input' | 'verify_otp' | 'totp_setup'>('phone_input');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Error & loading
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Seamless Google Sign-In Account Picker
  const [showGoogleQuickPicker, setShowGoogleQuickPicker] = useState(false);
  const [googleFallbackEmail, setGoogleFallbackEmail] = useState('truongminhquoctri@gmail.com');
  const [googleFallbackName, setGoogleFallbackName] = useState('Trương Minh Quốc Trí');
  const [googleDomainNotice, setGoogleDomainNotice] = useState('');
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'phone_otp') {
        setMode('register');
        setRegisterMethod('phone_otp');
        setRegStep('phone_input');
      } else if (initialMode === 'phone_totp') {
        setMode('register');
        setRegisterMethod('phone_totp');
        setRegStep('phone_input');
      } else if (initialMode === 'register') {
        setMode('register');
        setRegisterMethod('phone_otp');
        setRegStep('phone_input');
      } else {
        setMode('login');
        setRegisterMethod('phone_otp');
        setRegStep('phone_input');
      }
      setRegPhone('');
      setErrorMessage('');
      setForgotSuccess(false);
      setTelegramSession(null);
      setOtpMethod('telegram');
      setCopiedTelegramOtp(false);
      setOtpSession(null);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpCountdown(0);
      setShowGoogleQuickPicker(false);
      setGoogleDomainNotice('');
      setLoginTotpAccount(null);
      setLoginTotpDigits(['', '', '', '', '', '']);
      setUseBackupCodeLogin(false);
      setBackupCodeInput('');
      setTotpStep('input');
      setTotpSetup(null);
      setTotpDigits(['', '', '', '', '', '']);
      setCopiedSecret(false);
      setCopiedBackupCodes(false);
      setTotpRegisteredUser(null);
    } else {
      clearFirebaseRecaptchaVerifier();
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Polling trạng thái GET /api/verify/status?token=... mỗi 2 giây
  useEffect(() => {
    if (
      !isOpen ||
      regStep !== 'verify_otp' ||
      !telegramVerifyToken ||
      telegramVerifyStatus === 'verified' ||
      telegramVerifyStatus === 'cancelled'
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/verify/status?token=${encodeURIComponent(telegramVerifyToken)}`);
        const data = await res.json();
        if (data.ok) {
          setTelegramVerifyStatus(data.status);
          if (data.contactShared) {
            setTelegramContactShared(true);
          }
          if (data.status === 'expired') {
            setErrorMessage('Phiên xác thực đã hết hạn (sau 5 phút). Vui lòng nhấn "Gửi lại mã xác thực".');
          }
        }
      } catch (err) {
        // bỏ qua lỗi gián đoạn mạng tạm thời khi polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, regStep, telegramVerifyToken, telegramVerifyStatus]);

  // Live timer for Google Authenticator 30s token rotation
  useEffect(() => {
    if (totpStep !== 'scan_verify' && !loginTotpAccount) return;
    const updateTick = () => {
      setTotpSecondsRemaining(getTotpSecondsRemaining());
    };
    updateTick();
    const interval = setInterval(updateTick, 1000);
    return () => clearInterval(interval);
  }, [totpStep, loginTotpAccount]);

  if (!isOpen) return null;

  const matchedPhoneAccount = phoneOtpNumber.trim()
    ? findRegisteredAccount(normalizePhoneToLocal(phoneOtpNumber)) ||
      findRegisteredAccount(phoneOtpNumber.trim())
    : undefined;

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const profile = await signInWithGooglePopup();
      onLoginSuccess(profile, true);
      onClose();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
      setShowGoogleQuickPicker(true);

      if (msg.includes('unauthorized-domain')) {
        setGoogleDomainNotice(
          `Tên miền bản sao (${currentDomain}) chưa được thêm vào mục "Authorized domains" trong Firebase Console. Bạn có thể chọn nhanh tài khoản Google bên dưới để đăng nhập ngay, hoặc sao chép tên miền này thêm vào Firebase Auth.`
        );
      } else if (msg.includes('popup-blocked') || msg.includes('cancelled-popup-request')) {
        setGoogleDomainNotice(
          'Trình duyệt đang chặn cửa sổ bật lên (Popup). Vui lòng chọn hoặc xác nhận tài khoản Google ngay bên dưới để tiếp tục.'
        );
      } else if (msg.includes('popup-closed-by-user')) {
        setGoogleDomainNotice(
          'Cửa sổ đăng nhập Google đã đóng. Bạn có thể chọn nhanh tài khoản Google ngay bên dưới để tiếp tục.'
        );
      } else {
        setGoogleDomainNotice(
          'Chọn hoặc nhập tài khoản Google (Gmail) của bạn bên dưới để đăng nhập nhanh.'
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleConfirmGoogleQuickLogin = (emailToUse?: string, nameToUse?: string) => {
    setErrorMessage('');
    try {
      const targetEmail = (emailToUse ?? googleFallbackEmail).trim();
      const targetName = (nameToUse ?? googleFallbackName).trim();
      const profile = signInWithGoogleAccountFallback(targetEmail, targetName);
      onLoginSuccess(profile, true);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Vui lòng nhập email Google hợp lệ.'
      );
    }
  };

  const handleFacebookLogin = () => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsLoading(false);
      const randDigits = Math.floor(100000 + Math.random() * 900000);
      const fbUser: UserProfile = {
        id: 'fb_' + Date.now().toString(36),
        email: 'facebook.user@novashop.vn',
        fullName: 'Người dùng Facebook',
        phone: '0909' + randDigits,
        memberTier: 'Bronze',
        novaPoints: 1000,
        authProvider: 'google',
        joinedDate: new Date().toISOString(),
      };
      saveRegisteredAccount(fbUser, 'facebook_oauth_token');
      onLoginSuccess(fbUser, true);
      onClose();
    }, 450);
  };

  const handleInitiateTelegramSession = async (targetPhone?: string, openWindow: boolean = false): Promise<boolean> => {
    const rawPhone = targetPhone || regPhone || phoneOtpNumber;
    const cleanPhone = normalizePhoneToLocal(rawPhone);
    if (!cleanPhone) return false;

    setIsInitiatingTelegram(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/verify/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || 'Không thể tạo phiên xác thực Telegram.');
      }

      setTelegramVerifyToken(data.token);
      setTelegramVerifyStatus('pending');
      setTelegramContactShared(false);
      setTelegramBotUrl(data.botUrl || `https://t.me/MyNovaShopOtp_bot?start=${data.token}`);
      setOtpCountdown(300); // 5 phút = 300s
      setOtpDigits(['', '', '', '', '', '']);

      if (openWindow && data.botUrl) {
        window.open(data.botUrl, '_blank');
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ xác thực.';
      setErrorMessage(msg);
      return false;
    } finally {
      setIsInitiatingTelegram(false);
    }
  };

  const handleNextPhoneStep = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanPhone = normalizePhoneToLocal(regPhone);
    if (
      !cleanPhone ||
      cleanPhone.length < USER_VALIDATION_RULES.phoneMinLength ||
      cleanPhone.length > USER_VALIDATION_RULES.phoneMaxLength ||
      !USER_VALIDATION_RULES.phonePattern.test(cleanPhone)
    ) {
      setErrorMessage('Số điện thoại không hợp lệ. Vui lòng nhập từ 9 - 11 chữ số (VD: 0901234567).');
      return;
    }

    // Check if phone number is already registered
    const existing =
      findRegisteredAccount(cleanPhone) ||
      findRegisteredAccount(normalizePhoneToE164(cleanPhone));
    if (existing) {
      setErrorMessage(
        `Số điện thoại ${cleanPhone} đã được đăng ký tài khoản (${existing.user.fullName}). Vui lòng bấm "Đăng nhập" bên dưới.`
      );
      setLoginIdentifier(cleanPhone);
      return;
    }

    setPhoneOtpNumber(cleanPhone);
    setPhoneTotpNumber(cleanPhone);
    setIsLoading(true);
    try {
      const ok = await handleInitiateTelegramSession(cleanPhone, false);
      if (ok) {
        setOtpMethod('telegram');
        setRegStep('verify_otp');
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTelegramClick = async () => {
    if (isInitiatingTelegram) return;
    if (!telegramVerifyToken || telegramVerifyStatus === 'expired' || telegramVerifyStatus === 'failed') {
      await handleInitiateTelegramSession(undefined, true);
    } else {
      const targetUrl = telegramBotUrl || `https://t.me/MyNovaShopOtp_bot?start=${telegramVerifyToken}`;
      window.open(targetUrl, '_blank');
    }
  };

  const handleChangePhone = async () => {
    if (telegramVerifyToken) {
      try {
        await fetch('/api/verify/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: telegramVerifyToken }),
        });
      } catch (err) {
        console.warn('Cancel session error:', err);
      }
    }
    setTelegramVerifyToken('');
    setTelegramVerifyStatus('pending');
    setTelegramContactShared(false);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMessage('');
    setSmsNotice('');
    setRegStep('phone_input');
  };

  const handleSwitchToSmsOtp = () => {
    setSmsNotice('Tính năng demo: Hệ thống chưa tích hợp cổng SMS viễn thông. Vui lòng sử dụng xác thực qua Telegram Bot để nhận mã OTP miễn phí!');
  };

  const handleSwitchToTelegramOtp = async () => {
    setSmsNotice('');
    setOtpMethod('telegram');
    await handleInitiateTelegramSession(undefined, false);
  };

  const handleResendOtp = async () => {
    if (isInitiatingTelegram) return;
    await handleInitiateTelegramSession(undefined, false);
  };

  const handleAutofillTelegramOtp = () => {
    if (!telegramSession?.code) return;
    const chars = telegramSession.code.slice(0, 6).split('');
    setOtpDigits([
      chars[0] || '',
      chars[1] || '',
      chars[2] || '',
      chars[3] || '',
      chars[4] || '',
      chars[5] || '',
    ]);
    setErrorMessage('');
  };

  const handleCopyTelegramCode = async () => {
    if (!telegramSession?.code) return;
    try {
      await navigator.clipboard.writeText(telegramSession.code);
      setCopiedTelegramOtp(true);
      setTimeout(() => setCopiedTelegramOtp(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanPhone = normalizePhoneToLocal(phoneOtpNumber);
    if (
      !cleanPhone ||
      cleanPhone.length < USER_VALIDATION_RULES.phoneMinLength ||
      cleanPhone.length > USER_VALIDATION_RULES.phoneMaxLength ||
      !USER_VALIDATION_RULES.phonePattern.test(cleanPhone)
    ) {
      setErrorMessage('Vui lòng nhập số điện thoại hợp lệ (9 - 15 chữ số, ví dụ: 0901234567).');
      return;
    }

    setIsLoading(true);
    try {
      const session = await sendFirebasePhoneOtp(cleanPhone, RECAPTCHA_CONTAINER_ID);
      setOtpSession(session);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpCountdown(60);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 80);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi mã OTP lúc này.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Handle multi-character input or paste into a single box
    if (digitsOnly.length > 1) {
      const chars = digitsOnly.slice(0, 6).split('');
      const next = [...otpDigits];
      chars.forEach((ch, idx) => {
        if (index + idx < 6) {
          next[index + idx] = ch;
        }
      });
      setOtpDigits(next);
      const focusIdx = Math.min(5, index + chars.length);
      otpInputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = digitsOnly;
    setOtpDigits(next);
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      const next = ['', '', '', '', '', ''];
      pasted.split('').forEach((ch, i) => {
        next[i] = ch;
      });
      setOtpDigits(next);
      const focusIdx = Math.min(5, pasted.length - 1);
      otpInputRefs.current[focusIdx]?.focus();
    }
  };

  const handleAutofillSandboxOtp = () => {
    if (!otpSession?.sandboxOtpCode) return;
    const chars = otpSession.sandboxOtpCode.slice(0, 6).split('');
    setOtpDigits([
      chars[0] || '',
      chars[1] || '',
      chars[2] || '',
      chars[3] || '',
      chars[4] || '',
      chars[5] || '',
    ]);
    setErrorMessage('');
  };

  const handleVerifyPhoneOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSession) return;
    setErrorMessage('');

    const combinedOtp = otpDigits.join('');
    if (combinedOtp.length < 6) {
      setErrorMessage('Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.');
      return;
    }

    setIsLoading(true);
    try {
      const verifiedProfile = await verifyFirebasePhoneOtp({
        otpCode: combinedOtp,
        session: otpSession,
        fullNameInput: phoneOtpFullName.trim() || undefined,
      });
      onLoginSuccess(verifiedProfile);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xác thực OTP không thành công.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndCompleteRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const combinedOtp = otpDigits.join('').trim();
    if (combinedOtp.length < 6) {
      setErrorMessage('Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.');
      return;
    }

    const cleanPhone = normalizePhoneToLocal(regPhone || phoneOtpNumber);
    const resolvedName = regName.trim() || `Khách hàng ${cleanPhone.slice(-4)}`;
    const resolvedEmail = regEmail.trim() || `${cleanPhone}@novashop.vn`;
    const resolvedPassword = regPassword.trim() || 'novashop123';

    setIsLoading(true);
    try {
      if (otpMethod === 'telegram') {
        if (!telegramVerifyToken) {
          throw new Error('Chưa có phiên xác thực Telegram. Vui lòng bấm "Mở Telegram để nhận mã OTP ngay".');
        }
        const verifyRes = await fetch('/api/verify/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: telegramVerifyToken, code: combinedOtp }),
        });
        const verifyJson = await verifyRes.json();
        if (!verifyJson.ok) {
          throw new Error(verifyJson.error || 'Mã xác thực Telegram không chính xác.');
        }
        setTelegramVerifyStatus('verified');
      } else if (otpSession) {
        await verifyFirebasePhoneOtp({
          otpCode: combinedOtp,
          session: otpSession,
          fullNameInput: resolvedName,
        });
      }

      const generatedId = 'user-phone-' + Date.now();
      const sanitized = sanitizeUserProfileInput(
        {
          fullName: resolvedName,
          email: resolvedEmail,
          phone: cleanPhone,
          city: '',
          district: '',
          address: '',
          joinedDate: new Date().toLocaleDateString('vi-VN'),
        },
        generatedId,
        resolvedEmail
      );

      const newUser: UserProfile = {
        id: sanitized.uid,
        fullName: sanitized.fullName,
        email: sanitized.email,
        phone: sanitized.phone,
        memberTier: 'Bronze',
        novaPoints: 1000,
        city: sanitized.city,
        district: sanitized.district,
        address: sanitized.address,
        joinedDate: sanitized.joinedDate,
        authProvider: 'phone',
        phoneVerified: true,
        phoneVerifiedAt: new Date().toLocaleString('vi-VN'),
        twoFactorEnabled: true,
      };

      saveRegisteredAccount(newUser, resolvedPassword);
      onLoginSuccess(newUser, true);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xác thực OTP không thành công.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // GOOGLE AUTHENTICATOR (TOTP) HANDLERS
  // ==========================================
  const handleStartTotpSetup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanPhone = normalizePhoneToLocal(phoneTotpNumber);
    if (
      !cleanPhone ||
      cleanPhone.length < USER_VALIDATION_RULES.phoneMinLength ||
      cleanPhone.length > USER_VALIDATION_RULES.phoneMaxLength ||
      !USER_VALIDATION_RULES.phonePattern.test(cleanPhone)
    ) {
      setErrorMessage('Vui lòng nhập số điện thoại hợp lệ (9 - 15 chữ số, ví dụ: 0901234567).');
      return;
    }

    if (!phoneTotpFullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    setIsLoading(true);
    try {
      const setup = await generatePhoneTotpSetup(cleanPhone);
      setTotpSetup(setup);
      setTotpDigits(['', '', '', '', '', '']);
      setTotpStep('scan_verify');
      setTimeout(() => {
        totpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể khởi tạo mã Google Authenticator.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpDigitChange = (index: number, rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) {
      const next = [...totpDigits];
      next[index] = '';
      setTotpDigits(next);
      return;
    }

    if (digitsOnly.length > 1) {
      const chars = digitsOnly.slice(0, 6).split('');
      const next = [...totpDigits];
      chars.forEach((ch, idx) => {
        if (index + idx < 6) {
          next[index + idx] = ch;
        }
      });
      setTotpDigits(next);
      const focusIdx = Math.min(5, index + chars.length);
      totpInputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...totpDigits];
    next[index] = digitsOnly;
    setTotpDigits(next);
    if (index < 5) {
      totpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleTotpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !totpDigits[index] && index > 0) {
      totpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleTotpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      const next = ['', '', '', '', '', ''];
      pasted.split('').forEach((ch, i) => {
        next[i] = ch;
      });
      setTotpDigits(next);
      const focusIdx = Math.min(5, pasted.length - 1);
      totpInputRefs.current[focusIdx]?.focus();
    }
  };

  const handleCopySecret = async () => {
    if (!totpSetup?.secretBase32) return;
    try {
      await navigator.clipboard.writeText(totpSetup.secretBase32);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyBackupCodes = async () => {
    if (!totpSetup?.backupCodes) return;
    const text =
      `NOVASHOP - MÃ KHÔI PHỤC DỰ PHÒNG GOOGLE AUTHENTICATOR (SĐT: ${totpSetup.phone})\n` +
      totpSetup.backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\nNgày tạo: ${new Date().toLocaleString('vi-VN')}\nLưu ý: Mỗi mã dùng 1 lần để đăng nhập khi mất điện thoại.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleAutofillTotpSample = () => {
    if (!totpSetup) return;
    const currentCode = getTotpCurrentToken(totpSetup.secretBase32) || totpSetup.sampleCurrentToken;
    const chars = currentCode.slice(0, 6).split('');
    setTotpDigits([
      chars[0] || '',
      chars[1] || '',
      chars[2] || '',
      chars[3] || '',
      chars[4] || '',
      chars[5] || '',
    ]);
  };

  const handleVerifyAndCompleteTotp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    if (!totpSetup) return;

    const code = totpDigits.join('').trim();
    if (code.length !== 6) {
      setErrorMessage('Vui lòng nhập đầy đủ mã xác thực 6 chữ số từ ứng dụng Google Authenticator.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const res = verifyTotpCode(totpSetup.secretBase32, code, totpSetup.backupCodes);
      if (!res.success) {
        setErrorMessage(res.error || 'Mã OTP không chính xác hoặc đã xoay vòng. Vui lòng thử lại.');
        return;
      }

      try {
        const registered = registerPhoneUserWithTotp({
          phone: totpSetup.phone,
          fullName: phoneTotpFullName.trim(),
          totpSecret: totpSetup.secretBase32,
          backupCodes: totpSetup.backupCodes,
          password: phoneTotpPassword.trim(),
        });
        setTotpRegisteredUser(registered);
        setTotpStep('backup_codes');
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Không thể lưu tài khoản lúc này.');
      }
    }, 350);
  };

  const handleFinishTotpRegistration = () => {
    if (!totpRegisteredUser) return;
    onLoginSuccess(totpRegisteredUser, true);
    onClose();
  };

  // Login 2FA TOTP handlers
  const handleLoginTotpDigitChange = (index: number, rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) {
      const next = [...loginTotpDigits];
      next[index] = '';
      setLoginTotpDigits(next);
      return;
    }

    if (digitsOnly.length > 1) {
      const chars = digitsOnly.slice(0, 6).split('');
      const next = [...loginTotpDigits];
      chars.forEach((ch, idx) => {
        if (index + idx < 6) {
          next[index + idx] = ch;
        }
      });
      setLoginTotpDigits(next);
      const focusIdx = Math.min(5, index + chars.length);
      loginTotpInputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...loginTotpDigits];
    next[index] = digitsOnly;
    setLoginTotpDigits(next);
    if (index < 5) {
      loginTotpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleLoginTotpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !loginTotpDigits[index] && index > 0) {
      loginTotpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleLoginTotpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      const next = ['', '', '', '', '', ''];
      pasted.split('').forEach((ch, i) => {
        next[i] = ch;
      });
      setLoginTotpDigits(next);
      const focusIdx = Math.min(5, pasted.length - 1);
      loginTotpInputRefs.current[focusIdx]?.focus();
    }
  };

  const handleAutofillLoginTotp = () => {
    if (!loginTotpAccount?.totpSecret) return;
    const currentCode = getTotpCurrentToken(loginTotpAccount.totpSecret);
    const chars = currentCode.slice(0, 6).split('');
    setLoginTotpDigits([
      chars[0] || '',
      chars[1] || '',
      chars[2] || '',
      chars[3] || '',
      chars[4] || '',
      chars[5] || '',
    ]);
  };

  const handleVerifyLoginTotp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    if (!loginTotpAccount || !loginTotpAccount.totpSecret) return;

    const tokenOrBackup = useBackupCodeLogin
      ? backupCodeInput.trim()
      : loginTotpDigits.join('').trim();

    if (!tokenOrBackup) {
      setErrorMessage(
        useBackupCodeLogin
          ? 'Vui lòng nhập mã khôi phục dự phòng 8 ký tự.'
          : 'Vui lòng nhập đủ 6 chữ số từ ứng dụng Google Authenticator.'
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const res = verifyTotpCode(
        loginTotpAccount.totpSecret!,
        tokenOrBackup,
        loginTotpAccount.backupCodes || []
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Mã xác thực không hợp lệ. Vui lòng thử lại.');
        return;
      }

      // If a backup code was consumed, update the remaining backup codes list
      if (res.isBackupCode && res.consumedBackupCode && loginTotpAccount.backupCodes) {
        const remaining = loginTotpAccount.backupCodes.filter(
          (c) => c.toUpperCase() !== res.consumedBackupCode!.toUpperCase()
        );
        saveRegisteredAccount(loginTotpAccount.user, loginTotpAccount.password, {
          totpSecret: loginTotpAccount.totpSecret,
          totpEnabled: true,
          backupCodes: remaining,
        });
      }

      onLoginSuccess(loginTotpAccount.user, false);
      onClose();
    }, 350);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedId = loginIdentifier.trim();
    if (!trimmedId) {
      setErrorMessage('Vui lòng nhập Email hoặc Số điện thoại đăng nhập');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    const isEmail = trimmedId.includes('@');
    if (isEmail && !USER_VALIDATION_RULES.emailPattern.test(trimmedId)) {
      setErrorMessage('Định dạng Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const cleanPhone = normalizePhoneToLocal(trimmedId);
      const existingAccount =
        findRegisteredAccount(trimmedId) ||
        (cleanPhone ? findRegisteredAccount(cleanPhone) : undefined);

      if (existingAccount) {
        if (existingAccount.password && existingAccount.password !== loginPassword) {
          setErrorMessage('Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
          return;
        }

        // If the account has Google Authenticator TOTP enabled, prompt for 2FA
        if (existingAccount.totpEnabled && existingAccount.totpSecret) {
          setLoginTotpAccount(existingAccount);
          setLoginTotpDigits(['', '', '', '', '', '']);
          setUseBackupCodeLogin(false);
          setBackupCodeInput('');
          setTimeout(() => {
            loginTotpInputRefs.current[0]?.focus();
          }, 100);
          return;
        }

        const restoredUser: UserProfile = {
          ...existingAccount.user,
          authProvider: existingAccount.user.authProvider || 'password',
        };
        onLoginSuccess(restoredUser, false);
        onClose();
        return;
      }

      const generatedId = 'user-' + Date.now();
      const sanitized = sanitizeUserProfileInput(
        {
          fullName: isEmail ? trimmedId.split('@')[0] : 'Khách hàng',
          email: isEmail ? trimmedId : `${trimmedId}@novashop.vn`,
          phone: !isEmail ? trimmedId : '',
          city: '',
          district: '',
          address: '',
          joinedDate: new Date().toLocaleDateString('vi-VN'),
        },
        generatedId,
        'member@novashop.vn'
      );

      const loggedUser: UserProfile = {
        id: sanitized.uid,
        fullName: sanitized.fullName,
        email: sanitized.email,
        phone: sanitized.phone,
        memberTier: 'Bronze',
        novaPoints: 1000,
        city: sanitized.city,
        district: sanitized.district,
        address: sanitized.address,
        joinedDate: sanitized.joinedDate,
        authProvider: 'password',
      };

      saveRegisteredAccount(loggedUser, loginPassword);
      onLoginSuccess(loggedUser, true);
      onClose();
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();
    const cleanPhone = regPhone.trim();

    if (!cleanName || cleanName.length > USER_VALIDATION_RULES.fullNameMaxLength) {
      setErrorMessage(
        `Vui lòng nhập họ và tên (tối đa ${USER_VALIDATION_RULES.fullNameMaxLength} ký tự)`
      );
      return;
    }
    if (
      !cleanEmail ||
      cleanEmail.length > USER_VALIDATION_RULES.emailMaxLength ||
      !USER_VALIDATION_RULES.emailPattern.test(cleanEmail)
    ) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    if (
      !cleanPhone ||
      cleanPhone.length < USER_VALIDATION_RULES.phoneMinLength ||
      cleanPhone.length > USER_VALIDATION_RULES.phoneMaxLength ||
      !USER_VALIDATION_RULES.phonePattern.test(cleanPhone)
    ) {
      setErrorMessage('Vui lòng nhập số điện thoại hợp lệ (9 - 15 chữ số)');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Mật khẩu cần tối thiểu 6 ký tự');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với điều khoản dịch vụ');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const generatedId = 'user-' + Date.now();
      const sanitized = sanitizeUserProfileInput(
        {
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          city: '',
          district: '',
          address: '',
          joinedDate: new Date().toLocaleDateString('vi-VN'),
        },
        generatedId,
        cleanEmail
      );

      const newUser: UserProfile = {
        id: sanitized.uid,
        fullName: sanitized.fullName,
        email: sanitized.email,
        phone: sanitized.phone,
        memberTier: 'Bronze',
        novaPoints: 1000,
        city: sanitized.city,
        district: sanitized.district,
        address: sanitized.address,
        joinedDate: sanitized.joinedDate,
        authProvider: 'password',
      };

      saveRegisteredAccount(newUser, regPassword);
      onLoginSuccess(newUser, true);
      onClose();
    }, 500);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage('Vui lòng nhập email hoặc số điện thoại để khôi phục');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setForgotSuccess(true);
      setErrorMessage('');
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-modal"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Invisible reCAPTCHA target for Firebase Phone Authentication */}
        <div id={RECAPTCHA_CONTAINER_ID} />

        {/* Clean minimal header matching image.png */}
        <div className="px-6 pt-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {mode === 'register'
              ? regStep === 'verify_otp'
                ? 'Xác thực OTP'
                : 'Đăng ký'
              : mode === 'login'
              ? 'Đăng nhập'
              : 'Quên mật khẩu'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pending Purchase Context Banner */}
        {pendingPurchase && mode !== 'forgot' && (
          <div className="mx-6 mt-4 p-2.5 sm:p-3 rounded-xl bg-blue-50/90 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 flex items-center gap-3">
            {pendingPurchase.product ? (
              <>
                <img
                  src={
                    pendingPurchase.product.image ||
                    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'
                  }
                  alt={pendingPurchase.product.name}
                  className="w-12 h-12 rounded-lg object-contain bg-white p-1 border border-slate-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 shrink-0" />
                    <span>
                      {pendingPurchase.type === 'open_installment'
                        ? 'Đang chờ đăng ký trả góp 0%'
                        : 'Sản phẩm đang chọn mua'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {pendingPurchase.product.name}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    <span className="font-extrabold text-blue-700 dark:text-blue-400 tabular-nums">
                      {formatVND(pendingPurchase.product.price * (pendingPurchase.quantity || 1))}
                    </span>
                    {pendingPurchase.quantity && pendingPurchase.quantity > 1 && (
                      <span>· SL: {pendingPurchase.quantity}</span>
                    )}
                    {pendingPurchase.color && <span>· Màu: {pendingPurchase.color}</span>}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Tiếp tục thanh toán giỏ hàng ({pendingPurchase.cartCount || 1} sản phẩm)
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Sau khi đăng nhập, hệ thống sẽ chuyển ngay đến bước xác nhận giao hàng & thanh toán.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* LOGIN FORM (STANDARD OR GOOGLE AUTHENTICATOR 2FA) */}
          {mode === 'login' && loginTotpAccount ? (
            /* GOOGLE AUTHENTICATOR 2FA VERIFICATION CARD FOR LOGIN */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setLoginTotpAccount(null);
                    setErrorMessage('');
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại đăng nhập</span>
                </button>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Google Authenticator 2FA</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-slate-800 border border-blue-200/80 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Xác thực bảo mật 2 lớp qua Google Authenticator
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Tài khoản <strong>{loginTotpAccount.user.phone || loginTotpAccount.user.email}</strong> ({loginTotpAccount.user.fullName}) đã được bảo vệ bằng mã TOTP. Vui lòng mở ứng dụng Google Authenticator trên điện thoại để lấy mã xác thực.
                </p>
              </div>

              {!useBackupCodeLogin ? (
                <form onSubmit={handleVerifyLoginTotp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                        Nhập mã xác thực 6 chữ số
                      </label>
                      <span className="text-[11px] font-mono text-blue-700 dark:text-blue-300 flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3" />
                        <span>Mã đổi sau {totpSecondsRemaining}s</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto">
                      {loginTotpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            loginTotpInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleLoginTotpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleLoginTotpKeyDown(idx, e)}
                          onPaste={handleLoginTotpPaste}
                          aria-label={`Chữ số thứ ${idx + 1}`}
                          className="w-full aspect-square text-center text-lg font-bold font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all tabular-nums shadow-xs"
                          autoComplete="off"
                        />
                      ))}
                    </div>

                    {/* Quick test assistant helper */}
                    <div className="text-center mt-2.5">
                      <button
                        type="button"
                        onClick={handleAutofillLoginTotp}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Kiểm thử nhanh: Điền mã TOTP hợp lệ hiện tại</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || loginTotpDigits.join('').length < 6}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xác nhận & Đăng nhập</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUseBackupCodeLogin(true);
                        setErrorMessage('');
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                    >
                      Không mang theo điện thoại? Dùng mã khôi phục dự phòng
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyLoginTotp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                      Nhập mã khôi phục dự phòng (8 ký tự)
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={backupCodeInput}
                        onChange={(e) => setBackupCodeInput(e.target.value.toUpperCase())}
                        placeholder="VD: 8392-4109"
                        className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-mono tracking-wider text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Mã này được cấp khi cấu hình Google Authenticator. Mỗi mã chỉ dùng được một lần.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !backupCodeInput.trim()}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xác nhận mã dự phòng & Đăng nhập</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUseBackupCodeLogin(false);
                        setErrorMessage('');
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                    >
                      ← Quay lại nhập mã từ Google Authenticator
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : mode === 'login' ? (
            /* STANDARD LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <input
                  id="login-email-input"
                  type="text"
                  value={loginIdentifier}
                  maxLength={USER_VALIDATION_RULES.emailMaxLength}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Email / Số điện thoại / Tên đăng nhập"
                  className="w-full px-3.5 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  required
                />
              </div>

              <div className="relative">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  className="w-full px-3.5 py-3 pr-10 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Ẩn hiện mật khẩu"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>ĐĂNG NHẬP</span>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMessage('');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setRegStep('phone_input');
                    setErrorMessage('');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Đăng nhập với SMS
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 select-none">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-xl accent-blue-600 cursor-pointer"
                  />
                  <span className="font-medium">Duy trì đăng nhập</span>
                </label>
              </div>

              <div className="flex items-center my-3">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="px-3 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                  HOẶC
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.28-2.09 3.66-5.17 3.66-9.14z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.39 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.25C.45 8.19 0 9.99 0 12s.45 3.81 1.25 5.41l4.03-3.13z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.25 6.59l4.03 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>

              <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Bạn mới biết đến NovaShop? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setRegStep('phone_input');
                    setErrorMessage('');
                  }}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Đăng ký
                </button>
              </div>
            </form>
          ) : null}

          {/* REGISTER FLOW (MATCHING SHOPEE-STYLE PHONE REGISTRATION) */}
          {mode === "register" && (
            <div className="space-y-4">
              {regStep === "phone_input" ? (
                /* STEP 1: PHONE NUMBER INPUT (EXACTLY AS IN USER"S IMAGE) */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleNextPhoneStep();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <input
                      id="reg-phone-input"
                      type="tel"
                      value={regPhone}
                      maxLength={15}
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="Số điện thoại"
                      className="w-full px-3.5 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors tabular-nums"
                      autoFocus
                    />
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      <svg className="w-3.5 h-3.5 text-[#229ED9] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                      </svg>
                      <span>Mã xác thực OTP gửi tự động qua Telegram Bot của hệ thống</span>
                    </div>
                  </div>

                  <button
                    id="reg-next-btn"
                    type="submit"
                    disabled={isLoading || !regPhone.trim()}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>TIẾP THEO</span>
                    )}
                  </button>

                  {/* Duy trì đăng nhập with (?) tooltip */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 select-none">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-xl accent-blue-600 cursor-pointer"
                      />
                      <span className="font-medium">Duy trì đăng nhập</span>
                    </label>
                    <div className="relative group inline-block">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" />
                      <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-50 w-52 p-2 bg-slate-900 text-white text-[11px] rounded shadow-lg text-center leading-tight pointer-events-none">
                        Giữ đăng nhập an toàn trên thiết bị này để bạn không cần đăng nhập lại mỗi lần mua sắm.
                      </div>
                    </div>
                  </div>

                  {/* Divider HOẶC */}
                  <div className="flex items-center my-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="px-3 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                      HOẶC
                    </span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>

                  {/* Social login buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleFacebookLogin}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Facebook</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isGoogleLoading || isLoading}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.28-2.09 3.66-5.17 3.66-9.14z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.39 7.35 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.25C.45 8.19 0 9.99 0 12s.45 3.81 1.25 5.41l4.03-3.13z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.25 6.59l4.03 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                        />
                      </svg>
                      <span>Google</span>
                    </button>
                  </div>

                  {/* Terms of Service notice */}
                  <div className="text-center text-[11px] text-slate-500 dark:text-slate-400 leading-normal px-2 pt-1">
                    Bằng việc đăng ký, bạn đã đồng ý với NovaShop về{" "}
                    <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      Điều khoản dịch vụ
                    </span>{" "}
                    &{" "}
                    <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      Chính sách bảo mật
                    </span>
                  </div>

                  {/* Already have an account? Login */}
                  <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Bạn đã có tài khoản? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setErrorMessage("");
                      }}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Đăng nhập
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 2: VERIFY OTP CODE SENT VIA TELEGRAM OR SMS */
                <form onSubmit={handleVerifyOtpAndCompleteRegister} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleChangePhone}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Đổi số điện thoại</span>
                    </button>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {regPhone || phoneOtpNumber}
                    </span>
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                      <svg className="w-5 h-5 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                      </svg>
                      <span>Xác thực OTP qua Telegram</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Mã xác thực gồm 6 chữ số sẽ được gửi qua bot Telegram{' '}
                      <strong className="text-blue-600 dark:text-blue-400">
                        @MyNovaShopOtp_bot
                      </strong>{' '}
                      đến số điện thoại{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {regPhone || phoneOtpNumber}
                      </strong>
                    </p>
                  </div>

                  {/* TELEGRAM BOT ACTION CARD */}
                  <div className="space-y-2.5">
                    {/* One-click open Telegram */}
                    <a
                      href={telegramBotUrl || `https://t.me/MyNovaShopOtp_bot?start=${telegramVerifyToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (isInitiatingTelegram) {
                          e.preventDefault();
                          return;
                        }
                        if (!telegramVerifyToken || telegramVerifyStatus === 'expired' || telegramVerifyStatus === 'failed') {
                          e.preventDefault();
                          handleInitiateTelegramSession(undefined, true);
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-[#229ED9] hover:bg-[#1b8ec5] active:bg-[#177db0] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer select-none"
                    >
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                      </svg>
                      <span>
                        {isInitiatingTelegram ? 'Đang tạo liên kết...' : 'Mở Telegram để nhận mã OTP ngay'}
                      </span>
                    </a>

                    {/* Bot account indicator */}
                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-500 dark:text-slate-400">
                      <span>Bot xác thực:</span>
                      <span className="text-[10px] text-blue-500 font-mono font-bold">
                        @MyNovaShopOtp_bot (@NovaShopVerifyBot)
                      </span>
                    </div>

                    {/* Trạng thái sau khi chia sẻ số điện thoại (từ polling 2s) */}
                    {telegramContactShared && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Đã chia sẻ số, vui lòng nhập mã OTP trong Telegram</span>
                      </div>
                    )}

                    {/* Live Telegram Message Preview MASKED (KHÔNG lộ mã thật) */}
                    <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/80 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Tin nhắn từ @NovaShopVerifyBot</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Minh họa</span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-xs">
                        <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          NovaShop Verification Service
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-slate-600 dark:text-slate-400 text-[11px]">Mã OTP:</span>
                          <span className="text-base font-black text-slate-400 dark:text-slate-500 tracking-widest font-mono">
                            ••• •••
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          Bấm nút trên, nhấn START và chia sẻ số điện thoại để bot gửi mã cho bạn
                        </div>
                      </div>
                    </div>

                    {/* Thông báo SMS demo */}
                    {smsNotice && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-center">
                        {smsNotice}
                      </div>
                    )}

                    {/* Fallback to SMS Demo Link */}
                    <div className="text-center pt-0.5">
                      <button
                        type="button"
                        onClick={handleSwitchToSmsOtp}
                        className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Chưa mở Telegram?</span>
                        <span className="font-semibold underline">Gửi mã qua SMS</span>
                      </button>
                    </div>
                  </div>

                  {/* 6-digit OTP Input */}
                  <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto py-1">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-full aspect-square text-center text-lg font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors tabular-nums"
                      />
                    ))}
                  </div>

                  {/* Resend Countdown (5 phút hết hạn) */}
                  <div className="text-center text-xs">
                    {otpCountdown > 0 ? (
                      <span className="text-slate-400">
                        Hiệu lực mã còn:{' '}
                        <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isInitiatingTelegram}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                      >
                        Gửi lại mã xác thực
                      </button>
                    )}
                  </div>

                  {/* User Full Name & Password (Optional) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <input
                        type="text"
                        value={regName}
                        maxLength={50}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Họ và tên của bạn (VD: Nguyễn Văn A)"
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Thiết lập mật khẩu (tùy chọn)"
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.join("").length < 6}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>XÁC NHẬN & ĐĂNG KÝ</span>
                    )}
                  </button>

                  <div className="text-center pt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>Bạn đã có tài khoản? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setErrorMessage("");
                      }}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Đăng nhập
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Inline Google Quick Account Chooser when popup/domain is restricted in Remix preview */}

              {/* Inline Google Quick Account Chooser when popup/domain is restricted in Remix preview */}
              {showGoogleQuickPicker && (
                <div className="p-3.5 rounded-xl bg-blue-50/90 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 space-y-3 text-xs animate-in fade-in duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Chọn nhanh tài khoản Google</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGoogleQuickPicker(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {googleDomainNotice && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-lg border border-blue-100 dark:border-slate-700 space-y-1.5">
                      <p>{googleDomainNotice}</p>
                      {typeof window !== 'undefined' && window.location.hostname && (
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <code className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-800 px-2 py-0.5 rounded truncate">
                            {window.location.hostname}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.hostname);
                              setCopiedDomain(true);
                              setTimeout(() => setCopiedDomain(false), 2000);
                            }}
                            className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shrink-0 cursor-pointer"
                          >
                            {copiedDomain ? 'Đã chép domain!' : 'Chép domain'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 1-Click Suggested / Saved Google Account */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Bấm để đăng nhập ngay (1 chạm):
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleConfirmGoogleQuickLogin(
                          'truongminhquoctri@gmail.com',
                          'Trương Minh Quốc Trí'
                        )
                      }
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 hover:border-blue-400 flex items-center justify-between gap-2 transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                          T
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            Trương Minh Quốc Trí
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            truongminhquoctri@gmail.com
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] shrink-0">
                        Tiếp tục
                      </span>
                    </button>
                  </div>

                  {/* Or enter any Gmail address */}
                  <div className="pt-1 border-t border-blue-200/60 dark:border-slate-700 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                      Hoặc sử dụng tài khoản Google khác:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={googleFallbackEmail}
                        onChange={(e) => setGoogleFallbackEmail(e.target.value)}
                        placeholder="email@gmail.com"
                        className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={googleFallbackName}
                        onChange={(e) => setGoogleFallbackName(e.target.value)}
                        placeholder="Tên hiển thị"
                        className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConfirmGoogleQuickLogin()}
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Xác nhận đăng nhập bằng Google ({googleFallbackEmail || 'Gmail'})
                    </button>
                  </div>
                </div>
              )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <div>
              {forgotSuccess ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Đã gửi yêu cầu khôi phục
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Vui lòng kiểm tra hộp thư hoặc tin nhắn gửi đến <strong>{forgotEmail}</strong> để đặt lại mật khẩu mới.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setForgotSuccess(false);
                    }}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Quay lại Đăng nhập
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                      Email hoặc Số điện thoại đã đăng ký
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={forgotEmail}
                        maxLength={USER_VALIDATION_RULES.emailMaxLength}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Nhập email hoặc số điện thoại"
                        className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Gửi yêu cầu đặt lại mật khẩu</span>
                    )}
                  </button>
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Quay lại Đăng nhập
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Telegram Bot Setup & Configuration Modal */}
      <TelegramBotConfigModal
        isOpen={showTelegramConfigModal}
        onClose={() => setShowTelegramConfigModal(false)}
        onSaved={(cfg) => {
          if (telegramSession) {
            setTelegramSession({
              ...telegramSession,
              botUsername: cfg.botUsername,
              deeplinkUrl: `https://t.me/${cfg.botUsername}?start=otp_${telegramSession.id}`,
            });
          }
        }}
      />
    </div>
  );
};
