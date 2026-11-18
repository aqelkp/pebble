import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { WordSoundButton } from '../../components/WordSoundButton';
import {
  OnePebbleArt,
  QuestArt,
  TenPebbleBundleArt,
} from '../../curriculum/questEngine/QuestArt';
import {
  playQuestCountNumberVoice,
  playQuestOrdinalStepVoice,
  playQuestStepTick,
} from '../../curriculum/questEngine/questSounds';
import type {
  ChoiceQuestPrompt,
  MiniSortQuestPrompt,
  QuestChoiceOption,
  QuestPrompt,
  SequenceQuestPrompt,
  TensOnesQuestPrompt,
  VisualStripQuestPrompt,
} from '../../curriculum/questEngine/questTypes';

interface SharedWidgetProps {
  locked: boolean;
  teachingMistake?: boolean;
  soundEnabled: boolean;
  onSolve: () => void;
  onMistake: (explanationText: string, mistakeVoiceClipId?: string) => void;
}

function isFromSoundButton(e: { target: EventTarget | null }): boolean {
  const el = e.target as HTMLElement | null;
  return Boolean(el?.closest('[data-sound-btn="true"]'));
}

function resolveChoiceSpokenText(opt: QuestChoiceOption): string | null {
  if (opt.label && opt.label.trim().length > 0) {
    return opt.label.trim();
  }
  if (opt.largeText && opt.sublabel) {
    if (/^\d+(st|nd|rd|th)$/i.test(opt.largeText.trim())) {
      return opt.sublabel.trim();
    }
    return `${opt.largeText.trim()} ${opt.sublabel.trim()}`;
  }
  if (opt.largeText && opt.largeText.trim().length > 0) {
    return opt.largeText.trim();
  }
  return null;
}

function handleCardKeyDown(
  e: KeyboardEvent<HTMLDivElement>,
  disabled: boolean,
  onActivate: () => void,
): void {
  if (disabled) return;
  if (e.target !== e.currentTarget) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onActivate();
  }
}

