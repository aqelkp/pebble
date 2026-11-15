import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export interface LogicalPoint {
  x: number;
  y: number;
}

export type CoordinateFitMode = 'contain' | 'stretch';

export interface UsePointerStrokeOptions<TPoint = LogicalPoint> {
  enabled?: boolean;
  resolvePoint: (event: ReactPointerEvent<HTMLElement>) => TPoint | null;
  onStrokeStart?: (point: TPoint, event: ReactPointerEvent<HTMLElement>) => void;
  onStrokeMove?: (point: TPoint, event: ReactPointerEvent<HTMLElement>) => void;
  onStrokeEnd?: (point: TPoint | null, event: ReactPointerEvent<HTMLElement>) => void;
  onStrokeCancel?: (event: ReactPointerEvent<HTMLElement>) => void;
}

export interface PointerStrokeHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}

export interface UsePointerStrokeResult {
  isDrawing: boolean;
  handlers: PointerStrokeHandlers;
}

/**
 * Convert client pointer coordinates into an element's logical coordinate space
 * (e.g., an SVG viewBox or fixed logical canvas size), accounting for letterboxed 'contain' fit.
 */
export function clientToLogicalPoint(
  element: Element,
  clientX: number,
  clientY: number,
  logicalWidth: number,
  logicalHeight: number,
  fit: CoordinateFitMode = 'contain',
): LogicalPoint | null {
  if (logicalWidth <= 0 || logicalHeight <= 0) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  if (fit === 'stretch') {
    return {
      x: ((clientX - rect.left) / rect.width) * logicalWidth,
      y: ((clientY - rect.top) / rect.height) * logicalHeight,
    };
  }

  const scale = Math.min(rect.width / logicalWidth, rect.height / logicalHeight);
  if (scale <= 0) return null;

  const renderWidth = logicalWidth * scale;
  const renderHeight = logicalHeight * scale;
  const offsetX = rect.left + (rect.width - renderWidth) / 2;
  const offsetY = rect.top + (rect.height - renderHeight) / 2;

  return {
    x: (clientX - offsetX) / scale,
    y: (clientY - offsetY) / scale,
  };
}

/**
 * Sample `count` evenly spaced checkpoints along any SVG path/geometry element
 * for letter tracing, number tracing, and connect-the-dots validation.
 */
export function samplePathCheckpoints(
  pathEl: SVGGeometryElement,
  count: number,
): LogicalPoint[] {
  if (count <= 0) return [];
  const totalLength = pathEl.getTotalLength();
  if (count === 1) {
    const pt = pathEl.getPointAtLength(0);
    return [{ x: pt.x, y: pt.y }];
  }

  const points: LogicalPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const distance = (totalLength * i) / (count - 1);
    const pt = pathEl.getPointAtLength(distance);
    points.push({ x: pt.x, y: pt.y });
  }
  return points;
}

export function distanceBetweenPoints(a: LogicalPoint, b: LogicalPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Single-pointer capture hook for touch/stylus/mouse strokes (Coloring, Tracing, Match Lines).
 * Ignores accidental secondary palm/finger contacts while a stroke is active.
 */
export function usePointerStroke<TPoint = LogicalPoint>({
  enabled = true,
  resolvePoint,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  onStrokeCancel,
}: UsePointerStrokeOptions<TPoint>): UsePointerStrokeResult {
  const [isDrawing, setIsDrawing] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  const callbacksRef = useRef({
    resolvePoint,
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    onStrokeCancel,
  });
  callbacksRef.current = {
    resolvePoint,
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    onStrokeCancel,
  };

  const releaseCaptureSafe = (target: HTMLElement, pointerId: number) => {
    try {
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
    } catch {
      // Ignore release errors when pointer already left DOM
    }
  };

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || activePointerIdRef.current !== null) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const point = callbacksRef.current.resolvePoint(event);
      if (point === null) return;

      activePointerIdRef.current = event.pointerId;
      setIsDrawing(true);

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture errors on synthetic test events
      }

      callbacksRef.current.onStrokeStart?.(point, event);
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || activePointerIdRef.current !== event.pointerId) return;
      const point = callbacksRef.current.resolvePoint(event);
      if (point === null) return;
      callbacksRef.current.onStrokeMove?.(point, event);
    },
    [enabled],
  );

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    activePointerIdRef.current = null;
    setIsDrawing(false);
    releaseCaptureSafe(event.currentTarget, event.pointerId);
    const point = callbacksRef.current.resolvePoint(event);
    callbacksRef.current.onStrokeEnd?.(point, event);
  }, []);

  const onPointerCancel = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    activePointerIdRef.current = null;
    setIsDrawing(false);
    releaseCaptureSafe(event.currentTarget, event.pointerId);
    callbacksRef.current.onStrokeCancel?.(event);
  }, []);

  return {
    isDrawing,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
