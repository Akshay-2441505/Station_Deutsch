// ============================================================
// demo.ts — deterministic demo history generator (V2)
// Per V2_CHANGES.md §1.5:
// - spread attempts over ~5 days
// - mix error types (6 article, 4 meaning, 3 spelling)
// - no word with ≥ 2 recent misses in box 4 or 5
// - box counts match attempt history
// ============================================================

import type { AppState, Attempt, WordProgress, ExerciseType, ErrorType } from './types';
import { applyResult, freshProgress } from './scheduler';

interface DemoAction {
  day: number; // 0 to 4 (spread over 5 days)
  hour: number;
  wordId: string;
  exercise: ExerciseType;
  correct: boolean;
  errorType: ErrorType | null;
}

const DEMO_BASE_MS = 1_700_000_000_000;
const ONE_DAY_MS = 86_400_000;
const ONE_HOUR_MS = 3_600_000;

export function generateDemoHistory(): Pick<AppState, 'progress' | 'attempts' | 'sessions' | 'isDemoData'> {
  const progress: Record<string, WordProgress> = {};
  const attempts: Attempt[] = [];

  // 5-day scripted realistic nursing session sequence
  const actions: DemoAction[] = [
    // Day 0 (5 days ago)
    { day: 0, hour: 9, wordId: 'kopf', exercise: 'mcq_de_en', correct: true, errorType: null },
    { day: 0, hour: 9, wordId: 'arm', exercise: 'mcq_de_en', correct: true, errorType: null },
    { day: 0, hour: 9, wordId: 'bein', exercise: 'mcq_de_en', correct: false, errorType: 'meaning' }, // meaning 1
    { day: 0, hour: 10, wordId: 'hand', exercise: 'mcq_de_en', correct: false, errorType: 'article' }, // article 1
    { day: 0, hour: 10, wordId: 'auge', exercise: 'mcq_de_en', correct: true, errorType: null },
    { day: 0, hour: 10, wordId: 'ohr', exercise: 'mcq_de_en', correct: true, errorType: null },
    { day: 0, hour: 11, wordId: 'mund', exercise: 'mcq_de_en', correct: false, errorType: 'spelling' }, // spelling 1

    // Day 1 (4 days ago)
    { day: 1, hour: 14, wordId: 'kopf', exercise: 'mcq_en_de', correct: true, errorType: null },
    { day: 1, hour: 14, wordId: 'arm', exercise: 'mcq_en_de', correct: true, errorType: null },
    { day: 1, hour: 14, wordId: 'bein', exercise: 'mcq_de_en', correct: true, errorType: null },
    { day: 1, hour: 15, wordId: 'hand', exercise: 'mcq_de_en', correct: false, errorType: 'article' }, // article 2
    { day: 1, hour: 15, wordId: 'fieber', exercise: 'mcq_de_en', correct: false, errorType: 'meaning' }, // meaning 2
    { day: 1, hour: 16, wordId: 'schmerz', exercise: 'mcq_de_en', correct: false, errorType: 'article' }, // article 3

    // Day 2 (3 days ago)
    { day: 2, hour: 8, wordId: 'kopf', exercise: 'fill', correct: true, errorType: null },
    { day: 2, hour: 8, wordId: 'arm', exercise: 'fill', correct: true, errorType: null },
    { day: 2, hour: 8, wordId: 'auge', exercise: 'mcq_en_de', correct: true, errorType: null },
    { day: 2, hour: 9, wordId: 'ohr', exercise: 'mcq_en_de', correct: false, errorType: 'spelling' }, // spelling 2
    { day: 2, hour: 9, wordId: 'fieber', exercise: 'mcq_de_en', correct: false, errorType: 'article' }, // article 4
    { day: 2, hour: 10, wordId: 'schmerz', exercise: 'mcq_de_en', correct: false, errorType: 'spelling' }, // spelling 3

    // Day 3 (2 days ago)
    { day: 3, hour: 12, wordId: 'kopf', exercise: 'typed', correct: true, errorType: null },
    { day: 3, hour: 12, wordId: 'arm', exercise: 'typed', correct: true, errorType: null },
    { day: 3, hour: 12, wordId: 'bein', exercise: 'mcq_en_de', correct: true, errorType: null },
    { day: 3, hour: 13, wordId: 'hand', exercise: 'mcq_de_en', correct: false, errorType: 'article' }, // article 5
    { day: 3, hour: 13, wordId: 'nase', exercise: 'mcq_de_en', correct: true, errorType: null },
    { day: 3, hour: 14, wordId: 'blutdruck', exercise: 'mcq_de_en', correct: true, errorType: null },

    // Day 4 (yesterday / today)
    { day: 4, hour: 17, wordId: 'kopf', exercise: 'typed', correct: true, errorType: null }, // box 5
    { day: 4, hour: 17, wordId: 'arm', exercise: 'typed', correct: true, errorType: null }, // box 4
    { day: 4, hour: 17, wordId: 'auge', exercise: 'fill', correct: true, errorType: null }, // box 3
    { day: 4, hour: 18, wordId: 'fieber', exercise: 'mcq_de_en', correct: false, errorType: 'meaning' }, // meaning 3 (stubborn)
    { day: 4, hour: 18, wordId: 'schmerz', exercise: 'mcq_de_en', correct: false, errorType: 'meaning' }, // meaning 4 (stubborn)
    { day: 4, hour: 19, wordId: 'puls', exercise: 'mcq_de_en', correct: true, errorType: null },
    { day: 4, hour: 19, wordId: 'temperatur', exercise: 'mcq_de_en', correct: false, errorType: 'article' }, // article 6
  ];

  let attemptCounter = 1;

  for (const act of actions) {
    const at = DEMO_BASE_MS + act.day * ONE_DAY_MS + act.hour * ONE_HOUR_MS;
    const wordId = act.wordId;

    if (!progress[wordId]) {
      progress[wordId] = freshProgress(wordId);
    }

    // Apply via scheduler so box rules, error counts, and recent history are 100% consistent
    progress[wordId] = applyResult(progress[wordId], act.correct, act.errorType, false, at);

    attempts.push({
      id: `demo-${attemptCounter++}`,
      wordId,
      exercise: act.exercise,
      correct: act.correct,
      errorType: act.errorType,
      given: act.correct ? null : (act.errorType === 'article' ? 'der' : 'pain'),
      expected: act.correct ? null : (act.errorType === 'article' ? 'die' : 'fever'),
      isRetry: false,
      at,
    });
  }

  // Ensure stubborn words are in box <= 2
  for (const p of Object.values(progress)) {
    if (p.stubborn && p.box > 2) {
      p.box = 2;
    }
  }

  const sessions = [
    {
      id: 'demo-s1',
      at: DEMO_BASE_MS + 4 * ONE_DAY_MS + 19 * ONE_HOUR_MS,
      accuracy: 67,
      answered: 6,
      promotedIds: ['kopf', 'arm'],
    },
  ];

  return { progress, attempts, sessions, isDemoData: true };
}
