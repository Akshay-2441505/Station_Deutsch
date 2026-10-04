// ============================================================
// ProgressScreen.tsx — black screen with stats
// ============================================================
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { stateLabel } from '../lib/types';
import wordsData from '../../content/words.json';
import type { Word } from '../lib/types';
import TopBar from '../components/TopBar';
import PillButton from '../components/PillButton';

const allWords = wordsData as Word[];

export default function ProgressScreen() {
  const navigate = useNavigate();
  const progress = useAppStore((s) => s.progress);
  const attempts = useAppStore((s) => s.attempts);

  const stateCounts = useMemo(() => {
    const counts = { New: 0, Learning: 0, Familiar: 0, Strong: 0, Mastered: 0 };
    for (const word of allWords) {
      const prog = progress[word.id];
      const box = prog?.box ?? 0;
      const label = stateLabel(box);
      counts[label]++;
    }
    return counts;
  }, [progress]);

  const weakWords = useMemo(() => {
    return Object.values(progress)
      .filter((p) => p.stubborn)
      .sort((a, b) => a.box - b.box)
      .slice(0, 5)
      .map((p) => ({
        prog: p,
        word: allWords.find((w) => w.id === p.wordId),
      }))
      .filter((x) => x.word);
  }, [progress]);

  const errorCounts = useMemo(() => {
    const counts = { article: 0, spelling: 0, meaning: 0, plural: 0 };
    for (const a of attempts) {
      if (a.errorType) counts[a.errorType]++;
    }
    return counts;
  }, [attempts]);

  const maxError = Math.max(...Object.values(errorCounts), 1);

  return (
    <div className="screen screen--black">
      <TopBar variant="back" title="Progress" />

      <div className="content">
        {/* Words by state */}
        <section aria-labelledby="state-heading" style={{ marginBottom: 28 }}>
          <h2 id="state-heading" className="text-small" style={{ color: 'var(--line)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Words by state
          </h2>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {(Object.entries(stateCounts) as Array<[string, number]>).map(([label, count]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div className="text-stat" style={{ color: 'var(--lemon)' }}>{count}</div>
                <div className="text-small" style={{ color: 'var(--line)' }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="divider" />

        {/* Weak words */}
        {weakWords.length > 0 && (
          <section aria-labelledby="weak-heading" style={{ marginBottom: 28 }}>
            <h2 id="weak-heading" className="text-small" style={{ color: 'var(--line)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Weak words
            </h2>
            <div className="stack" style={{ marginBottom: 16 }}>
              {weakWords.map(({ prog, word }) => (
                <div key={prog.wordId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span lang="de" className="text-body">
                    {word?.article ? `${word.article} ` : ''}{word?.de}
                  </span>
                  <span className="text-small" style={{ color: 'var(--coral)' }}>
                    missed {prog.errorCounts.meaning + prog.errorCounts.article + prog.errorCounts.spelling}×
                  </span>
                </div>
              ))}
            </div>
            <PillButton variant="on-color" id="practise-weak-btn" onClick={() => navigate('/session')}>
              Practise these
            </PillButton>
          </section>
        )}

        <div className="divider" />

        {/* Mistakes by type */}
        <section aria-labelledby="errors-heading">
          <h2 id="errors-heading" className="text-small" style={{ color: 'var(--line)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Mistakes by type
          </h2>
          <div className="stack">
            {(Object.entries(errorCounts) as Array<[string, number]>).map(([type, count]) => (
              <div key={type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="text-small" style={{ textTransform: 'capitalize' }}>{type}</span>
                  <span className="text-small" style={{ color: 'var(--line)' }}>{count}</span>
                </div>
                <div style={{ height: 8, background: '#333', borderRadius: 4 }}>
                  <div style={{
                    height: '100%',
                    background: 'var(--lemon)',
                    borderRadius: 4,
                    width: `${(count / maxError) * 100}%`,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
