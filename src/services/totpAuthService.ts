import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { normalizePhoneToLocal, normalizePhoneToE164 } from '../firebase';

export interface TotpSetupDetails {
  phone: string;
  e164Phone: string;
  secretBase32: string;
  formattedSecret: string;
  otpauthUri: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  sampleCurrentToken: string;
  periodSeconds: number;
}

export interface TotpVerificationResult {
  success: boolean;
  isBackupCode: boolean;
  delta?: number | null;
  error?: string;
  consumedBackupCode?: string;
}

/**
 * Generate a random set of human-friendly 8-character backup recovery codes
 * formatted like '8392-4109'.
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < count; i++) {
    let p1 = '';
    let p2 = '';
    for (let j = 0; j < 4; j++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(`${p1}-${p2}`);
  }
  return codes;
}

/**
 * Formats a Base32 string into groups of 4 for easy readability and typing.
 * E.g. 'JBSWY3DPEHPK3PXP' -> 'JBSW Y3DP EHPK 3PXP'
 */
export function formatSecretForDisplay(secret: string): string {
  const clean = secret.replace(/\s+/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

/**
 * Strips whitespace, dashes, and non-alphanumeric characters for validation.
 */
export function cleanTotpInput(raw: string): string {
  return raw.replace(/[\s-]+/g, '').trim();
}

/**
 * Create an OTPAuth.TOTP instance configured for NovaShop standard.
 */
export function createTotpInstance(phone: string, secretBase32: string, issuer = 'NovaShop'): OTPAuth.TOTP {
  const cleanSecret = secretBase32.replace(/\s+/g, '').toUpperCase();
  const secret = OTPAuth.Secret.fromBase32(cleanSecret);
  const normalizedPhone = normalizePhoneToLocal(phone) || phone;

  return new OTPAuth.TOTP({
    issuer,
    label: normalizedPhone,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });
}

/**
 * Generates a complete TOTP setup payload for a phone number:
 * - Cryptographically random 20-byte Base32 secret
 * - Standard otpauth:// URI
 * - High-contrast QR code Data URL for Google Authenticator scanning
 * - 8 Emergency backup codes
 * - Current sample token for instant preview/testing
 */
export async function generatePhoneTotpSetup(
  phone: string,
  existingSecret?: string
): Promise<TotpSetupDetails> {
  const localPhone = normalizePhoneToLocal(phone) || phone;
  const e164Phone = normalizePhoneToE164(phone) || localPhone;

  let secretBase32: string;
  if (existingSecret && existingSecret.trim().length >= 16) {
    secretBase32 = existingSecret.replace(/\s+/g, '').toUpperCase();
  } else {
    const secret = new OTPAuth.Secret({ size: 20 });
    secretBase32 = secret.base32;
  }

  const totp = createTotpInstance(localPhone, secretBase32);
  const otpauthUri = totp.toString();

  // Generate crisp QR code SVG or PNG data URL for scanning
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
      errorCorrectionLevel: 'M',
      margin: 1.5,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (qrErr) {
    console.error('Failed to generate TOTP QR Code:', qrErr);
  }

  const backupCodes = generateBackupCodes(8);
  const sampleCurrentToken = totp.generate();

  return {
    phone: localPhone,
    e164Phone,
    secretBase32,
    formattedSecret: formatSecretForDisplay(secretBase32),
    otpauthUri,
    qrCodeDataUrl,
    backupCodes,
    sampleCurrentToken,
    periodSeconds: 30,
  };
}

/**
 * Verifies a 6-digit TOTP code (or an 8-character backup recovery code) against the secret.
 * Supports a ±1 step window (30 seconds before and 30 seconds after) to accommodate
 * natural device clock drift.
 */
export function verifyTotpCode(
  secretBase32: string,
  tokenInput: string,
  backupCodes: string[] = []
): TotpVerificationResult {
  const cleaned = cleanTotpInput(tokenInput);

  if (!cleaned) {
    return {
      success: false,
      isBackupCode: false,
      error: 'Vui lòng nhập mã xác thực OTP 6 số từ Google Authenticator hoặc mã dự phòng.',
    };
  }

  // Check emergency backup codes first (case-insensitive)
  if (backupCodes.length > 0) {
    const matchedBackup = backupCodes.find(
      (bc) => cleanTotpInput(bc).toUpperCase() === cleaned.toUpperCase()
    );
    if (matchedBackup) {
      return {
        success: true,
        isBackupCode: true,
        consumedBackupCode: matchedBackup,
      };
    }
  }

  // Clean numeric 6-digit TOTP validation
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length !== 6) {
    return {
      success: false,
      isBackupCode: false,
      error: 'Mã xác thực Google Authenticator gồm 6 chữ số (hoặc mã dự phòng 8 ký tự).',
    };
  }

  try {
    const totp = createTotpInstance('novashop-verify', secretBase32);
    // window: 1 allows current interval, 1 interval back, and 1 interval forward (total 90s window)
    const delta = totp.validate({
      token: digitsOnly,
      window: 1,
    });

    if (delta !== null) {
      return {
        success: true,
        isBackupCode: false,
        delta,
      };
    }

    return {
      success: false,
      isBackupCode: false,
      error:
        'Mã OTP 6 số không đúng hoặc đã hết hạn 30 giây. Vui lòng kiểm tra lại mã mới nhất trên Google Authenticator.',
    };
  } catch (err: unknown) {
    return {
      success: false,
      isBackupCode: false,
      error: err instanceof Error ? err.message : 'Lỗi khi xác minh mã xác thực.',
    };
  }
}

/**
 * Get current rolling TOTP token for testing / assistant preview
 */
export function getTotpCurrentToken(secretBase32: string): string {
  try {
    const totp = createTotpInstance('novashop-test', secretBase32);
    return totp.generate();
  } catch {
    return '000000';
  }
}

/**
 * Returns seconds remaining until the next 30-second token rotation.
 */
export function getTotpSecondsRemaining(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}
