#!/usr/bin/env node
/**
 * Story Time Narration & Word Audio Generator (Kokoro-82M + LameJS MP3 + Sample-Accurate Word Timings)
 *
 * For K1 early readers, stitches crisp individual Kokoro word buffers with deliberate
 * child-friendly pauses (260ms between words, 560ms after sentence ends, 380ms after commas)
 * so:
 *   1. Pacing is calm, unhurried, and easy for a 4–5 year old to follow word-by-word.
 *   2. Every word's startMs / endMs is 100% sample-accurate (zero drift, zero 80ms flashes).
 *
 * Generates:
 *   - public/audio/stories/words/<slug>.mp3        (crisp individual word clips for tap-to-hear)
 *   - public/audio/stories/<storyId>/page-<n>.mp3  (calm stitched K1 read-along narration per page)
 *   - src/games/story-time/storyAudioCatalog.json  (sample-accurate durationMs + word timings)
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

const require = createRequire(import.meta.url);

// Calm K1 read-along pacing (milliseconds)
const LEAD_IN_MS = 120;
const WORD_GAP_MS = 270;
const COMMA_GAP_MS = 390;
const SENTENCE_GAP_MS = 560;
const TAIL_PAD_MS = 160;
const HIGHLIGHT_HOLD_MS = 110;

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
  const threshold = 0.01;
  let start = 0;
  while (start < samples.length && Math.abs(samples[start]) < threshold) {
    start += 1;
  }
  let end = samples.length - 1;
  while (end > start && Math.abs(samples[end]) < threshold) {
    end -= 1;
  }
  const padSamples = Math.floor(sampleRate * 0.03);
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

function slugWord(raw) {
  return raw.toLowerCase().replace(/[^a-z]/g, '');
}

async function main() {
  fs.mkdirSync(storiesAudioDir, { recursive: true });
  fs.mkdirSync(storyWordsDir, { recursive: true });
  fs.mkdirSync(path.dirname(catalogOutPath), { recursive: true });

  const uniqueWords = new Set();
  for (const story of STORY_SCRIPTS) {
    for (const text of story.pages) {
      for (const token of text.trim().split(/\s+/)) {
        const clean = slugWord(token);
        if (clean) uniqueWords.add(clean);
      }
    }
  }

  const sortedWords = Array.from(uniqueWords).sort();
  console.log(
    `Synthesizing ${sortedWords.length} calm K1 words via Kokoro (af_heart, speed 0.80) and stitching 48 sample-accurate pages...`,
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

  /** @type {Map<string, { pcm: Int16Array, sampleRate: number }>} */
  const wordBuffers = new Map();
  let sampleRate = 24000;
  let totalBytes = 0;

  for (let i = 0; i < sortedWords.length; i += 1) {
    const word = sortedWords[i];
    const spoken = word === 'a' ? 'uh.' : `${word}.`;
    const audio = await tts.generate(spoken, {
      voice: 'af_heart',
      speed: 0.8,
    });
    sampleRate = audio.sampling_rate;
    const pcm = trimAndNormalizeFloat32(audio.audio, sampleRate);
    wordBuffers.set(word, { pcm, sampleRate });

    // Save individual word MP3 for tap-to-hear
    const wordMp3 = encodeMonoMp3(Mp3Encoder, pcm, sampleRate, 64);
    fs.writeFileSync(path.join(storyWordsDir, `${word}.mp3`), wordMp3);
    totalBytes += wordMp3.length;

    if ((i + 1) % 25 === 0 || i === sortedWords.length - 1) {
      console.log(`  [Word ${i + 1}/${sortedWords.length}] ${word}.mp3 (${Math.round((pcm.length / sampleRate) * 1000)}ms)`);
    }
  }

  const pages = {};
  const leadSamples = Math.round((LEAD_IN_MS / 1000) * sampleRate);
  const tailSamples = Math.round((TAIL_PAD_MS / 1000) * sampleRate);

  for (const story of STORY_SCRIPTS) {
    const storyDir = path.join(storiesAudioDir, story.id);
    fs.mkdirSync(storyDir, { recursive: true });

    story.pages.forEach((text, idx) => {
      const pageNum = idx + 1;
      const key = `${story.id}/page-${pageNum}`;
      const tokens = text.trim().split(/\s+/).filter(Boolean);

      // Measure total PCM length and exact sample offsets
      const segments = [];
      let cursorSamples = leadSamples;

      tokens.forEach((token, tIdx) => {
        const clean = slugWord(token);
        const entry = wordBuffers.get(clean);
        if (!entry) {
          throw new Error(`Missing word buffer for "${clean}" in ${key}`);
        }
        const startSample = cursorSamples;
        const endSample = startSample + entry.pcm.length;
        cursorSamples = endSample;

        const isLast = tIdx === tokens.length - 1;
        let gapMs = 0;
        if (!isLast) {
          if (/[.!?]$/.test(token)) {
            gapMs = SENTENCE_GAP_MS;
          } else if (token.endsWith(',')) {
            gapMs = COMMA_GAP_MS;
          } else {
            gapMs = WORD_GAP_MS;
          }
          cursorSamples += Math.round((gapMs / 1000) * sampleRate);
        }

        segments.push({
          word: token,
          pcm: entry.pcm,
          startSample,
          endSample,
          gapMs,
        });
      });

      const totalSamples = cursorSamples + tailSamples;
      const stitched = new Int16Array(totalSamples);
      for (const seg of segments) {
        stitched.set(seg.pcm, seg.startSample);
      }

      const durationMs = Math.round((totalSamples / sampleRate) * 1000);
      const words = segments.map((seg, sIdx) => {
        const rawStartMs = Math.round((seg.startSample / sampleRate) * 1000);
        const rawEndMs = Math.round((seg.endSample / sampleRate) * 1000);
        const nextStartMs =
          sIdx < segments.length - 1
            ? Math.round((segments[sIdx + 1].startSample / sampleRate) * 1000)
            : durationMs;
        // Keep highlight lit cleanly into the trailing breath so short words like "a"/"is" feel super clear
        const holdEndMs = Math.min(nextStartMs, rawEndMs + HIGHLIGHT_HOLD_MS);
        return {
          word: seg.word,
          startMs: sIdx === 0 ? 0 : rawStartMs,
          endMs: sIdx === segments.length - 1 ? durationMs : holdEndMs,
        };
      });

      const mp3Buffer = encodeMonoMp3(Mp3Encoder, stitched, sampleRate, 64);
      fs.writeFileSync(path.join(storyDir, `page-${pageNum}.mp3`), mp3Buffer);
      totalBytes += mp3Buffer.length;

      pages[key] = {
        audioPath: `audio/stories/${story.id}/page-${pageNum}.mp3`,
        durationMs,
        words,
      };
    });

    console.log(
      `  [Story] ${story.id}: 8 pages stitched (page 1 = ${pages[`${story.id}/page-1`].durationMs}ms)`,
    );
  }

  fs.writeFileSync(
    catalogOutPath,
    `${JSON.stringify({ pages, wordSlugs: sortedWords }, null, 2)}\n`,
    'utf8',
  );
  console.log(`Done! Generated sample-accurate K1 story audio (${(totalBytes / 1024).toFixed(1)} KB total).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
