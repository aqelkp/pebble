# Child & Learning Game Design Rule (Pebble)

Whenever designing, proposing, or implementing a **new game** or modifying **rewards, failure feedback, or core gameplay mechanics** in Pebble:

1. **Read `docs/CHILD_GAME_DESIGN.md` first** and apply every principle in it.
2. **Include the New Game Design Checklist in your proposal/plan before coding**, explicitly covering:
   - **Learning Hypothesis & Anti-Gaming Check:** What skill is taught and why the child cannot pass by random guessing.
   - **Child-First Reward Loop:** Tangible sensory/narrative rewards (animations, sounds, clapping, visual progress) rather than relying on abstract `+1 PTS` alone; keep numeric stats quiet for parents.
   - **Playfulness Asymmetry:** Failure must be calm, quiet, and boringly neutral (`Playfulness(Wrong) ≪ Playfulness(Right)`). Never make wrong answers funny, explosive, or entertaining.
   - **Gentle Failure Consequences ("Think Again" Pause Overlay):** Include a legible, non-punitive consequence so children cannot spam-drag without thinking—especially a calm, screen-taking **"Think Again" pause overlay** (`~2–3s` cooldown saying *"Hey, do you want to take some time to think again?"*), alongside options like a visible bonus/star at stake, small progress setback, or turn pass.
   - **Platform-Independent Audio & Rotating Content:** Use bundled audio + Web Audio API (never `speechSynthesis` as primary) and rotate targets/distractors each session.
   - **Portrait `768 × 1024` Dual Input & PWA Resilience:** Zero vertical scroll on gameplay, drag-and-drop paired with tap-to-place, `sessionStorage` resume, and Back-button guard.
3. **Share early wireframes / design summary** for new games before heavy implementation so mechanics, rewards, and consequences can be reviewed early.
