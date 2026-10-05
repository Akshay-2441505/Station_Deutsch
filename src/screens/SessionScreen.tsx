// ============================================================
// SessionScreen.tsx — practice session with all exercise types
// ============================================================
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { composeSession, buildMcqDeEnOptions, buildMcqEnDeOptions, buildMatchPairs, insertRetry, shuffle } from '../lib/session';
import { gradeTyped, gradeOption } from '../lib/grader';
import { buildFeedback } from '../lib/feedback';
import { now } from '../lib/clock';
import wordsData from '../../content/words.json';
import type { Word, SessionItem, FeedbackData, Article, MatchPair } from '../lib/types';
import TopBar from '../components/TopBar';
import ProgressBar from '../components/ProgressBar';
import PillButton from '../components/PillButton';
import FeedbackSheet from '../components/FeedbackSheet';
import UmlautRow from '../components/UmlautRow';
import ExerciseErrorBoundary from '../components/ExerciseErrorBoundary';
import { track } from '../lib/metrics';

const allWords = wordsData as Word[];
const wordMap = Object.fromEntries(allWords.map((w) => [w.id, w]));

export default function SessionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { learnBatchIds?: string[]; pool?: string[] } | null;

  const level = useAppStore((s) => s.level);
  const progress = useAppStore((s) => s.progress);
  const recordAttempt = useAppStore((s) => s.recordAttempt);
  const recordSessionSummary = useAppStore((s) => s.recordSessionSummary);

  // Compose session
  const [items, setItems] = useState<SessionItem[]>(() => {
    if (!level) return [];
    if (locationState?.pool && locationState.pool.length > 0) {
      return composeSession({ allWords, progress, level, pool: locationState.pool });
    }
    if (locationState?.learnBatchIds) {
      const batchWords = locationState.learnBatchIds
        .map((id) => wordMap[id])
        .filter(Boolean);
      return [
        // One match item representing the batch
        { wordId: batchWords[0]?.id ?? '', exercise: 'match' as const, isRetry: false },
        ...batchWords.map((w) => ({ wordId: w.id, exercise: 'mcq_de_en' as const, isRetry: false })),
      ];
    }
    return composeSession({ allWords, progress, level });
  });

  // Fixed denominator established at session start (Issue 1.2)
  const [totalQuestions] = useState(() => Math.max(items.length, 1));

  const [itemIndex, setItemIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typedWord, setTypedWord] = useState('');
  const [chosenArticle, setChosenArticle] = useState<Article | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [sessionResults, setSessionResults] = useState<Array<{ wordId: string; correct: boolean }>>([]);
  const typedRef = useRef<HTMLInputElement>(null);

  // Track session started event
  useEffect(() => {
    track('session_started', {
      mode: locationState?.pool ? 'targeted' : 'standard',
      count: items.length,
      poolSize: locationState?.pool?.length,
    });
  }, []);

  const currentItem = items[itemIndex];
  const currentWord = currentItem ? wordMap[currentItem.wordId] : null;

  // Track progress counter
  const completedNonRetries = items.slice(0, itemIndex).filter((i) => !i.isRetry).length;
  const currentQuestionNum = Math.min(completedNonRetries + (currentItem?.isRetry ? 0 : 1), totalQuestions);

  // Match pairs state (Issue 1.1)
  const [matchTiles, setMatchTiles] = useState<{ de: MatchPair[]; en: MatchPair[] }>({ de: [], en: [] });
  const [selectedTile, setSelectedTile] = useState<{ side: 'de' | 'en'; wordId: string } | null>(null);
  const [matchedWordIds, setMatchedWordIds] = useState<Set<string>>(new Set());
  const [wrongTileIds, setWrongTileIds] = useState<{ de: string | null; en: string | null }>({ de: null, en: null });
  const [slips, setSlips] = useState<Record<string, number>>({});
  const [matchFeedback, setMatchFeedback] = useState<FeedbackData | null>(null);

  // Initialize match exercise tiles whenever item changes to a match item
  useEffect(() => {
    if (currentItem?.exercise === 'match' && currentWord) {
      let pool: Word[] = [];
      if (locationState?.learnBatchIds) {
        pool = locationState.learnBatchIds.map((id) => wordMap[id]).filter(Boolean);
      }
      if (pool.length < 4) {
        let others = allWords.filter(
          (w) => w.id !== currentWord.id && (w.level === level || w.topic === currentWord.topic)
        );
        if (others.length < 3) {
          others = allWords.filter((w) => w.id !== currentWord.id);
        }
        pool = [currentWord, ...shuffle(others).slice(0, 3)];
      }
      const pairs = buildMatchPairs(pool, 4);
      setMatchTiles({
        de: shuffle(pairs),
        en: shuffle(pairs),
      });
      setSelectedTile(null);
      setMatchedWordIds(new Set());
      setWrongTileIds({ de: null, en: null });
      setSlips({});
      setMatchFeedback(null);
    }
  }, [itemIndex, currentItem?.exercise, currentWord?.id]);

  // Build options for MCQ
  const mcqDeEnOptions = useMemo(() => {
    if (!currentWord || currentItem?.exercise !== 'mcq_de_en') return [];
    return buildMcqDeEnOptions(currentWord, allWords);
  }, [currentWord, currentItem?.exercise]);

  const mcqEnDeOptions = useMemo(() => {
    if (!currentWord || currentItem?.exercise !== 'mcq_en_de') return [];
    return buildMcqEnDeOptions(currentWord, allWords);
  }, [currentWord, currentItem?.exercise]);

  if (!level || !currentItem || !currentWord) {
    return (
      <div className="screen screen--white">
        <TopBar variant="close" onAction={() => navigate('/home')} />
        <div className="content" style={{ justifyContent: 'center' }}>
          <p className="text-body" style={{ color: 'var(--grey)' }}>
            No words to practise right now. Learn some new words first.
          </p>
          <div style={{ marginTop: 24 }}>
            <PillButton variant="primary" onClick={() => navigate('/home')}>Back to home</PillButton>
          </div>
        </div>
      </div>
    );
  }

  // Handle checking answers
  const handleCheck = () => {
    if (feedback) return;
    let gradeResult: ReturnType<typeof gradeTyped>;
    let chosenText: string | undefined;

    if (currentItem.exercise === 'typed') {
      gradeResult = gradeTyped({ word: currentWord, typedWord, chosenArticle });
    } else if (currentItem.exercise === 'mcq_de_en') {
      const correct = mcqDeEnOptions.findIndex((o) => o.isCorrect);
      const isArticleMismatch = selected !== null && !mcqDeEnOptions[selected]?.isCorrect &&
        mcqDeEnOptions[selected]?.wordId === currentWord.id;
      gradeResult = gradeOption(selected ?? -1, correct, isArticleMismatch);
      chosenText = selected !== null ? mcqDeEnOptions[selected]?.text : undefined;
    } else if (currentItem.exercise === 'mcq_en_de') {
      const correct = mcqEnDeOptions.findIndex((o) => o.isCorrect);
      const isArticleMismatch = selected !== null && !mcqEnDeOptions[selected]?.isCorrect &&
        mcqEnDeOptions[selected]?.wordId === null;
      gradeResult = gradeOption(selected ?? -1, correct, isArticleMismatch);
      chosenText = selected !== null ? mcqEnDeOptions[selected]?.text : undefined;
    } else if (currentItem.exercise === 'article') {
      const correctArticle = currentWord.article;
      const isCorrect = chosenArticle === correctArticle;
      gradeResult = isCorrect
        ? { outcome: 'correct' }
        : { outcome: 'error', errorType: 'article' };
    } else if (currentItem.exercise === 'fill') {
      const isCorrect = typedWord.trim().toLowerCase() === currentWord.de.toLowerCase();
      gradeResult = isCorrect ? { outcome: 'correct' } : { outcome: 'error', errorType: 'meaning' };
      chosenText = typedWord;
    } else {
      gradeResult = { outcome: 'correct' };
    }

    const isCorrect = gradeResult.outcome === 'correct';
    const errorType = gradeResult.outcome === 'error' ? gradeResult.errorType : null;

    let expectedStr = currentWord.en;
    let givenStr: string | null = chosenText ?? null;
    if (currentItem.exercise === 'typed' || currentItem.exercise === 'fill') {
      expectedStr = currentWord.de;
      givenStr = typedWord;
    } else if (currentItem.exercise === 'article') {
      expectedStr = currentWord.article ?? '';
      givenStr = chosenArticle;
    } else if (currentItem.exercise === 'mcq_en_de') {
      expectedStr = currentWord.article ? `${currentWord.article} ${currentWord.de}` : currentWord.de;
    }

    recordAttempt({
      wordId: currentWord.id,
      exercise: currentItem.exercise,
      correct: isCorrect,
      errorType,
      given: givenStr,
      expected: expectedStr,
      isRetry: currentItem.isRetry,
      at: now(),
    });

    if (!isCorrect) {
      track('mistake_logged', { wordId: currentWord.id, errorType: errorType ?? 'unknown' });
    }

    setSessionResults((r) => [...r, { wordId: currentWord.id, correct: isCorrect }]);

    const fb = buildFeedback({
      correct: isCorrect,
      errorType,
      word: currentWord,
      chosenText,
      capitalisationNote: gradeResult.outcome === 'correct' && 'note' in gradeResult && gradeResult.note === 'capitalisation',
    });
    setFeedback(fb);

    // Queue retry if wrong
    if (!isCorrect && !currentItem.isRetry) {
      setItems((prev) => insertRetry(prev, itemIndex, currentWord.id));
    }
  };

  const handleContinue = () => {
    setFeedback(null);
    setMatchFeedback(null);
    setSelected(null);
    setTypedWord('');
    setChosenArticle(null);

    const nextIndex = itemIndex + 1;
    if (nextIndex >= items.length) {
      const totalAnswered = sessionResults.length;
      const correctCount = sessionResults.filter((r) => r.correct).length;
      const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      const promoted = sessionResults.filter((r) => r.correct).map((r) => r.wordId);
      recordSessionSummary({
        at: now(),
        accuracy,
        answered: totalAnswered,
        promotedIds: promoted,
      });
      track('session_completed', {
        accuracy,
        answered: totalAnswered,
        promotedCount: promoted.length,
      });
      navigate('/summary', { state: { results: sessionResults, accuracy } });
    } else {
      setItemIndex(nextIndex);
    }
  };

  const insertUmlaut = (char: string) => {
    const input = typedRef.current;
    if (!input) return;
    const start = input.selectionStart ?? typedWord.length;
    const end = input.selectionEnd ?? typedWord.length;
    const next = typedWord.slice(0, start) + char + typedWord.slice(end);
    setTypedWord(next);
    setTimeout(() => {
      input.setSelectionRange(start + 1, start + 1);
      input.focus();
    }, 0);
  };

  // Match exercise handlers (Issue 1.1)
  const handleSelectTile = (side: 'de' | 'en', wordId: string) => {
    if (matchedWordIds.has(wordId) || wrongTileIds.de || wrongTileIds.en) return;

    if (!selectedTile) {
      setSelectedTile({ side, wordId });
      return;
    }

    if (selectedTile.side === side) {
      // Switch selected tile on same side
      setSelectedTile({ side, wordId });
      return;
    }

    // Comparing tiles from opposite sides
    const deId = side === 'de' ? wordId : selectedTile.wordId;
    const enId = side === 'en' ? wordId : selectedTile.wordId;

    if (deId === enId) {
      // Correct match!
      const nextMatched = new Set(matchedWordIds);
      nextMatched.add(deId);
      setMatchedWordIds(nextMatched);
      setSelectedTile(null);

      // Check if all pairs matched
      if (nextMatched.size >= matchTiles.de.length) {
        const totalSlips = Object.values(slips).reduce((a, b) => a + b, 0);
        setMatchFeedback({
          correct: true,
          errorType: null,
          headline: 'All matched!',
          body: `${matchTiles.de.length} of ${matchTiles.de.length} matched${totalSlips > 0 ? `, with ${totalSlips} slip${totalSlips === 1 ? '' : 's'}` : ''}.`,
          tip: null,
        });
      }
    } else {
      // Mismatch
      setSlips((prev) => ({
        ...prev,
        [deId]: (prev[deId] ?? 0) + 1,
        [enId]: (prev[enId] ?? 0) + 1,
      }));
      setWrongTileIds({ de: deId, en: enId });
      setTimeout(() => {
        setWrongTileIds({ de: null, en: null });
        setSelectedTile(null);
      }, 700);
    }
  };

  const handleMatchComplete = () => {
    // Record one attempt per matched word
    matchTiles.de.forEach((p) => {
      const slipCount = slips[p.wordId] ?? 0;
      const isCorrect = slipCount === 0;
      recordAttempt({
        wordId: p.wordId,
        exercise: 'match',
        correct: isCorrect,
        errorType: isCorrect ? null : 'meaning',
        given: isCorrect ? p.en : 'mismatched pair',
        expected: p.en,
        isRetry: currentItem.isRetry,
        at: now(),
      });
      if (!isCorrect) {
        track('mistake_logged', { wordId: p.wordId, errorType: 'meaning' });
      }
      setSessionResults((r) => [...r, { wordId: p.wordId, correct: isCorrect }]);
    });
    handleContinue();
  };

  const isCheckable =
    currentItem.exercise === 'typed' ? typedWord.trim().length > 0 :
    currentItem.exercise === 'article' ? chosenArticle !== null :
    currentItem.exercise === 'fill' ? typedWord.trim().length > 0 :
    selected !== null;

  const fillSentence = currentItem.exercise === 'fill'
    ? currentWord.sentences.find((s) => s.level === level) ?? currentWord.sentences[0]
    : null;

  const TOPIC_LABELS: Record<string, string> = {
    body: 'Body',
    symptoms: 'Symptoms',
    care: 'Care actions',
    ward: 'Ward & Equipment',
    patient: 'Patient interaction',
  };

  return (
    <div className="screen screen--white">
      <TopBar
        variant="close"
        onAction={() => navigate('/home')}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {currentItem.isRetry && (
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
                Retry
              </span>
            )}
            <span className="text-small">{currentQuestionNum}/{totalQuestions}</span>
          </div>
        }
      />

      <div style={{ paddingBottom: 12 }}>
        <ProgressBar
          value={Math.min(completedNonRetries / totalQuestions, 1)}
          label={`Question ${currentQuestionNum} of ${totalQuestions}`}
        />
      </div>

      <div className="content" style={{ opacity: feedback ? 0.4 : 1, transition: 'opacity 0.1s' }}>
        <ExerciseErrorBoundary exerciseKey={`${currentItem.wordId}-${itemIndex}`} onSkip={handleContinue}>
          {/* Ward Context: Topic label */}
          <div style={{ marginBottom: 12 }}>
            <span
              className="chip"
              style={{
                background: '#F0F0F0',
                color: 'var(--grey)',
                fontSize: 12,
                fontWeight: 600,
                height: 24,
                padding: '0 10px',
              }}
            >
              {TOPIC_LABELS[currentWord.topic] ?? currentWord.topic}
            </span>
          </div>
          {/* MCQ de→en */}
          {currentItem.exercise === 'mcq_de_en' && (
            <>
              <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 8 }}>
                What does this mean?
              </p>
              <p className="text-prompt-de" lang="de" style={{ marginBottom: 32 }}>
                {currentWord.article ? `${currentWord.article} ` : ''}{currentWord.de}
              </p>
              <div className="stack">
                {mcqDeEnOptions.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrect = opt.isCorrect;
                  const showResult = feedback !== null;
                  const isWrongSelected = showResult && isSelected && !isCorrect;
                  const isCorrectOpt = showResult && isCorrect;

                  let btnClass = 'option-btn';
                  if (isCorrectOpt) btnClass += ' option-btn--correct';
                  else if (isWrongSelected) btnClass += ' option-btn--wrong';
                  else if (isSelected) btnClass += ' option-btn--selected';

                  const style: React.CSSProperties = showResult && !isCorrectOpt && !isWrongSelected ? { opacity: 0.4 } : {};

                  return (
                    <button
                      key={i}
                      className={btnClass}
                      style={style}
                      onClick={() => !feedback && setSelected(i)}
                      id={`mcq-opt-${i}`}
                      aria-pressed={isSelected}
                      disabled={feedback !== null}
                    >
                      <span>{opt.text}</span>
                      {isCorrectOpt && <Check size={20} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                      {isWrongSelected && <X size={20} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* MCQ en→de */}
          {currentItem.exercise === 'mcq_en_de' && (
            <>
              <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 8 }}>
                Which is correct?
              </p>
              <p className="text-prompt-en" style={{ marginBottom: 32 }}>{currentWord.en}</p>
              <div className="stack">
                {mcqEnDeOptions.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrect = opt.isCorrect;
                  const showResult = feedback !== null;
                  const isWrongSelected = showResult && isSelected && !isCorrect;
                  const isCorrectOpt = showResult && isCorrect;

                  let btnClass = 'option-btn';
                  if (isCorrectOpt) btnClass += ' option-btn--correct';
                  else if (isWrongSelected) btnClass += ' option-btn--wrong';
                  else if (isSelected) btnClass += ' option-btn--selected';

                  const style: React.CSSProperties = showResult && !isCorrectOpt && !isWrongSelected ? { opacity: 0.4 } : {};

                  return (
                    <button
                      key={i}
                      className={btnClass}
                      style={style}
                      onClick={() => !feedback && setSelected(i)}
                      id={`mcq-en-opt-${i}`}
                      aria-pressed={isSelected}
                      lang="de"
                      disabled={feedback !== null}
                    >
                      <span>{opt.text}</span>
                      {isCorrectOpt && <Check size={20} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                      {isWrongSelected && <X size={20} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Article drill */}
          {currentItem.exercise === 'article' && (
            <>
              <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 8 }}>
                What is the article?
              </p>
              <p className="text-prompt-de" lang="de" style={{ marginBottom: 32 }}>{currentWord.de}</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['der', 'die', 'das'] as Article[]).map((art) => {
                  const isSelected = chosenArticle === art;
                  const isCorrect = art === currentWord.article;
                  const showResult = feedback !== null;
                  const isWrongSelected = showResult && isSelected && !isCorrect;
                  const isCorrectOpt = showResult && isCorrect;

                  let btnClass = 'option-btn';
                  if (isCorrectOpt) btnClass += ' option-btn--correct';
                  else if (isWrongSelected) btnClass += ' option-btn--wrong';
                  else if (isSelected) btnClass += ' option-btn--selected';

                  const style: React.CSSProperties = {
                    flex: 1,
                    ...(showResult && !isCorrectOpt && !isWrongSelected ? { opacity: 0.4 } : {}),
                  };

                  return (
                    <button
                      key={art}
                      className={btnClass}
                      style={style}
                      onClick={() => !feedback && setChosenArticle(art)}
                      aria-pressed={isSelected}
                      id={`article-${art}`}
                      lang="de"
                      disabled={feedback !== null}
                    >
                      <span>{art}</span>
                      {isCorrectOpt && <Check size={18} strokeWidth={2.5} />}
                      {isWrongSelected && <X size={18} strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Fill in the blank */}
          {currentItem.exercise === 'fill' && fillSentence && (
            <>
              <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 8 }}>
                Fill in the blank
              </p>
              <p className="text-title" lang="de" style={{ marginBottom: 8 }}>
                {fillSentence.de.replace(fillSentence.blank, '___')}
              </p>
              <p className="text-small" style={{ color: 'var(--grey)', marginBottom: 24 }}>
                {fillSentence.en.replace(currentWord.en, '___')}
              </p>
              <UmlautRow onInsert={insertUmlaut} />
              <input
                ref={typedRef}
                type="text"
                value={typedWord}
                onChange={(e) => setTypedWord(e.target.value)}
                placeholder="Type the missing word"
                id="fill-input"
                aria-label="Type the missing word"
                style={{
                  width: '100%',
                  height: 56,
                  border: '2px solid var(--black)',
                  borderRadius: 999,
                  padding: '0 20px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 17,
                  marginTop: 12,
                }}
                onKeyDown={(e) => e.key === 'Enter' && isCheckable && handleCheck()}
              />
            </>
          )}

          {/* Typed recall */}
          {currentItem.exercise === 'typed' && (
            <>
              <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 8 }}>
                Type the German word
              </p>
              <p className="text-prompt-en" style={{ marginBottom: 24 }}>{currentWord.en}</p>

              {currentWord.pos === 'noun' && currentWord.article && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  {(['der', 'die', 'das'] as Article[]).map((art) => (
                    <button
                      key={art}
                      className={`option-btn ${chosenArticle === art ? 'option-btn--selected' : ''}`}
                      style={{ flex: 1 }}
                      onClick={() => setChosenArticle(art)}
                      aria-pressed={chosenArticle === art}
                      id={`typed-article-${art}`}
                      lang="de"
                    >
                      {art}
                    </button>
                  ))}
                </div>
              )}

              <UmlautRow onInsert={insertUmlaut} />
              <input
                ref={typedRef}
                type="text"
                value={typedWord}
                onChange={(e) => setTypedWord(e.target.value)}
                placeholder="Type in German"
                id="typed-input"
                aria-label="Type the German word"
                style={{
                  width: '100%',
                  height: 56,
                  border: '2px solid var(--black)',
                  borderRadius: 999,
                  padding: '0 20px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 17,
                  marginTop: 12,
                }}
                onKeyDown={(e) => e.key === 'Enter' && isCheckable && handleCheck()}
              />
            </>
          )}

          {/* Match pairs (Issue 1.1) */}
          {currentItem.exercise === 'match' && (
            <>
              <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 16 }}>
                Match the pairs
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* German column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {matchTiles.de.map((pair) => {
                    const isMatched = matchedWordIds.has(pair.wordId);
                    const isSelected = selectedTile?.side === 'de' && selectedTile.wordId === pair.wordId;
                    const isWrong = wrongTileIds.de === pair.wordId;
                    return (
                      <button
                        key={`de-${pair.wordId}`}
                        className={`match-tile ${isMatched ? 'match-tile--matched' : isWrong ? 'match-tile--wrong' : isSelected ? 'match-tile--selected' : ''}`}
                        onClick={() => handleSelectTile('de', pair.wordId)}
                        lang="de"
                        disabled={isMatched}
                      >
                        {pair.de}
                      </button>
                    );
                  })}
                </div>

                {/* English column (independently randomized) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {matchTiles.en.map((pair) => {
                    const isMatched = matchedWordIds.has(pair.wordId);
                    const isSelected = selectedTile?.side === 'en' && selectedTile.wordId === pair.wordId;
                    const isWrong = wrongTileIds.en === pair.wordId;
                    return (
                      <button
                        key={`en-${pair.wordId}`}
                        className={`match-tile ${isMatched ? 'match-tile--matched' : isWrong ? 'match-tile--wrong' : isSelected ? 'match-tile--selected' : ''}`}
                        onClick={() => handleSelectTile('en', pair.wordId)}
                        disabled={isMatched}
                      >
                        {pair.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </ExerciseErrorBoundary>
      </div>

      {/* Action zone */}
      {currentItem.exercise !== 'match' && (
        <div style={{ padding: '16px var(--side-pad)', paddingBottom: 24 }}>
          <PillButton
            variant="primary"
            id="check-btn"
            onClick={handleCheck}
            disabled={!isCheckable || !!feedback}
          >
            <Check size={20} strokeWidth={2} style={{ marginRight: 8 }} />
            Check
          </PillButton>
        </div>
      )}

      {feedback && (
        <FeedbackSheet feedback={feedback} onContinue={handleContinue} />
      )}

      {matchFeedback && (
        <FeedbackSheet feedback={matchFeedback} onContinue={handleMatchComplete} />
      )}
    </div>
  );
}
