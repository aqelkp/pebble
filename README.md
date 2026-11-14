# Pebble

A calm, tactile, child-friendly learning game hub designed for portrait tablets (`768 × 1024`) and family play together.

**Live App (GitHub Pages):** `https://aqelkp.github.io/pebble/`

## Features

- **Pebble Game Hub:** Clean, screen-safe Alabaster & Warm Indigo interface with personalized family greeting and modular game catalog (`Memory Match`, plus upcoming `Number Safari` and `Word Fun`).
- **Family Profiles (`localStorage`):** Customize player names (`1–6` profiles) and choose from 6 bespoke illustrated avatars right on the tablet. Zero personal data leaves your device.
- **Memory Match:**
  - **3 Illustrated Themes (48 custom 512×512 PNGs):** Lion King (default), Kung Fu Panda, and PAW Patrol.
  - **Portrait-First Layouts:** **`4 × 5` (5 rows vertically = 20 cards, Default)**, `4 × 4` (16 cards), and `5 × 6` (30 cards).
  - **Multi-Player Scoreboard & Celebration:** Prominent `PTS` counters, active turn highlights, Sage Mint `MATCH! +1 POINT` banner, confetti burst, Web Audio chimes (with mute toggle), extra turn on match, and end-of-game Winner Announcement modal.

## Local Development

```bash
npm install
npm run dev      # http://127.0.0.1:5173/
npm run build    # Type-checks and builds into dist/
npm run preview  # Serves production build at http://127.0.0.1:4173/
```

> **Note for macOS (`nvm`):** If Node `v24.x` is blocked by macOS code signing on your machine, use Node 22: `export PATH="/Users/aqel/.nvm/versions/node/v22.12.0/bin:$PATH"`.

## Snapshotting, Deployment & Releases

- **GitHub Pages (Auto-Deploy on `main`):** `.github/workflows/deploy.yml` builds and publishes `dist/` automatically whenever changes land on `main`. *(One-time repository setup: ensure **Settings → Pages → Source** is set to **GitHub Actions**.)*
- **GitHub Releases (Auto-Release on `v*` tags):** `.github/workflows/release.yml` creates a versioned GitHub Release and attaches a production `dist` archive whenever a `v*` tag is pushed.
- **One-Command Release Helper:**

```bash
./scripts/release.sh v0.1.0-memory-match "feat: initial release of Pebble Memory Match"
```

## Documentation for Developers & Agents

- [AGENTS.md](AGENTS.md) — Workspace branding, typography, security, and verification guidelines (auto-loaded by Antigravity)
- [docs/BRAND_AND_DESIGN.md](docs/BRAND_AND_DESIGN.md) — Color tokens, typography scale, and component anatomy
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Module layout, turn state machine, and extension guide
