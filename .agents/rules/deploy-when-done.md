---
trigger: always_on
---

# Mandatory Auto-Deploy Rule (Pebble)

Whenever a feature, content update, UI refinement, or bugfix in Pebble (`/Users/aqel/Documents/dev/pebble`) is completed and verified locally:

1. **Verify locally & capture end-to-end visual evidence first:**
   - Run `npm run build` (`tsc --noEmit && vite build`).
   - Run an interactive **`768 × 1024`** portrait tablet end-to-end verification against `npx vite preview --host 127.0.0.1 --port <PORT>` using Playwright (`scripts/visual-verify-helper.mjs`) and/or `/browser`.
   - **Mandatory End-to-End Screenshots & Video (`walkthrough.md`):** At the end of every verification, capture crisp `768 × 1024` PNG screenshots of each key end-to-end state **plus** a `.webm` video recording directly into `<appDataDir>/brain/<conversation-id>/`, visually inspect the captured screenshots, and present them in a user-facing `walkthrough.md` artifact (`![caption](/absolute/path.webm)` + screenshot carousel) so the user can inspect the feature working end-to-end.
2. **Always deploy automatically once done** (do not wait for the user to ask):
   - Bump `"version"` in `package.json` appropriately for the release.
   - Run `./scripts/release.sh vX.Y.Z-<slug> "<concise summary>"` to build, commit, create an annotated tag, and push `main --follow-tags` to `origin` (`git@github.com:aqelkp/pebble.git`).
   - This triggers `.github/workflows/deploy.yml` (GitHub Pages at `https://aqelkp.github.io/pebble/`) and `.github/workflows/release.yml` (GitHub Releases).
   - Verify that the GitHub Actions Pages deployment workflow completes with `conclusion: "success"` and `https://aqelkp.github.io/pebble/` serves `HTTP/2 200`.
