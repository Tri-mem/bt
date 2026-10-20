-- Migration: 001_create_verify_sessions.sql
-- Mục đích: Tạo bảng lưu trữ phiên xác thực Telegram OTP và cập nhật bảng users

-- 1. Bảng lưu trữ phiên xác minh (Web Server và Telegram Bot dùng chung)
CREATE TABLE IF NOT EXISTS verify_sessions (
  token VARCHAR(64) PRIMARY KEY,                         -- Chuỗi ngẫu nhiên bảo mật URL-safe (32 hex chars)
  phone VARCHAR(20) NOT NULL,                            -- SĐT chuẩn hóa định dạng E.164 (+84xxxxxxxxx)
  telegram_user_id BIGINT DEFAULT NULL,                  -- ID Telegram của người dùng (lấy từ update.message.from.id)
  otp_hash VARCHAR(128) DEFAULT NULL,                    -- Bản băm SHA-256 của mã OTP 6 số (không lưu mã rõ)
  status VARCHAR(20) NOT NULL DEFAULT 'pending',         -- pending | contact_verified | verified | failed | expired | cancelled
  expires_at BIGINT NOT NULL,                            -- Thời điểm hết hạn (UTC milliseconds, 5 phút từ khi tạo)
  attempts INTEGER NOT NULL DEFAULT 0,                   -- Số lần nhập sai OTP (tối đa 5 lần)
  created_at BIGINT NOT NULL                             -- Thời điểm khởi tạo (UTC milliseconds)
);

-- Tạo chỉ mục tối ưu hóa tốc độ tra cứu
CREATE INDEX IF NOT EXISTS idx_verify_phone ON verify_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_verify_telegram_user ON verify_sessions(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_verify_created_at ON verify_sessions(created_at);

-- 2. Bảng người dùng (Users): Thêm cột trạng thái xác thực SĐT
-- (Trong SQLite, lệnh ALTER TABLE ADD COLUMN được thực thi an toàn)
ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN phone_verified_at TEXT;
