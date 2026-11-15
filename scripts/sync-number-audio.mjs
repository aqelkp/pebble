#!/usr/bin/env node
/**
 * Number & Dot-to-Dot UI Voice Generator (Kokoro-82M + LameJS MP3)
 *
 * Generates calm spoken number clips (1..10) and mistake-redirect prompts into:
 *   - public/audio/numbers/1.mp3 ... 10.mp3
 *   - public/audio/ui/mistake-find-next.mp3
 *
 * Usage:
 *   PEBBLE_TTS_NODE_MODULES=/path/to/kokoro/node_modules node scripts/sync-number-audio.mjs [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const numbersOutDir = path.resolve(repoRoot, 'public', 'audio', 'numbers');
const uiOutDir = path.resolve(repoRoot, 'public', 'audio', 'ui');
const forceRegen = process.argv.includes('--force');

const require = createRequire(import.meta.url);

const NUMBER_PROMPTS = [
  { file: '1.mp3', text: 'One!' },
  { file: '2.mp3', text: 'Two!' },
  { file: '3.mp3', text: 'Three!' },
  { file: '4.mp3', text: 'Four!' },
  { file: '5.mp3', text: 'Five!' },
  { file: '6.mp3', text: 'Six!' },
  { file: '7.mp3', text: 'Seven!' },
  { file: '8.mp3', text: 'Eight!' },
  { file: '9.mp3', text: 'Nine!' },
  { file: '10.mp3', text: 'Ten!' },
];

const UI_PROMPTS = [
  { file: 'mistake-find-next.mp3', text: "Let's find the next one in order!" },
];

function safeOutPath(baseDir, rawFileName) {
  const safeBase = path.basename(rawFileName);
  if (safeBase !== rawFileName || !/^[a-z0-9._-]+\.mp3$/i.test(safeBase)) {
    throw new Error(`Invalid output filename: ${rawFileName}`);
  }
  const resolved = path.resolve(baseDir, safeBase);
  if (!resolved.startsWith(baseDir + path.sep)) {
    throw new Error(`Path traversal rejected for: ${resolved}`);
  }
  return resolved;
}

function resolveTtsPackage(pkgName, esmSubpath = '') {
  const candidateRoots = [
    process.env.PEBBLE_TTS_NODE_MODULES,
    path.join(repoRoot, 'node_modules'),
    path.join(process.env.HOME || '', '.cache', 'pebble-tts', 'node_modules'),
  ].filter(Boolean);

  for (const root of candidateRoots) {
    const pkgPath = path.join(root, pkgName);
    if (fs.existsSync(pkgPath)) {
      if (esmSubpath) {
        return path.join(pkgPath, esmSubpath);
      }
      return require.resolve(pkgName, { paths: [root] });
    }
  }
  throw new Error(
    `Cannot locate "${pkgName}". Set PEBBLE_TTS_NODE_MODULES to a node_modules directory with kokoro-js and @breezystack/lamejs installed.`,
  );
}

function trimAndNormalizeFloat32(samples, sampleRate) {
  const threshold = 0.008;
  let start = 0;
  while (start < samples.length && Math.abs(samples[start]) < threshold) {
    start += 1;
  }
  let end = samples.length - 1;
  while (end > start && Math.abs(samples[end]) < threshold) {
    end -= 1;
  }
  const padSamples = Math.floor(sampleRate * 0.045);
  start = Math.max(0, start - padSamples);
  end = Math.min(samples.length - 1, end + padSamples);

  const slice = samples.subarray(start, end + 1);
  let maxAbs = 0;
  for (let i = 0; i < slice.length; i += 1) {
    const abs = Math.abs(slice[i]);
    if (abs > maxAbs) maxAbs = abs;
  }

  const gain = maxAbs > 0.02 ? Math.min(2.5, 0.88 / maxAbs) : 1;
  const int16 = new Int16Array(slice.length);
  for (let i = 0; i < slice.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, slice[i] * gain));
    int16[i] = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
  }
  return int16;
}

function encodeMonoMp3(Mp3Encoder, int16Samples, sampleRate, kbps = 64) {
  const encoder = new Mp3Encoder(1, sampleRate, kbps);
  const blockSize = 1152;
  const chunks = [];
  for (let i = 0; i < int16Samples.length; i += blockSize) {
    const chunk = int16Samples.subarray(i, i + blockSize);
    const mp3buf = encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      chunks.push(Buffer.from(mp3buf));
    }
  }
  const flush = encoder.flush();
  if (flush.length > 0) {
    chunks.push(Buffer.from(flush));
  }
  return Buffer.concat(chunks);
}

async function main() {
  fs.mkdirSync(numbersOutDir, { recursive: true });
  fs.mkdirSync(uiOutDir, { recursive: true });

  const jobs = [];
  for (const item of NUMBER_PROMPTS) {
    const outPath = safeOutPath(numbersOutDir, item.file);
    if (forceRegen || !fs.existsSync(outPath)) {
      jobs.push({ ...item, outPath });
    }
  }
  for (const item of UI_PROMPTS) {
    const outPath = safeOutPath(uiOutDir, item.file);
    if (forceRegen || !fs.existsSync(outPath)) {
      jobs.push({ ...item, outPath });
    }
  }

  if (jobs.length === 0) {
    console.log('All number and Dot-to-Dot UI audio clips are already up to date.');
    return;
  }

  console.log(`Generating ${jobs.length} number/UI audio clips via Kokoro (af_heart)...`);
  const kokoroEntry = resolveTtsPackage('kokoro-js');
  const lameEntry = resolveTtsPackage('@breezystack/lamejs', 'dist/lamejs.js');

  const { KokoroTTS } = await import(pathToFileURL(kokoroEntry).href);
  const lameMod = await import(pathToFileURL(lameEntry).href);
  const Mp3Encoder = lameMod.Mp3Encoder || lameMod.default?.Mp3Encoder;
  if (!Mp3Encoder) {
    throw new Error('Could not resolve Mp3Encoder from @breezystack/lamejs');
  }

  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'q8',
    device: 'cpu',
  });

  let totalBytes = 0;
  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i];
    const audio = await tts.generate(job.text, {
      voice: 'af_heart',
      speed: 0.92,
    });
    const int16 = trimAndNormalizeFloat32(audio.audio, audio.sampling_rate);
    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, audio.sampling_rate, 64);
    fs.writeFileSync(job.outPath, mp3Buffer);
    totalBytes += mp3Buffer.length;
    console.log(`  [${i + 1}/${jobs.length}] ${path.basename(job.outPath)} (${mp3Buffer.length} B)`);
  }

  console.log(`Done! Saved ${jobs.length} audio clips (${(totalBytes / 1024).toFixed(1)} KB).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
