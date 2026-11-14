---
trigger: always_on
---

# Mandatory Auto-Deploy Rule (Pebble)

Whenever a feature, content update, UI refinement, or bugfix in Pebble (`/Users/aqel/Documents/dev/pebble`) is completed and verified locally:

1. Verify locally first:
   - Run `npm run build` (`tsc --noEmit && vite build`).
   - Verify interactively at `768 × 1024` portrait viewport using `/browser` against `npm run preview` (`http://127.0.0.1:4173/`).
2. **Always deploy automatically once done** (do not wait for the user to ask):
   - Bump `"version"` in `package.json` appropriately for the release.
   - Run `./scripts/release.sh vX.Y.Z-<slug> "<concise summary>"` to build, commit, create an annotated tag, and push `main --follow-tags` to `origin` (`git@github.com:aqelkp/pebble.git`).
   - This triggers `.github/workflows/deploy.yml` (GitHub Pages at `https://aqelkp.github.io/pebble/`) and `.github/workflows/release.yml` (GitHub Releases).
   - Verify that the GitHub Actions Pages deployment workflow completes with `conclusion: "success"` and `https://aqelkp.github.io/pebble/` serves `HTTP/2 200`.
