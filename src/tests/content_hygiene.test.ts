// ============================================================
// content_hygiene.test.ts — Phase 0 tests (failing first)
// ============================================================

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { buildMcqDeEnOptions, sharesContentWord } from '../lib/session';
import type { Word } from '../lib/types';

const root = resolve(process.cwd());

describe('0.1 Verification status & hygiene', () => {
  it('all words in content/words.json are unverified with empty sources', () => {
    const words = JSON.parse(readFileSync(resolve(root, 'content/words.json'), 'utf8')) as Word[];
    const verifiedWords = words.filter((w) => w.verification.status !== 'unverified' || w.verification.sources.length > 0);
    expect(verifiedWords).toHaveLength(0);
  });

  it('all placement items in content/placement.json are unverified with empty sources', () => {
    const items = JSON.parse(readFileSync(resolve(root, 'content/placement.json'), 'utf8')) as Array<{ verification: { status: string; sources: string[] } }>;
    const verifiedItems = items.filter((i) => i.verification.status !== 'unverified' || i.verification.sources.length > 0);
    expect(verifiedItems).toHaveLength(0);
  });
});

describe('0.3 Parked words', () => {
  const parkedIds = [
    'schuettelfrost',
    'atemnot',
    'allergiereakt',
    'entzuendung',
    'katheter',
    'verbandwechsel',
    'dokumentation',
    'rehabilitation',
    'wirbelsaeule',
    'bettlaegerig',
  ];

  it('content/words.parked.json exists as a valid JSON array', () => {
    const parkedFile = resolve(root, 'content/words.parked.json');
    expect(existsSync(parkedFile)).toBe(true);
    const parked = JSON.parse(readFileSync(parkedFile, 'utf8'));
    expect(Array.isArray(parked)).toBe(true);
  });

  it('restored A2 words conform to schema with unverified status and proper umlauts', () => {
    const words = JSON.parse(readFileSync(resolve(root, 'content/words.json'), 'utf8')) as Word[];
    for (const expectedId of parkedIds) {
      const match = words.some((w) => w.id.toLowerCase().includes(expectedId));
      expect(match, `Expected ${expectedId} to be restored in words.json`).toBe(true);
    }

    const bettlaegerig = words.find((w) => w.id === 'bettlaegerig');
    expect(bettlaegerig).toBeDefined();
    expect(bettlaegerig?.de).toBe('bettlägerig');
    expect(bettlaegerig?.verification.status).toBe('unverified');

    // Confirm every topic at A2 now has at least 4 entries for distractors
    const topics = ['body', 'symptoms', 'care', 'ward', 'patient'] as const;
    for (const t of topics) {
      const a2InTopic = words.filter((w) => w.topic === t && w.level === 'A2');
      expect(a2InTopic.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('0.7 Distractor overlap rejection & conflicts', () => {
  it('sharesContentWord detects overlapping English content words', () => {
    // Stop words like "the", "a", "to", "in" should be ignored, but content words like "pain", "back" should match
    expect(sharesContentWord('pain', 'back pain')).toBe(true);
    expect(sharesContentWord('severe headache', 'headache')).toBe(true);
    expect(sharesContentWord('the hand', 'the leg')).toBe(false);
    expect(sharesContentWord('to wash', 'to measure')).toBe(false);
  });

  it('buildMcqDeEnOptions rejects distractors that share English content words', () => {
    const targetWord: Word = {
      id: 'schmerz',
      de: 'Schmerz',
      article: 'der',
      pos: 'noun',
      plural: 'Schmerzen',
      pluralOnly: false,
      en: 'pain',
      topic: 'symptoms',
      level: 'A1',
      sentences: [{ level: 'A1', de: 'Ich habe Schmerz.', en: 'I have pain.', blank: 'Schmerz' }],
      tip: null,
      verification: { status: 'unverified', sources: [] },
    };

    const overlapDistractor: Word = {
      id: 'rueckenschmerz',
      de: 'Rückenschmerz',
      article: 'der',
      pos: 'noun',
      plural: null,
      pluralOnly: false,
      en: 'back pain', // Overlaps with "pain"
      topic: 'symptoms',
      level: 'A1',
      sentences: [{ level: 'A1', de: '...', en: '...', blank: '...' }],
      tip: null,
      verification: { status: 'unverified', sources: [] },
    };

    const validDistractor1: Word = {
      id: 'husten',
      de: 'Husten',
      article: 'der',
      pos: 'noun',
      plural: null,
      pluralOnly: false,
      en: 'cough',
      topic: 'symptoms',
      level: 'A1',
      sentences: [{ level: 'A1', de: '...', en: '...', blank: '...' }],
      tip: null,
      verification: { status: 'unverified', sources: [] },
    };

    const validDistractor2: Word = {
      id: 'schwindel',
      de: 'Schwindel',
      article: 'der',
      pos: 'noun',
      plural: null,
      pluralOnly: false,
      en: 'dizziness',
      topic: 'symptoms',
      level: 'A1',
      sentences: [{ level: 'A1', de: '...', en: '...', blank: '...' }],
      tip: null,
      verification: { status: 'unverified', sources: [] },
    };

    const validDistractor3: Word = {
      id: 'fieber',
      de: 'Fieber',
      article: 'das',
      pos: 'noun',
      plural: null,
      pluralOnly: false,
      en: 'fever',
      topic: 'symptoms',
      level: 'A1',
      sentences: [{ level: 'A1', de: '...', en: '...', blank: '...' }],
      tip: null,
      verification: { status: 'unverified', sources: [] },
    };

    const allBank = [targetWord, overlapDistractor, validDistractor1, validDistractor2, validDistractor3];
    const options = buildMcqDeEnOptions(targetWord, allBank);

    // Overlapping distractor ("back pain") must not be in the options
    const optionTexts = options.map((o) => o.text);
    expect(optionTexts).not.toContain('back pain');
    expect(optionTexts).toContain('pain');
  });

  it('buildMcqDeEnOptions rejects words listed in target conflicts array', () => {
    const targetWord: Word = {
      id: 'target1',
      de: 'Ziel',
      article: 'das',
      pos: 'noun',
      plural: null,
      pluralOnly: false,
      en: 'target',
      topic: 'ward',
      level: 'A1',
      conflicts: ['conflicted_word'],
      sentences: [{ level: 'A1', de: '...', en: '...', blank: '...' }],
      tip: null,
      verification: { status: 'unverified', sources: [] },
    };

    const conflictedWord: Word = {
      id: 'conflicted_word',
      de: 'Konflikt',
      article: 'der',
      pos: 'noun',
      plural: null,
      pluralOnly: false,
      en: 'conflict',
      topic: 'ward',
      level: 'A1',
      sentences: [{ level: 'A1', de: '...', en: '...', blank: '...' }],
      tip: null,
      verification: { status: 'unverified', sources: [] },
    };

    const valid1: Word = {
      id: 'v1',
      de: 'Bett',
      article: 'das',
      pos: 'noun',
      plural: null,
      pluralOnly: false,
      en: 'bed',
      topic: 'ward',
      level: 'A1',
      sentences: [{ level: 'A1', de: '...', en: '...', blank: '...' }],
      tip: null,
      verification: { status: 'unverified', sources: [] },
    };

    const valid2: Word = {
      id: 'v2',
      de: 'Zimmer',
      article: 'das',
      pos: 'noun',
      plural: null,
      pluralOnly: false,
      en: 'room',
      topic: 'ward',
      level: 'A1',
      sentences: [{ level: 'A1', de: '...', en: '...', blank: '...' }],
      tip: null,
      verification: { status: 'unverified', sources: [] },
    };

    const valid3: Word = {
      id: 'v3',
      de: 'Station',
      article: 'die',
      pos: 'noun',
      plural: null,
      pluralOnly: false,
      en: 'ward',
      topic: 'ward',
      level: 'A1',
      sentences: [{ level: 'A1', de: '...', en: '...', blank: '...' }],
      tip: null,
      verification: { status: 'unverified', sources: [] },
    };

    const allBank = [targetWord, conflictedWord, valid1, valid2, valid3];
    const options = buildMcqDeEnOptions(targetWord, allBank);
    const optionTexts = options.map((o) => o.text);
    expect(optionTexts).not.toContain('conflict');
  });
});
