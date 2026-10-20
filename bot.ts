/**
 * Tiến trình Telegram Bot OTP độc lập cho NovaShop
 * Chạy long polling (getUpdates), tương tác trực tiếp với cơ sở dữ liệu SQLite
 * 
 * Lệnh chạy: npm run bot (hoặc tsx bot.ts)
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import {
  getSessionByToken,
  getLatestPendingSessionByTelegramUserId,
  getLatestPendingSession,
  linkTelegramUserToSession,
  saveOtpHashForSession,
  markSessionFailed,
  markSessionExpired,
  normalizePhoneToE164,
} from './src/db/sqliteDb.ts';

// Bắt lỗi toàn cục để tiến trình bot không bao giờ bị dừng ngoài ý muốn
process.on('uncaughtException', (err) => {
  console.error('[Bot Global Error] uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Bot Global Error] unhandledRejection:', reason);
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ Lỗi: TELEGRAM_BOT_TOKEN chưa được cấu hình trong biến môi trường (.env)!');
  process.exit(1);
}

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: { id: number; type: string };
  date: number;
  text?: string;
  contact?: TelegramContact;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

/**
 * Gửi yêu cầu đến Telegram Bot API với xử lý lỗi mạng và timeout an toàn
 */
async function callTelegramApi(method: string, body?: Record<string, unknown>, timeoutMs: number = 35000): Promise<any> {
  const url = `${TELEGRAM_API_BASE}/${method}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: { ok: boolean; result?: any; error_code?: number; description?: string };
    try {
      data = JSON.parse(text);
    } catch {
      console.warn(`[Telegram API] Phản hồi không phải JSON hợp lệ từ ${method}:`, text.slice(0, 150));
      return { ok: false, error: 'Non-JSON response' };
    }

    if (!data.ok) {
      if (data.error_code === 403) {
        console.warn(`[Telegram API] 403 Forbidden: Người dùng đã chặn bot. Chi tiết: ${data.description}`);
      } else if (data.error_code === 429) {
        console.warn(`[Telegram API] 429 Too Many Requests: Đang chờ giảm tải...`);
      } else if (data.error_code === 409) {
        console.warn(`[Telegram API] 409 Conflict: Có tiến trình bot khác đang chạy song song.`);
      } else {
        console.error(`[Telegram API] Lỗi ${data.error_code}: ${data.description}`);
      }
    }
    return data;
  } catch (err: unknown) {
    const isAbort = (err as Error)?.name === 'AbortError';
    if (!isAbort) {
      console.error(`[Telegram API Network Error] Thao tác ${method} thất bại:`, err instanceof Error ? err.message : String(err));
    }
    return { ok: false, error: String(err) };
  }
}

/**
 * Gửi tin nhắn cho người dùng qua Telegram
 */
async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<any> {
  return await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: replyMarkup,
  });
}

/**
 * Xử lý lệnh /start <token>
 */
async function handleStartCommand(message: TelegramMessage, tokenParam: string): Promise<void> {
  const chatId = message.chat.id;
  const fromUser = message.from;
  const rawText = message.text || '';

  // Tra cứu token trong DB
  let session = tokenParam ? getSessionByToken(tokenParam) : null;

  // Fallback thông minh: nếu không có tokenParam hoặc token không khớp nhưng đang có phiên pending chờ
  if (!session) {
    session = getLatestPendingSession();
    if (session) {
      console.log(`[Bot /start] msg="${rawText}", using fallback latest pending session token="${session.token}", phone="${session.phone}"`);
    }
  }

  if (!session) {
    console.log(`[Bot /start] msg="${rawText}", token="${tokenParam}", result=NOT_FOUND`);
    await sendMessage(
      chatId,
      '❌ **Mã phiên xác thực không tồn tại**.\n\n' +
      'Liên kết có thể đã cũ hoặc không hợp lệ. Vui lòng quay lại website NovaShop, nhập số điện thoại và bấm **"Mở Telegram để nhận mã OTP ngay"**.'
    );
    return;
  }

  if (session.status === 'cancelled') {
    console.log(`[Bot /start] msg="${rawText}", token="${tokenParam}", result=CANCELLED`);
    await sendMessage(
      chatId,
      '⚠️ **Phiên xác thực này đã bị hủy** do bạn đã đổi số điện thoại hoặc yêu cầu phiên mới. Vui lòng sử dụng liên kết mới nhất từ website.'
    );
    return;
  }

  if (session.status === 'verified') {
    console.log(`[Bot /start] msg="${rawText}", token="${tokenParam}", result=ALREADY_VERIFIED`);
    await sendMessage(
      chatId,
      '✅ **Số điện thoại này đã được xác thực thành công** trước đó. Bạn không cần làm lại.'
    );
    return;
  }

  if (session.status === 'failed') {
    console.log(`[Bot /start] msg="${rawText}", token="${tokenParam}", result=FAILED_SESSION`);
    await sendMessage(
      chatId,
      '❌ **Phiên xác thực đã bị khóa** do không khớp thông tin. Vui lòng quay lại website và bấm "Gửi lại mã".'
    );
    return;
  }

  if (session.expires_at < Date.now()) {
    console.log(`[Bot /start] msg="${rawText}", token="${tokenParam}", result=EXPIRED`);
    await sendMessage(
      chatId,
      '⏳ **Phiên xác thực đã hết hạn** (hiệu lực 5 phút).\n\nVui lòng quay lại website NovaShop và nhấn nút **"Gửi lại mã xác thực"**.'
    );
    return;
  }

  // Ghi nhận telegram_user_id vào phiên
  linkTelegramUserToSession(tokenParam, fromUser.id);
  console.log(`[Bot /start] msg="${rawText}", token="${tokenParam}", result=LINKED_TELEGRAM_USER (${fromUser.id})`);

  // Gửi nút chia sẻ danh bạ
  const shareContactKeyboard = {
    keyboard: [
      [{ text: '📱 Chia sẻ số điện thoại', request_contact: true }],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  };

  await sendMessage(
    chatId,
    `👋 Xin chào **${fromUser.first_name}**!\n\n` +
    `Hệ thống NovaShop đã nhận được yêu cầu xác thực cho số điện thoại: **${session.phone}**.\n\n` +
    `👉 Vui lòng nhấn nút **"📱 Chia sẻ số điện thoại"** bên dưới để bot đối chiếu số chính chủ và gửi mã OTP cho bạn.`,
    shareContactKeyboard
  );
}

/**
 * Xử lý khi người dùng bấm nút chia sẻ danh bạ (contact)
 */
async function handleContactMessage(message: TelegramMessage, contact: TelegramContact): Promise<void> {
  const chatId = message.chat.id;
  const fromUser = message.from;

  // Tra cứu phiên pending mới nhất của người dùng này
  const session = getLatestPendingSessionByTelegramUserId(fromUser.id);

  // Gỡ bàn phím chia sẻ danh bạ
  const removeKeyboard = { remove_keyboard: true };

  if (!session) {
    console.log(`[Bot contact] telegram_user_id=${fromUser.id}, result=NO_ACTIVE_PENDING_SESSION`);
    await sendMessage(
      chatId,
      '❌ Không tìm thấy phiên xác thực đang chờ nào của bạn, hoặc phiên đã hết hạn.\n\n' +
      'Vui lòng quay lại website NovaShop và bấm **"Gửi lại mã xác thực"**.',
      removeKeyboard
    );
    return;
  }

  const rawContactPhone = contact.phone_number;
  const normalizedContactPhone = normalizePhoneToE164(rawContactPhone);
  const expectedPhone = session.phone;

  console.log(`[Bot contact] telegram_user_id=${fromUser.id}, expected_phone=${expectedPhone}, contact.phone_number=${rawContactPhone}`);

  // Điều kiện 1: contact.user_id == from.id (chống chuyển tiếp danh bạ người khác)
  if (!contact.user_id || contact.user_id !== fromUser.id) {
    console.log(`[Bot contact] FAILED: Contact user_id mismatch (contact.user_id=${contact.user_id}, from.id=${fromUser.id})`);
    markSessionFailed(session.token);
    await sendMessage(
      chatId,
      '🚫 **Xác thực thất bại!**\n\n' +
      'Bạn phải chia sẻ chính số điện thoại tài khoản Telegram của mình (bấm trực tiếp nút trên bàn phím), không được chuyển tiếp danh bạ của người khác.',
      removeKeyboard
    );
    return;
  }

  // Điều kiện 2: số trong contact == số đã đăng ký trên web
  if (normalizedContactPhone !== expectedPhone) {
    console.log(`[Bot contact] FAILED: Phone mismatch (contact=${normalizedContactPhone}, expected=${expectedPhone})`);
    markSessionFailed(session.token);
    await sendMessage(
      chatId,
      `🚫 **Số điện thoại không khớp!**\n\n` +
      `Số điện thoại Telegram của bạn là **${normalizedContactPhone}**, trong khi số bạn vừa nhập trên website là **${expectedPhone}**.\n\n` +
      `Vui lòng quay lại website, chọn **"Đổi số điện thoại"** và nhập đúng số gắn với tài khoản Telegram này.`,
      removeKeyboard
    );
    return;
  }

  // Điều kiện 3: phiên chưa hết hạn
  if (session.expires_at < Date.now()) {
    console.log(`[Bot contact] FAILED: Session expired`);
    markSessionExpired(session.token);
    await sendMessage(
      chatId,
      '⏳ **Phiên xác thực đã hết hạn** (5 phút). Vui lòng quay lại website và bấm "Gửi lại mã xác thực".',
      removeKeyboard
    );
    return;
  }

  // Sinh mã OTP 6 số an toàn bằng bộ sinh số ngẫu nhiên mật mã (CSPRNG)
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const otpHashed = crypto.createHash('sha256').update(otpCode).digest('hex');

  // Lưu bản HASH vào DB (tuyệt đối KHÔNG lưu mã rõ vào DB)
  saveOtpHashForSession(session.token, otpHashed);

  // Gửi mã OTP vào chat Telegram cho người dùng
  const formattedCode = `${otpCode.slice(0, 3)} ${otpCode.slice(3)}`;
  await sendMessage(
    chatId,
    `🔐 **NovaShop Verification Service**\n\n` +
    `Mã OTP xác thực của bạn là: **\`${formattedCode}\`**\n` +
    `⏰ Hiệu lực trong **5 phút**.\n\n` +
    `*Lưu ý: Tuyệt đối không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản.*`,
    removeKeyboard
  );

  console.log(`[Bot contact] SUCCESS: Dispatched 6-digit OTP to user ${fromUser.id} for session ${session.token}`);
}

