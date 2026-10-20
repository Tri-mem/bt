import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  X,
  Copy,
  Check,
  Tag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Mail,
  User,
  Clock,
  Gift,
  Send,
  Loader2,
  Code2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UserProfile, Voucher } from '../types';
import { VOUCHERS } from '../data/mockData';
import { sendWelcomeEmailViaGas } from '../utils/welcomeEmail';
import {
  GAS_ORDER_EMAIL_SCRIPT_CODE,
  getConfiguredGasEmailUrl,
  setConfiguredGasEmailUrl,
} from '../utils/electronicInvoice';

interface WelcomeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onApplyVoucher?: (voucher: Voucher) => void;
  onExploreProducts?: () => void;
  onToast?: (type: 'success' | 'info' | 'error' | 'warning', title: string, description?: string) => void;
}

export const WelcomeNoticeModal: React.FC<WelcomeNoticeModalProps> = ({
  isOpen,
  onClose,
  user,
  onApplyVoucher,
  onExploreProducts,
  onToast,
}) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isApplied, setIsApplied] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'needs_script' | 'error'>('idle');
  const [emailStatusMsg, setEmailStatusMsg] = useState<string>('');
  const [showGasHelper, setShowGasHelper] = useState<boolean>(false);
  const [customGasUrl, setCustomGasUrl] = useState<string>('');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const welcomeVoucher: Voucher = VOUCHERS.find((v) => v.code === 'WELCOME10') || {
    code: 'WELCOME10',
    discountType: 'percent',
    discountValue: 10,
    minOrderValue: 0,
    description: 'Giảm 10% cho đơn hàng đầu tiên (Quà chào mừng thành viên mới NovaShop)',
  };

  const recipientName = user?.fullName || 'Khách hàng';
  const recipientEmail = (user?.email || 'customer@novashop.vn').trim();
  const activationTime = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Lock background page scroll while notice is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setCustomGasUrl(getConfiguredGasEmailUrl());
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Automatically trigger email send once when modal opens for a valid email
  useEffect(() => {
    if (!isOpen || !recipientEmail || !recipientEmail.includes('@') || emailStatus !== 'idle') {
      return;
    }

    const sessionKey = `novashop_auto_email_sent_${recipientEmail}`;
    if (sessionStorage.getItem(sessionKey)) {
      setEmailStatus('sent');
      setEmailStatusMsg(`Đã phát lệnh gửi đến ${recipientEmail}`);
      return;
    }

    handleSendEmail(false);
    sessionStorage.setItem(sessionKey, 'true');
  }, [isOpen, recipientEmail]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(welcomeVoucher.code);
      setCopiedCode(true);
      onToast?.('success', `Đã sao chép mã ${welcomeVoucher.code}!`, 'Mã giảm giá 10% đã sẵn sàng để dán tại giỏ hàng.');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleApply = () => {
    if (onApplyVoucher) {
      onApplyVoucher(welcomeVoucher);
      setIsApplied(true);
      onToast?.(
        'success',
        `Đã áp dụng mã ${welcomeVoucher.code}!`,
        'Giảm 10% đã được ghi nhận tự động vào giỏ hàng của bạn.'
      );
    }
  };

  const handleSendEmail = async (notifyUser = true) => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setEmailStatus('error');
      setEmailStatusMsg('Địa chỉ email không hợp lệ');
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus('sending');
    setEmailStatusMsg(`Đang kết nối cổng gửi mail miễn phí tới ${recipientEmail}...`);

    try {
      const res = await sendWelcomeEmailViaGas(recipientEmail, recipientName, welcomeVoucher.code);
      setIsSendingEmail(false);
      if (res.ok && res.emailSent) {
        setEmailStatus('sent');
        setEmailStatusMsg(`Đã phát hành email tới ${recipientEmail}!`);
        if (notifyUser) {
          onToast?.(
            'success',
            'Đã gửi email chào mừng thành công!',
            `Vui lòng kiểm tra hộp thư đến (hoặc mục Spam/Quảng cáo) của ${recipientEmail}.`
          );
        }
      } else if (res.permissionDenied) {
        setEmailStatus('needs_script');
        setEmailStatusMsg('Google Apps Script bị chặn quyền (403 Forbidden). Cần chuyển "Who has access" sang "Anyone".');
        if (notifyUser) {
          onToast?.(
            'warning',
            'Cần mở quyền Google Apps Script (Lỗi 403)',
            'Hãy vào script.google.com -> Quản lý bản triển khai -> Sửa -> Chọn "Ai có quyền truy cập" là "Bất kỳ ai" (Anyone).'
          );
        }
      } else if (res.ok && res.needsScriptUpdate) {
        setEmailStatus('needs_script');
        setEmailStatusMsg('Đã kết nối Apps Script. Nhấp "Mã Script" để dán vào Google Apps Script.');
        if (notifyUser) {
          onToast?.(
            'info',
            'Đã kết nối Google Apps Script!',
            'Để email chuyển vào hộp thư Gmail, vui lòng bấm vào nút Mã Script bên dưới để dán vào script.google.com.'
          );
        }
      } else {
        setEmailStatus('error');
        setEmailStatusMsg(res.message || 'Chưa nhận được phản hồi từ cổng gửi mail.');
        if (notifyUser) {
          onToast?.(
            'warning',
            'Thông báo gửi email',
            res.message || 'Vui lòng kiểm tra cấu hình Google Apps Script hoặc thử lại.'
          );
        }
      }
    } catch (err: any) {
      setIsSendingEmail(false);
      setEmailStatus('error');
      setEmailStatusMsg('Lỗi gửi mail: ' + (err?.message || 'Không thể kết nối'));
    }
  };

  const handleSaveGasUrl = () => {
    if (customGasUrl.trim()) {
      setConfiguredGasEmailUrl(customGasUrl.trim());
      onToast?.('success', 'Đã lưu cấu hình Google Apps Script mới!', 'Hệ thống sẽ sử dụng URL này để gửi email miễn phí.');
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(GAS_ORDER_EMAIL_SCRIPT_CODE);
      setCopiedScript(true);
      onToast?.('success', 'Đã sao chép mã Apps Script!', 'Bạn chỉ cần mở script.google.com và dán vào hàm doPost/doGet.');
      setTimeout(() => setCopiedScript(false), 3000);
    } catch {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 3000);
    }
  };

  const handleActionClick = () => {
    onClose();
    if (onExploreProducts) {
      onExploreProducts();
    } else {
      const target = document.getElementById('products-grid-section') || document.getElementById('product-showcase');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div
      id="welcome-notice-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Compact single-frame container (no page scrolling needed - 1 khung hoàn chỉnh) */}
      <div
        id="welcome-bank-style-receipt-modal"
        className="relative w-full max-w-md bg-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[96vh]"
      >
        {/* Top Header Bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              XÁC THỰC THÀNH VIÊN NOVASHOP
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowGasHelper(!showGasHelper)}
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Hướng dẫn gửi mail miễn phí với Google Apps Script"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              id="close-welcome-notice-btn"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body - Fixed frame without page scrolling */}
        <div className="p-3.5 sm:p-4 space-y-2.5 overflow-hidden flex-1 flex flex-col justify-between">
          {/* Success Banner (Like Bank Transaction Receipt) */}
          <div className="flex items-center gap-3 pb-2.5 border-b border-slate-800 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  THÔNG BÁO TÀI KHOẢN MỚI
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  MIỄN PHÍ
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white truncate">
                Chào mừng bạn đến với NovaShop!
              </h3>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800 space-y-1.5 text-xs shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <User className="w-3 h-3 text-slate-500" /> Thành viên:
              </span>
              <span className="font-bold text-slate-200 truncate max-w-[190px]">
                {recipientName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Mail className="w-3 h-3 text-slate-500" /> Hòm thư Gmail:
              </span>
              <span className="font-mono font-semibold text-indigo-300 truncate max-w-[210px]">
                {recipientEmail}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-slate-500" /> Thời gian:
              </span>
              <span className="font-mono text-[10px] text-slate-300">
                {activationTime}
              </span>
            </div>
          </div>

          {/* Email Dispatch Real-Time Status & Resend Action */}
          <div className="bg-slate-950/80 rounded-xl p-2.5 border border-indigo-500/30 flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                {emailStatus === 'sending' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                    <span className="text-indigo-300 truncate">Đang gửi thư chào mừng...</span>
                  </>
                ) : emailStatus === 'sent' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 truncate">Đã phát lệnh gửi đến Gmail</span>
                  </>
                ) : emailStatus === 'needs_script' ? (
                  <>
                    <Code2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-amber-300 truncate">Apps Script cần thêm hàm MailApp</span>
                  </>
                ) : emailStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-rose-300 truncate">Chưa nhận được phản hồi</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-300 truncate">Gửi thư chào mừng & Voucher</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {emailStatusMsg || `Hệ thống gửi tự động qua Google Apps Script tới ${recipientEmail}`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSendEmail(true)}
              disabled={isSendingEmail}
              id="resend-welcome-email-btn"
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm shadow-indigo-600/30"
              title="Gửi lại thư chào mừng vào Gmail"
            >
              {isSendingEmail ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span>Gửi lại</span>
            </button>
          </div>

          {/* Exclusive Voucher Block (Like Bank Promo Voucher) */}
          <div className="rounded-xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-indigo-500/40 p-2.5 sm:p-3 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">
                  Quà tặng chào mừng thành viên
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                GIẢM 10%
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-950/90 rounded-lg p-2 border border-indigo-400/30">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-black text-sm sm:text-base text-indigo-300 tracking-wider">
                  {welcomeVoucher.code}
                </span>
                <span className="text-[10px] text-slate-400 hidden xs:inline">
                  (Đơn hàng đầu tiên)
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Sao chép mã"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>

                {onApplyVoucher && (
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplied}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isApplied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{isApplied ? 'Đã áp dụng' : 'Dùng ngay'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4 Commitments (Compact 1-line badges) */}
          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 shrink-0">
            <div className="flex items-center gap-1 bg-slate-950/40 px-2 py-1 rounded-lg border border-slate-800">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">100% Chính Hãng VAT</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950/40 px-2 py-1 rounded-lg border border-slate-800">
              <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="truncate">Đổi mới 30 ngày</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950/40 px-2 py-1 rounded-lg border border-slate-800">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">Giao siêu tốc 2H</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950/40 px-2 py-1 rounded-lg border border-slate-800">
              <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="truncate">Hỗ trợ CSKH 24/7</span>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="pt-0.5 shrink-0">
            <button
              type="button"
              id="welcome-start-shopping-btn"
              onClick={handleActionClick}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Bắt Đầu Mua Sắm Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer info note with GAS Helper Dropdown */}
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
          <span>Tổng đài miễn cước: 0908 061 843</span>
          <button
            type="button"
            onClick={() => setShowGasHelper(!showGasHelper)}
            className="font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Google Apps Script Miễn phí</span>
            <HelpCircle className="w-3 h-3" />
          </button>
        </div>

        {/* Collapsible Google Apps Script Integration Drawer */}
        {showGasHelper && (
          <div className="absolute inset-x-0 bottom-0 top-10 bg-slate-950/95 backdrop-blur-md p-4 flex flex-col justify-between border-t border-indigo-500/30 z-20 animate-in slide-in-from-bottom duration-200">
            <div className="space-y-3 overflow-y-auto max-h-[75%] pr-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white">
                    Tích hợp gửi mail miễn phí với Google Apps Script
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGasHelper(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1.5">
                <p>
                  Hệ thống sử dụng cùng phương thức <strong>Google Apps Script (MailApp.sendEmail)</strong> như khi gửi email xác nhận chuyển khoản ngân hàng:
                </p>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px] space-y-1">
                  <div>1. Mở dự án Google Apps Script của bạn tại <span className="text-indigo-300">script.google.com</span></div>
                  <div>2. Dán đoạn mã bên dưới vào hàm <code className="text-emerald-300 font-mono">doPost(e)</code> và <code className="text-emerald-300 font-mono">doGet(e)</code></div>
                  <div>3. Triển khai (Deploy) dưới dạng <strong>Web app</strong> (Ai cũng có quyền truy cập / Anyone)</div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Webhook URL đang dùng:
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customGasUrl}
                    onChange={(e) => setCustomGasUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveGasUrl}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép mã Script</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép mã Apps Script</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowGasHelper(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Xong
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
