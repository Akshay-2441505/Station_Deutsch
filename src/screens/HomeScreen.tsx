// ============================================================
// HomeScreen.tsx
// ============================================================
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { now } from '../lib/clock';
import { isDue } from '../lib/scheduler';
import wordsData from '../../content/words.json';
import type { Word } from '../lib/types';
import PillButton from '../components/PillButton';
import ProgressBar from '../components/ProgressBar';

const allWords = wordsData as Word[];

const DAILY_GOAL = 10;

export default function HomeScreen() {
  const navigate = useNavigate();
  const level = useAppStore((s) => s.level);
  const progress = useAppStore((s) => s.progress);
  const attempts = useAppStore((s) => s.attempts);

  const atMs = now();

  const todayKey = useMemo(() => {
    const d = new Date(atMs);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [atMs]);

  // Today's answered count
  const todayAnswers = useMemo(() => {
    return attempts.filter((a) => {
      const d = new Date(a.at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return key === todayKey && !a.isRetry;
    }).length;
  }, [attempts, todayKey]);

  const dueWords = useMemo(() => {
    if (!level) return [];
    return allWords.filter((w) => {
      const prog = progress[w.id];
      return prog && prog.box > 0 && isDue(prog, atMs);
    });
  }, [progress, level, atMs]);

  const weakWords = useMemo(() => {
    return Object.values(progress)
      .filter((p) => p.stubborn)
      .slice(0, 3);
  }, [progress]);

  const hasUnseenWords = useMemo(() => {
    if (!level) return false;
    return allWords.some((w) => w.level === level && (!progress[w.id] || progress[w.id].box === 0));
  }, [progress, level]);

  const canPractise = Object.values(progress).some((p) => p.box > 0);
  const isCaughtUp = canPractise && dueWords.length === 0;

  return (
    <div className="screen screen--white">
      {/* Header */}
      <div className="topbar">
        <div>
          <span className="text-small" style={{ color: 'var(--grey)' }}>
            Your level: {level ?? '—'}&nbsp;
          </span>
          <button
            className="text-small"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--black)', fontWeight: 600 }}
            onClick={() => navigate('/choose-level')}
            id="change-level-home"
          >
            (change)
          </button>
        </div>
        <button className="icon-btn" onClick={() => navigate('/settings')} aria-label="Settings" id="settings-btn">
          <Settings size={24} strokeWidth={2} />
        </button>
      </div>

      <div className="content">
        {/* Daily goal */}
        <section aria-labelledby="today-heading" style={{ marginBottom: 28 }}>
          <h2 id="today-heading" className="text-title" style={{ marginBottom: 4 }}>Today</h2>
          <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 12 }}>
            {todayAnswers} of {DAILY_GOAL} answers
          </p>
          <ProgressBar value={todayAnswers / DAILY_GOAL} label={`${todayAnswers} of ${DAILY_GOAL} answers today`} />

          {isCaughtUp && (
            <p className="text-small" style={{ color: 'var(--grey)', marginTop: 12 }}>
              You're caught up. Practise anyway to keep words fresh.
            </p>
          )}
        </section>

        {/* Weak words */}
        {weakWords.length > 0 && (
          <section aria-labelledby="weak-heading" style={{ marginBottom: 24 }}>
            <h2 id="weak-heading" className="text-small" style={{ color: 'var(--grey)', marginBottom: 8 }}>
              Weak words ({weakWords.length})
            </h2>
            <div className="stack">
              {weakWords.map((w) => {
                const word = allWords.find((wd) => wd.id === w.wordId);
                const totalMissed = w.errorCounts.article + w.errorCounts.meaning + w.errorCounts.spelling;
                return word ? (
                  <div key={w.wordId} className="text-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span lang="de">{word.article ? `${word.article} ` : ''}{word.de}</span>
                    <span className="badge" style={{ color: 'var(--coral)' }}>
                      {totalMissed > 0 ? `missed ${totalMissed} time${totalMissed === 1 ? '' : 's'}` : 'needs practice'}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* Progress link */}
        <button
          className="text-button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--grey)',
            textAlign: 'left',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            width: 'fit-content',
            padding: 0,
          }}
          id="progress-link"
          onClick={() => navigate('/progress')}
        >
          Progress <ChevronRight size={18} />
        </button>
      </div>

      {/* Actions */}
      <div className="action-zone" style={{ position: 'static', background: 'transparent', marginTop: 'auto', paddingBottom: 24 }}>
        {canPractise ? (
          <PillButton variant="primary" id="practise-btn" onClick={() => navigate('/session')}>
            {isCaughtUp ? 'Practise anyway' : 'Practise'}
          </PillButton>
        ) : (
          <PillButton variant="primary" id="practise-btn" disabled>
            Practise
          </PillButton>
        )}
        {hasUnseenWords && (
          <PillButton variant="outline" id="learn-btn" onClick={() => navigate('/learn')}>
            Learn new words
          </PillButton>
        )}
      </div>
    </div>
  );
}
