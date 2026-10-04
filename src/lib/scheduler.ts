// ============================================================
// scheduler.ts — box intervals, promotion, demotion, stubborn
// All learning rules per LEARNING_DESIGN.md §1-§3.
// ============================================================

import { dayKey, now } from './clock';
import type { ErrorType, WordProgress } from './types';

/** Interval in ms for each box (box 0 = n/a, not used here). */
const BOX_INTERVAL_MS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0,                     // due immediately
  2: 1 * 86_400_000,        // 1 day
  3: 3 * 86_400_000,        // 3 days
  4: 7 * 86_400_000,        // 7 days
  5: 14 * 86_400_000,       // 14 days
};

/** Returns ms until next due for a given box (0 for immediate). */
export function intervalMs(box: WordProgress['box']): number {
  if (box === 0) return 0;
  return BOX_INTERVAL_MS[box as 1 | 2 | 3 | 4 | 5];
}

/** Create a fresh WordProgress entry for a word. */
export function freshProgress(wordId: string): WordProgress {
  return {
    wordId,
    box: 0,
    seen: 0,
    correct: 0,
    wrong: 0,
    recent: [],
    stubborn: false,
    lastSeenAt: 0,
    nextDueAt: 0,
    lastPromotedDay: null,
    errorCounts: { meaning: 0, article: 0, spelling: 0, plural: 0 },
  };
}

/**
 * Apply the result of a checked answer to a WordProgress.
 * Returns a new WordProgress (immutable update).
 *
 * Rules (LEARNING_DESIGN.md §2):
 * - First answer moves box 0 → 1 regardless of correctness.
 * - Correct first try (not retry): +1 box, max 5, once-per-day cap.
 * - Correct retry: no box change.
 * - Wrong word / meaning: → box 1.
 * - Article or spelling error: no box change.
 */
export function applyResult(
  prog: WordProgress,
  correct: boolean,
  errorType: ErrorType | null,
  isRetry: boolean,
  atMs: number = now(),
): WordProgress {
  const next = { ...prog };
  next.seen += 1;
  next.lastSeenAt = atMs;

  // Update recent array (keep last 5)
  next.recent = [...prog.recent, correct].slice(-5);

  // Error counts
  if (errorType) {
    next.errorCounts = {
      ...prog.errorCounts,
      [errorType]: prog.errorCounts[errorType] + 1,
    };
  }

  if (correct) {
    next.correct += 1;
  } else {
    next.wrong += 1;
  }

  // --- Box transitions ---
  const todayKey = dayKey(atMs);

  // Update stubborn status
  if (prog.stubborn) {
    // Already stubborn: only clears when 3 correct in a row
    next.stubborn = !isStubbornnessCleared(next.recent);
  } else {
    // Becomes stubborn if ≥ 2 of last 5 are wrong
    next.stubborn = isStubborn(next.recent);
  }

  if (prog.box === 0) {
    // First-ever answer: always moves to box 1
    next.box = 1;
    next.nextDueAt = atMs + intervalMs(1);
    // Wrong first answer still logged as error (already done above)
  } else if (isRetry) {
    // Retry: no box change, no due update (per §6)
  } else if (correct) {
    // Correct, first try this session
    if (errorType === null) {
      // Check once-per-day cap
      if (prog.lastPromotedDay !== todayKey && prog.box < 5) {
        let candidateBox = (prog.box + 1) as WordProgress['box'];
        // V2 rule: A stubborn word cannot be promoted above box 2 until it clears
        if (next.stubborn && candidateBox > 2) {
          candidateBox = 2;
        }
        if (candidateBox !== prog.box) {
          next.box = candidateBox;
          next.lastPromotedDay = todayKey;
        }
      }
      // Set nextDueAt from the new box
      next.nextDueAt = atMs + intervalMs(next.box as 1|2|3|4|5);
    }
  } else {
    // Wrong answer
    if (errorType === 'meaning') {
      // Wrong word/meaning: demote to box 1
      next.box = 1;
      next.nextDueAt = atMs + intervalMs(1);
    } else if (errorType === 'article') {
      // V2 rule: Right word, wrong article: -1, minimum box 1, logged article
      next.box = Math.max(1, prog.box - 1) as WordProgress['box'];
      next.nextDueAt = atMs + intervalMs(next.box as 1|2|3|4|5);
    } else if (errorType === 'spelling' || errorType === 'plural') {
      // Spelling near-miss: no box change, just update due time from current box
      next.nextDueAt = atMs + intervalMs(next.box as 1|2|3|4|5);
    }
  }

  return next;
}

/** A word is stubborn when ≥ 2 of the last 5 results are wrong. */
export function isStubborn(recent: boolean[]): boolean {
  const wrongCount = recent.filter((r) => !r).length;
  return wrongCount >= 2;
}

/**
 * A stubborn word clears when it gets 3 correct answers in a row
 * (from the recent array).
 */
export function isStubbornnessCleared(recent: boolean[]): boolean {
  if (recent.length < 3) return false;
  const last3 = recent.slice(-3);
  return last3.every((r) => r);
}

/** Whether a word is due at the given time. */
export function isDue(prog: WordProgress, atMs: number = now()): boolean {
  if (prog.box === 0) return false; // New words are not "due"; they're learned in batches
  return prog.nextDueAt <= atMs;
}
