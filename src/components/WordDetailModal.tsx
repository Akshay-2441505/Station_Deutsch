// ============================================================
// WordDetailModal.tsx — Word detail view reusing Learn components
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { Word, WordProgress } from '../lib/types';
import { stateLabel } from '../lib/types';
import ArticleChip from './ArticleChip';
import AudioButton from './AudioButton';
import PillButton from './PillButton';

const TOPIC_LABELS: Record<string, string> = {
  body: 'Body',
  symptoms: 'Symptoms',
  care: 'Care actions',
  ward: 'Ward & Equipment',
  patient: 'Patient interaction',
};

interface WordDetailModalProps {
  word: Word;
  progress?: WordProgress;
  onClose: () => void;
  onPractise?: (wordId: string) => void;
}

export default function WordDetailModal({
  word,
  progress,
  onClose,
  onPractise,
}: WordDetailModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'meaning' | 'example' | 'tip'>('meaning');

  const box = progress?.box ?? 0;
  const state = stateLabel(box);
  const example = word.sentences[0];
  const totalMissed = progress
    ? (progress.errorCounts.article ?? 0) +
      (progress.errorCounts.meaning ?? 0) +
      (progress.errorCounts.spelling ?? 0)
    : 0;

  const handlePractise = () => {
    onClose();
    if (onPractise) {
      onPractise(word.id);
    } else {
      navigate('/session', { state: { pool: [word.id] } });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-word-title"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--white)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '24px 24px calc(24px + env(safe-area-inset-bottom, 0px))',
          maxHeight: '90%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {word.article && <ArticleChip article={word.article} />}
            <span
              className="chip"
              style={{
                background: 'var(--gray-light, #F1F5F9)',
                color: 'var(--black)',
                fontSize: 12,
                fontWeight: 600,
                height: 28,
                padding: '0 10px',
              }}
            >
              {TOPIC_LABELS[word.topic] ?? word.topic} · {word.level}
            </span>
          </div>

          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close detail view"
            id="close-word-detail"
            style={{ width: 36, height: 36, borderColor: 'var(--line)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Word + Audio row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <h2
              id="detail-word-title"
              lang="de"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: word.de.length > 12 ? 28 : 34,
                lineHeight: '1.2',
                fontWeight: 700,
                color: 'var(--black)',
                letterSpacing: '-0.02em',
                marginBottom: 4,
              }}
            >
              {word.de}
            </h2>
            <p className="text-meaning" style={{ fontSize: 20, color: 'var(--grey)', fontWeight: 500 }}>
              {word.en}
            </p>
          </div>
          <AudioButton text={word.article ? `${word.article} ${word.de}` : word.de} />
        </div>

        {/* State & Progress chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'var(--gray-light, #F8FAFC)',
            borderRadius: 12,
            marginTop: 8,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--black)' }}>
            Status: {state} {box > 0 ? `(Box ${box})` : '(Not yet started)'}
          </span>
          {totalMissed > 0 && (
            <span style={{ color: 'var(--coral)', marginLeft: 'auto', fontWeight: 600 }}>
              Missed {totalMissed}×
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs" role="tablist" style={{ marginBottom: 16 }}>
          {(['meaning', 'example', 'tip'] as const).map((tab) => {
            const hasContent = tab === 'tip' ? !!word.tip : tab === 'example' ? !!example : true;
            if (!hasContent) return null;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`tab ${activeTab === tab ? 'tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
                id={`modal-tab-${tab}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ minHeight: 70, marginBottom: 24 }}>
          {activeTab === 'meaning' && (
            <div>
              <p className="text-body" style={{ color: 'var(--grey)' }}>
                Part of speech: <strong style={{ color: 'var(--black)' }}>{word.pos}</strong>
              </p>
              {word.plural && !word.pluralOnly && (
                <p className="text-body" style={{ marginTop: 8 }} lang="de">
                  Plural: <strong>die {word.plural}</strong>
                </p>
              )}
              {word.pluralOnly && (
                <p className="text-body" style={{ marginTop: 8 }}>
                  <em>Plural only noun</em>
                </p>
              )}
            </div>
          )}

          {activeTab === 'example' && example && (
            <div>
              <p className="text-body" lang="de" style={{ marginBottom: 6, fontWeight: 500 }}>
                {example.de}
              </p>
              <p className="text-body" style={{ color: 'var(--grey)', fontSize: 15 }}>
                {example.en}
              </p>
            </div>
          )}

          {activeTab === 'tip' && word.tip && (
            <p className="text-body" style={{ background: 'var(--lemon-tint, #FEFCE8)', padding: 12, borderRadius: 10 }}>
              💡 {word.tip}
            </p>
          )}
        </div>

        {/* Practise button */}
        <div style={{ marginTop: 'auto' }}>
          <PillButton variant="primary" id="practise-word-btn" onClick={handlePractise}>
            Practise this word
          </PillButton>
        </div>
      </div>
    </div>
  );
}
