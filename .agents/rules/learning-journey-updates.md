# Learning Journey & New Game Rollout Strategy (Pebble)

Whenever adding a **new game**, adding a **new mode/content pack** to an existing game, or updating **Guided Activity Book (`src/journey/`)** lessons in Pebble, follow this non-destructive 3-Tier Update Strategy so active learners never have completed chapters scrambled or get dropped into advanced difficulty on a brand-new game.

## 1. Core Architectural Invariants (`src/journey/`)

1. **Freeze Past, Refresh Future (`completedSnapshots`):**
   - `markJourneyActivityCompleted` (`src/journey/journeyStorage.ts`) records an allow-list-validated `CompletedSlotSnapshot` (`{ gameId, gameOrdinal, lettersCovered }`) for each completed slot index (`0..399`).
   - `buildJourneyCurriculum` (`src/journey/curriculum.ts`) reconstructs completed indices from `completedSnapshots` first, so adding new games or rebalancing pillar weights **never rewrites or shifts activities a child has already completed**.
2. **Gentle Welcome Induction Queue (`pendingIntroGames`):**
   - `reconcileJourneyProgress` (`src/journey/journeyStorage.ts`) compares `GAME_REGISTRY` against the learner's saved `settings.knownGames`.
   - When a returning learner (`currentActivityIndex > 0` or `completedActivityIndices.length > 0`) opens Pebble after a new game ships, the new `GameId` is auto-added to `enabledGames` **and** queued in `pendingIntroGames`.
   - `buildJourneyCurriculum` schedules `pendingIntroGames` into the **very next upcoming slot(s)** starting at `currentActivityIndex` with `isNewGameIntro: true` and `gameOrdinal: 0`, displaying a `"New Game! • Welcome Lesson"` badge on `ActivityBookPage` and `ActivityIntroModal` (and automatically waiting for the spoken voice preview on that first encounter).
   - Once completed, `markJourneyActivityCompleted` removes the game from `pendingIntroGames`, and subsequent chapters weave the game into normal pillar-balanced rotation (`gameOrdinal = 1, 2, ...`).
3. **Universal Starter Scaffolding (`ctx.gameOrdinal === 0` Rule):**
   - Every `JourneyActivityAdapter` in `src/journey/lessonRegistry.ts` **MUST** inspect `ctx.gameOrdinal === 0` (not just `ctx.chapterNumber <= 2`!) and return its gentlest, confidence-building starter configuration on `gameOrdinal === 0`.
   - This guarantees that even if a child is on Chapter 9 when a new game launches, their very first Welcome Lesson in that game starts at introductory scaffolding before ramping up on `gameOrdinal >= 1`.
4. **4-Pillar Domain Alternation (`pillar`):**
   - Every learning game belongs to one of 4 balanced pillars (`phonics-reading`, `numbers-math`, `spelling-writing`, `logic-world`), while reward games use `fun-break`.
   - `createPillarBalancedDrawer` interleaves pillars round-robin inside each cycle so children alternate cleanly across Literacy, Math, Handwriting, and Logic/World without same-domain fatigue, and every enabled game is visited once per full learning cycle.

## 2. Three-Tier Update Playbook

### Tier A — Adding a Brand-New Game (Default: Zero Progress Reset)
1. **Do NOT increment `CURRENT_JOURNEY_EPOCH`** in `src/journey/journeyTypes.ts`.
2. Register the `GameId` in `src/games/registry.ts`, validator/defaults in `src/games/gameConfigs.ts`, and lazy Setup/Board in `src/games/plugins.tsx`.
3. Add a calm pre-reader voice prompt to `scripts/sync-journey-audio.mjs` and generate `public/audio/journey/<game-id>.mp3` + word timings in `src/journey/journeyAudioCatalog.json`, then add the clip ID to `JourneyVoiceClipId` (`journeyTypes.ts`) and `ALL_JOURNEY_VOICE_CLIP_IDS` (`voiceInstructions.ts`).
4. Add a `JourneyActivityAdapter` to `JOURNEY_LESSON_ADAPTERS` (`src/journey/lessonRegistry.ts`) with:
   - Appropriate `pillar` (`phonics-reading` | `numbers-math` | `spelling-writing` | `logic-world` | `fun-break`).
   - `ctx.gameOrdinal === 0` gentle starter config.
   - Progressive spiral across `ctx.gameOrdinal >= 1` and `ctx.chapterNumber` for both `'short'` and `'standard'` duration modes.
5. Add an animated preview stage in `src/components/ActivityIntroModal.tsx` and a standalone Help descriptor in `src/journey/standaloneHelpActivity.ts`.
6. **Outcome for existing children:** Past chapters stay 100% intact; the new game appears immediately at their next lesson as `"New Game! • Welcome Lesson"` (`gameOrdinal = 0`) and joins future chapters automatically.

### Tier B — Adding a New Mode, Skill Pack, or Range to an Existing Game (Zero Progress Reset)
1. **Do NOT increment `CURRENT_JOURNEY_EPOCH`**.
2. Add the new mode/pack into that game's rotation in `src/journey/lessonRegistry.ts` for `ctx.gameOrdinal >= 1` (keeping `ctx.gameOrdinal === 0` as the gentle starter).
3. If the new mode changes how the child interacts (e.g., backward countdown vs. forward counting, or number/shape tracing vs. letter tracing), add a dedicated `JourneyVoiceClipId` in `scripts/sync-journey-audio.mjs` and update `ActivityIntroModal.tsx` + `standaloneHelpActivity.ts`.
4. **Outcome for existing children:** Completed slots remain untouched; the learner encounters the new pack/mode automatically on their next upcoming turn of that game.

### Tier C — Full Syllabus / Class-Level Cohort Reset (Explicit Reset Only)
1. Use **ONLY** when intentionally resetting progress for all learners (e.g., transitioning syllabus levels K1 → K2 or an explicit parent-requested full refresh).
2. Increment `CURRENT_JOURNEY_EPOCH` in `src/journey/journeyTypes.ts`.
3. `reconcileJourneyProgress` (`src/journey/journeyStorage.ts`) will automatically reset `currentActivityIndex = 0`, `completedActivityIndices = []`, `coveredLetters = []`, `completedSnapshots = {}`, and `pendingIntroGames = []` (plus clear any stale `journey-play` screen in `sessionStorage`), while preserving parent settings (`guidedModeEnabled`, `speakChildName`, `durationMode`, `waitForVoiceIntro`, `playerMode`, `funBreakPacing`).
