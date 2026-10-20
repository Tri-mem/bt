import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  X, 
  Package, 
  Heart, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Sparkles,
  Star,
  ArrowRight,
  TrendingUp,
  Plus,
  Building2,
  Briefcase,
  Gift,
  CalendarClock,
  HelpCircle,
  Bell,
  Mail,
  User,
  LogIn,
  LogOut,
  ChevronDown,
  Award,
  Sun,
  Moon,
  Headphones,
  Mic,
  MicOff,
} from 'lucide-react';
import { CATEGORIES, formatVND } from '../data/mockData';
import { PolicyTabId } from './PolicyModal';
import { Product, UserProfile } from '../types';
import { Logo } from './Logo';
import { smoothScrollToElement, smoothScrollToTop } from '../utils/smoothScroll';
import {
  SmartKeywordSuggestion,
  parseSmartSearchQuery,
  scoreProductMatch,
  generateSmartKeywordSuggestions,
} from '../utils/smartSearch';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  orderCount: number;
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenWishlist: () => void;
  onOpenPolicy?: (tab: PolicyTabId) => void;
  onOpenAbout?: () => void;
  onOpenPromo?: () => void;
  onOpenInstallment?: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  currentPage?: 'home' | 'about' | 'policy' | 'faq' | 'profile' | 'checkout' | 'product';
  onNavigate?: (page: 'home' | 'about' | 'policy' | 'faq' | 'profile' | 'checkout' | 'product', tab?: any) => void;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onOpenProfile?: (tab?: 'overview' | 'edit' | 'orders' | 'wishlist') => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenChatbot?: () => void;
  isVoiceListening?: boolean;
  voiceInterimText?: string;
  onToggleVoiceSearch?: () => void;
  smartSuggestions?: SmartKeywordSuggestion[];
  onOpenGasConfig?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  wishlistCount,
  orderCount,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenOrders,
  onOpenWishlist,
  onOpenPolicy,
  onOpenAbout,
  onOpenPromo,
  onOpenInstallment,
  notificationCount = 0,
  onOpenNotifications,
  currentPage = 'home',
  onNavigate,
  products = [],
  onSelectProduct,
  onAddToCart,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenChatbot,
  isVoiceListening = false,
  voiceInterimText = '',
  onToggleVoiceSearch,
  smartSuggestions,
  onOpenGasConfig,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);

  // Track page scroll for dynamic glassmorphism blur and transparency effect
  useEffect(() => {
    let rafId: number | null = null;

    const updateScrollState = () => {
      const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const scrolled = y > 14;
      const ratio = Math.min(1, Math.max(0, (y - 8) / 140));
      setIsScrolled(scrolled);
      setScrollRatio(Number(ratio.toFixed(2)));
      rafId = null;
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateScrollState);
      }
    };

    updateScrollState();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Close search and user dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setIsSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsSearchFocused(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Keep search dropdown open when voice recognition starts
  useEffect(() => {
    if (isVoiceListening) {
      setIsSearchFocused(true);
      setIsSearchOpen(true);
    }
  }, [isVoiceListening]);

  // Filter matching products live using smart diacritic-insensitive & conversational intent engine
  const matchingProducts = useMemo(() => {
    const q = searchQuery.trim();
    if (!q || !products.length) return [];
    const intent = parseSmartSearchQuery(q);
    return products
      .map((prod) => ({
        prod,
        score: scoreProductMatch(prod, intent),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.prod);
  }, [searchQuery, products]);

  // Smart keyword suggestions while typing
  const activeSmartSuggestions = useMemo(() => {
    if (smartSuggestions && smartSuggestions.length > 0) {
      return smartSuggestions;
    }
    return generateSmartKeywordSuggestions(searchQuery, products, 6);
  }, [smartSuggestions, searchQuery, products]);

  // Progressive opacity & blur based on scroll depth
  const headerGlassStyle = useMemo<React.CSSProperties>(() => {
    if (!isScrolled) return {};
    const lightOpacity = (0.84 - scrollRatio * 0.16).toFixed(2); // 0.84 -> 0.68
    const darkOpacity = (0.86 - scrollRatio * 0.14).toFixed(2);  // 0.86 -> 0.72
    const blurPx = `${Math.round(12 + scrollRatio * 10)}px`;      // 12px -> 22px
    return {
      '--header-bg-opacity': lightOpacity,
      '--header-bg-opacity-dark': darkOpacity,
      '--header-blur': blurPx,
    } as React.CSSProperties;
  }, [isScrolled, scrollRatio]);

  return (
    <header
      id="site-header"
      data-scrolled={isScrolled ? 'true' : 'false'}
      style={headerGlassStyle}
      className={`sticky top-0 z-40 ${
        isScrolled ? 'header-is-scrolled' : 'header-at-top'
      }`}
    >
      {/* Balanced Multi-Color Brand Top Accent Strip */}
      <div
        className={`w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 transition-all duration-300 ${
          isScrolled ? 'h-[2px] opacity-90' : 'h-[2.5px] opacity-100'
        }`}
      />
      {/* Main Header */}
      <div
        className={`max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 transition-all duration-300 ${
          isScrolled ? 'py-1.5 sm:py-2.5' : 'py-2 sm:py-3.5'
        }`}
      >
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-y-2 gap-x-1 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="order-1 flex items-center shrink-0">
            <a 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                if (onNavigate) onNavigate('home');
                onSelectCategory('all'); 
                onSearchChange(''); 
                smoothScrollToTop();
              }}
              className="flex items-center gap-2 group cursor-pointer"
              id="brand-logo-link"
            >
              <span className="sm:hidden">
                <Logo size="sm" />
              </span>
              <span className="hidden sm:inline-flex">
                <Logo size="md" />
              </span>
            </a>
          </div>

          {/* Search Input Bar with Live Interactive Dropdown (Full-width row 2 on mobile, centered row 1 on desktop) */}
          <div ref={searchContainerRef} className="order-3 md:order-2 w-full md:w-auto md:flex-1 max-w-none md:max-w-xl md:mx-2 lg:mx-4 relative">
            <div className={`header-search-shell relative flex items-center rounded-xl border transition-all duration-200 ${
              isVoiceListening
                ? 'header-search-focused border-rose-500 ring-2 ring-rose-500/25 bg-white shadow-sm'
                : isSearchFocused 
                ? 'header-search-focused border-indigo-600 ring-2 ring-indigo-500/20 bg-white shadow-sm' 
                : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 hover:border-slate-300'
            }`}>
              <Search className={`w-4 h-4 ml-3 sm:ml-3.5 shrink-0 ${isVoiceListening ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
              <input
                id="search-input"
                name="novashop-product-search"
                type="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                readOnly={!isSearchFocused}
                value={isVoiceListening && voiceInterimText ? voiceInterimText : searchQuery}
                onMouseDown={() => setIsSearchFocused(true)}
                onTouchStart={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  if (document.activeElement !== e.currentTarget) return;
                  onSearchChange(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setIsSearchOpen(true);
                }}
                placeholder={
                  isVoiceListening
                    ? 'Đang nghe... Hãy nói tên sản phẩm (VD: "Samsung dưới 10 triệu")'
                    : 'Tìm kiếm sản phẩm hoặc bấm micro nói giọng nói...'
                }
                className="w-full py-2 sm:py-2.5 px-2.5 sm:px-3 bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setIsSearchOpen(false);
                  }}
                  className="p-1 mr-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {onToggleVoiceSearch && (
                <button
                  id="voice-search-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSearchFocused(true);
                    setIsSearchOpen(true);
                    onToggleVoiceSearch();
                  }}
                  className={`relative mr-1.5 sm:mr-2 p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    isVoiceListening
                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/50 animate-pulse'
                      : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                  title={
                    isVoiceListening
                      ? 'Đang nhận diện giọng nói... Bấm để dừng'
                      : 'Tìm kiếm bằng giọng nói Tiếng Việt (Web Speech API)'
                  }
                  aria-label="Tìm kiếm bằng giọng nói"
                >
                  {isVoiceListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline text-[10px] font-extrabold pr-0.5">Đang nghe</span>
                    </>
                  ) : (
                    <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Live Search Autocomplete Dropdown */}
            {isSearchOpen && (
              <div 
                id="search-live-dropdown"
                className="absolute top-full left-0 right-0 mt-1.5 sm:mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* Live Web Speech API Voice Listening Status Panel */}
                {isVoiceListening && (
                  <div className="p-3 sm:p-3.5 bg-rose-50/90 border-b border-rose-200/80 flex items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-xs">
                        <Mic className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-rose-900 flex items-center gap-1.5">
                          <span>Đang lắng nghe giọng nói (Tiếng Việt)...</span>
                        </div>
                        <p className="text-[11px] text-rose-700 truncate">
                          {voiceInterimText
                            ? `Nhận diện: "${voiceInterimText}"`
                            : 'Hãy nói ví dụ: "Điện thoại Samsung", "Tai nghe chống ồn", "Sạc dự phòng 145W", "Dưới 5 triệu"...'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleVoiceSearch?.()}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
                    >
                      Dừng nghe
                    </button>
                  </div>
                )}

                {searchQuery.trim().length > 0 ? (
                  <>
                    {/* Smart Keyword Suggestions while user is typing */}
                    {activeSmartSuggestions.length > 0 && (
                      <div className="p-2.5 sm:p-3 bg-indigo-50/45 border-b border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Gợi ý từ khóa thông minh</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Bấm để lọc nhanh</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {activeSmartSuggestions.slice(0, 6).map((sug) => (
                            <button
                              key={sug.keyword}
                              type="button"
                              onClick={() => {
                                onSearchChange(sug.keyword);
                                if (onNavigate && currentPage !== 'home') {
                                  onNavigate('home');
                                  setTimeout(() => smoothScrollToElement('products-grid-section'), 80);
                                } else {
                                  smoothScrollToElement('products-grid-section');
                                }
                              }}
                              className="px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border border-indigo-200/80 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
                            >
                              <Search className="w-3 h-3 text-indigo-500 group-hover:text-white shrink-0" />
                              <span>{sug.keyword}</span>
                              <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 group-hover:bg-white/20 text-indigo-700 group-hover:text-white text-[9px] font-bold">
                                {sug.matchCount} SP
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-2.5 sm:p-3 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Sản phẩm phù hợp ({matchingProducts.length})</span>
                      {matchingProducts.length > 0 && (
                        <span className="text-[11px] text-indigo-600 font-semibold">Chọn xem chi tiết</span>
                      )}
                    </div>

                    {matchingProducts.length > 0 ? (
                      <div className="max-h-[55vh] sm:max-h-[350px] overflow-y-auto divide-y divide-slate-100">
                        {matchingProducts.slice(0, 6).map((prod) => (
                          <div
                            key={prod.id}
                            className="p-2.5 sm:p-3 hover:bg-indigo-50/40 flex items-center gap-2.5 sm:gap-3 transition-colors cursor-pointer group"
                            onClick={() => {
                              if (onNavigate) onNavigate('home');
                              onSelectProduct?.(prod);
                              setIsSearchOpen(false);
                            }}
                          >
                            <img
                              src={prod.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80'}
                              alt={prod.name}
                              width={48}
                              height={48}
                              loading="lazy"
                              decoding="async"
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-contain p-1 bg-white border border-slate-100 shrink-0 group-hover:scale-105 transition-transform"
                              style={{ objectFit: 'contain' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                  {prod.categoryName}
                                </span>
                                {prod.badge && (
                                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                    {prod.badge}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                                {prod.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs sm:text-sm font-extrabold text-indigo-600">
                                  {formatVND(prod.price)}
                                </span>
                                {prod.originalPrice && prod.originalPrice > prod.price && (
                                  <span className="text-[11px] text-slate-400 line-through">
                                    {formatVND(prod.originalPrice)}
                                  </span>
                                )}
                                <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-0.5 ml-auto">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {prod.rating}
                                </span>
                              </div>
                            </div>

                            {onAddToCart && (
                              <button
                                type="button"
                                title="Thêm nhanh vào giỏ"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart(prod);
                                }}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white transition-all shrink-0 cursor-pointer shadow-2xs"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}

                        {matchingProducts.length > 6 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigate && currentPage !== 'home') {
                                onNavigate('home');
                                setTimeout(() => smoothScrollToElement('products-grid-section'), 80);
                              } else {
                                smoothScrollToElement('products-grid-section');
                              }
                              setIsSearchOpen(false);
                            }}
                            className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Xem tất cả {matchingProducts.length} sản phẩm phù hợp</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-5 sm:p-6 text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <Search className="w-5 h-5" />
                        </div>
                        <p className="text-xs text-slate-600">
                          Không tìm thấy sản phẩm nào khớp với từ khóa <strong className="text-indigo-600">"{searchQuery}"</strong>
                        </p>
                        <div className="text-[11px] text-slate-400 font-medium pt-1">Gợi ý từ khóa thông minh:</div>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {['Giá trung bình', 'Dưới 2 triệu', 'Galaxy S24 Ultra', 'Redmi Note 13', 'iPad Gen 10', 'Sạc dự phòng 145W', 'Tai nghe chống ồn Sony', 'Loa Bluetooth Marshall'].map((kw) => (
                            <button
                              key={kw}
                              type="button"
                              onClick={() => {
                                onSearchChange(kw);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Gợi ý từ khóa thông minh & Tìm kiếm phổ biến</span>
                      </div>
                      {onToggleVoiceSearch && (
                        <button
                          type="button"
                          onClick={() => onToggleVoiceSearch()}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Mic className="w-3 h-3" />
                          <span>Tìm bằng giọng nói</span>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeSmartSuggestions.map((sug) => (
                        <button
                          key={sug.keyword}
                          type="button"
                          onClick={() => {
                            onSearchChange(sug.keyword);
                            setIsSearchOpen(false);
                            if (onNavigate && currentPage !== 'home') {
                              onNavigate('home');
                              setTimeout(() => smoothScrollToElement('products-grid-section'), 80);
                            } else {
                              smoothScrollToElement('products-grid-section');
                            }
                          }}
                          className="px-2.5 py-1.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-[11px] sm:text-xs font-semibold border border-transparent transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>{sug.keyword}</span>
                          <span className="text-[10px] text-slate-400">({sug.matchCount})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User actions */}
          <div className="order-2 md:order-3 flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Dark Mode Toggle button */}
            {onToggleDarkMode && (
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={onToggleDarkMode}
                className={`theme-toggle-control group relative flex items-center justify-center p-1.5 sm:p-2.5 rounded-xl border transition-[background-color,border-color,box-shadow,transform] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 cursor-pointer overflow-hidden ${
                  isDarkMode
                    ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700/90 hover:border-amber-400/50 shadow-2xs'
                    : 'bg-slate-900 text-indigo-200 border-slate-700 hover:bg-slate-800 hover:border-indigo-400/60 shadow-[0_2px_6px_rgba(15,23,42,0.16)]'
                }`}
                aria-label={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                title={isDarkMode ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
              >
                {/* Smooth ambient radial highlight crossfade */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 rounded-xl bg-amber-400/10 transition-opacity duration-400 ease-out ${
                    isDarkMode ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 rounded-xl bg-indigo-400/10 transition-opacity duration-400 ease-out ${
                    !isDarkMode ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                <span
                  data-mode={isDarkMode ? 'dark' : 'light'}
                  className="theme-icon-stage w-4 h-4 sm:w-5 sm:h-5"
                >
                  <Sun className="theme-icon-sun text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.35)]" />
                  <Moon className="theme-icon-moon text-indigo-300 group-hover:text-indigo-200 drop-shadow-[0_1px_2px_rgba(2,6,23,0.4)]" />
                </span>
              </button>
            )}

            {/* Chatbot Support button - matches theme toggle aesthetic, collapses to icon only, reveals details on hover */}
            {onOpenChatbot && (
              <div className="relative group/headchat">
                <button
                  id="header-chatbot-btn"
                  type="button"
                  onClick={onOpenChatbot}
                  className={`group relative flex items-center justify-center p-1.5 sm:p-2.5 rounded-xl border transition-[background-color,border-color,box-shadow,transform] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 cursor-pointer overflow-hidden ${
                    isDarkMode
                      ? 'bg-slate-800 text-blue-400 border-slate-700 hover:bg-slate-700/90 hover:border-blue-400/50 shadow-2xs'
                      : 'bg-slate-900 text-blue-300 border-slate-700 hover:bg-slate-800 hover:border-blue-400/60 shadow-[0_2px_6px_rgba(15,23,42,0.16)]'
                  }`}
                  aria-label="CSKH NovaCare - Hỗ trợ AI 24/7"
                  title="CSKH NovaCare - Hỗ trợ AI 24/7"
                >
                  {/* Smooth ambient radial highlight */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl bg-blue-500/15 group-hover:bg-blue-500/25 transition-opacity duration-300 ease-out"
                  />
                  <span className="relative w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_3px_rgba(59,130,246,0.4)]" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 ring-1 sm:ring-2 ring-slate-900 animate-pulse" />
                  </span>
                </button>

                {/* Hover detail popup - only visible on hover */}
                <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 min-w-[210px] rounded-xl bg-slate-900/95 text-white p-2.5 text-xs shadow-xl border border-slate-700/80 backdrop-blur-md opacity-0 translate-y-1 scale-95 group-hover/headchat:opacity-100 group-hover/headchat:translate-y-0 group-hover/headchat:scale-100 transition-all duration-200 ease-out">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white text-[12px]">CSKH NovaCare</span>
                    <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">24/7</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Tư vấn trực tuyến 24/7. Hỗ trợ đơn hàng, khuyến mãi, trả góp & kỹ thuật sản phẩm.
                  </p>
                </div>
              </div>
            )}

            {/* Promo Vouchers button */}
            <button
              id="header-promo-vouchers-btn"
              onClick={onOpenPromo}
              className={`relative p-1.5 sm:p-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                isDarkMode
                  ? 'text-slate-300 hover:text-blue-400 hover:bg-slate-800/90'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/80'
              }`}
              title="Kho mã giảm giá & voucher ưu đãi"
            >
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-blue-600 text-white text-[9px] sm:text-[10px] font-extrabold tabular-nums rounded-full flex items-center justify-center px-1 shadow-xs">
                4
              </span>
            </button>

            {/* Notifications button */}
            <button
              id="notifications-btn"
              onClick={onOpenNotifications}
              className={`relative p-1.5 sm:p-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                isDarkMode
                  ? 'text-slate-300 hover:text-blue-400 hover:bg-slate-800/90'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/80'
              }`}
              title="Trung tâm thông báo & ưu đãi hệ thống"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-blue-600 text-white text-[9px] sm:text-[10px] font-extrabold tabular-nums rounded-full flex items-center justify-center px-1 shadow-xs">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {/* Wishlist */}
            <button
              id="wishlist-btn"
              onClick={onOpenWishlist}
              className={`relative p-1.5 sm:p-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                isDarkMode
                  ? 'text-slate-300 hover:text-blue-400 hover:bg-slate-800/90'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/80'
              }`}
              title="Danh sách yêu thích"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-blue-600 text-white text-[9px] sm:text-[10px] font-extrabold tabular-nums rounded-full flex items-center justify-center px-1 shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Orders history */}
            <button
              id="orders-history-btn"
              onClick={onOpenOrders}
              className={`relative flex items-center gap-1.5 p-1.5 sm:py-2 sm:px-3 rounded-xl transition-all duration-150 border text-xs sm:text-sm font-semibold cursor-pointer ${
                isDarkMode
                  ? 'text-slate-200 border-slate-700/80 hover:text-blue-400 hover:bg-slate-800/90 hover:border-slate-600'
                  : 'text-slate-700 border-slate-200/80 hover:text-blue-600 hover:bg-blue-50/80 hover:border-blue-200'
              }`}
              title="Đơn hàng của tôi"
            >
              <Package className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className="hidden lg:inline">Đơn hàng</span>
              {orderCount > 0 && (
                <span
                  className={`text-[9px] sm:text-[10px] font-bold tabular-nums px-1 sm:px-1.5 py-0.2 rounded-full border ${
                    isDarkMode
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : 'bg-blue-50 text-blue-600 border-blue-200/80'
                  }`}
                >
                  {orderCount}
                </span>
              )}
            </button>

            {/* User Account / Profile Dropdown or Login Button */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  id="header-user-btn"
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-1 sm:gap-1.5 py-1 sm:py-1.5 px-1.5 sm:px-2.5 rounded-xl transition-all duration-150 border text-xs sm:text-sm font-semibold cursor-pointer select-none ${
                    isDarkMode
                      ? isUserMenuOpen
                        ? 'bg-slate-800 text-slate-100 border-blue-500/50 shadow-xs'
                        : 'bg-slate-900/60 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:text-white hover:border-slate-600'
                      : isUserMenuOpen
                        ? 'bg-blue-50/90 text-blue-700 border-blue-300/90 shadow-xs'
                        : 'text-slate-700 border-slate-200/80 hover:text-blue-600 hover:bg-blue-50/80 hover:border-blue-200'
                  }`}
                  title={`Tài khoản của tôi: ${currentUser.fullName}`}
                >
                  {currentUser.avatar?.trim() ? (
                    <img
                      src={currentUser.avatar.trim()}
                      alt={currentUser.fullName}
                      width={24}
                      height={24}
                      referrerPolicy="no-referrer"
                      className={`w-6 h-6 rounded-full object-cover shrink-0 shadow-2xs border ${
                        isDarkMode ? 'border-slate-600' : 'border-blue-200'
                      }`}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                      {currentUser.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`hidden sm:inline max-w-[90px] truncate font-bold ${
                      isDarkMode ? 'text-slate-100' : 'text-slate-800'
                    }`}
                  >
                    {currentUser.fullName.split(' ').slice(-1)[0]}
                  </span>
                  <span
                    className={`hidden lg:inline px-1.5 py-0.2 rounded-full font-extrabold text-[9px] uppercase tracking-wider border ${
                      isDarkMode
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/35'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {currentUser.memberTier}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-400'
                    } ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-60 rounded-2xl shadow-xl border p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700/80 shadow-black/50'
                        : 'bg-white border-slate-100'
                    }`}
                  >
                    <div
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile?.('overview');
                      }}
                      className={`p-2.5 rounded-xl mb-1.5 border cursor-pointer transition-colors ${
                        isDarkMode
                          ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80'
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50/50 hover:from-blue-100/70 hover:to-indigo-100/60 border-blue-100/60'
                      }`}
                      title="Tài khoản của tôi"
                    >
                      <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <div
                        className={`flex items-center justify-between mt-1 pt-1 border-t text-[10px] ${
                          isDarkMode ? 'border-slate-700/80' : 'border-blue-200/40'
                        }`}
                      >
                        <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                          VIP {currentUser.memberTier}
                        </span>
                        <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                          {currentUser.novaPoints.toLocaleString('vi-VN')} pts
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile?.('overview');
                      }}
                      className={`group w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'text-slate-200 hover:text-blue-400 hover:bg-slate-800/90'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/80'
                      }`}
                    >
                      <User
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600'
                        }`}
                      />
                      <span>Tài khoản của tôi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenOrders();
                      }}
                      className={`group w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'text-slate-200 hover:text-blue-400 hover:bg-slate-800/90'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/80'
                      }`}
                    >
                      <Package
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600'
                        }`}
                      />
                      <span>Đơn hàng của tôi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenPromo?.();
                      }}
                      className={`group w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'text-slate-200 hover:text-blue-400 hover:bg-slate-800/90'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/80'
                      }`}
                    >
                      <Gift
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600'
                        }`}
                      />
                      <span>Kho Voucher ưu đãi</span>
                    </button>

                    {onOpenGasConfig && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenGasConfig();
                        }}
                        className={`group w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          isDarkMode
                            ? 'text-slate-200 hover:text-blue-400 hover:bg-slate-800/90'
                            : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/80'
                        }`}
                        title="Cấu hình Google Apps Script gửi email chào mừng"
                      >
                        <span className="flex items-center gap-2.5">
                          <Mail
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600'
                            }`}
                          />
                          <span>Cấu hình Email Chào Mừng (GAS)</span>
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                            isDarkMode
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : 'bg-blue-50 text-blue-600 border-blue-200/80'
                          }`}
                        >
                          Webhook
                        </span>
                      </button>
                    )}

                    {onToggleDarkMode && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleDarkMode();
                        }}
                        className={`group w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          isDarkMode
                            ? 'text-slate-200 hover:text-blue-400 hover:bg-slate-800/90'
                            : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/80'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="relative w-4 h-4 flex items-center justify-center shrink-0">
                            <Sun
                              className={`absolute inset-0 w-4 h-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                isDarkMode
                                  ? 'text-blue-400 group-hover:text-blue-300 opacity-100 scale-100 rotate-0'
                                  : 'text-blue-600 opacity-0 scale-50 -rotate-90 pointer-events-none'
                              }`}
                            />
                            <Moon
                              className={`absolute inset-0 w-4 h-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                !isDarkMode
                                  ? 'text-blue-600 opacity-100 scale-100 rotate-0'
                                  : 'text-blue-400 opacity-0 scale-50 rotate-90 pointer-events-none'
                              }`}
                            />
                          </span>
                          <span>Giao diện: {isDarkMode ? 'Chế độ Tối' : 'Chế độ Sáng'}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                            isDarkMode
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : 'bg-blue-50 text-blue-600 border-blue-200/80'
                          }`}
                        >
                          Đổi
                        </span>
                      </button>
                    )}

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout?.();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="header-login-btn"
                type="button"
                onClick={() => onOpenAuth?.('login')}
                className="flex items-center gap-1 sm:gap-1.5 py-1.5 px-2 sm:py-2 sm:px-3 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all duration-150 border border-slate-200/80 text-xs sm:text-sm font-bold cursor-pointer shrink-0"
                title="Đăng nhập / Đăng ký tài khoản"
              >
                <LogIn className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="hidden min-[390px]:inline text-[11px] sm:text-sm">Đăng nhập</span>
              </button>
            )}

            {/* Shopping Cart button */}
            <button
              id="cart-drawer-trigger"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 py-1.5 px-2.5 sm:py-2 sm:px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-xs transition-all duration-150 text-xs sm:text-sm cursor-pointer"
              title="Giỏ hàng"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-amber-400 text-slate-950 font-extrabold text-[9px] sm:text-[10px] tabular-nums rounded-full flex items-center justify-center px-1 shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Giỏ hàng</span>
            </button>
          </div>

        </div>
      </div>

      {/* Category Pills Bar */}
      <div
        className={`overflow-x-auto scrollbar-none ${
          isScrolled ? 'header-cat-bar-scrolled' : 'header-cat-bar-top'
        }`}
      >
        <div
          className={`max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 flex items-center lg:flex-wrap gap-1.5 sm:gap-2 transition-all duration-300 ${
            isScrolled ? 'py-1 sm:py-1.5' : 'py-1.5 sm:py-2'
          }`}
        >
          {CATEGORIES.map((category) => {
            const isSelected = currentPage === 'home' && selectedCategory === category.id;
            return (
              <button
                key={category.id}
                id={`cat-filter-${category.id}`}
                onClick={() => {
                  onSelectCategory(category.id);
                  if (currentPage !== 'home') {
                    if (onNavigate) onNavigate('home');
                    setTimeout(() => {
                      smoothScrollToElement('products-grid-section');
                    }, 80);
                  } else {
                    smoothScrollToElement('products-grid-section');
                  }
                }}
                className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-150 shrink-0 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border border-blue-500 shadow-2xs'
                    : 'header-cat-pill-idle bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 border border-slate-200/90'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
