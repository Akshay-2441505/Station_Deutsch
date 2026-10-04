// ============================================================
// SummaryScreen.tsx — full-bleed mint session summary per V2
// ============================================================
import { useNavigate, useLocation } from 'react-router-dom';
import PillButton from '../components/PillButton';

interface SummaryResult { wordId: string; correct: boolean }

export default function SummaryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const results: SummaryResult[] = (location.state as { results?: SummaryResult[] })?.results ?? [];

  const firstTry = results;
  const correctCount = firstTry.filter((r) => r.correct).length;
  const accuracy = firstTry.length > 0 ? Math.round((correctCount / firstTry.length) * 100) : 0;

  return (
    <div className="screen screen--mint" style={{ justifyContent: 'space-between', paddingBottom: 32 }}>
      <div className="content" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <h1 className="text-title" style={{ marginBottom: 12 }}>Session done</h1>
        <div style={{ margin: '36px 0' }}>
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
          <p className="text-body" style={{ color: 'var(--black)', opacity: 0.75, marginTop: 8, fontWeight: 500 }}>
            accuracy
          </p>
        </div>
        <p className="text-body" style={{ fontWeight: 500 }}>
          {correctCount} of {firstTry.length} correct on first try.
        </p>
      </div>

      <div style={{ padding: '0 var(--side-pad)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PillButton variant="primary" id="keep-practising-btn" onClick={() => navigate('/session')}>
          Keep practising
        </PillButton>
        <PillButton variant="on-color" id="summary-home-btn" onClick={() => navigate('/home')}>
          Back to home
        </PillButton>
      </div>
    </div>
  );
}
