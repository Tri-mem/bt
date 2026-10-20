/**
 * Smooth Scrolling Utility for NovaShop
 * Provides hardware-accelerated cubic-bezier smooth scrolling between sections
 * with automatic sticky header offset compensation and reduced-motion support.
 */

let activeScrollAnimationId: number | null = null;

function cancelActiveScroll() {
  if (activeScrollAnimationId !== null) {
    window.cancelAnimationFrame(activeScrollAnimationId);
    activeScrollAnimationId = null;
  }
}

// EaseInOutCubic for natural acceleration and gentle deceleration
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getStickyHeaderOffset(extraMargin = 16): number {
  if (typeof document === 'undefined') return 112 + extraMargin;
  const headerEl = document.getElementById('site-header');
  if (headerEl) {
    return Math.round(headerEl.getBoundingClientRect().height + extraMargin);
  }
  return 112 + extraMargin;
}

export interface SmoothScrollOptions {
  offset?: number;
  duration?: number;
  highlight?: boolean;
}

/**
 * Smoothly scrolls the window to a specific vertical pixel position.
 */
export function smoothScrollToY(targetY: number, duration = 620): void {
  if (typeof window === 'undefined') return;

  cancelActiveScroll();

  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
  const clampedTargetY = Math.min(Math.max(0, targetY), maxScroll);

  if (prefersReducedMotion() || duration <= 0) {
    window.scrollTo({ top: clampedTargetY, behavior: 'auto' });
    return;
  }

  const startY = window.scrollY || document.documentElement.scrollTop || 0;
  const distance = clampedTargetY - startY;

  if (Math.abs(distance) < 4) {
    return;
  }

  // Scale duration slightly by distance so short hops are snappy and long scrolls are silky
  const adaptiveDuration = Math.min(
    800,
    Math.max(360, Math.round(duration * (0.65 + Math.min(1, Math.abs(distance) / 1400) * 0.55)))
  );

  let startTime: number | null = null;

  const stopOnUserInteraction = () => {
    cancelActiveScroll();
    cleanupListeners();
  };

  const cleanupListeners = () => {
    window.removeEventListener('wheel', stopOnUserInteraction);
    window.removeEventListener('touchmove', stopOnUserInteraction);
    window.removeEventListener('keydown', stopOnUserInteraction);
  };

  window.addEventListener('wheel', stopOnUserInteraction, { passive: true });
  window.addEventListener('touchmove', stopOnUserInteraction, { passive: true });
  window.addEventListener('keydown', stopOnUserInteraction, { passive: true });

  const step = (timestamp: number) => {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(1, elapsed / adaptiveDuration);
    const eased = easeInOutCubic(progress);

    window.scrollTo(0, Math.round(startY + distance * eased));

    if (progress < 1) {
      activeScrollAnimationId = window.requestAnimationFrame(step);
    } else {
      activeScrollAnimationId = null;
      cleanupListeners();
    }
  };

  activeScrollAnimationId = window.requestAnimationFrame(step);
}

/**
 * Smoothly scrolls to the top of the page.
 */
export function smoothScrollToTop(duration = 560): void {
  smoothScrollToY(0, duration);
}

/**
 * Smoothly scrolls to a target element or element ID, compensating for the sticky header.
 */
export function smoothScrollToElement(
  target: string | HTMLElement | null,
  options: SmoothScrollOptions = {}
): void {
  if (typeof document === 'undefined' || !target) return;

  const element =
    typeof target === 'string'
      ? document.getElementById(target.replace(/^#/, ''))
      : target;

  if (!element) return;

  const { offset = 14, duration = 640, highlight = true } = options;
  const headerOffset = getStickyHeaderOffset(offset);
  const rect = element.getBoundingClientRect();
  const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const targetY = Math.max(0, rect.top + currentScrollY - headerOffset);

  smoothScrollToY(targetY, duration);

  if (highlight && !prefersReducedMotion()) {
    element.classList.remove('section-scroll-arrival');
    // Force reflow to restart animation if triggered consecutively
    void element.offsetWidth;
    element.classList.add('section-scroll-arrival');
    window.setTimeout(() => {
      element.classList.remove('section-scroll-arrival');
    }, 1100);
  }
}
