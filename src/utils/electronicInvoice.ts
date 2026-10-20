import { Order } from '../types';
import { formatVND } from '../data/mockData';

const VIETNAMESE_DIGITS = [
  'không',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
];

function readThreeDigits(num: number, showZeroHundred: boolean): string {
  const hundred = Math.floor(num / 100);
  const ten = Math.floor((num % 100) / 10);
  const unit = num % 10;
  const parts: string[] = [];

  if (hundred > 0 || showZeroHundred) {
    parts.push(`${VIETNAMESE_DIGITS[hundred]} trăm`);
  }

  if (ten > 1) {
    parts.push(`${VIETNAMESE_DIGITS[ten]} mươi`);
    if (unit === 1) {
      parts.push('mốt');
    } else if (unit === 4) {
      parts.push('tư');
    } else if (unit === 5) {
      parts.push('lăm');
    } else if (unit > 0) {
      parts.push(VIETNAMESE_DIGITS[unit]);
    }
  } else if (ten === 1) {
    parts.push('mười');
    if (unit === 5) {
      parts.push('lăm');
    } else if (unit > 0) {
      parts.push(VIETNAMESE_DIGITS[unit]);
    }
  } else if (ten === 0 && unit > 0) {
    if (hundred > 0 || showZeroHundred) {
      parts.push('lẻ');
    }
    parts.push(VIETNAMESE_DIGITS[unit]);
  }

  return parts.join(' ');
}

/**
 * Converts a VND numeric amount into standard Vietnamese accounting words
 * e.g. 28990000 -> "Hai mươi tám triệu chín trăm chín mươi nghìn đồng chẵn"
 */
export function numberToVietnameseWords(amount: number): string {
  const cleanAmount = Math.round(Math.abs(amount || 0));
  if (cleanAmount === 0) return 'Không đồng chẵn';

  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
  const groups: number[] = [];
  let temp = cleanAmount;

  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const textParts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const grp = groups[i];
    if (grp > 0) {
      const showZeroHundred = i < groups.length - 1;
      const grpText = readThreeDigits(grp, showZeroHundred);
      const unitLabel = units[i] || '';
      textParts.push(unitLabel ? `${grpText} ${unitLabel}` : grpText);
    }
  }

  const rawSentence = textParts.join(' ').replace(/\s+/g, ' ').trim();
  const capitalized = rawSentence.charAt(0).toUpperCase() + rawSentence.slice(1);
  return `${capitalized} đồng chẵn`;
}

export interface ElectronicInvoiceMetadata {
  formCode: string; // Mẫu số: 01GTKT0/001
  serialCode: string; // Ký hiệu: NV/26E
  invoiceNumber: string; // Số: 0008492
  taxAuthorityCode: string; // Mã CQT
  lookupCode: string; // Mã tra cứu HĐĐT
  issueDateFormatted: string;
  sellerName: string;
  sellerTaxId: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerBankAccount: string;
  paymentMethodText: string;
  paymentStatusText: string;
  amountInWords: string;
  vatRatePercent: number;
  preTaxSubtotal: number;
  vatAmount: number;
}

