# Pebble Technical Architecture

## Stack Overview

- **Framework:** React 19 + TypeScript (`strict` mode, `noUnusedLocals`, `noUnusedParameters`)
- **Bundler:** Vite 6 with `base: './'` (`vite.config.ts`) so static builds work cleanly at root (`/`) and subpaths (`/pebble/` on GitHub Pages)
- **Styling:** Plain modular CSS variables and utility classes (`src/styles/tokens.css`), zero runtime CSS-in-JS dependencies
- **Storage:** Client-only `localStorage` under `pebble.family.v1`, `pebble.journey.v1`, `pebble.daily-limit.v1` (silent 20-minute default daily screen-time tracker customizable to 1–180 min or Off across `ParentJourneySettingsPage` and `ParentInsightsPage`, with local-midnight rollover in `src/utils/dailyPlayLimit.ts`), `pebble.letter-train.mastery.v1`, and `pebble.letter-river.mastery.v1` with schema sanitization (`src/context/FamilyProfilesContext.tsx`), plus `sessionStorage` active-game recovery (`pebble.nav.v1`, `pebble.memory.active.v1`, `pebble.letter-train.active.v1`, `pebble.letter-river.active.v1`, `pebble.safari.active.v1`, `pebble.wordfun.active.v1`)
- **Audio & Word Bank:** Synthesized Web Audio feedback chimes plus bundled offline Kokoro TTS MP3 speech clips (`public/audio/letters/*.mp3`, `public/audio/words/*.mp3`) driven from a single source-of-truth catalog (`src/data/wordCatalog.json` + `src/data/wordBank.ts`) via `src/utils/wordAudio.ts`, with silent Setup/lookahead prefetching and `speechSynthesis` fallback (`src/games/memory-match/soundEffects.ts`, `src/games/letter-train/trainSounds.ts`, `src/games/letter-river/riverSounds.ts`, `src/games/number-safari/safariSounds.ts`, `src/games/word-fun/wordSounds.ts`)
- **PWA Offline Cache:** `public/sw.js` (registered in `src/main.tsx` for production builds) caches visited audio, images, and app assets (`pebble-assets-v1`) so replay and offline sessions work without loading screens

## Directory Layout

