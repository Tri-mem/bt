/**
 * Telegram OTP Authentication Service for NovaShop
 * Provides Telegram Bot OTP issuance, deep-linking, real-time message preview,
 * session management with 5-minute TTL, and fallback mechanisms.
 */

export interface TelegramOtpSession {
  id: string;
  phone: string;
  e164Phone: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  botUsername: string;
  deeplinkUrl: string;
  channel: 'telegram';
  status: 'sent' | 'verified' | 'expired';
}

export interface TelegramBotConfig {
  botUsername: string;
  botToken?: string;
  customDisplayName?: string;
}

const STORAGE_KEY = 'novashop_telegram_otp_sessions';
const BOT_CONFIG_KEY = 'novashop_telegram_bot_config';
export const DEFAULT_BOT_USERNAME = 'NovaShopVerifyBot';
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Gets currently configured Telegram Bot credentials from localStorage
 */
export function getTelegramBotConfig(): TelegramBotConfig {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(BOT_CONFIG_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {}
  return {
    botUsername: DEFAULT_BOT_USERNAME,
    botToken: '',
  };
}

/**
 * Saves or updates custom Telegram Bot credentials
 */
export function saveTelegramBotConfig(newConfig: Partial<TelegramBotConfig>): TelegramBotConfig {
  const current = getTelegramBotConfig();
  const cleanedUsername = (newConfig.botUsername || current.botUsername || DEFAULT_BOT_USERNAME)
    .replace(/^@/, '')
    .trim();
  const updated: TelegramBotConfig = {
    ...current,
    ...newConfig,
    botUsername: cleanedUsername,
  };
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BOT_CONFIG_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('novashop:telegram_bot_config_changed', { detail: updated }));
    }
  } catch {}
  return updated;
}

/**
 * Verifies live connectivity with Telegram Bot API via /getMe
 */
export async function testTelegramBotToken(token: string): Promise<{
  ok: boolean;
  username?: string;
  firstName?: string;
  error?: string;
}> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { ok: false, error: 'Vui lòng nhập Bot Token từ @BotFather.' };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const data = await res.json();
    if (data.ok && data.result) {
      return {
        ok: true,
        username: data.result.username,
        firstName: data.result.first_name,
      };
    }
    return { ok: false, error: data.description || 'Token không hợp lệ hoặc bot không tồn tại trên Telegram.' };
  } catch (err) {
    return { ok: false, error: 'Không thể kết nối đến máy chủ Telegram: ' + String(err) };
  }
}

/**
 * Normalizes phone number to Vietnamese local format (e.g. 0912345678)
 */
export function normalizePhoneLocal(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length >= 10) {
    return '0' + digits.slice(2);
  }
  return digits;
}

/**
 * Normalizes phone number to E.164 format (e.g. +84912345678)
 */
export function normalizePhoneE164(phone: string): string {
  const local = normalizePhoneLocal(phone);
  if (local.startsWith('0')) {
    return '+84' + local.slice(1);
  }
  return '+' + local;
}

/**
 * Generates a cryptographically strong or random 6-digit OTP code
 */
function generate6DigitOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Retrieves all stored sessions from sessionStorage (failsafe)
 */
function getStoredSessions(): Record<string, TelegramOtpSession> {
  try {
    if (typeof window === 'undefined') return {};
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves sessions to sessionStorage
 */
function saveStoredSessions(sessions: Record<string, TelegramOtpSession>): void {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Creates and initiates a new Telegram OTP session for a phone number
 */
export async function sendTelegramPhoneOtp(phoneInput: string): Promise<TelegramOtpSession> {
  const localPhone = normalizePhoneLocal(phoneInput);
  const e164Phone = normalizePhoneE164(phoneInput);

  if (!localPhone || localPhone.length < 9 || localPhone.length > 15) {
    throw new Error('Số điện thoại không hợp lệ. Vui lòng nhập từ 9 - 11 chữ số (VD: 0901234567).');
  }

  const sessionId = 'tg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const code = generate6DigitOtp();
  const now = Date.now();

  const botConfig = getTelegramBotConfig();
  const activeBotUsername = botConfig.botUsername || DEFAULT_BOT_USERNAME;

  const session: TelegramOtpSession = {
    id: sessionId,
    phone: localPhone,
    e164Phone,
    code,
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    botUsername: activeBotUsername,
    deeplinkUrl: `https://t.me/${activeBotUsername}?start=otp_${sessionId}`,
    channel: 'telegram',
    status: 'sent',
  };

  const sessions = getStoredSessions();
  // Clear any expired sessions
  const cleaned: Record<string, TelegramOtpSession> = {};
  Object.entries(sessions).forEach(([k, s]) => {
    if (s.expiresAt > now) {
      cleaned[k] = s;
    }
  });

  cleaned[session.id] = session;
  // Also index by local phone for quick lookup
  cleaned[`phone_${localPhone}`] = session;
  saveStoredSessions(cleaned);

  return session;
}

/**
 * Verifies the OTP code submitted by the user
 */
export function verifyTelegramOtpCode(params: {
  phone: string;
  code: string;
  sessionId?: string;
}): { verified: boolean; message?: string } {
  const cleanCode = params.code.trim().replace(/\D/g, '');
  const localPhone = normalizePhoneLocal(params.phone);

  if (cleanCode.length !== 6) {
    return { verified: false, message: 'Mã OTP phải gồm đầy đủ 6 chữ số.' };
  }

  const sessions = getStoredSessions();
  let session: TelegramOtpSession | undefined;

  if (params.sessionId && sessions[params.sessionId]) {
    session = sessions[params.sessionId];
  } else if (sessions[`phone_${localPhone}`]) {
    session = sessions[`phone_${localPhone}`];
  }

  if (!session) {
    return {
      verified: false,
      message: 'Phiên xác thực Telegram không tồn tại hoặc đã bị làm mới. Vui lòng gửi lại mã OTP.',
    };
  }

  if (Date.now() > session.expiresAt) {
    session.status = 'expired';
    saveStoredSessions(sessions);
    return {
      verified: false,
      message: 'Mã xác thực Telegram đã hết hạn (sau 5 phút). Vui lòng nhấn "Gửi lại mã".',
    };
  }

  if (session.code !== cleanCode) {
    return {
      verified: false,
      message: 'Mã xác thực không chính xác. Vui lòng kiểm tra lại mã đã nhận từ Telegram Bot.',
    };
  }

  session.status = 'verified';
  saveStoredSessions(sessions);
  return { verified: true };
}

/**
 * Generates the friendly preview message matching Telegram Bot styling
 */
export function formatTelegramBotMessage(session: TelegramOtpSession): string {
  const formattedCode = `${session.code.slice(0, 3)} ${session.code.slice(3)}`;
  return `NovaShop Verification:\nMã xác thực OTP của bạn là: [ ${formattedCode} ]\nHiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.`;
}

export { sendTelegramOTP, type TelegramOtpDeliveryResult } from '../utils/telegramOtp';

