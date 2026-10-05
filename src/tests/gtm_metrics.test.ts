// ============================================================
// gtm_metrics.test.ts — Unit tests for UTM builder, metrics, and level completion
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  buildUtmUrl,
  computePrototypeMetrics,
  hasSeenAllWords,
  generateDailyReminderIcs,
} from '../lib/metrics';
import type { SessionSummary, Attempt, Word, WordProgress } from '../lib/types';

describe('GTM & UTM Builder', () => {
  it('returns empty string when baseUrl is empty or whitespace', () => {
    expect(buildUtmUrl('', 'summary')).toBe('');
    expect(buildUtmUrl('   ', 'summary')).toBe('');
    expect(buildUtmUrl(null, 'summary')).toBe('');
    expect(buildUtmUrl(undefined, 'summary')).toBe('');
  });

  it('appends UTM parameters to a standard URL without parameters', () => {
    const url = buildUtmUrl('https://skillcase.com/demo', 'summary');
    expect(url).toBe(
      'https://skillcase.com/demo?utm_source=station_deutsch&utm_medium=prototype&utm_campaign=summary'
    );
  });

  it('preserves existing query parameters when appending UTM tags', () => {
    const url = buildUtmUrl('https://skillcase.com/demo?cohort=2026&ref=nurse', 'all_words_seen');
    expect(url).toContain('cohort=2026');
    expect(url).toContain('ref=nurse');
    expect(url).toContain('utm_source=station_deutsch');
    expect(url).toContain('utm_medium=prototype');
    expect(url).toContain('utm_campaign=all_words_seen');
  });

  it('handles URL-encoding for campaign placements with spaces or special characters', () => {
    const url = buildUtmUrl('https://skillcase.com/demo', 'live trainer demo');
    expect(url).toContain('utm_campaign=live+trainer+demo');
  });

  it('handles relative URLs safely', () => {
    const url = buildUtmUrl('/demo-page', 'summary');
    expect(url).toContain('/demo-page');
    expect(url).toContain('utm_source=station_deutsch');
    expect(url).toContain('utm_campaign=summary');
  });
});

describe('Prototype Metrics Calculations', () => {
  it('handles empty data cleanly', () => {
    const metrics = computePrototypeMetrics([], []);
    expect(metrics).toEqual({
      sessionsCompleted: 0,
      answers: 0,
      firstTryAccuracy: 0,
      daysPractised: 0,
      retrySuccessRate: null,
    });
  });

  it('calculates sessions, answers, first-try accuracy, days practised, and retry success rate', () => {
    const day1 = new Date('2026-10-01T10:00:00Z').getTime();
    const day1Later = new Date('2026-10-01T14:30:00Z').getTime();
    const day2 = new Date('2026-10-02T09:00:00Z').getTime();
    const day3 = new Date('2026-10-04T18:00:00Z').getTime();

    const mockSessions: SessionSummary[] = [
      { id: 's1', at: day1, accuracy: 80, answered: 10, promotedIds: ['w1', 'w2'] },
      { id: 's2', at: day2, accuracy: 90, answered: 10, promotedIds: ['w3'] },
    ];

    const mockAttempts: Attempt[] = [
      // Day 1: 3 first-try attempts (2 correct, 1 wrong)
      { id: 'a1', wordId: 'w1', exercise: 'article', correct: true, errorType: null, given: 'der', expected: 'der', isRetry: false, at: day1 },
      { id: 'a2', wordId: 'w2', exercise: 'mcq_de_en', correct: true, errorType: null, given: 'head', expected: 'head', isRetry: false, at: day1 },
      { id: 'a3', wordId: 'w3', exercise: 'article', correct: false, errorType: 'article', given: 'die', expected: 'das', isRetry: false, at: day1 },

      // Day 1 retry: 1 retry attempt (correct)
      { id: 'a4', wordId: 'w3', exercise: 'article', correct: true, errorType: null, given: 'das', expected: 'das', isRetry: true, at: day1Later },

      // Day 2: 2 first-try attempts (2 correct)
      { id: 'a5', wordId: 'w4', exercise: 'mcq_de_en', correct: true, errorType: null, given: 'pain', expected: 'pain', isRetry: false, at: day2 },
      { id: 'a6', wordId: 'w5', exercise: 'article', correct: true, errorType: null, given: 'die', expected: 'die', isRetry: false, at: day2 },

      // Day 3: 1 first-try (wrong) + 1 retry (wrong)
      { id: 'a7', wordId: 'w6', exercise: 'typed', correct: false, errorType: 'spelling', given: 'fiebr', expected: 'fieber', isRetry: false, at: day3 },
      { id: 'a8', wordId: 'w6', exercise: 'typed', correct: false, errorType: 'spelling', given: 'feber', expected: 'fieber', isRetry: true, at: day3 },
    ];

    const metrics = computePrototypeMetrics(mockSessions, mockAttempts);

    expect(metrics.sessionsCompleted).toBe(2);
    expect(metrics.answers).toBe(8);

    // First try attempts: a1 (✓), a2 (✓), a3 (✗), a5 (✓), a6 (✓), a7 (✗) -> 4 correct out of 6 -> 67%
    expect(metrics.firstTryAccuracy).toBe(67);

    // Days practised: day 1, day 2, day 3 -> 3 unique days
    expect(metrics.daysPractised).toBe(3);

    // Retries: a4 (✓), a8 (✗) -> 1 correct out of 2 -> 50%
    expect(metrics.retrySuccessRate).toBe(50);
  });

  it('falls back to session average when no individual attempt logs are available', () => {
    const mockSessions: SessionSummary[] = [
      { id: 's1', at: 1000, accuracy: 70, answered: 10, promotedIds: [] },
      { id: 's2', at: 2000, accuracy: 90, answered: 10, promotedIds: [] },
    ];

    const metrics = computePrototypeMetrics(mockSessions, []);
    expect(metrics.sessionsCompleted).toBe(2);
    expect(metrics.answers).toBe(20);
    expect(metrics.firstTryAccuracy).toBe(80);
    expect(metrics.retrySuccessRate).toBeNull();
  });
});

