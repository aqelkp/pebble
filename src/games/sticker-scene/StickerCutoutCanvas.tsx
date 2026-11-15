import { useEffect, useRef } from 'react';
import { assetUrl } from '../../utils/assets';

interface StickerCutoutCanvasProps {
  imagePath: string;
  alt: string;
  mode: 'cutout' | 'silhouette';
  size?: number;
  className?: string;
}

const PROCESS_RES = 192;
const PROCESSED_CACHE = new Map<string, ImageData>();

function isExteriorBackgroundPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 28) return true;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  return r >= 234 && g >= 234 && b >= 234 && maxC - minC <= 22;
}

/**
 * Floodfills from all outer 1px border pixels to strip exterior white card backgrounds
 * while preserving interior whites (eyes, clouds, bellies, teeth).
 */
function buildProcessedImageData(
  sourceData: ImageData,
  mode: 'cutout' | 'silhouette',
): ImageData {
  const width = sourceData.width;
  const height = sourceData.height;
  const total = width * height;
  const src = sourceData.data;

  const out = new ImageData(width, height);
  const dst = out.data;
  dst.set(src);

  const visitedBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const enqueueIfBg = (x: number, y: number) => {
    const idx = y * width + x;
    if (visitedBg[idx]) return;
    const p = idx * 4;
    if (isExteriorBackgroundPixel(src[p], src[p + 1], src[p + 2], src[p + 3])) {
      visitedBg[idx] = 1;
      queue[tail] = idx;
      tail += 1;
    }
  };

  for (let x = 0; x < width; x += 1) {
    enqueueIfBg(x, 0);
    enqueueIfBg(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueueIfBg(0, y);
    enqueueIfBg(width - 1, y);
  }

  while (head < tail) {
    const curr = queue[head];
    head += 1;
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    if (cx > 0) enqueueIfBg(cx - 1, cy);
    if (cx + 1 < width) enqueueIfBg(cx + 1, cy);
    if (cy > 0) enqueueIfBg(cx, cy - 1);
    if (cy + 1 < height) enqueueIfBg(cx, cy + 1);
  }

  for (let i = 0; i < total; i += 1) {
    const p = i * 4;
    if (visitedBg[i]) {
      dst[p + 3] = 0;
      continue;
    }

    const r = dst[p];
    const g = dst[p + 1];
    const b = dst[p + 2];
    const a = dst[p + 3];

    // Feather light anti-aliased edge pixels bordering removed white background
    const x = i % width;
    const y = Math.floor(i / width);
    const touchesBg =
      (x > 0 && visitedBg[i - 1]) ||
      (x + 1 < width && visitedBg[i + 1]) ||
      (y > 0 && visitedBg[i - width]) ||
      (y + 1 < height && visitedBg[i + width]);

    const effectiveAlpha =
      touchesBg && r >= 210 && g >= 210 && b >= 210 ? Math.round(a * 0.45) : a;

    if (mode === 'silhouette') {
      if (effectiveAlpha > 16) {
        dst[p] = 56;
        dst[p + 1] = 66;
        dst[p + 2] = 94;
        dst[p + 3] = Math.min(255, Math.max(48, Math.round(effectiveAlpha * 0.38)));
      } else {
        dst[p + 3] = 0;
      }
    } else {
      dst[p + 3] = effectiveAlpha;
    }
  }

  return out;
}

export function StickerCutoutCanvas({
  imagePath,
  alt,
  mode,
  size = 112,
  className = '',
}: StickerCutoutCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cacheKey = `${imagePath}::${mode}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cached = PROCESSED_CACHE.get(cacheKey);
    if (cached) {
      ctx.clearRect(0, 0, PROCESS_RES, PROCESS_RES);
      ctx.putImageData(cached, 0, 0);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (cancelled) return;
      const offscreen = document.createElement('canvas');
      offscreen.width = PROCESS_RES;
      offscreen.height = PROCESS_RES;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.clearRect(0, 0, PROCESS_RES, PROCESS_RES);
      offCtx.drawImage(img, 0, 0, PROCESS_RES, PROCESS_RES);

      const raw = offCtx.getImageData(0, 0, PROCESS_RES, PROCESS_RES);
      const cutout = buildProcessedImageData(raw, 'cutout');
      const silhouette = buildProcessedImageData(raw, 'silhouette');

      PROCESSED_CACHE.set(`${imagePath}::cutout`, cutout);
      PROCESSED_CACHE.set(`${imagePath}::silhouette`, silhouette);

      const targetData = mode === 'silhouette' ? silhouette : cutout;
      ctx.clearRect(0, 0, PROCESS_RES, PROCESS_RES);
      ctx.putImageData(targetData, 0, 0);
    };
    img.src = assetUrl(imagePath);

    return () => {
      cancelled = true;
    };
  }, [cacheKey, imagePath, mode]);

  return (
    <canvas
      ref={canvasRef}
      width={PROCESS_RES}
      height={PROCESS_RES}
      role="img"
      aria-label={alt}
      className={`ss-cutout-canvas ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
