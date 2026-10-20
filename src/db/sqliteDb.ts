/**
 * Quản lý Cơ sở dữ liệu SQLite cho NovaShop (dùng chung giữa Web Server và Telegram Bot)
 * Sử dụng thư viện node:sqlite tích hợp sẵn trong Node.js (hỗ trợ WAL mode, concurrency an toàn)
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Đảm bảo thư mục lưu trữ database tồn tại
const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'novashop.db');
const db = new DatabaseSync(dbPath);

// Cấu hình SQLite tương thích hoàn hảo mọi hệ thống tệp và container (không dùng WAL để tránh lỗi disk I/O error trên OverlayFS)
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA journal_mode = DELETE;');
db.exec('PRAGMA foreign_keys = ON;');

// Khởi tạo bảng users nếu chưa có
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT,
    phone_verified INTEGER DEFAULT 0,
    phone_verified_at TEXT,
    created_at INTEGER
  );
`);

// Khởi tạo bảng verify_sessions theo đặc tả yêu cầu
db.exec(`
  CREATE TABLE IF NOT EXISTS verify_sessions (
    token TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    telegram_user_id INTEGER,
    otp_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'contact_verified' | 'verified' | 'failed' | 'expired' | 'cancelled'
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_verify_phone ON verify_sessions(phone);
  CREATE INDEX IF NOT EXISTS idx_verify_telegram_user ON verify_sessions(telegram_user_id);
`);

export interface VerifySessionRecord {
  token: string;
  phone: string;
  telegram_user_id: number | null;
  otp_hash: string | null;
  status: 'pending' | 'contact_verified' | 'verified' | 'failed' | 'expired' | 'cancelled';
  expires_at: number;
  attempts: number;
  created_at: number;
}

/**
 * Chuẩn hóa số điện thoại về định dạng quốc tế E.164 (+84xxxxxxxxx)
 */
export function normalizePhoneToE164(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('84')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+84${digits.slice(1)}`;
  }
  return `+${digits}`;
}

/**
 * Kiểm tra định dạng số điện thoại Việt Nam hợp lệ
 */
export function isValidVietnamPhone(e164Phone: string): boolean {
  // Định dạng +84 theo sau bởi 9 số (tổng 12 ký tự)
  return /^\+84[3|5|7|8|9][0-9]{8}$/.test(e164Phone);
}

/**
 * Tạo token ngẫu nhiên bảo mật (32 ký tự hex, url-safe, tối đa 64 ký tự)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash mã OTP 6 số bằng SHA-256 (tuyệt đối không lưu OTP rõ trong DB)
 */
export function hashOtpCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

/**
 * Đếm số phiên tạo trong 1 giờ qua của số điện thoại (chống spam/rate limit: tối đa 5 lần/giờ)
 */
export function countRecentSessionsIn1Hour(e164Phone: string): number {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const stmt = db.prepare(`
    SELECT COUNT(*) as cnt FROM verify_sessions 
    WHERE phone = ? AND created_at >= ?
  `);
  const row = stmt.get(e164Phone, oneHourAgo) as { cnt: number } | undefined;
  return row ? Number(row.cnt) : 0;
}

/**
 * Hủy tất cả các phiên pending cũ của số điện thoại trước khi tạo phiên mới
 */
export function cancelPreviousPendingSessions(e164Phone: string): void {
  const stmt = db.prepare(`
    UPDATE verify_sessions 
    SET status = 'cancelled' 
    WHERE phone = ? AND status IN ('pending', 'contact_verified')
  `);
  stmt.run(e164Phone);
}

/**
 * Tạo phiên xác thực mới trong DB
 */
export function createVerifySession(e164Phone: string): VerifySessionRecord {
  // Hủy mọi phiên cũ của số này
  cancelPreviousPendingSessions(e164Phone);

  const token = generateSecureToken();
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 phút hiệu lực

  const insertStmt = db.prepare(`
    INSERT INTO verify_sessions (token, phone, telegram_user_id, otp_hash, status, expires_at, attempts, created_at)
    VALUES (?, ?, NULL, NULL, 'pending', ?, 0, ?)
  `);
  insertStmt.run(token, e164Phone, expiresAt, now);

  console.log(`[Web API] Created verify session: phone=${e164Phone}, token=${token}, expires_at=${expiresAt} (5m)`);

  return {
    token,
    phone: e164Phone,
    telegram_user_id: null,
    otp_hash: null,
    status: 'pending',
    expires_at: expiresAt,
    attempts: 0,
    created_at: now,
  };
}

/**
 * Tra cứu phiên theo token (hỗ trợ cả token sạch hoặc token có tiền tố)
 */
export function getSessionByToken(token: string): VerifySessionRecord | null {
  try {
    const rawToken = String(token || '').trim();
    if (!rawToken) return null;

    const cleanToken = rawToken.replace(/^otp_/, '');
    const stmt = db.prepare(`SELECT * FROM verify_sessions WHERE token = ?`);
    let row = stmt.get(cleanToken) as VerifySessionRecord | undefined;
    if (!row && cleanToken !== rawToken) {
      row = stmt.get(rawToken) as VerifySessionRecord | undefined;
    }
    if (!row) return null;

    // Kiểm tra tự động xem đã hết hạn chưa
    if (row.expires_at < Date.now() && row.status === 'pending') {
      db.prepare(`UPDATE verify_sessions SET status = 'expired' WHERE token = ?`).run(row.token);
      row.status = 'expired';
    }

    return row;
  } catch (err) {
    console.error('[getSessionByToken Error]:', err);
    return null;
  }
}

/**
 * Lấy phiên xác thực đang chờ mới nhất trên toàn hệ thống (fallback thông minh khi người dùng mở bot không kèm token)
 */
export function getLatestPendingSession(): VerifySessionRecord | null {
  try {
    const now = Date.now();
    const stmt = db.prepare(`
      SELECT * FROM verify_sessions 
      WHERE status = 'pending' AND expires_at > ?
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    const row = stmt.get(now) as VerifySessionRecord | undefined;
    return row || null;
  } catch (err) {
    console.error('[getLatestPendingSession Error]:', err);
    return null;
  }
}

