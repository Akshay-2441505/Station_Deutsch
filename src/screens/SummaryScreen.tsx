// ============================================================
// SummaryScreen.tsx — session summary
// ============================================================
import { useNavigate, useLocation } from 'react-router-dom';
import PillButton from '../components/PillButton';

interface SummaryResult { wordId: string; correct: boolean }

export default function SummaryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const results: SummaryResult[] = (location.state as any)?.results ?? [];

  const firstTry = results;
  const correctCount = firstTry.filter((r) => r.correct).length;
  const accuracy = firstTry.length > 0 ? Math.round((correctCount / firstTry.length) * 100) : 0;

  return (
    <div className="screen screen--white">
      <div className="content" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <h1 className="text-title" style={{ marginBottom: 8 }}>Session done</h1>
        <div style={{ margin: '32px 0' }}>
          <div className="text-stat">{accuracy}%</div>
          <p className="text-body" style={{ color: 'var(--grey)', marginTop: 8 }}>
            accuracy
          </p>
        </div>
        <p className="text-body">
          {correctCount} of {firstTry.length} correct on first try.
        </p>
      </div>

      <div style={{ padding: '16px var(--side-pad)', paddingBottom: 24 }}>
        <PillButton variant="primary" id="keep-practising-btn" onClick={() => navigate('/session')}>
          Keep practising
        </PillButton>
        <div style={{ marginTop: 12 }}>
          <PillButton variant="outline" id="summary-home-btn" onClick={() => navigate('/home')}>
            Back to home
          </PillButton>
        </div>
      </div>
    </div>
  );
}