export function getElectronicInvoiceMetadata(order: Order): ElectronicInvoiceMetadata {
  const numericSeed =
    order.id
      .replace(/\D/g, '')
      .slice(-5)
      .padStart(5, '8') || '84921';
  const invoiceNumber = `00${numericSeed}`;
  const taxAuthorityCode = `CQT-NV26-${order.id.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-99A`;
  const lookupCode = `NVHD${numericSeed}${order.id.slice(-3).toUpperCase()}`;

  const createdDate = new Date(order.createdAt || Date.now());
  const day = String(createdDate.getDate()).padStart(2, '0');
  const month = String(createdDate.getMonth() + 1).padStart(2, '0');
  const year = createdDate.getFullYear();
  const timeStr = createdDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentMethodText =
    {
      vietqr: 'Chuyển khoản VietQR Napas 24/7 (BIDV 3180530681)',
      card: 'Thẻ Quốc tế Visa / MasterCard / JCB (3D-Secure)',
      momo: 'Ví Điện Tử MoMo',
      vnpay: 'Cổng thanh toán VNPay-QR (BIDV 3180530681)',
      cod: 'Thanh toán tiền mặt khi nhận hàng (COD)',
      installment: `Trả góp 0% lãi suất (${
        order.installmentDetails?.providerName || 'Đối tác tài chính'
      } - ${order.installmentDetails?.tenureMonths || 6} tháng)`,
    }[order.paymentMethod] || 'Chuyển khoản / Trực tuyến';

  const paymentStatusText =
    order.paymentStatus === 'paid'
      ? 'Đã thanh toán (100%)'
      : order.paymentMethod === 'installment'
      ? 'Hồ sơ trả góp 0% đã phê duyệt'
      : 'Thanh toán khi nhận hàng (COD)';

  const vatRatePercent = 10;
  const preTaxSubtotal = Math.round(order.subtotal / 1.1);
  const vatAmount = Math.max(0, order.subtotal - preTaxSubtotal);

  return {
    formCode: '01GTKT0/001',
    serialCode: 'NV/26E',
    invoiceNumber,
    taxAuthorityCode,
    lookupCode,
    issueDateFormatted: `Ngày ${day} tháng ${month} năm ${year} (${timeStr})`,
    sellerName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVASHOP VIỆT NAM',
    sellerTaxId: '0317892341',
    sellerAddress:
      '219/20 đường số 12, Phường Bình Hưng Hòa, Quận Bình Tân, Thành phố Hồ Chí Minh, Việt Nam',
    sellerPhone: '0908061843',
    sellerEmail: 'support@novashop.vn',
    sellerBankAccount:
      '3180530681 — Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV) — Chủ TK: TRUONG MINH QUOC TRI',
    paymentMethodText,
    paymentStatusText,
    amountInWords: numberToVietnameseWords(order.total),
    vatRatePercent,
    preTaxSubtotal,
    vatAmount,
  };
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a complete, self-contained A4 HTML document for printing or downloading the Electronic Invoice.
 */
export function buildElectronicInvoiceHtmlDocument(order: Order): string {
  const meta = getElectronicInvoiceMetadata(order);
  const signedDate = new Date(
    order.qrTransactionDetails?.confirmedAt || order.confirmedAt || order.createdAt || Date.now()
  ).toLocaleString('vi-VN');

  const itemsRowsHtml = order.items
    .map((item, idx) => {
      const lineTotal = item.product.price * item.quantity;
      const colorNote = item.selectedColor ? ` — Phân loại: ${escapeHtml(item.selectedColor)}` : '';
      return `
        <tr>
          <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${escapeHtml(item.product.name)}${colorNote}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">
              Bảo hành điện tử chính hãng 12–24 tháng • Mã SP: NV-${escapeHtml(String(item.product.id).padStart(4, '0'))}
            </div>
          </td>
          <td style="text-align: center;">Chiếc</td>
          <td style="text-align: center; font-weight: 700;">${item.quantity}</td>
          <td style="text-align: right; font-variant-numeric: tabular-nums;">${formatVND(item.product.price)}</td>
          <td style="text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; color: #0f172a;">${formatVND(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  const installmentBoxHtml = order.installmentDetails
    ? `
      <div style="margin-top: 12px; padding: 10px 14px; border: 1px dashed #d97706; background: #fffbeb; border-radius: 8px; font-size: 12px;">
        <div style="font-weight: 800; color: #92400e; margin-bottom: 4px;">
          PHỤ LỤC HỢP ĐỒNG TRẢ GÓP 0% LÃI SUẤT — ${escapeHtml(order.installmentDetails.providerName)}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 16px; color: #1e293b;">
          <span>Kỳ hạn: <strong>${order.installmentDetails.tenureMonths} tháng</strong></span>
          <span>Trả trước (${order.installmentDetails.downPaymentPercent}%): <strong>${formatVND(order.installmentDetails.downPaymentAmount)}</strong></span>
          <span>Góp mỗi tháng: <strong style="color: #3730a3;">${formatVND(order.installmentDetails.monthlyPayment)}/tháng</strong></span>
          <span>Mã hồ sơ: <strong>${escapeHtml(order.installmentDetails.approvalCode || order.id)}</strong></span>
        </div>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hóa Đơn Điện Tử #${escapeHtml(order.id)} - NovaShop Việt Nam</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 12.5px;
      line-height: 1.45;
    }
    .invoice-sheet {
      max-width: 794px;
      margin: 0 auto;
      border: 2px solid #1e3a8a;
      border-radius: 10px;
      padding: 20px 24px;
      background: #ffffff;
      position: relative;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 14px;
      gap: 16px;
    }
    .seller-block {
      flex: 1;
    }
    .brand-badge {
      display: inline-block;
      background: #1e3a8a;
      color: #ffffff;
      font-weight: 900;
      font-size: 16px;
      padding: 4px 12px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .seller-name {
      font-size: 14px;
      font-weight: 800;
      color: #1e3a8a;
      text-transform: uppercase;
      margin: 2px 0;
    }
    .meta-line {
      font-size: 11.5px;
      color: #334155;
      margin: 2px 0;
    }
    .serial-block {
      text-align: right;
      min-width: 195px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 11.5px;
    }
    .title-section {
      text-align: center;
      padding: 14px 0 10px;
    }
    .invoice-title {
      font-size: 20px;
      font-weight: 900;
      color: #1e3a8a;
      margin: 0;
      letter-spacing: 0.4px;
    }
    .invoice-subtitle {
      font-size: 11.5px;
      font-weight: 700;
      color: #475569;
      margin: 2px 0 4px;
    }
    .cqt-code {
      display: inline-block;
      font-family: monospace;
      font-size: 11px;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 2px 10px;
      border-radius: 4px;
      font-weight: 700;
    }
    .buyer-box {
      margin-top: 10px;
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .buyer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      font-size: 12px;
    }
    .buyer-full {
      grid-column: 1 / -1;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 12px;
    }
    table.items-table th {
      background: #1e3a8a;
      color: #ffffff;
      font-weight: 700;
      padding: 8px 10px;
      border: 1px solid #1e3a8a;
      font-size: 11.5px;
    }
    table.items-table td {
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }
    .totals-box {
      margin-top: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .totals-row.grand-total {
      background: #eff6ff;
      font-size: 14px;
      font-weight: 900;
      color: #1e3a8a;
      border-bottom: none;
      padding: 9px 12px;
    }
    .words-box {
      margin-top: 10px;
      padding: 8px 12px;
      background: #f8fafc;
      border-left: 4px solid #1e3a8a;
      font-size: 12px;
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      gap: 20px;
    }
    .sig-col {
      flex: 1;
      text-align: center;
    }
    .digital-stamp {
      margin-top: 8px;
      display: inline-block;
      text-align: left;
      border: 2px solid #059669;
      background: #ecfdf5;
      color: #065f46;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 11px;
      max-width: 280px;
    }
    .footer-note {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      font-size: 10.5px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    .print-toolbar {
      max-width: 794px;
      margin: 0 auto 14px;
      padding: 10px 16px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .print-toolbar {
        display: none !important;
      }
      .invoice-sheet {
        max-width: 100%;
        border-width: 1.5px;
      }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <div>
      <strong>Hóa Đơn Điện Tử NovaShop #${escapeHtml(order.id)}</strong>
      <span style="font-size: 11px; color: #94a3b8; margin-left: 8px;">Chuẩn định dạng in A4 / Lưu PDF</span>
    </div>
    <button class="print-btn" onclick="window.print()">🖨️ In Hóa Đơn / Lưu PDF</button>
  </div>

  <div class="invoice-sheet">
    <div class="header-top">
      <div class="seller-block">
        <div class="brand-badge">NOVASHOP.VN</div>
        <div class="seller-name">${escapeHtml(meta.sellerName)}</div>
        <div class="meta-line">Mã số thuế (Tax ID): <strong>${escapeHtml(meta.sellerTaxId)}</strong></div>
        <div class="meta-line">Địa chỉ: ${escapeHtml(meta.sellerAddress)}</div>
        <div class="meta-line">Điện thoại: <strong>${escapeHtml(meta.sellerPhone)}</strong> • Email: ${escapeHtml(meta.sellerEmail)}</div>
        <div class="meta-line">Tài khoản NH: <strong>${escapeHtml(meta.sellerBankAccount)}</strong></div>
      </div>

      <div class="serial-block">
        <div>Mẫu số: <strong>${escapeHtml(meta.formCode)}</strong></div>
        <div>Ký hiệu: <strong>${escapeHtml(meta.serialCode)}</strong></div>
        <div>Số HĐ: <strong style="color: #dc2626; font-size: 14px; font-family: monospace;">${escapeHtml(meta.invoiceNumber)}</strong></div>
        <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
          Mã đơn: <strong style="color: #1e3a8a; font-family: monospace;">#${escapeHtml(order.id)}</strong>
        </div>
      </div>
    </div>

    <div class="title-section">
      <h1 class="invoice-title">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h1>
      <div class="invoice-subtitle">(BẢN THỂ HIỆN CỦA HÓA ĐƠN ĐIỆN TỬ)</div>
      <div style="font-size: 11.5px; color: #334155; margin-bottom: 6px;">${escapeHtml(meta.issueDateFormatted)}</div>
      <span class="cqt-code">Mã của Cơ quan thuế: ${escapeHtml(meta.taxAuthorityCode)}</span>
    </div>

    <div class="buyer-box">
      <div class="buyer-grid">
        <div>Họ tên người mua hàng: <strong>${escapeHtml(order.customer.fullName)}</strong></div>
        <div>Số điện thoại: <strong>${escapeHtml(order.customer.phone)}</strong></div>
        <div>Email nhận HĐĐT: <strong>${escapeHtml(order.customer.email)}</strong></div>
        <div>Mã giao dịch (Txn ID): <strong style="font-family: monospace;">${escapeHtml(order.qrTransactionDetails?.transactionId || order.transactionId || 'TXN-998811')}</strong></div>
        <div class="buyer-full">Địa chỉ giao hàng: <strong>${escapeHtml(order.customer.address)}, ${escapeHtml(order.customer.district)}, ${escapeHtml(order.customer.city)}</strong></div>
        <div>Hình thức thanh toán: <strong>${escapeHtml(meta.paymentMethodText)}</strong></div>
        <div>Trạng thái thanh toán: <strong style="color: #047857;">${escapeHtml(meta.paymentStatusText)}</strong></div>
        ${
          order.customer.note
            ? `<div class="buyer-full">Ghi chú đơn hàng: <em>"${escapeHtml(order.customer.note)}"</em></div>`
            : ''
        }
      </div>
    </div>

    ${installmentBoxHtml}

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 42px; text-align: center;">STT</th>
          <th style="text-align: left;">Tên hàng hóa, dịch vụ</th>
          <th style="width: 58px; text-align: center;">ĐVT</th>
          <th style="width: 54px; text-align: center;">SL</th>
          <th style="width: 125px; text-align: right;">Đơn giá</th>
          <th style="width: 135px; text-align: right;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
      </tbody>
    </table>

    <div class="totals-box">
      <div class="totals-row">
        <span>Cộng tiền hàng hóa, dịch vụ (Đã gồm thuế GTGT ${meta.vatRatePercent}%):</span>
        <strong style="font-variant-numeric: tabular-nums;">${formatVND(order.subtotal)}</strong>
      </div>
      <div class="totals-row" style="font-size: 11px; color: #475569; background: #f8fafc;">
        <span>Trong đó: Tiền hàng trước thuế: ${formatVND(meta.preTaxSubtotal)} • Thuế GTGT (${meta.vatRatePercent}%): ${formatVND(meta.vatAmount)}</span>
        <span>Đơn vị vận chuyển: ${escapeHtml(order.shipping.name)}</span>
      </div>
      <div class="totals-row">
        <span>Phí vận chuyển & bảo hiểm hàng hóa:</span>
        <strong>${order.shippingFee === 0 ? '0 ₫ (Miễn phí)' : formatVND(order.shippingFee)}</strong>
      </div>
      ${
        order.discount > 0
          ? `
        <div class="totals-row" style="color: #047857;">
          <span>Chiết khấu thương mại / Voucher (${escapeHtml(order.voucherCode || 'Ưu đãi NovaShop')}):</span>
          <strong>-${formatVND(order.discount)}</strong>
        </div>
      `
          : ''
      }
      <div class="totals-row grand-total">
        <span>TỔNG CỘNG TIỀN THANH TOÁN:</span>
        <span style="font-variant-numeric: tabular-nums;">${formatVND(order.total)}</span>
      </div>
    </div>

    <div class="words-box">
      Số tiền viết bằng chữ: <strong><em>${escapeHtml(meta.amountInWords)}</em></strong>
    </div>

    <div class="signatures-row">
      <div class="sig-col">
        <div style="font-weight: 800; color: #1e293b;">NGƯỜI MUA HÀNG</div>
        <div style="font-size: 11px; color: #64748b;">(Chữ ký số / Xác nhận đặt hàng trực tuyến)</div>
        <div style="margin-top: 14px; font-weight: 700; color: #334155;">${escapeHtml(order.customer.fullName)}</div>
        <div style="font-size: 10.5px; color: #059669; font-weight: 600; margin-top: 2px;">✓ Đã xác nhận giao dịch điện tử</div>
      </div>

      <div class="sig-col">
        <div style="font-weight: 800; color: #1e293b;">NGƯỜI BÁN HÀNG</div>
        <div style="font-size: 11px; color: #64748b;">(Chữ ký điện tử, chữ ký số)</div>
        <div class="digital-stamp">
          <div style="font-weight: 800; color: #047857;">✓ SIGNATURE VALID — ĐÃ KÝ SỐ HỢP LỆ</div>
          <div style="margin-top: 2px;">Ký bởi: <strong>${escapeHtml(meta.sellerName)}</strong></div>
          <div>MST: <strong>${escapeHtml(meta.sellerTaxId)}</strong></div>
          <div>Ký ngày: <strong>${escapeHtml(signedDate)}</strong></div>
        </div>
      </div>
    </div>

    <div class="footer-note">
      <div>
        Tra cứu Hóa đơn điện tử tại: <strong>https://novashop.vn/tra-cuu-hddt</strong> • Mã tra cứu: <strong style="color: #0f172a; font-family: monospace;">${escapeHtml(meta.lookupCode)}</strong>
      </div>
      <div>
        Chứng từ điện tử khởi tạo từ hệ thống NovaShop Việt Nam
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Prints the electronic invoice cleanly using a dedicated hidden iframe,
 * with automatic fallback to window.print() (backed by @media print CSS).
 */
export function printElectronicInvoice(order: Order): boolean {
  try {
    const htmlContent = buildElectronicInvoiceHtmlDocument(order);
    const existingFrame = document.getElementById('novashop-invoice-print-frame') as HTMLIFrameElement | null;
    if (existingFrame && existingFrame.parentNode) {
      existingFrame.parentNode.removeChild(existingFrame);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'novashop-invoice-print-frame';
    iframe.title = `In hóa đơn điện tử ${order.id}`;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!frameDoc || !iframe.contentWindow) {
      window.print();
      return true;
    }

    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    let hasPrinted = false;
    const triggerFramePrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
    };

    iframe.onload = () => {
      setTimeout(triggerFramePrint, 120);
    };

    // Fallback timer in case onload fired synchronously on document.close()
    setTimeout(triggerFramePrint, 250);
    return true;
  } catch {
    try {
      window.print();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Downloads the standalone printable A4 Electronic Invoice (.html) file directly to the user's device.
 */
export function downloadElectronicInvoiceHtml(order: Order): void {
  const htmlContent = buildElectronicInvoiceHtmlDocument(order);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Hoa-Don-Dien-Tu-NovaShop-${order.id}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export const DEFAULT_GAS_EMAIL_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyOcMYQ_YcXlMdB9uv-IcnI3crbvKkkYd5rdxJq0IajR3fc99aP8b7w1r-fRO9SW5j6Iw/exec';

const LEGACY_BANK_LOG_GAS_URL =
  'https://script.google.com/macros/s/AKfycbzmJyBCk_xk8gG-cW6M8VUk-v4f_3-_TTO6fpUEAW8F31z_BMc6Ysbgg6ENfryyhNbQ0g/exec';

const GAS_EMAIL_STORAGE_KEY = 'novashop_gas_email_url';

export function getConfiguredGasEmailUrl(): string {
  try {
    const saved = localStorage.getItem(GAS_EMAIL_STORAGE_KEY)?.trim();
    if (saved && saved.startsWith('https://script.google.com/')) {
      if (saved === LEGACY_BANK_LOG_GAS_URL) {
        localStorage.setItem(GAS_EMAIL_STORAGE_KEY, DEFAULT_GAS_EMAIL_WEBHOOK_URL);
        return DEFAULT_GAS_EMAIL_WEBHOOK_URL;
      }
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_GAS_EMAIL_WEBHOOK_URL;
}

export function setConfiguredGasEmailUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (!trimmed) {
      localStorage.removeItem(GAS_EMAIL_STORAGE_KEY);
    } else {
      localStorage.setItem(GAS_EMAIL_STORAGE_KEY, trimmed);
    }
  } catch {
    // ignore storage errors
  }
}

export const GAS_ORDER_EMAIL_SCRIPT_CODE = `// Mã Google Apps Script gửi email tự động miễn phí 100% qua Gmail (MailApp.sendEmail)
// Tích hợp 2 trong 1: Vừa nhận Webhook ngân hàng BIDV/SePay, vừa gửi Email xác nhận & Chào mừng trực tiếp vào Gmail của khách

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (errJson) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // 1. NHÁNH GỬI EMAIL (Thư chào mừng hoặc Hóa đơn VAT đơn hàng tới Gmail người dùng)
    var targetEmail = data.toEmail || data.to || data.recipientEmail || data.email;
    if (targetEmail && String(targetEmail).indexOf("@") !== -1) {
      var emailSubject = data.subject || "[NovaShop] Thông báo từ NovaShop Việt Nam";
      var emailBody = data.htmlBody || ("<p>Kính chào " + (data.customerName || "Quý khách") + ", cảm ơn bạn đã đồng hành cùng NovaShop!</p>");

      MailApp.sendEmail({
        to: targetEmail,
        subject: emailSubject,
        htmlBody: emailBody,
        name: "NovaShop Việt Nam"
      });

      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, success: true, emailSent: true, sentTo: targetEmail })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. NHÁNH WEBHOOK NGÂN HÀNG (SePay / BIDV / Casso / VietQR)
    // Lưu thông tin giao dịch vào Google Sheet hiện tại nếu có
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        var sheet = ss.getActiveSheet();
        sheet.appendRow([new Date(), JSON.stringify(data)]);
      }
    } catch (sheetErr) {
      // Bỏ qua lỗi sheet nếu chạy độc lập
    }

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, success: true, message: "Transaction recorded" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, success: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    
    // Nếu kiểm tra trạng thái đơn hàng ngân hàng
    if (params.order) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "pending", order: params.order })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Nếu gửi email qua GET Webhook
    var targetEmail = params.toEmail || params.to || params.email;
    if (targetEmail && String(targetEmail).indexOf("@") !== -1) {
      var emailSubject = params.subject || "[NovaShop] Chào mừng bạn gia nhập NovaShop! Quà tặng 10% 🎁";
      var emailBody = params.htmlBody || ("<p>Chào mừng bạn đến với NovaShop! Mã voucher: WELCOME10 giảm 10% cho đơn hàng đầu tiên.</p>");
      MailApp.sendEmail({
        to: targetEmail,
        subject: emailSubject,
        htmlBody: emailBody,
        name: "NovaShop Việt Nam"
      });
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, success: true, emailSent: true, sentTo: targetEmail })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, status: "ready", message: "NovaShop Google Apps Script Gateway Ready" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
};`;

/**
 * Builds a Gmail-compatible HTML email body and subject for an order confirmation & Electronic VAT Invoice.
 */
export function buildOrderConfirmationEmailPayload(
  order: Order,
  overrideEmail?: string
): {
  toEmail: string;
  subject: string;
  htmlBody: string;
} {
  const meta = getElectronicInvoiceMetadata(order);
  const toEmail = (overrideEmail ?? order.customer.email ?? '').trim();
  const signedDate = new Date(
    order.qrTransactionDetails?.confirmedAt || order.confirmedAt || order.createdAt || Date.now()
  ).toLocaleString('vi-VN');

  const isPaid = order.paymentStatus === 'paid';
  const isCod = order.paymentMethod === 'cod';
  const statusBannerBg = isPaid ? '#059669' : isCod ? '#b45309' : '#1e3a8a';
  const statusHeadline = isPaid
    ? 'GIAO DỊCH THANH TOÁN & ĐẶT HÀNG THÀNH CÔNG'
    : order.paymentMethod === 'installment'
    ? 'HỒ SƠ TRẢ GÓP 0% & ĐƠN HÀNG ĐÃ ĐƯỢC XÁC NHẬN'
    : 'XÁC NHẬN ĐẶT HÀNG THÀNH CÔNG (COD - TIỀN MẶT)';

  const subject = isCod
    ? `[NovaShop] Xác nhận đặt hàng COD #${order.id} — Thanh toán khi nhận hàng (${formatVND(order.total)})`
    : `[NovaShop] Xác nhận đơn hàng #${order.id} & Hóa đơn điện tử GTGT #${meta.invoiceNumber} (${formatVND(order.total)})`;

  const itemsRowsHtml = order.items
    .map((item, idx) => {
      const lineTotal = item.product.price * item.quantity;
      const colorNote = item.selectedColor
        ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">Phân loại màu: <strong>${escapeHtml(item.selectedColor)}</strong></div>`
        : '';
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;color:#334155;">${idx + 1}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;">
            <div style="font-weight:700;">${escapeHtml(item.product.name)}</div>
            ${colorNote}
            <div style="font-size:11px;color:#64748b;margin-top:2px;">Bảo hành điện tử chính hãng 12–24 tháng</div>
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;font-weight:700;color:#0f172a;">${item.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:13px;color:#334155;">${formatVND(item.product.price)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:13px;font-weight:700;color:#0f172a;">${formatVND(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  const codSectionHtml = isCod
    ? `
      <div style="margin:16px 0;padding:16px;background-color:#fffbeb;border:1.5px solid #f59e0b;border-radius:12px;font-size:13px;color:#78350f;line-height:1.6;">
        <div style="font-weight:800;font-size:14px;margin-bottom:8px;color:#92400e;text-transform:uppercase;">
          📦 THÔNG TIN ĐƠN HÀNG THANH TOÁN KHI NHẬN HÀNG (COD)
        </div>
        <div style="font-size:13px;margin-bottom:6px;">
          • <strong>Số tiền thanh toán cho nhân viên giao hàng:</strong> <span style="font-size:16px;font-weight:900;color:#b45309;">${formatVND(order.total)}</span>
        </div>
        <div>• <strong>Chính sách đồng kiểm:</strong> Quý khách được quyền kiểm tra ngoại quan kiện hàng và sản phẩm trước khi thanh toán.</div>
        <div>• <strong>Thời gian giao hàng dự kiến:</strong> ${escapeHtml(order.shipping.name)} (${escapeHtml(order.shipping.estimatedDays)}).</div>
        <div style="margin-top:6px;font-size:12px;color:#92400e;">
          <em>Nhân viên giao nhận của NovaShop sẽ gọi trực tiếp đến số điện thoại <strong>${escapeHtml(order.customer.phone)}</strong> để xác nhận trước khi giao hàng.</em>
        </div>
      </div>
    `
    : '';

  const installmentSectionHtml = order.installmentDetails
    ? `
      <div style="margin:16px 0;padding:14px;background-color:#fffbeb;border:1px solid #fcd34d;border-radius:10px;font-size:13px;color:#78350f;">
        <div style="font-weight:800;margin-bottom:6px;color:#92400e;">THÔNG TIN HỢP ĐỒNG TRẢ GÓP 0% LÃI SUẤT — ${escapeHtml(order.installmentDetails.providerName)}</div>
        <div>• Kỳ hạn trả góp: <strong>${order.installmentDetails.tenureMonths} tháng</strong></div>
        <div>• Trả trước (${order.installmentDetails.downPaymentPercent}%): <strong>${formatVND(order.installmentDetails.downPaymentAmount)}</strong></div>
        <div>• Góp mỗi tháng: <strong style="color:#1e3a8a;">${formatVND(order.installmentDetails.monthlyPayment)}/tháng</strong></div>
        <div>• Mã hồ sơ: <strong>${escapeHtml(order.installmentDetails.approvalCode || order.id)}</strong></div>
      </div>
    `
    : '';

  const htmlBody = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:680px;margin:20px auto;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #cbd5e1;">
    <!-- Header -->
    <div style="background-color:${statusBannerBg};color:#ffffff;padding:24px 28px;text-align:center;">
      <div style="display:inline-block;background-color:rgba(255,255,255,0.18);padding:4px 12px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:0.6px;margin-bottom:8px;">
        NOVASHOP VIỆT NAM — HÓA ĐƠN ĐIỆN TỬ GTGT
      </div>
      <h1 style="margin:0;font-size:20px;font-weight:800;letter-spacing:0.3px;">${statusHeadline}</h1>
      <p style="margin:6px 0 0;font-size:13px;opacity:0.92;">
        Cảm ơn <strong>${escapeHtml(order.customer.fullName)}</strong> đã mua sắm tại hệ thống NovaShop!
      </p>
    </div>

    <div style="padding:24px 28px;">
      <!-- Order & Invoice Metadata Summary -->
      <table style="width:100%;border-collapse:collapse;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:18px;">
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;">
            <span style="color:#64748b;">Mã đơn hàng:</span><br/>
            <strong style="font-size:15px;color:#1e3a8a;font-family:monospace;">#${escapeHtml(order.id)}</strong>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;">
            <span style="color:#64748b;">Số Hóa đơn điện tử:</span><br/>
            <strong style="font-size:15px;color:#dc2626;font-family:monospace;">${escapeHtml(meta.invoiceNumber)}</strong>
            <span style="font-size:11px;color:#64748b;"> (${escapeHtml(meta.serialCode)})</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 14px;font-size:13px;">
            <span style="color:#64748b;">Mã giao dịch (Txn ID):</span><br/>
            <strong style="font-family:monospace;color:#0f172a;">${escapeHtml(order.qrTransactionDetails?.transactionId || order.transactionId || 'TXN-998811')}</strong>
          </td>
          <td style="padding:12px 14px;font-size:13px;">
            <span style="color:#64748b;">Thời gian xác nhận:</span><br/>
            <strong style="color:#0f172a;">${escapeHtml(signedDate)}</strong>
          </td>
        </tr>
      </table>

      <!-- Customer & Delivery Details -->
      <div style="padding:14px 16px;background-color:#ffffff;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:18px;font-size:13px;line-height:1.6;">
        <div style="font-weight:800;color:#1e3a8a;text-transform:uppercase;font-size:12px;margin-bottom:6px;">
          Thông tin người mua & Địa chỉ nhận hàng
        </div>
        <div>• <strong>Khách hàng:</strong> ${escapeHtml(order.customer.fullName)} — <strong>SĐT:</strong> ${escapeHtml(order.customer.phone)}</div>
        <div>• <strong>Email nhận HĐĐT:</strong> ${escapeHtml(toEmail)}</div>
        <div>• <strong>Địa chỉ giao hàng:</strong> ${escapeHtml(order.customer.address)}, ${escapeHtml(order.customer.district)}, ${escapeHtml(order.customer.city)}</div>
        <div>• <strong>Phương thức vận chuyển:</strong> ${escapeHtml(order.shipping.name)} (${escapeHtml(order.shipping.estimatedDays)})</div>
        <div>• <strong>Phương thức thanh toán:</strong> ${escapeHtml(meta.paymentMethodText)}</div>
        <div>• <strong>Trạng thái thanh toán:</strong> <strong style="color:#059669;">${escapeHtml(meta.paymentStatusText)}</strong></div>
        ${
          order.customer.note
            ? `<div>• <strong>Ghi chú đơn hàng:</strong> <em>"${escapeHtml(order.customer.note)}"</em></div>`
            : ''
        }
      </div>

      ${installmentSectionHtml}
      ${codSectionHtml}

      <!-- Items Table -->
      <div style="font-weight:800;color:#1e3a8a;text-transform:uppercase;font-size:12px;margin-bottom:8px;">
        Chi tiết sản phẩm đặt mua (Hóa đơn GTGT ${escapeHtml(meta.formCode)})
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;margin-bottom:16px;">
        <thead>
          <tr style="background-color:#1e3a8a;color:#ffffff;font-size:12px;">
            <th style="padding:9px 6px;text-align:center;width:36px;">STT</th>
            <th style="padding:9px 8px;text-align:left;">Sản phẩm</th>
            <th style="padding:9px 6px;text-align:center;width:44px;">SL</th>
            <th style="padding:9px 8px;text-align:right;width:110px;">Đơn giá</th>
            <th style="padding:9px 8px;text-align:right;width:115px;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
      </table>

      <!-- Financial Summary -->
      <table style="width:100%;border-collapse:collapse;background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:14px;font-size:13px;">
        <tr>
          <td style="padding:8px 14px;color:#475569;">Tạm tính hàng hóa (Đã gồm VAT ${meta.vatRatePercent}%):</td>
          <td style="padding:8px 14px;text-align:right;font-weight:700;color:#0f172a;">${formatVND(order.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:6px 14px;font-size:11.5px;color:#64748b;">Trong đó: Tiền trước thuế: ${formatVND(meta.preTaxSubtotal)} • Thuế GTGT (10%): ${formatVND(meta.vatAmount)}</td>
          <td style="padding:6px 14px;text-align:right;font-size:11.5px;color:#64748b;">Mã CQT: ${escapeHtml(meta.taxAuthorityCode)}</td>
        </tr>
        <tr>
          <td style="padding:8px 14px;color:#475569;">Phí vận chuyển & bảo hiểm:</td>
          <td style="padding:8px 14px;text-align:right;font-weight:700;color:#059669;">${order.shippingFee === 0 ? 'Miễn phí (0 ₫)' : formatVND(order.shippingFee)}</td>
        </tr>
        ${
          order.discount > 0
            ? `<tr>
                <td style="padding:8px 14px;color:#059669;">Voucher giảm giá (${escapeHtml(order.voucherCode || 'Ưu đãi NovaShop')}):</td>
                <td style="padding:8px 14px;text-align:right;font-weight:700;color:#059669;">-${formatVND(order.discount)}</td>
              </tr>`
            : ''
        }
        <tr style="background-color:#eff6ff;border-top:2px solid #bfdbfe;">
          <td style="padding:12px 14px;font-size:15px;font-weight:800;color:#1e3a8a;">TỔNG CỘNG THANH TOÁN:</td>
          <td style="padding:12px 14px;text-align:right;font-size:17px;font-weight:900;color:#1e3a8a;">${formatVND(order.total)}</td>
        </tr>
      </table>

      <div style="padding:10px 14px;background-color:#f8fafc;border-left:4px solid #1e3a8a;font-size:12.5px;margin-bottom:18px;">
        Số tiền viết bằng chữ: <strong><em>${escapeHtml(meta.amountInWords)}</em></strong>
      </div>

      <!-- Digital Signature & Seller Info -->
      <div style="padding:14px 16px;background-color:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;font-size:12px;color:#065f46;line-height:1.55;">
        <div style="font-weight:800;font-size:12.5px;margin-bottom:4px;">✓ CHỮ KÝ SỐ HỢP LỆ — ${escapeHtml(meta.sellerName)}</div>
        <div>• Mã số thuế: <strong>${escapeHtml(meta.sellerTaxId)}</strong> • Mã tra cứu HĐĐT: <strong style="font-family:monospace;">${escapeHtml(meta.lookupCode)}</strong></div>
        <div>• Địa chỉ: ${escapeHtml(meta.sellerAddress)}</div>
        <div>• Hotline CSKH 24/7: <strong>${escapeHtml(meta.sellerPhone)}</strong> • Email: <strong>${escapeHtml(meta.sellerEmail)}</strong></div>
      </div>
    </div>

    <div style="background-color:#0f172a;color:#94a3b8;padding:14px 24px;text-align:center;font-size:11.5px;">
      Email này được gửi tự động từ hệ thống Hóa đơn Điện tử <strong>NovaShop Việt Nam</strong> ngay sau khi xác nhận đơn hàng #${escapeHtml(order.id)}.
    </div>
  </div>
</body>
</html>`;

  return {
    toEmail,
    subject,
    htmlBody,
  };
}

export interface SendOrderEmailResult {
  ok: boolean;
  sentTo: string;
  message: string;
  gasUrlUsed?: string;
}

/**
 * Sends the order confirmation & electronic VAT invoice email via Google Apps Script
 * (proxied through /api/orders/send-confirmation-email on the server to follow 302 redirects cleanly,
 * with direct text/plain POST fallback). Requires zero OAuth and zero Cloud Billing.
 */
export async function sendOrderConfirmationEmail(
  order: Order,
  optionsOrEmail?: { toEmail?: string; gasUrl?: string } | string
): Promise<SendOrderEmailResult> {
  const options =
    typeof optionsOrEmail === 'string'
      ? { toEmail: optionsOrEmail }
      : optionsOrEmail;
  const payload = buildOrderConfirmationEmailPayload(order, options?.toEmail);
  const gasUrl = (options?.gasUrl || getConfiguredGasEmailUrl()).trim();

  if (!payload.toEmail || !payload.toEmail.includes('@')) {
    return {
      ok: false,
      sentTo: payload.toEmail,
      message: 'Địa chỉ email người nhận không hợp lệ.',
    };
  }

  const requestBody = {
    action: 'sendOrderConfirmationEmail',
    toEmail: payload.toEmail,
    recipientEmail: payload.toEmail,
    email: payload.toEmail,
    subject: payload.subject,
    htmlBody: payload.htmlBody,
    orderId: order.id,
    customerName: order.customer.fullName,
    totalAmount: order.total,
    gasUrl,
  };

  try {
    const resp = await fetch('/api/orders/send-confirmation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.ok) {
        return {
          ok: true,
          sentTo: payload.toEmail,
          message:
            data.message ||
            `Đã gửi email xác nhận đơn hàng #${order.id} & Hóa đơn điện tử tới ${payload.toEmail}.`,
          gasUrlUsed: data.gasUrlUsed || gasUrl,
        };
      }
    }
  } catch {
    // Fallback to direct client-side Google Apps Script POST below
  }

  // Browser fallback using Content-Type: text/plain;charset=utf-8 (avoids CORS preflight while passing JSON to e.postData.contents)
  try {
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(requestBody),
    });

    return {
      ok: true,
      sentTo: payload.toEmail,
      message: `Đã gửi lệnh phát hành email xác nhận đơn hàng #${order.id} tới ${payload.toEmail} qua Google Apps Script.`,
      gasUrlUsed: gasUrl,
    };
  } catch {
    return {
      ok: false,
      sentTo: payload.toEmail,
      message: 'Không thể kết nối tới Google Apps Script lúc này. Vui lòng thử gửi lại.',
      gasUrlUsed: gasUrl,
    };
  }
}