/**
 * Tra cứu phiên pending mới nhất của một Telegram user ID
 */
export function getLatestPendingSessionByTelegramUserId(telegramUserId: number): VerifySessionRecord | null {
  const now = Date.now();
  const stmt = db.prepare(`
    SELECT * FROM verify_sessions 
    WHERE telegram_user_id = ? 
      AND status IN ('pending', 'contact_verified') 
      AND expires_at > ?
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  const row = stmt.get(telegramUserId, now) as VerifySessionRecord | undefined;
  return row || null;
}

/**
 * Cập nhật telegram_user_id khi người dùng gõ /start <token>
 */
export function linkTelegramUserToSession(token: string, telegramUserId: number): boolean {
  const stmt = db.prepare(`
    UPDATE verify_sessions 
    SET telegram_user_id = ? 
    WHERE token = ? AND status = 'pending' AND expires_at > ?
  `);
  const res = stmt.run(telegramUserId, token, Date.now());
  return res.changes > 0;
}

/**
 * Cập nhật OTP hash và đổi trạng thái sang 'contact_verified' sau khi xác minh contact
 */
export function saveOtpHashForSession(token: string, otpHashed: string): void {
  const stmt = db.prepare(`
    UPDATE verify_sessions 
    SET otp_hash = ?, status = 'contact_verified' 
    WHERE token = ?
  `);
  stmt.run(otpHashed, token);
}

/**
 * Đánh dấu phiên thất bại (do sai số điện thoại, chuyển tiếp contact người khác, v.v.)
 */
export function markSessionFailed(token: string): void {
  const stmt = db.prepare(`UPDATE verify_sessions SET status = 'failed' WHERE token = ?`);
  stmt.run(token);
}

/**
 * Đánh dấu phiên hết hạn
 */
export function markSessionExpired(token: string): void {
  const stmt = db.prepare(`UPDATE verify_sessions SET status = 'expired' WHERE token = ?`);
  stmt.run(token);
}

/**
 * Hủy một phiên theo yêu cầu từ client (ví dụ khi nhấn "Đổi số điện thoại")
 */
export function cancelSessionByToken(token: string): void {
  const stmt = db.prepare(`
    UPDATE verify_sessions 
    SET status = 'cancelled' 
    WHERE token = ? AND status IN ('pending', 'contact_verified')
  `);
  stmt.run(token);
}

/**
 * Xác nhận mã OTP do người dùng nhập trên website
 */
export function verifyOtpCodeInSession(token: string, inputCode: string): {
  success: boolean;
  status: string;
  error?: string;
  attemptsRemaining?: number;
} {
  const session = getSessionByToken(token);
  if (!session) {
    console.log(`[API confirm] token=${token}, result=SESSION_NOT_FOUND`);
    return { success: false, status: 'not_found', error: 'Phiên xác thực không tồn tại.' };
  }

  // Kiểm tra hạn
  if (session.expires_at < Date.now()) {
    markSessionExpired(token);
    console.log(`[API confirm] token=${token}, result=EXPIRED`);
    return { success: false, status: 'expired', error: 'Mã xác thực đã hết hạn (5 phút). Vui lòng nhấn Gửi lại.' };
  }

  // Kiểm tra trạng thái đã failed hoặc cancelled
  if (session.status === 'failed' || session.status === 'cancelled') {
    console.log(`[API confirm] token=${token}, result=INVALID_STATUS (${session.status})`);
    return { success: false, status: session.status, error: 'Phiên xác thực đã bị hủy hoặc không hợp lệ.' };
  }

  // Kiểm tra số lần thử tối đa 5 lần
  if (session.attempts >= 5) {
    markSessionFailed(token);
    console.log(`[API confirm] token=${token}, result=MAX_ATTEMPTS_EXCEEDED`);
    return { success: false, status: 'failed', error: 'Bạn đã nhập sai quá 5 lần. Phiên xác thực đã bị khóa.' };
  }

  // Kiểm tra xem đã nhận contact và sinh OTP chưa
  if (!session.otp_hash || session.status !== 'contact_verified') {
    return { 
      success: false, 
      status: session.status, 
      error: 'Chưa nhận được số điện thoại từ Telegram Bot. Vui lòng bấm "Mở Telegram" và nhấn "Chia sẻ số điện thoại" trước.' 
    };
  }

  // So khớp mã hash
  const inputHash = hashOtpCode(inputCode);
  if (inputHash !== session.otp_hash) {
    const nextAttempts = session.attempts + 1;
    const isExceeded = nextAttempts >= 5;
    const newStatus = isExceeded ? 'failed' : session.status;
    
    db.prepare(`
      UPDATE verify_sessions 
      SET attempts = ?, status = ? 
      WHERE token = ?
    `).run(nextAttempts, newStatus, token);

    const remaining = Math.max(0, 5 - nextAttempts);
    console.log(`[API confirm] token=${token}, result=WRONG_OTP, attempts=${nextAttempts}`);

    if (isExceeded) {
      return { 
        success: false, 
        status: 'failed', 
        error: 'Bạn đã nhập sai 5 lần. Phiên xác thực bị hủy, vui lòng bắt đầu lại.',
        attemptsRemaining: 0 
      };
    }

    return { 
      success: false, 
      status: 'pending', 
      error: `Mã xác thực không chính xác. Bạn còn ${remaining} lần thử.`,
      attemptsRemaining: remaining 
    };
  }

  // Đúng mã OTP -> đánh dấu thành công
  db.prepare(`
    UPDATE verify_sessions 
    SET status = 'verified' 
    WHERE token = ?
  `).run(token);

  // Cập nhật trạng thái phone_verified trong bảng users nếu có user với số điện thoại này
  const nowIso = new Date().toISOString();
  db.prepare(`
    UPDATE users 
    SET phone_verified = 1, phone_verified_at = ? 
    WHERE phone = ?
  `).run(nowIso, session.phone);

  console.log(`[API confirm] token=${token}, result=SUCCESS, attempts=${session.attempts}`);

  return { success: true, status: 'verified' };
}

export { db };
