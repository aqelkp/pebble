#!/usr/bin/env node
/**
 * Read-Along & Theme Story Audio Generator (Kokoro-82M + LameJS MP3)
 *
 * Reads src/data/readAlongCatalog.json and generates compact 64kbps mono MP3s into:
 *   - public/audio/themes/talk/<pairId>.mp3    (warm story intro + name for all 160 characters)
 *   - public/audio/themes/words/<pairId>.mp3   (crisp name pronunciation for all 160 characters)
 *   - public/audio/read-along/<slug>.mp3       (quiz labels, phrase words, clues, UI titles)
 *
 * Existing files are skipped unless --force is passed.
 *
 * Usage:
 *   node scripts/sync-read-along-audio.mjs [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const catalogPath = path.join(repoRoot, 'src', 'data', 'readAlongCatalog.json');
const themeTalkOutDir = path.join(repoRoot, 'public', 'audio', 'themes', 'talk');
const themeWordsOutDir = path.join(repoRoot, 'public', 'audio', 'themes', 'words');
const readAlongOutDir = path.join(repoRoot, 'public', 'audio', 'read-along');

const forceRegen = process.argv.includes('--force');
const require = createRequire(import.meta.url);

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
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  fs.mkdirSync(themeTalkOutDir, { recursive: true });
  fs.mkdirSync(themeWordsOutDir, { recursive: true });
  fs.mkdirSync(readAlongOutDir, { recursive: true });

  const jobs = [];
  for (const ch of catalog.themeCharacters) {
    if (!/^[a-z0-9-]+$/.test(ch.pairId)) {
      throw new Error(`Invalid pairId in readAlongCatalog.json: ${ch.pairId}`);
    }
    const talkPath = path.join(themeTalkOutDir, `${ch.pairId}.mp3`);
    if (forceRegen || !fs.existsSync(talkPath)) {
      jobs.push({
        id: `talk/${ch.pairId}`,
        text: ch.talkText,
        outPath: talkPath,
      });
    }
    const wordPath = path.join(themeWordsOutDir, `${ch.pairId}.mp3`);
    if (forceRegen || !fs.existsSync(wordPath)) {
      jobs.push({
        id: `words/${ch.pairId}`,
        text: `${ch.speechName || ch.label}.`,
        outPath: wordPath,
      });
    }
  }

  for (const clip of catalog.readAlongClips) {
    if (!/^[a-z0-9-]+$/.test(clip.slug)) {
      throw new Error(`Invalid readAlong slug in readAlongCatalog.json: ${clip.slug}`);
    }
    const outPath = path.join(readAlongOutDir, `${clip.slug}.mp3`);
    if (forceRegen || !fs.existsSync(outPath)) {
      jobs.push({
        id: `read-along/${clip.slug}`,
        text: clip.text,
        outPath,
      });
    }
  }

  console.log(
    `Catalog: ${catalog.themeCharacters.length} theme characters, ${catalog.readAlongClips.length} read-along clips.`,
  );
  if (jobs.length === 0) {
    console.log('All read-along MP3 clips are already up to date.');
    return;
  }

  console.log(`Generating ${jobs.length} missing audio clips via Kokoro (af_heart)...`);
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
      speed: 0.95,
    });
    const int16 = trimAndNormalizeFloat32(audio.audio, audio.sampling_rate);
    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, audio.sampling_rate, 64);
    fs.writeFileSync(job.outPath, mp3Buffer);
    totalBytes += mp3Buffer.length;
    if ((i + 1) % 25 === 0 || i === jobs.length - 1) {
      console.log(`  [${i + 1}/${jobs.length}] latest: ${job.id}.mp3 (${mp3Buffer.length} B)`);
    }
  }

  console.log(`Done! Generated ${jobs.length} MP3 clips (${(totalBytes / 1024).toFixed(1)} KB total).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
