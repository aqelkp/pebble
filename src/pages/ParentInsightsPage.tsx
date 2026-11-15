import { useMemo, useState } from 'react';
import { getAvatarSrc, type FamilyProfile } from '../context/FamilyProfilesContext';
import {
  CLASS_LEVEL_OPTIONS,
  CURRICULUM_FRAMEWORKS,
  DEFAULT_CLASS_LEVEL,
  getCurriculumForClass,
} from '../curriculum/curriculumRegistry';
import {
  SKILL_LABELS,
  WORD_CATEGORY_LABELS,
  type ClassLevelId,
  type CurriculumFrameworkId,
  type WordCategory,
} from '../curriculum/curriculumTypes';
import { getWordCategory } from '../curriculum/levels/k1';
import { getCanonicalWord, type LetterId } from '../data/wordBank';
import { GAME_REGISTRY, getGameRegistryEntry, type GameId } from '../games/registry';
import {
  getAggregateConceptSummary,
  getConceptSkillBreakdown,
  getCurriculumOverview,
  getGameMetricsSummary,
  getLearningSettings,
  getLetterSummaryMap,
  getPlayerConceptStats,
  getRecentAccuracyPct,
  resetAllLearningTelemetry,
  saveLearningSettings,
  type MasteryTier,
} from '../learning/learningStore';
import './ParentInsightsPage.css';

interface ParentInsightsPageProps {
  profiles: FamilyProfile[];
  onUpdateProfile: (
    id: string,
    patch: Partial<Pick<FamilyProfile, 'name' | 'avatar' | 'accentColor' | 'classLevel'>>,
  ) => void;
  onOpenGame: (gameId: GameId) => void;
  onBackToHub: () => void;
}

type InsightsTab = 'overview' | 'explorer' | 'games' | 'settings';
type ExplorerMode = 'letters' | 'core-words' | 'cvc-words';

type DrillTarget =
  | { kind: 'letter'; letter: LetterId }
  | { kind: 'word'; wordId: string }
  | { kind: 'game'; gameId: GameId };

const TIER_LABELS: Record<MasteryTier, string> = {
  mastered: 'Mastered',
  developing: 'Developing',
  'needs-practice': 'Needs Practice',
  unseen: 'Not Tried Yet',
};

