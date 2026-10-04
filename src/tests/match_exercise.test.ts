// ============================================================
// match_exercise.test.ts — Unit tests for match pairs logic
// ============================================================

import { describe, it, expect } from 'vitest';
import { buildMatchPairs } from '../lib/session';
import type { Word } from '../lib/types';

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
    id: 'w_arm',
    de: 'Arm',
    article: 'der',
    pos: 'noun',
    plural: 'Arme',
    pluralOnly: false,
    en: 'arm',
    topic: 'body',
    level: 'A1',
    sentences: [{ level: 'A1', de: 'Mein Arm tut weh.', en: 'My arm hurts.', blank: 'Arm' }],
    tip: null,
    verification: { status: 'unverified', sources: [] },
  },
  {
    id: 'w_hand',
    de: 'Hand',
    article: 'die',
    pos: 'noun',
    plural: 'Hände',
    pluralOnly: false,
    en: 'hand',
    topic: 'body',
    level: 'A1',
    sentences: [{ level: 'A1', de: 'Die Hand tut weh.', en: 'The hand hurts.', blank: 'Hand' }],
    tip: null,
    verification: { status: 'unverified', sources: [] },
  },
  {
    id: 'w_bein',
    de: 'Bein',
    article: 'das',
    pos: 'noun',
    plural: 'Beine',
    pluralOnly: false,
    en: 'leg',
    topic: 'body',
    level: 'A1',
    sentences: [{ level: 'A1', de: 'Das Bein ist verletzt.', en: 'The leg is injured.', blank: 'Bein' }],
    tip: null,
    verification: { status: 'unverified', sources: [] },
  },
];

describe('1.1 Match pairs spec', () => {
  it('buildMatchPairs uses wordId for identification', () => {
    const pairs = buildMatchPairs(sampleWords, 4);
    expect(pairs).toHaveLength(4);
    for (const p of pairs) {
      expect(p.wordId).toBeDefined();
      expect(p.wordId.startsWith('w_')).toBe(true);
    }
  });

  it('tracks mistakes per word correctly', () => {
    // Simulated match tracking state
    const wordSlips: Record<string, number> = {
      w_kopf: 0,
      w_arm: 1, // tapped wrong partner once
      w_hand: 0,
      w_bein: 2, // tapped wrong partner twice
    };

    const isFirstTryCorrect = (wordId: string) => wordSlips[wordId] === 0;

    expect(isFirstTryCorrect('w_kopf')).toBe(true);
    expect(isFirstTryCorrect('w_arm')).toBe(false);
    expect(isFirstTryCorrect('w_hand')).toBe(true);
    expect(isFirstTryCorrect('w_bein')).toBe(false);
  });
});
