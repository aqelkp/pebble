import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameStage } from '../../components/GameStage';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import {
  SoundWaveSpeakerIcon,
  WordSoundButton,
} from '../../components/WordSoundButton';
import type { FamilyProfile } from '../../context/FamilyProfilesContext';
import { generateQuestDeck } from '../../curriculum/questEngine/questDeckBuilder';
import {
  playQuestGentleWrongTap,
  playQuestGrandFinaleSound,
  playQuestMistakeExplanation,
  playQuestPromptVoice,
  playQuestSkinSuccessSound,
  preloadQuestVoiceClips,
  stopQuestVoice,
} from '../../curriculum/questEngine/questSounds';
import {
  ALL_ADVENTURE_SKIN_IDS,
  getQuestPackSpec,
  type AdventureSkinId,
  type QuestGameConfig,
  type QuestPrompt,
} from '../../curriculum/questEngine/questTypes';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import { speakWithSynthesis } from '../../utils/wordAudio';
import { ADVENTURE_SKIN_META, AdventureWorldBanner } from './AdventureWorldBanner';
import './QuestAdventures.css';
import { QuestPromptWidgetSwitch } from './QuestPromptWidgets';

type BoardPhase = 'playing' | 'celebrating-stop' | 'teaching-mistake' | 'think-again' | 'finished';

interface QuestAdventureBoardProps {
  skinId: AdventureSkinId;
  gameKey: number;
  config: QuestGameConfig;
  childProfile?: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onRequestHelp?: () => void;
  onGameActiveChange: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

export function getQuestSessionStorageKey(skinId: AdventureSkinId): string {
  return `pebble.quest.${skinId}.active.v1`;
}

export function QuestAdventureBoard({
  skinId,
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onChangeSetup,
  onBackToHub,
  onRequestHelp,
  onGameActiveChange,
  journeyContext,
}: QuestAdventureBoardProps) {
  const [deckSeed, setDeckSeed] = useState(0);
  const deck: QuestPrompt[] = useMemo(
    () => generateQuestDeck(config.packId, config.roundLength),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.packId, config.roundLength, deckSeed],
  );

  const [stopIdx, setStopIdx] = useState(0);
  const [phase, setPhase] = useState<BoardPhase>('playing');
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [stopMistakes, setStopMistakes] = useState(0);
  const [teachMessage, setTeachMessage] = useState('');
  const [confettiBurstKey, setConfettiBurstKey] = useState(0);

