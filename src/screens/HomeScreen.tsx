// ============================================================
// HomeScreen.tsx — Home dashboard with full-bleed lemon top band
// Topic map, weak words share, and mistakes link (V2 §2.3, §3.4, §3.5)
// ============================================================
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { now } from '../lib/clock';
import { isDue } from '../lib/scheduler';
import { getTopicStats, buildShareWeakWordsUrl } from '../lib/features';
import { SKILLCASE_DEMO_URL } from '../lib/copy';
import { buildUtmUrl, hasSeenAllWords, track } from '../lib/metrics';
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

  const topicStats = useMemo(() => {
    if (!level) return [];
    return getTopicStats(allWords, progress, level);
  }, [progress, level]);

  const canPractise = Object.values(progress).some((p) => p.box > 0);
  const isCaughtUp = canPractise && dueWords.length === 0;
  const allWordsSeen = useMemo(() => {
    return hasSeenAllWords(allWords, progress, level ?? 'A1');
  }, [progress, level]);

  const handleShareWeakWords = () => {
    const weakWordObjects = weakWords
      .map((w) => allWords.find((wd) => wd.id === w.wordId))
      .filter(Boolean) as Word[];
    if (weakWordObjects.length > 0) {
      track('share_clicked', { context: 'weak_words_whatsapp', channel: 'whatsapp' });
      window.open(buildShareWeakWordsUrl(weakWordObjects), '_blank');
    }
  };

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
        {todayAnswers >= DAILY_GOAL ? (
          <div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 36,
                lineHeight: '40px',
                fontWeight: 700,
                marginBottom: 4,
                letterSpacing: '-0.02em',
              }}
            >
              Goal reached
            </div>
            <p className="text-small" style={{ color: 'var(--black)', opacity: 0.85, marginBottom: 12, fontWeight: 600 }}>
              {todayAnswers} answers today
            </p>
          </div>
        ) : (
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
        )}
        <ProgressBar
          value={Math.min(todayAnswers / DAILY_GOAL, 1)}
          label={todayAnswers >= DAILY_GOAL ? `Goal reached · ${todayAnswers} answers today` : `${todayAnswers} of ${DAILY_GOAL} answers today`}
        />

        {isCaughtUp && (
          <p className="text-small" style={{ color: 'var(--black)', opacity: 0.8, marginTop: 12 }}>
            You're caught up. Practise anyway to keep words fresh.
          </p>
        )}
      </div>

      {/* Main body on white */}
      <div className="content" style={{ padding: '24px var(--side-pad)', flex: 1 }}>
        {/* Practice action */}
        <div style={{ marginBottom: 28 }}>
          {canPractise ? (
            <PillButton variant="primary" id="practise-btn" onClick={() => navigate('/session')}>
              {isCaughtUp ? 'Practise anyway' : 'Practise'}
            </PillButton>
          ) : (
            <PillButton variant="primary" id="practise-btn" disabled>
              Practise
            </PillButton>
          )}
        </div>

        {/* 3.4 Topic map */}
        <section aria-labelledby="topics-heading" style={{ marginBottom: 28 }}>
          <h2 id="topics-heading" className="text-small" style={{ color: 'var(--grey)', marginBottom: 12 }}>
            Topics
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topicStats.map((stat) => {
              const wordsInTopic = allWords.filter((w) => w.topic === stat.topic && w.level === level);
              return (
                <button
                  key={stat.topic}
                  onClick={() => {
                    if (stat.hasUnseen) {
                      navigate('/learn', { state: { topic: stat.topic } });
                    } else {
                      navigate('/session', { state: { pool: wordsInTopic.map((w) => w.id) } });
                    }
                  }}
                  style={{
                    background: 'var(--white)',
                    border: '1.5px solid var(--line)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--black)' }}>
                      {stat.title}
                    </span>
                    <span className="text-small" style={{ color: 'var(--grey)' }}>
                      {stat.learned} of {stat.total} words
                    </span>
                  </div>
                  {!stat.hasUnseen ? (
                    <span style={{ fontSize: 13, color: 'var(--grey)' }}>
                      You've seen every {stat.title} word. <span style={{ fontWeight: 600, color: 'var(--black)' }}>Practise them</span>
                    </span>
                  ) : (
                    <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          background: 'var(--black)',
                          width: `${stat.total > 0 ? (stat.learned / stat.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Weak words & Share */}
        {weakWords.length > 0 && (
          <section aria-labelledby="weak-heading" style={{ marginBottom: 24 }}>
            <h2 id="weak-heading" className="text-small" style={{ color: 'var(--grey)', marginBottom: 8 }}>
              Weak words ({weakWords.length})
            </h2>
            <div className="stack" style={{ marginBottom: 12 }}>
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
            {/* 3.5 Send weak words on WhatsApp */}
            <div style={{ marginTop: 14 }}>
              <button
                onClick={handleShareWeakWords}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--black)',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textAlign: 'left',
                  padding: 0,
                }}
                id="share-weak-btn"
              >
                Send my weak words on WhatsApp
              </button>
              <p className="text-small" style={{ color: 'var(--grey)', marginTop: 4, fontSize: 13 }}>
                Share your stubborn words with a trainer or colleague to review together.
              </p>
            </div>
          </section>
        )}

        {/* Links row */}
        <div style={{ display: 'flex', gap: 20, marginTop: 'auto', paddingTop: 16, flexWrap: 'wrap' }}>
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
              padding: 0,
            }}
            id="words-link"
            onClick={() => navigate('/words')}
          >
            Word bank <ChevronRight size={18} />
          </button>

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
              padding: 0,
            }}
            id="mistakes-link"
            onClick={() => navigate('/mistakes')}
          >
            My mistakes <ChevronRight size={18} />
          </button>

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
              padding: 0,
            }}
            id="progress-link"
            onClick={() => navigate('/progress')}
          >
            Progress <ChevronRight size={18} />
          </button>
        </div>

        {/* Quiet trainer demo link when all words at current level have been seen */}
        {SKILLCASE_DEMO_URL && allWordsSeen && (
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <a
              href={buildUtmUrl(SKILLCASE_DEMO_URL, 'all_words_seen')}
              target="_blank"
              rel="noopener noreferrer"
              id="home-all-words-demo-link"
              onClick={() =>
                track('demo_link_clicked', {
                  placement: 'all_words_seen',
                  url: buildUtmUrl(SKILLCASE_DEMO_URL, 'all_words_seen'),
                })
              }
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--black)',
                opacity: 0.75,
                textDecoration: 'underline',
              }}
            >
              Practise live with a trainer: free demo
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
