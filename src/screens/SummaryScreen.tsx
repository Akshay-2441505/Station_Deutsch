// ============================================================
// SummaryScreen.tsx — full-bleed mint session summary per V2
// ============================================================
import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Share2 } from 'lucide-react';
import PillButton from '../components/PillButton';
import { useAppStore } from '../store/useAppStore';
import { getReviewStatus, getTrendMessage } from '../lib/features';
import { now } from '../lib/clock';
import { SKILLCASE_DEMO_URL, getInviteWhatsAppUrl } from '../lib/copy';
import { buildUtmUrl, hasSeenAllWords, track } from '../lib/metrics';
import wordsData from '../../content/words.json';
import type { Word } from '../lib/types';

const allWords = wordsData as Word[];

interface SummaryResult {
  wordId: string;
  correct: boolean;
}

export default function SummaryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { results?: SummaryResult[]; accuracy?: number } | null;
  const results: SummaryResult[] = state?.results ?? [];

  const progress = useAppStore((s) => s.progress);
  const sessions = useAppStore((s) => s.sessions);
  const level = useAppStore((s) => s.level ?? 'A1');

  const [demoDismissed, setDemoDismissed] = useState(false);

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

  const allWordsSeen = useMemo(() => hasSeenAllWords(allWords, progress, level), [progress, level]);

  const handleInvitePartner = () => {
    track('share_clicked', { context: 'invite_study_partner_summary', channel: 'whatsapp' });
    window.open(getInviteWhatsAppUrl(), '_blank');
  };

  const demoUrl = useMemo(() => {
    if (!SKILLCASE_DEMO_URL) return '';
    return buildUtmUrl(SKILLCASE_DEMO_URL, allWordsSeen ? 'all_words_seen' : 'summary');
  }, [allWordsSeen]);

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

        {/* All words seen milestone banner if applicable */}
        {allWordsSeen && (
          <p
            className="text-small"
            style={{
              background: 'rgba(0, 0, 0, 0.08)',
              padding: '6px 12px',
              borderRadius: 14,
              display: 'inline-block',
              margin: '12px auto 0',
              fontWeight: 600,
            }}
          >
            ⭐ You've practised all {level} words!
          </p>
        )}
      </div>

      <div style={{ padding: '0 var(--side-pad)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PillButton variant="primary" id="keep-practising-btn" onClick={() => navigate('/session')}>
          Keep practising
        </PillButton>
        <PillButton variant="on-color" id="summary-home-btn" onClick={() => navigate('/home')}>
          Back to home
        </PillButton>

        {/* Invite a study partner */}
        <button
          id="invite-partner-summary-btn"
          onClick={handleInvitePartner}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--black)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 0',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          <Share2 size={16} /> Invite a study partner
        </button>

        {/* Quiet trainer demo link: once per session, dismissible, hidden when empty */}
        {SKILLCASE_DEMO_URL && !demoDismissed && demoUrl && (
          <div
            id="summary-trainer-demo-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.07)',
              padding: '8px 12px',
              borderRadius: 16,
              marginTop: 4,
            }}
          >
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="summary-demo-link"
              onClick={() =>
                track('demo_link_clicked', {
                  placement: allWordsSeen ? 'all_words_seen' : 'summary',
                  url: demoUrl,
                })
              }
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--black)',
                textDecoration: 'underline',
                textAlign: 'left',
              }}
            >
              Practise live with a trainer: free demo
            </a>
            <button
              onClick={() => setDemoDismissed(true)}
              aria-label="Dismiss free demo link"
              id="dismiss-demo-link-btn"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--black)',
                opacity: 0.6,
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
