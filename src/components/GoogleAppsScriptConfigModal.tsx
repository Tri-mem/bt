import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Copy,
  Check,
  Send,
  ExternalLink,
  Code2,
  Settings,
  History,
  Eye,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Gift,
  HelpCircle,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  getConfiguredWelcomeGasUrl,
  setConfiguredWelcomeGasUrl,
  isAutoWelcomeEmailEnabled,
  setAutoWelcomeEmailEnabled,
  getWelcomeEmailLogs,
  clearWelcomeEmailLogs,
  sendWelcomeEmail,
  buildWelcomeEmailPayload,
  GOOGLE_APPS_SCRIPT_WELCOME_CODE,
  DEFAULT_GAS_WELCOME_EMAIL_WEBHOOK_URL,
  WelcomeEmailLogEntry,
} from '../utils/welcomeEmail';

interface GoogleAppsScriptConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onSendSuccessToast?: (msg: string) => void;
}

export const GoogleAppsScriptConfigModal: React.FC<GoogleAppsScriptConfigModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSendSuccessToast,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'test' | 'code' | 'preview' | 'logs'>('config');

  // Config tab state
  const [gasUrlInput, setGasUrlInput] = useState(getConfiguredWelcomeGasUrl());
  const [autoSendEnabled, setAutoSendEnabled] = useState(isAutoWelcomeEmailEnabled());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Test send tab state
  const [testEmail, setTestEmail] = useState(currentUser?.email || 'truongminhquoctri@gmail.com');
  const [testName, setTestName] = useState(currentUser?.fullName || 'Trương Minh Quốc Trí');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; time?: string } | null>(null);

  // Code copy state
  const [copiedCode, setCopiedCode] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<WelcomeEmailLogEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setGasUrlInput(getConfiguredWelcomeGasUrl());
      setAutoSendEnabled(isAutoWelcomeEmailEnabled());
      setLogs(getWelcomeEmailLogs());
      setTestResult(null);
      setSavedSuccess(false);
      if (currentUser?.email) {
        setTestEmail(currentUser.email);
      }
      if (currentUser?.fullName) {
        setTestName(currentUser.fullName);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = gasUrlInput.trim();
    setConfiguredWelcomeGasUrl(cleanUrl);
    setAutoWelcomeEmailEnabled(autoSendEnabled);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaultUrl = () => {
    setGasUrlInput(DEFAULT_GAS_WELCOME_EMAIL_WEBHOOK_URL);
    setConfiguredWelcomeGasUrl(DEFAULT_GAS_WELCOME_EMAIL_WEBHOOK_URL);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_WELCOME_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRunTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = testEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setTestResult({
        ok: false,
        message: 'Vui lòng nhập địa chỉ email người nhận hợp lệ.',
      });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    const dummyUser: UserProfile = {
      id: currentUser?.id || 'test-user-' + Date.now(),
      fullName: testName.trim() || 'Khách hàng NovaShop',
      email: cleanEmail,
      phone: currentUser?.phone || '0901234567',
      memberTier: currentUser?.memberTier || 'Bronze',
      novaPoints: currentUser?.novaPoints || 1000,
      joinedDate: new Date().toLocaleDateString('vi-VN'),
    };

    const res = await sendWelcomeEmail(dummyUser, {
      gasUrl: gasUrlInput.trim(),
      force: true,
      isTest: true,
      voucherCode: 'WELCOME100',
    });

    setIsSendingTest(false);
    setTestResult({
      ok: res.ok,
      message: res.message,
      time: new Date().toLocaleTimeString('vi-VN'),
    });

    setLogs(getWelcomeEmailLogs());
    if (res.ok && onSendSuccessToast) {
      onSendSuccessToast(res.message);
    }
  };

  const handleClearLogs = () => {
    clearWelcomeEmailLogs();
    setLogs([]);
  };

  const previewPayload = buildWelcomeEmailPayload({
    fullName: testName || 'Trương Minh Quốc Trí',
    email: testEmail || 'truongminhquoctri@gmail.com',
    memberTier: currentUser?.memberTier || 'Bronze',
    novaPoints: currentUser?.novaPoints || 1000,
    joinedDate: new Date().toLocaleDateString('vi-VN'),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="gas-config-modal"
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Cấu hình Google Apps Script
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                  Email Chào Mừng Lần Đầu
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tự động gửi email chào mừng kèm voucher 100K & điểm thưởng khi người dùng đăng nhập lần đầu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-white dark:bg-slate-900 overflow-x-auto scrollbar-none">
          <button
            id="gas-tab-config"
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cài đặt & Web App URL</span>
          </button>

          <button
            id="gas-tab-test"
            type="button"
            onClick={() => setActiveTab('test')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'test'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Kiểm thử gửi Email</span>
          </button>

          <button
            id="gas-tab-code"
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'code'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Mã nguồn Google Apps Script</span>
          </button>

          <button
            id="gas-tab-preview"
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Xem trước mẫu Email</span>
          </button>

          <button
            id="gas-tab-logs"
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử gửi ({logs.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white block font-bold mb-0.5">
                    Tự động hóa 100% qua Google Apps Script (MailApp.sendEmail)
                  </strong>
                  Khi người dùng đăng nhập tài khoản lần đầu (Google Sign-In, Số điện thoại OTP hoặc Đăng ký thường), hệ thống NovaShop sẽ tự động gọi Webhook Google Apps Script để phát hành một bức thư chào mừng sang trọng kèm voucher 100K tới email của người dùng.
                </div>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                {/* Auto send toggle */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block cursor-pointer">
                      Bật tự động gửi thư chào mừng khi đăng nhập lần đầu
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Chỉ gửi 01 lần duy nhất cho mỗi tài khoản mới để tránh làm phiền khách hàng.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSendEnabled}
                    onChange={(e) => setAutoSendEnabled(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer shrink-0"
                  />
                </div>

                {/* Web App URL */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Google Apps Script Web App URL <span className="text-rose-500">*</span>
                    </label>
                    <a
                      href="https://script.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Mở script.google.com</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <input
                    id="gas-url-input"
                    type="url"
                    value={gasUrlInput}
                    onChange={(e) => setGasUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3.5 py-2.5 font-mono text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    URL Web App được tạo sau khi triển khai (Deploy) script dạng Web app với quyền truy cập "Bất kỳ ai" (Anyone).
                  </p>
                </div>

                {savedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Đã lưu cấu hình Google Apps Script thành công!</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetDefaultUrl}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                  >
                    Khôi phục Webhook mặc định hệ thống
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('test')}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Thử nghiệm gửi thư</span>
                    </button>
                    <button
                      id="save-gas-config-btn"
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                    >
                      Lưu cấu hình
                    </button>
                  </div>
                </div>
              </form>

              {/* Instructions summary card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Quy trình hoạt động an toàn</span>
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                  <li>• <strong>Miễn phí 100%:</strong> Sử dụng hạn mức gửi email sẵn có của tài khoản Gmail (100 thư/ngày đối với cá nhân, 1.500 thư/ngày với Workspace).</li>
                  <li>• <strong>Không cần thẻ tín dụng / Cloud Billing:</strong> Hoạt động độc lập thông qua Google Apps Script Web App.</li>
                  <li>• <strong>Bảo vệ hộp thư:</strong> Chỉ gửi tự động đúng 01 lần khi tài khoản được tạo mới hoặc đăng nhập lần đầu tiên.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: TEST SEND */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white block font-bold mb-0.5">
                    Kiểm thử gửi thư chào mừng thực tế
                  </strong>
                  Nhập địa chỉ email bất kỳ bên dưới để gửi thử nghiệm ngay một bức thư chào mừng hoàn chỉnh qua Google Apps Script và kiểm tra hộp thư đến (Inbox) của bạn.
                </div>
              </div>

              <form onSubmit={handleRunTestSend} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Họ và tên người nhận thử nghiệm
                    </label>
                    <input
                      id="test-name-input"
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Trương Minh Quốc Trí"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Địa chỉ Email nhận thư thử nghiệm <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="test-email-input"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="truongminhquoctri@gmail.com"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Webhook URL đang sử dụng:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 truncate max-w-[280px] sm:max-w-[380px]">
                    {gasUrlInput}
                  </span>
                </div>

                {testResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in ${
                      testResult.ok
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong className="block font-bold">
                        {testResult.ok ? '✓ Gửi email thành công!' : '✗ Không thể gửi email'}
                      </strong>
                      <p className="mt-0.5">{testResult.message}</p>
                      {testResult.ok && (
                        <p className="mt-1 text-xs opacity-90">
                          Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Quảng cáo/Spam nếu gửi lần đầu) của <strong>{testEmail}</strong>.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    id="send-test-email-btn"
                    type="submit"
                    disabled={isSendingTest}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSendingTest ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang gửi email qua Google Apps Script...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Gửi Email Chào Mừng Thử Nghiệm Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CODE.GS SCRIPT CODE */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Mã nguồn Code.gs cho Google Apps Script
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dán toàn bộ đoạn code này vào file Code.gs trên trang script.google.com
                  </p>
                </div>
                <button
                  id="copy-gas-code-btn"
                  type="button"
                  onClick={handleCopyCode}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    copiedCode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Đã sao chép vào bộ nhớ tạm!' : 'Sao chép toàn bộ mã nguồn'}</span>
                </button>
              </div>

              {/* 4-step deployment guide */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Hướng dẫn triển khai Web App 4 bước:</span>
                </div>
                <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
                  <li>
                    Mở{' '}
                    <a
                      href="https://script.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 font-semibold underline"
                    >
                      script.google.com
                    </a>{' '}
                    và bấm <strong>"+ Dự án mới" (New project)</strong>.
                  </li>
                  <li>
                    Xóa hết nội dung trong file <code>Code.gs</code> rồi <strong>dán toàn bộ mã bên dưới vào</strong>. Nhấn <strong>Ctrl + S</strong> để lưu.
                  </li>
                  <li>
                    Nhấn nút <strong>Triển khai (Deploy)</strong> ở góc trên bên phải &gt; <strong>Tùy chọn triển khai mới (New deployment)</strong> &gt; Chọn biểu tượng bánh răng chọn <strong>Ứng dụng web (Web app)</strong>.
                    <br />
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      • Thực thi dưới dạng: <em>Tôi (Me)</em>
                      <br />
                      • Ai có quyền truy cập: <em>Bất kỳ ai (Anyone)</em> (bắt buộc)
                    </span>
                  </li>
                  <li>
                    Bấm <strong>Triển khai</strong> &gt; cấp quyền Gmail &gt; sao chép <strong>URL ứng dụng web</strong> (đuôi <code>/exec</code>) dán vào tab Cài đặt của NovaShop!
                  </li>
                </ol>
              </div>

              {/* Code viewer */}
              <div className="relative rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">Code.gs</span>
                  <span>JavaScript / Google Apps Script API</span>
                </div>
                <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto max-h-[380px] scrollbar-thin">
                  <code>{GOOGLE_APPS_SCRIPT_WELCOME_CODE}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  Tiêu đề email khách hàng nhận được:
                </div>
                <div className="font-semibold text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  {previewPayload.subject}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 font-medium flex items-center justify-between">
                  <span>Mô phỏng hộp thư Gmail</span>
                  <span>Người gửi: NovaShop Việt Nam (support@novashop.vn)</span>
                </div>
                <div
                  className="bg-slate-100 p-4 max-h-[480px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: previewPayload.htmlBody }}
                />
              </div>
            </div>
          )}

          {/* TAB 5: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Nhật ký {logs.length} lượt gửi email chào mừng gần nhất
                </span>
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa nhật ký</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                  Chưa có lịch sử gửi email nào được ghi nhận.
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              log.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                            }`}
                          >
                            {log.success ? '✓ Thành công' : '✗ Thất bại'}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {log.email}
                          </span>
                          {log.isTest && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 text-[10px] font-bold">
                              Kiểm thử
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 truncate">
                          {log.message}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                        {new Date(log.sentAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>NovaShop × Google Apps Script Integration</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
