import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquareText,
  X,
  Send,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Truck,
  CreditCard,
  Gift,
  ShoppingBag,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  PhoneCall,
  Minimize2,
  GripHorizontal,
} from 'lucide-react';
import { Product, CartItem, Order, Voucher, UserProfile } from '../types';
import { formatVND } from '../data/mockData';
import { PolicyTabId } from './PolicyModal';
import { useDraggable } from '../hooks/useDraggable';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  suggestedProducts?: Product[];
  actionType?: 'open_promo' | 'open_orders' | 'open_policy' | 'open_installment' | 'open_cart';
  actionLabel?: string;
  isError?: boolean;
  failedPrompt?: string;
}

interface CustomerSupportChatbotProps {
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
  isPromoVisible?: boolean;
  isPartnerAdVisible?: boolean;
  products: Product[];
  cartItems: CartItem[];
  orders: Order[];
  appliedVoucher: Voucher | null;
  currentUser: UserProfile | null;
  onSelectProduct: (product: Product) => void;
  onOpenPromo: () => void;
  onOpenOrders: () => void;
  onOpenPolicy: (tab?: PolicyTabId) => void;
  onOpenInstallment: (product?: Product) => void;
  onOpenCart: () => void;
}

const QUICK_QUESTIONS = [
  {
    id: 'q-warranty',
    label: 'Chính sách bảo hành & đổi trả 30 ngày',
    prompt: 'Cho mình hỏi chính sách bảo hành chính hãng và quy định 1 đổi 1 trong 30 ngày tại NovaShop như thế nào?',
    icon: ShieldCheck,
  },
  {
    id: 'q-shipping',
    label: 'Giao hàng hỏa tốc 2H & Freeship',
    prompt: 'NovaShop giao hàng trong bao lâu? Điều kiện để được miễn phí vận chuyển (Freeship) và giao hỏa tốc 2 giờ là gì?',
    icon: Truck,
  },
  {
    id: 'q-installment',
    label: 'Thủ tục mua trả góp 0% & VietQR',
    prompt: 'Hướng dẫn giúp mình cách mua trả góp 0% lãi suất và các phương thức thanh toán trực tuyến tại NovaShop.',
    icon: CreditCard,
  },
  {
    id: 'q-voucher',
    label: 'Mã giảm giá (Voucher) đang có',
    prompt: 'Hiện tại NovaShop đang có những mã giảm giá (voucher) nào và điều kiện áp dụng cho đơn hàng ra sao?',
    icon: Gift,
  },
  {
    id: 'q-recommend',
    label: 'Tư vấn sản phẩm nổi bật đáng mua',
    prompt: 'Gợi ý giúp mình một số sản phẩm công nghệ nổi bật đang giảm giá tốt tại NovaShop (điện thoại, laptop, tai nghe).',
    icon: ShoppingBag,
  },
  {
    id: 'q-order',
    label: 'Kiểm tra đơn hàng & giỏ hàng của tôi',
    prompt: 'Kiểm tra giúp mình thông tin giỏ hàng hiện tại, mã voucher nên áp dụng và tình trạng đơn hàng gần đây của mình.',
    icon: HelpCircle,
  },
];

function findRelevantProducts(query: string, products: Product[]): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return products.slice(0, 5);

  const scored = products.map((p) => {
    let score = 0;
    const nameLower = p.name.toLowerCase();
    const catLower = p.categoryName.toLowerCase();
    const descLower = p.description.toLowerCase();

    if (nameLower.includes(q)) score += 10;
    const words = q.split(/\s+/).filter((w) => w.length >= 2);
    for (const word of words) {
      if (nameLower.includes(word)) score += 4;
      if (catLower.includes(word)) score += 3;
      if (descLower.includes(word)) score += 1;
    }

    if (
      (q.includes('điện thoại') || q.includes('iphone') || q.includes('samsung') || q.includes('xiaomi')) &&
      p.category === 'phones'
    ) {
      score += 5;
    }
    if ((q.includes('laptop') || q.includes('macbook') || q.includes('máy tính')) && p.category === 'laptops') {
      score += 5;
    }
    if ((q.includes('tai nghe') || q.includes('loa') || q.includes('âm thanh') || q.includes('sony') || q.includes('marshall')) && p.category === 'audio') {
      score += 5;
    }
    if ((q.includes('đồng hồ') || q.includes('watch') || q.includes('garmin')) && p.category === 'wearables') {
      score += 5;
    }
    if ((q.includes('gaming') || q.includes('ps5') || q.includes('switch') || q.includes('màn hình') || q.includes('bàn phím') || q.includes('chuột')) && p.category === 'gaming') {
      score += 5;
    }
    if ((q.includes('sạc') || q.includes('phụ kiện') || q.includes('pin')) && p.category === 'accessories') {
      score += 5;
    }
    if ((q.includes('robot') || q.includes('hút bụi') || q.includes('lọc không khí') || q.includes('nhà thông minh')) && p.category === 'smarthome') {
      score += 5;
    }
    if (q.includes('giá rẻ') || q.includes('dưới 1 triệu') || q.includes('tiết kiệm')) {
      if (p.price < 1500000) score += 4;
    }
    if (q.includes('tầm trung') || q.includes('trung bình')) {
      if (p.price >= 2000000 && p.price <= 13500000) score += 4;
    }

    return { product: p, score };
  });

  const matched = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product);

  if (matched.length > 0) {
    return matched.slice(0, 6);
  }
  return products.slice(0, 6);
}

