// ============================================================
// grader.test.ts — unit tests for grader.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import { gradeTyped, gradeOption, gradePlural, isSpellingNearMiss } from '../lib/grader';
import type { Word } from '../lib/types';

const nounKopf: Word = {
  id: 'kopf',
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
};

const verbAtmen: Word = {
  id: 'atmen',
  de: 'atmen',
  article: null,
  pos: 'verb',
  plural: null,
  pluralOnly: false,
  en: 'to breathe',
  topic: 'care',
  level: 'A1',
  sentences: [{ level: 'A1', de: 'Bitte atmen Sie tief.', en: 'Please breathe deeply.', blank: 'atmen' }],
  tip: null,
  verification: { status: 'unverified', sources: [] },
};

const pluralOnlyKopfschmerzen: Word = {
  id: 'kopfschmerzen',
  de: 'Kopfschmerzen',
  article: 'die',
  pos: 'noun',
  plural: null,
  pluralOnly: true,
  en: 'headache',
  topic: 'symptoms',
  level: 'A2',
  sentences: [{ level: 'A2', de: 'Der Patient hat starke Kopfschmerzen.', en: 'The patient has a severe headache.', blank: 'Kopfschmerzen' }],
  tip: null,
  verification: { status: 'unverified', sources: [] },
};

describe('gradeTyped — noun', () => {
  it('correct: noun + article match', () => {
    const result = gradeTyped({ word: nounKopf, typedWord: 'Kopf', chosenArticle: 'der' });
    expect(result.outcome).toBe('correct');
  });

  it('correct: case-insensitive match', () => {
    const result = gradeTyped({ word: nounKopf, typedWord: 'kopf', chosenArticle: 'der' });
    expect(result.outcome).toBe('correct');
    if (result.outcome === 'correct') {
      expect(result.note).toBe('capitalisation');
    }
  });

  it('article error: right noun, wrong article', () => {
    const result = gradeTyped({ word: nounKopf, typedWord: 'Kopf', chosenArticle: 'die' });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('article');
  });

  it('spelling near-miss: one-letter typo', () => {
    const result = gradeTyped({ word: nounKopf, typedWord: 'Kopff', chosenArticle: 'der' });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('spelling');
  });

  it('spelling near-miss: ae→ä substitution', () => {
    const handWord: Word = { ...nounKopf, id: 'haende', de: 'Hände', article: 'die' };
    const result = gradeTyped({ word: handWord, typedWord: 'Haende', chosenArticle: 'die' });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('spelling');
  });

  it('spelling near-miss: ue→ü substitution', () => {
    const word: Word = { ...nounKopf, id: 'mueller', de: 'Müller', article: 'der' };
    const result = gradeTyped({ word, typedWord: 'Mueller', chosenArticle: 'der' });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('spelling');
  });

  it('meaning error: completely wrong word', () => {
    const result = gradeTyped({ word: nounKopf, typedWord: 'Arm', chosenArticle: 'der' });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('meaning');
  });
});

describe('gradeTyped — verb (no article)', () => {
  it('correct: verb matches', () => {
    const result = gradeTyped({ word: verbAtmen, typedWord: 'atmen', chosenArticle: null });
    expect(result.outcome).toBe('correct');
  });

  it('spelling near-miss for verb', () => {
    const result = gradeTyped({ word: verbAtmen, typedWord: 'atmeen', chosenArticle: null });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('spelling');
  });

  it('meaning error for verb', () => {
    const result = gradeTyped({ word: verbAtmen, typedWord: 'waschen', chosenArticle: null });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('meaning');
  });
});

describe('gradeTyped — pluralOnly noun', () => {
  it('correct with die article', () => {
    const result = gradeTyped({ word: pluralOnlyKopfschmerzen, typedWord: 'Kopfschmerzen', chosenArticle: 'die' });
    expect(result.outcome).toBe('correct');
  });
});

describe('gradeOption', () => {
  it('correct option', () => {
    const result = gradeOption(2, 2);
    expect(result.outcome).toBe('correct');
  });

  it('wrong option → meaning error', () => {
    const result = gradeOption(1, 2);
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('meaning');
  });

  it('wrong option with article mismatch flag → article error', () => {
    const result = gradeOption(1, 2, true);
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('article');
  });
});

describe('gradePlural', () => {
  it('correct plural', () => {
    const result = gradePlural('Köpfe', 'Köpfe');
    expect(result.outcome).toBe('correct');
  });

  it('near-miss plural → spelling', () => {
    const result = gradePlural('Kopfe', 'Köpfe');
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('spelling');
  });

  it('completely wrong plural → plural error', () => {
    const result = gradePlural('Arme', 'Köpfe');
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.errorType).toBe('plural');
  });
});

describe('isSpellingNearMiss', () => {
  it('edit distance 1 — single insertion', () => expect(isSpellingNearMiss('Kopff', 'Kopf')).toBe(true));
  it('edit distance 1 — single deletion', () => expect(isSpellingNearMiss('Kop', 'Kopf')).toBe(true));
  it('diacritic removal match', () => expect(isSpellingNearMiss('Kopfe', 'Köpfe')).toBe(true));
  it('oe→ö substitution makes it a near-miss', () => expect(isSpellingNearMiss('oehr', 'Ohr')).toBe(true)); // removeDiacritics("oehr")="oehr", removeDiacritics("Ohr")="ohr" — edit dist 1
  it('exact match treated as near-miss (edit distance 0 ≤ 1)', () => expect(isSpellingNearMiss('Kopf', 'Kopf')).toBe(true));
  it('completely different word is not near-miss', () => expect(isSpellingNearMiss('Arm', 'Kopf')).toBe(false));
  it('edit distance 2 is not a near-miss', () => expect(isSpellingNearMiss('Kpof', 'Kopf')).toBe(false));
});
