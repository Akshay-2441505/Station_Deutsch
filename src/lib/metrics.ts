// ============================================================
// metrics.ts — UTM builder, prototype metrics, analytics tracker, and ICS generator
// ============================================================

import type { SessionSummary, Attempt, Word, WordProgress, Level } from './types';

// ============================================================
// 1. UTM Builder
// ============================================================

/**
 * Builds a URL with UTM campaign parameters.
 * Returns empty string if baseUrl is empty or whitespace.
 * Appends:
 *   utm_source=station_deutsch
 *   utm_medium=prototype
 *   utm_campaign=<placement>
 */
export function buildUtmUrl(baseUrl: string | undefined | null, placement: string): string {
  if (!baseUrl || !baseUrl.trim()) return '';
  const trimmed = baseUrl.trim();
  const placementEncoded = encodeURIComponent(placement.trim());

  try {
    const isAbsolute = /^https?:\/\//i.test(trimmed);
    const parsed = new URL(trimmed, isAbsolute ? undefined : 'https://dummy.local');
    parsed.searchParams.set('utm_source', 'station_deutsch');
    parsed.searchParams.set('utm_medium', 'prototype');
    parsed.searchParams.set('utm_campaign', placement.trim());

    if (isAbsolute) {
      return parsed.toString();
    }
    // Relative URL: preserve path, query, hash
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}utm_source=station_deutsch&utm_medium=prototype&utm_campaign=${placementEncoded}`;
  }
}

// ============================================================
// 2. Prototype Metrics Calculator
// ============================================================

export interface PrototypeMetrics {
  /** Total count of sessions finished */
  sessionsCompleted: number;
  /** Total number of questions answered */
  answers: number;
  /** First-try accuracy percentage (0-100) */
  firstTryAccuracy: number;
  /** Number of distinct calendar days practised */
  daysPractised: number;
  /** Accuracy rate on retry attempts (0-100), or null if no retries */
  retrySuccessRate: number | null;
}

/**
 * Computes metrics strictly from local device data.
 * Collects zero personal data.
 */
export function computePrototypeMetrics(
  sessions: SessionSummary[],
  attempts: Attempt[]
): PrototypeMetrics {
  const sessionsCompleted = sessions.length;

  // Answers count
  const answers =
    attempts.length > 0
      ? attempts.length
      : sessions.reduce((sum, s) => sum + (s.answered || 0), 0);

  // First-try accuracy percentage: calculate from attempts with isRetry === false
  const firstTryAttempts = attempts.filter((a) => !a.isRetry);
  let firstTryAccuracy = 0;
  if (firstTryAttempts.length > 0) {
    const correctCount = firstTryAttempts.filter((a) => a.correct).length;
    firstTryAccuracy = Math.round((correctCount / firstTryAttempts.length) * 100);
  } else if (sessions.length > 0) {
    const totalAccuracy = sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0);
    firstTryAccuracy = Math.round(totalAccuracy / sessions.length);
  }

  // Days practised: distinct calendar dates across attempts and session summaries
  const timestamps = attempts.map((a) => a.at).concat(sessions.map((s) => s.at));
  const uniqueDays = new Set<string>();

  for (const ts of timestamps) {
    if (typeof ts === 'number' && !isNaN(ts) && ts > 0) {
      const d = new Date(ts);
      // Format as YYYY-MM-DD
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      uniqueDays.add(dateKey);
    }
  }
  const daysPractised = uniqueDays.size;

  // Retry success rate: for attempts where isRetry === true
  const retryAttempts = attempts.filter((a) => a.isRetry);
  let retrySuccessRate: number | null = null;
  if (retryAttempts.length > 0) {
    const correctRetries = retryAttempts.filter((a) => a.correct).length;
    retrySuccessRate = Math.round((correctRetries / retryAttempts.length) * 100);
  }

  return {
    sessionsCompleted,
    answers,
    firstTryAccuracy,
    daysPractised,
    retrySuccessRate,
  };
}

// ============================================================
// 3. Level Completion Check
// ============================================================

/**
 * Checks whether all words for a given level have been seen (in box >= 1).
 */
export function hasSeenAllWords(
  words: Word[],
  progress: Record<string, WordProgress>,
  level: Level
): boolean {
  const levelWords = words.filter((w) => w.level === level);
  if (levelWords.length === 0) return false;
  return levelWords.every((w) => {
    const prog = progress[w.id];
    return prog && prog.box >= 1;
  });
}

// ============================================================
// 4. Daily Reminder ICS Generator
// ============================================================

export function generateDailyReminderIcs(appUrl: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = new Date();
  const dtstamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const dtstart = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T090000`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Station Deutsch//Daily Practice Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:station-deutsch-daily-${Date.now()}@skillcase`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    'DURATION:PT5M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:Station Deutsch — 5-min German practice',
    `DESCRIPTION:Quick 5-minute medical German practice for nurses: ${appUrl}`,
    `URL:${appUrl}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadDailyReminderIcs(appUrl: string): void {
  const content = generateDailyReminderIcs(appUrl);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'station-deutsch-daily-reminder.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// 5. Typed Anonymous Analytics Tracker
// ============================================================

export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'session_started'
  | 'session_completed'
  | 'mistake_logged'
  | 'share_clicked'
  | 'demo_link_clicked';

export interface AnalyticsEventProps {
  onboarding_completed: { source: 'placement' | 'manual' | 'sample'; level: string };
  session_started: { mode?: string; count?: number; poolSize?: number };
  session_completed: { accuracy: number; answered: number; promotedCount: number };
  mistake_logged: { wordId: string; errorType?: string };
  share_clicked: { context: string; channel?: string };
  demo_link_clicked: { placement: string; url?: string };
}

/**
 * Anonymous analytics event logger.
 * In development, logs neatly to console. In production, performs zero network calls.
 * Collects zero personal data.
 */
export function track<E extends AnalyticsEvent>(
  event: E,
  props?: AnalyticsEventProps[E] | Record<string, unknown>
): void {
  const isDev =
    Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`[Station Deutsch Analytics] ${event}`, props ?? {});
  }
}
