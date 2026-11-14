# Pebble Technical Architecture

## Stack Overview

- **Framework:** React 19 + TypeScript (`strict` mode, `noUnusedLocals`, `noUnusedParameters`)
- **Bundler:** Vite 6 with `base: './'` (`vite.config.ts`) so static builds work cleanly at root (`/`) and subpaths (`/pebble/` on GitHub Pages)
- **Styling:** Plain modular CSS variables and utility classes (`src/styles/tokens.css`), zero runtime CSS-in-JS dependencies
- **Storage:** Client-only `localStorage` under `pebble.family.v1` with schema sanitization (`src/context/FamilyProfilesContext.tsx`)
- **Audio:** Zero-asset synthesized chimes via the Web Audio API (`src/games/memory-match/soundEffects.ts`)

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
│   ├── avatars/                # 6 family avatar 512x512 PNGs
│   ├── hub/                    # 3 hub illustration 512x512 PNGs
│   ├── themes/
│   │   ├── lion-king/          # 16 character 512x512 PNGs
│   │   ├── kung-fu-panda/      # 16 character 512x512 PNGs
│   │   └── paw-patrol/         # 16 character 512x512 PNGs
│   └── manifest.webmanifest
├── scripts/
│   └── release.sh              # Build, commit, annotated tag, push main --follow-tags
├── src/
│   ├── components/             # BrandLogo, ConfettiBurst, WinnerModal
│   ├── context/                # FamilyProfilesContext (validated localStorage state)
│   ├── games/
│   │   ├── registry.ts         # Hub game catalog
│   │   └── memory-match/       # themes.ts, soundEffects.ts, MemorySetup.tsx, MemoryBoard.tsx
│   ├── pages/                  # GameHubPage.tsx, FamilyProfilesPage.tsx
│   ├── styles/tokens.css
│   └── utils/assets.ts         # BASE_URL-aware assetUrl helper
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

## Portrait Viewport Fitting (`ResizeObserver`)

To guarantee zero vertical scrolling at `768 × 1024` (and across any window aspect ratio), `.app-shell--board` locks height to `100dvh` (`overflow: hidden`) while `.board-stage` claims remaining flex height (`flex: 1; min-height: 0`). A `ResizeObserver` measures `.board-stage` dimensions and solves for the largest `(cardW, cardH)` satisfying:
- `cardW / cardH = 2.5 / 3.5`
- `cols * cardW + (cols - 1) * gap <= stageWidth`
- `rows * cardH + (rows - 1) * gap <= stageHeight`

This allows tall playing cards for `4 × 4`, `4 × 5` (default), and `5 × 6` grids without overflowing the viewport.

## Adding a New Theme or Game

1. **New Memory Theme:** Add 16 PNGs (`512 × 512`) under `public/themes/<theme-id>/` and register a `ThemeSpec` entry in `CARD_THEMES` (`src/games/memory-match/themes.ts`).
2. **New Game Module:** Add files under `src/games/<game-id>/`, add metadata to `GAME_REGISTRY` (`src/games/registry.ts`), and wire the screen route in `src/App.tsx`.

## Security Controls

- **Strict CSP (`index.html`):** Disallows inline scripts, third-party script origins, `object-src`, and external `connect-src`.
- **XSS-Safe Rendering:** Pure JSX text interpolation; no `innerHTML` or `dangerouslySetInnerHTML`.
- **Storage Validation (`FamilyProfilesContext.tsx`):** Reads from `localStorage` validate array bounds, profile ID format, avatar allow-list, accent color allow-list, and strip control characters (`<= 24` chars).
- **Local Binding:** `vite` and `vite preview` bind strictly to `127.0.0.1`.