/* ================= 1. CHOICE GRID ================= */
function ChoiceGridWidget({
  prompt,
  locked,
  onSolve,
  onMistake,
}: SharedWidgetProps & { prompt: ChoiceQuestPrompt }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [hasWrongAttempt, setHasWrongAttempt] = useState(false);

  const count = prompt.choices.length;
  const gridMod =
    count <= 2
      ? 'quest-choice-grid--2'
      : count === 3
        ? 'quest-choice-grid--3'
        : 'quest-choice-grid--4';

  const artSize = prompt.promptArt ? 58 : 74;
  const isSightListenPrompt = prompt.conceptId.startsWith('sight:');

  return (
    <div className="quest-widget-body">
      {prompt.promptArt && (
        <div className="quest-prompt-hero">
          <QuestArt
            spec={prompt.promptArt}
            size={74}
            solvedClipId={prompt.solvedVoiceClipId}
          />
        </div>
      )}

      <div className={`quest-choice-grid ${gridMod}`}>
        {prompt.choices.map((opt) => {
          const isSolved = selectedId === opt.id && opt.isCorrect;
          const isWrong = wrongId === opt.id;
          const spokenText = resolveChoiceSpokenText(opt);
          const showChoiceSound =
            Boolean(spokenText) && (!isSightListenPrompt || hasWrongAttempt || isSolved);

          const activateChoice = () => {
            if (locked) return;
            if (opt.isCorrect) {
              setSelectedId(opt.id);
              setWrongId(null);
              onSolve();
            } else {
              setWrongId(opt.id);
              setHasWrongAttempt(true);
              onMistake(opt.wrongExplanation, opt.mistakeVoiceClipId);
            }
          };

          return (
            <div
              key={opt.id}
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-disabled={locked}
              data-quest-choice={opt.isCorrect ? 'correct' : 'wrong'}
              className={`quest-choice-btn ${isSolved ? 'quest-choice-btn--correct' : ''} ${
                isWrong ? 'quest-choice-btn--wrong-nudge' : ''
              }`}
              onClick={(e: MouseEvent<HTMLDivElement>) => {
                if (isFromSoundButton(e)) return;
                activateChoice();
              }}
              onKeyDown={(e) => handleCardKeyDown(e, locked, activateChoice)}
            >
              {showChoiceSound && spokenText && (
                <WordSoundButton
                  text={spokenText}
                  size="xs"
                  variant="soft"
                  className="quest-choice-btn__sound"
                  testId={`quest-choice-sound-${opt.id}`}
                />
              )}
              {opt.art && <QuestArt spec={opt.art} size={artSize} />}
              {opt.largeText && (
                <span className="quest-choice-btn__large">{opt.largeText}</span>
              )}
              {opt.label && <span className="quest-choice-btn__label">{opt.label}</span>}
              {opt.sublabel && <span className="quest-choice-btn__sub">{opt.sublabel}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= 2. SEQUENCE STRIP (1 -> 2 -> 3 -> 4) ================= */
function SequenceStripWidget({
  prompt,
  locked,
  soundEnabled,
  onSolve,
  onMistake,
}: SharedWidgetProps & { prompt: SequenceQuestPrompt }) {
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const nextOrder = placedIds.length;

  const tryPlaceStep = (itemId: string) => {
    if (locked || placedIds.includes(itemId)) return;
    const step = prompt.steps.find((s) => s.id === itemId);
    if (!step) return;

    if (step.correctOrder === nextOrder) {
      const nextPlaced = [...placedIds, itemId];
      setPlacedIds(nextPlaced);
      playQuestStepTick(nextOrder, soundEnabled);
      if (nextPlaced.length === prompt.steps.length) {
        onSolve();
      }
    } else {
      const expected = prompt.steps.find((s) => s.correctOrder === nextOrder);
      onMistake(
        `Step ${nextOrder + 1} needs "${expected?.label ?? ''}" next (${prompt.orderedSummary})!`,
      );
    }
  };

  return (
    <div className="quest-widget-body">
      <div
        className="quest-seq-slots"
        style={{ gridTemplateColumns: `repeat(${prompt.steps.length}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: prompt.steps.length }, (_, slotIdx) => {
          const placedId = placedIds[slotIdx];
          const placedItem = prompt.steps.find((s) => s.id === placedId);
          const isActive = slotIdx === nextOrder;
          return (
            <div
              key={slotIdx}
              className={`quest-seq-slot ${placedItem ? 'quest-seq-slot--filled' : ''} ${
                isActive ? 'quest-seq-slot--active' : ''
              }`}
              onDragOver={(e) => {
                if (isActive && !locked) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragItemId && isActive) {
                  tryPlaceStep(dragItemId);
                  setDragItemId(null);
                }
              }}
            >
              <span className="quest-seq-slot__num">{slotIdx + 1}</span>
              {placedItem ? (
                <>
                  <WordSoundButton
                    text={placedItem.label}
                    size="xs"
                    variant="mint"
                    className="quest-card-sound"
                  />
                  {placedItem.art && <QuestArt spec={placedItem.art} size={50} />}
                  {placedItem.largeBadge && (
                    <span className="quest-choice-btn__large" style={{ fontSize: '1.8rem' }}>
                      {placedItem.largeBadge}
                    </span>
                  )}
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>
                    {placedItem.label}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#5C6478', fontWeight: 600 }}>
                  {isActive ? 'Tap card ↓' : `Step ${slotIdx + 1}`}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="quest-seq-pool"
        style={{ gridTemplateColumns: `repeat(${prompt.steps.length}, minmax(0, 1fr))` }}
      >
        {prompt.steps.map((item) => {
          const used = placedIds.includes(item.id);
          const disabled = used || locked;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              draggable={!disabled}
              data-seq-order={item.correctOrder}
              className={`quest-seq-card ${disabled ? 'is-disabled' : ''}`}
              onDragStart={(e) => {
                if (isFromSoundButton(e)) {
                  e.preventDefault();
                  return;
                }
                setDragItemId(item.id);
              }}
              onClick={(e) => {
                if (isFromSoundButton(e) || disabled) return;
                tryPlaceStep(item.id);
              }}
              onKeyDown={(e) =>
                handleCardKeyDown(e, disabled, () => tryPlaceStep(item.id))
              }
            >
              {!used && (
                <WordSoundButton
                  text={item.label}
                  size="xs"
                  variant="soft"
                  className="quest-card-sound"
                  testId={`quest-seq-sound-${item.id}`}
                />
              )}
              {item.art && <QuestArt spec={item.art} size={54} />}
              {item.largeBadge && (
                <span className="quest-choice-btn__large" style={{ fontSize: '1.9rem' }}>
                  {item.largeBadge}
                </span>
              )}
              <span style={{ textAlign: 'center' }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= 3. MINI SORTER (2–3 Baskets) ================= */
function MiniSorterWidget({
  prompt,
  locked,
  soundEnabled,
  onSolve,
  onMistake,
}: SharedWidgetProps & { prompt: MiniSortQuestPrompt }) {
  const [sortedMap, setSortedMap] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(() => prompt.items[0]?.id ?? null);

  const activeItemId =
    selectedItemId && !sortedMap[selectedItemId]
      ? selectedItemId
      : prompt.items.find((it) => !sortedMap[it.id])?.id ?? null;

  const tryDropIntoBasket = (itemId: string | null, basketId: string) => {
    if (locked || !itemId || sortedMap[itemId]) return;
    const item = prompt.items.find((it) => it.id === itemId);
    if (!item) return;

    if (item.targetBasketId === basketId) {
      const next = { ...sortedMap, [item.id]: basketId };
      setSortedMap(next);
      const sortedCount = Object.keys(next).length;
      playQuestStepTick(sortedCount - 1, soundEnabled);
      const nextRemaining = prompt.items.find((it) => !next[it.id]);
      setSelectedItemId(nextRemaining?.id ?? null);
      if (sortedCount >= prompt.items.length) {
        onSolve();
      }
    } else {
      onMistake(item.wrongExplanation);
    }
  };

  return (
    <div className="quest-widget-body">
      <div className="quest-sort-tray">
        {prompt.items.map((item) => {
          const isSorted = Boolean(sortedMap[item.id]);
          const isSelected = activeItemId === item.id && !isSorted;
          const disabled = isSorted || locked;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              draggable={!disabled}
              data-sort-target={item.targetBasketId}
              className={`quest-sort-item ${isSelected ? 'quest-sort-item--selected' : ''} ${
                isSorted ? 'quest-sort-item--sorted' : ''
              }`}
              onDragStart={(e) => {
                if (isFromSoundButton(e)) {
                  e.preventDefault();
                  return;
                }
                setSelectedItemId(item.id);
              }}
              onClick={(e) => {
                if (isFromSoundButton(e) || disabled) return;
                setSelectedItemId(item.id);
              }}
              onKeyDown={(e) =>
                handleCardKeyDown(e, disabled, () => setSelectedItemId(item.id))
              }
            >
              {!isSorted && (
                <WordSoundButton
                  text={item.label}
                  size="xs"
                  variant="soft"
                  className="quest-card-sound"
                  testId={`quest-sort-item-sound-${item.id}`}
                />
              )}
              <QuestArt spec={item.art} size={48} />
              <span style={{ textAlign: 'center' }}>{item.label}</span>
            </div>
          );
        })}
      </div>

      <div
        className="quest-sort-baskets"
        style={{ gridTemplateColumns: `repeat(${prompt.baskets.length}, minmax(0, 1fr))` }}
      >
        {prompt.baskets.map((basket) => {
          const countInBasket = Object.values(sortedMap).filter((b) => b === basket.id).length;
          return (
            <div
              key={basket.id}
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-disabled={locked}
              data-basket-id={basket.id}
              className="quest-sort-basket"
              style={{ borderColor: basket.accentColor }}
              onDragOver={(e) => {
                if (!locked) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                tryDropIntoBasket(activeItemId, basket.id);
              }}
              onClick={(e) => {
                if (isFromSoundButton(e) || locked) return;
                tryDropIntoBasket(activeItemId, basket.id);
              }}
              onKeyDown={(e) =>
                handleCardKeyDown(e, locked, () => tryDropIntoBasket(activeItemId, basket.id))
              }
            >
              <WordSoundButton
                text={basket.label}
                size="xs"
                variant="soft"
                className="quest-card-sound"
                testId={`quest-basket-sound-${basket.id}`}
              />
              <span
                className="font-display"
                style={{ fontSize: '1.05rem', fontWeight: 700, color: basket.accentColor }}
              >
                {basket.label}
              </span>
              {basket.sublabel && (
                <span style={{ fontSize: '0.78rem', color: '#5C6478' }}>{basket.sublabel}</span>
              )}
              <span
                className="badge-pill badge-pill--mint"
                style={{ marginTop: 4, fontSize: '0.76rem' }}
              >
                {countInBasket} sorted
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= 4. TENS & ONES TRAY ================= */
function TensOnesTrayWidget({
  prompt,
  locked,
  soundEnabled,
  onSolve,
  onMistake,
}: SharedWidgetProps & { prompt: TensOnesQuestPrompt }) {
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);

  const built = tens * 10 + ones;
  const isMatch = tens === prompt.targetTens && ones === prompt.targetOnes;
  const targetStr = String(prompt.targetNumber);
  const hasTensDigit = prompt.targetNumber >= 10;

  return (
    <div className="quest-widget-body">
      {/* Color-coded Place-Value Bridge: links Tens digit (purple) & Ones digit (orange) */}
      <div className="quest-tens-meter">
        <div className="quest-tens-meter__target">
          <span className="quest-tens-meter__label">Make:</span>
          <span className="quest-tens-meter__digits font-display" aria-label={`Target ${prompt.targetNumber}`}>
            {hasTensDigit ? (
              <>
                <span style={{ color: '#5B5BD6' }}>{targetStr[0]}</span>
                <span style={{ color: '#D15B40' }}>{targetStr[1]}</span>
              </>
            ) : (
              <span style={{ color: '#D15B40' }}>{targetStr}</span>
            )}
          </span>
        </div>

        <span className="quest-tens-meter__arrow" aria-hidden="true">
          →
        </span>

        <div
          className={`quest-tens-meter__live ${isMatch ? 'quest-tens-meter__live--match' : ''}`}
          aria-live="polite"
        >
          <span className="quest-tens-meter__label">Your Tray:</span>
          <span className="font-display" style={{ fontWeight: 700, fontSize: '1.15rem' }}>
            <span style={{ color: '#5B5BD6' }}>{tens * 10}</span>
            <span style={{ color: '#5C6478' }}> + </span>
            <span style={{ color: '#D15B40' }}>{ones}</span>
            <span style={{ color: '#5C6478' }}> = </span>
            <span style={{ color: isMatch ? '#1D6B61' : '#1E2433', fontSize: '1.3rem' }}>
              {built}
            </span>
          </span>
        </div>
      </div>

      <div
        className="quest-tens-workspace"
        data-target-tens={prompt.targetTens}
        data-target-ones={prompt.targetOnes}
      >
        <div className="quest-tens-zone quest-tens-zone--tens">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="font-display" style={{ fontWeight: 700, color: '#5B5BD6', fontSize: '1rem' }}>
              10-Bundles (Tens): {tens} <span style={{ opacity: 0.78 }}>= {tens * 10}</span>
            </span>
            <WordSoundButton text="Tens Bundles" size="xs" variant="soft" />
          </div>
          <div className="quest-tens-visual">
            {tens === 0 ? (
              <span style={{ fontSize: '0.84rem', color: '#5C6478', textAlign: 'center' }}>
                Tap <strong>+10 Bundle</strong> to add 10 pebbles
              </span>
            ) : (
              Array.from({ length: tens }, (_, i) => (
                <TenPebbleBundleArt key={i} compact skipCountLabel={String((i + 1) * 10)} />
              ))
            )}
          </div>
          <div className="quest-tens-controls">
            <button
              type="button"
              className="btn-secondary"
              disabled={locked || tens <= 0}
              style={{ padding: '7px 14px' }}
              onClick={() => {
                const nextTens = Math.max(0, tens - 1);
                setTens(nextTens);
                playQuestCountNumberVoice(nextTens * 10 + ones, soundEnabled);
              }}
            >
              −10
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={locked || tens >= 5}
              style={{ padding: '7px 14px' }}
              onClick={() => {
                const nextTens = Math.min(5, tens + 1);
                setTens(nextTens);
                playQuestStepTick(tens, soundEnabled);
                playQuestCountNumberVoice(nextTens * 10 + ones, soundEnabled);
              }}
            >
              +10 Bundle
            </button>
          </div>
        </div>

        <div className="quest-tens-zone quest-tens-zone--ones">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="font-display" style={{ fontWeight: 700, color: '#D15B40', fontSize: '1rem' }}>
              Single Pebbles (Ones): {ones}
            </span>
            <WordSoundButton text="Ones Pebbles" size="xs" variant="soft" />
          </div>
          <div className="quest-tens-visual">
            {ones === 0 ? (
              <span style={{ fontSize: '0.84rem', color: '#5C6478', textAlign: 'center' }}>
                Tap <strong>+1 Pebble</strong> for single ones
              </span>
            ) : (
              Array.from({ length: ones }, (_, i) => <OnePebbleArt key={i} />)
            )}
          </div>
          <div className="quest-tens-controls">
            <button
              type="button"
              className="btn-secondary"
              disabled={locked || ones <= 0}
              style={{ padding: '7px 14px' }}
              onClick={() => {
                const nextOnes = Math.max(0, ones - 1);
                setOnes(nextOnes);
                playQuestCountNumberVoice(tens * 10 + nextOnes, soundEnabled);
              }}
            >
              −1
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={locked || ones >= 9}
              style={{ padding: '7px 14px', background: '#F27A5E' }}
              onClick={() => {
                const nextOnes = Math.min(9, ones + 1);
                setOnes(nextOnes);
                playQuestStepTick(ones, soundEnabled);
                playQuestCountNumberVoice(tens * 10 + nextOnes, soundEnabled);
              }}
            >
              +1 Pebble
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={locked}
        style={{ alignSelf: 'center', minWidth: 230, padding: '12px 24px', fontSize: '1.05rem' }}
        onClick={() => {
          if (isMatch) {
            onSolve();
          } else {
            onMistake(
              `Your tray shows ${tens} ${tens === 1 ? 'ten-bundle' : 'ten-bundles'} (${tens * 10}) and ${ones} ${ones === 1 ? 'one' : 'ones'} = ${built}. ${prompt.targetNumber} needs ${prompt.targetTens} ten-bundles and ${prompt.targetOnes} ones!`,
              prompt.mistakeVoiceClipId,
            );
          }
        }}
      >
        Check My Number!
      </button>
    </div>
  );
}

/* ================= 5. VISUAL STRIP (Number Line / Ordinals / Graph / Length) ================= */
const ORDINAL_WORDS_FOR_VOICE = [
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
  'Tenth',
] as const;

function VisualStripWidget({
  prompt,
  locked,
  teachingMistake,
  soundEnabled,
  onSolve,
  onMistake,
}: SharedWidgetProps & { prompt: VisualStripQuestPrompt }) {
  const [solvedId, setSolvedId] = useState<string | null>(null);
  const [countedUpTo, setCountedUpTo] = useState<number>(0);
  const strip = prompt.strip;

  const activeCountLimit =
    strip.subkind === 'ordinals' && teachingMistake ? strip.targetPosition : countedUpTo;

  return (
    <div className="quest-widget-body">
      <div className="quest-strip-box">
        {strip.subkind === 'number-line' && (
          <svg width="100%" height="92" viewBox="0 0 620 92" aria-hidden="true">
            <line x1="40" y1="62" x2="580" y2="62" stroke="#5C6478" strokeWidth="4" strokeLinecap="round" />
            {strip.numbers.map((n, idx) => {
              const cx = 56 + idx * 84;
              const isStart = n === strip.startNumber;
              return (
                <g key={n} transform={`translate(${cx}, 62)`}>
                  <circle r="18" fill={isStart ? '#3BA99C' : '#FFFFFF'} stroke="#3BA99C" strokeWidth="3" />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="Fredoka, sans-serif"
                    fontSize="15"
                    fontWeight="700"
                    fill={isStart ? '#FFFFFF' : '#1E2433'}
                  >
                    {n}
                  </text>
                  {isStart && (
                    <circle cx="0" cy="-32" r="10" fill="#4BBCA9" stroke="#257D73" strokeWidth="2.5" />
                  )}
                </g>
              );
            })}
            <path
              d={
                strip.delta > 0
                  ? 'M 308 30 Q 350 4 392 30'
                  : 'M 308 30 Q 266 4 224 30'
              }
              fill="none"
              stroke="#F27A5E"
              strokeWidth="3.5"
              strokeDasharray="5 4"
            />
          </svg>
        )}

        {strip.subkind === 'ordinals' && (
          <div className="quest-ordinal-track">
            {/* Clear Checkered Finish Flag + Direction Arrow */}
            <div className="quest-ordinal-flag" aria-label="Finish Flag — start counting 1st here">
              <svg width="30" height="32" viewBox="0 0 32 34" aria-hidden="true">
                <rect x="3" y="2" width="3.5" height="30" rx="1.5" fill="#1E2433" />
                <rect x="6.5" y="3" width="22" height="14" rx="2" fill="#FFFFFF" stroke="#1E2433" strokeWidth="1.8" />
                <rect x="6.5" y="3" width="5.5" height="7" fill="#1E2433" />
                <rect x="17.5" y="3" width="5.5" height="7" fill="#1E2433" />
                <rect x="12" y="10" width="5.5" height="7" fill="#1E2433" />
                <rect x="23" y="10" width="5.5" height="7" fill="#1E2433" />
              </svg>
              <span className="quest-ordinal-flag__label font-display">FINISH</span>
              <span className="quest-ordinal-flag__dir font-display">1st →</span>
            </div>

            {strip.racers.map((r) => {
              const isAsked = r.position === strip.targetPosition;
              const isCounted = activeCountLimit >= r.position;
              return (
                <button
                  key={r.position}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    setCountedUpTo(r.position);
                    playQuestOrdinalStepVoice(
                      r.position,
                      ORDINAL_WORDS_FOR_VOICE[r.position - 1] ?? r.ordinalLabel,
                      soundEnabled,
                    );
                  }}
                  aria-label={`Count ${r.name} from Finish Flag`}
                  className={`quest-ordinal-racer ${isAsked ? 'quest-ordinal-racer--target' : ''} ${
                    isCounted ? 'quest-ordinal-racer--counted' : ''
                  }`}
                >
                  {isAsked && (
                    <span className="quest-ordinal-pointer font-display" aria-hidden="true">
                      FIND!
                    </span>
                  )}
                  <QuestArt spec={r.art} size={42} />
                  {isCounted ? (
                    <span className="quest-ordinal-step-pill font-display">
                      {teachingMistake ? r.ordinalLabel : r.position}
                    </span>
                  ) : (
                    <span className="quest-ordinal-tap-dot" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {strip.subkind === 'bar-graph' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, height: 128, paddingTop: 6 }}>
            {strip.columns.map((col) => (
              <div key={col.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 3, height: 88, justifyContent: 'flex-start' }}>
                  {Array.from({ length: col.count }, (_, bIdx) => (
                    <div
                      key={bIdx}
                      style={{
                        width: 48,
                        height: 14,
                        borderRadius: 4,
                        background: col.color,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{col.label}</span>
                  <WordSoundButton text={col.label} size="xs" variant="soft" />
                </div>
              </div>
            ))}
          </div>
        )}

        {strip.subkind === 'length-measure' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E2433' }}>
                {strip.objectLabel}
              </span>
              <WordSoundButton text={strip.objectLabel} size="xs" variant="soft" />
            </div>
            <div
              style={{
                width: strip.unitBlocks * 44,
                height: 22,
                borderRadius: '6px 16px 16px 6px',
                background: strip.objectColor,
                border: '2px solid rgba(30,36,51,0.2)',
              }}
            />
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: strip.maxBlocks }, (_, idx) => {
                const underObject = idx < strip.unitBlocks;
                return (
                  <div
                    key={idx}
                    style={{
                      width: 42,
                      height: 28,
                      borderRadius: 5,
                      background: underObject ? '#F2B84B' : '#ECE9E1',
                      border: underObject ? '2px solid #C98E22' : '1.5px dashed #C8C2B4',
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div
        className={`quest-choice-grid ${
          prompt.choices.length === 3 ? 'quest-choice-grid--3' : 'quest-choice-grid--4'
        }`}
      >
        {prompt.choices.map((opt) => {
          const spokenText = resolveChoiceSpokenText(opt);
          const activateChoice = () => {
            if (locked) return;
            if (opt.isCorrect) {
              setSolvedId(opt.id);
              onSolve();
            } else {
              onMistake(opt.wrongExplanation, opt.mistakeVoiceClipId);
            }
          };

          return (
            <div
              key={opt.id}
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-disabled={locked}
              data-quest-choice={opt.isCorrect ? 'correct' : 'wrong'}
              className={`quest-choice-btn ${solvedId === opt.id ? 'quest-choice-btn--correct' : ''}`}
              style={{ minHeight: 88 }}
              onClick={(e) => {
                if (isFromSoundButton(e)) return;
                activateChoice();
              }}
              onKeyDown={(e) => handleCardKeyDown(e, locked, activateChoice)}
            >
              {spokenText && (
                <WordSoundButton
                  text={spokenText}
                  size="xs"
                  variant="soft"
                  className="quest-choice-btn__sound"
                  testId={`quest-strip-choice-sound-${opt.id}`}
                />
              )}
              {opt.art && <QuestArt spec={opt.art} size={42} />}
              {opt.largeText && (
                <span className="quest-choice-btn__large" style={{ fontSize: '1.85rem' }}>
                  {opt.largeText}
                </span>
              )}
              {opt.label && <span className="quest-choice-btn__label">{opt.label}</span>}
              {opt.sublabel && <span className="quest-choice-btn__sub">{opt.sublabel}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function QuestPromptWidgetSwitch(
  props: SharedWidgetProps & { prompt: QuestPrompt },
) {
  const { prompt, ...rest } = props;
  switch (prompt.kind) {
    case 'choice':
      return <ChoiceGridWidget key={prompt.uid} prompt={prompt} {...rest} />;
    case 'sequence':
      return <SequenceStripWidget key={prompt.uid} prompt={prompt} {...rest} />;
    case 'mini-sort':
      return <MiniSorterWidget key={prompt.uid} prompt={prompt} {...rest} />;
    case 'tens-ones':
      return <TensOnesTrayWidget key={prompt.uid} prompt={prompt} {...rest} />;
    case 'visual-strip':
      return <VisualStripWidget key={prompt.uid} prompt={prompt} {...rest} />;
  }
}
