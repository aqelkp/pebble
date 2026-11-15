import { useMemo, useState } from 'react';
import { PebbleMark } from './BrandLogo';

interface ParentGateModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function randomFactor(min: number, max: number): number {
  const span = max - min + 1;
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return min + (arr[0] % span);
  }
  return min + Math.floor(Math.random() * span);
}

export function ParentGateModal({ onSuccess, onCancel }: ParentGateModalProps) {
  const challenge = useMemo(() => {
    const a = randomFactor(3, 6);
    const b = randomFactor(3, 7);
    const answer = a * b;
    const distractorCandidates = [
      answer - 2,
      answer + 2,
      answer - 3,
      answer + 4,
      answer + 3,
      answer - 1,
      answer + 6,
    ].filter((val) => val > 0 && val !== answer);

    const optionsSet = new Set<number>([answer]);
    for (const candidate of distractorCandidates) {
      if (optionsSet.size >= 4) break;
      optionsSet.add(candidate);
    }

    const options = Array.from(optionsSet).sort((x, y) => x - y);
    return { a, b, answer, options };
  }, []);

  const [wrongMsg, setWrongMsg] = useState<string | null>(null);

  const handlePick = (value: number) => {
    if (value === challenge.answer) {
      onSuccess();
      return;
    }
    setWrongMsg('Not quite — pick the matching answer to open Parent Settings.');
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-gate-title"
    >
      <div className="winner-modal parent-gate-modal">
        <div className="parent-gate-modal__mark">
          <PebbleMark size={40} />
        </div>
        <span className="badge-pill badge-pill--indigo">Grown-Ups Only</span>
        <h2 id="parent-gate-title" style={{ marginTop: 10 }}>
          Parent Check: What is {challenge.a} × {challenge.b}?
        </h2>
        <p className="winner-subtitle" style={{ marginBottom: 18 }}>
          A quick check keeps the Activity Book calm and distraction-free for your child.
        </p>

        <div className="parent-gate-options" role="group" aria-label="Answer choices">
          {challenge.options.map((opt) => (
            <button
              key={opt}
              type="button"
              className="parent-gate-opt-btn"
              data-correct={opt === challenge.answer ? 'true' : 'false'}
              onClick={() => handlePick(opt)}
            >
              {opt}
            </button>
          ))}
        </div>

        {wrongMsg && (
          <p className="parent-gate-hint" role="status">
            {wrongMsg}
          </p>
        )}

        <div className="winner-actions" style={{ marginTop: 18 }}>
          <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
