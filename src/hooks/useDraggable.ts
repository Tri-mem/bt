import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface Position {
  x: number;
  y: number;
}

export interface UseDraggableOptions {
  storageKey?: string;
  margin?: number;
  defaultPosition?: (viewportWidth: number, viewportHeight: number, elemWidth: number, elemHeight: number) => Position;
  onDragStart?: () => void;
  onDragEnd?: (pos: Position) => void;
}

export function useDraggable<T extends HTMLElement = HTMLButtonElement>(options: UseDraggableOptions = {}) {
  const {
    storageKey = 'novashop_floating_promo_pos_v2',
    margin = 10,
    defaultPosition,
    onDragStart,
    onDragEnd,
  } = options;

  const elementRef = useRef<T | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Tracking refs to distinguish clicks from drags
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const startPointerRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const DRAG_THRESHOLD = 5; // px

  // Load saved user position if previously dragged; otherwise keep null so responsive CSS positioning applies
  useEffect(() => {
    const computeInitialPos = (): Position | null => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const el = elementRef.current;
      const ew = el ? el.offsetWidth || 140 : 140;
      const eh = el ? el.offsetHeight || 44 : 44;

      if (storageKey) {
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (
              typeof parsed.x === 'number' &&
              typeof parsed.y === 'number' &&
              !isNaN(parsed.x) &&
              !isNaN(parsed.y)
            ) {
              const clampedX = Math.max(margin, Math.min(parsed.x, vw - ew - margin));
              const clampedY = Math.max(margin, Math.min(parsed.y, vh - eh - margin));
              return { x: clampedX, y: clampedY };
            }
          }
        } catch {
          // ignore parsing error
        }
      }

      if (defaultPosition) {
        return defaultPosition(vw, vh, ew, eh);
      }

      return null;
    };

    setPosition(computeInitialPos());
  }, [storageKey, margin]);

  // Keep element within viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const el = elementRef.current;
        if (!el) return prev;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const ew = el.offsetWidth || 140;
        const eh = el.offsetHeight || 44;

        const clampedX = Math.max(margin, Math.min(prev.x, vw - ew - margin));
        const clampedY = Math.max(margin, Math.min(prev.y, vh - eh - margin));
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [margin]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    // Only respond to primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const el = elementRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { x: rect.left, y: rect.top };
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if pointer capture fails
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - startPointerRef.current.x;
    const deltaY = e.clientY - startPointerRef.current.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (!hasMovedRef.current && distance > DRAG_THRESHOLD) {
      hasMovedRef.current = true;
      setIsDragging(true);
      onDragStart?.();
    }

    if (hasMovedRef.current) {
      const el = elementRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const ew = el ? el.offsetWidth || 140 : 140;
      const eh = el ? el.offsetHeight || 44 : 44;

      const rawX = e.clientX - offsetRef.current.x;
      const rawY = e.clientY - offsetRef.current.y;

      // Clamp within viewport
      const clampedX = Math.max(margin, Math.min(rawX, vw - ew - margin));
      const clampedY = Math.max(margin, Math.min(rawY, vh - eh - margin));

      setPosition({ x: clampedX, y: clampedY });
    }
  }, [margin, onDragStart]);

  const endDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (hasMovedRef.current) {
      setIsDragging(false);
      // Persist user position preference
      setPosition((currentPos) => {
        if (currentPos && storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(currentPos));
          } catch {
            // ignore
          }
          onDragEnd?.(currentPos);
        }
        return currentPos;
      });
    }
  }, [storageKey, onDragEnd]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    endDrag(e);
  }, [endDrag]);

  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLElement>) => {
    endDrag(e);
  }, [endDrag]);

  // Click handler wrapper to prevent click event if dragged
  const handleClick = useCallback((onClickAction?: () => void) => {
    return (e: React.MouseEvent<HTMLElement>) => {
      if (hasMovedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        hasMovedRef.current = false;
        return;
      }
      onClickAction?.();
    };
  }, []);

  const resetPosition = useCallback(() => {
    if (defaultPosition) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const el = elementRef.current;
      const ew = el ? el.offsetWidth || 140 : 140;
      const eh = el ? el.offsetHeight || 44 : 44;
      setPosition(defaultPosition(vw, vh, ew, eh));
    } else {
      setPosition(null);
    }
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
  }, [defaultPosition, storageKey]);

  const positionStyle: React.CSSProperties = {
    ...(position
      ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          bottom: 'auto',
          right: 'auto',
        }
      : {}),
    ...(isDragging ? { transition: 'none' } : {}),
  };

  return {
    elementRef,
    position,
    isDragging,
    positionStyle,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      style: {
        touchAction: 'none' as const,
        userSelect: 'none' as const,
        WebkitUserSelect: 'none' as const,
      },
    },
    dragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      style: {
        touchAction: 'none' as const,
        userSelect: 'none' as const,
        WebkitUserSelect: 'none' as const,
        ...positionStyle,
      },
    },
    handleClick,
    resetPosition,
  };
}
