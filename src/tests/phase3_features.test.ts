// ============================================================
// phase3_features.test.ts — Phase 3 failing tests first
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getReviewStatus,
  getTrendMessage,
  getMistakesList,
  getTopicStats,
  buildShareWeakWordsUrl,
  validateImportedProgress,
} from '../lib/features';
import { composeSession } from '../lib/session';
import { setDayOffset, now } from '../lib/clock';
import { freshProgress } from '../lib/scheduler';
import type { Word, WordProgress, Attempt, SessionSummary } from '../lib/types';

beforeEach(() => {
  setDayOffset(0);
});

const sampleWords: Word[] = [
  {
    id: 'w_kopf',
    de: 'Kopf',
    article: 'der',
    pos: 'noun',
    plural: 'Köpfe',
    pluralOnly: false,
    en: 'head',
    topic: 'body',
    level: 'A1',
    sentences: [{ level: 'A1', de: 'Mein Kopf tut weh.', en: 'My head hurts.', blank: 'Kopf' }],
    tip: null,
    verification: { status: 'unverified', sources: [] },
  },
  {
    id: 'w_fieber',
    de: 'Fieber',
    article: 'das',
    pos: 'noun',
    plural: null,
    pluralOnly: false,
    en: 'fever',
    topic: 'symptoms',
    level: 'A1',
    sentences: [{ level: 'A1', de: 'Der Patient hat Fieber.', en: 'The patient has a fever.', blank: 'Fieber' }],
    tip: null,
    verification: { status: 'unverified', sources: [] },
  },
  {
    id: 'w_puls',
    de: 'Puls',
    article: 'der',
    pos: 'noun',
    plural: null,
    pluralOnly: false,
    en: 'pulse',
    topic: 'care',
    level: 'A1',
    sentences: [{ level: 'A1', de: 'Ich messe den Puls.', en: 'I am taking the pulse.', blank: 'Puls' }],
    tip: null,
    verification: { status: 'unverified', sources: [] },
  },
];

describe('3.1 Next review and trend calculation', () => {
  it('reports words due now if any word is past nextDueAt', () => {
    const at = now();
    const progress: Record<string, WordProgress> = {
      w_kopf: {
        ...freshProgress('w_kopf'),
        box: 1,
        nextDueAt: at - 1000, // overdue
      },
      w_fieber: {
        ...freshProgress('w_fieber'),
        box: 2,
        nextDueAt: at - 500, // overdue
      },
    };

    const status = getReviewStatus(progress, at);
    expect(status.status).toBe('due_now');
    expect(status.count).toBe(2);
    expect(status.message).toBe('2 words are due now.');
  });

  it('reports next review tomorrow or in X days when no words are currently due', () => {
    const at = now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const progress: Record<string, WordProgress> = {
      w_kopf: {
        ...freshProgress('w_kopf'),
        box: 2,
        nextDueAt: at + oneDayMs, // due tomorrow
      },
    };

    const status = getReviewStatus(progress, at);
    expect(status.status).toBe('due_later');
    expect(status.message).toBe('Next review: tomorrow, 1 word');
  });

  it('calculates session trend comparison against the last session', () => {
    const sessions: SessionSummary[] = [
      { id: 's1', at: now() - 100000, accuracy: 60, answered: 10, promotedIds: ['w_kopf'] },
    ];
    const trend = getTrendMessage(sessions, 80);
    expect(trend).toBe('Last session 60%, today 80%.');

    expect(getTrendMessage([], 80)).toBeNull();
  });
});

