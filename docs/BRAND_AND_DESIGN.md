# Pebble Brand & Design System

## Brand Identity

Pebble is built to feel calm, tactile, and inviting—closer to wooden tabletop toys and illustrated children's picture books than loud arcade apps.

- **Wordmark:** `Pebble` rendered in **Fredoka** (`700`) with tight letter spacing (`-0.02em`).
- **Logo Mark:** Three stacked smooth river pebbles (`PebbleMark` in `src/components/BrandLogo.tsx`):
  - Top stone: `#3BA99C` (Sage Mint)
  - Middle stone: `#F27A5E` (Soft Coral)
  - Bottom stone: `#5B5BD6` (Warm Indigo)
- **Strict Iconography Exclusion:** Never use 4-point sparkle stars, Google/Gemini logos, or 4-dot badges. Celebration effects use circular dots, river-pebble ellipses, ribbons, and golden crowns.

## Color Tokens

Defined in `src/styles/tokens.css`:

| Token | Hex | Role |
|---|---|---|
| `--canvas-bg` | `#F7F5F0` | Warm Alabaster screen-safe canvas |
| `--surface-card` | `#FFFFFF` | Elevated cards, scoreboard tiles, modals |
| `--surface-soft` | `#FAF8F4` | Secondary inset tiles & avatar frames |
| `--indigo-primary` | `#5B5BD6` | Primary CTAs, active turn ring, card back accents |
| `--indigo-tint` | `#ECEBFF` | Selected setup cards, active scoreboard fill, card back pattern |
| `--mint-match` | `#3BA99C` | Matched card borders, `+1 POINT` celebration banner, check badges |
| `--mint-tint` | `#E4F6F3` | Matched card face tint & celebrating score card |
| `--coral-accent` | `#F27A5E` | Secondary warm highlight & gentle mismatch status banner |
| `--honey-accent` | `#F2B84B` | Winner crown halo & 1st place standings badge |
| `--text-primary` | `#1E2433` | High-contrast charcoal slate headlines |
| `--text-secondary` | `#5C6478` | Helper text & secondary labels |

## Typography Scale

- **Display (`--font-display`):** `'Fredoka'`, weights `500`, `600`, `700`
  - Hero greeting, page headers, game titles, player names, `PTS` numbers (`1.65rem`), button labels, winner headline.
- **Body & UI (`--font-sans`):** `'Google Sans'`, weights `400`, `500`
  - Descriptions, age hints, pair counters, form field labels, compact utility buttons.

## Screen & Component Anatomy

### 1. Game Hub (`GameHubPage.tsx`)
- Header with `BrandLogo` and clickable stacked-avatar **Family** chip.
- Personalizable welcome card showing `"Welcome to Pebble!"` (default `'Child'`) or `"Welcome, <Name>!"`.
- 2-column grid led by featured **Memory Match** (`Play Memory Match`), **Letter Train** (`Play Letter Train`), and **Letter River** (`Play Letter River`), alongside **Word Fun** (`Play Word Fun`) and **Number Safari** (`Play Number Safari`).

### 2. Family Profiles (`FamilyProfilesPage.tsx`)
- Editable profile cards (`2–6` players) allowing name edits (up to 24 chars), avatar selection from 6 custom portraits (`boy`, `girl`, `dad`, `mom`, `uncle`, `grandparent`), and ring accent colors.

### 3. Memory Match Setup (`MemorySetup.tsx`)
- Pre-selected defaults for fast zero-friction start:
  - Theme: **Lion King** default inside a 5-column portrait grid with category filters (`All (10)`, `Stories (6)`, `World & Sports (4)`). Includes `Lion King`, `Kung Fu Panda`, `PAW Patrol`, `Toy Story`, `Cars`, `Tom & Jerry`, `Sports`, `Fruits`, `Vegetables`, and `Car Logos` (16 custom `512×512` PNGs each).
  - Board Layout: **`4 × 5` (5 rows vertically = 20 cards / 10 pairs)** first & default; **`4 × 4`** (16 cards) and **`5 × 6`** (30 cards) also available.
  - Players: First 2 profiles pre-selected (`1–4` selectable).