  const startedAtRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);
  const cancelMistakeVoiceRef = useRef<(() => void) | null>(null);
  const sessionLoggedRef = useRef(false);
  const journeyOnCompleteRef = useRef(journeyContext?.onActivityComplete);
  journeyOnCompleteRef.current = journeyContext?.onActivityComplete;

  const playerId = childProfile?.id ?? 'child';
  const childDisplayName =
    childProfile && childProfile.name.trim().toLowerCase() !== 'child'
      ? childProfile.name.trim()
      : '';

  const currentPrompt = deck[Math.min(stopIdx, deck.length - 1)];

  const activeVisualSkin: AdventureSkinId = useMemo(() => {
    if (!config.rotateWorlds) return skinId;
    const baseOffset = ALL_ADVENTURE_SKIN_IDS.indexOf(skinId);
    return ALL_ADVENTURE_SKIN_IDS[(Math.max(0, baseOffset) + stopIdx) % ALL_ADVENTURE_SKIN_IDS.length];
  }, [config.rotateWorlds, skinId, stopIdx]);

  const skinMeta = ADVENTURE_SKIN_META[activeVisualSkin];
  const packSpec = getQuestPackSpec(config.packId);

  useEffect(() => {
    const clipIds = deck.flatMap((d) => {
      const ids = [d.voiceClipId];
      if (d.solvedVoiceClipId) ids.push(d.solvedVoiceClipId);
      if (d.mistakeVoiceClipId) ids.push(d.mistakeVoiceClipId);
      return ids;
    });
    preloadQuestVoiceClips(clipIds);
  }, [deck]);

  useEffect(() => {
    onGameActiveChange(phase !== 'finished');
    return () => onGameActiveChange(false);
  }, [phase, onGameActiveChange]);

  useEffect(() => {
    const key = getQuestSessionStorageKey(skinId);
    try {
      if (phase === 'finished') {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(
          key,
          JSON.stringify({
            packId: config.packId,
            stopIdx,
            totalMistakes,
          }),
        );
      }
    } catch {
      // Ignore sessionStorage quota issues
    }
  }, [skinId, config.packId, stopIdx, totalMistakes, phase]);

  // Speak prompt automatically on new stop unless silentRead is active
  useEffect(() => {
    if (phase !== 'playing' || !currentPrompt) return;
    if (!currentPrompt.silentRead) {
      playQuestPromptVoice(
        currentPrompt.voiceClipId,
        currentPrompt.voiceFallbackText,
        soundEnabled,
      );
    }
  }, [stopIdx, deckSeed, phase === 'playing' ? 'playing' : 'other', currentPrompt, soundEnabled]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      cancelMistakeVoiceRef.current?.();
      stopQuestVoice();
    };
  }, []);

  const handleRestartRound = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    cancelMistakeVoiceRef.current?.();
    stopQuestVoice();
    sessionLoggedRef.current = false;
    startedAtRef.current = Date.now();
    setDeckSeed((s) => s + 1);
    setStopIdx(0);
    setTotalMistakes(0);
    setStopMistakes(0);
    setTeachMessage('');
    setPhase('playing');
  }, []);

  const handleMistake = useCallback(
    (explanationText: string, mistakeVoiceClipId?: string) => {
      if (phase !== 'playing' || !currentPrompt) return;

      playQuestGentleWrongTap(soundEnabled);
      setTotalMistakes((m) => m + 1);
      setStopMistakes((m) => m + 1);
      setTeachMessage(explanationText);
      setPhase('teaching-mistake');

      recordSkillAttempt({
        playerId,
        gameId: skinId,
        conceptId: currentPrompt.conceptId,
        conceptLabel: currentPrompt.conceptLabel,
        skillType: currentPrompt.skillType,
        correct: false,
        attemptsTaken: 1,
      });

      cancelMistakeVoiceRef.current?.();
      cancelMistakeVoiceRef.current = playQuestMistakeExplanation(
        explanationText,
        soundEnabled,
        () => {
          setPhase('think-again');
        },
        mistakeVoiceClipId ?? currentPrompt.mistakeVoiceClipId,
      );
    },
    [phase, currentPrompt, soundEnabled, playerId, skinId],
  );

  const handleSolveStop = useCallback(() => {
    if (phase !== 'playing' || !currentPrompt) return;

    recordSkillAttempt({
      playerId,
      gameId: skinId,
      conceptId: currentPrompt.conceptId,
      conceptLabel: currentPrompt.conceptLabel,
      skillType: currentPrompt.skillType,
      correct: true,
      attemptsTaken: stopMistakes + 1,
    });

    setPhase('celebrating-stop');
    setConfettiBurstKey((k) => k + 1);
    playQuestSkinSuccessSound(activeVisualSkin, soundEnabled);
    if (currentPrompt.silentRead) {
      if (currentPrompt.solvedVoiceClipId) {
        playQuestPromptVoice(
          currentPrompt.solvedVoiceClipId,
          currentPrompt.solvedVoiceText ?? '',
          soundEnabled,
        );
      } else if (currentPrompt.solvedVoiceText) {
        speakWithSynthesis(currentPrompt.solvedVoiceText, soundEnabled);
      }
    }

    const isLast = stopIdx + 1 >= deck.length;
    timerRef.current = window.setTimeout(() => {
      if (isLast) {
        if (!sessionLoggedRef.current) {
          sessionLoggedRef.current = true;
          recordLearningSession({
            playerId,
            gameId: skinId,
            mode: config.packId,
            totalAttempts: deck.length + totalMistakes,
            correctAttempts: deck.length,
            mistakes: totalMistakes,
            flawless: totalMistakes === 0,
            durationMs: Date.now() - startedAtRef.current,
            conceptsTested: deck.map((d) => d.conceptId),
          });
        }
        playQuestGrandFinaleSound(soundEnabled);
        setPhase('finished');
        journeyOnCompleteRef.current?.();
      } else {
        setStopIdx((i) => i + 1);
        setStopMistakes(0);
        setTeachMessage('');
        setPhase('playing');
      }
    }, 1050);
  }, [
    phase,
    currentPrompt,
    playerId,
    skinId,
    stopMistakes,
    activeVisualSkin,
    soundEnabled,
    stopIdx,
    deck,
    config.packId,
    totalMistakes,
  ]);

  if (!currentPrompt) return null;

  const isLocked = phase !== 'playing';
  const flawless = totalMistakes === 0;

  return (
    <GameStage
      title={`${ADVENTURE_SKIN_META[skinId].title} • ${packSpec.shortTitle}`}
      soundEnabled={soundEnabled}
      onToggleSound={onToggleSound}
      onBackToHub={onBackToHub}
      onChangeSetup={onChangeSetup}
      journeyContext={journeyContext}
      topRightExtra={
        onRequestHelp ? (
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onRequestHelp}
          >
            <span>Help</span>
          </button>
        ) : undefined
      }
      overlays={
        <>
          <ConfettiBurst
            active={confettiBurstKey > 0}
            mode={phase === 'finished' ? 'win' : 'match'}
            burstKey={confettiBurstKey}
          />
          <ThinkAgainOverlay
            open={phase === 'think-again'}
            hint={teachMessage}
            soundEnabled={soundEnabled}
            durationSeconds={2}
            onReady={() => {
              setTeachMessage('');
              setPhase('playing');
            }}
            onStartAgain={handleRestartRound}
          />
          {phase === 'finished' && !journeyContext && (
            <div className="modal-backdrop" role="dialog" aria-modal="true">
              <div className="think-again-card" style={{ maxWidth: 460, textAlign: 'center' }}>
                <span className="badge-pill badge-pill--mint" style={{ alignSelf: 'center' }}>
                  {flawless ? 'GOLDEN CROWN • ZERO MISTAKES!' : 'ADVENTURE COMPLETE!'}
                </span>
                <h2 className="font-display" style={{ fontSize: '1.75rem', margin: '8px 0 4px' }}>
                  {childDisplayName
                    ? `${ADVENTURE_SKIN_META[skinId].finaleHeadline} Way to go, ${childDisplayName}!`
                    : ADVENTURE_SKIN_META[skinId].finaleHeadline}
                </h2>
                <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)' }}>
                  Completed {deck.length} {packSpec.title} puzzles
                  {flawless ? ' with 100% first-try accuracy!' : '.'}
                </p>

                <div className="think-again-card__actions">
                  <button
                    type="button"
                    className="btn-primary think-again-card__btn"
                    onClick={handleRestartRound}
                  >
                    Play Fresh {packSpec.shortTitle} Round
                  </button>
                  <button
                    type="button"
                    className="btn-secondary think-again-card__secondary-btn"
                    onClick={onChangeSetup}
                  >
                    Switch K1 Topic Pack
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      }
    >
      <div className="quest-board-wrap">
        <AdventureWorldBanner
          skinId={activeVisualSkin}
          stopIndex={stopIdx}
          totalStops={deck.length}
          gateCelebrating={phase === 'celebrating-stop'}
          flawlessSoFar={flawless}
        />

        <div className="quest-prompt-card">
          <div className="quest-prompt-header">
            <div className="quest-prompt-title-group">
              {currentPrompt.promptBadge && (
                <span className="quest-prompt-badge">{currentPrompt.promptBadge}</span>
              )}
              <h2 className="quest-prompt-text">{currentPrompt.promptText}</h2>
              {currentPrompt.promptSubtext && (
                <p className="quest-prompt-subtext">{currentPrompt.promptSubtext}</p>
              )}
            </div>

            <button
              type="button"
              className="quest-speaker-btn"
              onClick={() =>
                playQuestPromptVoice(
                  currentPrompt.voiceClipId,
                  currentPrompt.voiceFallbackText,
                  true,
                )
              }
            >
              <SoundWaveSpeakerIcon size={15} />
              <span>Hear Clue</span>
            </button>
          </div>

          {phase === 'celebrating-stop' && (
            <div className="quest-feedback-banner quest-feedback-banner--success">
              {skinMeta.celebrationLine}
            </div>
          )}

          {phase === 'teaching-mistake' && (
            <div className="quest-feedback-banner quest-feedback-banner--teach">
              <span>{teachMessage}</span>
              <WordSoundButton text={teachMessage} size="xs" variant="ghost" />
            </div>
          )}

          {phase === 'finished' && journeyContext ? (
            <div
              className="quest-widget-body"
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 12,
              }}
            >
              <span className="badge-pill badge-pill--mint">
                {flawless ? 'GOLDEN CROWN • ZERO MISTAKES!' : 'ADVENTURE COMPLETE!'}
              </span>
              <h3 className="font-display" style={{ fontSize: '1.45rem', margin: 0 }}>
                {ADVENTURE_SKIN_META[skinId].finaleHeadline}
              </h3>
              <button
                type="button"
                className="btn-primary"
                style={{ alignSelf: 'center', marginTop: 8 }}
                onClick={() => journeyContext.onActivityComplete()}
              >
                Finish Activity →
              </button>
            </div>
          ) : (
            <QuestPromptWidgetSwitch
              prompt={currentPrompt}
              locked={isLocked}
              teachingMistake={phase === 'teaching-mistake'}
              soundEnabled={soundEnabled}
              onSolve={handleSolveStop}
              onMistake={handleMistake}
            />
          )}
        </div>
      </div>
    </GameStage>
  );
}

export function MysteryExpressBoard(props: Omit<QuestAdventureBoardProps, 'skinId'>) {
  return <QuestAdventureBoard skinId="mystery-express" {...props} />;
}

export function PebbleCreekBoard(props: Omit<QuestAdventureBoardProps, 'skinId'>) {
  return <QuestAdventureBoard skinId="pebble-creek" {...props} />;
}

export function CloudBalloonBoard(props: Omit<QuestAdventureBoardProps, 'skinId'>) {
  return <QuestAdventureBoard skinId="cloud-balloon" {...props} />;
}

export function TreasureKeysBoard(props: Omit<QuestAdventureBoardProps, 'skinId'>) {
  return <QuestAdventureBoard skinId="treasure-keys" {...props} />;
}
