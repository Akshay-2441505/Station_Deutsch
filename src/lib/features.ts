// ============================================================
// features.ts — helper functions for Phase 3 Value Features
// ============================================================

import type { Word, WordProgress, Attempt, SessionSummary, Level, Topic, AppState } from './types';
import { isDue } from './scheduler';

export interface ReviewStatus {
  count: number;
  status: 'due_now' | 'due_later' | 'none';
  message: string;
}

/**
 * 3.1 Next review calculation
 */
export function getReviewStatus(
  progress: Record<string, WordProgress>,
  atMs: number,
): ReviewStatus {
  const wordsInProgress = Object.values(progress).filter((p) => p.box > 0);
  if (wordsInProgress.length === 0) {
    return { count: 0, status: 'none', message: 'No words scheduled for review.' };
  }

  const dueNow = wordsInProgress.filter((p) => isDue(p, atMs));
  if (dueNow.length > 0) {
    const count = dueNow.length;
    return {
      count,
      status: 'due_now',
      message: `${count} word${count === 1 ? '' : 's'} are due now.`,
    };
  }

  // Not due now; find earliest due date
  const sorted = [...wordsInProgress].sort((a, b) => a.nextDueAt - b.nextDueAt);
  const earliest = sorted[0]!;
  const diffDays = Math.max(1, Math.ceil((earliest.nextDueAt - atMs) / (86_400_000)));

  // Count words due on that same target day (within 24 hours of earliest)
  const targetDayCount = wordsInProgress.filter(
    (p) => Math.abs(p.nextDueAt - earliest.nextDueAt) < 86_400_000,
  ).length;

  const countStr = `${targetDayCount} word${targetDayCount === 1 ? '' : 's'}`;
  const message =
    diffDays === 1
      ? `Next review: tomorrow, ${countStr}`
      : `Next review: in ${diffDays} days, ${countStr}`;

  return {
    count: targetDayCount,
    status: 'due_later',
    message,
  };
}

/**
 * 3.1 Trend message comparison
 */
export function getTrendMessage(
  sessions: SessionSummary[],
  currentAccuracy: number,
): string | null {
  if (!sessions || sessions.length === 0) return null;
  const lastSession = sessions[0]!;
  return `Last session ${lastSession.accuracy}%, today ${currentAccuracy}%.`;
}

export interface MistakeEntry {
  word: Word;
  isFixed: boolean;
  latestError: Attempt;
  timeAgo: string;
}

/**
 * 3.2 Mistakes list aggregation
 */
export function getMistakesList(
  attempts: Attempt[],
  wordMap: Record<string, Word>,
  atMs = Date.now(),
): MistakeEntry[] {
  // Find all words that had at least one error
  const mistakeWords = new Set<string>();
  for (const a of attempts) {
    if (!a.correct || a.errorType) {
      mistakeWords.add(a.wordId);
    }
  }

  const result: MistakeEntry[] = [];

  for (const wordId of mistakeWords) {
    const word = wordMap[wordId];
    if (!word) continue;

    const wordAttempts = attempts.filter((a) => a.wordId === wordId);
    if (wordAttempts.length === 0) continue;

    const latestAttempt = wordAttempts[wordAttempts.length - 1]!;
    const errors = wordAttempts.filter((a) => !a.correct || a.errorType);
    const latestError = errors[errors.length - 1]!;

    const diffMs = atMs - latestError.at;
    let timeAgo = 'just now';
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) timeAgo = `${days}d ago`;
    else if (hours > 0) timeAgo = `${hours}h ago`;
    else if (mins > 0) timeAgo = `${mins}m ago`;

    result.push({
      word,
      isFixed: latestAttempt.correct,
      latestError,
      timeAgo,
    });
  }

  // Newest mistake first
  result.sort((a, b) => b.latestError.at - a.latestError.at);
  return result;
}

export interface TopicStat {
  topic: Topic;
  title: string;
  learned: number;
  total: number;
  hasUnseen: boolean;
}

const TOPIC_TITLES: Record<Topic, string> = {
  body: 'Body',
  symptoms: 'Symptoms',
  care: 'Care actions',
  ward: 'Ward & Equipment',
  patient: 'Patient interaction',
};

/**
 * 3.4 Topic stats map
 */
export function getTopicStats(
  allWords: Word[],
  progress: Record<string, WordProgress>,
  level: Level,
): TopicStat[] {
  const topics: Topic[] = ['body', 'symptoms', 'care', 'ward', 'patient'];

  return topics.map((t) => {
    const wordsInTopic = allWords.filter((w) => w.topic === t && w.level === level);
    const total = wordsInTopic.length;
    const learned = wordsInTopic.filter((w) => {
      const p = progress[w.id];
      return p && p.box >= 1;
    }).length;

    return {
      topic: t,
      title: TOPIC_TITLES[t] ?? t,
      learned,
      total,
      hasUnseen: learned < total,
    };
  });
}

/**
 * 3.5 Share weak words URL
 */
export function buildShareWeakWordsUrl(words: Word[]): string {
  const wordList = words
    .map((w) => `${w.article ? `${w.article} ` : ''}${w.de} (${w.en})`)
    .join(', ');
  const message = `My weak German medical words: ${wordList}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * 3.6 Export progress as JSON
 */
export function exportProgress(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * 3.6 Validate imported progress
 */
export function validateImportedProgress(
  jsonString: string,
): { success: boolean; data?: AppState; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'File is not a valid JSON object.' };
    }
    if (parsed.version !== 2) {
      return {
        success: false,
        error: `Incompatible data version. Station Deutsch requires version 2 (found version ${parsed.version ?? 'unknown'}).`,
      };
    }
    if (!parsed.progress || typeof parsed.progress !== 'object') {
      return { success: false, error: 'Missing or invalid "progress" dictionary.' };
    }
    if (!Array.isArray(parsed.attempts)) {
      return { success: false, error: 'Missing or invalid "attempts" array.' };
    }
    return { success: true, data: parsed as AppState };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Invalid JSON format: ${err instanceof Error ? err.message : 'Syntax error'}`,
    };
  }
}
