// ============================================================
// LearnScreen.tsx — flashcard batch learning
// ============================================================
import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { composeLearnBatch } from '../lib/session';
import wordsData from '../../content/words.json';
import type { Word, Topic } from '../lib/types';
import TopBar from '../components/TopBar';
import ArticleChip from '../components/ArticleChip';
import AudioButton from '../components/AudioButton';
import PillButton from '../components/PillButton';

const allWords = wordsData as Word[];

const TOPIC_LABELS: Record<string, string> = {
  body: 'Body',
  symptoms: 'Symptoms',
  care: 'Care actions',
  ward: 'Ward & Equipment',
  patient: 'Patient interaction',
};

export default function LearnScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationTopic = (location.state as { topic?: Topic } | null)?.topic;

  const level = useAppStore((s) => s.level);
  const progress = useAppStore((s) => s.progress);

  const batch = useMemo(() => {
    if (!level) return [];
    return composeLearnBatch({ allWords, progress, level, topic: locationTopic });
  }, [level, progress, locationTopic]);

  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState<'meaning' | 'example' | 'tip'>('meaning');

  if (!level) { navigate('/'); return null; }
  if (batch.length === 0) {
    return (
      <div className="screen screen--white">
        <TopBar variant="back" />
        <div className="content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p className="text-body" style={{ color: 'var(--grey)' }}>
            No new words at {level} level. Practise to keep words fresh.
          </p>
          <div style={{ marginTop: 24 }}>
            <PillButton variant="primary" onClick={() => navigate('/home')}>
              Back to home
            </PillButton>
          </div>
        </div>
      </div>
    );
  }

  const word = batch[cardIndex];
  const isLast = cardIndex === batch.length - 1;

  const handleFlip = () => setFlipped((f) => !f);

  const handleNext = () => {
    if (isLast) {
      navigate('/session', { state: { learnBatchIds: batch.map((w) => w.id) } });
    } else {
      setCardIndex((i) => i + 1);
      setFlipped(false);
      setActiveTab('meaning');
    }
  };

  const example = word.sentences.find((s) => s.level === level) ?? word.sentences[0];

  return (
    <>
      {/* German side (lemon) */}
      {!flipped ? (
        <div className="screen screen--lemon" style={{ minHeight: '100dvh' }}>
          <TopBar
            variant="back"
            onAction={() => navigate('/home')}
            right={<span className="text-small">{cardIndex + 1} of {batch.length}</span>}
          />

          <div className="content" style={{ justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              {word.article && <ArticleChip article={word.article} />}
              <span
                className="chip"
                style={{
                  background: 'rgba(0,0,0,0.08)',
                  color: 'var(--black)',
                  fontSize: 12,
                  fontWeight: 600,
                  height: 28,
                  padding: '0 10px',
                }}
              >
                {TOPIC_LABELS[word.topic] ?? word.topic}
              </span>
            </div>
            <h1
              className={word.de.length > 10 ? 'text-headword text-headword--long' : 'text-headword'}
              lang="de"
              style={{ marginBottom: 24 }}
            >
              {word.de}
            </h1>
            <AudioButton text={word.article ? `${word.article} ${word.de}` : word.de} />
          </div>

          <div className="action-zone" style={{ position: 'static', background: 'transparent', marginTop: 'auto', paddingBottom: 24 }}>
            <PillButton variant="on-color" id="flip-btn" onClick={handleFlip}>
              Flip
            </PillButton>
          </div>
        </div>
      ) : (
        /* Meaning side (mint) */
        <div className="screen screen--mint" style={{ minHeight: '100dvh' }}>
          <TopBar
            variant="back"
            onAction={() => navigate('/home')}
            right={<span className="text-small">{cardIndex + 1} of {batch.length}</span>}
          />

          <div className="content">
            <div style={{ marginBottom: 12 }}>
              <span
                className="chip"
                style={{
                  background: 'rgba(0,0,0,0.08)',
                  color: 'var(--black)',
                  fontSize: 12,
                  fontWeight: 600,
                  height: 24,
                  padding: '0 10px',
                }}
              >
                {TOPIC_LABELS[word.topic] ?? word.topic}
              </span>
            </div>
            <h1 className="text-meaning" style={{ marginBottom: 24 }}>{word.en}</h1>

            {/* Tabs */}
            <div className="tabs" role="tablist" style={{ marginBottom: 16 }}>
              {(['meaning', 'example', 'tip'] as const).map((tab) => {
                const hasContent = tab === 'tip' ? !!word.tip : tab === 'example' ? example : true;
                if (!hasContent) return null;
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={`tab ${activeTab === tab ? 'tab--active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    id={`tab-${tab}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                );
              })}
            </div>

            {activeTab === 'meaning' && (
              <div>
                <p className="text-body" style={{ color: 'var(--grey)' }}>
                  {word.pos} · {word.topic}
                </p>
                {word.plural && !word.pluralOnly && (
                  <p className="text-small" style={{ marginTop: 8 }} lang="de">
                    Plural: die {word.plural}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'example' && example && (
              <div>
                <p className="text-body" lang="de" style={{ marginBottom: 8 }}>{example.de}</p>
                <p className="text-body" style={{ color: 'var(--grey)' }}>{example.en}</p>
              </div>
            )}

            {activeTab === 'tip' && word.tip && (
              <p className="text-body">💡 {word.tip}</p>
            )}
          </div>

          <div className="action-zone" style={{ position: 'static', background: 'transparent', marginTop: 'auto', paddingBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <PillButton variant="on-color" id="not-yet-btn" style={{ flex: 1 }} onClick={handleNext}>
                Not yet
              </PillButton>
              <PillButton variant="primary" id="got-it-btn" style={{ flex: 1 }} onClick={handleNext}>
                {isLast ? 'Practise' : 'Got it'}
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
