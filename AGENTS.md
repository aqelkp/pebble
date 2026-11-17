# Pebble — Workspace Agent & Engineering Guide

Pebble is a calm, tactile, screen-safe family learning web app designed primarily for a **portrait (vertical) tablet (`768 × 1024`)**, while remaining responsive across phones and desktop browsers.

## 1. Non-Negotiable Brand & Visual Rules

- **Original Brand Only:** The product name is **Pebble**, represented by three stacked organic river pebbles (`<PebbleMark />` in `src/components/BrandLogo.tsx`):
  - Top pebble: Sage Mint (`#3BA99C`)
  - Middle pebble: Soft Coral (`#F27A5E`)
  - Bottom pebble: Warm Indigo (`#5B5BD6`)
- **Zero Forbidden Marks:** Strictly **zero** Google/Gemini logos, 4-dot marks, or 4-point sparkle stars anywhere in UI SVGs, card backs, icons, or confetti. Confetti uses only circles, rounded river pebbles, and soft ribbons (`src/components/ConfettiBurst.tsx`).
- **Typography Hierarchy (`src/styles/tokens.css`):**
  - `--font-display` (**Fredoka** `500/600/700`): Brand wordmark, headings, section headers, player names, prominent `PTS` numbers, match banners, and primary pill buttons.
  - `--font-sans` (**Google Sans** `400/500`): Subtitles, descriptions, helper copy, badges, and utility controls.
- **Color Palette (`src/styles/tokens.css`):**
  - Canvas background: Warm Alabaster `#F7F5F0`
  - Card surfaces: Pure White `#FFFFFF`
  - Primary CTA & active turn accent: Warm Indigo `#5B5BD6` (`#ECEBFF` soft tint)
  - Match & success celebration: Sage Mint `#3BA99C` (`#E4F6F3` tint)
  - Secondary coral highlight: Soft Coral `#F27A5E`
  - Winner crown & trophy highlight: Warm Honey `#F2B84B`
  - Text: `#1E2433` primary, `#5C6478` secondary

## 2. Privacy & Personalization Rule

- **Never hardcode personal or child names** in source code, defaults, or checked-in docs.
- Default profiles in `src/context/FamilyProfilesContext.tsx` must stay generic (`Child`, `Dad`, `Mom`, `Uncle`) and are stored solely in browser `localStorage` (`pebble.family.v1`).
- On the Game Hub (`src/pages/GameHubPage.tsx`), show `"Welcome to Pebble!"` when Profile 1 has the default `'Child'` name, and dynamically display `"Welcome, <Name>!"` once personalized.

## 3. Gameplay & Portrait Tablet Standards

- **Memory Match Defaults (`src/games/memory-match/themes.ts`):**
  - Default theme: **Lion King** (`10` total themes across Stories and World & Sports: Lion King, Kung Fu Panda, PAW Patrol, Toy Story, Cars, Tom & Jerry, Sports, Fruits, Vegetables, Car Logos)
  - Default layout: **`4 × 5` (4 columns across × 5 rows vertically = 20 cards / 10 pairs)**
  - Default players: First 2 saved family profiles (`1–4` players supported)
- **Tall Playing Cards & Full-Height Stage:**
  - Cards always keep a **`2.5 : 3.5` portrait playing-card aspect ratio** and dynamically scale via `ResizeObserver` in `src/games/memory-match/MemoryBoard.tsx` so the entire board (`4×4`, `4×5`, `5×6`) fits cleanly inside `100dvh` with **zero vertical scrolling** on `768×1024`.
- **Prominent Points & Celebration Feedback:**
  - Top Scoreboard HUD uses high-contrast `PTS` tiles (`1.65rem` Fredoka 700) on every player card, plus an active `"YOUR TURN"` badge.
  - Matching a pair awards **+1 point**, triggers a fixed-height `MATCH! +1 POINT` Sage Mint banner, card aura pulse, confetti burst, Web Audio chime, and grants the **same player an extra turn**.
  - Completing all pairs opens `WinnerModal` announcing `"<Name> Wins!"`, `"It's a Tie!"`, or `"Great Job, <Name>!"` for 1-player mode.

## 4. Coding, Asset & Security Conventions