describe('3.2 My mistakes list and pool practice', () => {
  it('aggregates mistakes by word and tracks fixed status', () => {
    const attempts: Attempt[] = [
      {
        id: 'a1',
        wordId: 'w_kopf',
        exercise: 'mcq_de_en',
        correct: false,
        errorType: 'meaning',
        given: 'leg',
        expected: 'head',
        isRetry: false,
        at: now() - 60000,
      },
      {
        id: 'a2',
        wordId: 'w_kopf',
        exercise: 'typed',
        correct: true,
        errorType: null,
        given: 'Kopf',
        expected: 'Kopf',
        isRetry: false,
        at: now() - 10000,
      },
      {
        id: 'a3',
        wordId: 'w_fieber',
        exercise: 'article',
        correct: false,
        errorType: 'article',
        given: 'der',
        expected: 'das',
        isRetry: false,
        at: now() - 20000,
      },
    ];

    const wordMap = Object.fromEntries(sampleWords.map((w) => [w.id, w]));
    const mistakes = getMistakesList(attempts, wordMap);

    expect(mistakes).toHaveLength(2);

    // w_kopf had a mistake but latest is correct -> isFixed: true
    const kopfEntry = mistakes.find((m) => m.word.id === 'w_kopf');
    expect(kopfEntry).toBeDefined();
    expect(kopfEntry?.isFixed).toBe(true);
    expect(kopfEntry?.latestError?.given).toBe('leg');
    expect(kopfEntry?.latestError?.expected).toBe('head');

    // w_fieber latest is incorrect -> isFixed: false
    const fieberEntry = mistakes.find((m) => m.word.id === 'w_fieber');
    expect(fieberEntry).toBeDefined();
    expect(fieberEntry?.isFixed).toBe(false);
  });

  it('composeSession accepts an optional pool of word IDs', () => {
    const progress: Record<string, WordProgress> = {
      w_kopf: { ...freshProgress('w_kopf'), box: 1 },
      w_fieber: { ...freshProgress('w_fieber'), box: 1 },
      w_puls: { ...freshProgress('w_puls'), box: 1 },
    };

    // Practice only w_fieber
    const items = composeSession({
      allWords: sampleWords,
      progress,
      level: 'A1',
      pool: ['w_fieber'],
    });

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.wordId).toBe('w_fieber');
    }
  });
});

describe('3.4 Topic map statistics', () => {
  it('calculates topic progress correctly', () => {
    const progress: Record<string, WordProgress> = {
      w_kopf: { ...freshProgress('w_kopf'), box: 1 }, // learned
      w_fieber: { ...freshProgress('w_fieber'), box: 0 }, // unseen
    };

    const stats = getTopicStats(sampleWords, progress, 'A1');
    const bodyTopic = stats.find((t) => t.topic === 'body');
    expect(bodyTopic).toBeDefined();
    expect(bodyTopic?.learned).toBe(1);
    expect(bodyTopic?.total).toBe(1);
    expect(bodyTopic?.hasUnseen).toBe(false);

    const symptomsTopic = stats.find((t) => t.topic === 'symptoms');
    expect(symptomsTopic).toBeDefined();
    expect(symptomsTopic?.learned).toBe(0);
    expect(symptomsTopic?.total).toBe(1);
    expect(symptomsTopic?.hasUnseen).toBe(true);
  });
});

describe('3.5 Share weak words format', () => {
  it('generates WhatsApp share URL with encoded text and no phone number', () => {
    const weakList = [sampleWords[0]!, sampleWords[1]!];
    const url = buildShareWeakWordsUrl(weakList);

    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(url.includes('Kopf')).toBe(true);
    expect(url.includes('Fieber')).toBe(true);
  });
});

describe('3.6 Export and import progress validation', () => {
  it('validates version 2 and rejects corrupted or old version imports', () => {
    const validData = {
      version: 2,
      level: 'A1',
      levelSource: 'manual',
      progress: {},
      attempts: [],
      sessions: [],
      dayOffset: 0,
      isDemoData: false,
    };

    const validResult = validateImportedProgress(JSON.stringify(validData));
    expect(validResult.success).toBe(true);

    const oldVersionData = {
      version: 1,
      level: 'A1',
      progress: {},
    };
    const oldResult = validateImportedProgress(JSON.stringify(oldVersionData));
    expect(oldResult.success).toBe(false);
    expect(oldResult.error).toContain('version 2');

    const corruptResult = validateImportedProgress('{ not json');
    expect(corruptResult.success).toBe(false);
  });
});
