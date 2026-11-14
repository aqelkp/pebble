import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

export const DEFAULT_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const PORTRAIT_VIEWPORT = { width: 768, height: 1024 };

const SCREENSHOT_NAME_RE = /^[a-zA-Z0-9._-]+\.png$/;
const VIDEO_NAME_RE = /^[a-zA-Z0-9._-]+\.webm$/;

/**
 * Launch a Playwright portrait-tablet (768x1024) Chrome session bound to a local
 * 127.0.0.1 preview server with video recording and crisp screenshot helpers.
 */
export async function launchPortraitVerifySession({
  baseUrl,
  artifactDir,
  deviceScaleFactor = 2,
}) {
  if (typeof baseUrl !== 'string' || !baseUrl.startsWith('http://127.0.0.1:')) {
    throw new Error(`baseUrl must bind strictly to http://127.0.0.1:<port> (received "${baseUrl}")`);
  }
  if (typeof artifactDir !== 'string' || artifactDir.trim().length === 0) {
    throw new Error('artifactDir is required');
  }

  const resolvedArtifactDir = path.resolve(artifactDir);
  fs.mkdirSync(resolvedArtifactDir, { recursive: true });

  const executablePath = fs.existsSync(DEFAULT_CHROME_PATH) ? DEFAULT_CHROME_PATH : undefined;
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: PORTRAIT_VIEWPORT,
    deviceScaleFactor,
    recordVideo: {
      dir: resolvedArtifactDir,
      size: PORTRAIT_VIEWPORT,
    },
  });

  const page = await context.newPage();

  async function waitForFontsAndImages() {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
        const rect = img.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        }),
      );
      for (const img of imgs) {
        if (!img.complete || img.naturalWidth <= 0) {
          throw new Error(`Broken or unloaded visible image: ${img.getAttribute('src') ?? '(unknown)'}`);
        }
      }
    });
  }

  async function assertZeroVerticalScroll(label = 'view') {
    const metrics = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
    }));
    if (metrics.scrollHeight > metrics.innerHeight + 1) {
      throw new Error(
        `Vertical overflow detected in ${label}: scrollHeight=${metrics.scrollHeight} > innerHeight=${metrics.innerHeight}`,
      );
    }
    return metrics;
  }

  async function captureScreenshot(fileName) {
    if (!SCREENSHOT_NAME_RE.test(fileName)) {
      throw new Error(`Invalid PNG screenshot file name: ${fileName}`);
    }
    const targetPath = path.join(resolvedArtifactDir, fileName);
    await page.screenshot({
      path: targetPath,
      fullPage: false,
    });
    return targetPath;
  }

  async function finishAndSaveVideo(videoFileName) {
    if (!VIDEO_NAME_RE.test(videoFileName)) {
      throw new Error(`Invalid WebM video file name: ${videoFileName}`);
    }
    const video = page.video();
    await context.close();
    if (!video) {
      await browser.close();
      throw new Error('Playwright video handle was unavailable after context close');
    }
    const rawPath = await video.path();
    await browser.close();

    const finalPath = path.join(resolvedArtifactDir, videoFileName);
    if (path.resolve(rawPath) !== path.resolve(finalPath)) {
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }
      fs.renameSync(rawPath, finalPath);
    }
    const stat = fs.statSync(finalPath);
    if (stat.size <= 0) {
      throw new Error(`Recorded video is empty: ${finalPath}`);
    }
    return finalPath;
  }

  return {
    browser,
    context,
    page,
    waitForFontsAndImages,
    assertZeroVerticalScroll,
    captureScreenshot,
    finishAndSaveVideo,
  };
}