- **Asset Paths:** All assets in `public/` (512×512 PNGs under `public/avatars/`, `public/hub/`, `public/themes/`) must be referenced with `assetUrl(...)` (`src/utils/assets.ts`) so `./` relative Vite builds work on both `127.0.0.1` and `https://aqelkp.github.io/pebble/`.
- **Web Security:** Follow `index.html` strict CSP. Never use `dangerouslySetInnerHTML`, `innerHTML`, `alert()`, `confirm()`, or `prompt()`. Sanitize and bound all `localStorage` profile data. Bind dev/preview servers strictly to `127.0.0.1`.
- **Extending Games, Child-Design & Learning Journey Rules (`.agents/rules/child-game-design.md`, `.agents/rules/learning-journey-updates.md`):** Add new games in `src/games/<game-id>/` and register metadata in `src/games/registry.ts`. Before designing or coding any new game (or changing rewards/failure feedback), read `docs/CHILD_GAME_DESIGN.md` and satisfy its checklist (Learning Hypothesis, Child-First Sensory Rewards vs. Parent Metrics, Playfulness Asymmetry, Teach-First Delayed Pause Consequences — explain mistake on board before `ThinkAgainOverlay`, Rotating Content, Bundled Audio, Dual Input, and PWA Back Guard). Whenever adding a new game or new pack/mode to an existing game, follow `.agents/rules/learning-journey-updates.md` so Guided Activity Book lessons (`src/journey/lessonRegistry.ts`) stay updated: preserve `completedSnapshots`, induct new games gently via `pendingIntroGames` (`gameOrdinal === 0` starter rule), and only bump `CURRENT_JOURNEY_EPOCH` for explicit Tier C cohort resets. See `docs/ARCHITECTURE.md` and `docs/BRAND_AND_DESIGN.md` for full technical/brand details.

## 5. Build, Verification & Mandatory Auto-Deploy Workflow

- **Node Toolchain on macOS:** Use the signed Node 22 binary (`export PATH="/Users/aqel/.nvm/versions/node/v22.12.0/bin:$PATH"`) if `v24.16.0` lacks macOS code signing on this machine.
- **Parallel Branch & Worktree Workflow (`.agents/rules/parallel-worktree-workflow.md`):**
  1. Start new features/fixes in a dedicated branch and gitignored worktree inside `.worktrees/<slug>` (`git worktree add .worktrees/<slug> -b feat/<slug>`) so parallel sessions don't collide and all edits stay inside the workspace root.
  2. Run `npm run build` (`tsc --noEmit && vite build`) in `.worktrees/<slug>`, serve with `npx vite preview --host 127.0.0.1 --port <PORT>` on an unused port (`4173` if free, otherwise `4174`, `4175`, …), and verify interactively at **`768 × 1024`** portrait viewport using `scripts/visual-verify-helper.mjs` (and/or `/browser`).
  3. Merge the verified branch into `main` and clean up the worktree (`rm -f .worktrees/<slug>/node_modules && git worktree remove .worktrees/<slug>`) before deploying.
- **End-to-End Visual Evidence (`walkthrough.md` with Screenshots & Video):**
  1. Every feature, content update, UI refinement, or bugfix verification must drive the real built app end-to-end at **`768 × 1024`** portrait viewport against `http://127.0.0.1:<PORT>/` using `scripts/visual-verify-helper.mjs`.
  2. Assert zero vertical scrolling (`scrollHeight <= 1024`) on full-height gameplay boards (`MemoryBoard`, etc.) and verify images/fonts load cleanly.
  3. Save step-by-step `.png` screenshots and an end-to-end `.webm` video recording into `<appDataDir>/brain/<conversation-id>/`, inspect the screenshots, and present the video and screenshots in a user-facing `walkthrough.md` artifact at the end of verification.
- **Mandatory Auto-Deploy Once Done (`.agents/rules/deploy-when-done.md`):**
  1. Bump `"version"` in `package.json` appropriately for the change on `main`.
  2. Always run `./scripts/release.sh vX.Y.Z-<slug> "<release summary>"` automatically as soon as work is done, verified locally, and merged to `main` (never wait for the user to ask). This builds, commits, creates an annotated tag, and pushes `main --follow-tags` to `origin`, triggering both GitHub Pages deployment (`.github/workflows/deploy.yml`) and GitHub Releases (`.github/workflows/release.yml`).
  3. Verify the `Deploy Pebble to GitHub Pages` GitHub Actions run completes with `conclusion: "success"` and `https://aqelkp.github.io/pebble/` serves `HTTP/2 200`.
