// ============================================================
// word_bank.test.ts — Unit tests for Word Bank filtering & pool session
// ============================================================

import { describe, it, expect } from 'vitest';
import { filterWords, groupWordsByTopic } from '../lib/features';
import { composeSession } from '../lib/session';
import { freshProgress } from '../lib/scheduler';
import type { Word, WordProgress } from '../lib/types';
import wordsData from '../../content/words.json';

const allWords = wordsData as Word[];

describe('Word Bank: filterWords', () => {
  const sampleProgress: Record<string, WordProgress> = {
    kopf: { ...freshProgress('kopf'), box: 1 },
    herz: { ...freshProgress('herz'), box: 2 },
    atemnot: { ...freshProgress('atemnot'), box: 5 },
  };

  it('filters by search query matching German headword case-insensitively', () => {
    const results = filterWords(allWords, sampleProgress, { query: 'kopf' });
    expect(results.length).toBeGreaterThan(0);
    for (const w of results) {
      const match = w.de.toLowerCase().includes('kopf') || w.en.toLowerCase().includes('kopf');
      expect(match).toBe(true);
    }
  });

  it('filters by search query matching English translation', () => {
    const results = filterWords(allWords, sampleProgress, { query: 'head' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((w) => w.id === 'kopf')).toBe(true);
  });

  it('filters by level (A1 only, A2 only, or all)', () => {
    const a1Only = filterWords(allWords, sampleProgress, { level: 'A1' });
    expect(a1Only.length).toBe(45);
    for (const w of a1Only) {
      expect(w.level).toBe('A1');
    }

    const a2Only = filterWords(allWords, sampleProgress, { level: 'A2' });
    expect(a2Only.length).toBe(25);
    for (const w of a2Only) {
      expect(w.level).toBe('A2');
    }

    const all = filterWords(allWords, sampleProgress, { level: 'all' });
    expect(all.length).toBe(70);
  });

  it('filters by state: New, Learning, Familiar, Mastered', () => {
    const learning = filterWords(allWords, sampleProgress, { state: 'Learning' });
    expect(learning.some((w) => w.id === 'kopf')).toBe(true);
    for (const w of learning) {
      expect(sampleProgress[w.id]?.box).toBe(1);
    }

    const familiar = filterWords(allWords, sampleProgress, { state: 'Familiar' });
    expect(familiar.some((w) => w.id === 'herz')).toBe(true);

    const mastered = filterWords(allWords, sampleProgress, { state: 'Mastered' });
    expect(mastered.some((w) => w.id === 'atemnot')).toBe(true);

    const unstarted = filterWords(allWords, sampleProgress, { state: 'New' });
    for (const w of unstarted) {
      const p = sampleProgress[w.id];
      expect(!p || p.box === 0).toBe(true);
    }
  });

  it('combines search, level, and state filters together', () => {
    const results = filterWords(allWords, sampleProgress, {
      query: 'kopf',
      level: 'A1',
      state: 'Learning',
    });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('kopf');
  });
});

describe('Word Bank: groupWordsByTopic', () => {
  it('groups words into standard topics and excludes empty groups', () => {
    const subset = allWords.filter((w) => w.topic === 'body' || w.topic === 'symptoms');
    const groups = groupWordsByTopic(subset);

    expect(groups.length).toBe(2);
    expect(groups.map((g) => g.topic)).toEqual(['body', 'symptoms']);
    expect(groups[0].title).toBe('Body');
    expect(groups[1].title).toBe('Symptoms');
    for (const group of groups) {
      expect(group.words.length).toBeGreaterThan(0);
    }
  });
});

describe('Word Bank: Single-word pool session composition', () => {
  it('composes a full 10-item session targeting exclusively the specified wordId', () => {
    const targetWord = allWords.find((w) => w.id === 'kopf')!;
    const session = composeSession({
      allWords,
      progress: {},
      level: 'A1',
      pool: [targetWord.id],
      targetCount: 10,
    });

    expect(session.length).toBe(10);
    // Every item in the session must target the word from pool
    for (const item of session) {
      expect(item.wordId).toBe('kopf');
      expect(item.exercise).toBeDefined();
    }
  });
});
