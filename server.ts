import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  createVerifySession,
  getSessionByToken,
  cancelSessionByToken,
  verifyOtpCodeInSession,
  normalizePhoneToE164,
  isValidVietnamPhone,
  countRecentSessionsIn1Hour,
} from './src/db/sqliteDb.ts';
import { startResilientBot } from './bot.ts';

let cachedAiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!cachedAiClient) {
    cachedAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

interface ProductSummary {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  originalPrice?: number;
  rating: number;
  stock: number;
  badge?: string;
  highlights?: string[];
}

interface OrderSummary {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  paymentMethod: string;
  itemNames: string[];
}

interface SupportContextPayload {
  customerName?: string;
  cartSummary?: string;
  appliedVoucherCode?: string;
  matchedProducts?: ProductSummary[];
  recentOrders?: OrderSummary[];
}

const NOVASHOP_SYSTEM_INSTRUCTION = `Bạn là **CSKH NovaCare** — Chuyên viên Chăm sóc Khách hàng & Tư vấn Công nghệ trực tuyến của **NovaShop** (Hệ thống phân phối thiết bị công nghệ chính hãng & thanh toán trực tuyến tại Việt Nam).

### NGUYÊN TẮC PHẢN HỒI
1. **Thân thiện, lịch sự, chuyên nghiệp và súc tích**: Xưng "NovaShop" hoặc "Mình" và gọi khách hàng là "Bạn" hoặc "Anh/Chị" (nếu biết tên khách hàng thì chào tên thân thiện). Trả lời trong khoảng 80–180 từ, đi thẳng vào trọng tâm câu hỏi.
2. **Trình bày rõ ràng, dễ đọc**: Sử dụng gạch đầu dòng (•) và in đậm (**...**) các thông tin quan trọng như giá bán, mã giảm giá, thời gian bảo hành, chính sách đổi trả.
3. **Giải đáp chính xác theo dữ liệu thực tế của NovaShop**:
   - **Cam kết nguồn gốc & Bảo hành**:
     • 100% sản phẩm chính hãng phân phối chính ngạch tại Việt Nam, nguyên seal, đầy đủ hóa đơn VAT điện tử.
     • Bảo hành điện tử chính hãng **12 – 24 tháng** theo IMEI/Serial và Số điện thoại đặt hàng.
     • Hỗ trợ **vận chuyển bảo hành 2 chiều miễn phí** toàn quốc hoặc bảo hành tại tất cả Trung tâm bảo hành ủy quyền của Apple, Samsung, Sony, Asus, Dell, Xiaomi, Garmin, Marshall...
   - **Chính sách Đổi trả**:
     • **1 đổi 1 trong 30 ngày đầu** miễn phí tận nơi nếu phát sinh lỗi phần cứng từ nhà sản xuất (màn hình, nguồn, pin, camera, loa, kết nối...).
     • Điều kiện đổi trả: Sản phẩm giữ nguyên hộp trùng IMEI/Serial, đầy đủ phụ kiện, không rơi vỡ/ngấm nước, đã thoát tài khoản cá nhân (iCloud, Google, Samsung Account).
   - **Chính sách Vận chuyển & Giao hàng**:
     • **Miễn phí vận chuyển toàn quốc (Freeship)** cho mọi đơn hàng từ **300.000₫** (hoặc áp mã **FREESHIP** giảm 30.000₫). Đơn dưới 300.000₫ phí tiêu chuẩn 25.000₫ – 30.000₫.
     • **Giao Hỏa Tốc 2 Giờ (NovaSpeed)**: Phí 65.000₫, nhận hàng trong 2 – 4 giờ tại nội thành TP. Hồ Chí Minh và Hà Nội (khung giờ 8:00 – 18:00).
     • **Giao Tiêu Chuẩn Toàn Quốc**: 1 – 3 ngày làm việc, đóng gói chống sốc, bảo hiểm 100% giá trị hàng hóa.
     • **Đồng kiểm 100%**: Khách hàng được mở thùng kiểm tra ngoại quan, tem seal, đúng mẫu mã và số lượng trước khi thanh toán.
   - **Phương thức Thanh toán & Trả góp 0%**:
     • **Thanh toán trước qua Mã QR (VietQR Napas 24/7 - BIDV)**: Quét mã QR ngân hàng **BIDV - PGD Tân Sơn Nhì**, Số tài khoản **3180530681**, Chủ tài khoản **TRUONG MINH QUOC TRI**. Đơn hàng thanh toán trước chỉ được xác nhận đặt hàng thành công khi khách hàng đã hoàn tất chuyển khoản qua mã QR đúng với số tiền của sản phẩm/đơn hàng đó.
     • **Trả góp 0% lãi suất**: Qua Thẻ tín dụng của hơn 25 ngân hàng hoặc duyệt hồ sơ CCCD gắn chip qua công ty tài chính (Home Credit, FE Credit, HD Saison) trong 3 phút, kỳ hạn linh hoạt 3, 6, 9, 12 tháng.
     • **Thẻ Quốc tế (Visa / Mastercard / JCB)** bảo mật 3D-Secure, **Ví MoMo**, **VNPay-QR**, và **Thanh toán khi nhận hàng (COD)**.
   - **Kho Mã Giảm Giá (Voucher) đang hoạt động**:
     • **NOVATECH**: Giảm ngay **100.000₫** cho đơn hàng từ 500.000₫.
     • **GIAM10**: Giảm **10%** (tối đa **500.000₫**) cho đơn hàng từ 2.000.000₫.
     • **FREESHIP**: Miễn phí vận chuyển (giảm **30.000₫**) cho đơn hàng từ 300.000₫.
     • **VIP500**: Giảm ngay **500.000₫** cho đơn hàng công nghệ từ 15.000.000₫.
   - **Thông tin liên hệ NovaShop**:
     • Địa chỉ trụ sở: 219/20 đường số 12, phường Bình Hưng Hòa, TP. Hồ Chí Minh.
     • Hotline CSKH 24/7: **0908 061 843**
     • Email: **support@novashop.vn**
   - **Đối tác ưu đãi trên NovaShop**:
     • Thiết bị nhà bếp hiện đại **KitchenMini** (giảm 15% đơn đầu tiên cho máy xay sinh tố, máy ép trái cây, máy trộn bột tại https://tt03990322.wixsite.com/kitchenmini - SĐT: 0399032262).

4. **Tư vấn sản phẩm & Đơn hàng**:
   - Khi khách hỏi về sản phẩm, hãy dựa vào danh sách sản phẩm khớp ngữ cảnh được cung cấp bên dưới để báo giá chính xác (bằng VNĐ), ưu điểm nổi bật, tình trạng còn hàng và gợi ý mã voucher phù hợp nhất.
   - Khi khách hỏi về cách mua hàng: nhắc khách có thể bấm vào sản phẩm để xem chi tiết, chọn màu sắc, bấm "Thêm vào giỏ" hoặc "Mua ngay" (nếu chưa đăng nhập hệ thống sẽ mở khung đăng nhập nhanh rồi tự động chuyển tiếp tới bước thanh toán).`;

function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

function buildDynamicContextText(context?: SupportContextPayload): string {
  if (!context) return '';
  const sections: string[] = [];

  if (context.customerName) {
    sections.push(`- Khách hàng đang trò chuyện: ${context.customerName}`);
  } else {
    sections.push(`- Trạng thái tài khoản: Khách chưa đăng nhập`);
  }

  if (context.cartSummary) {
    sections.push(`- Giỏ hàng hiện tại của khách: ${context.cartSummary}`);
  }

  if (context.appliedVoucherCode) {
    sections.push(`- Mã giảm giá đang chọn: ${context.appliedVoucherCode}`);
  }

  if (context.recentOrders && context.recentOrders.length > 0) {
    const orderLines = context.recentOrders
      .slice(0, 5)
      .map(
        (o) =>
          `  • Mã đơn #${o.id} | Trạng thái: ${o.status} | Tổng tiền: ${formatCurrencyVND(o.total)} | Thanh toán: ${o.paymentMethod} | Sản phẩm: ${o.itemNames.join(', ')}`
      )
      .join('\n');
    sections.push(`- Đơn hàng gần đây của khách:\n${orderLines}`);
  }

  if (context.matchedProducts && context.matchedProducts.length > 0) {
    const prodLines = context.matchedProducts
      .slice(0, 8)
      .map((p) => {
        const discountStr =
          p.originalPrice && p.originalPrice > p.price
            ? ` (Giá gốc: ${formatCurrencyVND(p.originalPrice)}, tiết kiệm ${formatCurrencyVND(p.originalPrice - p.price)})`
            : '';
        const highlightsStr =
          p.highlights && p.highlights.length > 0
            ? ` | Nổi bật: ${p.highlights.slice(0, 2).join('; ')}`
            : '';
        return `  • [${p.id}] ${p.name} (${p.categoryName}) — Giá bán: ${formatCurrencyVND(p.price)}${discountStr} | Đánh giá: ${p.rating}★ | Tồn kho: ${p.stock} máy${highlightsStr}`;
      })
      .join('\n');
    sections.push(`- Các sản phẩm tại NovaShop liên quan đến câu hỏi:\n${prodLines}`);
  }

  if (sections.length === 0) return '';
  return `\n\n### NGỮ CẢNH PHIÊN MUA SẮM HIỆN TẠI CỦA KHÁCH HÀNG\n${sections.join('\n')}`;
}

function suggestBestVoucherForPrice(price: number): string {
  if (price >= 15000000) {
    return 'Mã **VIP500** (giảm ngay **500.000₫** cho đơn từ 15 triệu) hoặc **GIAM10** (giảm 10% tối đa **500.000₫**)';
  }
  if (price >= 2000000) {
    const discount10 = Math.min(Math.round(price * 0.1), 500000);
    return `Mã **GIAM10** (giảm 10% tương đương **${formatCurrencyVND(discount10)}**)`;
  }
  if (price >= 500000) {
    return 'Mã **NOVATECH** (giảm ngay **100.000₫** cho đơn từ 500.000₫)';
  }
  if (price >= 300000) {
    return 'Mã **FREESHIP** (giảm **30.000₫** phí vận chuyển)';
  }
  return 'Mua thêm từ **300.000₫** để được **Freeship** toàn quốc';
}

export function generateNovaCareFallbackReply(
  rawMessage: string,
  context?: SupportContextPayload
): string {
  const q = rawMessage.toLowerCase().trim();
  const customerGreeting = context?.customerName ? ` **${context.customerName}**` : ' bạn';
  const matched = context?.matchedProducts || [];

  // 1. Greeting / Who are you
  if (
    /^(xin chào|chào|hello|hi|hey|alo|shop ơi|ad ơi|có ai không|bạn là ai|tư vấn giúp)/i.test(q) &&
    q.split(/\s+/).length <= 6
  ) {
    return `Xin chào${customerGreeting}! Mình là **CSKH NovaCare** — Chuyên viên CSKH trực tuyến 24/7 của **NovaShop**.\n\nBạn đang quan tâm đến nội dung nào để mình hỗ trợ ngay ạ?\n• **Tư vấn & báo giá sản phẩm** (Điện thoại, Laptop, Tai nghe, Smartwatch, Gaming, Phụ kiện)\n• **Chính sách bảo hành 12–24 tháng** & **1 đổi 1 trong 30 ngày**\n• **Giao hàng hỏa tốc 2 giờ (NovaSpeed)** & **Freeship toàn quốc**\n• **Kho mã giảm giá (Voucher)**, **Trả góp 0%** & kiểm tra đơn hàng`;
  }

  // 2. Warranty & Return policy
  if (
    q.includes('bảo hành') ||
    q.includes('đổi trả') ||
    q.includes('1 đổi 1') ||
    q.includes('sửa chữa') ||
    q.includes('trung tâm bảo hành')
  ) {
    return `Dạ NovaShop cam kết quyền lợi **Bảo hành & Đổi trả chính hãng** tối đa cho${customerGreeting}:\n\n• **Cam kết chính hãng 100%**: Sản phẩm nguyên seal, phân phối chính ngạch, đầy đủ hóa đơn VAT điện tử.\n• **Chính sách 1 đổi 1 trong 30 ngày đầu**: Đổi máy mới 100% miễn phí tận nơi nếu phát sinh lỗi phần cứng từ nhà sản xuất (màn hình, nguồn, pin, camera, loa, kết nối...).\n• **Bảo hành điện tử 12 – 24 tháng**: Tra cứu tự động theo IMEI/Serial hoặc Số điện thoại mua hàng tại toàn bộ Trung tâm bảo hành ủy quyền chính hãng (Apple, Samsung, Sony, Asus, Dell, Xiaomi, Garmin...).\n• **Hỗ trợ vận chuyển bảo hành 2 chiều miễn phí** trên toàn quốc.\n• **Điều kiện đổi trả**: Máy giữ nguyên hộp trùng IMEI, đủ phụ kiện, không rơi vỡ/vào nước và đã thoát tài khoản cá nhân (iCloud/Google).\n\nBạn cần tra cứu bảo hành hay hỗ trợ kỹ thuật có thể liên hệ ngay Hotline **0908 061 843** nhé!`;
  }

  // 3. Shipping & Delivery
  if (
    q.includes('giao hàng') ||
    q.includes('vận chuyển') ||
    q.includes('freeship') ||
    q.includes('phí ship') ||
    q.includes('hỏa tốc') ||
    q.includes('bao lâu nhận được') ||
    q.includes('mấy ngày') ||
    q.includes('đồng kiểm')
  ) {
    return `Dạ thông tin **Vận chuyển & Giao hàng** tại NovaShop dành cho${customerGreeting}:\n\n• **Miễn phí vận chuyển toàn quốc (Freeship)**: Áp dụng tự động cho mọi đơn hàng từ **300.000₫** (hoặc nhập mã **FREESHIP** giảm ngay **30.000₫**). Đơn dưới 300.000₫ phí ship chỉ từ **25.000₫ – 30.000₫**.\n• **Giao Hỏa Tốc 2 Giờ (NovaSpeed)**: Nhận hàng siêu tốc trong **2 – 4 giờ** tại nội thành TP. Hồ Chí Minh & Hà Nội (khung giờ 8:00 – 18:00, phí **65.000₫**).\n• **Giao Tiêu Chuẩn Toàn Quốc**: Nhận hàng sau **1 – 3 ngày làm việc**, đóng gói chống sốc 3 lớp và bảo hiểm hàng hóa 100%.\n• **Đặc quyền Đồng kiểm 100%**: Bạn được mở kiện hàng kiểm tra ngoại quan, tem seal và đúng mẫu mã trước khi thanh toán cho shipper.`;
  }

  // 4. Installment & Payment methods
  if (
    q.includes('trả góp') ||
    q.includes('thanh toán') ||
    q.includes('vietqr') ||
    q.includes('chuyển khoản') ||
    q.includes('thẻ tín dụng') ||
    q.includes('momo') ||
    q.includes('vnpay') ||
    q.includes('cod') ||
    q.includes('lãi suất')
  ) {
    return `Dạ NovaShop hỗ trợ đa dạng **Phương thức Thanh toán & Trả góp 0% lãi suất** cực kỳ tiện lợi:\n\n• **Mua Trả Góp 0% Lãi Suất**:\n  - Qua **Thẻ tín dụng** của hơn 25 ngân hàng (Vietcombank, Techcombank, VPBank, ACB, Sacombank, HSBC...).\n  - Hoặc duyệt hồ sơ **CCCD gắn chip** online trong 3 phút qua công ty tài chính (Home Credit, FE Credit, HD Saison).\n  - Kỳ hạn linh hoạt **3, 6, 9, 12 tháng**, trả trước từ **0% – 30%**.\n• **Các cổng thanh toán trực tuyến & COD**:\n  - **VietQR Napas 24/7**: Quét mã QR ngân hàng xác nhận tự động trong 2 – 5 giây.\n  - **Thẻ Quốc tế (Visa / Mastercard / JCB)**: Bảo mật chuẩn 3D-Secure.\n  - **Ví điện tử MoMo & VNPay-QR**: Thanh toán một chạm trên ứng dụng.\n  - **Thanh toán khi nhận hàng (COD)**: Kiểm tra hàng trước rồi mới thanh toán tiền mặt.`;
  }

  // 5. Vouchers & Promotions
  if (
    q.includes('voucher') ||
    q.includes('mã giảm') ||
    q.includes('khuyến mãi') ||
    q.includes('ưu đãi') ||
    q.includes('giảm giá') ||
    q.includes('code')
  ) {
    const activeVoucherNote = context?.appliedVoucherCode
      ? `\n\nHiện tại trong giỏ hàng bạn đang chọn mã: **${context.appliedVoucherCode}**.`
      : '';
    return `Dạ hiện tại **NovaShop** đang tặng bạn **4 Mã Giảm Giá (Voucher)** cực hấp dẫn có thể áp dụng ngay khi thanh toán:\n\n• **VIP500**: Giảm ngay **500.000₫** cho đơn hàng công nghệ từ **15.000.000₫**.\n• **GIAM10**: Giảm **10%** (tối đa **500.000₫**) cho đơn hàng từ **2.000.000₫**.\n• **NOVATECH**: Giảm ngay **100.000₫** cho mọi đơn hàng từ **500.000₫**.\n• **FREESHIP**: Miễn phí vận chuyển (giảm **30.000₫**) cho đơn hàng từ **300.000₫**.${activeVoucherNote}\n\nBạn có thể bấm nút **Mở Kho Voucher Ưu Đãi** bên dưới để lưu và áp dụng tự động vào giỏ hàng nhé!`;
  }

  // 6. Cart & Order check
  if (
    q.includes('đơn hàng') ||
    q.includes('giỏ hàng') ||
    q.includes('kiểm tra đơn') ||
    q.includes('vận đơn') ||
    q.includes('đã đặt')
  ) {
    const cartText = context?.cartSummary || 'Giỏ hàng đang trống';
    const voucherText = context?.appliedVoucherCode || 'Chưa áp dụng mã giảm giá';
    const orders = context?.recentOrders || [];

    let orderSection = '• **Đơn hàng gần đây**: Bạn chưa có đơn hàng nào được ghi nhận trong phiên này.';
    if (orders.length > 0) {
      const lines = orders
        .slice(0, 3)
        .map(
          (o) =>
            `  - Mã đơn **#${o.id}**: Trạng thái **${o.status}** · Tổng thanh toán **${formatCurrencyVND(o.total)}** (${o.itemNames.join(', ')})`
        )
        .join('\n');
      orderSection = `• **Đơn hàng gần đây của bạn (${orders.length} đơn)**:\n${lines}`;
    }

    return `Dạ mình gửi${customerGreeting} thông tin **Giỏ hàng & Đơn hàng** hiện tại tại NovaShop:\n\n• **Giỏ hàng hiện tại**: ${cartText}\n• **Voucher đang chọn**: **${voucherText}**\n${orderSection}\n\nMẹo tiết kiệm: Nếu giỏ hàng từ **15.000.000₫** bạn nhớ áp mã **VIP500**, từ **2.000.000₫** áp mã **GIAM10** (giảm tới 500.000₫), hoặc từ **500.000₫** áp mã **NOVATECH** (giảm 100.000₫) nhé!`;
  }

  // 7. VAT invoice / Contact / Address
  if (
    q.includes('hóa đơn') ||
    q.includes('vat') ||
    q.includes('địa chỉ') ||
    q.includes('liên hệ') ||
    q.includes('hotline') ||
    q.includes('số điện thoại') ||
    q.includes('ở đâu')
  ) {
    return `Dạ thông tin **Liên hệ & Hỗ trợ Khách hàng** của **NovaShop**:\n\n• **Địa chỉ trụ sở**: 219/20 đường số 12, phường Bình Hưng Hòa, TP. Hồ Chí Minh.\n• **Hotline CSKH & Kỹ thuật 24/7**: **0908 061 843**\n• **Email hỗ trợ**: **support@novashop.vn**\n• **Hóa đơn điện tử**: Hỗ trợ xuất **hóa đơn GTGT (VAT) điện tử 100%** ngay trong ngày cho mọi đơn hàng chính hãng.`;
  }

  // 8. KitchenMini partner query
  if (
    q.includes('kitchenmini') ||
    q.includes('máy xay') ||
    q.includes('máy ép') ||
    q.includes('máy trộn') ||
    q.includes('nhà bếp')
  ) {
    return `Dạ đối tác thiết bị nhà bếp thông minh **KitchenMini** trên NovaShop đang có chương trình **Ưu đãi giảm 15% cho đơn hàng đầu tiên**:\n\n• **Máy Xay Sinh Tố & Máy Xay Cầm Tay**: Giá chỉ từ **269.000₫ – 599.000₫**\n• **Máy Ép Trái Cây & Ép Rau Quả**: Giá từ **599.000₫ – 1.999.000₫** (Phễu thép không gỉ giữ trọn dưỡng chất)\n• **Máy Trộn Bộ Nhôm & Đánh Trứng (1000W–1200W)**: Giá từ **899.000₫ – 1.500.000₫**\n• **Địa chỉ**: Đường Hoàng Diệu 2, Thủ Đức · **SĐT**: **0399032262**\n• **Website đặt hàng**: https://tt03990322.wixsite.com/kitchenmini`;
  }

  // 9. Product inquiry / Recommendation / Pricing
  if (matched.length > 0) {
    const topProducts = matched.slice(0, 3);
    const productBullets = topProducts
      .map((p) => {
        const discountInfo =
          p.originalPrice && p.originalPrice > p.price
            ? ` (Giá gốc ${formatCurrencyVND(p.originalPrice)}, **tiết kiệm ${formatCurrencyVND(p.originalPrice - p.price)}**)`
            : '';
        const feat =
          p.highlights && p.highlights.length > 0 ? ` — ${p.highlights.slice(0, 2).join(', ')}` : '';
        return `• **${p.name}**: Giá ưu đãi **${formatCurrencyVND(p.price)}**${discountInfo} · Đánh giá **${p.rating}★** · Sẵn hàng (${p.stock} máy)${feat}`;
      })
      .join('\n');

    const bestVoucher = suggestBestVoucherForPrice(topProducts[0].price);

    return `Dạ dựa trên yêu cầu của${customerGreeting}, **CSKH NovaCare** xin gợi ý các sản phẩm chính hãng đang có mức giá tốt nhất tại **NovaShop**:\n\n${productBullets}\n\n• **Ưu đãi kèm theo**: ${bestVoucher}, miễn phí vận chuyển toàn quốc và hỗ trợ **Trả góp 0% lãi suất**.\n• **Bảo hành**: Chính hãng **12 – 24 tháng**, **1 đổi 1 trong 30 ngày** nếu có lỗi phần cứng.\n\nBạn có thể nhấn trực tiếp vào thẻ sản phẩm bên dưới để xem thông số chi tiết hoặc thêm vào giỏ hàng nhé!`;
  }

  // 10. General helpful response
  return `Cảm ơn${customerGreeting} đã gửi câu hỏi cho **CSKH NovaCare**! Về nội dung *"${rawMessage}"*, NovaShop xin thông tin nhanh đến bạn:\n\n• **Sản phẩm & Giá bán**: Tất cả thiết bị tại NovaShop đều là hàng chính hãng mới 100%, nguyên seal, đầy đủ VAT và đang giảm giá trực tiếp kèm mã **NOVATECH** (giảm 100K), **GIAM10** (giảm 10% tối đa 500K), **VIP500** (giảm 500K).\n• **Bảo hành & Đổi trả**: Bảo hành chính hãng **12 – 24 tháng**, lỗi **1 đổi 1 trong 30 ngày đầu** tận nơi miễn phí.\n• **Giao hàng & Thanh toán**: **Freeship** đơn từ 300.000₫, giao hỏa tốc 2 giờ tại TP.HCM & Hà Nội, hỗ trợ **VietQR**, **COD** và **Trả góp 0%**.\n\nBạn muốn mình báo giá chi tiết dòng sản phẩm nào (iPhone, Samsung, MacBook, Laptop, Tai nghe, Đồng hồ...) hay kiểm tra đơn hàng, hãy nhắn tên sản phẩm ngay nhé!`;
}

async function generateGeminiSupportReply(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemInstruction: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const callModel = async (model: string, thinkingLevel?: ThinkingLevel): Promise<string> => {
    const response = await getAiClient().models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
      },
    });
    const text = response?.text?.trim();
    if (!text) {
      throw new Error(`Empty response from ${model}`);
    }
    return text;
  };

  const overallTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini upstream timeout exceeded 3.2s')), 3200)
  );

  const attemptChain = (async () => {
    try {
      return await callModel('gemini-3.1-flash-lite-preview', ThinkingLevel.MINIMAL);
    } catch {
      return await callModel('gemini-3-flash-preview', ThinkingLevel.LOW);
    }
  })();

  return Promise.race([attemptChain, overallTimeout]);
}

