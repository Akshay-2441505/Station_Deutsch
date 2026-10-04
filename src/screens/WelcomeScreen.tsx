// ============================================================
// WelcomeScreen.tsx
// ============================================================
import { useNavigate } from 'react-router-dom';
import PillButton from '../components/PillButton';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen screen--white">
      <div className="content" style={{ justifyContent: 'center' }}>
        <p className="text-small" style={{ color: 'var(--grey)', marginBottom: 12 }}>Station Deutsch</p>
        <h1 className="text-title" style={{ marginBottom: 16 }}>
          Medical German vocabulary for nurses.
        </h1>
        <p className="text-body" style={{ color: 'var(--grey)' }}>
          Learn and practise A1 and A2 words — a few minutes a day, between shifts.
        </p>
      </div>

      <div className="action-zone" style={{ position: 'static', background: 'transparent' }}>
        <PillButton variant="primary" id="start-check-btn" onClick={() => navigate('/placement')}>
          Start check
        </PillButton>
        <PillButton variant="outline" id="choose-level-btn" onClick={() => navigate('/choose-level')}>
          Choose my level
        </PillButton>
      </div>
    </div>
  );
}
