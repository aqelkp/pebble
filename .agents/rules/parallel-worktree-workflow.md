---
trigger: always_on
---

# Parallel Branch & Worktree Workflow (Pebble)

To allow multiple conversations and experiments to run in parallel without file or port conflicts:

1. **Create an Isolated Branch & Worktree (Inside `.worktrees/`):**
   - Whenever starting a new feature, experiment, or bugfix, create a dedicated branch and gitignored worktree inside `.worktrees/<slug>` (never outside `/Users/aqel/Documents/dev/pebble`, so file edits stay within the workspace boundary):
     ```bash
     git worktree add .worktrees/<slug> -b feat/<slug>
     ```
   - Make all edits inside `.worktrees/<slug>` (do not edit `main` directly in `/Users/aqel/Documents/dev/pebble` while parallel work is active).
   - Reuse dependencies quickly in the worktree via `ln -s /Users/aqel/Documents/dev/pebble/node_modules .worktrees/<slug>/node_modules` (or `npm ci` inside `.worktrees/<slug>` if `package-lock.json` changes).

2. **Build & Preview on a Dedicated Port:**
   - Run `npm run build` (`tsc --noEmit && vite build`) inside `.worktrees/<slug>`.
   - Start preview on an unused port (check `4173` first, or use `4174`, `4175`, … if another session is using `4173`):
     ```bash
     npx vite preview --host 127.0.0.1 --port <PORT>
     ```
   - Verify interactively at **`768 × 1024`** portrait viewport using `/browser` against `http://127.0.0.1:<PORT>/`.

3. **Merge to `main` Before Deploying:**
   - Commit the verified changes on `feat/<slug>`.
   - In `/Users/aqel/Documents/dev/pebble` (`main`), merge `feat/<slug>` into `main`.
   - Clean up the worktree and temporary branch (`rm -f .worktrees/<slug>/node_modules && git worktree remove .worktrees/<slug>` and `git branch -d feat/<slug>`).
   - Proceed with `.agents/rules/deploy-when-done.md` (bump `package.json` version and run `./scripts/release.sh`).
