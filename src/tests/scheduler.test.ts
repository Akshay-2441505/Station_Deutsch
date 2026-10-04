// ============================================================
// scheduler.test.ts — unit tests for scheduler.ts
// Covers all cases from LEARNING_DESIGN.md §12
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { setDayOffset, dayKey, now } from '../lib/clock';
import {
  applyResult,
  freshProgress,
  isDue,
  isStubborn,
  isStubbornnessCleared,
  intervalMs,
} from '../lib/scheduler';

// Helper: advance the app clock by N days
function advanceDays(n: number) {
  setDayOffset(n);
}

beforeEach(() => {
  setDayOffset(0);
});

describe('freshProgress', () => {
  it('creates a box-0 progress entry', () => {
    const p = freshProgress('kopf');
    expect(p.box).toBe(0);
    expect(p.seen).toBe(0);
    expect(p.correct).toBe(0);
    expect(p.stubborn).toBe(false);
  });
});

describe('applyResult — first answer', () => {
  it('moves box 0 → 1 on correct answer', () => {
    const p = freshProgress('kopf');
    const next = applyResult(p, true, null, false);
    expect(next.box).toBe(1);
  });

  it('moves box 0 → 1 on wrong answer', () => {
    const p = freshProgress('kopf');
    const next = applyResult(p, false, 'meaning', false);
    expect(next.box).toBe(1);
  });

  it('logs error type on first wrong answer', () => {
    const p = freshProgress('kopf');
    const next = applyResult(p, false, 'article', false);
    expect(next.errorCounts.article).toBe(1);
    expect(next.box).toBe(1); // still moves to box 1
  });
});

describe('applyResult — promotion', () => {
  it('promotes box 1 → 2 on correct answer', () => {
    const p = { ...freshProgress('kopf'), box: 1 as const, seen: 1 };
    const next = applyResult(p, true, null, false);
    expect(next.box).toBe(2);
  });

  it('once-per-day cap: correct answer same day does not promote twice', () => {
    const p = { ...freshProgress('kopf'), box: 1 as const, seen: 1 };
    const first = applyResult(p, true, null, false);
    expect(first.box).toBe(2);

    // Same day — should NOT promote again
    const second = applyResult(first, true, null, false);
    expect(second.box).toBe(2); // stays at 2
  });

  it('once-per-day cap: resets next day', () => {
    const p = { ...freshProgress('kopf'), box: 1 as const, seen: 1 };
    const first = applyResult(p, true, null, false);
    expect(first.box).toBe(2);

    advanceDays(1);

    const second = applyResult(first, true, null, false);
    expect(second.box).toBe(3); // now promoted
  });

  it('does not promote beyond box 5', () => {
    const p = { ...freshProgress('kopf'), box: 5 as const, seen: 10 };
    const next = applyResult(p, true, null, false);
    expect(next.box).toBe(5);
  });
});

describe('applyResult — demotion', () => {
  it('wrong word (meaning error) resets to box 1', () => {
    const p = { ...freshProgress('kopf'), box: 3 as const, seen: 5 };
    const next = applyResult(p, false, 'meaning', false);
    expect(next.box).toBe(1);
  });

  it('article error demotes box by 1 (minimum box 1)', () => {
    const p = { ...freshProgress('kopf'), box: 3 as const, seen: 5 };
    const next = applyResult(p, false, 'article', false);
    expect(next.box).toBe(2);
  });

  it('spelling error does NOT change box', () => {
    const p = { ...freshProgress('kopf'), box: 3 as const, seen: 5 };
    const next = applyResult(p, false, 'spelling', false);
    expect(next.box).toBe(3);
  });

  it('plural error does NOT change box', () => {
    const p = { ...freshProgress('kopf'), box: 4 as const, seen: 5 };
    const next = applyResult(p, false, 'plural', false);
    expect(next.box).toBe(4);
  });
});

describe('applyResult — retry', () => {
  it('retry correct does not change box', () => {
    const p = { ...freshProgress('kopf'), box: 2 as const, seen: 3 };
    const next = applyResult(p, true, null, true /* isRetry */);
    expect(next.box).toBe(2); // no promotion on retry
  });
});

describe('stubborn logic', () => {
  it('isStubborn: true when ≥ 2 of last 5 are wrong', () => {
    expect(isStubborn([true, false, true, false, true])).toBe(true);
    expect(isStubborn([false, false, true, true, true])).toBe(true);
  });

  it('isStubborn: false when fewer than 2 wrong', () => {
    expect(isStubborn([true, true, true, true, false])).toBe(false);
    expect(isStubborn([true, true, true, true, true])).toBe(false);
  });

  it('stubborn clears after 3 correct in a row', () => {
    expect(isStubbornnessCleared([false, false, true, true, true])).toBe(true);
  });

  it('stubborn does not clear with only 2 correct in a row', () => {
    expect(isStubbornnessCleared([false, false, false, true, true])).toBe(false);
  });

  it('applyResult sets stubborn when ≥ 2 wrong in last 5', () => {
    let p = freshProgress('kopf');
    p = applyResult(p, false, 'meaning', false); // box0→1, wrong
    p = applyResult(p, true, null, false);
    p = applyResult(p, false, 'article', false);
    expect(p.stubborn).toBe(true);
  });
});

describe('intervalMs', () => {
  it('returns 0 for box 1', () => expect(intervalMs(1)).toBe(0));
  it('returns 1 day for box 2', () => expect(intervalMs(2)).toBe(86_400_000));
  it('returns 3 days for box 3', () => expect(intervalMs(3)).toBe(3 * 86_400_000));
  it('returns 7 days for box 4', () => expect(intervalMs(4)).toBe(7 * 86_400_000));
  it('returns 14 days for box 5', () => expect(intervalMs(5)).toBe(14 * 86_400_000));
});

describe('isDue', () => {
  it('box 0 words are never due', () => {
    const p = freshProgress('kopf');
    expect(isDue(p)).toBe(false);
  });

  it('box 1 words are immediately due', () => {
    const p = { ...freshProgress('kopf'), box: 1 as const, nextDueAt: now() - 1 };
    expect(isDue(p)).toBe(true);
  });

  it('box 2 word is due after 1 day', () => {
    setDayOffset(0);
    const atNow = now();
    const p = {
      ...freshProgress('kopf'),
      box: 2 as const,
      nextDueAt: atNow + 86_400_000,
    };
    expect(isDue(p, atNow)).toBe(false);

    // Simulate tomorrow
    advanceDays(1);
    expect(isDue(p, now())).toBe(true);
  });
});

describe('dayKey', () => {
  it('returns YYYY-MM-DD format', () => {
    const key = dayKey(new Date('2025-06-15T10:00:00Z').getTime());
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
