import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

export interface StageDimensions {
  width: number;
  height: number;
  ready: boolean;
}

export interface GridFitOptions {
  stageWidth: number;
  stageHeight: number;
  cols: number;
  rows: number;
  /** Width divided by height (e.g. 2.5 / 3.5 for Pebble portrait playing cards). */
  cardAspectRatio: number;
  gap?: number;
  minItemWidth?: number;
  minItemHeight?: number;
  paddingPx?: number;
}

export interface GridFitResult {
  width: number;
  height: number;
  gap: number;
  gridWidth: number;
  gridHeight: number;
}

/**
 * Measure a stage container synchronously before paint and track live resizes
 * via ResizeObserver so portrait tablet boards fit within 100dvh with zero vertical scroll.
 */
export function useStageSize<T extends HTMLElement = HTMLDivElement>(): readonly [
  RefObject<T | null>,
  StageDimensions,
] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<StageDimensions>({
    width: 0,
    height: 0,
    ready: false,
  });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const nextWidth = Math.max(0, rect.width);
      const nextHeight = Math.max(0, rect.height);
      setSize((prev) =>
        prev.ready &&
        Math.abs(prev.width - nextWidth) < 0.5 &&
        Math.abs(prev.height - nextHeight) < 0.5
          ? prev
          : { width: nextWidth, height: nextHeight, ready: true },
      );
    };

    measure();
    const observer = new ResizeObserver(() => measure());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

/**
 * Solve for the largest item dimensions preserving `cardAspectRatio` (width / height)
 * inside a grid of `cols × rows` within `stageWidth × stageHeight`.
 */
export function solveGridFit({
  stageWidth,
  stageHeight,
  cols,
  rows,
  cardAspectRatio,
  gap = 10,
  minItemWidth = 44,
  minItemHeight = 44,
  paddingPx = 4,
}: GridFitOptions): GridFitResult {
  const safeCols = Math.max(1, cols);
  const safeRows = Math.max(1, rows);
  const safeRatio = cardAspectRatio > 0 ? cardAspectRatio : 1;

  const usableW = Math.max(240, stageWidth - paddingPx);
  const usableH = Math.max(240, stageHeight - paddingPx);

  const maxWidthPerItem = (usableW - (safeCols - 1) * gap) / safeCols;
  const maxHeightFromWidth = maxWidthPerItem / safeRatio;
  const maxHeightFromStage = (usableH - (safeRows - 1) * gap) / safeRows;

  const height = Math.max(
    minItemHeight,
    Math.floor(Math.min(maxHeightFromWidth, maxHeightFromStage)),
  );
  const width = Math.max(minItemWidth, Math.floor(height * safeRatio));

  return {
    width,
    height,
    gap,
    gridWidth: safeCols * width + Math.max(0, safeCols - 1) * gap,
    gridHeight: safeRows * height + Math.max(0, safeRows - 1) * gap,
  };
}
