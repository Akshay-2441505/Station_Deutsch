// ============================================================
// session.ts — session composer, exercise chooser, distractors
// Rules per LEARNING_DESIGN.md §4, §6, §7.
// ============================================================

import { now } from './clock';
import { isDue } from './scheduler';
import type {
  DistractorOption,
  ExerciseType,
  Level,
  MatchPair,
  SessionItem,
  Word,
  WordProgress,
} from './types';

// ---------------------------------------------------------------------------
// Exercise chooser by box
// ---------------------------------------------------------------------------

const BOX_PREFERRED: Record<string, ExerciseType[]> = {
  '0': ['match', 'mcq_de_en', 'mcq_en_de'],
  '1': ['match', 'mcq_de_en', 'mcq_en_de'],
  '2': ['mcq_en_de', 'article', 'fill'],
  '3': ['fill', 'article', 'typed'],
  '4': ['typed', 'fill', 'plural'],
  '5': ['typed', 'fill', 'plural'],
};

/**
 * Choose the exercise type for a word given its box and recent history.
 * Skips types the word doesn't qualify for.
 * Forces mcq_de_en for stubborn words.
 * Avoids using the same type more than twice in a row.
 */
export function chooseExercise(params: {
  word: Word;
  box: WordProgress['box'];
  stubborn: boolean;
  recentTypes: ExerciseType[];
  level: Level;
  stretchEnabled?: boolean;
}): ExerciseType {
  const { word, box, stubborn, recentTypes, level, stretchEnabled = false } = params;

  if (stubborn) return 'mcq_de_en';

  const preferred = BOX_PREFERRED[String(box)] ?? BOX_PREFERRED['1'];

  // Count consecutive tail of same type
  const tail = recentTypes.slice(-2);

  for (const type of preferred) {
    if (!qualifies(word, type, stretchEnabled)) continue;
    // A2 level: prefer fill when sentence available
    if (level === 'A2' && type !== 'fill' && word.sentences.some((s) => s.level === 'A2')) {
      // we still allow it to fall through; fill will come up first in box 3 anyway
    }
    // No more than 2 in a row
    if (tail.length === 2 && tail[0] === type && tail[1] === type) continue;
    return type;
  }

  // Fallback
  return 'mcq_de_en';
}

/** Whether a word qualifies for a given exercise type. */
function qualifies(word: Word, type: ExerciseType, stretchEnabled: boolean): boolean {
  switch (type) {
    case 'mcq_de_en': return true;
    case 'mcq_en_de': return true;
    case 'match': return true;
    case 'article': return word.pos === 'noun' && word.article !== null && !word.pluralOnly;
    case 'fill': return word.sentences.length > 0;
    case 'typed': return true;
    case 'plural': return stretchEnabled && word.pos === 'noun' && word.plural !== null && !word.pluralOnly;
    case 'listen': return stretchEnabled;
    default: return false;
  }
}

// ---------------------------------------------------------------------------
// Distractor generator & overlap prevention
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'in', 'on', 'of', 'and', 'or', 'for', 'with', 'at', 'by',
  'from', 'is', 'it', 'my', 'your', 'his', 'her', 'their', 'our', 'be', 'you', 'me', 'him', 'them'
]);

export function extractContentWords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return new Set(words);
}

export function sharesContentWord(textA: string, textB: string): boolean {
  const setA = extractContentWords(textA);
  const setB = extractContentWords(textB);
  for (const word of setA) {
    if (setB.has(word)) return true;
  }
  return false;
}

export function isValidDistractor(target: Word, candidate: Word): boolean {
  if (candidate.id === target.id) return false;
  if (target.conflicts?.includes(candidate.id)) return false;
  if (candidate.conflicts?.includes(target.id)) return false;
  if (sharesContentWord(target.en, candidate.en)) return false;
  return true;
}

/**
 * Generate MCQ options for mcq_de_en (German→English meaning choice).
 * Returns 4 options: 1 correct + 3 distractors from same topic/POS.
 */
