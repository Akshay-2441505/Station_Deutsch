// ============================================================
// HomeScreen.tsx — Home dashboard with full-bleed lemon top band
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
  const isDemoData = useAppStore((s) => s.isDemoData);
  const resetAll = useAppStore((s) => s.resetAll);

  const atMs = now();

  // Date key for today: YYYY-MM-DD
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
    <div className="screen screen--white" style={{ padding: 0 }}>
      {/* Full-bleed lemon band at top */}
      <div
        style={{
          background: 'var(--lemon)',
          padding: '16px var(--side-pad) 24px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <span className="text-small" style={{ color: 'var(--black)', opacity: 0.8 }}>
              Your level: {level ?? '—'}&nbsp;
            </span>
            <button
              className="text-small"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--black)',
                fontWeight: 700,
                textDecoration: 'underline',
                padding: 0,
              }}
              onClick={() => navigate('/choose-level')}
              id="change-level-home"
            >
              (change)
            </button>
          </div>
          <button
            className="icon-btn"
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            id="settings-btn"
            style={{ color: 'var(--black)', borderColor: 'var(--black)' }}
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Sample data banner */}
        {isDemoData && (
          <div
            style={{
              background: 'var(--black)',
              color: 'var(--white)',
              padding: '8px 14px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <span>Sample progress loaded</span>
            <button
              onClick={() => {
                resetAll();
                navigate('/');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--lemon)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Reset
            </button>
          </div>
        )}

        <h1 id="today-heading" className="text-small" style={{ color: 'var(--black)', opacity: 0.75, marginBottom: 4 }}>
          Today
        </h1>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 40,
            lineHeight: '44px',
            fontWeight: 700,
            marginBottom: 12,
            letterSpacing: '-0.02em',
          }}
        >
          {todayAnswers} of {DAILY_GOAL}
        </div>
        <ProgressBar value={todayAnswers / DAILY_GOAL} label={`${todayAnswers} of ${DAILY_GOAL} answers today`} />

        {isCaughtUp && (
          <p className="text-small" style={{ color: 'var(--black)', opacity: 0.8, marginTop: 12 }}>
            You're caught up. Practise anyway to keep words fresh.
          </p>
        )}
      </div>

      {/* Main body on white */}
      <div className="content" style={{ padding: '24px var(--side-pad)', flex: 1 }}>
        {/* Practice actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
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
            marginTop: 'auto',
          }}
          id="progress-link"
          onClick={() => navigate('/progress')}
        >
          Progress <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
