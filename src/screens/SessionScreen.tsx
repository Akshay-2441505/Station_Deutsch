// ============================================================
// SessionScreen.tsx — practice session with all exercise types
// ============================================================
import { useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { composeSession, buildMcqDeEnOptions, buildMcqEnDeOptions, buildMatchPairs, insertRetry } from '../lib/session';
import { gradeTyped, gradeOption } from '../lib/grader';
import { buildFeedback } from '../lib/feedback';
import { now } from '../lib/clock';
import wordsData from '../../content/words.json';
import type { Word, SessionItem, FeedbackData, Article } from '../lib/types';
import TopBar from '../components/TopBar';
import ProgressBar from '../components/ProgressBar';
import PillButton from '../components/PillButton';
import FeedbackSheet from '../components/FeedbackSheet';
import UmlautRow from '../components/UmlautRow';

const allWords = wordsData as Word[];
const wordMap = Object.fromEntries(allWords.map((w) => [w.id, w]));

export default function SessionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { learnBatchIds?: string[] } | null;

  const level = useAppStore((s) => s.level);
  const progress = useAppStore((s) => s.progress);
  const recordAttempt = useAppStore((s) => s.recordAttempt);

  // Compose session
  const [items, setItems] = useState<SessionItem[]>(() => {
    if (!level) return [];
    if (locationState?.learnBatchIds) {
      const batchWords = locationState.learnBatchIds
        .map((id) => wordMap[id])
        .filter(Boolean);
      return [
        ...batchWords.map((w) => ({ wordId: w.id, exercise: 'match' as const, isRetry: false })),
        ...batchWords.map((w) => ({ wordId: w.id, exercise: 'mcq_de_en' as const, isRetry: false })),
      ];
    }
    return composeSession({ allWords, progress, level });
  });

  const [itemIndex, setItemIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typedWord, setTypedWord] = useState('');
  const [chosenArticle, setChosenArticle] = useState<Article | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [matchSelected, setMatchSelected] = useState<{ de: string | null; en: string | null }>({ de: null, en: null });
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string | null>(null);
  const [sessionResults, setSessionResults] = useState<Array<{ wordId: string; correct: boolean }>>([]);
  const typedRef = useRef<HTMLInputElement>(null);

  const currentItem = items[itemIndex];
  const currentWord = currentItem ? wordMap[currentItem.wordId] : null;

  // Build options for MCQ
  const mcqDeEnOptions = useMemo(() => {
    if (!currentWord || currentItem?.exercise !== 'mcq_de_en') return [];
    return buildMcqDeEnOptions(currentWord, allWords);
  }, [currentWord, currentItem?.exercise]);

  const mcqEnDeOptions = useMemo(() => {
    if (!currentWord || currentItem?.exercise !== 'mcq_en_de') return [];
    return buildMcqEnDeOptions(currentWord, allWords);
  }, [currentWord, currentItem?.exercise]);

  // Build match pairs (for the current group of match items)
  const matchWords = useMemo(() => {
    if (currentItem?.exercise !== 'match') return [];
    const matchItems = items.filter((i) => i.exercise === 'match');
    return matchItems.map((i) => wordMap[i.wordId]).filter(Boolean) as Word[];
  }, [items, currentItem?.exercise]);

  const matchPairs = useMemo(() => buildMatchPairs(matchWords, Math.min(matchWords.length, 5)), [matchWords]);

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

    recordAttempt({
      wordId: currentWord.id,
      exercise: currentItem.exercise,
      correct: isCorrect,
      errorType,
      isRetry: currentItem.isRetry,
      at: now(),
    });

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
    setSelected(null);
    setTypedWord('');
    setChosenArticle(null);

    const nextIndex = itemIndex + 1;
    if (nextIndex >= items.length) {
      navigate('/summary', { state: { results: sessionResults } });
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

  // Handle match exercise
  const handleMatchDe = (de: string) => {
    if (matchedPairs.has(de)) return;
    setMatchSelected((s) => ({ ...s, de }));
    checkMatch({ de, en: matchSelected.en });
  };

  const handleMatchEn = (en: string) => {
    if ([...matchedPairs].some((p) => matchPairs.find((m) => m.de === p)?.en === en)) return;
    setMatchSelected((s) => ({ ...s, en }));
    checkMatch({ de: matchSelected.de, en });
  };

  const checkMatch = ({ de, en }: { de: string | null; en: string | null }) => {
    if (!de || !en) return;
    const pair = matchPairs.find((p) => p.de === de);
    if (pair?.en === en) {
      setMatchedPairs((s) => new Set([...s, de]));
      setMatchSelected({ de: null, en: null });
      // When all matched, advance
      if (matchedPairs.size + 1 >= matchPairs.length) {
        setTimeout(() => handleContinue(), 600);
      }
    } else {
      setWrongPair(de);
      setTimeout(() => {
        setWrongPair(null);
        setMatchSelected({ de: null, en: null });
      }, 800);
    }
  };

  const isCheckable =
    currentItem.exercise === 'typed' ? typedWord.trim().length > 0 :
    currentItem.exercise === 'article' ? chosenArticle !== null :
    currentItem.exercise === 'fill' ? typedWord.trim().length > 0 :
    selected !== null;

  const fillSentence = currentItem.exercise === 'fill'
    ? currentWord.sentences.find((s) => s.level === level) ?? currentWord.sentences[0]
    : null;

  return (
    <div className="screen screen--white">
      <TopBar
        variant="close"
        onAction={() => navigate('/home')}
        right={<span className="text-small">{itemIndex + 1}/{items.length}</span>}
      />

      <div style={{ paddingBottom: 12 }}>
        <ProgressBar
          value={itemIndex / items.length}
          label={`Question ${itemIndex + 1} of ${items.length}`}
        />
      </div>

      <div className="content" style={{ opacity: feedback ? 0.4 : 1, transition: 'opacity 0.1s' }}>
        {/* MCQ de→en */}
        {currentItem.exercise === 'mcq_de_en' && (
          <>
            <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 8 }}>
              What does this mean?
            </p>
            <p className="text-title" lang="de" style={{ marginBottom: 32 }}>
              {currentWord.article ? `${currentWord.article} ` : ''}{currentWord.de}
            </p>
            <div className="stack">
              {mcqDeEnOptions.map((opt, i) => (
                <button
                  key={i}
                  className={`option-btn ${selected === i ? 'option-btn--selected' : ''}`}
                  onClick={() => setSelected(i)}
                  id={`mcq-opt-${i}`}
                  aria-pressed={selected === i}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </>
        )}

        {/* MCQ en→de */}
        {currentItem.exercise === 'mcq_en_de' && (
          <>
            <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 8 }}>
              Which is correct?
            </p>
            <p className="text-title" style={{ marginBottom: 32 }}>{currentWord.en}</p>
            <div className="stack">
              {mcqEnDeOptions.map((opt, i) => (
                <button
                  key={i}
                  className={`option-btn ${selected === i ? 'option-btn--selected' : ''}`}
                  onClick={() => setSelected(i)}
                  id={`mcq-en-opt-${i}`}
                  aria-pressed={selected === i}
                  lang="de"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Article drill */}
        {currentItem.exercise === 'article' && (
          <>
            <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 8 }}>
              What is the article?
            </p>
            <p className="text-title" lang="de" style={{ marginBottom: 32 }}>{currentWord.de}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              {(['der', 'die', 'das'] as Article[]).map((art) => (
                <button
                  key={art}
                  className={`option-btn ${chosenArticle === art ? 'option-btn--selected' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => setChosenArticle(art)}
                  aria-pressed={chosenArticle === art}
                  id={`article-${art}`}
                  lang="de"
                >
                  {art}
                </button>
              ))}
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
              placeholder={`Type the missing word`}
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
            <p className="text-title" style={{ marginBottom: 24 }}>{currentWord.en}</p>

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

        {/* Match pairs */}
        {currentItem.exercise === 'match' && (
          <>
            <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 16 }}>
              Match the pairs
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {matchPairs.map((pair) => {
                const isMatchedDe = matchedPairs.has(pair.de);
                const isSelectedDe = matchSelected.de === pair.de;
                const isWrong = wrongPair === pair.de;
                return (
                  <button
                    key={`de-${pair.de}`}
                    className={`match-tile ${isMatchedDe ? 'match-tile--matched' : isWrong ? 'match-tile--wrong' : isSelectedDe ? 'match-tile--selected' : ''}`}
                    onClick={() => handleMatchDe(pair.de)}
                    lang="de"
                    disabled={isMatchedDe}
                  >
                    {pair.de}
                  </button>
                );
              })}
              {matchPairs.map((pair) => {
                const isMatchedEn = matchedPairs.has(pair.de);
                const isSelectedEn = matchSelected.en === pair.en;
                return (
                  <button
                    key={`en-${pair.en}`}
                    className={`match-tile ${isMatchedEn ? 'match-tile--matched' : isSelectedEn ? 'match-tile--selected' : ''}`}
                    onClick={() => handleMatchEn(pair.en)}
                    disabled={isMatchedEn}
                  >
                    {pair.en}
                  </button>
                );
              })}
            </div>
          </>
        )}
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
    </div>
  );
}