export function buildMcqDeEnOptions(
  target: Word,
  allWords: Word[],
  _seed?: number,
): DistractorOption[] {
  const pool = allWords.filter(
    (w) =>
      isValidDistractor(target, w) &&
      w.pos === target.pos &&
      w.topic === target.topic,
  );

  const distractors = shuffle(pool).slice(0, 3);
  // If not enough same-topic same-POS, pad with same-POS
  if (distractors.length < 3) {
    const extra = allWords.filter(
      (w) =>
        isValidDistractor(target, w) &&
        w.pos === target.pos &&
        !distractors.find((d) => d.id === w.id),
    );
    distractors.push(...shuffle(extra).slice(0, 3 - distractors.length));
  }

  // Fallback if still not enough
  if (distractors.length < 3) {
    const fallback = allWords.filter(
      (w) =>
        isValidDistractor(target, w) &&
        !distractors.find((d) => d.id === w.id),
    );
    distractors.push(...shuffle(fallback).slice(0, 3 - distractors.length));
  }

  const options: DistractorOption[] = [
    { text: target.en, wordId: target.id, isCorrect: true },
    ...distractors.slice(0, 3).map((w) => ({
      text: w.en,
      wordId: w.id,
      isCorrect: false,
    })),
  ];

  return shuffle(options);
}

/**
 * Generate MCQ options for mcq_en_de (English→German with article).
 * One correct (e.g. "der Kopf"), one same noun wrong article, two other nouns correct articles.
 */
export function buildMcqEnDeOptions(target: Word, allWords: Word[]): DistractorOption[] {
  const articles = ['der', 'die', 'das'] as const;
  const wrongArticles = articles.filter((a) => a !== target.article);
  const wrongArticle = wrongArticles[0] ?? 'der';

  // Two other nouns from same topic (or fallback to any noun)
  const otherNouns = allWords.filter(
    (w) =>
      isValidDistractor(target, w) &&
      w.pos === 'noun' &&
      w.article !== null,
  );
  const sameTopicOthers = shuffle(
    otherNouns.filter((w) => w.topic === target.topic),
  ).slice(0, 2);
  const padded =
    sameTopicOthers.length < 2
      ? [
          ...sameTopicOthers,
          ...shuffle(otherNouns.filter((w) => !sameTopicOthers.find((s) => s.id === w.id))).slice(
            0,
            2 - sameTopicOthers.length,
          ),
        ]
      : sameTopicOthers;

  const correctText = target.article ? `${target.article} ${target.de}` : target.de;
  const wrongArticleText = `${wrongArticle} ${target.de}`;

  const options: DistractorOption[] = [
    { text: correctText, wordId: target.id, isCorrect: true },
    // Same noun, wrong article — tests the article
    { text: wrongArticleText, wordId: null, isCorrect: false },
    ...padded.slice(0, 2).map((w) => ({
      text: `${w.article} ${w.de}`,
      wordId: w.id,
      isCorrect: false,
    })),
  ];

  return shuffle(options);
}

/**
 * Generate match pairs: 4-5 words, German→English.
 */
export function buildMatchPairs(
  words: Word[],
  count = 4,
): MatchPair[] {
  return shuffle(words)
    .slice(0, count)
    .map((w) => ({
      wordId: w.id,
      de: w.article ? `${w.article} ${w.de}` : w.de,
      en: w.en,
    }));
}

// ---------------------------------------------------------------------------
// Session composer
// ---------------------------------------------------------------------------

export interface SessionComposerParams {
  allWords: Word[];
  progress: Record<string, WordProgress>;
  level: Level;
  targetCount?: number; // default 10
  atMs?: number;
  pool?: string[];
}

export interface ComposedSession {
  items: SessionItem[];
  learnBatch: Word[] | null; // if no words beyond box 0
}

/**
 * Compose a practice session per LEARNING_DESIGN.md §7.
 * Returns up to `targetCount` session items.
 */