/**
 * Xử lý từng update từ Telegram
 */
async function processUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message) return;

  // Xử lý contact trước (nếu người dùng gửi danh bạ)
  if (message.contact) {
    await handleContactMessage(message, message.contact);
    return;
  }

  // Xử lý tin nhắn text
  const text = message.text ? message.text.trim() : '';
  if (text.startsWith('/start')) {
    const parts = text.split(/\s+/);
    const tokenParam = parts[1] ? parts[1].trim() : '';
    await handleStartCommand(message, tokenParam);
    return;
  }

  // Phản hồi mặc định nếu người dùng gõ tin nhắn bất kỳ khác
  await sendMessage(
    message.chat.id,
    '🤖 Tôi là bot xác thực OTP của **NovaShop**.\n' +
    'Vui lòng truy cập website NovaShop để tiến hành xác thực tài khoản của bạn.'
  );
}

/**
 * Vòng lặp Long Polling nhận tin nhắn
 */
async function runBotPolling(): Promise<void> {
  console.log('🤖 Đang khởi động Telegram Bot Long Polling cho NovaShop...');

  // 1. Xóa webhook trước (nếu có) để tránh xung đột 409 Conflict
  const deleteWebhookRes = await callTelegramApi('deleteWebhook', { drop_pending_updates: false }, 10000);
  console.log('[Telegram Bot] deleteWebhook result:', deleteWebhookRes?.ok ? 'OK' : deleteWebhookRes);

  // 2. Kiểm tra thông tin bot qua getMe
  const meRes = await callTelegramApi('getMe', undefined, 10000);
  if (meRes?.ok && meRes.result) {
    console.log(`✅ Kết nối Telegram Bot thành công: @${meRes.result.username} (ID: ${meRes.result.id}, Tên: "${meRes.result.first_name}")`);
  } else {
    console.warn('⚠️ Cảnh báo getMe không thành công. Vui lòng kiểm tra lại TELEGRAM_BOT_TOKEN.');
  }

  let offset = 0;

  // 3. Vòng lặp Polling liên tục
  while (true) {
    try {
      const updatesRes = await callTelegramApi('getUpdates', {
        offset,
        timeout: 25,
        allowed_updates: ['message'],
      }, 35000);

      if (updatesRes?.ok && Array.isArray(updatesRes.result)) {
        for (const update of updatesRes.result as TelegramUpdate[]) {
          offset = Math.max(offset, update.update_id + 1);
          await processUpdate(update);
        }
      } else if (updatesRes?.error_code === 409) {
        console.warn('⚠️ Gặp lỗi 409 Conflict: Có tiến trình khác đang gọi getUpdates. Chờ 10s trước khi thử lại...');
        await new Promise((r) => setTimeout(r, 10000));
      } else {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err: unknown) {
      console.error('[Bot Polling Error]:', err instanceof Error ? err.message : String(err));
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

// Khởi chạy vòng lặp với khả năng tự phục hồi
export async function startResilientBot(): Promise<void> {
  console.log('🤖 Đang khởi động Telegram Bot Long Polling cho NovaShop...');
  while (true) {
    try {
      await runBotPolling();
    } catch (err) {
      console.error('[Fatal Bot Polling Loop Error, restarting in 5s]:', err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

// Nếu chạy trực tiếp qua dòng lệnh: npm run bot / tsx bot.ts
const isDirectCliRun = process.argv[1] && (process.argv[1].endsWith('bot.ts') || process.argv[1].endsWith('bot.js'));
if (isDirectCliRun) {
  startResilientBot();
}
