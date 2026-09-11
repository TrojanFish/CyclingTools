import React, { useState, useRef, useCallback } from 'react';

interface UseSwipeToDismissOptions {
  onClose: () => void;
  threshold?: number; // Threshold in px to trigger close, default 75
}

interface UseSwipeToDismissReturn {
  dragY: number;
  isDragging: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  sheetStyle: React.CSSProperties;
}

/**
 * Native iOS 18 Pull-Down to Dismiss gesture hook for Bottom Sheet modals.
 * Features rubber-band dampening and Apple spring release transitions.
 */
export function useSwipeToDismiss({
  onClose,
  threshold = 75
}: UseSwipeToDismissOptions): UseSwipeToDismissReturn {
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const touchStartY = useRef<number>(0);
  const currentDragY = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      // Downward pull: full tracking
      currentDragY.current = deltaY;
      setDragY(deltaY);
    } else {
      // Upward pull resistance (rubber band dampening)
      const dampened = deltaY * 0.2;
      currentDragY.current = dampened;
      setDragY(dampened);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (currentDragY.current > threshold) {
      onClose();
    }
    setDragY(0);
    currentDragY.current = 0;
  }, [onClose, threshold]);

  const sheetStyle: React.CSSProperties = {
    transform: dragY !== 0 ? `translateY(${Math.max(0, dragY)}px)` : undefined,
    transition: isDragging ? 'none' : 'transform 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
    touchAction: 'pan-y'
  };

  return {
    dragY,
    isDragging,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    },
    sheetStyle
  };
}