export function composeSession(params: SessionComposerParams): SessionItem[] {
  const { allWords, progress, level, targetCount = 10, atMs = now(), pool } = params;

  if (pool && pool.length > 0) {
    const poolSet = new Set(pool);
    const poolWords = allWords.filter((w) => poolSet.has(w.id));
    const items: SessionItem[] = [];
    const recentTypes: ExerciseType[] = [];

    while (items.length < targetCount && poolWords.length > 0) {
      for (const word of poolWords) {
        if (items.length >= targetCount) break;
        const prog = progress[word.id];
        const box = prog?.box ?? 1;
        const stubborn = prog?.stubborn ?? false;
        const exercise = chooseExercise({
          word,
          box: box as WordProgress['box'],
          stubborn,
          recentTypes,
          level,
        });
        recentTypes.push(exercise);
        items.push({ wordId: word.id, exercise, isRetry: false });
      }
    }
    return items;
  }

  const levelWords = allWords.filter((w) => w.level === level || progress[w.id]);

  // Separate into due / not-due / new (box 0)
  const due: Word[] = [];
  const notDue: Word[] = [];

  for (const word of levelWords) {
    const prog = progress[word.id];
    if (!prog || prog.box === 0) continue;
    if (isDue(prog, atMs)) {
      due.push(word);
    } else {
      notDue.push(word);
    }
  }

  // Sort due: stubborn first, then lowest box, then most overdue
  due.sort((a, b) => {
    const pa = progress[a.id]!;
    const pb = progress[b.id]!;
    if (pa.stubborn !== pb.stubborn) return pa.stubborn ? -1 : 1;
    if (pa.box !== pb.box) return pa.box - pb.box;
    return pa.nextDueAt - pb.nextDueAt;
  });

  // Fill to targetCount with weakest non-due if needed
  const fillWords = [...notDue].sort((a, b) => {
    const pa = progress[a.id]!;
    const pb = progress[b.id]!;
    if (pa.box !== pb.box) return pa.box - pb.box;
    return pa.lastSeenAt - pb.lastSeenAt;
  });

  const selected: Word[] = [...due];
  for (const word of fillWords) {
    if (selected.length >= targetCount) break;
    if (!selected.find((w) => w.id === word.id)) selected.push(word);
  }

  // If still fewer than targetCount, draw other words at this level
  if (selected.length < targetCount) {
    for (const word of levelWords) {
      if (selected.length >= targetCount) break;
      if (!selected.find((w) => w.id === word.id)) selected.push(word);
    }
  }

  // If still fewer than targetCount, draw from allWords
  if (selected.length < targetCount) {
    for (const word of allWords) {
      if (selected.length >= targetCount) break;
      if (!selected.find((w) => w.id === word.id)) selected.push(word);
    }
  }

  selected.splice(targetCount);

  const maxPerWord = selected.length * 2 < targetCount ? Math.ceil(targetCount / Math.max(1, selected.length)) : 2;
  const seenCount: Record<string, number> = {};
  const recentTypes: ExerciseType[] = [];
  const items: SessionItem[] = [];

  let passes = 0;
  while (items.length < targetCount && selected.length > 0 && passes < 10) {
    passes++;
    for (const word of selected) {
      if (items.length >= targetCount) break;
      if ((seenCount[word.id] ?? 0) >= maxPerWord) continue;

      seenCount[word.id] = (seenCount[word.id] ?? 0) + 1;

      const prog = progress[word.id];
      const box = prog?.box ?? 1;
      const stubborn = prog?.stubborn ?? false;

      const exercise = chooseExercise({
        word,
        box: box as WordProgress['box'],
        stubborn,
        recentTypes,
        level,
      });

      recentTypes.push(exercise);
      items.push({ wordId: word.id, exercise, isRetry: false });
    }
  }

  return items;
}

/**
 * Insert a retry item 2-4 positions after the given index.
 * Returns a new array.
 */
export function insertRetry(
  items: SessionItem[],
  afterIndex: number,
  wordId: string,
): SessionItem[] {
  const offset = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
  const insertAt = Math.min(afterIndex + offset, items.length);
  const retryItem: SessionItem = { wordId, exercise: 'mcq_de_en', isRetry: true };
  const next = [...items];
  next.splice(insertAt, 0, retryItem);
  return next;
}

/**
 * Compose a learn batch: 5-8 words from one topic at the chosen level.
 * Returns words that haven't been seen yet (box 0 only).
 */
export function composeLearnBatch(params: {
  allWords: Word[];
  progress: Record<string, WordProgress>;
  level: Level;
  topic?: string;
  batchSize?: number;
}): Word[] {
  const { allWords, progress, level, batchSize = 6, topic } = params;

  const unseenWords = allWords.filter(
    (w) =>
      w.level === level &&
      (!progress[w.id] || progress[w.id].box === 0),
  );

  if (unseenWords.length === 0) return [];

  // Group by topic
  const byTopic: Record<string, Word[]> = {};
  for (const w of unseenWords) {
    if (!byTopic[w.topic]) byTopic[w.topic] = [];
    byTopic[w.topic].push(w);
  }

  if (topic && byTopic[topic] && byTopic[topic].length > 0) {
    return byTopic[topic].slice(0, Math.min(batchSize, 8));
  }

  const topicWords = Object.values(byTopic).sort((a, b) => b.length - a.length)[0] ?? unseenWords;

  return topicWords.slice(0, Math.min(batchSize, 8));
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export { shuffle };
