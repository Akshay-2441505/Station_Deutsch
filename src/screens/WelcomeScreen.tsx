// ============================================================
// WelcomeScreen.tsx — full-bleed lemon welcome screen per V2
// ============================================================
import { useNavigate } from 'react-router-dom';
import PillButton from '../components/PillButton';
import { useAppStore } from '../store/useAppStore';
import { WELCOME_BENEFIT } from '../lib/copy';
import { track } from '../lib/metrics';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const loadDemoHistory = useAppStore((s) => s.loadDemoHistory);

  const handleTrySample = () => {
    track('onboarding_completed', { source: 'sample', level: 'A1' });
    loadDemoHistory();
    navigate('/home');
  };

  return (
    <div className="screen screen--lemon" style={{ justifyContent: 'space-between', paddingBottom: 32 }}>
      <div style={{ paddingTop: 32 }}>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            fontSize: 20,
            lineHeight: '24px',
            marginBottom: 36,
            letterSpacing: '-0.02em',
          }}
        >
          Station Deutsch
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            fontSize: 44,
            lineHeight: '48px',
            marginBottom: 12,
            letterSpacing: '-0.03em',
          }}
        >
          Medical German for nurses.
        </h1>

        {/* Editable one-line benefit from copy.ts */}
        <p
          id="welcome-benefit-line"
          style={{
            fontSize: 18,
            lineHeight: '25px',
            fontWeight: 600,
            color: 'var(--black)',
            marginBottom: 14,
          }}
        >
          {WELCOME_BENEFIT}
        </p>

        <p className="text-body" style={{ fontWeight: 500, marginBottom: 24, fontSize: 16, lineHeight: '24px', opacity: 0.85 }}>
          A1 and A2 words. A few minutes a day.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'rgba(0,0,0,0.75)' }}>
          <p className="text-body" style={{ fontSize: 16, lineHeight: '24px' }}>• Learn a few words.</p>
          <p className="text-body" style={{ fontSize: 16, lineHeight: '24px' }}>• Practise them.</p>
          <p className="text-body" style={{ fontSize: 16, lineHeight: '24px' }}>• We bring back the ones you miss.</p>
        </div>
      </div>

      <div className="action-zone" style={{ position: 'static', background: 'transparent', padding: 0, marginTop: 'auto', gap: 12 }}>
        <PillButton variant="primary" id="start-check-btn" onClick={() => navigate('/placement')}>
          Start check
        </PillButton>
        <PillButton variant="on-color" id="choose-level-btn" onClick={() => navigate('/choose-level')}>
          Choose my level
        </PillButton>
        <button
          id="try-sample-btn"
          onClick={handleTrySample}
          style={{
            minHeight: 44,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--black)',
            textDecoration: 'underline',
            textUnderlineOffset: 4,
            padding: 8,
          }}
        >
          Try with sample progress
        </button>
      </div>
    </div>
  );
}
