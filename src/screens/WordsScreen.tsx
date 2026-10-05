// ============================================================
// WordsScreen.tsx — Word bank screen (#/words)
// ============================================================
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, EyeOff, X, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import wordsData from '../../content/words.json';
import type { Word, Level, WordState } from '../lib/types';
import { stateLabel } from '../lib/types';
import { filterWords, groupWordsByTopic } from '../lib/features';
import TopBar from '../components/TopBar';
import ArticleChip from '../components/ArticleChip';
import WordDetailModal from '../components/WordDetailModal';

const allWords = wordsData as Word[];

export default function WordsScreen() {
  const navigate = useNavigate();
  const progress = useAppStore((s) => s.progress);

  // Filters state
  const [query, setQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<Level | 'all'>('all');
  const [selectedState, setSelectedState] = useState<WordState | 'all'>('all');
  const [hideMeanings, setHideMeanings] = useState(false);

  // Selected word for detail view modal
  const [detailWord, setDetailWord] = useState<Word | null>(null);

  // Filtered & grouped words
  const filteredWords = useMemo(() => {
    return filterWords(allWords, progress, {
      query,
      level: selectedLevel,
      state: selectedState,
    });
  }, [progress, query, selectedLevel, selectedState]);

  const groups = useMemo(() => {
    return groupWordsByTopic(filteredWords);
  }, [filteredWords]);

  const statesList: Array<WordState | 'all'> = [
    'all',
    'New',
    'Learning',
    'Familiar',
    'Strong',
    'Mastered',
  ];

  const handleClearFilters = () => {
    setQuery('');
    setSelectedLevel('all');
    setSelectedState('all');
  };

  const hasActiveFilters = query.trim() !== '' || selectedLevel !== 'all' || selectedState !== 'all';

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
      {/* Top Header: Sticky TopBar + Search + Filter Controls */}
      <div
        style={{
          flexShrink: 0,
          background: 'var(--white)',
          borderBottom: '1px solid var(--line)',
          zIndex: 10,
        }}
      >
        <div style={{ padding: '0 var(--side-pad)' }}>
          <TopBar
            variant="back"
            title="Word bank"
            onAction={() => navigate('/home')}
            right={
              <button
                onClick={() => setHideMeanings((h) => !h)}
                aria-label={hideMeanings ? 'Show meanings' : 'Hide meanings'}
                title={hideMeanings ? 'Show meanings' : 'Hide meanings'}
                className="icon-btn"
                style={{ width: 36, height: 36, borderColor: hideMeanings ? 'var(--black)' : 'var(--line)' }}
                id="toggle-hide-meanings-btn"
              >
                {hideMeanings ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
        </div>

        <div style={{ padding: '0 var(--side-pad) 10px' }}>
          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--grey)',
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search German or English..."
              id="word-search-input"
              style={{
                width: '100%',
                height: 40,
                paddingLeft: 40,
                paddingRight: query ? 36 : 14,
                border: '1.5px solid var(--line)',
                borderRadius: 20,
                fontSize: 14,
                outline: 'none',
                background: 'var(--gray-light, #F8FAFC)',
                boxSizing: 'border-box',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--grey)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Level filter tabs & Hide meanings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey)', minWidth: 38 }}>
              Level:
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'A1', 'A2'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  id={`filter-level-${lvl}`}
                  style={{
                    height: 28,
                    padding: '0 12px',
                    borderRadius: 14,
                    fontSize: 12,
                    fontWeight: selectedLevel === lvl ? 700 : 500,
                    border: selectedLevel === lvl ? '1.5px solid var(--black)' : '1px solid var(--line)',
                    background: selectedLevel === lvl ? 'var(--black)' : 'var(--white)',
                    color: selectedLevel === lvl ? 'var(--white)' : 'var(--black)',
                    cursor: 'pointer',
                  }}
                >
                  {lvl === 'all' ? 'All' : lvl}
                </button>
              ))}
            </div>

            {/* Quick toggle pill on right */}
            <button
              onClick={() => setHideMeanings((h) => !h)}
              style={{
                marginLeft: 'auto',
                background: hideMeanings ? 'var(--lemon)' : 'transparent',
                border: '1px solid var(--line)',
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 600,
                padding: '3px 9px',
                cursor: 'pointer',
                color: 'var(--black)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              id="hide-meanings-chip"
            >
              {hideMeanings ? 'Meanings hidden' : 'Hide meanings'}
            </button>
          </div>

          {/* State filter chips (horizontal scroll) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 4,
              marginBottom: 8,
              scrollbarWidth: 'none',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey)', minWidth: 38, flexShrink: 0 }}>
              State:
            </span>
            {statesList.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedState(st)}
                id={`filter-state-${st}`}
                style={{
                  height: 26,
                  padding: '0 9px',
                  borderRadius: 13,
                  fontSize: 11,
                  fontWeight: selectedState === st ? 700 : 500,
                  border: selectedState === st ? '1.5px solid var(--black)' : '1px solid var(--line)',
                  background: selectedState === st ? 'var(--black)' : 'var(--white)',
                  color: selectedState === st ? 'var(--white)' : 'var(--black)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {st === 'all' ? 'All states' : st}
              </button>
            ))}
          </div>

          {/* Result summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-small" style={{ color: 'var(--grey)', fontSize: 12 }}>
              Showing {filteredWords.length} of {allWords.length} words
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--black)',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                }}
                id="clear-filters-btn"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Word List Area */}
      <div
        className="content"
        style={{
          flex: 1,
          overflowY: detailWord ? 'hidden' : 'auto',
          padding: '12px var(--side-pad) 32px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Empty state */}
        {filteredWords.length === 0 && (
          <div
            style={{
              padding: '40px 16px',
              textAlign: 'center',
              border: '1.5px dashed var(--line)',
              borderRadius: 16,
              margin: '20px 0',
            }}
          >
            <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 12 }}>
              No words match your search or filter.
            </p>
            <button
              onClick={handleClearFilters}
              style={{
                background: 'var(--black)',
                color: 'var(--white)',
                border: 'none',
                borderRadius: 20,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Grouped by topic */}
        {groups.map((group) => (
          <section key={group.topic} aria-labelledby={`topic-${group.topic}`} style={{ marginBottom: 20 }}>
            <h2
              id={`topic-${group.topic}`}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--black)',
                borderBottom: '1px solid var(--line)',
                paddingBottom: 6,
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{group.title}</span>
              <span style={{ fontSize: 12, color: 'var(--grey)', fontWeight: 500 }}>
                {group.words.length}
              </span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {group.words.map((word) => {
                const prog = progress[word.id];
                const box = prog?.box ?? 0;
                const state = stateLabel(box);

                return (
                  <div
                    key={word.id}
                    onClick={() => setDetailWord(word)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDetailWord(word);
                      }
                    }}
                    id={`word-row-${word.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'var(--white)',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      minHeight: 56,
                      boxSizing: 'border-box',
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Article chip or part-of-speech badge (fixed 48px width) */}
                    <div style={{ width: 48, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                      {word.article ? (
                        <ArticleChip article={word.article} />
                      ) : (
                        <span
                          className="chip"
                          style={{
                            background: 'var(--gray-light, #F1F5F9)',
                            color: 'var(--grey)',
                            fontSize: 12,
                            fontWeight: 600,
                            height: 28,
                            padding: '0 8px',
                            border: '1px solid var(--line)',
                          }}
                        >
                          {word.pos === 'verb' ? 'v.' : word.pos === 'adjective' ? 'adj.' : 'phr.'}
                        </span>
                      )}
                    </div>

                    {/* Word and meaning */}
                    <div style={{ flex: 1, minWidth: 0, padding: '0 10px' }}>
                      <div
                        lang="de"
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: 'var(--black)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {word.de}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: hideMeanings ? '#CBD5E1' : 'var(--grey)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          letterSpacing: hideMeanings ? '0.1em' : 'normal',
                          userSelect: hideMeanings ? 'none' : 'auto',
                          marginTop: 2,
                        }}
                      >
                        {hideMeanings ? '••••••' : word.en}
                      </div>
                    </div>

                    {/* State badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 10,
                          background:
                            box >= 4
                              ? 'var(--mint-tint, #D4F8CD)'
                              : box >= 1
                              ? 'var(--lemon-tint, #FEFCE8)'
                              : 'var(--gray-light, #F1F5F9)',
                          color: 'var(--black)',
                        }}
                      >
                        {state}
                      </span>
                      <ChevronRight size={16} color="var(--grey)" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Word detail modal view (pinned to frame viewport, docked at bottom) */}
      {detailWord && (
        <WordDetailModal
          word={detailWord}
          progress={progress[detailWord.id]}
          onClose={() => setDetailWord(null)}
        />
      )}
    </div>
  );
}