export function ParentInsightsPage({
  profiles,
  onUpdateProfile,
  onOpenGame,
  onBackToHub,
}: ParentInsightsPageProps) {
  const childProfile = profiles[0];
  const playerId = childProfile?.id ?? 'child';
  const classLevel: ClassLevelId = childProfile?.classLevel ?? DEFAULT_CLASS_LEVEL;

  const [tab, setTab] = useState<InsightsTab>('overview');
  const [explorerMode, setExplorerMode] = useState<ExplorerMode>('letters');
  const [wordCategoryFilter, setWordCategoryFilter] = useState<WordCategory | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<MasteryTier | 'all'>('all');
  const [drillTarget, setDrillTarget] = useState<DrillTarget | null>(null);
  const [settings, setSettings] = useState(() => getLearningSettings());
  const [confirmReset, setConfirmReset] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const benchmark = useMemo(() => getCurriculumForClass(classLevel), [classLevel]);

  const overview = useMemo(
    () => getCurriculumOverview(playerId, classLevel),
    [playerId, classLevel, refreshTick],
  );

  const letterSummaryMap = useMemo(
    () => getLetterSummaryMap(playerId, benchmark.targetLetters),
    [playerId, benchmark.targetLetters, refreshTick],
  );

  const allStats = useMemo(
    () => getPlayerConceptStats(playerId),
    [playerId, refreshTick],
  );

  const wordSummaries = useMemo(() => {
    const targetIds =
      explorerMode === 'cvc-words' ? benchmark.cvcWordIds : benchmark.coreWordIds;

    return targetIds.map((wordId) => {
      const canonical = getCanonicalWord(wordId);
      const stats = allStats.filter((s) => s.conceptId === `word:${wordId}`);
      const agg = getAggregateConceptSummary(
        stats,
        benchmark.masteryThresholdPct,
        explorerMode === 'cvc-words' ? 2 : benchmark.minExposuresForMastery,
      );
      return {
        wordId,
        word: canonical?.word ?? wordId,
        letter: canonical?.letter ?? 'A',
        category: getWordCategory(wordId),
        agg,
      };
    });
  }, [allStats, benchmark, explorerMode]);

  const filteredWords = useMemo(() => {
    return wordSummaries.filter((w) => {
      if (wordCategoryFilter !== 'all' && w.category !== wordCategoryFilter) return false;
      if (tierFilter !== 'all' && w.agg.tier !== tierFilter) return false;
      return true;
    });
  }, [wordSummaries, wordCategoryFilter, tierFilter]);

  const handleConceptChipClick = (conceptId: string) => {
    if (conceptId.startsWith('letter:')) {
      setDrillTarget({ kind: 'letter', letter: conceptId.slice(7) as LetterId });
    } else if (conceptId.startsWith('word:')) {
      setDrillTarget({ kind: 'word', wordId: conceptId.slice(5) });
    }
  };

  const handleToggleAdaptive = () => {
    const next = saveLearningSettings({
      adaptivePracticeEnabled: !settings.adaptivePracticeEnabled,
    });
    setSettings(next);
  };

  const handleFrameworkChange = (frameworkId: CurriculumFrameworkId) => {
    const next = saveLearningSettings({ frameworkId });
    setSettings(next);
  };

  const handleResetTelemetry = () => {
    resetAllLearningTelemetry();
    setConfirmReset(false);
    setDrillTarget(null);
    setRefreshTick((t) => t + 1);
  };

  /* =====================================================================
     LEVEL 3: DEEP-DIVE INSPECTOR (Letter / Word / Game)
     ===================================================================== */
  if (drillTarget) {
    if (drillTarget.kind === 'letter') {
      const letter = drillTarget.letter;
      const summary = letterSummaryMap.get(letter) ?? getAggregateConceptSummary([]);
      const breakdown = getConceptSkillBreakdown(playerId, `letter:${letter}`);
      const wordsForLetter = benchmark.coreWordIds
        .map((id) => getCanonicalWord(id))
        .filter((w): w is NonNullable<typeof w> => Boolean(w && w.letter === letter));

      return (
        <div className="pi-shell">
          <header className="pi-topbar">
            <div className="pi-topbar__left">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDrillTarget(null)}
              >
                ← Back
              </button>
              <div className="pi-title-group">
                <h1>Letter {letter} — Deep Dive</h1>
                <p>
                  {TIER_LABELS[summary.tier]} • {summary.attempts} total tries
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onOpenGame('letter-train')}
            >
              Practice in Letter Train
            </button>
          </header>

          <div className="pi-grid-4">
            <div className="pi-card">
              <span className="pi-stat-label">Recent Accuracy</span>
              <span className="pi-stat-value">
                {summary.attempts > 0 ? `${summary.recentAccuracyPct}%` : '—'}
              </span>
              <span className="pi-stat-sub">Last 8 exposures</span>
            </div>
            <div className="pi-card">
              <span className="pi-stat-label">Lifetime Correct</span>
              <span className="pi-stat-value">
                {summary.correct} / {summary.attempts}
              </span>
              <span className="pi-stat-sub">{summary.mistakes} mistakes</span>
            </div>
            <div className="pi-card">
              <span className="pi-stat-label">Status</span>
              <span className="pi-stat-value" style={{ fontSize: '1.25rem' }}>
                {TIER_LABELS[summary.tier]}
              </span>
              <span className="pi-stat-sub">Target: ≥ {benchmark.masteryThresholdPct}%</span>
            </div>
          </div>

          <section className="pi-card">
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
              Skill Breakdown for Letter {letter}
            </h2>
            {breakdown.length === 0 ? (
              <p className="pi-stat-sub">
                No recorded attempts for Letter {letter} yet. Play Letter Train or Letter River!
              </p>
            ) : (
              breakdown.map((stat) => (
                <div key={stat.key} className="pi-skill-row">
                  <div>
                    <div style={{ fontWeight: 700 }}>{SKILL_LABELS[stat.skillType].label}</div>
                    <div className="pi-stat-sub">{SKILL_LABELS[stat.skillType].question}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      {getRecentAccuracyPct(stat)}%
                    </div>
                    <div className="pi-stat-sub">
                      {stat.correct}/{stat.attempts} tries
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="pi-card">
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
              Core K1 Words Starting with {letter}
            </h2>
            <div className="pi-word-grid">
              {wordsForLetter.map((w) => {
                const wStats = getConceptSkillBreakdown(playerId, `word:${w.id}`);
                const wAgg = getAggregateConceptSummary(wStats);
                return (
                  <button
                    key={w.id}
                    type="button"
                    className={`pi-word-tile pi-tier--${wAgg.tier}`}
                    onClick={() => setDrillTarget({ kind: 'word', wordId: w.id })}
                  >
                    <span className="pi-word-tile__name">{w.word}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      {wAgg.attempts > 0 ? `${wAgg.recentAccuracyPct}%` : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      );
    }

    if (drillTarget.kind === 'word') {
      const canonical = getCanonicalWord(drillTarget.wordId);
      const wordLabel = canonical?.word ?? drillTarget.wordId;
      const breakdown = getConceptSkillBreakdown(playerId, `word:${drillTarget.wordId}`);
      const agg = getAggregateConceptSummary(breakdown);

      return (
        <div className="pi-shell">
          <header className="pi-topbar">
            <div className="pi-topbar__left">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDrillTarget(null)}
              >
                ← Back
              </button>
              <div className="pi-title-group">
                <h1 style={{ textTransform: 'capitalize' }}>Word: &ldquo;{wordLabel}&rdquo;</h1>
                <p>
                  Starts with {canonical?.letter ?? '—'} • {TIER_LABELS[agg.tier]}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                onOpenGame(canonical?.wordFun ? 'word-fun' : 'letter-train')
              }
            >
              Practice Word
            </button>
          </header>

          <div className="pi-grid-4">
            <div className="pi-card">
              <span className="pi-stat-label">Overall Accuracy</span>
              <span className="pi-stat-value">
                {agg.attempts > 0 ? `${agg.recentAccuracyPct}%` : '—'}
              </span>
              <span className="pi-stat-sub">{agg.attempts} total exposures</span>
            </div>
            <div className="pi-card">
              <span className="pi-stat-label">Avg Attempts / Win</span>
              <span className="pi-stat-value">
                {agg.avgAttemptsPerSuccess !== null ? agg.avgAttemptsPerSuccess : '—'}
              </span>
              <span className="pi-stat-sub">Lower is stronger recall</span>
            </div>
          </div>

          <section className="pi-card">
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
              Question-Level Breakdown
            </h2>
            {breakdown.length === 0 ? (
              <p className="pi-stat-sub">
                This word hasn&apos;t been tested yet. Adaptive Practice will naturally introduce it!
              </p>
            ) : (
              breakdown.map((stat) => (
                <div key={stat.key} className="pi-skill-row">
                  <div>
                    <div style={{ fontWeight: 700 }}>{SKILL_LABELS[stat.skillType].label}</div>
                    <div className="pi-stat-sub">{SKILL_LABELS[stat.skillType].question}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      {getRecentAccuracyPct(stat)}%
                    </div>
                    <div className="pi-stat-sub">
                      {stat.correct}/{stat.attempts} clean •{' '}
                      {Math.round((stat.totalAttemptsTaken / Math.max(1, stat.correct)) * 10) / 10} avg tries
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      );
    }

    // Game deep-dive
    const gameMeta = getGameRegistryEntry(drillTarget.gameId);
    const gameSummary = getGameMetricsSummary(playerId, drillTarget.gameId);

    return (
      <div className="pi-shell">
        <header className="pi-topbar">
          <div className="pi-topbar__left">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setDrillTarget(null)}
            >
              ← Back
            </button>
            <div className="pi-title-group">
              <h1>{gameMeta.title} — Game Metrics</h1>
              <p>
                {gameMeta.activityRole === 'reward'
                  ? 'Just-for-Fun Reward Activity'
                  : 'Curriculum Learning Activity'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onOpenGame(gameMeta.id)}
          >
            Open {gameMeta.title}
          </button>
        </header>

        <section className="pi-card">
          <span className="pi-stat-label">Learning Intent</span>
          <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.45 }}>
            {gameMeta.learningIntent.summary}
          </p>
        </section>

        <div className="pi-grid-4">
          <div className="pi-card">
            <span className="pi-stat-label">Rounds Completed</span>
            <span className="pi-stat-value">{gameSummary.totalRounds}</span>
            <span className="pi-stat-sub">{gameSummary.flawlessRounds} mistake-free</span>
          </div>
          <div className="pi-card">
            <span className="pi-stat-label">Avg Accuracy</span>
            <span className="pi-stat-value">
              {gameSummary.averageAccuracyPct !== null
                ? `${gameSummary.averageAccuracyPct}%`
                : '—'}
            </span>
            <span className="pi-stat-sub">Across recorded rounds</span>
          </div>
          <div className="pi-card">
            <span className="pi-stat-label">Avg Attempts / Round</span>
            <span className="pi-stat-value">
              {gameSummary.averageAttemptsPerRound !== null
                ? gameSummary.averageAttemptsPerRound
                : '—'}
            </span>
            <span className="pi-stat-sub">Tracks efficiency over time</span>
          </div>
        </div>

        <section className="pi-card">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
            Accuracy % Over Recent Rounds
          </h2>
          {gameSummary.recentAccuracyTrend.length === 0 ? (
            <p className="pi-stat-sub">Play a round of {gameMeta.title} to see trends over time.</p>
          ) : (
            <div className="pi-sparkline" aria-label="Accuracy trend over recent rounds">
              {gameSummary.recentAccuracyTrend.map((pct, idx) => (
                <div
                  key={idx}
                  className="pi-spark-bar"
                  style={{
                    height: `${Math.max(22, Math.round((pct / 100) * 44))}px`,
                    background:
                      pct >= 85
                        ? 'var(--mint-match)'
                        : pct >= 60
                          ? '#e09f2d'
                          : 'var(--coral-accent)',
                  }}
                  title={`Round ${idx + 1}: ${pct}%`}
                >
                  <span>{pct}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pi-card">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
            Attempts Over Recent Rounds
          </h2>
          {gameSummary.recentAttemptsTrend.length === 0 ? (
            <p className="pi-stat-sub">No rounds recorded yet.</p>
          ) : (
            <div className="pi-chip-row">
              {gameSummary.recentAttemptsTrend.map((attempts, idx) => (
                <span key={idx} className="pi-concept-chip">
                  Round {idx + 1}: {attempts} tries
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  /* =====================================================================
     MAIN PARENT INSIGHTS & SETTINGS SHELL (LEVELS 1 & 2)
     ===================================================================== */
  return (
    <div className="pi-shell">
      <header className="pi-topbar">
        <div className="pi-topbar__left">
          <button type="button" className="btn-secondary" onClick={onBackToHub}>
            ← Back to Hub
          </button>
          <div className="pi-title-group">
            <h1>Parent Insights &amp; Settings</h1>
            <p>
              {benchmark.title} • {benchmark.ageRange}
            </p>
          </div>
        </div>

        {childProfile && (
          <div className="pi-child-pill">
            <img src={getAvatarSrc(childProfile.avatar)} alt="" />
            <span>{childProfile.name}</span>
          </div>
        )}
      </header>

      <nav className="pi-tabs" aria-label="Parent sections">
        {(
          [
            ['overview', 'Overview'],
            ['explorer', 'Letters & Words'],
            ['games', 'By Game'],
            ['settings', 'Settings'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`pi-tab ${tab === id ? 'pi-tab--active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <>
          <div className="pi-grid-4">
            <button
              type="button"
              className="pi-card pi-card--interactive"
              onClick={() => {
                setExplorerMode('letters');
                setTab('explorer');
              }}
            >
              <span className="pi-stat-label">A–Z Letter Sounds</span>
              <span className="pi-stat-value">
                {overview.lettersMastered} / {overview.lettersTotal}
              </span>
              <div className="pi-progress-track">
                <div
                  className="pi-progress-fill"
                  style={{
                    width: `${Math.round((overview.lettersMastered / overview.lettersTotal) * 100)}%`,
                  }}
                />
              </div>
              <span className="pi-stat-sub">Tap to inspect A–Z matrix →</span>
            </button>

            <button
              type="button"
              className="pi-card pi-card--interactive"
              onClick={() => {
                setExplorerMode('core-words');
                setTab('explorer');
              }}
            >
              <span className="pi-stat-label">Core {classLevel.toUpperCase()} Words</span>
              <span className="pi-stat-value">
                {overview.coreWordsMastered} / {overview.coreWordsTotal}
              </span>
              <div className="pi-progress-track">
                <div
                  className="pi-progress-fill"
                  style={{
                    width: `${Math.round((overview.coreWordsMastered / overview.coreWordsTotal) * 100)}%`,
                  }}
                />
              </div>
              <span className="pi-stat-sub">
                {overview.coreWordsPracticed} practiced so far →
              </span>
            </button>

            <button
              type="button"
              className="pi-card pi-card--interactive"
              onClick={() => {
                setExplorerMode('cvc-words');
                setTab('explorer');
              }}
            >
              <span className="pi-stat-label">3-Letter CVC Spelling</span>
              <span className="pi-stat-value">
                {overview.cvcWordsMastered} / {overview.cvcWordsTotal}
              </span>
              <div className="pi-progress-track">
                <div
                  className="pi-progress-fill"
                  style={{
                    width: `${Math.round((overview.cvcWordsMastered / Math.max(1, overview.cvcWordsTotal)) * 100)}%`,
                  }}
                />
              </div>
              <span className="pi-stat-sub">Tap to inspect spelling →</span>
            </button>

            <button
              type="button"
              className="pi-card pi-card--interactive"
              onClick={() => setDrillTarget({ kind: 'game', gameId: 'number-safari' })}
            >
              <span className="pi-stat-label">Numbers 1–10</span>
              <span className="pi-stat-value">
                {overview.numbersMastered} / {overview.numbersTotal}
              </span>
              <div className="pi-progress-track">
                <div
                  className="pi-progress-fill"
                  style={{
                    width: `${Math.round((overview.numbersMastered / overview.numbersTotal) * 100)}%`,
                  }}
                />
              </div>
              <span className="pi-stat-sub">Counting &amp; joining →</span>
            </button>
          </div>

          <div className="pi-grid-2">
            <section className="pi-card">
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.12rem' }}>
                Strongest Right Now
              </h2>
              {overview.strongestConcepts.length === 0 ? (
                <p className="pi-stat-sub">
                  Play a few learning rounds to surface his strongest letters and words!
                </p>
              ) : (
                <div className="pi-chip-row">
                  {overview.strongestConcepts.map((c) => (
                    <button
                      key={c.conceptId}
                      type="button"
                      className="pi-concept-chip pi-concept-chip--strong"
                      onClick={() => handleConceptChipClick(c.conceptId)}
                    >
                      <span>{c.label}</span>
                      <span>{c.accuracyPct}%</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="pi-card">
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.12rem' }}>
                Needs Gentle Practice
              </h2>
              {overview.needsPracticeConcepts.length === 0 ? (
                <p className="pi-stat-sub">
                  No tricky items flagged yet—Adaptive Practice will surface new &amp; tricky items automatically.
                </p>
              ) : (
                <div className="pi-chip-row">
                  {overview.needsPracticeConcepts.map((c) => (
                    <button
                      key={c.conceptId}
                      type="button"
                      className="pi-concept-chip pi-concept-chip--practice"
                      onClick={() => handleConceptChipClick(c.conceptId)}
                    >
                      <span>{c.label}</span>
                      <span>{c.accuracyPct}%</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="pi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.12rem' }}>
                Curriculum Domains
              </h2>
              <span className="pi-stat-sub">
                {overview.learningSessionsCount} learning rounds • {overview.rewardSessionsCount} reward-fun rounds
              </span>
            </div>
            <div className="pi-grid-2">
              {overview.domainSummaries.map((d) => (
                <div key={d.domainId} className="pi-skill-row">
                  <div>
                    <div style={{ fontWeight: 700, color: d.accentColor }}>{d.title}</div>
                    <div className="pi-stat-sub">{d.subtitle}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>
                      {d.accuracyPct !== null ? `${d.accuracyPct}%` : '—'}
                    </div>
                    <div className="pi-stat-sub">{d.attempts} tries</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === 'explorer' && (
        <>
          <div className="pi-filter-bar">
            {(
              [
                ['letters', 'A–Z Letters (26)'],
                ['core-words', `Core Words (${benchmark.coreWordIds.length})`],
                ['cvc-words', `CVC Spelling (${benchmark.cvcWordIds.length})`],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={`pi-filter-btn ${explorerMode === mode ? 'pi-filter-btn--active' : ''}`}
                onClick={() => setExplorerMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>

          {explorerMode === 'letters' ? (
            <section className="pi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.12rem' }}>
                  A–Z Phonics Strength Matrix
                </h2>
                <span className="pi-stat-sub">Tap any letter to inspect words &amp; skills</span>
              </div>
              <div className="pi-letter-grid">
                {benchmark.targetLetters.map((letter) => {
                  const summary = letterSummaryMap.get(letter) ?? getAggregateConceptSummary([]);
                  return (
                    <button
                      key={letter}
                      type="button"
                      className={`pi-letter-tile pi-tier--${summary.tier}`}
                      onClick={() => setDrillTarget({ kind: 'letter', letter })}
                    >
                      <span className="pi-letter-tile__char">{letter}</span>
                      <span className="pi-letter-tile__pct">
                        {summary.attempts > 0 ? `${summary.recentAccuracyPct}%` : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="pi-card">
              <div className="pi-filter-bar">
                <select
                  aria-label="Filter by word category"
                  value={wordCategoryFilter}
                  onChange={(e) => setWordCategoryFilter(e.target.value as WordCategory | 'all')}
                  className="pi-filter-btn"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(WORD_CATEGORY_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by mastery tier"
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as MasteryTier | 'all')}
                  className="pi-filter-btn"
                >
                  <option value="all">All Statuses</option>
                  <option value="needs-practice">Needs Practice</option>
                  <option value="developing">Developing</option>
                  <option value="mastered">Mastered</option>
                  <option value="unseen">Not Tried Yet</option>
                </select>
                <span className="pi-stat-sub">Tap any word for question-level breakdown</span>
              </div>

              <div className="pi-word-grid">
                {filteredWords.map((w) => (
                  <button
                    key={w.wordId}
                    type="button"
                    className={`pi-word-tile pi-tier--${w.agg.tier}`}
                    onClick={() => setDrillTarget({ kind: 'word', wordId: w.wordId })}
                  >
                    <span className="pi-word-tile__name">{w.word}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      {w.agg.attempts > 0 ? `${w.agg.recentAccuracyPct}%` : '—'}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {tab === 'games' && (
        <div className="pi-grid-2">
          {GAME_REGISTRY.map((game) => {
            const summary = getGameMetricsSummary(playerId, game.id);
            return (
              <button
                key={game.id}
                type="button"
                className="pi-card pi-card--interactive"
                onClick={() => setDrillTarget({ kind: 'game', gameId: game.id })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.12rem' }}>
                    {game.title}
                  </strong>
                  <span
                    className={`badge-pill ${
                      game.activityRole === 'reward' ? 'badge-pill--muted' : 'badge-pill--mint'
                    }`}
                  >
                    {game.activityRole === 'reward' ? 'Just for Fun' : 'Learning'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {game.learningIntent.summary}
                </p>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <span>Rounds: {summary.totalRounds}</span>
                  <span>
                    Avg Accuracy:{' '}
                    {summary.averageAccuracyPct !== null ? `${summary.averageAccuracyPct}%` : '—'}
                  </span>
                  <span>
                    Avg Tries:{' '}
                    {summary.averageAttemptsPerRound !== null ? summary.averageAttemptsPerRound : '—'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'settings' && (
        <section className="pi-card">
          <div className="pi-setting-row">
            <div>
              <div style={{ fontWeight: 700 }}>Child Class / Grade Level</div>
              <div className="pi-stat-sub">
                Calibrates target vocabulary, phonics, and numeracy benchmarks.
              </div>
            </div>
            <select
              aria-label="Child class level"
              value={classLevel}
              onChange={(e) => {
                if (childProfile) {
                  onUpdateProfile(childProfile.id, {
                    classLevel: e.target.value as ClassLevelId,
                  });
                }
              }}
              className="pi-filter-btn"
            >
              {CLASS_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} disabled={!opt.available}>
                  {opt.label} ({opt.ageHint}){opt.available ? '' : ' — Coming Soon'}
                </option>
              ))}
            </select>
          </div>

          <div className="pi-setting-row">
            <div>
              <div style={{ fontWeight: 700 }}>Curriculum Framework</div>
              <div className="pi-stat-sub">
                Extensible early-years standard used for domain mapping.
              </div>
            </div>
            <select
              aria-label="Curriculum framework"
              value={settings.frameworkId}
              onChange={(e) => handleFrameworkChange(e.target.value as CurriculumFrameworkId)}
              className="pi-filter-btn"
            >
              {CURRICULUM_FRAMEWORKS.map((fw) => (
                <option key={fw.id} value={fw.id} disabled={fw.id !== 'early-years-intl'}>
                  {fw.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pi-setting-row">
            <div>
              <div style={{ fontWeight: 700 }}>Adaptive Practice</div>
              <div className="pi-stat-sub">
                Automatically surface tricky letters and unseen words more often during play.
              </div>
            </div>
            <button
              type="button"
              className={`pi-toggle-btn ${
                settings.adaptivePracticeEnabled ? 'pi-toggle-btn--on' : 'pi-toggle-btn--off'
              }`}
              onClick={handleToggleAdaptive}
            >
              {settings.adaptivePracticeEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <div className="pi-setting-row">
            <div>
              <div style={{ fontWeight: 700 }}>Reset Learning Data</div>
              <div className="pi-stat-sub">
                Clears recorded word/letter attempts and session trends on this device.
              </div>
            </div>
            {!confirmReset ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmReset(true)}
              >
                Reset Data
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: 'var(--coral-accent)' }}
                  onClick={handleResetTelemetry}
                >
                  Confirm Reset
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
