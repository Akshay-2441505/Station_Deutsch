// ============================================================
// PlacementResultScreen.tsx
// ============================================================
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { PlacementResult } from '../lib/placement';
import PillButton from '../components/PillButton';
import { track } from '../lib/metrics';

export default function PlacementResultScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state as PlacementResult | undefined;
  const level = useAppStore((s) => s.level);

  const handleChangeLevel = () => navigate('/choose-level');

  const handleStartLearning = () => {
    track('onboarding_completed', { source: 'placement', level: level ?? 'A1' });
    navigate('/home');
  };

  return (
    <div className="screen screen--white">
      <div className="content" style={{ justifyContent: 'center' }}>
        <p className="text-small" style={{ color: 'var(--grey)', marginBottom: 12 }}>Your starting point</p>
        <h1 className="text-headword" style={{ marginBottom: 16 }}>{level ?? 'A1'}</h1>
        <p className="text-body" style={{ marginBottom: 8 }}>
          This is a starting point, not a grade. You can change it at any time.
        </p>
        {result && (
          <p className="text-small" style={{ color: 'var(--grey)', marginTop: 8 }}>
            A1 score: {result.a1Correct}/{result.a1Total} · A2 score: {result.a2Correct}/{result.a2Total}
          </p>
        )}

        <div className="divider" />

        <button
          className="text-button"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grey)' }}
          id="change-level-link"
          onClick={handleChangeLevel}
        >
          Change level
        </button>
      </div>

      <div className="action-zone" style={{ position: 'static', background: 'transparent', marginTop: 'auto' }}>
        <PillButton variant="primary" id="start-learning-btn" onClick={handleStartLearning}>
          Start learning
        </PillButton>
      </div>
    </div>
  );
}