function detectQuickAction(query: string, replyText: string): {
  actionType?: ChatMessage['actionType'];
  actionLabel?: string;
} {
  const combined = `${query} ${replyText}`.toLowerCase();
  if (combined.includes('voucher') || combined.includes('mã giảm giá') || combined.includes('novatech') || combined.includes('giam10') || combined.includes('vip500')) {
    return { actionType: 'open_promo', actionLabel: 'Mở Kho Voucher Ưu Đãi' };
  }
  if (combined.includes('trả góp') || combined.includes('lãi suất 0%')) {
    return { actionType: 'open_installment', actionLabel: 'Mở Bảng Tính Trả Góp 0%' };
  }
  if (combined.includes('đơn hàng') || combined.includes('lộ trình') || combined.includes('vận đơn')) {
    return { actionType: 'open_orders', actionLabel: 'Tra Cứu Đơn Hàng Của Tôi' };
  }
  if (combined.includes('bảo hành') || combined.includes('đổi trả') || combined.includes('1 đổi 1')) {
    return { actionType: 'open_policy', actionLabel: 'Xem Chi Tiết Chính Sách Bảo Hành & Đổi Trả' };
  }
  if (combined.includes('giỏ hàng')) {
    return { actionType: 'open_cart', actionLabel: 'Mở Giỏ Hàng Hiện Tại' };
  }
  return {};
}

function renderFormattedText(text: string, isTyping = false) {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const isLastLine = lineIdx === lines.length - 1;
    const trimmed = line.trim();
    if (!trimmed) {
      return (
        <div key={lineIdx} className="h-1.5">
          {isTyping && isLastLine && (
            <span
              aria-hidden="true"
              className="inline-block w-1.5 h-3.5 bg-blue-600 dark:bg-blue-400 rounded-xs animate-pulse"
            />
          )}
        </div>
      );
    }

    // Parse **bold** segments safely, including unclosed ** at the end while typing
    const parts = line.split(/(\*\*.*?\*\*|\*\*[^*]+$)/g);
    const renderedParts = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={partIdx} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (isTyping && part.startsWith('**') && part.length > 2) {
        return (
          <strong key={partIdx} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2)}
          </strong>
        );
      }
      return <React.Fragment key={partIdx}>{part}</React.Fragment>;
    });

    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    return (
      <div
        key={lineIdx}
        className={`${isBullet ? 'pl-2 py-0.5' : 'py-0.5'} leading-relaxed`}
      >
        {renderedParts}
        {isTyping && isLastLine && (
          <span
            aria-hidden="true"
            className="inline-block w-1.5 h-3.5 ml-0.5 -mb-0.5 bg-blue-600 dark:bg-blue-400 rounded-xs animate-pulse"
          />
        )}
      </div>
    );
  });
}

function isProductQuery(query: string): boolean {
  const q = query.toLowerCase();
  const keywords = [
    'sản phẩm',
    'gợi ý',
    'tư vấn',
    'mua máy',
    'đáng mua',
    'nổi bật',
    'điện thoại',
    'iphone',
    'samsung',
    'xiaomi',
    'laptop',
    'macbook',
    'máy tính',
    'tai nghe',
    'airpods',
    'loa',
    'sony',
    'marshall',
    'đồng hồ',
    'watch',
    'garmin',
    'gaming',
    'ps5',
    'màn hình',
    'bàn phím',
    'chuột',
    'sạc',
    'pin',
    'phụ kiện',
    'robot',
    'hút bụi',
    'lọc không khí',
    'báo giá',
    'giá bao nhiêu',
  ];
  return keywords.some((kw) => q.includes(kw));
}

