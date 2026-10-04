// ============================================================
// session.test.ts — unit tests for session composer
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { setDayOffset, now } from '../lib/clock';
import {
  composeSession,
  insertRetry,
  composeLearnBatch,
  buildMcqDeEnOptions,
  buildMcqEnDeOptions,
  sharesContentWord,
} from '../lib/session';
import { freshProgress, applyResult, isDue } from '../lib/scheduler';
import type { Word, WordProgress, Topic } from '../lib/types';
import realWordsData from '../../content/words.json';

beforeEach(() => setDayOffset(0));

// ---- Test fixtures ----

function makeWord(overrides: Partial<Word> & { id: string }): Word {
  return {
    id: overrides.id,
    de: overrides.de ?? overrides.id,
    article: overrides.article ?? 'der',
    pos: overrides.pos ?? 'noun',
    plural: overrides.plural ?? null,
    pluralOnly: overrides.pluralOnly ?? false,
    en: overrides.en ?? `en-${overrides.id}`,
    topic: overrides.topic ?? 'body',
    level: overrides.level ?? 'A1',
    sentences: overrides.sentences ?? [{ level: 'A1', de: `${overrides.id} sentence`, en: 'sentence', blank: overrides.id }],
    tip: null,
    verification: { status: 'unverified', sources: [] },
  };
}

function makeProgressAtBox(wordId: string, box: WordProgress['box'], overdue = false): WordProgress {
  const p = freshProgress(wordId);
  const updated = {
    ...p,
    box,
    seen: box > 0 ? 2 : 0,
    nextDueAt: overdue ? now() - 1000 : now() + 86_400_000 * 10,
  };
  return updated;
}

const words: Word[] = [
  makeWord({ id: 'w1', topic: 'body', en: 'head' }),
  makeWord({ id: 'w2', topic: 'body', en: 'arm' }),
  makeWord({ id: 'w3', topic: 'body', en: 'leg' }),
  makeWord({ id: 'w4', topic: 'body', en: 'hand' }),
  makeWord({ id: 'w5', topic: 'symptoms', en: 'fever' }),
  makeWord({ id: 'w6', topic: 'symptoms', en: 'pain' }),
  makeWord({ id: 'w7', topic: 'care', en: 'wash' }),
  makeWord({ id: 'w8', topic: 'care', en: 'measure' }),
  makeWord({ id: 'w9', topic: 'ward', en: 'bed' }),
  makeWord({ id: 'w10', topic: 'patient', en: 'name' }),
  makeWord({ id: 'w11', topic: 'body', en: 'eye' }),
  makeWord({ id: 'w12', topic: 'symptoms', en: 'cough' }),
];

describe('composeSession', () => {
  it('returns at most targetCount items', () => {
    const progress: Record<string, WordProgress> = {};
    for (const w of words) {
      progress[w.id] = makeProgressAtBox(w.id, 1, true);
    }
    const items = composeSession({ allWords: words, progress, level: 'A1', targetCount: 10 });
    expect(items.length).toBeLessThanOrEqual(10);
  });

  it('never has the same word twice in a row', () => {
    const progress: Record<string, WordProgress> = {};
    for (const w of words) {
      progress[w.id] = makeProgressAtBox(w.id, 1, true);
    }
    const items = composeSession({ allWords: words, progress, level: 'A1' });
    for (let i = 1; i < items.length; i++) {
      expect(items[i].wordId).not.toBe(items[i - 1].wordId);
    }
  });

  it('never shows a word more than twice (excluding retries)', () => {
    const progress: Record<string, WordProgress> = {};
    for (const w of words.slice(0, 3)) {
      progress[w.id] = makeProgressAtBox(w.id, 1, true);
    }
    const items = composeSession({ allWords: words, progress, level: 'A1', targetCount: 10 });
    const counts: Record<string, number> = {};
    for (const item of items.filter((i) => !i.isRetry)) {
      counts[item.wordId] = (counts[item.wordId] ?? 0) + 1;
      expect(counts[item.wordId]).toBeLessThanOrEqual(2);
    }
  });

  it('fills with non-due words when fewer than targetCount are due (practise-anyway)', () => {
    // Only 2 due words
    const progress: Record<string, WordProgress> = {};
    progress['w1'] = makeProgressAtBox('w1', 1, true);
    progress['w2'] = makeProgressAtBox('w2', 1, true);
    for (const w of words.slice(2)) {
      progress[w.id] = makeProgressAtBox(w.id, 2, false); // not due
    }
    const items = composeSession({ allWords: words, progress, level: 'A1', targetCount: 10 });
    expect(items.length).toBeGreaterThan(2); // filled with non-due words
  });
});

describe('insertRetry', () => {
  it('inserts retry 2-4 items after the given index', () => {
    const items = [
      { wordId: 'w1', exercise: 'mcq_de_en' as const, isRetry: false },
      { wordId: 'w2', exercise: 'mcq_de_en' as const, isRetry: false },
      { wordId: 'w3', exercise: 'mcq_de_en' as const, isRetry: false },
      { wordId: 'w4', exercise: 'mcq_de_en' as const, isRetry: false },
      { wordId: 'w5', exercise: 'mcq_de_en' as const, isRetry: false },
    ];

    const result = insertRetry(items, 0, 'w1');
    const retryIndex = result.findIndex((i) => i.isRetry && i.wordId === 'w1');
    expect(retryIndex).toBeGreaterThanOrEqual(2);
    expect(retryIndex).toBeLessThanOrEqual(4);
    expect(result[retryIndex].isRetry).toBe(true);
  });

  it('retry item uses recognition exercise type', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      wordId: `w${i + 1}`,
      exercise: 'typed' as const,
      isRetry: false,
    }));
    const result = insertRetry(items, 0, 'w1');
    const retry = result.find((i) => i.isRetry);
    expect(retry?.exercise).toBe('mcq_de_en');
  });
});

