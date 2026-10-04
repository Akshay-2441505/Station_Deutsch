// ============================================================
// PlacementScreen.tsx — 8-question quick check
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { scorePlacement } from '../lib/placement';
import placementItems from '../../content/placement.json';
import type { PlacementItem } from '../lib/types';
import TopBar from '../components/TopBar';
import ProgressBar from '../components/ProgressBar';
import PillButton from '../components/PillButton';

const items = placementItems as PlacementItem[];

export default function PlacementScreen() {
  const navigate = useNavigate();
  const setLevel = useAppStore((s) => s.setLevel);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const current = items[index];

  const choose = (optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
  };

  const confirm = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    if (index + 1 >= items.length) {
      const result = scorePlacement(items, newAnswers);
      setLevel(result.suggestedLevel, 'placement');
      navigate('/placement-result', { state: result });
    } else {
      setAnswers(newAnswers);
      setSelected(null);
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="screen screen--white">
      <TopBar
        variant="close"
        onAction={() => navigate('/choose-level')}
        right={<span className="text-small">{index + 1} / {items.length}</span>}
      />

      <div style={{ paddingBottom: 16 }}>
        <ProgressBar value={(index) / items.length} label={`Question ${index + 1} of ${items.length}`} />
      </div>

      <div className="content">
        <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 8 }}>
          {current.kind === 'article' ? 'Choose the article' : 'Choose the correct answer'}
        </p>
        <p className="text-title" style={{ marginBottom: 32 }}>{current.prompt}</p>

        <div className="stack">
          {current.options.map((opt, i) => {
            let cls = 'option-btn';
            if (selected !== null) {
              if (i === current.answerIndex) cls += ' option-btn--correct';
              else if (i === selected) cls += ' option-btn--wrong';
            } else if (i === selected) {
              cls += ' option-btn--selected';
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => choose(i)}
                aria-pressed={selected === i}
                id={`placement-opt-${i}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="action-zone" style={{ position: 'static', background: 'transparent', marginTop: 'auto' }}>
        <PillButton
          variant="primary"
          id="placement-next"
          onClick={confirm}
          disabled={selected === null}
        >
          {index + 1 >= items.length ? 'See result' : 'Next'}
        </PillButton>
      </div>
    </div>
  );
}