function buildClientFallbackReply(
  rawQuery: string,
  relevantProducts: Product[],
  cartItems: CartItem[],
  orders: Order[],
  appliedVoucher: Voucher | null,
  currentUser: UserProfile | null
): string {
  const q = rawQuery.toLowerCase().trim();
  const greetingName = currentUser?.fullName ? ` **${currentUser.fullName}**` : ' bạn';

  if (
    /^(xin chào|chào|hello|hi|hey|alo|shop ơi|ad ơi|có ai không|bạn là ai)/i.test(q) &&
    q.split(/\s+/).length <= 6
  ) {
    return `Xin chào${greetingName}! Mình là **CSKH NovaCare** — Chuyên viên CSKH trực tuyến 24/7 của **NovaShop**.\n\nBạn cần mình hỗ trợ thông tin nào dưới đây ạ?\n• **Tư vấn & báo giá sản phẩm** (iPhone, Samsung, MacBook, Laptop, Tai nghe, Smartwatch, Gaming...)\n• **Chính sách bảo hành 12–24 tháng** & **1 đổi 1 trong 30 ngày**\n• **Giao hàng hỏa tốc 2 giờ (NovaSpeed)** & **Freeship toàn quốc**\n• **Kho mã giảm giá (Voucher)**, **Trả góp 0%** & kiểm tra đơn hàng`;
  }

  if (
    q.includes('bảo hành') ||
    q.includes('đổi trả') ||
    q.includes('1 đổi 1') ||
    q.includes('sửa chữa') ||
    q.includes('trung tâm bảo hành')
  ) {
    return `Dạ **NovaShop** cam kết quyền lợi **Bảo hành & Đổi trả chính hãng** tối đa cho${greetingName}:\n\n• **Cam kết chính hãng 100%**: Sản phẩm mới nguyên seal, phân phối chính ngạch, đầy đủ hóa đơn VAT điện tử.\n• **1 đổi 1 trong 30 ngày đầu**: Đổi máy mới 100% miễn phí tận nơi nếu phát sinh lỗi phần cứng từ nhà sản xuất (màn hình, nguồn, pin, camera, loa, kết nối...).\n• **Bảo hành điện tử 12 – 24 tháng**: Tra cứu theo IMEI/Serial và Số điện thoại tại toàn bộ Trung tâm bảo hành ủy quyền chính hãng toàn quốc.\n• **Miễn phí vận chuyển bảo hành 2 chiều** trên toàn quốc.\n• **Điều kiện đổi trả**: Giữ nguyên hộp trùng IMEI, đủ phụ kiện, không rơi vỡ/ngấm nước và đã thoát tài khoản cá nhân (iCloud/Google).`;
  }

  if (
    q.includes('giao hàng') ||
    q.includes('vận chuyển') ||
    q.includes('freeship') ||
    q.includes('phí ship') ||
    q.includes('hỏa tốc') ||
    q.includes('bao lâu') ||
    q.includes('đồng kiểm')
  ) {
    return `Dạ chính sách **Giao hàng & Vận chuyển** tại **NovaShop** dành cho${greetingName}:\n\n• **Miễn phí vận chuyển toàn quốc (Freeship)**: Áp dụng cho mọi đơn hàng từ **300.000₫** (hoặc nhập mã **FREESHIP** giảm ngay **30.000₫**).\n• **Giao Hỏa Tốc 2 Giờ (NovaSpeed)**: Nhận hàng trong **2 – 4 giờ** tại nội thành TP. Hồ Chí Minh & Hà Nội (khung giờ 8:00 – 18:00, phí **65.000₫**).\n• **Giao Tiêu Chuẩn Toàn Quốc**: Nhận hàng từ **1 – 3 ngày làm việc**, đóng gói chống sốc 3 lớp, bảo hiểm 100% giá trị hàng hóa.\n• **Đồng kiểm 100%**: Bạn được mở hộp kiểm tra ngoại quan, tem seal và đúng mẫu mã trước khi thanh toán.`;
  }

  if (
    q.includes('trả góp') ||
    q.includes('thanh toán') ||
    q.includes('vietqr') ||
    q.includes('thẻ tín dụng') ||
    q.includes('momo') ||
    q.includes('vnpay') ||
    q.includes('cod') ||
    q.includes('lãi suất')
  ) {
    return `Dạ **NovaShop** hỗ trợ đa dạng **Phương thức Thanh toán & Trả góp 0% lãi suất**:\n\n• **Mua Trả Góp 0% Lãi Suất**:\n  - Qua **Thẻ tín dụng** của hơn 25 ngân hàng liên kết.\n  - Hoặc duyệt hồ sơ **CCCD gắn chip** online trong 3 phút qua Home Credit, FE Credit, HD Saison.\n  - Kỳ hạn linh hoạt **3, 6, 9, 12 tháng**, trả trước từ **0% – 30%**.\n• **Thanh toán trực tuyến & COD**:\n  - **VietQR Napas 24/7**: Quét mã QR ngân hàng tự động xác nhận sau 2 – 5 giây.\n  - **Thẻ Quốc tế (Visa / Mastercard / JCB)** bảo mật 3D-Secure.\n  - **Ví MoMo & VNPay-QR** hoặc **Thanh toán khi nhận hàng (COD)**.`;
  }

  if (
    q.includes('voucher') ||
    q.includes('mã giảm') ||
    q.includes('khuyến mãi') ||
    q.includes('ưu đãi') ||
    q.includes('code')
  ) {
    return `Dạ hiện tại **NovaShop** đang có **4 Mã Giảm Giá (Voucher)** dành cho${greetingName}:\n\n• **VIP500**: Giảm ngay **500.000₫** cho đơn hàng từ **15.000.000₫**.\n• **GIAM10**: Giảm **10%** (tối đa **500.000₫**) cho đơn hàng từ **2.000.000₫**.\n• **NOVATECH**: Giảm ngay **100.000₫** cho đơn hàng từ **500.000₫**.\n• **FREESHIP**: Miễn phí vận chuyển (giảm **30.000₫**) cho đơn hàng từ **300.000₫**.\n\nBạn hãy nhấn nút **Mở Kho Voucher Ưu Đãi** bên dưới để chọn áp dụng ngay nhé!`;
  }

  if (q.includes('đơn hàng') || q.includes('giỏ hàng')) {
    const cartSummary =
      cartItems.length > 0
        ? cartItems
            .map((item) => `${item.product.name} (x${item.quantity}) - ${formatVND(item.product.price * item.quantity)}`)
            .join('; ')
        : 'Giỏ hàng đang trống';
    const voucherInfo = appliedVoucher ? `${appliedVoucher.code} (${appliedVoucher.description})` : 'Chưa chọn';
    const orderInfo =
      orders.length > 0
        ? orders
            .slice(0, 3)
            .map((o) => `  - Đơn **#${o.id}**: **${o.orderStatus}** · Tổng **${formatVND(o.total)}**`)
            .join('\n')
        : '  - Chưa có đơn hàng nào trong lịch sử gần đây.';

    return `Dạ mình gửi${greetingName} thông tin **Giỏ hàng & Đơn hàng** hiện tại:\n\n• **Giỏ hàng**: ${cartSummary}\n• **Voucher đang áp dụng**: **${voucherInfo}**\n• **Đơn hàng gần đây**:\n${orderInfo}`;
  }

  if (relevantProducts.length > 0) {
    const top = relevantProducts.slice(0, 3);
    const listText = top
      .map(
        (p) =>
          `• **${p.name}**: Giá ưu đãi **${formatVND(p.price)}** (Đánh giá **${p.rating}★**, còn ${p.stock} máy)`
      )
      .join('\n');
    return `Dạ **CSKH NovaCare** xin gợi ý cho${greetingName} các sản phẩm chính hãng phù hợp nhất đang có giá tốt tại **NovaShop**:\n\n${listText}\n\n• **Ưu đãi**: Áp mã **VIP500** (giảm 500K cho đơn từ 15 triệu), **GIAM10** (giảm 10% tối đa 500K) hoặc **NOVATECH** (giảm 100K).\n• **Đặc quyền**: Bảo hành chính hãng **12 – 24 tháng**, **1 đổi 1 trong 30 ngày**, hỗ trợ **Trả góp 0%**.\n\nBạn có thể nhấn vào thẻ sản phẩm bên dưới để xem chi tiết cấu hình hoặc đặt mua ngay nhé!`;
  }

  return `Cảm ơn${greetingName} đã liên hệ **CSKH NovaCare**! Tại **NovaShop**, mọi sản phẩm đều chính hãng 100%, bảo hành **12 – 24 tháng**, **1 đổi 1 trong 30 ngày**, **Freeship** đơn từ 300.000₫ và hỗ trợ **Trả góp 0%**. Bạn có thể nhấn vào các chủ đề gợi ý bên dưới hoặc gọi Hotline **0908 061 843** để được hỗ trợ nhanh nhất!`;
}