import { freshProgress } from '../lib/scheduler';

describe('Level Completion Check (hasSeenAllWords)', () => {
  const words = [
    { id: 'w1', de: 'Kopf', en: 'head', article: 'der', pos: 'noun', topic: 'body', level: 'A1', sentences: [{ de: 'Mein Kopf tut weh.', en: 'My head hurts.', blank: 'Mein ___ tut weh.', level: 'A1' }] },
    { id: 'w2', de: 'Arm', en: 'arm', article: 'der', pos: 'noun', topic: 'body', level: 'A1', sentences: [{ de: 'Der Arm.', en: 'The arm.', blank: 'Der ___.', level: 'A1' }] },
    { id: 'w3', de: 'Visite', en: 'ward round', article: 'die', pos: 'noun', topic: 'ward', level: 'A2', sentences: [{ de: 'Die Visite.', en: 'The round.', blank: 'Die ___.', level: 'A2' }] },
  ] as unknown as Word[];

  it('returns false when some words have not been seen', () => {
    const progress: Record<string, WordProgress> = {
      w1: { ...freshProgress('w1'), box: 1 },
      // w2 is not in progress
    };
    expect(hasSeenAllWords(words, progress, 'A1')).toBe(false);
  });

  it('returns false when a word is only in box 0', () => {
    const progress: Record<string, WordProgress> = {
      w1: { ...freshProgress('w1'), box: 1 },
      w2: { ...freshProgress('w2'), box: 0 },
    };
    expect(hasSeenAllWords(words, progress, 'A1')).toBe(false);
  });

  it('returns true when all words in level have box >= 1', () => {
    const progress: Record<string, WordProgress> = {
      w1: { ...freshProgress('w1'), box: 1 },
      w2: { ...freshProgress('w2'), box: 3 },
      // w3 is A2, should not affect A1
    };
    expect(hasSeenAllWords(words, progress, 'A1')).toBe(true);
    expect(hasSeenAllWords(words, progress, 'A2')).toBe(false);
  });
});

describe('Daily Reminder ICS Generator', () => {
  it('generates valid iCalendar text format with 5min duration and RRULE daily', () => {
    const ics = generateDailyReminderIcs('https://stationdeutsch.web.app');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('RRULE:FREQ=DAILY');
    expect(ics).toContain('DURATION:PT5M');
    expect(ics).toContain('URL:https://stationdeutsch.web.app');
    expect(ics).toContain('END:VCALENDAR');
  });
});
