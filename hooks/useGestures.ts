import { useEffect, useRef } from 'react';

export interface GestureState {
  pinch: { scale: number; center: { x: number; y: number } | null };
  pan: { deltaX: number; deltaY: number };
}

export const useGestures = (
  elementRef: React.RefObject<HTMLElement | null>,
  onGesture: (state: GestureState, event: TouchEvent) => void,
) => {
  const initialPinchDistance = useRef<number>(0);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
  const pinchCenter = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const getDistance = (t1: Touch, t2: Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const getCenter = (t1: Touch, t2: Touch) => ({ x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        initialPinchDistance.current = getDistance(e.touches[0], e.touches[1]);
        pinchCenter.current = getCenter(e.touches[0], e.touches[1]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent default to avoid scrolling the page while gesturing on canvas
      if (e.cancelable) e.preventDefault();
      
      const state: GestureState = { pinch: { scale: 1, center: null }, pan: { deltaX: 0, deltaY: 0 } };

      if (e.touches.length === 1 && lastPanPoint.current) {
        const touch = e.touches[0];
        state.pan.deltaX = touch.clientX - lastPanPoint.current.x;
        state.pan.deltaY = touch.clientY - lastPanPoint.current.y;
        lastPanPoint.current = { x: touch.clientX, y: touch.clientY };
      } else if (e.touches.length === 2 && initialPinchDistance.current > 0) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        state.pinch.scale = currentDistance / initialPinchDistance.current;
        state.pinch.center = pinchCenter.current;
        // Update initial distance for continuous scaling relative to last frame would be different,
        // here we scale relative to gesture start. For continuous, we'd reset initialPinchDistance here.
        // Let's keep it relative to start for smoother 'pinch to zoom' feel often.
        // Actually, standard implementation often resets to avoid compounding floating point errors too much if needed,
        // but let's stick to relative-to-start for now and see if it needs adjustment.
        // Re-reading CanvasInteraction, it uses oldZoom * scale, so relative to start of gesture is good.
      }
      onGesture(state, e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialPinchDistance.current = 0;
        pinchCenter.current = null;
      }
      if (e.touches.length === 0) {
        lastPanPoint.current = null;
      } else if (e.touches.length === 1) {
         // Switch from pinch to pan smoothly
         lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [elementRef, onGesture]);
};