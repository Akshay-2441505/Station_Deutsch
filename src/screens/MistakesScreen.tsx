// ============================================================
// MistakesScreen.tsx — My mistakes review screen per V2 §3.2
// ============================================================

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getMistakesList } from '../lib/features';
import wordsData from '../../content/words.json';
import type { Word } from '../lib/types';
import TopBar from '../components/TopBar';
import ArticleChip from '../components/ArticleChip';
import PillButton from '../components/PillButton';

const allWords = wordsData as Word[];
const wordMap = Object.fromEntries(allWords.map((w) => [w.id, w]));

export default function MistakesScreen() {
  const navigate = useNavigate();
  const attempts = useAppStore((s) => s.attempts);

  const mistakes = useMemo(() => {
    return getMistakesList(attempts, wordMap);
  }, [attempts]);

  const handlePractiseMistakes = () => {
    const pool = mistakes.map((m) => m.word.id);
    navigate('/session', { state: { pool } });
  };

  return (
    <div
      className="screen screen--white"
      style={{
        padding: 0,
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '0 var(--side-pad)', background: 'var(--white)', flexShrink: 0, borderBottom: '1px solid var(--line)' }}>
        <TopBar variant="back" title="My mistakes" onAction={() => navigate(-1)} />
      </div>

      <div
        className="content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px var(--side-pad) 32px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {mistakes.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto 0', padding: '32px 0' }}>
            <p className="text-body" style={{ color: 'var(--grey)' }}>
              No mistakes recorded yet. Keep practising!
            </p>
            <div style={{ marginTop: 24 }}>
              <PillButton variant="primary" onClick={() => navigate('/home')}>
                Back to home
              </PillButton>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <PillButton variant="primary" id="practise-mistakes-btn" onClick={handlePractiseMistakes}>
                Practise these ({mistakes.length})
              </PillButton>
            </div>

            <div className="stack" style={{ gap: 16 }}>
              {mistakes.map(({ word, isFixed, latestError, timeAgo }) => (
                <div
                  key={word.id}
                  style={{
                    border: '1.5px solid var(--line)',
                    borderRadius: 16,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {word.article && <ArticleChip article={word.article} />}
                      <span className="text-title" lang="de">{word.de}</span>
                      <span className="text-small" style={{ color: 'var(--grey)' }}>({word.en})</span>
                    </div>

                    {isFixed ? (
                      <span
                        className="chip"
                        style={{
                          background: 'var(--mint)',
                          color: 'var(--black)',
                          fontWeight: 700,
                          fontSize: 12,
                          height: 22,
                          padding: '0 8px',
                        }}
                      >
                        Fixed
                      </span>
                    ) : (
                      <span
                        className="chip"
                        style={{
                          background: 'var(--coral)',
                          color: 'var(--black)',
                          fontWeight: 600,
                          fontSize: 12,
                          height: 22,
                          padding: '0 8px',
                        }}
                      >
                        Needs work
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 14, lineHeight: '20px', color: 'var(--grey)' }}>
                    <div>
                      You chose: <span style={{ color: 'var(--coral)', fontWeight: 600 }}>{latestError.given || '—'}</span>
                    </div>
                    <div>
                      Correct: <span style={{ color: 'var(--black)', fontWeight: 600 }}>{latestError.expected || word.de}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span className="text-small" style={{ color: 'var(--grey)', textTransform: 'capitalize' }}>
                      {latestError.errorType ?? 'general'} error
                    </span>
                    <span className="text-small" style={{ color: 'var(--grey)' }}>{timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