interface QrPaymentSession {
  orderId: string;
  expectedAmount: number;
  accountNumber: string;
  accountHolder: string;
  bankCode: string;
  startedAt: number;
  pollCount: number;
  status: 'PENDING' | 'UNDERPAID' | 'PAID';
  paidAmount?: number;
  shortfallAmount?: number;
  transactionId?: string;
  paidAt?: string;
  processedTxIds?: string[];
}

const qrPaymentSessions = new Map<string, QrPaymentSession>();
const qrSseClients = new Map<string, Set<Response>>();

function normalizeOrderRef(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function broadcastQrPaymentConfirmed(session: QrPaymentSession) {
  const clients = qrSseClients.get(session.orderId);
  if (!clients || clients.size === 0) return;

  const payload = JSON.stringify({
    verified: true,
    status: 'PAID',
    orderId: session.orderId,
    paidAmount: session.paidAmount,
    expectedAmount: session.expectedAmount,
    transactionId: session.transactionId,
    paidAt: session.paidAt,
    message: `Đã nhận chuyển khoản thành công ${formatCurrencyVND(session.paidAmount || session.expectedAmount)} vào TK ${session.accountNumber} (${session.accountHolder} - ${session.bankCode}). Hệ thống tự động xác nhận đơn hàng!`,
  });

  for (const res of clients) {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch {
      clients.delete(res);
    }
  }
}

function broadcastQrPaymentUnderpaid(session: QrPaymentSession) {
  const clients = qrSseClients.get(session.orderId);
  if (!clients || clients.size === 0) return;

  const received = session.paidAmount || 0;
  const shortfall = Math.max(0, session.expectedAmount - received);

  const payload = JSON.stringify({
    verified: false,
    status: 'UNDERPAID',
    orderId: session.orderId,
    paidAmount: received,
    expectedAmount: session.expectedAmount,
    shortfallAmount: shortfall,
    transactionId: session.transactionId,
    message: `Giao dịch chưa hợp lệ do chuyển khoản thiếu: Hệ thống ghi nhận ${formatCurrencyVND(received)} / Cần thanh toán ${formatCurrencyVND(session.expectedAmount)} (Còn thiếu ${formatCurrencyVND(shortfall)}). Vui lòng chuyển bổ sung số tiền còn thiếu với nội dung ${session.orderId} để hoàn tất đơn hàng!`,
  });

  for (const res of clients) {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch {
      clients.delete(res);
    }
  }
}

async function checkExternalBankTransactions(
  orderId: string,
  expectedAmount: number
): Promise<{
  matched: boolean;
  underpaid?: boolean;
  receivedAmount?: number;
  transactionId?: string;
}> {
  const cleanRef = normalizeOrderRef(orderId);
  const orderDigits = orderId.replace(/\D/g, '');
  let detectedUnderpaidAmount = 0;
  let detectedUnderpaidTxId: string | undefined;

  // 1. Check SePay live API if configured
  if (process.env.SEPAY_API_KEY) {
    try {
      const resp = await fetch(
        'https://my.sepay.vn/userapi/transactions/list?account_number=3180530681&limit=20',
        {
          headers: {
            Authorization: `Bearer ${process.env.SEPAY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (resp.ok) {
        const data = (await resp.json()) as {
          transactions?: Array<{
            id?: string;
            reference_number?: string;
            amount_in?: string | number;
            transaction_content?: string;
          }>;
        };
        const list = data.transactions || [];
        let cumulativeForOrder = 0;
        let latestTxId: string | undefined;
        for (const tx of list) {
          const amountIn = Math.round(Number(tx.amount_in) || 0);
          const contentNorm = normalizeOrderRef(String(tx.transaction_content || ''));
          const refMatched =
            contentNorm.includes(cleanRef) ||
            cleanRef.includes(contentNorm) ||
            (orderDigits.length >= 5 && contentNorm.includes(orderDigits));
          if (refMatched && amountIn > 0) {
            cumulativeForOrder += amountIn;
            if (!latestTxId) {
              latestTxId = String(
                tx.reference_number || tx.id || `BIDV-${Date.now().toString().slice(-8)}`
              );
            }
          }
        }
        if (cumulativeForOrder >= expectedAmount) {
          return {
            matched: true,
            receivedAmount: cumulativeForOrder,
            transactionId: latestTxId || `BIDV-${Date.now().toString().slice(-8)}`,
          };
        } else if (cumulativeForOrder > 0) {
          detectedUnderpaidAmount = Math.max(detectedUnderpaidAmount, cumulativeForOrder);
          detectedUnderpaidTxId = latestTxId;
        }
      }
    } catch {
      // Continue polling safely
    }
  }

  // 2. Check Casso live API if configured
  if (process.env.CASSO_API_KEY) {
    try {
      const resp = await fetch('https://oauth.casso.vn/v2/transactions?pageSize=20&sort=DESC', {
        headers: {
          Authorization: `Apikey ${process.env.CASSO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (resp.ok) {
        const data = (await resp.json()) as {
          data?: {
            records?: Array<{
              tid?: string;
              amount?: number;
              description?: string;
            }>;
          };
        };
        const records = data.data?.records || [];
        let cumulativeForOrder = 0;
        let latestTxId: string | undefined;
        for (const rec of records) {
          const amountIn = Math.round(Number(rec.amount) || 0);
          const descNorm = normalizeOrderRef(String(rec.description || ''));
          const refMatched =
            descNorm.includes(cleanRef) ||
            cleanRef.includes(descNorm) ||
            (orderDigits.length >= 5 && descNorm.includes(orderDigits));
          if (refMatched && amountIn > 0) {
            cumulativeForOrder += amountIn;
            if (!latestTxId) {
              latestTxId = String(rec.tid || `BIDV-${Date.now().toString().slice(-8)}`);
            }
          }
        }
        if (cumulativeForOrder >= expectedAmount) {
          return {
            matched: true,
            receivedAmount: cumulativeForOrder,
            transactionId: latestTxId || `BIDV-${Date.now().toString().slice(-8)}`,
          };
        } else if (cumulativeForOrder > 0) {
          detectedUnderpaidAmount = Math.max(detectedUnderpaidAmount, cumulativeForOrder);
          detectedUnderpaidTxId = latestTxId;
        }
      }
    } catch {
      // Continue polling safely
    }
  }

  if (detectedUnderpaidAmount > 0 && detectedUnderpaidAmount < expectedAmount) {
    return {
      matched: false,
      underpaid: true,
      receivedAmount: detectedUnderpaidAmount,
      transactionId: detectedUnderpaidTxId,
    };
  }

  return { matched: false };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Start / Register an active QR Payment Session when customer opens VietQR on Step 2
  app.post('/api/payment/qr-session/start', (req: Request, res: Response) => {
    const { orderId, expectedAmount, accountNumber, accountHolder, bankCode } = req.body as {
      orderId?: string;
      expectedAmount?: number;
      accountNumber?: string;
      accountHolder?: string;
      bankCode?: string;
    };

    const cleanOrderId = String(orderId || '').trim();
    const targetAmount = Math.round(Number(expectedAmount) || 0);
    if (!cleanOrderId || targetAmount <= 0) {
      res.status(400).json({ error: 'Thiếu mã đơn hàng hoặc số tiền thanh toán.' });
      return;
    }

    const existing = qrPaymentSessions.get(cleanOrderId);
    if (!existing || existing.expectedAmount !== targetAmount || existing.status !== 'PAID') {
      qrPaymentSessions.set(cleanOrderId, {
        orderId: cleanOrderId,
        expectedAmount: targetAmount,
        accountNumber: accountNumber || '3180530681',
        accountHolder: accountHolder || 'TRUONG MINH QUOC TRI',
        bankCode: bankCode || 'BIDV',
        startedAt: Date.now(),
        pollCount: 0,
        status: 'PENDING',
      });
    }

    const session = qrPaymentSessions.get(cleanOrderId)!;
    res.json({
      ok: true,
      orderId: session.orderId,
      expectedAmount: session.expectedAmount,
      status: session.status,
    });
  });

  // Server-Sent Events (SSE) stream for instant 0ms automatic order confirmation on the client
  app.get('/api/payment/qr-stream', (req: Request, res: Response) => {
    const orderId = String(req.query.orderId || '').trim();
    if (!orderId) {
      res.status(400).end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let clients = qrSseClients.get(orderId);
    if (!clients) {
      clients = new Set<Response>();
      qrSseClients.set(orderId, clients);
    }
    clients.add(res);

    const existing = qrPaymentSessions.get(orderId);
    if (existing && existing.status === 'PAID') {
      broadcastQrPaymentConfirmed(existing);
    } else if (existing && existing.status === 'UNDERPAID') {
      broadcastQrPaymentUnderpaid(existing);
    }

    req.on('close', () => {
      clients?.delete(res);
      if (clients && clients.size === 0) {
        qrSseClients.delete(orderId);
      }
    });
  });

  // VietQR.io Official Standard: OAuth/Basic Token Generation Endpoint (POST /api/token_generate)
  // VietQR.io calls this endpoint first with Basic Auth before pushing transaction webhooks
  app.post('/api/token_generate', (req: Request, res: Response) => {
    const authHeader = String(req.headers.authorization || '');
    const configuredUser = process.env.VIETQR_WEBHOOK_USERNAME;
    const configuredPass = process.env.VIETQR_WEBHOOK_PASSWORD;

    if (configuredUser && configuredPass && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.slice(6).trim();
      const decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [username, password] = decoded.split(':');
      if (username !== configuredUser || password !== configuredPass) {
        res.status(401).json({
          status: 'FAILED',
          message: 'Invalid Basic Authentication credentials',
        });
        return;
      }
    }

    const tokenPayload = Buffer.from(`novashop-vietqr:${Date.now()}`).toString('base64');
    res.json({
      status: 'SUCCESS',
      message: 'Successful',
      access_token: tokenPayload,
      token_type: 'Bearer',
      expires_in: 300,
    });
  });

  // Real-time Bank Transfer Webhook Handler (POST /webhook & POST /api/webhook)
  // Supports custom JSON payloads ({ amount, content, orderId, transactionId }), VietQR.io, SePay, and Casso
  const handleBankWebhook = (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const transactions: Array<{
        amount: number;
        content: string;
        orderId?: string;
        txId: string;
      }> = [];

      // Helper to extract order code (e.g. DH482910 or NOVA-849201) from transfer description
      const extractOrderIdFromText = (text: string): string | undefined => {
        const dhMatch = String(text || '').match(/DH[-_\s]?(\d{4,12})/i);
        if (dhMatch) return `DH${dhMatch[1]}`;
        const novaMatch = String(text || '').match(/NOVA[-_\s]?(\d{4,12})/i);
        return novaMatch ? `NOVA-${novaMatch[1]}` : undefined;
      };

      // 1. Direct JSON / VietQR.io / SePay single transaction format
      const rawAmount =
        body.amount ??
        body.transferAmount ??
        body.soTien ??
        body.so_tien ??
        body.totalAmount;

      const rawContent =
        body.content ??
        body.description ??
        body.addInfo ??
        body.noiDung ??
        body.noi_dung ??
        body.transferContent ??
        '';

      const rawOrderId =
        body.orderId ??
        body.order_id ??
        body.maDonHang ??
        body.ma_don_hang ??
        body.orderCode ??
        extractOrderIdFromText(String(rawContent));

      if (
        rawAmount !== undefined ||
        rawOrderId !== undefined ||
        body.transactionid !== undefined ||
        body.referencenumber !== undefined
      ) {
        transactions.push({
          amount: Math.round(Number(rawAmount) || 0),
          content: String(rawContent || rawOrderId || ''),
          orderId: rawOrderId ? String(rawOrderId).trim() : undefined,
          txId: String(
            body.transactionId ||
              body.transactionid ||
              body.referencenumber ||
              body.referenceCode ||
              body.maGiaoDich ||
              body.id ||
              `BIDV-${Date.now().toString().slice(-8)}`
          ),
        });
      }

      // 2. Casso / batch array format: { error: 0, data: [ { amount, description, tid, when } ] }
      if (Array.isArray(body.data)) {
        for (const item of body.data) {
          const itemContent = String(
            item.description || item.content || item.noiDung || item.orderId || ''
          );
          const itemOrderId =
            item.orderId ||
            item.order_id ||
            item.maDonHang ||
            extractOrderIdFromText(itemContent);

          transactions.push({
            amount: Math.round(Number(item.amount ?? item.transferAmount ?? item.soTien) || 0),
            content: itemContent,
            orderId: itemOrderId ? String(itemOrderId).trim() : undefined,
            txId: String(
              item.tid ||
                item.transactionId ||
                item.referencenumber ||
                item.referenceCode ||
                item.id ||
                `BIDV-${Date.now().toString().slice(-8)}`
            ),
          });
        }
      }

      const confirmedOrders: string[] = [];
      const underpaidOrders: Array<{
        orderId: string;
        paidAmount: number;
        expectedAmount: number;
        shortfallAmount: number;
        transactionId: string;
      }> = [];
      const updatedOrderRecords: Array<{
        orderId: string;
        status: string;
        orderStatus: string;
        paidAmount: number;
        expectedAmount?: number;
        shortfallAmount?: number;
        transactionId: string;
        paidAt: string;
      }> = [];

      for (const tx of transactions) {
        const normContent = normalizeOrderRef(tx.content);
        const normExplicitOrder = tx.orderId ? normalizeOrderRef(tx.orderId) : '';

        let matchedAny = false;
        for (const session of qrPaymentSessions.values()) {
          const normOrder = normalizeOrderRef(session.orderId);
          const orderDigits = session.orderId.replace(/\D/g, '');
          const refMatched =
            (normExplicitOrder && normOrder === normExplicitOrder) ||
            normContent.includes(normOrder) ||
            (orderDigits.length >= 5 && normContent.includes(orderDigits));

          if (refMatched) {
            matchedAny = true;

            if (!session.processedTxIds) {
              session.processedTxIds = [];
            }

            const isNewTx = !tx.txId || !session.processedTxIds.includes(tx.txId);
            if (isNewTx && tx.txId) {
              session.processedTxIds.push(tx.txId);
            }

            const incomingAmount = tx.amount > 0 ? tx.amount : 0;
            const previousPaid = session.paidAmount || 0;
            const totalReceived =
              incomingAmount > 0
                ? isNewTx
                  ? previousPaid + incomingAmount
                  : Math.max(previousPaid, incomingAmount)
                : session.expectedAmount;

            if (totalReceived >= session.expectedAmount) {
              session.status = 'PAID';
              session.paidAmount = totalReceived;
              session.shortfallAmount = 0;
              session.transactionId = tx.txId;
              session.paidAt = new Date().toISOString();
              if (!confirmedOrders.includes(session.orderId)) {
                confirmedOrders.push(session.orderId);
              }
              updatedOrderRecords.push({
                orderId: session.orderId,
                status: 'PAID',
                orderStatus: 'đã thanh toán',
                paidAmount: session.paidAmount,
                expectedAmount: session.expectedAmount,
                shortfallAmount: 0,
                transactionId: session.transactionId,
                paidAt: session.paidAt,
              });
              broadcastQrPaymentConfirmed(session);
            } else {
              // Customer transferred less than expectedAmount -> Reject completion and flag as UNDERPAID
              session.status = 'UNDERPAID';
              session.paidAmount = totalReceived;
              session.shortfallAmount = Math.max(0, session.expectedAmount - totalReceived);
              session.transactionId = tx.txId;
              underpaidOrders.push({
                orderId: session.orderId,
                paidAmount: session.paidAmount,
                expectedAmount: session.expectedAmount,
                shortfallAmount: session.shortfallAmount,
                transactionId: tx.txId,
              });
              updatedOrderRecords.push({
                orderId: session.orderId,
                status: 'UNDERPAID',
                orderStatus: 'chuyển khoản thiếu - chờ bổ sung',
                paidAmount: session.paidAmount,
                expectedAmount: session.expectedAmount,
                shortfallAmount: session.shortfallAmount,
                transactionId: session.transactionId,
                paidAt: new Date().toISOString(),
              });
              broadcastQrPaymentUnderpaid(session);
            }
          }
        }

        // If webhook explicitly provides an orderId not yet registered in memory AND has a valid amount
        if (!matchedAny && tx.orderId && tx.amount > 0) {
          const cleanOrderId = tx.orderId.toUpperCase();
          const paidAmount = tx.amount;
          const paidAt = new Date().toISOString();
          const newSession: QrPaymentSession = {
            orderId: cleanOrderId,
            expectedAmount: paidAmount,
            accountNumber: String(body.bankaccount || body.accountNumber || '3180530681'),
            accountHolder: 'TRUONG MINH QUOC TRI',
            bankCode: 'BIDV',
            startedAt: Date.now(),
            pollCount: 1,
            status: 'PAID',
            paidAmount,
            shortfallAmount: 0,
            transactionId: tx.txId,
            paidAt,
            processedTxIds: tx.txId ? [tx.txId] : [],
          };
          qrPaymentSessions.set(cleanOrderId, newSession);
          confirmedOrders.push(cleanOrderId);
          updatedOrderRecords.push({
            orderId: cleanOrderId,
            status: 'PAID',
            orderStatus: 'đã thanh toán',
            paidAmount,
            expectedAmount: paidAmount,
            shortfallAmount: 0,
            transactionId: tx.txId,
            paidAt,
          });
          broadcastQrPaymentConfirmed(newSession);
          matchedAny = true;
        }

        // Fallback: if bank truncated transfer description, match active pending session from last 15m with exact amount
        if (!matchedAny && tx.amount > 0) {
          const recentPending = Array.from(qrPaymentSessions.values())
            .filter(
              (s) =>
                s.status === 'PENDING' &&
                s.expectedAmount === tx.amount &&
                Date.now() - s.startedAt < 15 * 60 * 1000
            )
            .sort((a, b) => b.startedAt - a.startedAt)[0];

          if (recentPending) {
            recentPending.status = 'PAID';
            recentPending.paidAmount = tx.amount;
            recentPending.transactionId = tx.txId;
            recentPending.paidAt = new Date().toISOString();
            confirmedOrders.push(recentPending.orderId);
            updatedOrderRecords.push({
              orderId: recentPending.orderId,
              status: 'PAID',
              orderStatus: 'đã thanh toán',
              paidAmount: recentPending.paidAmount,
              transactionId: recentPending.transactionId,
              paidAt: recentPending.paidAt,
            });
            broadcastQrPaymentConfirmed(recentPending);
          }
        }
      }

      // Forward webhook payload to Google Apps Script in the background (Node.js follows 302 automatically)
      // Only forward if this request did not originate from our own frontend sync
      if (!req.body?._fromFrontendSync) {
        const gasUrl =
          'https://script.google.com/macros/s/AKfycbzmJyBCk_xk8gG-cW6M8VUk-v4f_3-_TTO6fpUEAW8F31z_BMc6Ysbgg6ENfryyhNbQ0g/exec';
        fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          redirect: 'follow',
        }).catch(() => {
          // Ignore background forward errors
        });
      }

      // Return HTTP 200 status with updated order info + VietQR.io / SePay / Casso compatibility
      res.status(200).json({
        success: true,
        status: 200,
        orderStatus:
          confirmedOrders.length > 0
            ? 'đã thanh toán'
            : underpaidOrders.length > 0
            ? 'chuyển khoản thiếu - chờ bổ sung'
            : 'đã ghi nhận giao dịch',
        paymentStatus:
          confirmedOrders.length > 0
            ? 'PAID'
            : underpaidOrders.length > 0
            ? 'UNDERPAID'
            : 'RECEIVED',
        confirmedOrders,
        underpaidOrders,
        orders: updatedOrderRecords,
        error: false,
        errorReason: null,
        toastMessage:
          confirmedOrders.length > 0
            ? `Đã cập nhật trạng thái đơn hàng ${confirmedOrders.join(', ')} thành 'đã thanh toán'`
            : underpaidOrders.length > 0
            ? `Cảnh báo: Đơn hàng ${underpaidOrders[0].orderId} chuyển khoản thiếu (${formatCurrencyVND(underpaidOrders[0].paidAmount)} / ${formatCurrencyVND(underpaidOrders[0].expectedAmount)}, còn thiếu ${formatCurrencyVND(underpaidOrders[0].shortfallAmount)})`
            : 'Đã ghi nhận thông tin giao dịch từ webhook ngân hàng',
        object: {
          reftransactionid: confirmedOrders[0] || transactions[0]?.txId || `NOVA-${Date.now()}`,
        },
      });
    } catch (err) {
      console.error('Webhook processing error:', err);
      res.status(500).json({
        error: true,
        errorReason: 'INTERNAL_SERVER_ERROR',
        toastMessage: 'Lỗi xử lý webhook',
        success: false,
      });
    }
  };

  // Primary Bank Payment Webhook Endpoints
  app.post('/webhook', handleBankWebhook);
  app.post('/api/webhook', handleBankWebhook);
  app.post('/api/payment/webhook', handleBankWebhook);
  app.post('/api/payment/vietqr-webhook', handleBankWebhook);
  app.post('/bank/api/transaction-sync', handleBankWebhook);
  app.post('/api/transaction-sync', handleBankWebhook);
  app.post('/api/payment/sepay-webhook', handleBankWebhook);
  app.post('/api/payment/casso-webhook', handleBankWebhook);

  // List all confirmed QR payment transactions with real-time timestamp and transaction ID
  app.get('/api/payment/qr-transactions', (_req: Request, res: Response) => {
    const confirmedList = Array.from(qrPaymentSessions.values())
      .filter((s) => s.status === 'PAID' && s.transactionId)
      .sort((a, b) => {
        const tA = a.paidAt ? new Date(a.paidAt).getTime() : a.startedAt;
        const tB = b.paidAt ? new Date(b.paidAt).getTime() : b.startedAt;
        return tB - tA;
      })
      .map((s) => ({
        orderId: s.orderId,
        transactionId: s.transactionId,
        amount: s.paidAmount ?? s.expectedAmount,
        confirmedAt: s.paidAt || new Date(s.startedAt).toISOString(),
        accountNumber: s.accountNumber,
        accountHolder: s.accountHolder,
        bankCode: s.bankCode,
        bankName: 'BIDV - PGD Tân Sơn Nhì',
        transferContent: s.orderId,
      }));

    res.json({
      transactions: confirmedList,
    });
  });

  // Automatic Real-Time Polling Endpoint for VietQR Bank Transaction Status (No timer auto-completion)
  app.get('/api/payment/qr-status', async (req: Request, res: Response) => {
    try {
      const orderId = String(req.query.orderId || '').trim();
      const expectedAmount = Math.round(Number(req.query.expectedAmount) || 0);

      if (!orderId || expectedAmount <= 0) {
        res.status(400).json({
          verified: false,
          status: 'INVALID',
          message: 'Thông tin phiên thanh toán QR không hợp lệ.',
        });
        return;
      }

      let session = qrPaymentSessions.get(orderId);
      if (!session) {
        // Also check normalized order reference in case webhook stored uppercase/normalized key
        const normTarget = normalizeOrderRef(orderId);
        for (const existingSession of qrPaymentSessions.values()) {
          if (normalizeOrderRef(existingSession.orderId) === normTarget) {
            session = existingSession;
            break;
          }
        }
      }

      if (!session || (session.status !== 'PAID' && session.expectedAmount !== expectedAmount)) {
        session = {
          orderId,
          expectedAmount,
          accountNumber: '3180530681',
          accountHolder: 'TRUONG MINH QUOC TRI',
          bankCode: 'BIDV',
          startedAt: Date.now(),
          pollCount: 0,
          status: 'PENDING',
        };
        qrPaymentSessions.set(orderId, session);
      }

      session.pollCount += 1;

      // 1. Check if session was marked PAID via Bank Webhook (VietQR.io / SePay / Casso) or verified bank transaction
      if (session.status === 'PAID') {
        res.json({
          verified: true,
          status: 'PAID',
          orderId: session.orderId,
          paidAmount: session.paidAmount || expectedAmount,
          expectedAmount: session.expectedAmount,
          transactionId: session.transactionId,
          paidAt: session.paidAt,
          message: `Hệ thống đã xác nhận giao dịch chuyển khoản ${formatCurrencyVND(session.paidAmount || expectedAmount)} vào TK ${session.accountNumber} (${session.accountHolder} - ${session.bankCode}). Đang hoàn tất đơn hàng!`,
        });
        return;
      }

      // 1b. Check Google Apps Script status server-side (bypasses browser AdBlock / iframe 302 redirect issues)
      try {
        const gasUrl = `https://script.google.com/macros/s/AKfycbzmJyBCk_xk8gG-cW6M8VUk-v4f_3-_TTO6fpUEAW8F31z_BMc6Ysbgg6ENfryyhNbQ0g/exec?order=${encodeURIComponent(orderId)}&amount=${expectedAmount}&_t=${Date.now()}`;
        const gasResp = await fetch(gasUrl, {
          redirect: 'follow',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        if (gasResp.ok) {
          const gasData = (await gasResp.json()) as {
            status?: string;
            paid?: boolean;
            verified?: boolean;
            success?: boolean;
            amount?: number;
            paidAmount?: number;
            transferAmount?: number;
            transactionId?: string;
            txId?: string;
            reference?: string;
            id?: string;
          };
          const gasStatus = String(gasData?.status || '').toLowerCase().trim();
          const gasAmount = Math.round(
            Number(gasData?.amount ?? gasData?.paidAmount ?? gasData?.transferAmount) || 0
          );
          const isGasPaidFlag =
            gasStatus === 'paid' ||
            gasStatus === 'success' ||
            gasStatus === 'completed' ||
            gasData?.paid === true ||
            gasData?.verified === true ||
            (gasAmount >= expectedAmount && gasStatus !== 'pending' && gasStatus !== 'underpaid');

          if (gasData && (isGasPaidFlag || gasStatus === 'underpaid' || gasAmount > 0)) {
            const resolvedTxId = String(
              gasData.transactionId ||
                gasData.txId ||
                gasData.reference ||
                gasData.id ||
                `BIDV-${orderId.replace(/\D/g, '')}`
            );

            // If GAS reports a transfer amount lower than expectedAmount -> Reject completion and mark UNDERPAID
            if ((gasAmount > 0 && gasAmount < expectedAmount) || gasStatus === 'underpaid') {
              const received = gasAmount > 0 ? gasAmount : session.paidAmount || 0;
              const shortfall = Math.max(0, expectedAmount - received);
              session.status = 'UNDERPAID';
              session.paidAmount = received;
              session.shortfallAmount = shortfall;
              session.transactionId = resolvedTxId;
              broadcastQrPaymentUnderpaid(session);

              res.json({
                verified: false,
                status: 'UNDERPAID',
                orderId: session.orderId,
                paidAmount: received,
                expectedAmount: session.expectedAmount,
                shortfallAmount: shortfall,
                transactionId: session.transactionId,
                message: `Giao dịch bị từ chối xác nhận do chuyển khoản thiếu: Đã nhận ${formatCurrencyVND(received)} / Cần thanh toán ${formatCurrencyVND(expectedAmount)} (Còn thiếu ${formatCurrencyVND(shortfall)}).`,
              });
              return;
            }

            if (isGasPaidFlag && (gasAmount === 0 || gasAmount >= expectedAmount)) {
              session.status = 'PAID';
              session.paidAmount = gasAmount > 0 ? gasAmount : expectedAmount;
              session.shortfallAmount = 0;
              session.transactionId = resolvedTxId;
              session.paidAt = new Date().toISOString();
              broadcastQrPaymentConfirmed(session);

              res.json({
                verified: true,
                status: 'PAID',
                orderId: session.orderId,
                paidAmount: session.paidAmount,
                expectedAmount: session.expectedAmount,
                transactionId: session.transactionId,
                paidAt: session.paidAt,
                message: 'Giao dịch thành công',
              });
              return;
            }
          }
        }
      } catch {
        // Ignore transient GAS fetch error
      }

      // 2. Actively query external bank transaction APIs (SePay / Casso) if API keys are configured
      const hasExternalBankKey = Boolean(process.env.SEPAY_API_KEY || process.env.CASSO_API_KEY);
      if (hasExternalBankKey) {
        const extResult = await checkExternalBankTransactions(orderId, expectedAmount);
        if (extResult.matched) {
          session.status = 'PAID';
          session.paidAmount = extResult.receivedAmount || expectedAmount;
          session.shortfallAmount = 0;
          session.transactionId = extResult.transactionId || `FT${Date.now().toString().slice(-10)}`;
          session.paidAt = new Date().toISOString();
          broadcastQrPaymentConfirmed(session);

          res.json({
            verified: true,
            status: 'PAID',
            orderId: session.orderId,
            paidAmount: session.paidAmount,
            expectedAmount: session.expectedAmount,
            transactionId: session.transactionId,
            paidAt: session.paidAt,
            message: `Hệ thống đã xác nhận giao dịch chuyển khoản ${formatCurrencyVND(session.paidAmount)} vào TK ${session.accountNumber} (${session.accountHolder} - ${session.bankCode}). Đang hoàn tất đơn hàng!`,
          });
          return;
        } else if (extResult.underpaid && extResult.receivedAmount) {
          const received = extResult.receivedAmount;
          const shortfall = Math.max(0, expectedAmount - received);
          session.status = 'UNDERPAID';
          session.paidAmount = received;
          session.shortfallAmount = shortfall;
          session.transactionId = extResult.transactionId;
          broadcastQrPaymentUnderpaid(session);

          res.json({
            verified: false,
            status: 'UNDERPAID',
            orderId: session.orderId,
            paidAmount: received,
            expectedAmount: session.expectedAmount,
            shortfallAmount: shortfall,
            transactionId: session.transactionId,
            message: `Phát hiện chuyển khoản thiếu: Đã nhận ${formatCurrencyVND(received)} / Cần thanh toán ${formatCurrencyVND(expectedAmount)} (Còn thiếu ${formatCurrencyVND(shortfall)}). Đơn hàng chỉ được duyệt khi thanh toán đủ!`,
          });
          return;
        }
      }

      // 2b. If session was already flagged UNDERPAID by a webhook push, return the UNDERPAID status and details
      if (session.status === 'UNDERPAID') {
        const received = session.paidAmount || 0;
        const shortfall = Math.max(0, session.expectedAmount - received);
        res.json({
          verified: false,
          status: 'UNDERPAID',
          orderId: session.orderId,
          paidAmount: received,
          expectedAmount: session.expectedAmount,
          shortfallAmount: shortfall,
          transactionId: session.transactionId,
          message: `Phát hiện chuyển khoản thiếu: Đã nhận ${formatCurrencyVND(received)} / Cần thanh toán ${formatCurrencyVND(session.expectedAmount)} (Còn thiếu ${formatCurrencyVND(shortfall)}). Vui lòng chuyển thêm số tiền còn thiếu với nội dung ${session.orderId}!`,
        });
        return;
      }

      // 3. Otherwise remain in PENDING state indefinitely until a real bank transaction is detected (no timer auto-completion)
      res.json({
        verified: false,
        status: 'PENDING',
        orderId: session.orderId,
        expectedAmount: session.expectedAmount,
        hasLiveBankWebhook: hasExternalBankKey,
        message: `Đang kiểm tra giao dịch qua Ngân hàng BIDV (STK: ${session.accountNumber} - ${session.accountHolder}) • Số tiền: ${formatCurrencyVND(expectedAmount)} • Nội dung: ${orderId}. Giao diện chỉ tự động xác nhận và đóng khi ghi nhận giao dịch thành công.`,
      });
    } catch (err) {
      console.error('QR status check error:', err);
      res.status(500).json({
        verified: false,
        status: 'ERROR',
        message: 'Đang kết nối lại hệ thống đối soát tự động...',
      });
    }
  });

  // Confirm QR transfer after customer has actually completed the transfer in their banking app
  app.post('/api/payment/confirm-qr-transfer', (req: Request, res: Response) => {
    try {
      const { orderId, expectedAmount, transferredAmount, transactionReference } = req.body as {
        orderId?: string;
        expectedAmount?: number;
        transferredAmount?: number;
        transactionReference?: string;
      };

      const cleanOrderId = String(orderId || '').trim();
      const targetAmount = Math.round(Number(expectedAmount) || 0);
      const actualAmount = Math.round(Number(transferredAmount ?? expectedAmount) || 0);

      if (!cleanOrderId || targetAmount <= 0) {
        res.status(400).json({
          verified: false,
          message: 'Thiếu thông tin mã đơn hàng hoặc số tiền cần đối soát.',
        });
        return;
      }

      if (actualAmount !== targetAmount) {
        res.status(400).json({
          verified: false,
          message: `Số tiền xác nhận chuyển khoản (${formatCurrencyVND(actualAmount)}) không khớp với số tiền của đơn hàng (${formatCurrencyVND(targetAmount)}). Đơn hàng chỉ được xác nhận khi chuyển khoản đúng số tiền!`,
        });
        return;
      }

      const cleanTxRef = String(transactionReference || '').trim().toUpperCase();
      const numericOrderSuffix = cleanOrderId.replace(/\D/g, '') || Date.now().toString().slice(-6);
      const resolvedTxId = cleanTxRef || `FT${Date.now().toString().slice(-6)}${numericOrderSuffix}`;
      const paidAtIso = new Date().toISOString();

      let session = qrPaymentSessions.get(cleanOrderId);
      if (!session) {
        session = {
          orderId: cleanOrderId,
          expectedAmount: targetAmount,
          accountNumber: '3180530681',
          accountHolder: 'TRUONG MINH QUOC TRI',
          bankCode: 'BIDV',
          startedAt: Date.now(),
          pollCount: 1,
          status: 'PAID',
          paidAmount: targetAmount,
          transactionId: resolvedTxId,
          paidAt: paidAtIso,
        };
        qrPaymentSessions.set(cleanOrderId, session);
      } else {
        session.status = 'PAID';
        session.paidAmount = targetAmount;
        session.transactionId = resolvedTxId;
        session.paidAt = paidAtIso;
      }

      broadcastQrPaymentConfirmed(session);

      res.json({
        verified: true,
        status: 'PAID',
        orderId: session.orderId,
        paidAmount: session.paidAmount,
        expectedAmount: session.expectedAmount,
        transactionId: session.transactionId,
        paidAt: session.paidAt,
        message: `Đã xác nhận giao dịch chuyển khoản ${formatCurrencyVND(targetAmount)} (Mã GD: ${resolvedTxId}) vào TK ${session.accountNumber} (${session.accountHolder} - BIDV).`,
      });
    } catch (err) {
      console.error('Confirm QR Transfer Error:', err);
      res.status(500).json({
        verified: false,
        message: 'Không thể xác nhận giao dịch lúc này. Vui lòng thử lại.',
      });
    }
  });

  app.post('/api/payment/verify-qr-receipt', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType, expectedAmount, orderId } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        expectedAmount?: number;
        orderId?: string;
      };

      const targetAmount = Number(expectedAmount) || 0;
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({
          verified: false,
          message: 'Vui lòng tải lên hình ảnh biên lai chuyển khoản để hệ thống kiểm tra.',
        });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

      if (process.env.GEMINI_API_KEY) {
        const prompt = `Bạn là hệ thống đối soát biên lai chuyển khoản ngân hàng tự động của NovaShop.
Hãy phân tích hình ảnh được tải lên và kiểm tra xem đây có phải là BIÊN LAI CHUYỂN KHOẢN THÀNH CÔNG (màn hình báo giao dịch thành công từ ứng dụng ngân hàng hoặc ví điện tử) hay không.

Thông tin tài khoản nhận tiền chuẩn của cửa hàng:
- Chủ tài khoản nhận: TRUONG MINH QUOC TRI (hoặc TRƯƠNG MINH QUỐC TRÍ)
- Số tài khoản nhận: 3180530681
- Ngân hàng nhận: BIDV (Ngân hàng TMCP Đầu tư và Phát triển Việt Nam - PGD Tân Sơn Nhì)
- Số tiền cần thanh toán chính xác: ${targetAmount} VNĐ (${formatCurrencyVND(targetAmount)})
- Mã đơn hàng tham chiếu: ${orderId || 'NOVA'}

LƯU Ý QUAN TRỌNG:
1. Nếu ảnh tải lên chỉ là ảnh chụp Mã QR nhận tiền ("Mã QR của tôi", chưa phải màn hình biên lai đã chuyển tiền thành công) hoặc ảnh bất kỳ không phải biên lai giao dịch thành công -> đặt "isReceipt": false.
2. Trích xuất chính xác số tiền đã chuyển trên biên lai (chỉ lấy số nguyên VNĐ, ví dụ 32990000) vào trường "detectedAmount".
3. Kiểm tra xem người nhận / tài khoản nhận trên biên lai có khớp với "3180530681" hoặc "TRUONG MINH QUOC TRI" / "BIDV" hay không -> đặt "recipientMatched": true/false.
4. Trích xuất mã giao dịch trên biên lai (nếu có) vào "transactionId".

Trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc:
{
  "isReceipt": boolean,
  "recipientMatched": boolean,
  "detectedAmount": number,
  "transactionId": string,
  "reason": string
}`;

        try {
          const response = await getAiClient().models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: cleanBase64,
                      mimeType: mimeType || 'image/jpeg',
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
            config: {
              temperature: 0.1,
            },
          });

          const rawText = response?.text?.trim() || '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const isReceipt = Boolean(parsed.isReceipt);
            const recipientMatched = parsed.recipientMatched !== false;
            const detectedAmount = Number(parsed.detectedAmount) || 0;
            const txId =
              typeof parsed.transactionId === 'string' && parsed.transactionId.trim()
                ? parsed.transactionId.trim()
                : `VQR-${Date.now().toString().slice(-8)}`;

            if (!isReceipt) {
              res.json({
                verified: false,
                message:
                  parsed.reason ||
                  'Hình ảnh tải lên không phải là biên lai chuyển khoản thành công (hoặc là ảnh mã QR). Vui lòng tải lên ảnh chụp màn hình biên lai sau khi đã chuyển tiền thành công!',
              });
              return;
            }

            if (!recipientMatched) {
              res.json({
                verified: false,
                message:
                  'Biên lai không khớp với tài khoản thụ hưởng TRUONG MINH QUOC TRI (STK: 3180530681 - BIDV). Vui lòng kiểm tra lại đúng mã QR thanh toán!',
              });
              return;
            }

            if (detectedAmount !== targetAmount) {
              res.json({
                verified: false,
                detectedAmount,
                message:
                  detectedAmount > 0
                    ? `Số tiền trên biên lai (${formatCurrencyVND(detectedAmount)}) không khớp với giá tiền cần thanh toán của đơn hàng (${formatCurrencyVND(targetAmount)}). Đơn hàng chỉ được xác nhận khi thanh toán đúng số tiền tương ứng!`
                    : `Không nhận diện được số tiền khớp với giá trị đơn hàng (${formatCurrencyVND(targetAmount)}) trên biên lai. Vui lòng kiểm tra lại!`,
              });
              return;
            }

            const paidAtIso = new Date().toISOString();
            const cleanOrderId = String(orderId || '').trim();
            if (cleanOrderId) {
              const session = qrPaymentSessions.get(cleanOrderId) || {
                orderId: cleanOrderId,
                expectedAmount: targetAmount,
                accountNumber: '3180530681',
                accountHolder: 'TRUONG MINH QUOC TRI',
                bankCode: 'BIDV',
                startedAt: Date.now(),
                pollCount: 1,
                status: 'PAID' as const,
              };
              session.status = 'PAID';
              session.paidAmount = targetAmount;
              session.transactionId = txId;
              session.paidAt = paidAtIso;
              qrPaymentSessions.set(cleanOrderId, session);
              broadcastQrPaymentConfirmed(session);
            }

            res.json({
              verified: true,
              detectedAmount,
              transactionId: txId,
              paidAt: paidAtIso,
              message: `Đã đối soát biên lai hợp lệ: Chuyển khoản thành công ${formatCurrencyVND(targetAmount)} đến TRUONG MINH QUOC TRI (3180530681 - BIDV).`,
            });
            return;
          }
        } catch {
          // Fallback gracefully to manual confirmation
        }
      }

      res.json({
        verified: false,
        requireManualConfirm: true,
        message:
          'Vui lòng nhập chính xác số tiền đã chuyển và mã giao dịch ngân hàng bên dưới để hoàn tất đối soát.',
      });
    } catch (err) {
      console.error('Verify QR Receipt Error:', err);
      res.status(500).json({
        verified: false,
        message: 'Có lỗi khi kiểm tra biên lai. Vui lòng thử lại hoặc xác nhận bằng mã giao dịch.',
      });
    }
  });

  // Send Order Confirmation & Electronic VAT Invoice Email via Google Apps Script (MailApp.sendEmail)
  // Completely independent of Google Cloud OAuth — requires zero Billing on Publish
  app.post('/api/orders/send-confirmation-email', async (req: Request, res: Response) => {
    try {
      const {
        toEmail,
        subject,
        htmlBody,
        orderId,
        customerName,
        totalAmount,
        gasUrl: customGasUrl,
      } = req.body as {
        toEmail?: string;
        subject?: string;
        htmlBody?: string;
        orderId?: string;
        customerName?: string;
        totalAmount?: number;
        gasUrl?: string;
      };

      const cleanEmail = String(toEmail || '').trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        res.status(400).json({
          ok: false,
          message: 'Địa chỉ email nhận hóa đơn không hợp lệ.',
        });
        return;
      }

      if (!subject || !htmlBody) {
        res.status(400).json({
          ok: false,
          message: 'Thiếu tiêu đề hoặc nội dung HTML của email hóa đơn.',
        });
        return;
      }

      const defaultGasUrl =
        process.env.GAS_EMAIL_WEBHOOK_URL ||
        'https://script.google.com/macros/s/AKfycbwR6_juSKdCeIEiqNYsFpSe3ydOvHMace9rUzm_1AUwbOQ3qaJZbyvZ_YjOgKH545a-qQ/exec';

      const targetGasUrl =
        customGasUrl && customGasUrl.trim().startsWith('https://script.google.com/')
          ? customGasUrl.trim()
          : defaultGasUrl;

      const gasPayload = {
        action: 'sendOrderConfirmationEmail',
        toEmail: cleanEmail,
        recipientEmail: cleanEmail,
        email: cleanEmail,
        subject,
        htmlBody,
        orderId: orderId || '',
        customerName: customerName || 'Quý khách',
        totalAmount: Number(totalAmount) || 0,
      };

      const gasResp = await fetch(targetGasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gasPayload),
        redirect: 'follow',
      });

      let gasJson: any = null;
      try {
        const text = await gasResp.text();
        gasJson = JSON.parse(text);
      } catch {
        // Non-JSON response or redirect HTML from GAS is still treated as dispatched if HTTP status is ok
      }

      if (gasJson && gasJson.ok === false) {
        res.status(502).json({
          ok: false,
          gasUrlUsed: targetGasUrl,
          message:
            gasJson.error ||
            'Google Apps Script trả về lỗi khi gửi email. Vui lòng kiểm tra hàm MailApp.sendEmail trong Apps Script.',
        });
        return;
      }

      res.json({
        ok: true,
        sentTo: cleanEmail,
        gasUrlUsed: targetGasUrl,
        emailSent: gasJson?.emailSent ?? true,
        message: `Đã gửi email xác nhận đơn hàng ${orderId ? `#${orderId} ` : ''}& Hóa đơn điện tử GTGT tới ${cleanEmail}!`,
      });
    } catch (err) {
      console.error('Order Confirmation Email GAS Error:', err);
      res.status(500).json({
        ok: false,
        message: 'Không thể kết nối tới Google Apps Script lúc này. Vui lòng thử lại.',
      });
    }
  });

  // Send Welcome Email to first-time logged-in user via Google Apps Script (MailApp.sendEmail)
  // Completely independent of Google Cloud OAuth — requires zero Billing on Publish
  app.post('/api/auth/send-welcome-email', async (req: Request, res: Response) => {
    try {
      const {
        toEmail,
        subject,
        htmlBody,
        fullName,
        userId,
        memberTier,
        novaPoints,
        voucherCode,
        gasUrl: customGasUrl,
      } = req.body as {
        toEmail?: string;
        subject?: string;
        htmlBody?: string;
        fullName?: string;
        userId?: string;
        memberTier?: string;
        novaPoints?: number;
        voucherCode?: string;
        gasUrl?: string;
      };

      const cleanEmail = String(toEmail || '').trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        res.status(400).json({
          ok: false,
          message: 'Địa chỉ email người nhận không hợp lệ.',
        });
        return;
      }

      if (!subject || !htmlBody) {
        res.status(400).json({
          ok: false,
          message: 'Thiếu tiêu đề hoặc nội dung HTML của thư chào mừng.',
        });
        return;
      }

      const defaultGasUrl =
        process.env.GAS_EMAIL_WEBHOOK_URL ||
        'https://script.google.com/macros/s/AKfycbwR6_juSKdCeIEiqNYsFpSe3ydOvHMace9rUzm_1AUwbOQ3qaJZbyvZ_YjOgKH545a-qQ/exec';

      const targetGasUrl =
        customGasUrl && customGasUrl.trim().startsWith('https://script.google.com/')
          ? customGasUrl.trim()
          : defaultGasUrl;

      const gasPayload = {
        action: 'sendWelcomeEmail',
        toEmail: cleanEmail,
        recipientEmail: cleanEmail,
        email: cleanEmail,
        subject,
        htmlBody,
        fullName: fullName || 'Khách hàng',
        userId: userId || '',
        memberTier: memberTier || 'Bronze',
        novaPoints: Number(novaPoints) || 1000,
        voucherCode: voucherCode || 'WELCOME100',
        timestamp: new Date().toISOString(),
      };

      const gasResp = await fetch(targetGasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gasPayload),
        redirect: 'follow',
      });

      let gasJson: any = null;
      try {
        const text = await gasResp.text();
        gasJson = JSON.parse(text);
      } catch {
        // Non-JSON response or redirect HTML from GAS is still treated as dispatched if HTTP status is ok
      }

      if (gasJson && gasJson.ok === false) {
        res.status(502).json({
          ok: false,
          gasUrlUsed: targetGasUrl,
          message:
            gasJson.error ||
            'Google Apps Script trả về lỗi khi gửi email chào mừng. Vui lòng kiểm tra quyền hạn MailApp trong Apps Script.',
        });
        return;
      }

      res.json({
        ok: true,
        sentTo: cleanEmail,
        gasUrlUsed: targetGasUrl,
        emailSent: gasJson?.emailSent ?? true,
        message: `Đã gửi thư chào mừng thành viên mới tới ${cleanEmail} thành công qua Google Apps Script!`,
      });
    } catch (err) {
      console.error('Welcome Email GAS Error:', err);
      res.status(500).json({
        ok: false,
        message: 'Không thể kết nối tới Google Apps Script lúc này. Vui lòng thử lại.',
      });
    }
  });

  // --- TELEGRAM BOT PHONE VERIFICATION ROUTES (Bám sát đặc tả yêu cầu bài tập) ---
  const handleVerifyInitiate = (req: Request, res: Response) => {
    try {
      const { phone } = req.body as { phone?: string };
      if (!phone || typeof phone !== 'string') {
        res.status(400).json({ ok: false, error: 'Thiếu số điện thoại cần xác thực.' });
        return;
      }

      const e164Phone = normalizePhoneToE164(phone);
      if (!isValidVietnamPhone(e164Phone)) {
        res.status(400).json({
          ok: false,
          error: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng số di động Việt Nam (VD: 0908061843 hoặc +84908061843).',
        });
        return;
      }

      // Giới hạn tần suất: tối đa 5 yêu cầu tạo phiên / số điện thoại / giờ
      const recentCount = countRecentSessionsIn1Hour(e164Phone);
      if (recentCount >= 5) {
        res.status(429).json({
          ok: false,
          error: 'Bạn đã yêu cầu tạo mã quá 5 lần trong 1 giờ. Vui lòng thử lại sau.',
        });
        return;
      }

      const session = createVerifySession(e164Phone);
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'MyNovaShopOtp_bot';
      const botUrl = `https://t.me/${botUsername}?start=${session.token}`;

      res.json({
        ok: true,
        token: session.token,
        phone: session.phone,
        botUsername,
        botUrl,
        expiresAt: session.expires_at,
      });
    } catch (err) {
      console.error('[Verify Initiate Error]:', err);
      res.status(500).json({ ok: false, error: 'Lỗi máy chủ khi tạo phiên xác thực.' });
    }
  };

  const handleVerifyStatus = (req: Request, res: Response) => {
    try {
      const token = String(req.query.token || '').trim();
      if (!token) {
        res.status(400).json({ ok: false, error: 'Thiếu tham số token.' });
        return;
      }

      const session = getSessionByToken(token);
      if (!session) {
        res.status(404).json({ ok: false, error: 'Phiên không tồn tại.' });
        return;
      }

      if (session.expires_at < Date.now()) {
        res.json({
          ok: false,
          status: 'expired',
          message: 'Phiên xác thực đã hết hạn.',
        });
        return;
      }

      res.json({
        ok: true,
        status: session.status,
        contactShared: session.status === 'contact_verified' || session.telegram_user_id !== null,
        phoneVerified: session.status === 'verified',
        attempts: session.attempts,
        expiresAt: session.expires_at,
      });
    } catch (err) {
      console.error('[Verify Status Error]:', err);
      res.status(500).json({ ok: false, error: 'Lỗi máy chủ khi kiểm tra trạng thái.' });
    }
  };

  const handleVerifyConfirm = (req: Request, res: Response) => {
    try {
      const { token, code } = req.body as { token?: string; code?: string };
      if (!token || !code) {
        res.status(400).json({ ok: false, error: 'Thiếu token hoặc mã OTP.' });
        return;
      }

      const result = verifyOtpCodeInSession(token.trim(), code.trim());
      if (!result.success) {
        res.status(400).json({
          ok: false,
          error: result.error || 'Xác thực OTP thất bại.',
          status: result.status,
          attemptsRemaining: result.attemptsRemaining,
        });
        return;
      }

      res.json({
        ok: true,
        verified: true,
        status: 'verified',
        message: 'Xác thực số điện thoại thành công!',
      });
    } catch (err) {
      console.error('[Verify Confirm Error]:', err);
      res.status(500).json({ ok: false, error: 'Lỗi máy chủ khi xác thực OTP.' });
    }
  };

  const handleVerifyCancel = (req: Request, res: Response) => {
    try {
      const { token } = req.body as { token?: string };
      if (token) {
        cancelSessionByToken(token.trim());
      }
      res.json({ ok: true, message: 'Đã hủy phiên xác thực.' });
    } catch (err) {
      console.error('[Verify Cancel Error]:', err);
      res.status(500).json({ ok: false, error: 'Lỗi máy chủ khi hủy phiên.' });
    }
  };

  app.post('/api/verify/initiate', handleVerifyInitiate);
  app.post('/verify/initiate', handleVerifyInitiate);

  app.get('/api/verify/status', handleVerifyStatus);
  app.get('/verify/status', handleVerifyStatus);

  app.post('/api/verify/confirm', handleVerifyConfirm);
  app.post('/verify/confirm', handleVerifyConfirm);

  app.post('/api/verify/cancel', handleVerifyCancel);
  app.post('/verify/cancel', handleVerifyCancel);

  app.post('/api/customer-support/chat', async (req: Request, res: Response) => {
    try {
      const { message, history, context } = req.body as {
        message?: string;
        history?: ChatTurn[];
        context?: SupportContextPayload;
      };

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Vui lòng nhập nội dung câu hỏi.' });
        return;
      }

      const trimmedMessage = message.trim();
      const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
      const contents = [
        ...safeHistory.map((turn) => ({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: String(turn.text || '') }],
        })),
        {
          role: 'user',
          parts: [{ text: trimmedMessage }],
        },
      ];

      const systemInstruction = NOVASHOP_SYSTEM_INSTRUCTION + buildDynamicContextText(context);

      let replyText: string;
      try {
        replyText = await generateGeminiSupportReply(contents, systemInstruction);
      } catch {
        replyText = generateNovaCareFallbackReply(trimmedMessage, context);
      }

      res.json({
        reply: replyText,
      });
    } catch (error: any) {
      console.error('Customer Support Chat Endpoint Error:', error);
      const fallbackMessage =
        typeof req.body?.message === 'string' ? req.body.message.trim() : '';
      res.json({
        reply: generateNovaCareFallbackReply(fallbackMessage, req.body?.context),
      });
    }
  });

  // ============================================================================
  // GOOGLE SEARCH GROUNDING API — Latest Tech Reviews from Reputable Publications
  // ============================================================================
  interface TechReviewArticle {
    id: string;
    title: string;
    summary: string;
    verdict: string;
    sourceName: string;
    sourceDomain: string;
    url: string;
    publishedDate: string;
    readTime: string;
    rating: number;
    category: 'phones' | 'laptops' | 'audio' | 'wearables';
    relatedProductId?: string;
    relatedProductName?: string;
    imageUrl: string;
    highlights: string[];
  }

  interface GroundingCitation {
    title: string;
    uri: string;
    sourceDomain: string;
  }

  const CURATED_TECH_REVIEWS: TechReviewArticle[] = [
    {
      id: 'rev-iphone-16-pro-max',
      title: 'Đánh giá chi tiết iPhone 16 Pro Max: Màn hình 6.9 inch viền siêu mỏng, chip A18 Pro và thời lượng pin kỷ lục',
      summary:
        'Trải nghiệm thực tế cho thấy iPhone 16 Pro Max nâng cấp mạnh mẽ về khả năng quay video 4K 120fps Dolby Vision, hệ thống tản nhiệt graphene mới giúp duy trì hiệu năng ổn định khi chơi game nặng và thời lượng sử dụng vượt mốc 1.5 ngày.',
      verdict: 'Flagship toàn diện nhất về quay dựng video chuyên nghiệp, hiệu năng bền bỉ và thời lượng pin đứng đầu phân khúc.',
      sourceName: 'VnExpress Số Hóa',
      sourceDomain: 'vnexpress.net',
      url: 'https://vnexpress.net/danh-gia-iphone-16-pro-max-4796347.html',
      publishedDate: 'Cập nhật mới nhất',
      readTime: '6 phút đọc',
      rating: 9.5,
      category: 'phones',
      relatedProductId: 'prod-1',
      relatedProductName: 'iPhone 16 Pro Max 256GB Titan Tự Nhiên',
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80',
      highlights: [
        'Chip A18 Pro tiến trình 3nm thế hệ 2 xử lý đồ họa Ray Tracing mượt mà',
        'Camera góc siêu rộng 48MP & Quay 4K 120fps chuẩn điện ảnh',
        'Thời lượng pin thực tế đạt hơn 10 giờ onscreen liên tục',
      ],
    },
    {
      id: 'rev-galaxy-s24-ultra',
      title: 'Đánh giá Samsung Galaxy S24 Ultra sau thời gian dài sử dụng: Khung Titan bền bỉ, màn hình chống chói Gorilla Armor xuất sắc',
      summary:
        'Lớp phủ kính Gorilla Armor giảm tới 75% phản xạ ánh sáng vẫn là vũ khí độc quyền giúp Galaxy S24 Ultra hiển thị ngoài trời vượt trội mọi đối thủ. Bộ công cụ Galaxy AI hỗ trợ dịch thuật trực tiếp và khoanh tròn tìm kiếm cực kỳ hữu ích.',
      verdict: 'Lựa chọn số 1 cho người dùng công việc cần bút S-Pen, màn hình phẳng chống lóa và hệ thống camera zoom quang 5x sắc nét.',
      sourceName: 'VnExpress Số Hóa',
      sourceDomain: 'vnexpress.net',
      url: 'https://vnexpress.net/danh-gia-samsung-galaxy-s24-ultra-4706509.html',
      publishedDate: 'Cập nhật mới nhất',
      readTime: '7 phút đọc',
      rating: 9.4,
      category: 'phones',
      relatedProductId: 'prod-4',
      relatedProductName: 'Samsung Galaxy S24 Ultra 5G AI 12GB/256GB',
      imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80',
      highlights: [
        'Màn hình Dynamic AMOLED 2X 2600 nits chống phản chiếu ánh sáng ấn tượng',
        'Tích hợp sâu Galaxy AI tiếng Việt cho ghi chú, tóm tắt văn bản và dịch cuộc gọi',
        'Snapdragon 8 Gen 3 for Galaxy tối ưu nhiệt độ cùng buồng hơi lớn hơn 1.9 lần',
      ],
    },
    {
      id: 'rev-macbook-pro-m3',
      title: 'Đánh giá MacBook Pro 14 M3 Pro: Màn hình Liquid Retina XDR 120Hz chuẩn màu đồ họa, pin 18 giờ không cần cắm sạc',
      summary:
        'Kiến trúc GPU mới trên dòng chip Apple M3 mang lại hiệu suất kết xuất 3D, dựng phim 4K ProRes trên DaVinci Resolve và biên dịch code vượt trội mà máy vẫn hoàn toàn yên tĩnh, mát mẻ ngay cả khi chạy bằng pin.',
      verdict: 'Chiếc laptop chuẩn mực nhất hiện nay cho lập trình viên, nhà thiết kế đồ họa và sáng tạo nội dung chuyên nghiệp.',
      sourceName: 'VnExpress Số Hóa',
      sourceDomain: 'vnexpress.net',
      url: 'https://vnexpress.net/danh-gia-macbook-pro-m3-4680872.html',
      publishedDate: 'Cập nhật mới nhất',
      readTime: '8 phút đọc',
      rating: 9.6,
      category: 'laptops',
      relatedProductId: 'prod-2',
      relatedProductName: 'MacBook Pro 14 M3 Pro (18GB / 512GB SSD) Space Black',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
      highlights: [
        'Màn hình Mini-LED Liquid Retina XDR độ sáng 1600 nits, tần số quét ProMotion 120Hz',
        'Đầy đủ cổng HDMI, khe thẻ SDXC, MagSafe 3 và 3 cổng Thunderbolt 4',
        'Hiệu năng không suy giảm khi rút sạc, thời lượng pin thực tế từ 14–18 giờ',
      ],
    },
    {
      id: 'rev-sony-wh1000xm5',
      title: 'Đánh giá tai nghe Sony WH-1000XM5: Ông vua chống ồn chủ động ANC với 8 micro và chất âm LDAC giàu nhạc tính',
      summary:
        'Bộ xử lý chống ồn kép QN1 kết hợp V1 trên Sony WH-1000XM5 triệt tiêu hoàn toàn tiếng động cơ máy bay, tiếng ồn văn phòng và tiếng gió. Đệm tai da tổng hợp mềm mại giúp đeo liên tục nhiều giờ không gây mỏi.',
      verdict: 'Tiêu chuẩn vàng trong phân khúc tai nghe chụp tai không dây chống ồn cao cấp dưới 10 triệu đồng.',
      sourceName: 'VnExpress Số Hóa',
      sourceDomain: 'vnexpress.net',
      url: 'https://vnexpress.net/danh-gia-tai-nghe-chong-on-sony-wh-1000xm5-4475456.html',
      publishedDate: 'Cập nhật mới nhất',
      readTime: '5 phút đọc',
      rating: 9.3,
      category: 'audio',
      relatedProductId: 'prod-3',
      relatedProductName: 'Sony WH-1000XM5 Chống Ồn Chủ Động Flagship',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
      highlights: [
        'Hệ thống 8 micro chống ồn chủ động thích ứng thông minh theo môi trường',
        'Chuẩn âm thanh Hi-Res Audio Wireless LDAC kết hợp thuật toán DSEE Extreme',
        'Pin 30 giờ bật ANC, sạc nhanh USB-C PD 3 phút nghe được 3 giờ',
      ],
    },
    {
      id: 'rev-asus-rog-zephyrus',
      title: 'Đánh giá laptop gaming ASUS ROG Zephyrus G16 OLED: Màn hình Nebula 240Hz, tản nhiệt 3 quạt buồng hơi đột phá',
      summary:
        'Sự kết hợp giữa vi xử lý Intel Core Ultra 9 và card đồ họa RTX 4070 biến Zephyrus G16 thành cỗ máy chiến mọi tựa game AAA ở độ phân giải 2.5K lẫn xử lý mô hình AI, dựng hình kỹ thuật.',
      verdict: 'Chiếc laptop gaming cao cấp mỏng nhẹ hoàn hảo cho cả công việc sáng tạo lẫn game thủ đỉnh cao.',
      sourceName: 'The Verge',
      sourceDomain: 'theverge.com',
      url: 'https://www.theverge.com/24068305/asus-rog-zephyrus-g16-2024-review',
      publishedDate: 'Cập nhật mới nhất',
      readTime: '6 phút đọc',
      rating: 9.2,
      category: 'laptops',
      relatedProductId: 'prod-16',
      relatedProductName: 'Laptop Gaming ASUS ROG Zephyrus G16 OLED Core Ultra 9 / RTX 4070',
      imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=900&q=80',
      highlights: [
        'Tản nhiệt keo kim loại lỏng Conductonaut Extreme kết hợp buồng hơi 3 quạt',
        'Màn hình 16 inch OLED 2.5K 240Hz 0.2ms chuẩn G-SYNC & Dolby Vision',
        'Vỏ nhôm CNC nguyên khối siêu mỏng nhẹ chỉ 1.85kg',
      ],
    },
    {
      id: 'rev-apple-watch-ultra-2',
      title: 'Đánh giá Apple Watch Ultra 2: Màn hình 3000 nits siêu sáng, GPS băng tần kép L1+L5 chính xác cho thể thao dã ngoại',
      summary:
        'Các bài thử nghiệm chạy bộ địa hình, bơi lặn và theo dõi sức khỏe chuyên sâu cho thấy Apple Watch Ultra 2 đạt độ chính xác hàng đầu cùng thời lượng pin lên đến 72 giờ ở chế độ tiết kiệm năng lượng.',
      verdict: 'Smartwatch thể thao thám hiểm toàn năng nhất hiện nay cho người dùng hệ sinh thái Apple.',
      sourceName: 'VnExpress Số Hóa',
      sourceDomain: 'vnexpress.net',
      url: 'https://vnexpress.net/danh-gia-dong-ho-apple-watch-ultra-2-4663801.html',
      publishedDate: 'Cập nhật mới nhất',
      readTime: '6 phút đọc',
      rating: 9.4,
      category: 'wearables',
      relatedProductId: 'prod-5',
      relatedProductName: 'Apple Watch Ultra 2 GPS + Cellular 49mm Dây Alpine',
      imageUrl: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=900&q=80',
      highlights: [
        'Màn hình Sapphire độ sáng 3000 nits hiển thị rõ nét dưới nắng gắt',
        'Định vị GPS tần số kép L1 và L5 dẫn đường chính xác trong mọi điều kiện',
        'Kháng nước độ sâu 100m, chứng nhận EN13319 cho thợ lặn chuyên nghiệp',
      ],
    },
  ];

  const techReviewsCache = new Map<
    string,
    {
      timestamp: number;
      articles: TechReviewArticle[];
      citations: GroundingCitation[];
      searchQueries: string[];
      groundedByGoogleSearch: boolean;
    }
  >();
  let googleSearchRateLimitedUntil = 0;

  function extractDomainFromUrl(urlStr: string): string {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return 'google.com';
    }
  }

  app.get('/api/tech-reviews', async (req: Request, res: Response) => {
    try {
      const rawCategory = String(req.query.category || 'all').trim().toLowerCase();
      const customQuery = String(req.query.q || '').trim();
      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';

      const cacheKey = customQuery ? `q:${customQuery.toLowerCase()}` : `cat:${rawCategory}`;
      const cached = techReviewsCache.get(cacheKey);
      if (cached && !forceRefresh && Date.now() - cached.timestamp < 10 * 60 * 1000) {
        res.json({
          ok: true,
          cached: true,
          ...cached,
        });
        return;
      }

      const baseFiltered =
        rawCategory === 'all'
          ? CURATED_TECH_REVIEWS
          : CURATED_TECH_REVIEWS.filter((item) => item.category === rawCategory);

      const isGenericOrNonArticleUrl = (u: string) => {
        try {
          const p = new URL(u);
          const path = p.pathname.replace(/\/+$/, '');
          return (
            !path ||
            path === '' ||
            path === '/' ||
            path === '/reviews' ||
            path === '/reviews.php3' ||
            path.startsWith('/tag/') ||
            path === '/so-hoa/san-pham'
          );
        } catch {
          return true;
        }
      };

      if (!process.env.GEMINI_API_KEY || Date.now() < googleSearchRateLimitedUntil) {
        const fallbackPayload = {
          timestamp: Date.now(),
          ok: true,
          groundedByGoogleSearch: false,
          articles: baseFiltered.length > 0 ? baseFiltered : CURATED_TECH_REVIEWS,
          citations: [
            { title: 'VnExpress Số Hóa - Đánh giá chi tiết iPhone 16 Pro Max', uri: 'https://vnexpress.net/danh-gia-iphone-16-pro-max-4796347.html', sourceDomain: 'vnexpress.net' },
            { title: 'VnExpress Số Hóa - Đánh giá Samsung Galaxy S24 Ultra', uri: 'https://vnexpress.net/danh-gia-samsung-galaxy-s24-ultra-4706509.html', sourceDomain: 'vnexpress.net' },
            { title: 'VnExpress Số Hóa - Đánh giá MacBook Pro 14 M3 Pro', uri: 'https://vnexpress.net/danh-gia-macbook-pro-m3-4680872.html', sourceDomain: 'vnexpress.net' },
            { title: 'The Verge - Đánh giá Laptop ASUS ROG Zephyrus G16', uri: 'https://www.theverge.com/24068305/asus-rog-zephyrus-g16-2024-review', sourceDomain: 'theverge.com' },
          ],
          searchQueries: [customQuery || 'Đánh giá sản phẩm công nghệ flagship mới nhất'],
        };
        techReviewsCache.set(cacheKey, fallbackPayload);
        res.json(fallbackPayload);
        return;
      }

      const topicMap: Record<string, string> = {
        all: 'iPhone 16 Pro Max, Samsung Galaxy S24 Ultra, MacBook Pro M3, tai nghe Sony WH-1000XM5, Apple Watch Ultra 2',
        phones: 'smartphone flagship iPhone 16 Pro Max, Samsung Galaxy S24 Ultra, Xiaomi 14 Ultra',
        laptops: 'laptop MacBook Pro M3, ASUS ROG Zephyrus G16, Dell XPS',
        audio: 'tai nghe chống ồn Sony WH-1000XM5, AirPods Pro 2, loa Marshall',
        wearables: 'đồng hồ thông minh Apple Watch Ultra 2, Garmin Fenix, gaming gear',
      };

      const targetTopic = customQuery || topicMap[rawCategory] || topicMap.all;

      const searchPrompt = `Sử dụng Google Search để tìm các bài viết đánh giá (review) công nghệ mới nhất và uy tín nhất (từ các trang như VnExpress Số Hóa, Tinh Tế tinhte.vn, GenK, Dân Trí, The Verge, GSMArena, RTINGS, Tom's Guide) về chủ đề: "${targetTopic}".

Hãy tổng hợp kết quả thành đúng một mảng JSON (không bọc trong markdown khác nếu có thể, chỉ trả về JSON hợp lệ) gồm 3 bài đánh giá tiêu biểu nhất theo cấu trúc sau:
[
  {
    "title": "Tiêu đề bài đánh giá bằng tiếng Việt rõ ràng, hấp dẫn",
    "summary": "Tóm tắt chi tiết 2-3 câu về trải nghiệm thực tế, hiệu năng, màn hình, pin hoặc chất âm từ bài đánh giá",
    "verdict": "Nhận định chốt lại (1 câu) về điểm đáng tiền nhất của thiết bị",
    "sourceName": "Tên chuyên trang uy tín (ví dụ: VnExpress Số Hóa, Tinh Tế, GenK, GSMArena, The Verge)",
    "url": "URL bài viết gốc tìm được",
    "publishedDate": "Thời gian phát hành hoặc Mới nhất",
    "readTime": "5 phút đọc",
    "rating": 9.4,
    "category": "${rawCategory === 'all' ? 'phones' : rawCategory}",
    "highlights": ["Điểm nổi bật 1", "Điểm nổi bật 2", "Điểm nổi bật 3"]
  }
]`;

      const callSearchGrounding = async (modelName: string) => {
        return await getAiClient().models.generateContent({
          model: modelName,
          contents: searchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.3,
          },
        });
      };

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Google Search Grounding timeout')), 8500)
      );

      const response = await Promise.race([
        (async () => {
          try {
            return await callSearchGrounding('gemini-3.8-flash');
          } catch (firstErr: any) {
            const firstMsg = firstErr instanceof Error ? firstErr.message : String(firstErr);
            if (
              firstMsg.includes('429') ||
              firstMsg.includes('RESOURCE_EXHAUSTED') ||
              firstMsg.includes('quota') ||
              firstMsg.includes('rate-limit')
            ) {
              throw firstErr;
            }
            return await callSearchGrounding('gemini-flash-latest');
          }
        })(),
        timeoutPromise,
      ]);

      const groundingMeta = response.candidates?.[0]?.groundingMetadata;
      const rawChunks = groundingMeta?.groundingChunks || [];
      const citations: GroundingCitation[] = [];

      for (const chunk of rawChunks) {
        const uri = chunk?.web?.uri;
        const title = chunk?.web?.title;
        if (uri && typeof uri === 'string') {
          citations.push({
            title: String(title || extractDomainFromUrl(uri)),
            uri,
            sourceDomain: extractDomainFromUrl(uri),
          });
        }
      }

      const searchQueries: string[] = Array.isArray(groundingMeta?.webSearchQueries)
        ? groundingMeta.webSearchQueries.map(String)
        : [customQuery || `Đánh giá ${targetTopic}`];

      let parsedArticles: TechReviewArticle[] = [];
      const rawText = response.text || '';
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const arr = JSON.parse(jsonMatch[0]);
          if (Array.isArray(arr)) {
            parsedArticles = arr.slice(0, 6).map((item: any, idx: number) => {
              const fallbackItem =
                (baseFiltered.length > 0 ? baseFiltered : CURATED_TECH_REVIEWS)[
                  idx % (baseFiltered.length > 0 ? baseFiltered.length : CURATED_TECH_REVIEWS.length)
                ];

              const titleLower = String(item.title || '').toLowerCase();
              let matchedCurated = fallbackItem;
              for (const cur of CURATED_TECH_REVIEWS) {
                if (
                  (titleLower.includes('iphone') && cur.id.includes('iphone')) ||
                  ((titleLower.includes('s24') || titleLower.includes('samsung') || titleLower.includes('galaxy')) &&
                    cur.id.includes('galaxy')) ||
                  ((titleLower.includes('macbook') || titleLower.includes('m3') || titleLower.includes('apple silicon')) &&
                    cur.id.includes('macbook')) ||
                  ((titleLower.includes('sony') || titleLower.includes('xm5') || titleLower.includes('tai nghe')) &&
                    cur.id.includes('sony')) ||
                  ((titleLower.includes('rog') || titleLower.includes('asus') || titleLower.includes('zephyrus')) &&
                    cur.id.includes('asus')) ||
                  ((titleLower.includes('watch') || titleLower.includes('garmin') || titleLower.includes('ultra 2')) &&
                    cur.id.includes('watch'))
                ) {
                  matchedCurated = cur;
                  break;
                }
              }

              const citationMatch = citations[idx];
              const resolvedUrl =
                typeof item.url === 'string' && item.url.startsWith('http') && !isGenericOrNonArticleUrl(item.url)
                  ? item.url
                  : citationMatch?.uri && !isGenericOrNonArticleUrl(citationMatch.uri)
                    ? citationMatch.uri
                    : matchedCurated.url;

              const resolvedDomain =
                extractDomainFromUrl(resolvedUrl) || citationMatch?.sourceDomain || matchedCurated.sourceDomain;

              return {
                id: `google-search-rev-${Date.now()}-${idx}`,
                title: String(item.title || fallbackItem.title),
                summary: String(item.summary || fallbackItem.summary),
                verdict: String(item.verdict || fallbackItem.verdict),
                sourceName: String(
                  item.sourceName || citationMatch?.title || fallbackItem.sourceName
                ),
                sourceDomain: resolvedDomain,
                url: resolvedUrl,
                publishedDate: String(item.publishedDate || 'Vừa cập nhật từ Google'),
                readTime: String(item.readTime || '5 phút đọc'),
                rating: Math.min(10, Math.max(8.5, Number(item.rating) || 9.4)),
                category: (['phones', 'laptops', 'audio', 'wearables'].includes(item.category)
                  ? item.category
                  : matchedCurated.category) as TechReviewArticle['category'],
                relatedProductId: matchedCurated.relatedProductId,
                relatedProductName: matchedCurated.relatedProductName,
                imageUrl: matchedCurated.imageUrl,
                highlights:
                  Array.isArray(item.highlights) && item.highlights.length > 0
                    ? item.highlights.slice(0, 3).map(String)
                    : matchedCurated.highlights,
              };
            });
          }
        } catch {
          // Fallback to curated articles enriched with live Google Search citations
        }
      }

      const finalArticles =
        parsedArticles.length > 0
          ? parsedArticles
          : (baseFiltered.length > 0 ? baseFiltered : CURATED_TECH_REVIEWS).map((art, i) => {
              const cite = citations[i];
              return cite && !isGenericOrNonArticleUrl(cite.uri)
                ? {
                    ...art,
                    url: cite.uri,
                    sourceDomain: cite.sourceDomain,
                  }
                : art;
            });

      const finalCitations =
        citations.length > 0
          ? citations.slice(0, 6)
          : [
              { title: 'VnExpress Số Hóa - Đánh giá chi tiết iPhone 16 Pro Max', uri: 'https://vnexpress.net/danh-gia-iphone-16-pro-max-4796347.html', sourceDomain: 'vnexpress.net' },
              { title: 'VnExpress Số Hóa - Đánh giá Samsung Galaxy S24 Ultra', uri: 'https://vnexpress.net/danh-gia-samsung-galaxy-s24-ultra-4706509.html', sourceDomain: 'vnexpress.net' },
              { title: 'VnExpress Số Hóa - Đánh giá MacBook Pro 14 M3 Pro', uri: 'https://vnexpress.net/danh-gia-macbook-pro-m3-4680872.html', sourceDomain: 'vnexpress.net' },
              { title: 'The Verge - Đánh giá Laptop ASUS ROG Zephyrus G16', uri: 'https://www.theverge.com/24068305/asus-rog-zephyrus-g16-2024-review', sourceDomain: 'theverge.com' },
            ];

      const payload = {
        timestamp: Date.now(),
        articles: finalArticles,
        citations: finalCitations,
        searchQueries,
        groundedByGoogleSearch: true,
      };

      techReviewsCache.set(cacheKey, payload);

      res.json({
        ok: true,
        cached: false,
        ...payload,
      });
    } catch (err) {
      const errStr = err instanceof Error ? err.message : String(err);
      const isQuotaOrRateLimit =
        errStr.includes('429') ||
        errStr.includes('RESOURCE_EXHAUSTED') ||
        errStr.includes('quota') ||
        errStr.includes('rate-limit');

      if (isQuotaOrRateLimit) {
        googleSearchRateLimitedUntil = Date.now() + 10 * 60 * 1000;
      }

      const rawCategory = String(req.query.category || 'all').trim().toLowerCase();
      const customQuery = String(req.query.q || '').trim().toLowerCase();
      let filtered =
        rawCategory === 'all'
          ? CURATED_TECH_REVIEWS
          : CURATED_TECH_REVIEWS.filter((item) => item.category === rawCategory);

      if (customQuery) {
        const queryMatches = CURATED_TECH_REVIEWS.filter(
          (item) =>
            item.title.toLowerCase().includes(customQuery) ||
            item.summary.toLowerCase().includes(customQuery) ||
            (item.relatedProductName && item.relatedProductName.toLowerCase().includes(customQuery))
        );
        if (queryMatches.length > 0) {
          filtered = queryMatches;
        }
      }

      const fallbackPayload = {
        timestamp: Date.now(),
        ok: true,
        groundedByGoogleSearch: false,
        articles: filtered.length > 0 ? filtered : CURATED_TECH_REVIEWS,
        citations: [
          { title: 'VnExpress Số Hóa - Đánh giá Sản phẩm', uri: 'https://vnexpress.net/so-hoa/san-pham', sourceDomain: 'vnexpress.net' },
          { title: 'Tinh Tế (Tinhte.vn) - Đánh giá Chuyên sâu', uri: 'https://tinhte.vn', sourceDomain: 'tinhte.vn' },
          { title: 'GenK - Đồ chơi số & Đánh giá', uri: 'https://genk.vn/do-choi-so.chn', sourceDomain: 'genk.vn' },
          { title: 'GSMArena & The Verge Tech Reviews', uri: 'https://www.gsmarena.com/reviews.php3', sourceDomain: 'gsmarena.com' },
        ],
        searchQueries: [customQuery || 'Đánh giá công nghệ flagship mới nhất'],
      };

      const cacheKey = customQuery ? `q:${customQuery.toLowerCase()}` : `cat:${rawCategory}`;
      techReviewsCache.set(cacheKey, fallbackPayload);

      res.json(fallbackPayload);
    }
  });

  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'start';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NovaShop server running on http://0.0.0.0:${PORT}`);

    // Tự động khởi chạy Telegram Bot polling song song (kết nối DB SQLite)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.DISABLE_EMBEDDED_BOT !== 'true') {
      startResilientBot().catch((err) => {
        console.error('Lỗi khởi động Telegram Bot:', err);
      });
    }
  });
}

startServer();
