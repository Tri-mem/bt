import { UserProfile } from '../types';

export const DEFAULT_GAS_WELCOME_EMAIL_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbwR6_juSKdCeIEiqNYsFpSe3ydOvHMace9rUzm_1AUwbOQ3qaJZbyvZ_YjOgKH545a-qQ/exec';

const GAS_WELCOME_EMAIL_STORAGE_KEY = 'novashop_gas_welcome_email_url';
const WELCOME_EMAIL_SENT_PREFIX = 'novashop_welcome_email_sent_';
const WELCOME_EMAIL_LOGS_STORAGE_KEY = 'novashop_welcome_email_history_v1';
const AUTO_SEND_ENABLED_STORAGE_KEY = 'novashop_gas_welcome_auto_send_enabled';

export interface WelcomeEmailLogEntry {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  sentAt: string;
  success: boolean;
  message: string;
  gasUrlUsed: string;
  isTest?: boolean;
}

export function getConfiguredWelcomeGasUrl(): string {
  try {
    const saved = localStorage.getItem(GAS_WELCOME_EMAIL_STORAGE_KEY)?.trim();
    if (
      saved &&
      saved.startsWith('https://script.google.com/') &&
      saved !== 'https://script.google.com/macros/s/AKfycbzX5Yfl62SvRH-zIHPiPoF6m-VUyxt8gHpidrEvO9cOMwD-1K59G2qZN9KxmK15LW0w/exec'
    ) {
      return saved;
    }
  } catch {
    // ignore storage error
  }
  return DEFAULT_GAS_WELCOME_EMAIL_WEBHOOK_URL;
}

export function setConfiguredWelcomeGasUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (!trimmed) {
      localStorage.removeItem(GAS_WELCOME_EMAIL_STORAGE_KEY);
    } else {
      localStorage.setItem(GAS_WELCOME_EMAIL_STORAGE_KEY, trimmed);
    }
  } catch {
    // ignore storage error
  }
}

export function isAutoWelcomeEmailEnabled(): boolean {
  try {
    const val = localStorage.getItem(AUTO_SEND_ENABLED_STORAGE_KEY);
    return val !== 'false'; // Default enabled
  } catch {
    return true;
  }
}

export function setAutoWelcomeEmailEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_SEND_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function checkIfWelcomeEmailSent(userId: string, email?: string): boolean {
  if (!userId) return false;
  try {
    const byId = localStorage.getItem(WELCOME_EMAIL_SENT_PREFIX + userId);
    if (byId) return true;
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const byEmail = localStorage.getItem(WELCOME_EMAIL_SENT_PREFIX + cleanEmail);
      if (byEmail) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function markWelcomeEmailSent(userId: string, email?: string): void {
  const timestamp = new Date().toISOString();
  try {
    if (userId) {
      localStorage.setItem(WELCOME_EMAIL_SENT_PREFIX + userId, timestamp);
    }
    if (email) {
      localStorage.setItem(WELCOME_EMAIL_SENT_PREFIX + email.trim().toLowerCase(), timestamp);
    }
  } catch {
    // ignore
  }
}

export function getWelcomeEmailLogs(): WelcomeEmailLogEntry[] {
  try {
    const raw = localStorage.getItem(WELCOME_EMAIL_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWelcomeEmailLog(entry: Omit<WelcomeEmailLogEntry, 'id'>): void {
  try {
    const logs = getWelcomeEmailLogs();
    const newLog: WelcomeEmailLogEntry = {
      ...entry,
      id: 'wel-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    };
    logs.unshift(newLog);
    // Keep last 40 logs
    const trimmedLogs = logs.slice(0, 40);
    localStorage.setItem(WELCOME_EMAIL_LOGS_STORAGE_KEY, JSON.stringify(trimmedLogs));
  } catch {
    // ignore
  }
}

export function clearWelcomeEmailLogs(): void {
  try {
    localStorage.removeItem(WELCOME_EMAIL_LOGS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function escapeHtml(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds high-converting, professional, mobile-responsive HTML welcome email
 */
export function buildWelcomeEmailPayload(
  user: {
    fullName: string;
    email: string;
    userId?: string;
    memberTier?: string;
    novaPoints?: number;
    joinedDate?: string;
  },
  options?: {
    voucherCode?: string;
    voucherDiscount?: string;
    appUrl?: string;
  }
): {
  toEmail: string;
  subject: string;
  htmlBody: string;
  voucherCode: string;
} {
  const toEmail = (user.email || '').trim();
  const fullName = user.fullName || 'Quý khách';
  const memberTier = user.memberTier || 'Bronze';
  const novaPoints = typeof user.novaPoints === 'number' ? user.novaPoints : 1000;
  const joinedDate = user.joinedDate || new Date().toLocaleDateString('vi-VN');
  const voucherCode = options?.voucherCode || 'WELCOME100';
  const voucherDiscount = options?.voucherDiscount || '100.000₫';
  const appUrl = options?.appUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://novashop.vn');

  const subject = `🎉 [NovaShop] Chào mừng ${fullName} gia nhập NovaShop! Tặng bạn Voucher 100K & ${novaPoints.toLocaleString('vi-VN')} điểm NovaPoints`;

  const htmlBody = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <div style="max-width:620px;margin:24px auto;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 36px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
    
    <!-- Hero Header with gradient & branding -->
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#2563eb 100%);padding:36px 28px 30px;text-align:center;color:#ffffff;">
      <div style="display:inline-block;padding:7px 18px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:999px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;">
        ✨ THÀNH VIÊN MỚI GIA NHẬP
      </div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:900;line-height:1.3;letter-spacing:-0.5px;">
        Chào Mừng Bạn Đến Với NovaShop! 🎉
      </h1>
      <p style="margin:0;font-size:14px;color:#cbd5e1;line-height:1.5;">
        Cảm ơn <strong>${escapeHtml(fullName)}</strong> đã đăng ký tài khoản thành công. Hành trình mua sắm thiết bị công nghệ chính hãng tiện lợi & ưu đãi bắt đầu từ đây!
      </p>
    </div>

    <!-- Main Content Body -->
    <div style="padding:28px 24px;">
      
      <!-- Greeting paragraph -->
      <p style="font-size:15px;line-height:1.65;color:#334155;margin:0 0 20px;">
        Xin chào <strong>${escapeHtml(fullName)}</strong>,
        <br /><br />
        Chúng tôi rất vinh hạnh được chào đón bạn trở thành thành viên của <strong>NovaShop Việt Nam</strong> — Nền tảng mua sắm thiết bị công nghệ cao cấp chính hãng và thanh toán số đa kênh. Tài khoản thành viên của bạn đã sẵn sàng để sử dụng ngay bây giờ!
      </p>

      <!-- Welcome Exclusive Gift Box (Voucher 100K) -->
      <div style="background:linear-gradient(135deg,#eff6ff 0%,#f0fdf4 100%);border:2px dashed #3b82f6;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
          🎁 QUÀ TẶNG CHÀO MỪNG ĐỘC QUYỀN DÀNH CHO BẠN
        </div>
        <div style="font-size:22px;font-weight:900;color:#1d4ed8;margin-bottom:6px;">
          GIẢM NGAY ${escapeHtml(voucherDiscount)} ĐƠN ĐẦU TIÊN
        </div>
        <p style="font-size:13px;color:#475569;margin:0 0 14px;">
          Áp dụng cho mọi đơn hàng công nghệ từ 500.000₫. Nhập mã voucher tại bước giỏ hàng:
        </p>
        <div style="display:inline-block;padding:10px 24px;background-color:#ffffff;border:2px solid #2563eb;border-radius:10px;font-family:'Courier New',Courier,monospace;font-size:20px;font-weight:900;color:#1d4ed8;letter-spacing:3px;box-shadow:0 4px 12px rgba(37,99,235,0.15);">
          ${escapeHtml(voucherCode)}
        </div>
        <div style="font-size:11.5px;color:#059669;font-weight:700;margin-top:10px;">
          ✓ Tặng kèm mã <strong>FREESHIP</strong> miễn phí vận chuyển toàn quốc cho đơn từ 300K!
        </div>
      </div>

      <!-- Account Info & VIP Tier Card -->
      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">
          📋 THÔNG TIN TÀI KHOẢN CỦA BẠN
        </div>
        <table style="width:100%;font-size:13.5px;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:140px;">• Họ và tên:</td>
            <td style="padding:6px 0;font-weight:700;color:#0f172a;">${escapeHtml(fullName)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;">• Email đăng nhập:</td>
            <td style="padding:6px 0;font-weight:700;color:#0f172a;">${escapeHtml(toEmail)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;">• Hạng thành viên:</td>
            <td style="padding:6px 0;font-weight:800;color:#2563eb;">NovaClub ${escapeHtml(memberTier)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;">• Điểm thưởng ban đầu:</td>
            <td style="padding:6px 0;font-weight:800;color:#059669;">+${novaPoints.toLocaleString('vi-VN')} NovaPoints</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;">• Ngày gia nhập:</td>
            <td style="padding:6px 0;color:#0f172a;">${escapeHtml(joinedDate)}</td>
          </tr>
        </table>
      </div>

      <!-- Key NovaShop Value Propositions -->
      <div style="margin-bottom:26px;">
        <div style="font-size:12px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
          ⭐ QUYỀN LỢI ĐẶC QUYỀN KHI MUA SẮM TẠI NOVASHOP
        </div>
        <div style="display:grid;gap:10px;">
          <div style="padding:10px 14px;background-color:#ffffff;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:8px;font-size:13px;line-height:1.5;">
            <strong>100% Chính Hãng & VAT Điện Tử:</strong> Nguyên seal từ nhà sản xuất, bảo hành chính hãng 12-24 tháng và xuất hóa đơn GTGT điện tử tự động qua email.
          </div>
          <div style="padding:10px 14px;background-color:#ffffff;border:1px solid #e2e8f0;border-left:4px solid #059669;border-radius:8px;font-size:13px;line-height:1.5;">
            <strong>Giao Hỏa Tốc 2 Giờ & Đồng Kiểm:</strong> Nhận hàng thần tốc tại TP.HCM & Hà Nội, được kiểm tra hàng trước khi thanh toán.
          </div>
          <div style="padding:10px 14px;background-color:#ffffff;border:1px solid #e2e8f0;border-left:4px solid #f59e0b;border-radius:8px;font-size:13px;line-height:1.5;">
            <strong>1 Đổi 1 Trong 30 Ngày:</strong> Đổi mới miễn phí tận nơi nếu phát sinh bất kỳ lỗi phần cứng nào từ nhà sản xuất.
          </div>
          <div style="padding:10px 14px;background-color:#ffffff;border:1px solid #e2e8f0;border-left:4px solid #8b5cf6;border-radius:8px;font-size:13px;line-height:1.5;">
            <strong>Thanh Toán Linh Hoạt & Trả Góp 0%:</strong> Hỗ trợ VietQR Napas 24/7, thẻ tín dụng 25 ngân hàng, ví điện tử MoMo, VNPay.
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:30px 0 16px;">
        <a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:14px 34px;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;border-radius:12px;box-shadow:0 6px 18px rgba(37,99,235,0.35);letter-spacing:0.3px;">
          Khám Phá Sản Phẩm & Mua Sắm Ngay →
        </a>
      </div>
      <p style="text-align:center;font-size:12px;color:#94a3b8;margin:0 0 20px;">
        Áp dụng ngay mã <strong>${escapeHtml(voucherCode)}</strong> để nhận ưu đãi đơn hàng đầu tiên!
      </p>

    </div>

    <!-- Contact & Footer -->
    <div style="background-color:#0f172a;color:#94a3b8;padding:24px 20px;text-align:center;font-size:12px;line-height:1.7;border-top:1px solid #1e293b;">
      <div style="font-weight:800;color:#ffffff;font-size:13px;margin-bottom:6px;">
        NOVASHOP VIỆT NAM — THƯƠNG MẠI ĐIỆN TỬ & THANH TOÁN SỐ
      </div>
      <div>• Địa chỉ: 219/20 đường số 12, phường Bình Hưng Hòa, TP. Hồ Chí Minh</div>
      <div>• Hotline CSKH 24/7: <strong style="color:#ffffff;">0908 061 843</strong> • Email hỗ trợ: <strong style="color:#ffffff;">support@novashop.vn</strong></div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #1e293b;font-size:11px;color:#64748b;">
        Email này được gửi tự động qua <strong>Google Apps Script</strong> khi bạn đăng nhập tài khoản lần đầu trên hệ thống NovaShop.
      </div>
    </div>

  </div>
</body>
</html>`;

  return {
    toEmail,
    subject,
    htmlBody,
    voucherCode,
  };
}

export interface SendWelcomeEmailResult {
  ok: boolean;
  sentTo: string;
  message: string;
  gasUrlUsed?: string;
  alreadySent?: boolean;
  emailSent?: boolean;
  permissionDenied?: boolean;
  needsScriptUpdate?: boolean;
}

/**
 * Sends welcome email to user via Google Apps Script (proxy route with browser fallback)
 */
export async function sendWelcomeEmail(
  user: UserProfile,
  options?: {
    gasUrl?: string;
    force?: boolean;
    isTest?: boolean;
    voucherCode?: string;
  }
): Promise<SendWelcomeEmailResult> {
  const toEmail = (user.email || '').trim();
  const userId = user.id || 'user-' + Date.now();

  if (!toEmail || !toEmail.includes('@')) {
    return {
      ok: false,
      sentTo: toEmail,
      message: 'Địa chỉ email người dùng không hợp lệ.',
    };
  }

  // Check if auto-send is enabled (unless test or force)
  if (!options?.isTest && !options?.force && !isAutoWelcomeEmailEnabled()) {
    return {
      ok: true,
      sentTo: toEmail,
      message: 'Tính năng tự động gửi email chào mừng đang tạm tắt trong cài đặt.',
      alreadySent: true,
    };
  }

  // Check if already sent (unless force is requested)
  if (!options?.force && !options?.isTest && checkIfWelcomeEmailSent(userId, toEmail)) {
    return {
      ok: true,
      sentTo: toEmail,
      message: 'Email chào mừng đã được gửi tới người dùng này trước đó.',
      alreadySent: true,
    };
  }

  const payload = buildWelcomeEmailPayload(user, {
    voucherCode: options?.voucherCode || 'WELCOME100',
  });

  const configuredGasUrl = (options?.gasUrl || getConfiguredWelcomeGasUrl()).trim();

  const requestBody = {
    action: 'sendWelcomeEmail',
    toEmail: payload.toEmail,
    recipientEmail: payload.toEmail,
    email: payload.toEmail,
    subject: payload.subject,
    htmlBody: payload.htmlBody,
    fullName: user.fullName,
    userId,
    memberTier: user.memberTier,
    novaPoints: user.novaPoints,
    voucherCode: payload.voucherCode,
    gasUrl: configuredGasUrl,
  };

  // Attempt 1: Server proxy route (handles 302 redirects from Google Apps Script seamlessly)
  try {
    const resp = await fetch('/api/auth/send-welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.ok) {
        if (!options?.isTest) {
          markWelcomeEmailSent(userId, toEmail);
        }
        saveWelcomeEmailLog({
          userId,
          email: toEmail,
          fullName: user.fullName,
          sentAt: new Date().toISOString(),
          success: true,
          message: data.message || `Đã gửi email chào mừng tới ${toEmail} qua Google Apps Script.`,
          gasUrlUsed: data.gasUrlUsed || configuredGasUrl,
          isTest: options?.isTest,
        });

        return {
          ok: true,
          emailSent: true,
          sentTo: toEmail,
          message: data.message || `Đã gửi thư chào mừng & mã quà tặng tới ${toEmail}!`,
          gasUrlUsed: data.gasUrlUsed || configuredGasUrl,
        };
      }
    }
  } catch (err) {
    console.warn('Server proxy welcome email error, attempting browser direct fallback:', err);
  }

  // Attempt 2: Direct browser POST with no-cors and text/plain (avoids preflight while passing JSON to e.postData.contents)
  try {
    await fetch(configuredGasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(requestBody),
    });

    if (!options?.isTest) {
      markWelcomeEmailSent(userId, toEmail);
    }
    saveWelcomeEmailLog({
      userId,
      email: toEmail,
      fullName: user.fullName,
      sentAt: new Date().toISOString(),
      success: true,
      message: `Đã gửi lệnh chào mừng tới ${toEmail} qua Google Apps Script (Direct Web App).`,
      gasUrlUsed: configuredGasUrl,
      isTest: options?.isTest,
    });

    return {
      ok: true,
      emailSent: true,
      sentTo: toEmail,
      message: `Đã gửi thư chào mừng & quà tặng thành viên mới tới ${toEmail} qua Google Apps Script!`,
      gasUrlUsed: configuredGasUrl,
    };
  } catch (directErr) {
    const errorMsg = directErr instanceof Error ? directErr.message : 'Không thể kết nối Google Apps Script.';
    saveWelcomeEmailLog({
      userId,
      email: toEmail,
      fullName: user.fullName,
      sentAt: new Date().toISOString(),
      success: false,
      message: errorMsg,
      gasUrlUsed: configuredGasUrl,
      isTest: options?.isTest,
    });

    return {
      ok: false,
      sentTo: toEmail,
      message: `Lỗi khi kết nối tới Google Apps Script: ${errorMsg}`,
      gasUrlUsed: configuredGasUrl,
    };
  }
}

/**
 * Convenience wrapper for sending welcome email via Google Apps Script with individual arguments
 */
export async function sendWelcomeEmailViaGas(
  recipientEmail: string,
  recipientName?: string,
  voucherCode?: string
): Promise<SendWelcomeEmailResult> {
  const dummyUser: UserProfile = {
    id: 'user-' + Date.now(),
    fullName: recipientName || 'Khách hàng',
    email: recipientEmail,
    phone: '',
    memberTier: 'Bronze',
    novaPoints: 1000,
    joinedDate: new Date().toLocaleDateString('vi-VN'),
  };
  return await sendWelcomeEmail(dummyUser, {
    force: true,
    voucherCode: voucherCode || 'WELCOME100',
  });
}

/**
 * Complete, ready-to-paste Google Apps Script code for Code.gs
 */
export const GOOGLE_APPS_SCRIPT_WELCOME_CODE = `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT - TỰ ĐỘNG GỬI EMAIL CHÀO MỪNG ĐĂNG NHẬP LẦN ĐẦU NOVASHOP
 * ==============================================================================
 * 
 * HƯỚNG DẪN CẤU HÌNH NHANH (Chỉ mất 2 phút, HOÀN TOÀN MIỄN PHÍ - 0đ):
 * 1. Truy cập https://script.google.com và nhấn "+ Dự án mới" (New project).
 * 2. Đặt tên dự án: "NovaShop Welcome Email Webhook".
 * 3. Xóa code mặc định trong file "Code.gs", dán toàn bộ đoạn code bên dưới vào.
 * 4. Nhấn phím Ctrl + S (hoặc Cmd + S trên Mac) để lưu file.
 * 5. Nhấn nút "Triển khai" (Deploy) màu xanh ở góc trên bên phải -> Chọn "Tùy chọn triển khai mới" (New deployment).
 * 6. Bấm vào biểu tượng bánh răng ở mục "Chọn loại" -> Chọn "Ứng dụng web" (Web app).
 * 7. Thiết lập thông số:
 *    • Mô tả: "NovaShop Welcome & Order Email Service"
 *    • Thực thi dưới dạng (Execute as): "Tôi" (Me - địa chỉ Gmail của bạn)
 *    • Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)  <-- CỰC KỲ QUAN TRỌNG!
 * 8. Nhấn "Triển khai" (Deploy) -> Nhấn "Ủy quyền truy cập" (Authorize access) -> Chọn tài khoản Gmail -> Nhấn "Advanced" -> "Go to NovaShop... (unsafe)" -> Nhấn "Allow".
 * 9. Sao chép "URL ứng dụng web" (kết thúc bằng /exec) và dán vào ô Cấu hình trên website NovaShop!
 * ==============================================================================
 */

function doPost(e) {
  try {
    // 1. Nhận và phân tích dữ liệu JSON gửi từ NovaShop
    var rawContent = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = JSON.parse(rawContent);

    var toEmail = String(data.toEmail || data.recipientEmail || data.email || "").trim();
    var action = data.action || "sendWelcomeEmail";
    var subject = data.subject;
    var htmlBody = data.htmlBody;

    // Kiểm tra định dạng email hợp lệ
    if (!toEmail || toEmail.indexOf("@") === -1) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: "Địa chỉ email người nhận không hợp lệ." })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. XỬ LÝ 1: GỬI EMAIL CHÀO MỪNG ĐĂNG NHẬP LẦN ĐẦU (WELCOME EMAIL)
    if (action === "sendWelcomeEmail" || !subject) {
      var fullName = data.fullName || "Quý khách";
      var memberTier = data.memberTier || "Bronze";
      var novaPoints = data.novaPoints || 1000;
      var voucherCode = data.voucherCode || "WELCOME100";

      var emailSubject = subject || (
        "🎉 [NovaShop] Chào mừng " + fullName + " gia nhập NovaShop! Tặng bạn Voucher 100K & " + novaPoints + " NovaPoints"
      );

      // Nếu hệ thống không truyền sẵn HTML, dùng template dự phòng
      var emailHtml = htmlBody || generateFallbackWelcomeHtml(fullName, toEmail, memberTier, novaPoints, voucherCode);

      // Gửi thư bằng MailApp của Google Apps Script (hạn mức 100 thư/ngày với Gmail thường, 1500 thư/ngày với Google Workspace)
      MailApp.sendEmail({
        to: toEmail,
        subject: emailSubject,
        htmlBody: emailHtml,
        name: "NovaShop Việt Nam - Chăm Sóc Khách Hàng",
        replyTo: "support@novashop.vn"
      });

      // Tùy chọn: Ghi nhật ký vào Google Sheets tự động nếu bạn muốn theo dõi
      logToGoogleSheet(toEmail, fullName, "WELCOME_EMAIL_FIRST_LOGIN");

      return ContentService.createTextOutput(
        JSON.stringify({
          ok: true,
          emailSent: true,
          action: "sendWelcomeEmail",
          sentTo: toEmail,
          message: "Đã gửi email chào mừng thành công tới " + toEmail
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. XỬ LÝ 2: GỬI HÓA ĐƠN ĐIỆN TỬ & XÁC NHẬN ĐƠN HÀNG (ORDER CONFIRMATION)
    if (action === "sendOrderConfirmationEmail" && htmlBody) {
      var orderSubject = subject || ("[NovaShop] Xác nhận đơn hàng #" + (data.orderId || ""));
      MailApp.sendEmail({
        to: toEmail,
        subject: orderSubject,
        htmlBody: htmlBody,
        name: "NovaShop Việt Nam - Hóa Đơn Điện Tử",
        replyTo: "support@novashop.vn"
      });

      return ContentService.createTextOutput(
        JSON.stringify({
          ok: true,
          emailSent: true,
          action: "sendOrderConfirmationEmail",
          sentTo: toEmail
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. TRƯỜNG HỢP MẶC ĐỊNH CÓ HTMLBODY
    if (htmlBody) {
      MailApp.sendEmail({
        to: toEmail,
        subject: subject || "[NovaShop] Thông báo từ hệ thống",
        htmlBody: htmlBody,
        name: "NovaShop Việt Nam"
      });
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, emailSent: true, sentTo: toEmail })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: "Thiếu nội dung HTML hoặc action không hợp lệ." })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Hàm kiểm tra trạng thái hoạt động Web App khi truy cập bằng URL trình duyệt
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "online",
      service: "NovaShop Google Apps Script Email Service",
      description: "Webhook tự động gửi email chào mừng người dùng đăng nhập lần đầu và hóa đơn điện tử.",
      version: "2.0",
      time: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// Hàm ghi nhật ký vào Google Sheets (Tự động tạo Sheet nếu chưa có)
function logToGoogleSheet(email, fullName, eventType) {
  try {
    var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!activeSpreadsheet) return; // Nếu script độc lập (standalone), bỏ qua
    var sheet = activeSpreadsheet.getSheetByName("NhatKyEmail");
    if (!sheet) {
      sheet = activeSpreadsheet.insertSheet("NhatKyEmail");
      sheet.appendRow(["Thời gian", "Email nhận", "Họ tên", "Loại thông báo", "Trạng thái"]);
    }
    sheet.appendRow([new Date(), email, fullName, eventType, "Đã gửi thành công"]);
  } catch (e) {
    // Không chặn luồng chính nếu lỗi ghi sheet
  }
}

// Template HTML chào mừng dự phòng
function generateFallbackWelcomeHtml(fullName, email, memberTier, novaPoints, voucherCode) {
  return '<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">' +
    '<h2 style="color:#1e3a8a;">Chào mừng ' + fullName + ' gia nhập NovaShop! 🎉</h2>' +
    '<p>Cảm ơn bạn đã đăng nhập và kích hoạt tài khoản thành viên.</p>' +
    '<div style="background:#eff6ff;padding:16px;border-radius:8px;border:1px dashed #3b82f6;text-align:center;">' +
      '<p style="margin:0;font-size:12px;color:#1e40af;font-weight:bold;">QUÀ TẶNG THÀNH VIÊN MỚI</p>' +
      '<h3 style="color:#2563eb;margin:8px 0;">MÃ VOUCHER GIẢM 100.000₫: ' + voucherCode + '</h3>' +
      '<p style="margin:0;font-size:12px;color:#059669;">+ Tặng ngay ' + novaPoints + ' điểm thưởng NovaPoints vào tài khoản!</p>' +
    '</div>' +
    '<p style="margin-top:20px;font-size:13px;color:#64748b;">Hỗ trợ 24/7: Hotline 0908 061 843 | Email support@novashop.vn</p>' +
  '</div>';
}
`;