### 4. Memory Match Gameplay (`MemoryBoard.tsx`)
- **Top Utility Bar:** Back to Games, `Pairs: X / Y`, Sound On/Muted, Setup, Restart.
- **Prominent Scoreboard HUD:** Equal-width player cards with 44px avatar, active `"YOUR TURN"` / `"+1 Point!"` badge, and right-aligned high-contrast `PTS` score tile.
- **Fixed-Height Banner (40px):** Reserved space between HUD and cards so grid layout never shifts during `MATCH! +1 POINT` celebrations.
- **Tall `2.5 : 3.5` Card Grid:** Face-down Lavender-Indigo cards with Pebble medallion; face-up crisp white cards with corner paw pips (`PawPipIcon`), 512×512 character PNG, and Sage Mint match check badge.

### 5. Number Safari (`SafariSetup.tsx` & `SafariBoard.tsx`)
- **Setup:** 3 counting trails (`Meadow Count 1–5`, `Savanna Trail 1–10` Default, `Safari Sums Add to 10`), 3 safari lengths (`8 Stops` Default, `6 Stops`, `12 Stops`), and `1–4` family explorers.
- **Gameplay:** Full-height `100dvh` portrait board with Multi-Player `PTS` HUD, sunlit Savanna Clearing featuring structured 5-frame animal rows (or dual addition pods), interactive tap-to-count sequential Sage Mint badges (`1..N`) with ascending marimba notes, and chunky tactile Number Blocks (`1–5` or `1–10`) with circular river-pebble dot pips.

### 6. Word Fun Setup & Gameplay (`WordFunSetup.tsx`, `WordFunBoard.tsx`)
- **Setup:** 5 illustrated word packs (`All Cozy Words` default, `Animal Pals`, `Cozy Home`, `On the Go`, `Sunny Nature`), round length (`8 Words` default, `6 Words`, `12 Words`), helper mode toggle (`Sound It Out` default or `Letter Trace` ghost guides for ages 3–4), and `1–4` family players.
- **Full-Height Phonics Stage (`100dvh`):** Dynamically scaled picture clue card with `Hear Word` audio & `Hint` button, 3 rounded letter slots, and a `3 × 2` tray of 6 tactile wooden letter blocks (`+1 POINT` per spelled word, confetti burst, and WinnerModal standings).

### 7. Letter River (`LetterRiverSetup.tsx` & `LetterRiverBoard.tsx`)
- **Portrait `100dvh` River Stage:** Gentle sunlit teal-mint river lanes at center with river-pebble shore trim above a warm sand-oak wooden dock holding 3 competing letter buckets (`--bucket-cols: 3`, fixed `214px` bucket height at tablet widths to guarantee zero vertical scrolling).
- **Sound-First Fish Cards:** Swimming illustration fish carry circular pure-white picture medallions (`Sound First` default, optional word pills) without mirroring the object art when swimming left.
- **Playful Success vs Calm Redirect:** Matching a bucket triggers buoyant water splash droplets, bucket squash-and-bounce, word reveal pop pills, Golden Fish `2×` bonuses on 4-streaks, and `3/3` bucket-pop confetti; wrong bucket drops softly nudge `3px` and return the fish calmly without slapstick distraction.

### 8. Winner Announcement (`WinnerModal.tsx`)
- Appears once all pairs, words, letters, or stops are completed, showing a golden crown, glowing winner avatar halo(s), confetti burst, `"<Name> Wins!"` / `"It's a Tie!"` / `"Great Job, <Name>!"`, ranked `PTS` breakdown, and **Play Again** / **Change Setup** / **Back to Games** controls.
