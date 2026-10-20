/**
 * NovaShop - E-Commerce & Online Payment Platform
 * Hệ thống phân phối thiết bị công nghệ & Thanh toán trực tuyến hàng đầu Việt Nam
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  SlidersHorizontal, 
  Sparkles, 
  ArrowUpDown, 
  ShoppingBag, 
  Check, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  Headphones, 
  RotateCcw, 
  CheckCircle2, 
  Filter, 
  PackageCheck,
  Building2,
  Briefcase,
  Gift,
  HelpCircle,
  X,
  Sun,
  Moon,
  Mic,
  MicOff,
  Search,
  Scale,
  Loader2,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Header } from './components/Header';
import { BannerHero } from './components/BannerHero';
import { PartnerAdBanner } from './components/PartnerAdBanner';
import { ProductCard, ProductCardSkeleton } from './components/ProductCard';
import { ProductComparisonModal, FloatingCompareBar } from './components/ProductComparisonModal';
import { QuickViewModal } from './components/QuickViewModal';
import { ProductModal } from './components/ProductModal';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { WishlistModal } from './components/WishlistModal';
import { PolicyModal, PolicyTabId } from './components/PolicyModal';
import { PolicyPage } from './components/PolicyPage';
import { AboutModal } from './components/AboutModal';
import { AboutPage } from './components/AboutPage';
import { FaqPage } from './components/FaqPage';
import { ShareModal } from './components/ShareModal';
import { PromoModal } from './components/PromoModal';
import { InstallmentModal } from './components/InstallmentModal';
import { NotificationModal } from './components/NotificationModal';
import { AuthModal, PendingPurchaseContext } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ProfilePage } from './components/ProfilePage';
import { GoogleAppsScriptConfigModal } from './components/GoogleAppsScriptConfigModal';
import {
  sendWelcomeEmail,
  checkIfWelcomeEmailSent,
  isAutoWelcomeEmailEnabled,
} from './utils/welcomeEmail';
import { UserProfileBanner } from './components/UserProfileBanner';
import { CustomerSupportChatbot } from './components/CustomerSupportChatbot';
import {
  auth,
  onAuthStateChanged,
  syncFirebaseUserProfile,
  updateFirestoreUserProfileDetails,
  updateFirestoreUserPoints,
  signOutFirebase,
  syncRegisteredAccountProfile,
  isGoogleAuthUser,
} from './firebase';
import { Logo } from './components/Logo';
import { ToastContainer, ToastMessage } from './components/Toast';
import { useDraggable } from './hooks/useDraggable';
import { smoothScrollToElement, smoothScrollToTop } from './utils/smoothScroll';
import { sendOrderConfirmationEmail } from './utils/electronicInvoice';
import {
  parseSmartSearchQuery,
  scoreProductMatch,
  generateSmartKeywordSuggestions,
} from './utils/smartSearch';
import { PRODUCTS, VOUCHERS, CATEGORIES, formatVND, INITIAL_NOTIFICATIONS } from './data/mockData';
import { CartItem, Order, OrderProgressStage, Product, Voucher, AppNotification, NotificationType, UserProfile } from './types';

// Sample initial orders (empty by default so each user only sees orders they place)
const INITIAL_DEMO_ORDERS: Order[] = [];

export default function App() {
  // Cart state stored in localStorage (synced with latest market prices from PRODUCTS)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('novashop_cart');
      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        return parsed.map((item) => {
          const latestProd = PRODUCTS.find((p) => p.id === item.product.id);
          return latestProd ? { ...item, product: latestProd } : item;
        });
      }
    } catch (e) {
      console.error(e);
    }
    // Default initial cart item for immediate exploration
    return [
      {
        product: PRODUCTS[6], // AirPods Pro 2
        quantity: 1,
        selectedColor: 'Trắng',
      }
    ];
  });

  // Wishlist state
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('novashop_wishlist');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return ['prod-1', 'prod-2'];
  });

  // Orders history state
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('novashop_orders');
      if (saved) {
        const parsed: Order[] = JSON.parse(saved);
        return parsed.filter((o) => o.id !== 'NOVA-782910' && o.id !== 'NOVA-551029');
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DEMO_ORDERS;
  });

  // Applied Voucher
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(() => VOUCHERS[0]);

  // Modals visibility
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [shareProductModal, setShareProductModal] = useState<Product | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState<boolean>(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState<boolean>(false);
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyTabId>('warranty');
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isInstallmentOpen, setIsInstallmentOpen] = useState<boolean>(false);
  const [installmentProduct, setInstallmentProduct] = useState<Product | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'policy' | 'faq' | 'profile' | 'checkout' | 'product'>('home');
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isGasConfigOpen, setIsGasConfigOpen] = useState<boolean>(false);

  // Dark Mode state persisted in localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('novashop_theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      const savedBool = localStorage.getItem('novashop_dark_mode');
      if (savedBool !== null) return savedBool === 'true';
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  const themeMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const themeTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFloatingThemeHoveredRef = useRef<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const saveTimer = setTimeout(() => {
      try {
        localStorage.setItem('novashop_theme', isDarkMode ? 'dark' : 'light');
        localStorage.setItem('novashop_dark_mode', String(isDarkMode));
      } catch (e) {
        console.error(e);
      }
    }, 380);
    return () => clearTimeout(saveTimer);
  }, [isDarkMode]);

  const applyThemeModeWithSmoothTransition = (nextDark: boolean | ((prev: boolean) => boolean)) => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    if (themeTransitionTimeoutRef.current) {
      clearTimeout(themeTransitionTimeoutRef.current);
    }
    themeTransitionTimeoutRef.current = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 400);
    setIsDarkMode(nextDark);
  };

  const handleToggleDarkMode = () => {
    applyThemeModeWithSmoothTransition((prev) => !prev);
  };

  // Floating theme toggle horizontal menu expansion state
  const [isThemeMenuExpanded, setIsThemeMenuExpanded] = useState<boolean>(false);

  // Floating draggable theme icon position state with localStorage persistence
  const [themeBtnPosition, setThemeBtnPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('novashop_floating_theme_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return { x: parsed.x, y: parsed.y };
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isThemeBtnDragging, setIsThemeBtnDragging] = useState<boolean>(false);
  const themePointerDownRef = useRef<{
    startX: number;
    startY: number;
    elemLeft: number;
    elemTop: number;
    hasMoved: boolean;
  } | null>(null);
  const themeJustDraggedRef = useRef<boolean>(false);
  const floatingThemeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Keep theme button safely inside viewport bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setThemeBtnPosition((prev) => {
        if (!prev) return null;
        const elem = floatingThemeBtnRef.current;
        const width = elem ? elem.offsetWidth : 48;
        const height = elem ? elem.offsetHeight : 48;
        const padding = 10;
        const maxX = Math.max(padding, window.innerWidth - width - padding);
        const maxY = Math.max(padding, window.innerHeight - height - padding);
        const clampedX = Math.min(maxX, Math.max(padding, prev.x));
        const clampedY = Math.min(maxY, Math.max(padding, prev.y));
        if (clampedX !== prev.x || clampedY !== prev.y) {
          const updated = { x: clampedX, y: clampedY };
          try {
            localStorage.setItem('novashop_floating_theme_pos', JSON.stringify(updated));
          } catch {}
          return updated;
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleThemePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only drag with primary pointer button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const elem = floatingThemeBtnRef.current;
    if (!elem) return;

    const rect = elem.getBoundingClientRect();
    themePointerDownRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemLeft: rect.left,
      elemTop: rect.top,
      hasMoved: false,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleThemePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!themePointerDownRef.current) return;
    const { startX, startY, elemLeft, elemTop } = themePointerDownRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (!themePointerDownRef.current.hasMoved && Math.hypot(deltaX, deltaY) > 5) {
      themePointerDownRef.current.hasMoved = true;
      setIsThemeBtnDragging(true);
      setIsThemeMenuExpanded(false);
    }

    if (themePointerDownRef.current.hasMoved) {
      const elem = floatingThemeBtnRef.current;
      const width = elem ? elem.offsetWidth : 48;
      const height = elem ? elem.offsetHeight : 48;
      const padding = 10;
      const maxX = Math.max(padding, window.innerWidth - width - padding);
      const maxY = Math.max(padding, window.innerHeight - height - padding);

      const nextX = Math.min(maxX, Math.max(padding, elemLeft + deltaX));
      const nextY = Math.min(maxY, Math.max(padding, elemTop + deltaY));

      setThemeBtnPosition({ x: nextX, y: nextY });
    }
  };

  const handleThemePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!themePointerDownRef.current) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (themePointerDownRef.current.hasMoved) {
      themeJustDraggedRef.current = true;
      setIsThemeBtnDragging(false);

      // Persist to localStorage
      setThemeBtnPosition((currentPos) => {
        if (currentPos) {
          try {
            localStorage.setItem('novashop_floating_theme_pos', JSON.stringify(currentPos));
          } catch {}
        }
        return currentPos;
      });

      // Prevent onClick immediately following a drag release
      setTimeout(() => {
        themeJustDraggedRef.current = false;
      }, 200);
    }

    themePointerDownRef.current = null;
  };

  const handleThemePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    handleThemePointerUp(e);
  };

  const handleResetThemeBtnPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setThemeBtnPosition(null);
    try {
      localStorage.removeItem('novashop_floating_theme_pos');
    } catch {}
  };

  const scheduleThemeMenuCollapse = (delayMs = 2400) => {
    if (themeMenuTimeoutRef.current) {
      clearTimeout(themeMenuTimeoutRef.current);
    }
    themeMenuTimeoutRef.current = setTimeout(() => {
      if (!isFloatingThemeHoveredRef.current && !isThemeBtnDragging) {
        setIsThemeMenuExpanded(false);
      }
    }, delayMs);
  };

  const triggerThemeMenuExpansion = (delayMs = 2400) => {
    setIsThemeMenuExpanded(true);
    scheduleThemeMenuCollapse(delayMs);
  };

  const handleFloatingThemeMouseEnter = () => {
    isFloatingThemeHoveredRef.current = true;
    if (themeMenuTimeoutRef.current) {
      clearTimeout(themeMenuTimeoutRef.current);
    }
    setIsThemeMenuExpanded(true);
  };

  const handleFloatingThemeMouseLeave = () => {
    isFloatingThemeHoveredRef.current = false;
    scheduleThemeMenuCollapse(520);
  };

  const handleFloatingThemeBtnClick = (e: React.MouseEvent) => {
    if (themeJustDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    applyThemeModeWithSmoothTransition((prev) => !prev);
    triggerThemeMenuExpansion(2400);
  };

  const handleSelectFloatingThemeMode = (targetDark: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (themeJustDraggedRef.current) {
      e.preventDefault();
      return;
    }
    const nextMode = targetDark === isDarkMode ? !isDarkMode : targetDark;
    applyThemeModeWithSmoothTransition(nextMode);
    triggerThemeMenuExpansion(2400);
  };

  useEffect(() => {
    return () => {
      if (themeMenuTimeoutRef.current) {
        clearTimeout(themeMenuTimeoutRef.current);
      }
      if (themeTransitionTimeoutRef.current) {
        clearTimeout(themeTransitionTimeoutRef.current);
      }
    };
  }, []);

  // User Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('novashop_auth_user');
      if (saved) {
        const parsed: UserProfile = JSON.parse(saved);
        if (parsed.id === 'user-vip-01') {
          localStorage.removeItem('novashop_auth_user');
          return null;
        }
        const leakedAddresses = new Set([
          '219/20 đường số 12, phường Bình Hưng Hòa',
          '123 Nguyễn Huệ, Phường Bến Nghé',
          '123 Nguyễn Huệ',
          'Địa chỉ chưa cập nhật',
        ]);
        const hadLeaked =
          parsed.phone === '0908061843' || leakedAddresses.has(parsed.address || '');
        if (hadLeaked) {
          const cleaned: UserProfile = {
            ...parsed,
            phone: parsed.phone === '0908061843' ? '' : parsed.phone,
            city: '',
            district: '',
            address: '',
          };
          localStorage.setItem('novashop_auth_user', JSON.stringify(cleaned));
          return cleaned;
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'phone_otp' | 'phone_totp'>('login');
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchaseContext | null>(null);
  const pendingPurchaseRef = useRef<PendingPurchaseContext | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'overview' | 'orders' | 'wishlist' | 'edit' | 'password'>('overview');

  const setPendingPurchaseState = (action: PendingPurchaseContext | null) => {
    pendingPurchaseRef.current = action;
    setPendingPurchase(action);
  };

  const addItemToCartState = (product: Product, quantity = 1, color?: string) => {
    const itemColor = color || (product.colors && product.colors.length > 0 ? product.colors[0] : undefined);
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === itemColor
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      } else {
        return [...prev, { product, quantity, selectedColor: itemColor }];
      }
    });

    setAddedJustNowId(product.id);
    setTimeout(() => setAddedJustNowId(null), 1500);
  };

  const executePendingPurchase = (action: PendingPurchaseContext, user: UserProfile) => {
    if (action.type === 'add_to_cart') {
      if (action.product) {
        addItemToCartState(action.product, action.quantity || 1, action.color);
      }
      setSelectedProductModal(null);
      setIsWishlistOpen(false);
      addToast(
        'success',
        'Đăng nhập thành công & Đã thêm vào giỏ hàng!',
        action.product
          ? `${action.product.name} (SL: ${action.quantity || 1}) đã được thêm vào giỏ hàng.`
          : `Chào mừng ${user.fullName} trở lại với NovaShop.`
      );
    } else if (action.type === 'buy_now' || action.type === 'buy_from_card') {
      if (action.product) {
        addItemToCartState(action.product, action.quantity || 1, action.color);
      }
      setSelectedProductModal(null);
      setIsWishlistOpen(false);
      setIsCartOpen(false);
      handleNavigate('checkout');
      addToast(
        'success',
        'Đăng nhập thành công! Tiếp tục mua hàng',
        action.product
          ? `Đã chọn ${action.product.name} — Vui lòng hoàn tất thông tin nhận hàng & thanh toán.`
          : `Chào mừng ${user.fullName}, vui lòng hoàn tất các bước đặt hàng.`
      );
    } else if (action.type === 'proceed_to_checkout') {
      setIsCartOpen(false);
      handleNavigate('checkout');
      addToast(
        'success',
        'Đăng nhập thành công! Tiếp tục thanh toán',
        'Vui lòng kiểm tra thông tin nhận hàng và chọn phương thức thanh toán.'
      );
    } else if (action.type === 'open_installment') {
      setSelectedProductModal(null);
      setIsCartOpen(false);
      setInstallmentProduct(action.product || selectedProductModal || cartItems[0]?.product || PRODUCTS[0]);
      setIsInstallmentOpen(true);
      addToast(
        'success',
        'Đăng nhập thành công! Tiếp tục mua trả góp',
        'Vui lòng hoàn tất thông tin đăng ký trả góp 0%.'
      );
    }
  };

  // Automatically trigger welcome email on user's first login via Google Apps Script
  const triggerWelcomeEmailForFirstLogin = (user: UserProfile) => {
    if (
      user.email &&
      user.email.includes('@') &&
      !checkIfWelcomeEmailSent(user.id, user.email) &&
      isAutoWelcomeEmailEnabled()
    ) {
      sendWelcomeEmail(user)
        .then((res) => {
          if (res.ok && !res.alreadySent) {
            addToast(
              'success',
              '🎉 Quà tặng thành viên mới!',
              `NovaShop đã gửi thư chào mừng & mã Voucher 100K tới email ${res.sentTo} qua Google Apps Script.`
            );
          }
        })
        .catch((err) => {
          console.warn('Welcome email error:', err);
        });
    }
  };

  // Listen to Firebase Auth state changes and sync profile with Cloud Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await syncFirebaseUserProfile(fbUser);
          setCurrentUser(profile);
          localStorage.setItem('novashop_auth_user', JSON.stringify(profile));
          triggerWelcomeEmailForFirstLogin(profile);
          if (pendingPurchaseRef.current) {
            const action = pendingPurchaseRef.current;
            setPendingPurchaseState(null);
            setIsAuthOpen(false);
            executePendingPurchase(action, profile);
          }
        } catch (err) {
          console.error('Error syncing Firebase user profile:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('novashop_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }

    triggerWelcomeEmailForFirstLogin(user);

    const action = pendingPurchaseRef.current;
    if (action) {
      setPendingPurchaseState(null);
      setIsAuthOpen(false);
      executePendingPurchase(action, user);
      return;
    }

    addToast(
      'success',
      'Đăng nhập thành công!',
      `Chào mừng ${user.fullName} trở lại với NovaShop. Chúc bạn mua sắm vui vẻ!`
    );
  };

  const handleLogout = async () => {
    try {
      await signOutFirebase();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem('novashop_auth_user');
    } catch (e) {
      console.error(e);
    }
    addToast(
      'info',
      'Đã đăng xuất',
      'Bạn đã đăng xuất tài khoản an toàn.'
    );
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('novashop_auth_user', JSON.stringify(updatedUser));
      if (!isGoogleAuthUser(updatedUser)) {
        syncRegisteredAccountProfile(updatedUser);
      }
      await updateFirestoreUserProfileDetails(updatedUser);
    } catch (e) {
      console.error(e);
    }
    addToast(
      'success',
      'Cập nhật thành công',
      'Thông tin tài khoản và địa chỉ giao hàng đã được lưu.'
    );
  };

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('novashop_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTIFICATIONS;
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('novashop_sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // Draggable floating promo button state and handlers
  const [isFloatingPromoVisible, setIsFloatingPromoVisible] = useState<boolean>(true);
  const [isPartnerAdVisible, setIsPartnerAdVisible] = useState<boolean>(true);
  const {
    elementRef: floatingBtnRef,
    position: floatingBtnPosition,
    isDragging: isFloatingBtnDragging,
    dragProps: floatingBtnDragProps,
    handleClick: handleFloatingBtnClick,
    resetPosition: resetFloatingBtnPosition,
  } = useDraggable<HTMLDivElement>({
    storageKey: 'novashop_floating_promo_pos_v2',
    margin: 8,
  });

  const handleOpenInstallment = (productToInstall?: Product) => {
    const targetProd = productToInstall || selectedProductModal || cartItems[0]?.product || PRODUCTS[0];
    if (!currentUser) {
      setPendingPurchaseState({
        type: 'open_installment',
        product: targetProd,
        quantity: 1,
        color: targetProd?.colors?.[0],
      });
      setSelectedProductModal(null);
      setIsCartOpen(false);
      setAuthMode('login');
      setIsAuthOpen(true);
      addToast(
        'info',
        'Vui lòng đăng nhập để mua trả góp',
        'Sau khi đăng nhập, hệ thống sẽ tự động chuyển đến bước đăng ký trả góp 0%.'
      );
      return;
    }
    setInstallmentProduct(targetProd);
    setIsInstallmentOpen(true);
  };

  // Auto show Entrance Promotional Advertisement pop-up when opening the website (respecting 'dontShowToday')
  useEffect(() => {
    try {
      const dismissedDate = localStorage.getItem('novashop_promo_dismissed_date');
      if (dismissedDate === new Date().toDateString()) {
        return;
      }
    } catch {
      // ignore storage read error
    }
    const timer = setTimeout(() => {
      setIsPromoOpen(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Sync hash routing and URL search params (?product=id)
  useEffect(() => {
    // Check if a direct product link was opened (?product=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const productParam = urlParams.get('product');
      if (productParam) {
        const found = PRODUCTS.find((p) => p.id === productParam);
        if (found) {
          setViewingProduct(found);
          setCurrentPage('product');
          smoothScrollToTop();
        }
      }
    } catch (e) {
      console.error(e);
    }

    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#/about' || hash === '#/gioi-thieu' || hash === '#about') {
        setCurrentPage('about');
        smoothScrollToTop();
      } else if (hash === '#/chinh-sach' || hash === '#/policy' || hash === '#policy' || hash === '#chinh-sach') {
        setCurrentPage('policy');
        smoothScrollToTop();
      } else if (hash === '#/faq' || hash === '#/hoi-dap' || hash === '#faq' || hash === '#hoi-dap') {
        setCurrentPage('faq');
        smoothScrollToTop();
      } else if (hash === '#/ho-so' || hash === '#/profile' || hash === '#profile' || hash === '#ho-so') {
        setCurrentPage('profile');
        smoothScrollToTop();
      } else if (hash === '#/checkout' || hash === '#/thanh-toan' || hash === '#checkout' || hash === '#thanh-toan') {
        setCurrentPage('checkout');
        smoothScrollToTop();
      } else if (hash.startsWith('#/san-pham/') || hash.startsWith('#/product/')) {
        const prodId = hash.replace('#/san-pham/', '').replace('#/product/', '').split('?')[0];
        const found = PRODUCTS.find((p) => p.id.toLowerCase() === prodId.toLowerCase());
        if (found) {
          setViewingProduct(found);
          setCurrentPage('product');
          smoothScrollToTop();
        }
      } else if (hash === '#/' || hash === '' || hash === '#home') {
        setCurrentPage('home');
      } else if (hash.startsWith('#') && !hash.startsWith('#/')) {
        const targetId = hash.slice(1);
        const el = document.getElementById(targetId);
        if (el) {
          smoothScrollToElement(el);
        }
      }
    };

    // Intercept in-page section anchor links (<a href="#section-id">) for smooth scrolling
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#/')) return;
      const sectionEl = document.getElementById(href.slice(1));
      if (sectionEl) {
        e.preventDefault();
        smoothScrollToElement(sectionEl);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    document.addEventListener('click', handleAnchorClick);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  const handleNavigate = (page: 'home' | 'about' | 'policy' | 'faq' | 'profile' | 'checkout' | 'product', tab?: PolicyTabId) => {
    if (tab) {
      setActivePolicyTab(tab);
    }
    setCurrentPage(page);
    if (page === 'about') {
      window.location.hash = '#/about';
    } else if (page === 'policy') {
      window.location.hash = '#/chinh-sach';
    } else if (page === 'faq') {
      window.location.hash = '#/hoi-dap';
    } else if (page === 'profile') {
      window.location.hash = '#/ho-so';
    } else if (page === 'checkout') {
      window.location.hash = '#/thanh-toan';
    } else if (page === 'product' && viewingProduct) {
      window.location.hash = `#/san-pham/${viewingProduct.id}`;
    } else {
      window.location.hash = '';
    }
    smoothScrollToTop();
  };

  const handleOpenProductPage = (product: Product) => {
    setViewingProduct(product);
    setSelectedProductModal(null);
    setCurrentPage('product');
    window.location.hash = `#/san-pham/${product.id}`;
    smoothScrollToTop();
  };

  const handleOpenProfilePage = (tab: 'overview' | 'orders' | 'wishlist' | 'edit' | 'password' = 'overview') => {
    setProfileInitialTab(tab);
    setIsProfileOpen(false);
    handleNavigate('profile');
  };

  const handleOpenPolicy = (tab: PolicyTabId = 'warranty') => {
    setActivePolicyTab(tab);
    handleNavigate('policy', tab);
  };

  const handleOpenPolicyModal = (tab: PolicyTabId = 'warranty') => {
    setActivePolicyTab(tab);
    setIsPolicyOpen(true);
  };

  const handleOpenAbout = () => {
    handleNavigate('about');
  };

  const handleOpenAboutModal = () => {
    setIsAboutOpen(true);
  };

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'discount-desc' | 'newest'>('featured');
  const [priceFilter, setPriceFilter] = useState<number>(95000000); // max filter
  const [priceTier, setPriceTier] = useState<'all' | 'under1m' | '1to3m' | 'midrange' | '3to10m' | 'above10m'>('all');
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const isFirstRender = useRef(true);

  // Web Speech API (Voice Search) states
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [voiceInterimText, setVoiceInterimText] = useState<string>('');
  const speechRecognitionRef = useRef<any>(null);

  const handleToggleVoiceSearch = () => {
    if (isVoiceListening && speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore stop error
      }
      setIsVoiceListening(false);
      setVoiceInterimText('');
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      addToast(
        'warning',
        'Trình duyệt chưa hỗ trợ Web Speech API',
        'Vui lòng sử dụng Google Chrome, Edge hoặc Safari để tìm kiếm bằng giọng nói, hoặc chọn các từ khóa gợi ý thông minh.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      speechRecognitionRef.current = recognition;
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setVoiceInterimText('');
        addToast(
          'info',
          '🎙️ Đang lắng nghe giọng nói (Tiếng Việt)...',
          'Hãy nói tên sản phẩm, danh mục hoặc mức giá (VD: "Điện thoại Samsung dưới 10 triệu", "Sạc dự phòng 145W").'
        );
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const cleanInterim = interimTranscript.replace(/[.,!?]+$/g, '').trim();
        if (cleanInterim) {
          setVoiceInterimText(cleanInterim);
          setSearchQuery(cleanInterim);
        }

        const cleanFinal = finalTranscript.replace(/[.,!?]+$/g, '').trim();
        if (cleanFinal) {
          setVoiceInterimText('');
          setSearchQuery(cleanFinal);
          setSelectedCategory('all');
          addToast(
            'success',
            `🎙️ Đã tìm theo giọng nói: "${cleanFinal}"`,
            'Hệ thống đã tự động phân tích từ khóa và lọc danh sách sản phẩm phù hợp.'
          );
          if (currentPage !== 'home') {
            handleNavigate('home');
            setTimeout(() => smoothScrollToElement('products-grid-section'), 100);
          }
        }
      };

      recognition.onerror = (event: any) => {
        setIsVoiceListening(false);
        setVoiceInterimText('');
        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          addToast(
            'warning',
            'Chưa cấp quyền Micro',
            'Vui lòng cho phép quyền truy cập Micro trên trình duyệt để sử dụng tìm kiếm bằng giọng nói.'
          );
        } else if (event?.error !== 'aborted' && event?.error !== 'no-speech') {
          addToast(
            'info',
            'Không nhận diện được giọng nói',
            'Vui lòng bấm biểu tượng Micro và thử nói rõ tên sản phẩm một lần nữa.'
          );
        }
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
        setVoiceInterimText('');
      };

      recognition.start();
    } catch {
      setIsVoiceListening(false);
      addToast(
        'warning',
        'Không thể khởi động nhận diện giọng nói',
        'Vui lòng thử lại hoặc chọn các từ khóa gợi ý thông minh.'
      );
    }
  };

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, []);

  // Initial skeleton loading for smooth visual entrance
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingProducts(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Brief skeleton refresh on changing category, price tier or sort for responsive feedback
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsLoadingProducts(true);
    const timer = setTimeout(() => {
      setIsLoadingProducts(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [selectedCategory, sortBy, priceTier]);

  // Animation key to trigger smooth, gentle fade-in when products are loaded or filter state changes
  const [filterAnimationKey, setFilterAnimationKey] = useState<number>(0);

  useEffect(() => {
    setFilterAnimationKey((prev) => prev + 1);
  }, [selectedCategory, sortBy, priceTier, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterAnimationKey((prev) => prev + 1);
    }, 120);
    return () => clearTimeout(timer);
  }, [priceFilter]);

  // Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [addedJustNowId, setAddedJustNowId] = useState<string | null>(null);

  // Quick 2-Product Technical Specification Comparison State
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Window dimensions state for responsive collision detection
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // FloatingCompareBar visibility state (when products are being compared and comparison modal is not open)
  const isCompareBarVisible = !isCompareModalOpen && compareProducts.length > 0;

  // Responsive bottom positioning class for #floating-promo-btn to avoid colliding with FloatingCompareBar
  const floatingPromoBottomClass = useMemo(() => {
    if (isCompareBarVisible) {
      if (isPartnerAdVisible) {
        return 'bottom-[180px] sm:bottom-[92px] xl:bottom-4';
      }
      return 'bottom-[126px] sm:bottom-[92px] xl:bottom-4';
    }
    if (isPartnerAdVisible) {
      return 'bottom-[114px] sm:bottom-4';
    }
    return 'bottom-[52px] sm:bottom-4';
  }, [isCompareBarVisible, isPartnerAdVisible]);

  // Dynamic style for #floating-promo-btn with collision avoidance if dragged near FloatingCompareBar
  const effectivePromoStyle = useMemo<React.CSSProperties>(() => {
    const baseStyle = { ...(floatingBtnDragProps.style || {}) };
    if (isFloatingBtnDragging) {
      return baseStyle;
    }

    // If custom dragged position is active, check if it collides with FloatingCompareBar
    if (floatingBtnPosition && isCompareBarVisible && typeof window !== 'undefined') {
      const compareEl = document.getElementById('floating-compare-bar');
      let compareLeft: number;
      let compareRight: number;
      let compareTop: number;
      let compareBottom: number;

      if (compareEl) {
        const rect = compareEl.getBoundingClientRect();
        compareLeft = rect.left;
        compareRight = rect.right;
        compareTop = rect.top;
        compareBottom = rect.bottom;
      } else {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const compareWidth = Math.min(vw * 0.94, 672);
        compareLeft = (vw - compareWidth) / 2;
        compareRight = compareLeft + compareWidth;
        const compareHeight = 72;
        compareBottom = vh - 16;
        compareTop = compareBottom - compareHeight;
      }

      const promoEl = floatingBtnRef.current;
      const promoWidth = promoEl?.offsetWidth || 145;
      const promoHeight = promoEl?.offsetHeight || 44;
      const promoLeft = floatingBtnPosition.x;
      const promoRight = promoLeft + promoWidth;
      const promoTop = floatingBtnPosition.y;
      const promoBottom = promoTop + promoHeight;

      // Check 2D bounding box collision with FloatingCompareBar (with 12px safety margin)
      const safetyMargin = 12;
      const hasHorizontalOverlap =
        promoRight >= compareLeft - safetyMargin && promoLeft <= compareRight + safetyMargin;
      const hasVerticalOverlap =
        promoBottom >= compareTop - safetyMargin && promoTop <= compareBottom + safetyMargin;

      if (hasHorizontalOverlap && hasVerticalOverlap) {
        // Nudge position cleanly above FloatingCompareBar
        const safeY = Math.max(10, compareTop - promoHeight - 12);
        return {
          ...baseStyle,
          top: `${safeY}px`,
          transition:
            'top 350ms cubic-bezier(0.22, 1, 0.36, 1), left 300ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 300ms ease',
        };
      }
    }

    return {
      ...baseStyle,
      transition: isFloatingBtnDragging
        ? 'none'
        : 'bottom 350ms cubic-bezier(0.22, 1, 0.36, 1), top 350ms cubic-bezier(0.22, 1, 0.36, 1), left 300ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 300ms ease',
    };
  }, [floatingBtnDragProps.style, floatingBtnPosition, isCompareBarVisible, isFloatingBtnDragging, windowDimensions]);

  const handleCompareProduct = (product: Product) => {
    setCompareProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev;
      }
      if (prev.length === 0) {
        return [product];
      }
      if (prev.length === 1) {
        return [prev[0], product];
      }
      return [prev[0], product];
    });
    setIsCompareModalOpen(true);
  };

  const handleSelectCompareSlot = (slotIndex: 0 | 1, product: Product) => {
    setCompareProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      if (slotIndex === 0) {
        return filtered.length > 0 ? [product, filtered[0]].slice(0, 2) : [product];
      } else {
        const first = prev[0] && prev[0].id !== product.id ? prev[0] : filtered[0];
        return first ? [first, product] : [product];
      }
    });
  };

  const handleRemoveCompareProduct = (productId: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleSwapCompareProducts = () => {
    setCompareProducts((prev) => (prev.length === 2 ? [prev[1], prev[0]] : prev));
  };

  const handleClearCompare = () => {
    setCompareProducts([]);
  };

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('novashop_cart', JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('novashop_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {}
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem('novashop_orders', JSON.stringify(orders));
    } catch (e) {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('novashop_notifications', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('novashop_sound_enabled', String(notificationSoundEnabled));
    } catch (e) {}
  }, [notificationSoundEnabled]);

  // Subtle web audio chime for new notifications
  const playNotificationSound = () => {
    if (!notificationSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (e) {
      // Audio autoplay may be guarded by user gesture
    }
  };

  const addAppNotification = (
    type: NotificationType,
    title: string,
    message: string,
    options?: Partial<AppNotification>
  ) => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now().toString(),
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...options,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    playNotificationSound();
    addToast(type === 'order' ? 'success' : 'info', title, message);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('success', 'Đã đánh dấu đã đọc', 'Tất cả thông báo đã được cập nhật.');
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    addToast('info', 'Đã xóa hộp thư thông báo', 'Toàn bộ danh sách thông báo đã được dọn sạch.');
  };

  const handleNotificationAction = (notification: AppNotification) => {
    setIsNotificationsOpen(false);
    if (!notification.isRead) {
      handleMarkNotificationRead(notification.id);
    }

    if (notification.actionType === 'open_orders') {
      setIsOrdersOpen(true);
    } else if (notification.actionType === 'open_promo') {
      setIsPromoOpen(true);
    } else if (notification.actionType === 'open_cart') {
      setIsCartOpen(true);
    } else if (notification.actionType === 'open_policy') {
      handleNavigate('policy');
    } else if (notification.actionType === 'open_installment') {
      handleOpenInstallment();
    } else if (notification.actionType === 'open_product' && notification.targetId) {
      const prod = PRODUCTS.find((p) => p.id === notification.targetId);
      if (prod) handleOpenProductPage(prod);
    }
  };

  const handleSendTestNotification = () => {
    const testSamples = [
      {
        type: 'promo' as NotificationType,
        title: '⚡ Chớp Nhoáng: Flash Sale Phụ Kiện Giảm 45%',
        message: 'Duy nhất trong 2 giờ tới! Loa Bluetooth Marshall & sạc nhanh Nexode giảm sập sàn đến 45%.',
        badge: 'FLASH SALE',
        actionType: 'open_promo' as const,
      },
      {
        type: 'voucher' as NotificationType,
        title: '🎟️ Bạn Nhận Được Mã Giảm Giá 200.000₫',
        message: 'Mã VIPTECH200 đã sẵn sàng sử dụng cho đơn hàng phụ kiện & laptop từ 2.000.000₫.',
        badge: 'VOUCHER VIP',
        actionType: 'open_promo' as const,
      },
      {
        type: 'system' as NotificationType,
        title: '🚀 Tính Năng Mới: Trung Tâm Thông Báo NovaShop',
        message: 'Chào mừng bạn đến với hệ thống thông báo đa kênh, cập nhật hành trình đơn hàng và ưu đãi chớp nhoáng 24/7!',
        badge: 'TÍNH NĂNG MỚI',
        actionType: 'open_policy' as const,
      },
    ];

    const pick = testSamples[Math.floor(Math.random() * testSamples.length)];
    addAppNotification(pick.type, pick.title, pick.message, {
      badge: pick.badge,
      actionType: pick.actionType,
    });
  };

  const addToast = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    description?: string
  ) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => {
      const isThemeToast =
        title === 'Đã chuyển sang chế độ tối' || title === 'Đã chuyển sang chế độ sáng';
      const filtered = prev.filter((t) => {
        if (
          isThemeToast &&
          (t.title === 'Đã chuyển sang chế độ tối' || t.title === 'Đã chuyển sang chế độ sáng')
        ) {
          return false;
        }
        return !(t.title === title && t.description === description);
      });
      return [...filtered, { id, type, title, description }];
    });
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cart & Purchase operations (redirecting unauthenticated users to login before continuing purchase steps)
  const handleAddToCart = (
    product: Product,
    quantity = 1,
    color?: string,
    options?: { openCheckout?: boolean }
  ) => {
    const itemColor = color || (product.colors && product.colors.length > 0 ? product.colors[0] : undefined);

    if (!currentUser) {
      setPendingPurchaseState({
        type: options?.openCheckout ? 'buy_from_card' : 'add_to_cart',
        product,
        quantity,
        color: itemColor,
      });
      setSelectedProductModal(null);
      setIsWishlistOpen(false);
      setAuthMode('login');
      setIsAuthOpen(true);
      addToast(
        'info',
        'Vui lòng đăng nhập để mua sản phẩm',
        'Sau khi đăng nhập, hệ thống sẽ tự động tiếp tục các bước mua hàng của bạn.'
      );
      return;
    }

    addItemToCartState(product, quantity, itemColor);

    if (options?.openCheckout) {
      setSelectedProductModal(null);
      setIsCartOpen(false);
      handleNavigate('checkout');
      return;
    }

    addToast(
      'success',
      'Đã thêm vào giỏ hàng!',
      `${product.name} (SL: ${quantity})`
    );
  };

  const handleUpdateQuantity = (productId: string, newQty: number, color?: string) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId, color);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.selectedColor === color
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string, color?: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.selectedColor === color))
    );
    addToast('info', 'Đã xóa sản phẩm khỏi giỏ hàng');
  };

  const handleClearCart = () => {
    setCartItems([]);
    addToast('info', 'Đã làm trống giỏ hàng');
  };

  const handleBuyNow = (product: Product, quantity = 1, color?: string) => {
    const itemColor = color || (product.colors && product.colors.length > 0 ? product.colors[0] : undefined);

    if (!currentUser) {
      setPendingPurchaseState({
        type: 'buy_now',
        product,
        quantity,
        color: itemColor,
      });
      setSelectedProductModal(null);
      setIsCartOpen(false);
      setAuthMode('login');
      setIsAuthOpen(true);
      addToast(
        'info',
        'Vui lòng đăng nhập để mua sản phẩm',
        'Sau khi đăng nhập, hệ thống sẽ tự động chuyển bạn đến bước đặt hàng & thanh toán.'
      );
      return;
    }

    addItemToCartState(product, quantity, itemColor);
    setSelectedProductModal(null);
    setIsCartOpen(false);
    handleNavigate('checkout');
  };

  const handleProceedToCheckout = () => {
    if (!currentUser) {
      setPendingPurchaseState({
        type: 'proceed_to_checkout',
        cartCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
      });
      setIsCartOpen(false);
      setAuthMode('login');
      setIsAuthOpen(true);
      addToast(
        'info',
        'Vui lòng đăng nhập để thanh toán',
        'Sau khi đăng nhập, bạn sẽ tiếp tục thực hiện các bước đặt mua hàng.'
      );
      return;
    }
    setIsCartOpen(false);
    handleNavigate('checkout');
  };

  // Wishlist toggle
  const handleToggleWishlist = (productId: string) => {
    const isSaved = wishlistIds.includes(productId);
    if (isSaved) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      addToast('info', 'Đã bỏ khỏi danh sách yêu thích');
    } else {
      setWishlistIds((prev) => [...prev, productId]);
      addToast('success', 'Đã lưu vào danh sách yêu thích');
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderProgressStage) => {
    const statusLabels: Record<OrderProgressStage, string> = {
      confirmed: 'Đã xác nhận (Confirmed)',
      packing: 'Đang đóng gói (Packing)',
      shipping: 'Đang vận chuyển (Shipping)',
      delivered: 'Đã giao hàng (Delivered)',
    };
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o))
    );
    setSuccessOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, orderStatus: status } : prev
    );
    addToast(
      'info',
      `Đã cập nhật tiến độ đơn #${orderId}`,
      `Trạng thái hiện tại: ${statusLabels[status]}`
    );
  };

  const markOrderEmailSent = (orderId: string, sentTo: string) => {
    const sentAt = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, emailSent: true, emailSentTo: sentTo, emailSentAt: sentAt } : o
      )
    );
    setSuccessOrder((prev) =>
      prev && prev.id === orderId
        ? { ...prev, emailSent: true, emailSentTo: sentTo, emailSentAt: sentAt }
        : prev
    );
  };

  // Checkout completion
  const handleOrderSuccess = (order: Order, options?: { fromInstallmentModal?: boolean }) => {
    const resolvedEmail =
      order.customer.email &&
      order.customer.email.includes('@') &&
      order.customer.email !== 'khachhang@novashop.vn'
        ? order.customer.email.trim()
        : currentUser?.email && currentUser.email.includes('@')
        ? currentUser.email.trim()
        : order.customer.email?.trim() || '';

    const normalizedOrder: Order = resolvedEmail
      ? {
          ...order,
          customer: {
            ...order.customer,
            email: resolvedEmail,
          },
        }
      : order;

    setOrders((prev) => [normalizedOrder, ...prev]);

    // Automatically send Order Confirmation & Electronic VAT Invoice Email via Google Apps Script (Zero Billing / Zero OAuth)
    if (resolvedEmail && resolvedEmail.includes('@')) {
      sendOrderConfirmationEmail(normalizedOrder, resolvedEmail)
        .then((res) => {
          if (res.ok) {
            markOrderEmailSent(normalizedOrder.id, res.sentTo);
            addToast(
              'info',
              'Đã gửi email xác nhận đơn hàng!',
              `Chi tiết đơn hàng #${normalizedOrder.id} đã được gửi tới ${res.sentTo}`
            );
          }
        })
        .catch(() => {
          // Silent catch if offline
        });
    }

    // Reward member NovaPoints (1 point per 10,000 VND, capped at 50,000 per order per security rules)
    if (currentUser) {
      const earnedPoints = Math.min(50000, Math.max(10, Math.round(order.total / 10000)));
      const nextPoints = Math.min(1000000, currentUser.novaPoints + earnedPoints);
      const updatedUser: UserProfile = {
        ...currentUser,
        novaPoints: nextPoints,
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('novashop_auth_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error(e);
      }
      updateFirestoreUserPoints(currentUser.id, nextPoints).catch((err) =>
        console.error('Error updating NovaPoints:', err)
      );
    }

    if (!options?.fromInstallmentModal) {
      setCartItems([]);
      setIsCheckoutOpen(false);
      setSearchQuery('');
      setSuccessOrder(normalizedOrder);
      if (normalizedOrder.paymentMethod === 'cod') {
        addToast(
          'success',
          'Đặt hàng COD thành công!',
          `Mã đơn: #${normalizedOrder.id}. Email xác nhận đang được gửi tới ${resolvedEmail || 'bạn'}.`
        );
      } else {
        addToast('success', 'Thanh toán & Đặt hàng thành công!', `Mã đơn hàng: ${normalizedOrder.id}`);
      }
    } else if (!installmentProduct) {
      // If installment was initiated from the entire cart, clear the cart
      setCartItems([]);
    }

    if (normalizedOrder.qrTransactionDetails) {
      const qrInfo = normalizedOrder.qrTransactionDetails;
      addAppNotification(
        'order',
        `🏦 Biến động TK ${qrInfo.bankCode}: +${formatVND(qrInfo.amount)} (Đơn #${normalizedOrder.id})`,
        `Hệ thống đã đồng bộ thanh toán chuyển khoản tới TK ${qrInfo.accountNumber} (${qrInfo.accountHolder}) • Mã GD: ${qrInfo.transactionId}.`,
        {
          badge: 'ĐÃ THANH TOÁN QR',
          actionType: 'open_orders',
          targetId: normalizedOrder.id,
        }
      );
    }

    addAppNotification(
      'order',
      `📦 Đặt hàng thành công #${normalizedOrder.id}`,
      `Đơn hàng trị giá ${formatVND(normalizedOrder.total)} đã được hệ thống xác nhận thành công và bàn giao cho bộ phận xử lý đóng gói.`,
      {
        badge: 'ĐÃ XÁC NHẬN',
        actionType: 'open_orders',
        targetId: normalizedOrder.id,
      }
    );
  };

  // Parsed Search Intent & Smart Keyword Suggestions (for typing & Web Speech API voice queries)
  const parsedSearchIntent = useMemo(() => {
    return parseSmartSearchQuery(searchQuery);
  }, [searchQuery]);

  const smartKeywordSuggestions = useMemo(() => {
    return generateSmartKeywordSuggestions(searchQuery, PRODUCTS, 8);
  }, [searchQuery]);

  // Filtered Products (Enhanced with Vietnamese diacritic-insensitive matching, voice natural language intent, and multi-token relevance scoring)
  const filteredProducts = useMemo(() => {
    const hasQuery = searchQuery.trim().length > 0;
    const scoredList: Array<{ product: Product; relevanceScore: number }> = [];

    for (const product of PRODUCTS) {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        continue;
      }

      // Price slider filter
      if (product.price > priceFilter) {
        continue;
      }

      // Quick price tier filter
      if (priceTier === 'under1m' && product.price >= 1000000) continue;
      if (priceTier === '1to3m' && (product.price < 1000000 || product.price > 3000000)) continue;
      if (priceTier === 'midrange' && (product.price < 2000000 || product.price > 13500000)) continue;
      if (priceTier === '3to10m' && (product.price < 3000000 || product.price > 10000000)) continue;
      if (priceTier === 'above10m' && product.price < 10000000) continue;

      // Smart Search & Voice Query filter
      let relevanceScore = 1;
      if (hasQuery) {
        relevanceScore = scoreProductMatch(product, parsedSearchIntent);
        if (relevanceScore <= 0) {
          continue;
        }
      }

      scoredList.push({ product, relevanceScore });
    }

    return scoredList
      .sort((itemA, itemB) => {
        const a = itemA.product;
        const b = itemB.product;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'discount-desc') {
          const discA = a.originalPrice && a.originalPrice > a.price ? a.originalPrice - a.price : 0;
          const discB = b.originalPrice && b.originalPrice > b.price ? b.originalPrice - b.price : 0;
          return discB - discA;
        }
        if (sortBy === 'newest') {
          const isNewA = a.badge === 'Mới' ? 1 : 0;
          const isNewB = b.badge === 'Mới' ? 1 : 0;
          if (isNewA !== isNewB) return isNewB - isNewA;
          const idNumA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
          const idNumB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
          return idNumB - idNumA;
        }
        // When searching in 'featured' mode, rank highest relevance matches first
        if (hasQuery && itemB.relevanceScore !== itemA.relevanceScore) {
          return itemB.relevanceScore - itemA.relevanceScore;
        }
        return 0;
      })
      .map((item) => item.product);
  }, [selectedCategory, searchQuery, parsedSearchIntent, sortBy, priceFilter, priceTier]);

  // Page-by-page Pagination for #products-grid-section (Trang 1, Trang 2, Trang 3,...)
  const [productsPage, setProductsPage] = useState<number>(1);
  const [productsPerPage, setProductsPerPage] = useState<number>(12);

  // Reset back to page 1 whenever search, category, or filter criteria changes
  useEffect(() => {
    setProductsPage(1);
  }, [selectedCategory, sortBy, priceTier, searchQuery, priceFilter]);

  // Total pages calculation
  const totalProductPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  }, [filteredProducts.length, productsPerPage]);

  // Ensure productsPage is always within bounds if total pages shrinks
  useEffect(() => {
    if (productsPage > totalProductPages) {
      setProductsPage(totalProductPages);
    }
  }, [productsPage, totalProductPages]);

  // Sliced products for current active page
  const startIndex = (productsPage - 1) * productsPerPage;
  const endIndex = Math.min(startIndex + productsPerPage, filteredProducts.length);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  const handlePageChange = useCallback((newPage: number) => {
    const targetPage = Math.max(1, Math.min(newPage, totalProductPages));
    setProductsPage(targetPage);
    // Smoothly scroll back to top of product grid section so user can immediately browse the new page
    smoothScrollToElement('products-grid-section');
  }, [totalProductPages]);

  // Smart Pagination Range with ellipsis (e.g. 1, 2, 3, '...', 11)
  const paginationRange = useMemo(() => {
    const total = totalProductPages;
    const current = productsPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }

    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
  }, [totalProductPages, productsPage]);

  const wishlistProducts = useMemo(() => {
    return PRODUCTS.filter((p) => wishlistIds.includes(p.id));
  }, [wishlistIds]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div
      className={`min-h-screen w-full max-w-[100vw] overflow-x-clip flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-250 ${
        isDarkMode
          ? 'dark bg-[#131d33] text-slate-200'
          : 'bg-[#f6f7f9] text-slate-900'
      }`}
    >
      
      {/* Site Header */}
      <Header
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        orderCount={orders.length}
        notificationCount={unreadNotificationCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenPolicy={handleOpenPolicy}
        onOpenAbout={handleOpenAbout}
        onOpenPromo={() => setIsPromoOpen(true)}
        onOpenInstallment={() => handleOpenInstallment()}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        products={PRODUCTS}
        onSelectProduct={(product) => handleOpenProductPage(product)}
        onAddToCart={(product) => handleAddToCart(product, 1)}
        currentUser={currentUser}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onOpenProfile={handleOpenProfilePage}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        isVoiceListening={isVoiceListening}
        voiceInterimText={voiceInterimText}
        onToggleVoiceSearch={handleToggleVoiceSearch}
        smartSuggestions={smartKeywordSuggestions}
        onOpenGasConfig={() => setIsGasConfigOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6">
        {currentPage === 'product' && viewingProduct ? (
          <ProductDetailPage
            product={viewingProduct}
            onBackToHome={() => handleNavigate('home')}
            onAddToCart={(prod, qty, col) => handleAddToCart(prod, qty, col)}
            onBuyNow={(prod, qty, col) => {
              handleAddToCart(prod, qty, col, { openCheckout: true });
            }}
            isWishlisted={wishlistIds.includes(viewingProduct.id)}
            onToggleWishlist={handleToggleWishlist}
            onShare={(p) => setShareProductModal(p)}
            onOpenInstallment={(prod) => handleOpenInstallment(prod)}
            allProducts={PRODUCTS}
            onSelectProduct={(p) => handleOpenProductPage(p)}
            onOpenPolicy={handleOpenPolicy}
            onOpenCart={() => setIsCartOpen(true)}
            onShowToast={addToast}
          />
        ) : currentPage === 'profile' ? (
          <ProfilePage
            user={currentUser}
            initialTab={profileInitialTab}
            onBackToHome={() => handleNavigate('home')}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
            onOpenOrders={() => setIsOrdersOpen(true)}
            onOpenPromo={() => setIsPromoOpen(true)}
            onOpenAuth={(mode = 'login') => {
              setAuthMode(mode);
              setIsAuthOpen(true);
            }}
            orders={orders}
            wishlistProducts={wishlistProducts}
            cartItems={cartItems}
            appliedVoucher={appliedVoucher}
            onSelectOrderToView={(ord) => setSuccessOrder(ord)}
            onSelectProduct={(prod) => handleOpenProductPage(prod)}
            onRemoveFromWishlist={handleToggleWishlist}
            onAddToCart={(prod) => handleAddToCart(prod, 1)}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenGasConfig={() => setIsGasConfigOpen(true)}
          />
        ) : currentPage === 'about' ? (
          <AboutPage
            onBackToHome={() => handleNavigate('home')}
            onExploreProducts={() => {
              handleNavigate('home');
              setTimeout(() => {
                smoothScrollToElement('products-grid-section');
              }, 100);
            }}
            onOpenPolicy={(tab) => handleNavigate('policy', tab)}
            onShowToast={addToast}
          />
        ) : currentPage === 'policy' ? (
          <PolicyPage
            initialTab={activePolicyTab}
            onBackToHome={() => handleNavigate('home')}
            onExploreProducts={() => {
              handleNavigate('home');
              setTimeout(() => {
                smoothScrollToElement('products-grid-section');
              }, 100);
            }}
            onOpenFaq={() => handleNavigate('faq')}
            onShowToast={addToast}
          />
        ) : currentPage === 'faq' ? (
          <FaqPage
            onBackToHome={() => handleNavigate('home')}
            onExploreProducts={() => {
              handleNavigate('home');
              setTimeout(() => {
                smoothScrollToElement('products-grid-section');
              }, 100);
            }}
            onOpenPolicy={(tab) => handleNavigate('policy', tab)}
            onOpenOrders={() => setIsOrdersOpen(true)}
            onShowToast={addToast}
          />
        ) : currentPage === 'checkout' ? (
          <CheckoutModal
            isOpen={true}
            isPage={true}
            onClose={() => handleNavigate('home')}
            onBackToHome={() => handleNavigate('home')}
            cartItems={cartItems}
            appliedVoucher={appliedVoucher}
            onOrderSuccess={(ord) => {
              handleOrderSuccess(ord);
              handleNavigate('home');
            }}
            currentUser={currentUser}
            onOpenAuth={() => {
              setPendingPurchaseState({
                type: 'proceed_to_checkout',
                cartCount: totalCartCount,
              });
              setAuthMode('login');
              setIsAuthOpen(true);
            }}
            onBackToCart={() => {
              handleNavigate('home');
              setIsCartOpen(true);
            }}
          />
        ) : (
          <>
            {/* Hero Banner with Flagship Spotlight Stage & Collection Bento */}
            <BannerHero 
              onExploreClick={() => {
                smoothScrollToElement('products-grid-section');
              }}
              onApplyVoucherClick={(code) => {
                const v = VOUCHERS.find((item) => item.code === code);
                if (v) {
                  setAppliedVoucher(v);
                  addToast('success', `Đã áp dụng mã ${code}!`, v.description);
                  setIsCartOpen(true);
                }
              }}
              onOpenPolicy={handleOpenPolicy}
              onSelectProduct={(product) => handleOpenProductPage(product)}
              onBuyNowProduct={(product) => handleAddToCart(product, 1, undefined, { openCheckout: true })}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                setPriceTier('all');
              }}
              onOpenPromo={() => setIsPromoOpen(true)}
              onOpenInstallment={(prod) => handleOpenInstallment(prod)}
            />

            {/* Authenticated User Profile Section displayed after login */}
            {currentUser && (
              <UserProfileBanner
                user={currentUser}
                orders={orders}
                wishlistCount={wishlistIds.length}
                cartCount={totalCartCount}
                onOpenProfileModal={handleOpenProfilePage}
                onOpenOrders={() => setIsOrdersOpen(true)}
                onOpenWishlist={() => setIsWishlistOpen(true)}
                onOpenCart={() => setIsCartOpen(true)}
                onLogout={handleLogout}
              />
            )}

        {/* Section Header & Filters Bar */}
        <section id="products-grid-section" className="mb-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#1a2642] p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <span className="w-1.5 h-5 sm:h-6 rounded-full bg-gradient-to-b from-blue-600 via-indigo-500 to-amber-500 shrink-0" />
                <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedCategory === 'all' 
                    ? 'Tất Cả Sản Phẩm Công Nghệ' 
                    : CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Sản phẩm'}
                </h2>
                <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200/70 dark:border-indigo-800/60 tabular-nums shrink-0">
                  {filteredProducts.length > 0 
                    ? `Trang ${productsPage}/${totalProductPages} • ${filteredProducts.length} sản phẩm` 
                    : '0 sản phẩm'}
                </span>
              </div>
              {searchQuery && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span>
                    Kết quả tìm kiếm cho: <strong className="text-blue-600">"{searchQuery}"</strong>
                  </span>
                  {parsedSearchIntent.maxPriceConstraint !== undefined && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                      Ngân sách ≤ {formatVND(parsedSearchIntent.maxPriceConstraint)}
                    </span>
                  )}
                  {parsedSearchIntent.minPriceConstraint !== undefined && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                      Ngân sách ≥ {formatVND(parsedSearchIntent.minPriceConstraint)}
                    </span>
                  )}
                  {smartKeywordSuggestions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5 w-full">
                      <span className="text-[11px] font-semibold text-slate-400 mr-1">
                        Gợi ý liên quan:
                      </span>
                      {smartKeywordSuggestions.slice(0, 5).map((sug) => (
                        <button
                          key={sug.keyword}
                          type="button"
                          onClick={() => setSearchQuery(sug.keyword)}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Search className="w-2.5 h-2.5 text-indigo-500" />
                          <span>{sug.keyword}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              {/* Quick Voice Search trigger in filter bar */}
              <button
                type="button"
                onClick={handleToggleVoiceSearch}
                className={`px-3 py-2 sm:py-1.5 rounded-xl font-bold border inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isVoiceListening
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-xs'
                    : 'bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 border-indigo-200/80'
                }`}
                title="Tìm kiếm sản phẩm bằng giọng nói Tiếng Việt (Web Speech API)"
              >
                {isVoiceListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Đang nghe...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Tìm bằng giọng nói</span>
                  </>
                )}
              </button>
              
              {/* Max price filter */}
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 px-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-slate-500">Giá tối đa:</span>
                  <span className="font-bold text-blue-600 tabular-nums">{formatVND(priceFilter)}</span>
                </div>
                <input
                  type="range"
                  min="150000"
                  max="95000000"
                  step="500000"
                  value={priceFilter}
                  onChange={(e) => {
                    setPriceFilter(Number(e.target.value));
                    setPriceTier('all');
                  }}
                  className="w-24 sm:w-20 accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Sort selector */}
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 px-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 flex-1 sm:flex-initial">
                <div className="flex items-center gap-1.5 shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-slate-500">Sắp xếp:</span>
                </div>
                <select
                  id="sort-by-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-100 rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer text-right sm:text-left"
                >
                  <option value="featured">Nổi bật nhất</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="discount-desc">Khuyến mãi nhiều nhất</option>
                  <option value="newest">Sản phẩm mới nhất</option>
                </select>
              </div>

              {/* Reset filter button if active */}
              {(selectedCategory !== 'all' || searchQuery || priceFilter < 95000000 || priceTier !== 'all') && (
                <button
                  id="reset-filter-btn"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setPriceFilter(95000000);
                    setPriceTier('all');
                  }}
                  className="px-3 py-2 sm:py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer shrink-0"
                >
                  Đặt lại lọc
                </button>
              )}
            </div>
          </div>

          {/* Quick Price Segment Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-slate-500 font-bold text-xs shrink-0 flex items-center gap-1">
              Phân khúc giá:
            </span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'midrange', label: '🎯 Giá trung bình (2 - 13 triệu)' },
              { id: '3to10m', label: '3 - 10 triệu' },
              { id: '1to3m', label: '1 - 3 triệu' },
              { id: 'under1m', label: 'Dưới 1 triệu' },
              { id: 'above10m', label: 'Trên 10 triệu' },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => setPriceTier(tier.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  priceTier === tier.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : tier.id === 'midrange'
                    ? 'bg-amber-50/90 text-amber-800 hover:bg-amber-100 border border-amber-200/80 shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 border border-slate-200/80 shadow-2xs'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>

          {/* Product Cards Grid - 2 columns on mobile, 3-4 on tablet/desktop */}
          {isLoadingProducts ? (
            <div
              key="products-loading-skeleton"
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 products-grid-fade-in"
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={`product-skeleton-${index}`} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              key={`empty-state-${filterAnimationKey}`}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-6 sm:p-12 text-center space-y-3 products-grid-fade-in"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Filter className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Không tìm thấy sản phẩm phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Không có sản phẩm nào khớp với bộ lọc hoặc từ khóa "{searchQuery}". Bạn hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh mức giá tối đa.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setPriceFilter(95000000);
                  setPriceTier('all');
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <>
              <div
                key={`products-grid-${filterAnimationKey}-p-${productsPage}`}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 products-grid-fade-in"
              >
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onSelectProduct={(p) => handleOpenProductPage(p)}
                    onAddToCart={(p, e) => {
                      e.stopPropagation();
                      handleAddToCart(p, 1, undefined, { openCheckout: true });
                    }}
                    isAddedJustNow={addedJustNowId === product.id}
                    onShare={(p) => setShareProductModal(p)}
                    onOpenInstallment={(p) => handleOpenInstallment(p)}
                    isCompared={compareProducts.some((item) => item.id === product.id)}
                    onCompare={handleCompareProduct}
                  />
                ))}
              </div>

              {/* Numbered Pagination & Controls for Products Grid */}
              {filteredProducts.length > 0 && (
                <div className="pt-6 pb-2 border-t border-slate-200/80 dark:border-slate-800/80 mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Items summary */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium text-center md:text-left">
                    Hiển thị <span className="font-bold text-slate-900 dark:text-slate-100">{startIndex + 1} - {endIndex}</span> trong tổng số <span className="font-bold text-slate-900 dark:text-slate-100">{filteredProducts.length}</span> sản phẩm
                    {totalProductPages > 1 && (
                      <span className="ml-1.5 text-slate-500 dark:text-slate-400">
                        (Trang <strong className="text-blue-600 dark:text-blue-400">{productsPage}</strong>/{totalProductPages})
                      </span>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  {totalProductPages > 1 && (
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
                      {/* First Page */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(1)}
                        disabled={productsPage === 1}
                        title="Về trang đầu tiên (Trang 1)"
                        className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2642] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#223156] disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>

                      {/* Prev Page */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(productsPage - 1)}
                        disabled={productsPage === 1}
                        title="Trang trước"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2642] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#223156] disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Trước</span>
                      </button>

                      {/* Page Numbers */}
                      {paginationRange.map((item, idx) => {
                        if (item === '...') {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-2 py-1 text-slate-400 dark:text-slate-500 font-bold select-none text-xs"
                            >
                              ...
                            </span>
                          );
                        }

                        const pageNum = item as number;
                        const isActive = pageNum === productsPage;

                        return (
                          <button
                            key={`page-${pageNum}`}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            title={`Đến trang ${pageNum}`}
                            className={`min-w-9 h-9 sm:min-w-10 sm:h-10 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${
                              isActive
                                ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/50 scale-105'
                                : 'bg-white dark:bg-[#1a2642] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#223156] shadow-2xs'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      {/* Next Page */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(productsPage + 1)}
                        disabled={productsPage === totalProductPages}
                        title="Trang tiếp theo"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2642] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#223156] disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                      >
                        <span className="hidden sm:inline">Sau</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Last Page */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(totalProductPages)}
                        disabled={productsPage === totalProductPages}
                        title={`Đến trang cuối cùng (Trang ${totalProductPages})`}
                        className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2642] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#223156] disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Items per page Selector */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="hidden sm:inline">Hiển thị:</span>
                    <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {[12, 24, 36].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            setProductsPerPage(count);
                            setProductsPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            productsPerPage === count
                              ? 'bg-white dark:bg-[#1a2642] text-blue-600 dark:text-blue-400 shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {count}/trang
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* NovaShop Member & Service Hub Banner */}
        <section id="member-service-hub-section" data-scroll-section className="mt-6 sm:mt-8 mb-4 sm:mb-6 bg-gradient-to-r from-slate-900 via-[#131c31] to-indigo-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-700/90 dark:border-cyan-500/40 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/15 dark:border-cyan-400/40 pointer-events-none z-20" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-cyan-500/15 text-cyan-300 font-bold px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs border border-cyan-400/25">
                <PackageCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 shrink-0" />
                <span>HỆ THỐNG MUA SẮM CÔNG NGHỆ CHÍNH HÃNG</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white leading-snug">NovaShop - Trải Nghiệm Mua Sắm & Thanh Toán Hiện Đại</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Cam kết 100% thiết bị công nghệ chính hãng nguyên seal, bảo hành điện tử chính ngạch 12 - 24 tháng. Tận hưởng giao hàng hỏa tốc trong 2 giờ, thanh toán bảo mật VietQR tự động và hỗ trợ kỹ thuật tận tâm 24/7.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-3 w-full md:w-auto shrink-0">
              <button
                id="footer-view-cart-btn"
                onClick={() => setIsCartOpen(true)}
                className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 hover:border-cyan-400/50 font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-cyan-300 shrink-0" />
                <span className="truncate tabular-nums">Giỏ Hàng ({totalCartCount})</span>
              </button>

              <button
                id="footer-open-orders-btn"
                onClick={() => setIsOrdersOpen(true)}
                className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 hover:border-cyan-400/50 font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
              >
                <Truck className="w-4 h-4 text-cyan-300 shrink-0" />
                <span className="truncate">Tra Cứu Đơn</span>
              </button>

              <button
                onClick={() => handleNavigate('policy', 'warranty')}
                className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 hover:border-cyan-400/50 font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0" />
                <span className="truncate">Chính Sách</span>
              </button>

              <button
                onClick={() => handleNavigate('about')}
                className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 hover:border-cyan-400/50 font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-cyan-300 shrink-0" />
                <span className="truncate">Về Chúng Tôi</span>
              </button>
            </div>
          </div>
        </section>
      </>
    )}
  </main>

      {/* Footer */}
      <footer id="site-footer-section" data-scroll-section className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-10 sm:pt-12 pb-24 sm:pb-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand Info */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (currentPage !== 'home') {
                    handleNavigate('home');
                  } else {
                    smoothScrollToTop();
                  }
                }}
                className="inline-flex cursor-pointer"
                title="Cuộn mượt lên đầu trang"
              >
                <Logo size="md" variant="dark" />
              </button>
              <p className="text-slate-400 text-xs leading-relaxed">
                Nền tảng thương mại điện tử công nghệ & thanh toán trực tuyến thế hệ mới. Trải nghiệm mua sắm bảo mật, tiện lợi và hỏa tốc.
              </p>
              <div className="text-[11px] text-slate-400 space-y-1">
                <p>📍 Trụ sở: 219/20 đường số 12, phường Bình Hưng Hòa, thành phố Hồ Chí Minh</p>
                <p>📞 Hotline 24/7: 0908061843</p>
                <p>✉️ Email: support@novashop.vn</p>
              </div>
            </div>

            {/* Col 2: Categories */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Danh Mục Nổi Bật</h4>
              <ul className="space-y-2 text-slate-400">
                {CATEGORIES.slice(1).map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        if (currentPage !== 'home') {
                          handleNavigate('home');
                          setTimeout(() => {
                            smoothScrollToElement('products-grid-section');
                          }, 100);
                        } else {
                          smoothScrollToElement('products-grid-section');
                        }
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Policy & Support */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Chính Sách & Hỗ Trợ</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button
                    onClick={() => handleNavigate('about')}
                    className="text-amber-400 hover:text-amber-300 font-bold transition-colors text-left cursor-pointer flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Giới thiệu về NovaShop</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('faq')}
                    className={`transition-colors text-left cursor-pointer flex items-center gap-1.5 ${
                      currentPage === 'faq' ? 'text-amber-300 font-bold' : 'text-indigo-400 hover:text-indigo-300 font-bold'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Hỏi đáp & Câu hỏi thường gặp (FAQ)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('policy', 'warranty')}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Chính sách bảo hành chính hãng 12-24 tháng
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('policy', 'return')}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Quy trình đổi trả miễn phí 30 ngày 1-1
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('policy', 'security')}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Chính sách bảo mật dữ liệu cá nhân & SSL
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('policy', 'shipping')}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Biểu phí giao hàng hỏa tốc 2 giờ & Đồng kiểm
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('policy', 'payment')}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Hướng dẫn quét mã VietQR & Trả góp 0%
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('policy', 'terms')}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Quy chế hoạt động sàn giao dịch TMĐT
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Payment Gateways */}
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Cổng Thanh Toán Trực Tuyến</h4>
              <p className="text-slate-400 text-xs">Hỗ trợ các phương thức giao dịch hiện đại nhất Việt Nam:</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700 font-mono font-bold text-[11px]">
                  VietQR Napas
                </span>
                <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700 font-bold text-[11px]">
                  VISA / MasterCard
                </span>
                <span className="bg-[#A50064] text-white px-2.5 py-1 rounded-md font-bold text-[11px]">
                  MoMo
                </span>
                <span className="bg-blue-600 text-white px-2.5 py-1 rounded-md font-bold text-[11px]">
                  VNPay-QR
                </span>
              </div>
              <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center gap-2 text-[11px] text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Bảo mật chuẩn quốc tế PCI-DSS Level 1</span>
              </div>
            </div>
          </div>

          {/* Bottom Legal, Policy Links & Ministry of Industry and Trade Certification */}
          <div className="pt-8 border-t border-slate-800/90 space-y-6 text-center text-slate-400">
            {/* Policy Links Row */}
            <div className="flex flex-wrap items-center justify-center gap-y-2 text-[11px] sm:text-xs font-medium tracking-wide uppercase text-slate-300">
              <button
                type="button"
                onClick={() => handleNavigate('policy', 'security')}
                className="px-3 sm:px-6 hover:text-white transition-colors cursor-pointer"
              >
                CHÍNH SÁCH BẢO MẬT
              </button>
              <span className="text-slate-700 select-none">|</span>
              <button
                type="button"
                onClick={() => handleNavigate('policy', 'terms')}
                className="px-3 sm:px-6 hover:text-white transition-colors cursor-pointer"
              >
                QUY CHẾ HOẠT ĐỘNG
              </button>
              <span className="text-slate-700 select-none">|</span>
              <button
                type="button"
                onClick={() => handleNavigate('policy', 'shipping')}
                className="px-3 sm:px-6 hover:text-white transition-colors cursor-pointer"
              >
                CHÍNH SÁCH VẬN CHUYỂN
              </button>
              <span className="text-slate-700 select-none">|</span>
              <button
                type="button"
                onClick={() => handleNavigate('policy', 'return')}
                className="px-3 sm:px-6 hover:text-white transition-colors cursor-pointer"
              >
                CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN
              </button>
            </div>

            {/* Company Name */}
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              Công ty Cổ phần Công nghệ NovaShop Việt Nam
            </p>

            {/* Detailed Registration & Legal Info */}
            <div className="space-y-1.5 text-[11px] sm:text-xs text-slate-400 max-w-4xl mx-auto leading-relaxed">
              <p>
                Địa chỉ: 219/20 đường số 12, Phường Bình Hưng Hòa, Quận Bình Tân, Thành phố Hồ Chí Minh, Việt Nam. Chăm sóc khách hàng: Gọi tổng đài NovaShop{' '}
                <a href="tel:0908061843" className="text-slate-300 hover:text-white underline underline-offset-2">
                  0908061843
                </a>{' '}
                (miễn phí) hoặc Trò chuyện với NovaShop ngay trên trang trung tâm trợ giúp (Email:{' '}
                <a href="mailto:support@novashop.vn" className="text-slate-300 hover:text-white underline underline-offset-2">
                  support@novashop.vn
                </a>
                )
              </p>
              <p>Chịu Trách Nhiệm Quản Lý Nội Dung: Nguyễn Thành Nam</p>
              <p>
                Mã số doanh nghiệp: 0317892341 do Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh cấp lần đầu ngày 15/03/2021
              </p>
              <p className="pt-1 text-slate-500">
                © 2026 - Bản quyền thuộc về Công ty Cổ phần Công nghệ NovaShop Việt Nam
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS */}
      
      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProductModal}
        isOpen={!!selectedProductModal}
        onClose={() => setSelectedProductModal(null)}
        onAddToCart={(p, qty, col) => handleAddToCart(p, qty, col)}
        onBuyNow={(p, qty, col) => handleBuyNow(p, qty, col)}
        isWishlisted={selectedProductModal ? wishlistIds.includes(selectedProductModal.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onShare={(p) => setShareProductModal(p)}
        onOpenInstallment={(p) => handleOpenInstallment(p)}
      />

      {/* Quick View Modal for instant 1-click product preview */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(p, qty, col) => handleAddToCart(p, qty, col)}
        onBuyNow={(p, qty, col) => handleBuyNow(p, qty, col)}
        onOpenFullDetail={(p) => setSelectedProductModal(p)}
        onCompare={handleCompareProduct}
        isCompared={quickViewProduct ? compareProducts.some((item) => item.id === quickViewProduct.id) : false}
        isWishlisted={quickViewProduct ? wishlistIds.includes(quickViewProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onShare={(p) => setShareProductModal(p)}
        onOpenInstallment={(p) => handleOpenInstallment(p)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        appliedVoucher={appliedVoucher}
        onApplyVoucher={setAppliedVoucher}
        onProceedToCheckout={handleProceedToCheckout}
        onOpenInstallment={() => handleOpenInstallment()}
      />

      {/* Installment Calculator & Application Modal (Trả Góp 0%) */}
      <InstallmentModal
        isOpen={isInstallmentOpen}
        onClose={() => setIsInstallmentOpen(false)}
        product={installmentProduct}
        cartItems={cartItems}
        onOrderSuccess={(order) => {
          handleOrderSuccess(order, { fromInstallmentModal: true });
        }}
        onToast={addToast}
        currentUser={currentUser}
        onOpenAuth={() => {
          setIsInstallmentOpen(false);
          setPendingPurchaseState({
            type: 'open_installment',
            product: installmentProduct || cartItems[0]?.product || PRODUCTS[0],
          });
          setAuthMode('login');
          setIsAuthOpen(true);
        }}
      />

      {/* Online Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSearchQuery('');
        }}
        cartItems={cartItems}
        appliedVoucher={appliedVoucher}
        onOrderSuccess={handleOrderSuccess}
        currentUser={currentUser}
        onOpenAuth={() => {
          setIsCheckoutOpen(false);
          setPendingPurchaseState({
            type: 'proceed_to_checkout',
            cartCount: totalCartCount,
          });
          setAuthMode('login');
          setIsAuthOpen(true);
        }}
        onBackToCart={() => {
          setIsCheckoutOpen(false);
          setSearchQuery('');
          setIsCartOpen(true);
        }}
      />

      {/* Order Success & Invoice Modal */}
      <OrderSuccessModal
        order={successOrder}
        isOpen={!!successOrder}
        onClose={() => {
          setSuccessOrder(null);
          setSearchQuery('');
        }}
        onViewOrders={() => setIsOrdersOpen(true)}
      />

      {/* Order Tracking & History Modal */}
      <OrderHistoryModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
        onSelectOrderToView={(ord) => {
          setIsOrdersOpen(false);
          setSuccessOrder(ord);
        }}
        onUpdateOrderStatus={handleUpdateOrderStatus}
      />

      {/* Wishlist Favorites Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistProducts={wishlistProducts}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={(p, e) => handleAddToCart(p, 1)}
        onSelectProduct={(p) => {
          setIsWishlistOpen(false);
          handleOpenProductPage(p);
        }}
        onShare={(p) => setShareProductModal(p)}
      />

      {/* Policy & Services Details Modal */}
      <PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
        initialTab={activePolicyTab}
        onTabChange={(tab) => setActivePolicyTab(tab)}
      />

      {/* About Us Company Profile Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onExploreProducts={() => {
          smoothScrollToElement('products-grid-section');
        }}
      />

      {/* Share Product Modal */}
      <ShareModal
        isOpen={!!shareProductModal}
        product={shareProductModal}
        onClose={() => setShareProductModal(null)}
        onToast={addToast}
      />

      {/* Quick 2-Product Technical Specification Comparison Modal */}
      <ProductComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        compareProducts={compareProducts}
        allProducts={PRODUCTS}
        onSelectSlotProduct={handleSelectCompareSlot}
        onRemoveCompareProduct={handleRemoveCompareProduct}
        onClearCompare={handleClearCompare}
        onSwapProducts={handleSwapCompareProducts}
        onAddToCart={(prod, e) => {
          e.stopPropagation();
          setIsCompareModalOpen(false);
          handleAddToCart(prod, 1, undefined, { openCheckout: true });
        }}
        onViewProductDetail={(prod) => {
          setIsCompareModalOpen(false);
          handleOpenProductPage(prod);
        }}
        onOpenInstallment={(prod) => {
          setIsCompareModalOpen(false);
          handleOpenInstallment(prod);
        }}
      />

      {/* Floating Compare Bar when modal is minimized and products are selected */}
      {!isCompareModalOpen && compareProducts.length > 0 && (
        <FloatingCompareBar
          compareProducts={compareProducts}
          onOpenModal={() => setIsCompareModalOpen(true)}
          onRemoveProduct={handleRemoveCompareProduct}
          onClearAll={handleClearCompare}
        />
      )}

      {/* Promotional Discount Vouchers Pop-up Modal */}
      <PromoModal
        isOpen={isPromoOpen}
        onClose={() => setIsPromoOpen(false)}
        onApplyVoucher={(voucher) => setAppliedVoucher(voucher)}
        appliedVoucher={appliedVoucher}
        onExploreProducts={() => {
          if (currentPage !== 'home') {
            handleNavigate('home');
          }
          setTimeout(() => {
            smoothScrollToElement('products-grid-section');
          }, 150);
        }}
        onToast={addToast}
      />

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAllNotifications={handleClearAllNotifications}
        onNotificationAction={handleNotificationAction}
        onSendTestNotification={handleSendTestNotification}
        soundEnabled={notificationSoundEnabled}
        onToggleSound={() => setNotificationSoundEnabled((prev) => !prev)}
      />

      {/* User Login & Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingPurchaseState(null);
        }}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
        pendingPurchase={pendingPurchase}
      />

      {/* User Profile, Points & Address Management Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenPromo={() => setIsPromoOpen(true)}
        orders={orders}
        wishlistProducts={wishlistProducts}
        cartItems={cartItems}
        appliedVoucher={appliedVoucher}
        onSelectOrderToView={(ord) => setSuccessOrder(ord)}
        onSelectProduct={(prod) => {
          setIsProfileOpen(false);
          handleOpenProductPage(prod);
        }}
        onOpenCart={() => setIsCartOpen(true)}
        initialTab={profileInitialTab === 'password' ? 'edit' : profileInitialTab}
        onOpenGasConfig={() => setIsGasConfigOpen(true)}
      />

      {/* Floating Quick Promo Voucher Button - Draggable to arbitrary position */}
      {isFloatingPromoVisible && (
        <div
          ref={floatingBtnRef}
          id="floating-promo-btn"
          role="button"
          tabIndex={0}
          data-dragging={isFloatingBtnDragging ? 'true' : undefined}
          {...floatingBtnDragProps}
          style={effectivePromoStyle}
          onClick={handleFloatingBtnClick(() => setIsPromoOpen(true))}
          onDoubleClick={resetFloatingBtnPosition}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsPromoOpen(true);
            }
          }}
          className={`fixed ${floatingPromoBottomClass} left-2.5 sm:left-6 z-30 flex items-center gap-1 sm:gap-2 pl-2 sm:pl-3.5 pr-1 sm:pr-2 py-1 sm:py-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-[11px] sm:text-xs select-none transition-all duration-300 ease-out ${
            isFloatingBtnDragging
              ? 'cursor-grabbing shadow-2xl ring-2 ring-white/70 shadow-blue-500/50 opacity-95'
              : 'cursor-grab shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35'
          }`}
          aria-label="Kho voucher ưu đãi"
        >
          <span className="p-1 rounded-full bg-white/20 pointer-events-none">
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </span>
          <span className="hidden sm:inline pointer-events-none">Ưu Đãi Hôm Nay</span>
          <span className="keep-light inline-block px-1.5 py-0.5 rounded-full bg-white text-blue-700 font-extrabold text-[10px] pointer-events-none">
            500K
          </span>
          <button
            id="close-floating-promo-btn"
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsFloatingPromoVisible(false);
            }}
            className="ml-0.5 p-1 rounded-full bg-white/15 hover:bg-white/30 text-white/80 hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Tắt Ưu Đãi Hôm Nay"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Floating Corner / Draggable Light/Dark Mode Quick Toggle Button */}
      <button
        ref={floatingThemeBtnRef}
        id="floating-theme-toggle-btn"
        type="button"
        onClick={handleFloatingThemeBtnClick}
        onDoubleClick={handleResetThemeBtnPosition}
        onPointerDown={handleThemePointerDown}
        onPointerMove={handleThemePointerMove}
        onPointerUp={handleThemePointerUp}
        onPointerCancel={handleThemePointerCancel}
        onMouseEnter={handleFloatingThemeMouseEnter}
        onMouseLeave={handleFloatingThemeMouseLeave}
        aria-expanded={isThemeMenuExpanded}
        aria-label={isDarkMode ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
        title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        style={
          themeBtnPosition
            ? {
                left: `${themeBtnPosition.x}px`,
                top: `${themeBtnPosition.y}px`,
                right: 'auto',
                bottom: 'auto',
                touchAction: 'none',
                transition: isThemeBtnDragging
                  ? 'none'
                  : 'width 400ms cubic-bezier(0.22, 1, 0.36, 1), background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease',
              }
            : { touchAction: 'none' }
        }
        className={`theme-toggle-control fixed z-50 group flex items-center justify-center h-11 sm:h-12 rounded-full border-2 backdrop-blur-xl select-none touch-none overflow-visible ${
          isThemeBtnDragging
            ? 'cursor-grabbing scale-105 shadow-2xl ring-4 ring-indigo-500/40 z-50'
            : 'cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-[width,background-color,border-color,box-shadow,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]'
        } ${
          isThemeMenuExpanded
            ? 'w-[152px] sm:w-[168px]'
            : 'w-11 sm:w-12'
        } ${
          !themeBtnPosition
            ? `right-3 sm:right-5 ${isPartnerAdVisible ? 'bottom-[70px] sm:bottom-[154px]' : 'bottom-4 sm:bottom-5'}`
            : ''
        } ${
          isDarkMode
            ? 'bg-slate-800/95 hover:bg-slate-800 text-amber-300 border-amber-400/85 hover:border-amber-300/90 ring-1 ring-amber-400/30 hover:ring-2 hover:ring-amber-300/30 drop-shadow-[0_4px_12px_rgba(251,191,36,0.28)] hover:drop-shadow-[0_6px_16px_rgba(251,191,36,0.38)] shadow-[0_0_14px_rgba(251,191,36,0.28),0_6px_18px_rgba(0,0,0,0.75)] hover:shadow-[0_0_18px_rgba(251,191,36,0.38),0_8px_22px_rgba(0,0,0,0.85)]'
            : 'bg-slate-900/95 hover:bg-slate-800 text-slate-100 border-slate-700/90 hover:border-indigo-400/75 ring-1 ring-slate-900/15 hover:ring-2 hover:ring-slate-800/20 drop-shadow-[0_4px_10px_rgba(15,23,42,0.2)] hover:drop-shadow-[0_6px_14px_rgba(15,23,42,0.28)] shadow-[0_4px_12px_rgba(15,23,42,0.24),0_1px_4px_rgba(2,6,23,0.16)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.32)]'
        }`}
      >
        {/* Reset position button when moved from default position */}
        {themeBtnPosition && !isThemeBtnDragging && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleResetThemeBtnPosition}
            onPointerDown={(e) => e.stopPropagation()}
            title="Nhấp để đặt lại về góc mặc định"
            className="absolute -top-1.5 -left-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center w-4 h-4 rounded-full bg-slate-700 hover:bg-rose-600 text-slate-200 hover:text-white shadow-xs cursor-pointer z-30 ring-1 ring-slate-500/50"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </span>
        )}

        {/* Collapsed Single Icon State — Both Sun & Moon stay mounted and morph smoothly */}
        <span
          className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isThemeMenuExpanded
              ? 'opacity-0 scale-75 pointer-events-none'
              : 'opacity-100 scale-100'
          }`}
        >
          <span
            className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-[background-color,box-shadow,transform] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isDarkMode
                ? 'bg-amber-400/20 group-hover:bg-amber-400/30 text-amber-300 ring-1 ring-amber-300/35 group-hover:ring-amber-300/50 group-hover:shadow-[0_0_8px_rgba(251,191,36,0.22)]'
                : 'bg-slate-800 group-hover:bg-slate-700/90 text-indigo-300 ring-1 ring-slate-600/75 group-hover:ring-indigo-400/45 shadow-[inset_0_1px_1px_rgba(0,0,0,0.3),0_1px_3px_rgba(2,6,23,0.25)] group-hover:shadow-[0_0_6px_rgba(15,23,42,0.35)]'
            }`}
          >
            <span
              data-mode={isDarkMode ? 'dark' : 'light'}
              className="theme-icon-stage w-4 h-4 sm:w-[18px] sm:h-[18px]"
            >
              <Sun className="theme-icon-sun text-amber-300 drop-shadow-[0_0_4px_rgba(251,191,36,0.45)]" />
              <Moon className="theme-icon-moon text-indigo-300 group-hover:text-indigo-200 drop-shadow-[0_1px_2px_rgba(2,6,23,0.45)]" />
            </span>
          </span>
        </span>

        {/* Expanded Horizontal 'Sáng' / 'Tối' Segmented Track with Smooth Sliding Pill Thumb */}
        <span
          className={`relative grid grid-cols-2 items-center w-[140px] sm:w-[156px] h-8 sm:h-9 p-0.5 rounded-full shrink-0 transition-[opacity,transform] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isThemeMenuExpanded
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-90 pointer-events-none'
          }`}
        >
          {/* GPU-Accelerated Sliding Active Indicator Pill */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full transition-[transform,background-color,box-shadow] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
              isDarkMode
                ? 'translate-x-full bg-amber-400/25 ring-1 ring-amber-300/60 shadow-[0_0_8px_rgba(251,191,36,0.22)]'
                : 'translate-x-0 bg-slate-800 ring-1 ring-slate-600/90 shadow-[0_1px_4px_rgba(2,6,23,0.28)]'
            }`}
          />

          <span
            onClick={(e) => handleSelectFloatingThemeMode(false, e)}
            className={`relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 h-full rounded-full text-[11px] sm:text-xs font-bold tracking-tight transition-colors duration-300 ${
              !isDarkMode
                ? 'text-slate-100'
                : 'text-slate-300 hover:text-amber-200'
            }`}
          >
            <Sun
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-[transform,opacity,color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                !isDarkMode
                  ? 'text-amber-400 scale-105 rotate-0 drop-shadow-[0_1px_2px_rgba(2,6,23,0.4)]'
                  : 'text-amber-300/75 scale-90 -rotate-45'
              }`}
            />
            <span>Sáng</span>
          </span>

          <span
            onClick={(e) => handleSelectFloatingThemeMode(true, e)}
            className={`relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 h-full rounded-full text-[11px] sm:text-xs font-bold tracking-tight transition-colors duration-300 ${
              isDarkMode
                ? 'text-amber-300'
                : 'text-slate-300 hover:text-indigo-200'
            }`}
          >
            <Moon
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-[transform,opacity,color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isDarkMode
                  ? 'text-amber-300 scale-105 rotate-0 drop-shadow-[0_0_4px_rgba(251,191,36,0.35)]'
                  : 'text-indigo-300/80 scale-90 rotate-45 drop-shadow-[0_1px_2px_rgba(2,6,23,0.45)]'
              }`}
            />
            <span>Tối</span>
          </span>
        </span>
      </button>

      {/* Compact Floating Horizontal Partner Ad at Bottom-Right Corner */}
      <PartnerAdBanner onCloseChange={(closed) => setIsPartnerAdVisible(!closed)} />

      {/* Customer Support AI Chatbot Widget */}
      <CustomerSupportChatbot
        isOpen={isChatbotOpen}
        onToggleOpen={setIsChatbotOpen}
        isPromoVisible={isFloatingPromoVisible}
        isPartnerAdVisible={isPartnerAdVisible}
        products={PRODUCTS}
        cartItems={cartItems}
        orders={orders}
        appliedVoucher={appliedVoucher}
        currentUser={currentUser}
        onSelectProduct={(prod) => {
          setIsChatbotOpen(false);
          handleOpenProductPage(prod);
        }}
        onOpenPromo={() => setIsPromoOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenPolicy={(tab: PolicyTabId = 'warranty') => handleOpenPolicy(tab)}
        onOpenInstallment={(prod) => handleOpenInstallment(prod)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Google Apps Script Email Configuration Modal */}
      <GoogleAppsScriptConfigModal
        isOpen={isGasConfigOpen}
        onClose={() => setIsGasConfigOpen(false)}
        currentUser={currentUser}
        onSendSuccessToast={(msg) => addToast('success', 'Google Apps Script', msg)}
      />

      {/* Interactive Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}
