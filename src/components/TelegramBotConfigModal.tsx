import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, ExternalLink, RefreshCw, Send, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';
import {
  getTelegramBotConfig,
  saveTelegramBotConfig,
  testTelegramBotToken,
  DEFAULT_BOT_USERNAME,
  TelegramBotConfig,
} from '../services/telegramOtpService';

interface TelegramBotConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: TelegramBotConfig) => void;
}

export const TelegramBotConfigModal: React.FC<TelegramBotConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [botUsername, setBotUsername] = useState('');
  const [botToken, setBotToken] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    username?: string;
    firstName?: string;
    error?: string;
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getTelegramBotConfig();
      setBotUsername(cfg.botUsername || DEFAULT_BOT_USERNAME);
      setBotToken(cfg.botToken || '');
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!botToken.trim()) {
      setTestResult({
        ok: false,
        error: 'Vui lòng dán Token của Bot được cấp từ @BotFather để kiểm tra kết nối API.',
      });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testTelegramBotToken(botToken.trim());
      setTestResult(res);
      if (res.ok && res.username) {
        setBotUsername(res.username);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = botUsername.replace(/^@/, '').trim() || DEFAULT_BOT_USERNAME;
    const updated = saveTelegramBotConfig({
      botUsername: cleanUsername,
      botToken: botToken.trim(),
    });
    setSavedSuccess(true);
    if (onSaved) onSaved(updated);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleResetDefault = () => {
    const updated = saveTelegramBotConfig({
      botUsername: DEFAULT_BOT_USERNAME,
      botToken: '',
    });
    setBotUsername(DEFAULT_BOT_USERNAME);
    setBotToken('');
    setTestResult(null);
    setSavedSuccess(true);
    if (onSaved) onSaved(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hướng Dẫn & Cấu Hình Bot Telegram
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kết nối bot Telegram thật để tự động gửi mã OTP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-xs">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tại sao khi mở Telegram báo không có bot?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              Telegram yêu cầu mỗi Bot phải được khởi tạo chính thức trên máy chủ Telegram thông qua <strong>@BotFather</strong>. Nếu chưa tạo bot riêng, bạn vẫn có thể bấm nút <strong>"Điền mã ngay"</strong> ở khung tin nhắn mô phỏng để đăng ký/đăng nhập kiểm thử ngay mà không bị gián đoạn.
            </p>
          </div>

          {/* 3 Steps Guide to create a bot */}
          <div className="space-y-3">
            <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
              <span>Cách tạo Bot Telegram miễn phí trong 1 phút:</span>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-[#229ED9] hover:underline flex items-center gap-1"
              >
                <span>Mở @BotFather</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-2 text-[11px] list-decimal pl-4 leading-relaxed text-slate-600 dark:text-slate-300">
              <li>
                Mở ứng dụng Telegram, tìm kiếm <strong>@BotFather</strong> (bot chính thức có tích xanh) và bấm <strong>Start</strong>.
              </li>
              <li>
                Gửi lệnh <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-blue-600">/newbot</code>, sau đó đặt tên cho bot (VD: <em>NovaShop OTP Bot</em>) và đặt username kết thúc bằng chữ <code>bot</code> (VD: <em>NovaShopVerify_bot</em>).
              </li>
              <li>
                BotFather sẽ gửi cho bạn một đoạn <strong>HTTP API Token</strong> (dạng <code>7123456789:ABC...</code>). Hãy sao chép token đó dán vào ô bên dưới.
              </li>
            </ol>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Username của Bot (không cần gõ dấu @):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">@</span>
                <input
                  type="text"
                  value={botUsername}
                  onChange={(e) => setBotUsername(e.target.value)}
                  placeholder="NovaShopVerifyBot"
                  className="w-full pl-8 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Đường link mở bot sẽ là: <span className="font-mono text-blue-600">https://t.me/{botUsername || DEFAULT_BOT_USERNAME}</span>
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Bot Token (HTTP API do @BotFather cấp - Tùy chọn):
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="7123456789:AAHq_ABCdef..."
                  className="flex-1 px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !botToken.trim()}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Kiểm tra</span>
                </button>
              </div>
            </div>

            {/* Test Connection Result */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
                  testResult.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {testResult.ok ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-bold">
                    {testResult.ok ? 'Kết nối Bot thành công!' : 'Kết nối thất bại'}
                  </div>
                  {testResult.ok ? (
                    <div>
                      Tên bot: <strong>{testResult.firstName}</strong> (@{testResult.username})
                    </div>
                  ) : (
                    <div>{testResult.error}</div>
                  )}
                </div>
              </div>
            )}

            {savedSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-center font-bold text-xs animate-in fade-in">
                Đã lưu cấu hình Bot thành công!
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
              >
                Khôi phục mặc định
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
