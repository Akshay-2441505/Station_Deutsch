// ============================================================
// SettingsScreen.tsx
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import TopBar from '../components/TopBar';
import PillButton from '../components/PillButton';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const level = useAppStore((s) => s.level);
  const setLevel = useAppStore((s) => s.setLevel);
  const simulateTomorrow = useAppStore((s) => s.simulateTomorrow);
  const loadDemoHistory = useAppStore((s) => s.loadDemoHistory);
  const resetAll = useAppStore((s) => s.resetAll);
  const isDemoData = useAppStore((s) => s.isDemoData);

  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    resetAll();
    navigate('/');
  };

  return (
    <div className="screen screen--white">
      <TopBar variant="back" title="Settings" />

      <div className="content">
        {/* Level */}
        <section aria-labelledby="level-heading" style={{ marginBottom: 32 }}>
          <h2 id="level-heading" className="text-title" style={{ marginBottom: 16 }}>Level</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['A1', 'A2'] as const).map((l) => (
              <button
                key={l}
                className={`option-btn ${level === l ? 'option-btn--selected' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setLevel(l, 'manual')}
                aria-pressed={level === l}
                id={`level-${l}`}
              >
                {l}
              </button>
            ))}
          </div>
        </section>

        <div className="divider" />

        {/* About */}
        <section aria-labelledby="about-heading" style={{ marginBottom: 32 }}>
          <h2 id="about-heading" className="text-title" style={{ marginBottom: 8 }}>About</h2>
          <p className="text-body" style={{ color: 'var(--grey)' }}>
            Station Deutsch — Medical German vocabulary practice for nurses at A1 and A2 level.
          </p>
          <p className="text-body" style={{ color: 'var(--grey)', marginTop: 8 }}>
            Progress is stored in this browser only. It will be lost if you clear browser data.
          </p>
          {isDemoData && (
            <p className="text-small" style={{ color: 'var(--coral)', marginTop: 8 }}>
              ⚠ You are viewing sample data.
            </p>
          )}
        </section>

        <div className="divider" />

        {/* Demo tools */}
        <section aria-labelledby="demo-heading" style={{ marginBottom: 32 }}>
          <h2 id="demo-heading" className="text-title" style={{ marginBottom: 4 }}>Demo tools</h2>
          <p className="text-small" style={{ color: 'var(--grey)', marginBottom: 16 }}>
            For evaluators. These affect your progress.
          </p>
          <div className="stack">
            <PillButton
              variant="outline"
              id="simulate-tomorrow"
              onClick={() => { simulateTomorrow(); navigate('/home'); }}
            >
              Simulate tomorrow
            </PillButton>
            <PillButton
              variant="outline"
              id="load-demo"
              onClick={() => { loadDemoHistory(); navigate('/home'); }}
            >
              Load demo history (sample data)
            </PillButton>
          </div>
        </section>

        <div className="divider" />

        {/* Danger zone */}
        <section>
          <PillButton
            variant="outline"
            id="reset-all"
            onClick={handleReset}
            style={resetConfirm ? { borderColor: 'var(--coral)', color: 'var(--coral)' } : {}}
          >
            {resetConfirm ? 'Tap again to confirm reset' : 'Reset all data'}
          </PillButton>
          {resetConfirm && (
            <p className="text-small" style={{ color: 'var(--grey)', marginTop: 8, textAlign: 'center' }}>
              This cannot be undone.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
