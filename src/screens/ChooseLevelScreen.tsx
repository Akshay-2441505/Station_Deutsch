// ============================================================
// ChooseLevelScreen.tsx
// ============================================================
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import PillButton from '../components/PillButton';
import TopBar from '../components/TopBar';

export default function ChooseLevelScreen() {
  const navigate = useNavigate();
  const setLevel = useAppStore((s) => s.setLevel);

  const pick = (level: 'A1' | 'A2') => {
    setLevel(level, 'manual');
    navigate('/home');
  };

  return (
    <div className="screen screen--white">
      <TopBar variant="back" />
      <div className="content" style={{ justifyContent: 'center' }}>
        <h1 className="text-title" style={{ marginBottom: 8 }}>Choose your level</h1>
        <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 32 }}>
          You can change this later in Settings.
        </p>
        <div className="stack">
          <PillButton variant="outline" id="choose-a1" onClick={() => pick('A1')}>
            A1 — Beginner
          </PillButton>
          <PillButton variant="outline" id="choose-a2" onClick={() => pick('A2')}>
            A2 — Elementary
          </PillButton>
        </div>
      </div>
    </div>
  );
}