```text
pebble/
├── .github/workflows/
│   ├── deploy.yml              # Build & deploy dist/ to GitHub Pages on push to main
│   └── release.yml             # Build & publish GitHub Release tarball on v* tags
├── docs/
│   ├── ARCHITECTURE.md
│   └── BRAND_AND_DESIGN.md
├── public/
│   ├── audio/
│   │   ├── letters/            # 26 spoken letter MP3 clips (a.mp3 - z.mp3)
│   │   ├── ui/                 # Bundled UI voice clips (think-again, mistake explanations, daily-time-over.mp3)
│   │   └── words/              # 173 spoken word MP3 clips synced from wordCatalog.json
│   ├── avatars/                # 6 family avatar 512x512 PNGs
│   ├── hub/                    # 8 hub illustration 512x512 PNGs (memory-match, letter-train, letter-river, picture-sudoku, number-safari, word-fun, rescue-road, sticker-jigsaw)
│   ├── themes/
│   │   ├── lion-king/          # 16 character 512x512 PNGs
│   │   ├── kung-fu-panda/      # 16 character 512x512 PNGs
│   │   ├── paw-patrol/         # 16 character 512x512 PNGs
│   │   ├── toy-story/          # 16 character 512x512 PNGs
│   │   ├── cars/               # 16 character 512x512 PNGs
│   │   ├── tom-and-jerry/      # 16 character 512x512 PNGs
│   │   ├── sports/             # 16 equipment 512x512 PNGs
│   │   ├── fruits/             # 16 fruit 512x512 PNGs
│   │   ├── vegetables/         # 16 vegetable 512x512 PNGs
│   │   └── car-logos/          # 16 automotive emblem 512x512 PNGs
│   ├── manifest.webmanifest
│   └── sw.js                   # Production PWA service worker (cache-first static assets)
├── scripts/
│   ├── release.sh              # Build, commit, annotated tag, push main --follow-tags
│   ├── sync-word-audio.mjs     # Incremental Kokoro TTS -> MP3 generator for wordCatalog.json
│   └── visual-verify-helper.mjs # Playwright 768x1024 screenshot & WebM video helper
├── src/
│   ├── components/             # BrandLogo, ConfettiBurst, DailyLimitParentControl, DailyTimeOverScreen, GameLoadingFallback, GameStage, LeaveGameModal, WinnerModal
│   ├── context/                # FamilyProfilesContext (validated localStorage state)
│   ├── data/                   # wordCatalog.json + wordBank.ts (single source of truth)
│   ├── engine/                 # Shared micro-toolkit: useStageSize, solveGridFit, useGameLoop, usePointerStroke
│   ├── games/
│   │   ├── registry.ts         # Hub game catalog, Hub shelves, and GameId allow-list
│   │   ├── gameConfigs.ts      # Pure config validators & defaults (no heavy component imports)
│   │   ├── plugins.tsx         # Lazy React.lazy game plugin registry & chunk preloader
│   │   ├── letter-river/       # riverData.ts, riverSounds.ts, LetterRiverSetup.tsx, LetterRiverBoard.tsx
│   │   ├── letter-train/       # letterData.ts, WordIllustration.tsx, trainSounds.ts, LetterTrainSetup.tsx, LetterTrainBoard.tsx
│   │   ├── memory-match/       # themes.ts, memoryStats.ts, soundEffects.ts, MemorySetup.tsx, MemoryBoard.tsx, MemoryRecordsModal.tsx
│   │   ├── number-safari/      # safariData.ts, safariSounds.ts, SafariSetup.tsx, SafariBoard.tsx
│   │   ├── picture-sudoku/     # sudokuEngine.ts, sudokuSounds.ts, PictureSudokuSetup.tsx, PictureSudokuBoard.tsx
│   │   ├── rescue-road/        # roadEngine.ts, roadSounds.ts, RescueRoadSetup.tsx, RescueRoadBoard.tsx
│   │   ├── sticker-jigsaw/     # jigsawEngine.ts, jigsawSounds.ts, StickerJigsawSetup.tsx, StickerJigsawBoard.tsx
│   │   └── word-fun/           # wordBank.ts, WordFunArt.tsx, wordSounds.ts, WordFunSetup.tsx, WordFunBoard.tsx
│   ├── pages/                  # ActivityBookPage, GameHubPage, FamilyProfilesPage, ParentInsightsPage, ParentJourneySettingsPage
│   ├── styles/tokens.css
│   └── utils/                  # assets.ts (BASE_URL-aware), wordAudio.ts (MP3 playback & prefetcher)
├── AGENTS.md                   # Auto-discovered workspace instructions
├── index.html                  # Strict CSP + Google Fonts (Fredoka, Google Sans)
└── vite.config.ts
```

## Memory Match Game State Machine (`MemoryBoard.tsx`)

Turn phases prevent race conditions from rapid multi-finger taps:
- `'idle'`: Up to 2 face-down unmatched cards may be tapped.
- `'resolving-match'`: Second card matched first card's `pairId`. Increments active player's score by `1`, fires `ConfettiBurst` + `playMatchSound`, locks clicks briefly (`~760ms`), then returns to `'idle'` keeping **`currentPlayerIdx` unchanged** (extra turn rule), or transitions to `'finished'` after the final pair (`playWinSound`).
- `'resolving-mismatch'`: Briefly displays both cards (`~950ms`) with a gentle mismatch notice (`playMismatchSound`), then flips both back face-down and advances `currentPlayerIdx = (currentPlayerIdx + 1) % players.length`.
- `'finished'`: Renders `WinnerModal` with full `PTS` rankings.

All active timeouts are stored in `timeoutRef` and cleared on unmount or board restart.

## Number Safari Game State Machine (`SafariBoard.tsx`)

Interactive tap-to-count and early-math state machine across 3 modes (`Meadow Count 1–5`, `Savanna Trail 1–10`, `Safari Sums Add to 10`):
- `'idle'`: Active explorer taps individual savanna animals to assign sequential `1..N` count badges (playing an ascending C-major marimba scale) and picks a tactile number block (`1–5` or `1–10`).
- `'resolving-correct'`: Selected block matches `currentStop.answer`. Reveals `1..N` badges across all animals, increments active player's score by `+1`, fires `ConfettiBurst` + `playSafariCorrectSound`, and advances to the next stop and next explorer (`(currentPlayerIdx + 1) % players.length`), or transitions to `'finished'` after the final stop.
- `'resolving-wrong'`: Marks the tried number block disabled for the current stop (`playSafariTryAgainSound`). In multiplayer, passes the turn to the next explorer on the same clearing; in solo mode, returns to `'idle'` without penalty.
- `'finished'`: Renders `WinnerModal` with full `PTS` rankings.

## Portrait Viewport Fitting (`ResizeObserver`)

