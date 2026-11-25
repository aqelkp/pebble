#!/usr/bin/env node
/**
 * Story Time Narration & Word Audio Generator (Kokoro-82M + LameJS MP3 + Word Timings)
 *
 * Generates:
 *   - public/audio/stories/<storyId>/page-<n>.mp3  (calm storybook narration per page)
 *   - public/audio/stories/words/<slug>.mp3        (crisp individual word clips for tap-to-hear)
 *   - src/games/story-time/storyAudioCatalog.json  (per-page durationMs + RMS-snapped word timings + word slugs)
 *
 * Usage:
 *   node scripts/sync-story-audio.mjs [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const storiesAudioDir = path.join(repoRoot, 'public', 'audio', 'stories');
const storyWordsDir = path.join(storiesAudioDir, 'words');
const catalogOutPath = path.join(repoRoot, 'src', 'games', 'story-time', 'storyAudioCatalog.json');

const forceRegen = process.argv.includes('--force');
const require = createRequire(import.meta.url);

const STORY_SCRIPTS = [
  {
    id: 'sam-and-the-mud',
    title: 'Sam and the Mud',
    pages: [
      'Sam is an ant. Pip is a pig.',
      'Sam met Pip in his sty.',
      'Oh no! The sty got wet.',
      'Pip is sad. He can not nap.',
      'Sam and Pip hop in the mud.',
      'Pip has fun! Mud is on his hat.',
      'Rob is an owl. Rob can fly up.',
      'The sun is out! Pip and Sam hug.',
    ],
  },
  {
    id: 'kit-and-the-bug',
    title: 'Kit and the Bug',
    pages: [
      'Kit is a fat cat.',
      'Kit sat on a red mat.',
      'A red bug hid by a cup.',
      'Kit ran! The bug can zip.',
      'The bug sat on a big box.',
      'Kit did a big hop up.',
      'Kit did not nip the bug.',
      'Now Kit and the bug nap.',
    ],
  },
  {
    id: 'max-on-the-bus',
    title: 'Max on the Bus',
    pages: [
      'Max is a fun pup.',
      'Max has a red cap.',
      'A big bus is at the lot.',
      'Ben is in the bus. Hop on, Max!',
      'The bus can go so far.',
      'Max saw a cow and a yak.',
      'Oh! A hen sat in the way.',
      'Ben let the hen go. Yay, Ben!',
    ],
  },
  {
    id: 'gus-and-the-jam',
    title: 'Gus and the Jam',
    pages: [
      'Gus is a cub. Gus is big.',
      'Gus has a red pot and a pan.',
      'Pam is a hen. Pam has a fig.',
      'Gus put the fig in the pot.',
      'Mix, mix, mix! The pot is hot.',
      'Yum! It is red fig jam.',
      'Gus put jam on a bun.',
      'Gus and Pam eat the bun. Yum!',
    ],
  },
  {
    id: 'zoe-and-the-bee',
    title: 'Zoe and the Bee',
    pages: [
      'Zoe is a red fox.',
      'Zoe sat by a big bud.',
      'A bee can hum and fly.',
      'The bee sat on the bud.',
      'Zoe ran to see the bee.',
      'The bee did a zig and a zag!',
      'Zoe sat on a log to see.',
      'The bee is a fun pal.',
    ],
  },
  {
    id: 'bob-in-the-tub',
    title: 'Bob in the Tub',
    pages: [
      'Bob is a dog. Mia is his pal.',
      'Bob dug in a mud pit.',
      'Oh no! Mud is on his ear and paw.',
      'Mia got a big tub and a mop.',
      'Bob did a hop in the tub.',
      'Rub, rub, rub! The mud is off.',
      'Bob is out! He can wag and dry.',
      'Mia and Bob hug. Fun day!',
    ],
  },
];

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

function estimateSyllables(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 1;
  const groups = clean.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  if (clean.length > 3 && clean.endsWith('e') && !clean.endsWith('le')) {
    count = Math.max(1, count - 1);
  }
  return Math.max(1, count);
}

function computeRmsWindow(int16Samples, centerSample, halfWindowSamples) {
  const start = Math.max(0, centerSample - halfWindowSamples);
  const end = Math.min(int16Samples.length - 1, centerSample + halfWindowSamples);
  if (end <= start) return 0;
  let sumSq = 0;
  for (let i = start; i <= end; i += 1) {
    const v = int16Samples[i];
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / (end - start + 1));
}

function snapBoundaryToLowestRmsTrough(int16Samples, sampleRate, targetMs, minMs, maxMs) {
  const searchRadiusMs = 90;
  const windowHalfSamples = Math.max(1, Math.floor((sampleRate * 0.015) / 2));
  const stepMs = 5;
  const startMs = Math.max(minMs, targetMs - searchRadiusMs);
  const endMs = Math.min(maxMs, targetMs + searchRadiusMs);

  let bestMs = Math.max(minMs, Math.min(maxMs, targetMs));
  let bestRms = Infinity;

  for (let ms = startMs; ms <= endMs; ms += stepMs) {
    const centerSample = Math.round((ms / 1000) * sampleRate);
    const rms = computeRmsWindow(int16Samples, centerSample, windowHalfSamples);
    if (rms < bestRms) {
      bestRms = rms;
      bestMs = ms;
    }
  }
  return Math.round(bestMs);
}

function computeWordTimings(text, int16Samples, sampleRate) {
  const durationMs = Math.round((int16Samples.length / sampleRate) * 1000);
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { durationMs, words: [] };
  }

  const startOffsetMs = Math.min(35, Math.floor(durationMs * 0.04));
  const endOffsetMs = Math.max(startOffsetMs + words.length * 45, Math.max(220, durationMs - 45));
  const activeSpanMs = Math.max(120, endOffsetMs - startOffsetMs);

  const weights = words.map((word, idx) => {
    const cleanLen = word.replace(/[^a-zA-Z0-9]/g, '').length;
    const syllables = estimateSyllables(word);
    const commaPause = word.endsWith(',') ? 0.85 : 0;
    const isMidSentenceEnd = /[.!?]$/.test(word) && idx < words.length - 1;
    const endPunctPause = isMidSentenceEnd ? 1.35 : /[.!?]$/.test(word) ? 0.25 : 0;
    return syllables * 1.0 + cleanLen * 0.1 + commaPause + endPunctPause;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0) || 1;
  const rawBoundaries = [startOffsetMs];
  let acc = 0;
  for (let i = 0; i < words.length; i += 1) {
    acc += weights[i];
    if (i < words.length - 1) {
      rawBoundaries.push(Math.round(startOffsetMs + (acc / totalWeight) * activeSpanMs));
    } else {
      rawBoundaries.push(endOffsetMs);
    }
  }

  const snappedBoundaries = [...rawBoundaries];
  for (let i = 1; i < words.length; i += 1) {
    const prevMs = snappedBoundaries[i - 1] + 55;
    const nextMinBudget = (words.length - i) * 55;
    const maxAllowedMs = Math.max(prevMs, endOffsetMs - nextMinBudget);
    snappedBoundaries[i] = snapBoundaryToLowestRmsTrough(
      int16Samples,
      sampleRate,
      rawBoundaries[i],
      prevMs,
      maxAllowedMs,
    );
  }

  const timings = words.map((word, idx) => ({
    word,
    startMs: idx === 0 ? 0 : snappedBoundaries[idx],
    endMs: idx === words.length - 1 ? durationMs : snappedBoundaries[idx + 1],
  }));

  return { durationMs, words: timings };
}

function slugWord(raw) {
  return raw.toLowerCase().replace(/[^a-z]/g, '');
}

async function main() {
  fs.mkdirSync(storiesAudioDir, { recursive: true });
  fs.mkdirSync(storyWordsDir, { recursive: true });
  fs.mkdirSync(path.dirname(catalogOutPath), { recursive: true });

  let existingCatalog = { pages: {}, wordSlugs: [] };
  if (fs.existsSync(catalogOutPath)) {
    try {
      existingCatalog = JSON.parse(fs.readFileSync(catalogOutPath, 'utf8'));
    } catch {
      existingCatalog = { pages: {}, wordSlugs: [] };
    }
  }

  const pageJobs = [];
  const uniqueWords = new Set();

  for (const story of STORY_SCRIPTS) {
    const storyDir = path.join(storiesAudioDir, story.id);
    fs.mkdirSync(storyDir, { recursive: true });

    story.pages.forEach((text, idx) => {
      const pageNum = idx + 1;
      const key = `${story.id}/page-${pageNum}`;
      const outPath = path.join(storyDir, `page-${pageNum}.mp3`);
      const hasTiming = Boolean(existingCatalog.pages?.[key]?.words?.length);
      if (forceRegen || !fs.existsSync(outPath) || !hasTiming) {
        pageJobs.push({ key, storyId: story.id, pageNum, text, outPath });
      }
      for (const token of text.trim().split(/\s+/)) {
        const clean = slugWord(token);
        if (clean) uniqueWords.add(clean);
      }
    });
  }

  const wordJobs = [];
  for (const word of Array.from(uniqueWords).sort()) {
    const outPath = path.join(storyWordsDir, `${word}.mp3`);
    if (forceRegen || !fs.existsSync(outPath)) {
      const spoken = word === 'a' ? 'uh.' : `${word}.`;
      wordJobs.push({ word, spoken, outPath });
    }
  }

  if (pageJobs.length === 0 && wordJobs.length === 0) {
    console.log('All Story Time MP3 clips and word timings are already up to date.');
    return;
  }

  console.log(
    `Generating ${pageJobs.length} page narrations + ${wordJobs.length} individual word clips via Kokoro (af_heart)...`,
  );

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

  const pages = { ...(existingCatalog.pages || {}) };
  let totalBytes = 0;

  for (let i = 0; i < pageJobs.length; i += 1) {
    const job = pageJobs[i];
    const audio = await tts.generate(job.text, {
      voice: 'af_heart',
      speed: 0.85,
    });
    const int16 = trimAndNormalizeFloat32(audio.audio, audio.sampling_rate);
    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, audio.sampling_rate, 64);
    fs.writeFileSync(job.outPath, mp3Buffer);
    totalBytes += mp3Buffer.length;

    const timing = computeWordTimings(job.text, int16, audio.sampling_rate);
    pages[job.key] = {
      audioPath: `audio/stories/${job.storyId}/page-${job.pageNum}.mp3`,
      durationMs: timing.durationMs,
      words: timing.words,
    };

    if ((i + 1) % 8 === 0 || i === pageJobs.length - 1) {
      console.log(`  [Page ${i + 1}/${pageJobs.length}] ${job.key} (${timing.durationMs}ms, ${timing.words.length} words)`);
    }
  }

  for (let i = 0; i < wordJobs.length; i += 1) {
    const job = wordJobs[i];
    const audio = await tts.generate(job.spoken, {
      voice: 'af_heart',
      speed: 0.9,
    });
    const int16 = trimAndNormalizeFloat32(audio.audio, audio.sampling_rate);
    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, audio.sampling_rate, 64);
    fs.writeFileSync(job.outPath, mp3Buffer);
    totalBytes += mp3Buffer.length;

    if ((i + 1) % 25 === 0 || i === wordJobs.length - 1) {
      console.log(`  [Word ${i + 1}/${wordJobs.length}] ${job.word}.mp3`);
    }
  }

  const wordSlugs = Array.from(uniqueWords).sort();
  fs.writeFileSync(catalogOutPath, `${JSON.stringify({ pages, wordSlugs }, null, 2)}\n`, 'utf8');
  console.log(
    `Done! Saved ${pageJobs.length} page narrations + ${wordJobs.length} word clips (${(totalBytes / 1024).toFixed(1)} KB total).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