export const CustomerSupportChatbot: React.FC<CustomerSupportChatbotProps> = ({
  isOpen,
  onToggleOpen,
  isPromoVisible = true,
  isPartnerAdVisible = true,
  products,
  cartItems,
  orders,
  appliedVoucher,
  currentUser,
  onSelectProduct,
  onOpenPromo,
  onOpenOrders,
  onOpenPolicy,
  onOpenInstallment,
  onOpenCart,
}) => {
  const initialGreeting = useMemo<ChatMessage>(() => {
    const greetingName = currentUser?.fullName ? ` ${currentUser.fullName}` : '';
    return {
      id: 'welcome-msg',
      role: 'model',
      text: `Xin chào${greetingName}! Mình là **CSKH NovaCare** — Trợ lý Chăm sóc Khách hàng trực tuyến của **NovaShop**.\n\nMình có thể hỗ trợ giải đáp ngay mọi thắc mắc của bạn về:\n• **Tư vấn sản phẩm**, báo giá & so sánh cấu hình\n• **Chính sách bảo hành 12–24 tháng** & **1 đổi 1 trong 30 ngày**\n• **Giao hàng hỏa tốc 2 giờ**, Freeship & kiểm tra đơn hàng\n• **Mã giảm giá (Voucher)**, thanh toán **VietQR** & **Trả góp 0%**`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
  }, [currentUser?.fullName]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      sessionStorage.removeItem('novashop_cs_chat_history');
      sessionStorage.removeItem('novashop_cs_chat_history_v2');
      const saved = sessionStorage.getItem('novashop_cs_chat_history_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validMessages = parsed.filter((m: ChatMessage) => m && !m.isError);
          if (validMessages.length > 0) return validMessages;
        }
      }
    } catch {
      // ignore storage error
    }
    return [initialGreeting];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<'analyzing' | 'composing'>('analyzing');
  const [typingState, setTypingState] = useState<{
    messageId: string;
    fullText: string;
    currentIndex: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Draggable state for Floating Launcher Button
  const {
    elementRef: launcherRef,
    position: launcherPos,
    isDragging: isLauncherDragging,
    positionStyle: launcherPositionStyle,
    dragProps: launcherDragProps,
    handleClick: handleLauncherClick,
    resetPosition: resetLauncherPosition,
  } = useDraggable<HTMLButtonElement>({
    storageKey: 'novashop_cs_chatbot_launcher_pos_v2',
    margin: 8,
  });

  // Hover expand state for launcher button
  const [isLauncherHovered, setIsLauncherHovered] = useState(false);
  const launcherHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLauncherMouseEnter = () => {
    if (launcherHoverTimeoutRef.current) {
      clearTimeout(launcherHoverTimeoutRef.current);
    }
    setIsLauncherHovered(true);
  };

  const handleLauncherMouseLeave = () => {
    if (launcherHoverTimeoutRef.current) {
      clearTimeout(launcherHoverTimeoutRef.current);
    }
    launcherHoverTimeoutRef.current = setTimeout(() => {
      setIsLauncherHovered(false);
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (launcherHoverTimeoutRef.current) {
        clearTimeout(launcherHoverTimeoutRef.current);
      }
    };
  }, []);

  // Draggable state for Expandable Chat Window (drag via Header bar)
  const {
    elementRef: chatWindowRef,
    position: chatWindowPos,
    isDragging: isChatWindowDragging,
    positionStyle: chatWindowPositionStyle,
    dragHandleProps: chatHeaderDragProps,
    resetPosition: resetChatWindowPosition,
  } = useDraggable<HTMLElement>({
    storageKey: 'novashop_cs_chatbot_window_pos_v1',
    margin: 8,
  });

  const isBotBusy = isLoading || typingState !== null;

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === 'welcome-msg' ? { ...m, text: initialGreeting.text } : m))
    );
  }, [initialGreeting.text]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        'novashop_cs_chat_history_v3',
        JSON.stringify(messages.filter((m) => !m.isError).slice(-20))
      );
    } catch {
      // ignore
    }
  }, [messages]);

  // Cycle thinking stage label while waiting for response
  useEffect(() => {
    if (!isLoading) {
      setThinkingStage('analyzing');
      return;
    }
    const timer = setTimeout(() => {
      setThinkingStage('composing');
    }, 350);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Progressive typewriter effect when bot message arrives
  useEffect(() => {
    if (!typingState) return;

    const { messageId, fullText, currentIndex } = typingState;
    if (currentIndex >= fullText.length) {
      setTypingState(null);
      return;
    }

    const lastChar = currentIndex > 0 ? fullText[currentIndex - 1] : '';
    let delay = 20;
    if (lastChar === '\n') {
      delay = 70;
    } else if (lastChar === '.' || lastChar === '!' || lastChar === '?' || lastChar === ':') {
      delay = 55;
    } else if (lastChar === ',' || lastChar === ';') {
      delay = 35;
    }

    const timer = setTimeout(() => {
      // Advance 2 to 5 chars per tick for realistic, fluid typing
      const step = Math.min(
        fullText.length - currentIndex,
        lastChar === '\n' ? 2 : 3 + (currentIndex % 3)
      );
      let nextIndex = currentIndex + step;

      // Avoid splitting right in the middle of a '**' markdown bold marker
      if (
        nextIndex < fullText.length &&
        fullText[nextIndex - 1] === '*' &&
        fullText[nextIndex] === '*'
      ) {
        nextIndex += 1;
      }

      if (nextIndex >= fullText.length) {
        setTypingState(null);
      } else {
        setTypingState({
          messageId,
          fullText,
          currentIndex: nextIndex,
        });
      }

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [typingState]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages.length, isLoading, Boolean(typingState)]);

  const handleSkipTyping = () => {
    setTypingState(null);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend ?? inputText).trim();
    if (!text || isLoading) return;

    // If previous message was still typing, complete it immediately
    if (typingState) {
      setTypingState(null);
    }

    if (!promptToSend) {
      setInputText('');
    }

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages.filter((m) => !m.isError), userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    const requestStartTime = Date.now();
    const relevantProducts = findRelevantProducts(text, products);

    try {
      const cartSummary =
        cartItems.length > 0
          ? cartItems
              .map(
                (item) =>
                  `${item.product.name} (x${item.quantity}${item.selectedColor ? `, màu ${item.selectedColor}` : ''}) - ${formatVND(item.product.price * item.quantity)}`
              )
              .join('; ')
          : 'Giỏ hàng đang trống';

      const recentOrders = orders.slice(0, 5).map((o) => ({
        id: o.id,
        status: o.orderStatus,
        total: o.total,
        createdAt: o.createdAt,
        paymentMethod: o.paymentMethod,
        itemNames: o.items.map((i) => `${i.product.name} (x${i.quantity})`),
      }));

      const historyPayload = updatedMessages
        .filter((m) => m.id !== 'welcome-msg' && !m.isError)
        .slice(-10, -1)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      let replyText = '';

      try {
        const response = await fetch('/api/customer-support/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: historyPayload,
            context: {
              customerName: currentUser?.fullName,
              cartSummary,
              appliedVoucherCode: appliedVoucher
                ? `${appliedVoucher.code} (${appliedVoucher.description})`
                : undefined,
              matchedProducts: relevantProducts.map((p) => ({
                id: p.id,
                name: p.name,
                categoryName: p.categoryName,
                price: p.price,
                originalPrice: p.originalPrice,
                rating: p.rating,
                stock: p.stock,
                badge: p.badge,
                highlights: p.highlights,
              })),
              recentOrders,
            },
          }),
        });

        const data = await response.json();
        if (response.ok && data?.reply) {
          replyText = String(data.reply).trim();
        }
      } catch {
        // Fallback handled below if network/server unreachable
      }

      if (!replyText) {
        replyText = buildClientFallbackReply(
          text,
          relevantProducts,
          cartItems,
          orders,
          appliedVoucher,
          currentUser
        );
      }

      // Ensure a brief natural "thinking & typing dots" phase (~550ms) before typewriter starts
      const elapsed = Date.now() - requestStartTime;
      if (elapsed < 550) {
        await new Promise((resolve) => setTimeout(resolve, 550 - elapsed));
      }

      // Match products explicitly mentioned in the AI response or strongly queried
      let mentionedProducts = products
        .filter((p) => {
          const nameKey = p.name.toLowerCase().split(' ').slice(0, 4).join(' ');
          return (
            replyText.toLowerCase().includes(p.id.toLowerCase()) ||
            replyText.toLowerCase().includes(nameKey)
          );
        })
        .slice(0, 3);

      if (mentionedProducts.length === 0 && isProductQuery(text)) {
        mentionedProducts = relevantProducts.slice(0, 3);
      }

      const quickAction = detectQuickAction(text, replyText);
      const botMsgId = 'bot-' + Date.now();

      const botMsg: ChatMessage = {
        id: botMsgId,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestedProducts: mentionedProducts.length > 0 ? mentionedProducts : undefined,
        actionType: quickAction.actionType,
        actionLabel: quickAction.actionLabel,
      };

      setMessages((prev) => [...prev, botMsg]);
      setTypingState({
        messageId: botMsgId,
        fullText: replyText,
        currentIndex: Math.min(4, replyText.length),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setTypingState(null);
    setIsLoading(false);
    const fresh: ChatMessage = {
      ...initialGreeting,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([fresh]);
    try {
      sessionStorage.removeItem('novashop_cs_chat_history');
      sessionStorage.removeItem('novashop_cs_chat_history_v2');
      sessionStorage.removeItem('novashop_cs_chat_history_v3');
    } catch {
      // ignore
    }
  };

  const handleActionClick = (actionType?: ChatMessage['actionType']) => {
    if (!actionType) return;
    if (actionType === 'open_promo') onOpenPromo();
    else if (actionType === 'open_orders') onOpenOrders();
    else if (actionType === 'open_policy') onOpenPolicy('warranty');
    else if (actionType === 'open_installment') onOpenInstallment();
    else if (actionType === 'open_cart') onOpenCart();
  };

  return (
    <>
      {/* Floating Launcher Button - Compact circular icon that smoothly expands horizontally on hover like Light/Dark mode button */}
      {!isOpen && (
        <button
          ref={launcherRef}
          id="customer-support-chat-launcher"
          type="button"
          data-dragging={isLauncherDragging ? 'true' : undefined}
          {...launcherDragProps}
          onClick={handleLauncherClick(() => onToggleOpen(true))}
          onDoubleClick={resetLauncherPosition}
          onMouseEnter={handleLauncherMouseEnter}
          onMouseLeave={handleLauncherMouseLeave}
          style={
            launcherPositionStyle
              ? {
                  ...launcherPositionStyle,
                  transition: isLauncherDragging
                    ? 'none'
                    : 'width 400ms cubic-bezier(0.22, 1, 0.36, 1), background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease, transform 300ms ease',
                }
              : {
                  transition: isLauncherDragging
                    ? 'none'
                    : 'width 400ms cubic-bezier(0.22, 1, 0.36, 1), background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease, transform 300ms ease',
                }
          }
          className={`fixed left-2.5 right-auto sm:left-6 sm:right-auto z-40 group flex items-center h-11 sm:h-12 rounded-full border-2 border-slate-700/90 dark:border-blue-400/80 bg-slate-900/95 dark:bg-blue-600/95 hover:bg-slate-800 dark:hover:bg-blue-500 text-white backdrop-blur-xl select-none drop-shadow-[0_4px_10px_rgba(15,23,42,0.2)] hover:drop-shadow-[0_6px_14px_rgba(15,23,42,0.28)] shadow-[0_4px_12px_rgba(15,23,42,0.24)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.32)] overflow-visible ${
            isPartnerAdVisible ? 'bottom-[68px]' : 'bottom-3'
          } ${isPromoVisible ? 'sm:bottom-18' : 'sm:bottom-5'} ${
            isLauncherDragging
              ? 'cursor-grabbing shadow-2xl ring-2 ring-blue-400/80 scale-105 opacity-95'
              : 'cursor-grab hover:scale-[1.02]'
          } ${
            isLauncherHovered
              ? 'w-[162px] sm:w-[174px]'
              : 'w-11 sm:w-12 group-hover:w-[162px] sm:group-hover:w-[174px]'
          }`}
          title="CSKH NovaCare - Tư vấn trực tuyến 24/7 (Nhấp để mở chat)"
          aria-label="Mở khung chat CSKH NovaCare"
        >
          {/* Reset position button when moved from default position */}
          {launcherPos && !isLauncherDragging && (
            <span
              role="button"
              tabIndex={0}
              onClick={resetLauncherPosition}
              onPointerDown={(e) => e.stopPropagation()}
              title="Nhấp để đặt lại vị trí mặc định"
              className="absolute -top-1.5 -left-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center w-4 h-4 rounded-full bg-slate-700 hover:bg-rose-600 text-slate-200 hover:text-white shadow-xs cursor-pointer z-30 ring-1 ring-slate-500/50"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </span>
          )}

          {/* Wrapper căn giữa cân bằng tuyệt đối: Khối icon khớp chuẩn xác đường kính lọt lòng (40px mobile / 44px desktop) */}
          <div className="relative flex items-center h-full overflow-visible">
            {/* Khối icon cố định khớp tuyệt đối tâm vòng tròn viền ngoài (cách đều 4 phía 8px từ viền ngoài, 6px từ lọt lòng) */}
            <div className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] flex items-center justify-center shrink-0 overflow-visible">
              {/* Giữ nguyên hình ảnh icon Headphones với nền tròn màu xanh (light) / trắng (dark) */}
              <span className="keep-light relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 dark:!bg-white text-white dark:!text-blue-700 shrink-0 pointer-events-none transition-transform group-hover:scale-105 shadow-2xs">
                <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                
                {/* Chấm tròn xanh online hiển thị đầy đủ 100%, không bị che khuất và KHÔNG chớp nháy */}
                <span
                  title="Trực tuyến 24/7"
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900 dark:ring-blue-600 shadow-xs z-30 pointer-events-none"
                />
              </span>
            </div>

            {/* Đoạn kéo ngang hiển thị 'CSKH NovaCare' mượt mà khi di chuột vào (giống chế độ sáng tối) */}
            <div
              className={`overflow-hidden whitespace-nowrap transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none select-none text-left pr-3.5 ${
                isLauncherHovered
                  ? 'opacity-100 max-w-[130px] translate-x-0'
                  : 'opacity-0 max-w-0 translate-x-1 group-hover:opacity-100 group-hover:max-w-[130px] group-hover:translate-x-0'
              }`}
            >
              <span className="text-[11px] sm:text-xs font-black tracking-tight text-white leading-none block">
                CSKH NovaCare
              </span>
            </div>
          </div>
        </button>
      )}

      {/* Expandable Chat Window - Also draggable via its Header bar */}
      {isOpen && (
        <section
          ref={chatWindowRef}
          id="customer-support-chat-window"
          aria-label="Cửa sổ CSKH NovaCare"
          style={chatWindowPositionStyle}
          className={`fixed left-2.5 right-2.5 sm:right-auto bottom-2.5 sm:bottom-6 sm:left-6 z-50 w-[calc(100vw-1.25rem)] sm:w-[400px] max-h-[82dvh] h-[min(520px,78dvh)] sm:h-[580px] rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/90 shadow-2xl shadow-slate-950/25 flex flex-col overflow-hidden ${
            isChatWindowDragging ? 'ring-2 ring-blue-500/70 opacity-95' : 'transition-shadow duration-200'
          }`}
        >
          {/* Draggable Chat Header */}
          <div
            {...chatHeaderDragProps}
            onDoubleClick={resetChatWindowPosition}
            className={`px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-900 dark:bg-[#131d36] text-white border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 select-none ${
              isChatWindowDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 ${
                    isBotBusy ? 'animate-ping' : ''
                  }`}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">
                    CSKH NovaCare
                  </h3>
                </div>
                {isBotBusy ? (
                  <p className="text-[10px] sm:text-[11px] text-blue-300 flex items-center gap-1.5 truncate font-medium">
                    <span className="inline-flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" />
                      <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                    </span>
                    <span>CSKH NovaCare đang nhập...</span>
                  </p>
                ) : (
                  <p className="text-[10px] sm:text-[11px] text-emerald-300 flex items-center gap-1.5 truncate">
                    <span>Trực tuyến 24/7</span>
                  </p>
                )}
              </div>
            </div>

            <div
              className="flex items-center gap-0.5 sm:gap-1 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {(chatWindowPos || launcherPos) && (
                <button
                  type="button"
                  onClick={() => {
                    resetChatWindowPosition();
                    resetLauncherPosition();
                  }}
                  className="px-1.5 py-1 rounded-lg text-[10px] font-bold text-blue-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Đặt lại vị trí mặc định của Chatbot"
                >
                  Đặt lại vị trí
                </button>
              )}
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Làm mới cuộc trò chuyện"
                aria-label="Làm mới cuộc trò chuyện"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onToggleOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Thu gọn cửa sổ chat"
                aria-label="Thu gọn cửa sổ chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onToggleOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Đóng cửa sổ chat"
                aria-label="Đóng cửa sổ chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/70 dark:bg-[#0b1120]"
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isThisMsgTyping = !isUser && typingState?.messageId === msg.id;
              const displayedText = isThisMsgTyping
                ? msg.text.slice(0, typingState.currentIndex)
                : msg.text;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                        : msg.isError
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/70 rounded-bl-xs'
                        : 'bg-white dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="space-y-0.5">
                        {renderFormattedText(displayedText, isThisMsgTyping)}
                      </div>
                    )}

                    {/* Suggested Products inside Bot Message (shown once typing finishes) */}
                    {!isThisMsgTyping &&
                      msg.suggestedProducts &&
                      msg.suggestedProducts.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 space-y-2 animate-fadeIn">
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Sản phẩm gợi ý tại NovaShop:
                          </div>
                          {msg.suggestedProducts.map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => onSelectProduct(prod)}
                              className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-900/80 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-700 transition-colors text-left cursor-pointer group"
                            >
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-11 h-11 rounded-lg object-cover shrink-0 bg-white"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {prod.name}
                                </div>
                                <div className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
                                  {formatVND(prod.price)}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Contextual Quick Action Button (shown once typing finishes) */}
                    {!isThisMsgTyping && msg.actionType && msg.actionLabel && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/70">
                        <button
                          type="button"
                          onClick={() => handleActionClick(msg.actionType)}
                          className="w-full py-1.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        >
                          <span>{msg.actionLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    )}

                    {/* Retry button if error */}
                    {msg.isError && msg.failedPrompt && (
                      <div className="mt-2 pt-2 border-t border-rose-200/60 dark:border-rose-800/60 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendMessage(msg.failedPrompt)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Thử gửi lại</span>
                        </button>
                        <a
                          href="tel:0908061843"
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-[11px] flex items-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3 text-emerald-600" />
                          <span>Gọi 0908 061 843</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                      {isUser
                        ? `Bạn · ${msg.timestamp}`
                        : isThisMsgTyping
                        ? 'CSKH NovaCare đang gõ...'
                        : `CSKH NovaCare · ${msg.timestamp}`}
                    </span>
                    {isThisMsgTyping && (
                      <button
                        type="button"
                        onClick={handleSkipTyping}
                        className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Hiện đầy đủ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing / Thinking Indicator Bubble before text starts streaming */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/70 px-2 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="font-medium text-slate-500 dark:text-slate-300">
                    {thinkingStage === 'analyzing'
                      ? 'CSKH NovaCare đang đọc câu hỏi...'
                      : 'CSKH NovaCare đang soạn câu trả lời...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips */}
          <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-800 shrink-0">
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5">
              Câu hỏi thường gặp (Chạm để hỏi nhanh):
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {QUICK_QUESTIONS.map((q) => {
                const IconComp = q.icon;
                return (
                  <button
                    key={q.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSendMessage(q.prompt)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-blue-700 dark:text-slate-200 dark:hover:text-blue-300 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <IconComp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{q.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập câu hỏi cần tư vấn sản phẩm, bảo hành, đơn hàng..."
              disabled={isLoading}
              className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
              title="Gửi câu hỏi"
              aria-label="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
};