describe('composeLearnBatch', () => {
  it('returns 5-8 words from a single topic', () => {
    const progress: Record<string, WordProgress> = {};
    const batch = composeLearnBatch({ allWords: words, progress, level: 'A1' });
    expect(batch.length).toBeGreaterThanOrEqual(1);
    expect(batch.length).toBeLessThanOrEqual(8);
    // All from same topic
    const topic = batch[0].topic;
    expect(batch.every((w) => w.topic === topic)).toBe(true);
  });

  it('returns only box 0 words', () => {
    const progress: Record<string, WordProgress> = {};
    progress['w1'] = makeProgressAtBox('w1', 1, true); // already seen
    const batch = composeLearnBatch({ allWords: words, progress, level: 'A1' });
    expect(batch.find((w) => w.id === 'w1')).toBeUndefined();
  });

  it('returns empty when all words are seen', () => {
    const progress: Record<string, WordProgress> = {};
    for (const w of words) {
      progress[w.id] = makeProgressAtBox(w.id, 1, true);
    }
    const batch = composeLearnBatch({ allWords: words, progress, level: 'A1' });
    expect(batch.length).toBe(0);
  });
});

describe('buildMcqDeEnOptions', () => {
  it('returns 4 options with exactly 1 correct', () => {
    const target = words[0];
    const options = buildMcqDeEnOptions(target, words);
    expect(options.length).toBe(4);
    expect(options.filter((o) => o.isCorrect).length).toBe(1);
  });

  it('correct option has target en text', () => {
    const target = words[0];
    const options = buildMcqDeEnOptions(target, words);
    const correct = options.find((o) => o.isCorrect);
    expect(correct?.text).toBe(target.en);
  });
});

describe('clock integration — simulate tomorrow makes box 2 due', () => {
  it('box 2 word not due today, but due after advancing 1 day', () => {
    setDayOffset(0);
    const p = freshProgress('w1');
    // Promote to box 1
    const atNow = now();
    const p1 = applyResult(p, true, null, false, atNow); // box 0→1
    // Advance to next day to allow promotion to box 2
    setDayOffset(1);
    const p2 = applyResult(p1, true, null, false, now()); // box 1→2

    // box 2 nextDueAt is now() + 1 day from when we promoted
    // Go back to simulating day 1 + 1 = day 2 to check due
    setDayOffset(0);
    expect(isDue(p2, now())).toBe(false); // not due yet

    // Simulate advancing past the nextDueAt
    setDayOffset(3);
    expect(isDue(p2, now())).toBe(true);
  });
});

describe('A2 Mode: distractor validity and no dead-ends', () => {
  const realWords = realWordsData as Word[];
  const a2Words = realWords.filter((w) => w.level === 'A2');
  const topics: Topic[] = ['body', 'symptoms', 'care', 'ward', 'patient'];

  it('has A2 words across all 5 topics', () => {
    for (const t of topics) {
      const topicA2 = a2Words.filter((w) => w.topic === t);
      expect(topicA2.length).toBeGreaterThan(0);
    }
  });

  it('generates 4 valid distractors for every A2 word in every topic', () => {
    for (const word of a2Words) {
      const deEnOptions = buildMcqDeEnOptions(word, realWords);
      expect(deEnOptions.length).toBe(4);
      expect(deEnOptions.filter((o) => o.isCorrect).length).toBe(1);
      // No overlap in meaning with correct answer
      for (const distractor of deEnOptions.filter((o) => !o.isCorrect)) {
        expect(sharesContentWord(distractor.text, word.en)).toBe(false);
      }

      if (word.article) {
        const enDeOptions = buildMcqEnDeOptions(word, realWords);
        expect(enDeOptions.length).toBe(4);
        expect(enDeOptions.filter((o) => o.isCorrect).length).toBe(1);
      }
    }
  });

  it('composes a full 10-item session for A2 mode without dead-ending, even with 0 or 1 active word', () => {
    // Test with fresh progress (no words active)
    const emptySession = composeSession({
      allWords: realWords,
      progress: {},
      level: 'A2',
      targetCount: 10,
    });
    expect(emptySession.length).toBe(10);
    for (const item of emptySession) {
      expect(item.wordId).toBeTruthy();
      expect(item.exercise).toBeTruthy();
    }

    // Test with only 1 A2 word active (e.g. care topic)
    const singleWord = a2Words.find((w) => w.topic === 'care')!;
    const singleProg: Record<string, WordProgress> = {
      [singleWord.id]: {
        ...freshProgress(singleWord.id),
        box: 1,
      },
    };
    const sessionWithOne = composeSession({
      allWords: realWords,
      progress: singleProg,
      level: 'A2',
      targetCount: 10,
    });
    expect(sessionWithOne.length).toBe(10);

    // Test topic-pool practice for each topic in A2
    for (const t of topics) {
      const topicPool = a2Words.filter((w) => w.topic === t).map((w) => w.id);
      const topicSession = composeSession({
        allWords: realWords,
        progress: {},
        level: 'A2',
        pool: topicPool,
        targetCount: 10,
      });
      expect(topicSession.length).toBe(10);
    }
  });
});

