# Pebble Child & Learning Game Design Playbook

This document is the **single source of truth** for child-centered game design learnings accumulated while building and playtesting **Pebble** with young learners (ages 4–7, K1/LKG).

Every new game, mechanic, reward loop, or gameplay update **must** follow these principles and pass the [New Game Design Checklist](#new-game-design-checklist) before implementation.

---

## 1. Reward Systems: Sensory & Narrative Joy for Kids, Metrics for Parents

- **What we observed:** Young children (ages 4–6) do not connect with abstract numeric points (`+1 PTS`, scoreboards, or leaderboards) the way adults do. They engage with **immediate, tangible, story-driven feedback**—a train chugging forward, someone clapping and cheering, a bucket filling with water, or unlocking a Golden Fish.
- **Design rule:**
  - **For the child:** Make rewards **sensory, visual, and narrative** (characters reacting, progress filling up visibly, celebratory audio/clapping, confetti, stickers/crowns, unlocking a special round).
  - **For the parent:** Keep numeric tracking (`attempts`, `best record`, `accuracy`, `mistake-free streaks`) quiet and available in parent/summary views (e.g., `localStorage` mastery & records) so parents can track growth without turning the child's screen into a spreadsheet.
  - **Separate "PTS" from solo child games:** Only use competitive `PTS` HUDs in multi-player family turn-based games (like Memory Match or Number Safari); solo skill games (like Letter Train or Letter River) should center on visual/narrative progress.

---

## 2. Playfulness Asymmetry: Never Make Failure Fun

- **What we observed:** When wrong answers had dramatic, "dangerous," or comical feedback, the child **intentionally picked wrong answers** because triggering the funny failure reaction was just as entertaining as getting it right.
- **Design rule:**
  - **Playfulness(Wrong) ≪ Playfulness(Right).**
  - **Wrong actions** must be **calm, low-key, and boringly neutral**: a tiny gentle nudge (`~3px`), a soft low muted tap, and a quiet return or calm hint. **Never** use funny boings, explosions, comical shakes, silly faces, or exaggerated animations on failure.
  - **Correct actions** get **100% of the delight**: rich animations, ascending chimes, spoken cheers, clapping parties, confetti bursts, and visible forward progress.

---

## 3. Meaningful Consequences for Failures (Preventing Spam-Dragging)

- **What we observed:** When wrong drags or taps simply bounce back with zero consequence, children quickly discover they can **drag everything everywhere without thinking** until something sticks.
- **Design rule:**
  - Mistakes must carry a **gentle, legible, non-punitive consequence** that encourages *"slow down and think"* without causing frustration or dead-end "Game Over" screens.
  - **Approved consequence patterns:**
    1. **Visible Streak / Bonus at Stake:** Show a **Perfect Run / Star / Clapping Party** badge *during* the round that dims or drops if a mistake is made (so the child actively tries to protect it).
    2. **Small Progress Setback:** On a wrong drop, spill 1 unit from the current progress meter (e.g., bucket drops from `2/3` to `1/3`, or a combo resets to `0`).
    3. **Think Pause (Brief Cooldown):** Apply a short `~1.0–1.5s` calm lock/return animation after a mistake so rapid-fire brute-force dragging doesn't work.
    4. **Turn Pass (Multiplayer):** In 2–4 player games, a wrong guess passes the turn to the next family member.
  - **Anti-pattern:** Never lock the child out permanently, show harsh red `X`s, or play buzzer sounds.

---

## 4. Start with a Clear Learning Hypothesis

- **What we observed:** Fun mechanics without a clear educational goal drift into pure arcade tapping.
- **Design rule:** Before designing screens or code for a new game, state explicitly:
  1. **Target skill & stage** (e.g., K1/LKG initial phoneme discrimination, 1–10 one-to-one counting, 3-letter CVC blending).
  2. **Learning hypothesis** (why this specific mechanic builds that skill).
  3. **Anti-gaming check** (can a child solve it by guessing colors, memorizing positions, or spam-dragging without practicing the skill?).

---

## 5. Platform-Independent Audio & Single-Source Word Banks

- **What we observed:** Browser `window.speechSynthesis` (TTS) worked on Android mobile but failed silently in desktop browsers, breaking sound-first learning.
- **Design rule:**
  - **Never rely on OS/browser TTS** as the primary voice mechanism.
  - Use **bundled, pre-generated audio files** alongside Web Audio API synthesized chimes/SFX so every device (desktop, tablet, Android PWA, offline) sounds identical.
  - Back phonics/word games with a **single source-of-truth Word Bank** where every word entry pairs its text, illustration, phonetic metadata, and bundled audio file.

---

## 6. Freshness & Replayability (Rotating Content)

- **What we observed:** Young children replay favorite games dozens of times. Static word/item pairs lead to memorizing card positions instead of learning the underlying concept.
- **Design rule:**
  - Maintain rich item/word banks (multiple items per letter/number/concept).
  - Randomize both **target items** and **distractors** on every new session so no two rounds feel identical.

---

## 7. Zero-Friction Defaults & Right-Sized Player Modes

- **What we observed:** Children want to tap **Play** and start immediately; parents shouldn't have to configure 5 options every time. Also, not every game needs a multi-player scoreboard.
- **Design rule:**
  - Pre-select sensible defaults on every setup screen so **one tap starts the game**.
  - Explicitly choose **Solo Child Mode** (phonics, sorting, puzzles) vs. **Family Turn-Based Mode** (memory, counting turns) based on the game's learning goal.

---

## 8. Portrait Tablet (`768 × 1024`) Ergonomics & Dual Input

- **What we observed:** Pebble is primarily played on a vertical tablet. Oversized setup images, vertical scrolling during gameplay, or tiny drag targets break immersion for small fingers.
- **Design rule:**
  - **Zero vertical scrolling** on gameplay boards (`100dvh`, `ResizeObserver` dynamic sizing).
  - **Keep setup screens compact and scannable**—no oversized decorative images pushing controls off-screen.
  - **Always pair Drag-and-Drop with Tap-to-Select / Tap-to-Place** so young children never get stuck on motor-precision dragging.

---

## 9. Familiar Worlds & Calm, Screen-Safe Aesthetics

- **What we observed:** Familiar characters and real-world themes (Lion King, Kung Fu Panda, PAW Patrol, Toy Story, Cars, Tom & Jerry, Fruits, Vegetables, Sports, Car Logos) spark immediate excitement, while Pebble's warm alabaster canvas and soft palette keep the experience calm.
- **Design rule:** Reuse or extend Pebble's cohesive 512×512 custom art themes and strict calm palette (`#F7F5F0` canvas, Fredoka + Google Sans, zero harsh neon or flashing clutter).

---

## 10. Real-Device PWA Resilience

- **What we observed:** Installed as an Android home-screen PWA, an accidental tap on the hardware/gesture **Back** button used to wipe an in-progress game.
- **Design rule:**
  - Guard accidental Back navigation during active gameplay.
  - Persist active game state in `sessionStorage` so accidental refreshes or back-presses never erase a child's round.

---

## New Game Design Checklist

Before writing implementation code for any new Pebble game, confirm all 8 items in your design/plan:

- [ ] **Learning Hypothesis:** What exact skill is taught, and how does the mechanic prevent solving without that skill?
- [ ] **Child Reward Loop:** What tangible, sensory/narrative celebration happens on success (beyond just `+1 PTS`)?
- [ ] **Playfulness Asymmetry:** Is failure calm, quiet, and boringly neutral compared to success?
- [ ] **Failure Consequence:** What gentle consequence prevents thoughtless spam-dragging/guessing (e.g., visible streak/star at stake, small progress setback, brief think-pause cooldown, or turn pass)?
- [ ] **Freshness:** Does every round rotate/shuffle targets and distractors from a rich bank?
- [ ] **Platform-Independent Audio:** Are voices/sounds bundled assets + Web Audio (zero reliance on `speechSynthesis`)?
- [ ] **Portrait `768 × 1024` & Dual Input:** Zero vertical scroll on gameplay, compact setup, and both drag-and-drop + tap-to-place?
- [ ] **PWA Back Guard & Resume:** Active state saved to `sessionStorage` and Back-button guarded?
