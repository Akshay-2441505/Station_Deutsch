// ============================================================
// SummaryScreen.tsx — full-bleed mint session summary per V2
// ============================================================
import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PillButton from '../components/PillButton';
import { useAppStore } from '../store/useAppStore';
import { getReviewStatus, getTrendMessage } from '../lib/features';
import { now } from '../lib/clock';
import { SKILLCASE_DEMO_URL } from '../lib/constants';

interface SummaryResult { wordId: string; correct: boolean }

export default function SummaryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { results?: SummaryResult[]; accuracy?: number } | null;
  const results: SummaryResult[] = state?.results ?? [];

  const progress = useAppStore((s) => s.progress);
  const sessions = useAppStore((s) => s.sessions);

  const firstTry = results;
  const correctCount = firstTry.filter((r) => r.correct).length;
  const accuracy = state?.accuracy ?? (firstTry.length > 0 ? Math.round((correctCount / firstTry.length) * 100) : 0);

  const atMs = now();
  const reviewStatus = useMemo(() => getReviewStatus(progress, atMs), [progress, atMs]);
  const trendMessage = useMemo(() => {
    // If the current session was already recorded at the top of sessions, compare with previous
    const prevSessions = sessions.length > 1 ? sessions.slice(1) : [];
    return getTrendMessage(prevSessions, accuracy);
  }, [sessions, accuracy]);

  return (
    <div className="screen screen--mint" style={{ justifyContent: 'space-between', paddingBottom: 32 }}>
      <div className="content" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <h1 className="text-title" style={{ marginBottom: 12 }}>Session done</h1>
        <div style={{ margin: '24px 0 16px' }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              fontSize: 64,
              lineHeight: '68px',
            }}
          >
            {accuracy}%
          </div>
          <p className="text-body" style={{ color: 'var(--black)', opacity: 0.75, marginTop: 4, fontWeight: 500 }}>
            accuracy
          </p>
        </div>

        <p className="text-body" style={{ fontWeight: 600, marginBottom: 8 }}>
          {correctCount} of {firstTry.length} correct on first try.
        </p>

        {/* Trend message */}
        {trendMessage && (
          <p className="text-small" style={{ color: 'var(--black)', opacity: 0.8, marginBottom: 8, fontWeight: 600 }}>
            {trendMessage}
          </p>
        )}

        {/* Next review message */}
        <p className="text-small" style={{ color: 'var(--black)', opacity: 0.85, fontWeight: 600 }}>
          {reviewStatus.message}
        </p>
      </div>

      <div style={{ padding: '0 var(--side-pad)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PillButton variant="primary" id="keep-practising-btn" onClick={() => navigate('/session')}>
          Keep practising
        </PillButton>
        <PillButton variant="on-color" id="summary-home-btn" onClick={() => navigate('/home')}>
          Back to home
        </PillButton>

        {SKILLCASE_DEMO_URL ? (
          <a
            href={SKILLCASE_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 14,
              color: 'var(--black)',
              opacity: 0.7,
              textAlign: 'center',
              textDecoration: 'underline',
              marginTop: 8,
            }}
          >
            Learn live with Skillcase
          </a>
        ) : null}
      </div>
    </div>
  );
}