To guarantee zero vertical scrolling at `768 × 1024` (and across any window aspect ratio), `.app-shell--board` locks height to `100dvh` (`overflow: hidden`) while `.board-stage` claims remaining flex height (`flex: 1; min-height: 0`). A `ResizeObserver` measures `.board-stage` dimensions and solves for the largest `(cardW, cardH)` satisfying:
- `cardW / cardH = 2.5 / 3.5`
- `cols * cardW + (cols - 1) * gap <= stageWidth`
- `rows * cardH + (rows - 1) * gap <= stageHeight`

This allows tall playing cards for `4 × 4`, `4 × 5` (default), and `5 × 6` grids without overflowing the viewport.

## Adding a New Theme or Game

1. **New Memory Theme:** Add 16 PNGs (`512 × 512`) under `public/themes/<theme-id>/` and register a `ThemeSpec` entry in `CARD_THEMES` (`src/games/memory-match/themes.ts`).
2. **New Game Module (Plugin Flow — Zero `src/App.tsx` Edits):**
   1. Create Setup and Board components under `src/games/<game-id>/`, reusing Pebble's shared micro-toolkit (`src/engine/useStageSize.ts` + `solveGridFit`, `src/engine/useGameLoop.ts`, `src/engine/usePointerStroke.ts`, and `src/components/GameStage.tsx`).
   2. Add the new `GameId`, metadata, and `shelf` (`letters-words`, `numbers-logic`, `draw-create`, or `fun-rewards`) to `GAME_REGISTRY` in `src/games/registry.ts`.
   3. Add the game's pure config validator and default builder to `src/games/gameConfigs.ts` (keeping imports type-only for TSX files so Vite splits every Setup/Board into independent lazy chunks).
   4. Register the lazy `Setup`/`Board` plugin, `activeSessionStorageKey`, and `leaveCopy` in `GAME_PLUGINS` inside `src/games/plugins.tsx` (plus a Guided Activity Book adapter in `src/journey/lessonRegistry.ts` when included in the curriculum).

## Security Controls

- **Strict CSP (`index.html`):** Disallows inline scripts, third-party script origins, `object-src`, and external `connect-src`.
- **XSS-Safe Rendering:** Pure JSX text interpolation; no `innerHTML` or `dangerouslySetInnerHTML`.
- **Storage Validation (`FamilyProfilesContext.tsx`):** Reads from `localStorage` validate array bounds, profile ID format, avatar allow-list, accent color allow-list, and strip control characters (`<= 24` chars).
- **Local Binding:** `vite` and `vite preview` bind strictly to `127.0.0.1`.

## End-to-End Visual Verification (`768 × 1024`)

- `scripts/visual-verify-helper.mjs` wraps Playwright (`playwright` + Playwright `ffmpeg` driving local Google Chrome when present) with a strict `http://127.0.0.1:<PORT>` guard, `768 × 1024` portrait viewport (`deviceScaleFactor: 2`), `waitForFontsAndImages()`, `assertZeroVerticalScroll()`, `captureScreenshot()`, and `finishAndSaveVideo()`.
- Verification runs output step-by-step `.png` screenshots and a `.webm` walkthrough video directly into the active conversation's artifact directory so every change is reviewed visually before release.

## Letter River Module (`src/games/letter-river/`)

- **Learning Hypothesis:** Connecting spoken word recognition (`Sound First` by default) to active multi-bucket phonics sorting helps early readers (ages 4–7) discriminate competing initial phonemes (such as `B / D / P` or `M / N`) rather than passively tapping the only letter on screen.
- **Playfulness Asymmetry (`LetterRiverBoard.tsx`, `riverSounds.ts`):**
  - Correct bucket drops drive high-reward celebration: SVG splash crown + droplets, bucket squash-and-bounce, rising water level (`1/3 -> 2/3 -> 3/3`), floating uppercase-highlighted word reveal badge, ascending marimba splash audio, spoken cheer, 4-catch streak Golden River Fish (`2×` catch, `+3 PTS`), and full `ConfettiBurst` when a bucket reaches `3/3` and slides in the next letter.
  - Wrong bucket drops stay intentionally calm (`180ms` `3px` nudge, soft single low tap at low gain, gentle phonics redirect hint, fish returns smoothly to stream).
- **Architecture:** `60fps` `requestAnimationFrame` horizontal river loop updating fish DOM transforms directly via refs (`fishDomRefs`) with dual pointer-drag and tap-to-hook + tap-bucket accessibility, plus bounded `sessionStorage` resume (`pebble.letter-river.active.v1`) and `localStorage` mastery persistence (`pebble.letter-river.mastery.v1`).
