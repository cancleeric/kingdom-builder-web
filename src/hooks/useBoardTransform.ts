import { useState, useCallback, useRef } from 'react';

export interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface BoardTransformHandlers {
  transform: Transform;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Mouse wheel zoom */
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  /** Touch start – records initial touch(es) for pan/pinch */
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  /** Touch move – handles pan and pinch-to-zoom */
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  /** Touch end – clears gesture state */
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  /** Mouse drag start */
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Mouse drag move */
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Mouse drag end */
  onMouseUp: () => void;
  /** Reset transform to initial state */
  reset: () => void;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 4.0;
// 滑鼠拖動門檻（px）：移動未超過此值視為點擊而非平移，與 touch 的 8px tap 門檻一致
const DRAG_THRESHOLD = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function pinchDistance(touches: React.TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function pinchMidpoint(touches: React.TouchList): { x: number; y: number } {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

/**
 * Hook that manages zoom/pan transform state for the hex board.
 * Supports:
 *  - Mouse wheel zoom (centered on cursor)
 *  - Mouse drag pan
 *  - Single-finger touch drag pan
 *  - Two-finger pinch-to-zoom (centered on midpoint)
 */
export function useBoardTransform(): BoardTransformHandlers {
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse drag state
  const isDragging = useRef(false);
  // 已超過拖動門檻才真正 pan；門檻內視為點擊（避免微移把 click 當成 pan 吞掉，導致「點了放不了聚落」）
  const hasPassedDragThreshold = useRef(false);
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number }>({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
  });

  // Touch gesture state
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);

  // ── Mouse wheel zoom ────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

    setTransform(prev => {
      const newScale = clamp(prev.scale * zoomFactor, MIN_SCALE, MAX_SCALE);
      const ratio = newScale / prev.scale;
      return {
        scale: newScale,
        translateX: mouseX - ratio * (mouseX - prev.translateX),
        translateY: mouseY - ratio * (mouseY - prev.translateY),
      };
    });
  }, []);

  // ── Mouse drag pan ──────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only pan with left button
    if (e.button !== 0) return;
    isDragging.current = true;
    hasPassedDragThreshold.current = false;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      tx: 0,
      ty: 0,
    };
    setTransform(prev => {
      dragStart.current.tx = prev.translateX;
      dragStart.current.ty = prev.translateY;
      return prev;
    });
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    // 門檻內（微移）不 pan，讓格子的 click 正常觸發放置；超過門檻一次後才持續 pan
    if (!hasPassedDragThreshold.current && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
      return;
    }
    hasPassedDragThreshold.current = true;
    setTransform(prev => ({
      ...prev,
      translateX: dragStart.current.tx + dx,
      translateY: dragStart.current.ty + dy,
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    hasPassedDragThreshold.current = false;
  }, []);

  // ── Touch handlers ──────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastPinchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      lastTouchRef.current = null;
      lastPinchDistanceRef.current = pinchDistance(e.touches);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.touches.length === 1 && lastTouchRef.current) {
      // Single-finger pan
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + dx,
        translateY: prev.translateY + dy,
      }));
    } else if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
      // Two-finger pinch zoom
      const newDist = pinchDistance(e.touches);
      const ratio = newDist / lastPinchDistanceRef.current;
      lastPinchDistanceRef.current = newDist;

      const rect = containerRef.current?.getBoundingClientRect();
      const mid = pinchMidpoint(e.touches);
      const midX = rect ? mid.x - rect.left : mid.x;
      const midY = rect ? mid.y - rect.top : mid.y;

      setTransform(prev => {
        const newScale = clamp(prev.scale * ratio, MIN_SCALE, MAX_SCALE);
        const scaleDelta = newScale / prev.scale;
        return {
          scale: newScale,
          translateX: midX - scaleDelta * (midX - prev.translateX),
          translateY: midY - scaleDelta * (midY - prev.translateY),
        };
      });
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      lastTouchRef.current = null;
      lastPinchDistanceRef.current = null;
    } else if (e.touches.length === 1) {
      // Went from pinch back to single touch – restart pan tracking
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastPinchDistanceRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  return {
    transform,
    containerRef,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    reset,
  };
}
