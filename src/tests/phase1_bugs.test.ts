// ============================================================
// phase1_bugs.test.ts — Phase 1 failing tests first
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { applyResult, freshProgress } from '../lib/scheduler';
import { generateDemoHistory } from '../lib/demo';
import { setDayOffset } from '../lib/clock';
import type { WordProgress } from '../lib/types';

beforeEach(() => {
  setDayOffset(0);
});

describe('1.4 Demotion rules and stubborn promotion cap', () => {
  it('wrong article demotes box by 1 (minimum box 1)', () => {
    // Starting at box 3
    const p3: WordProgress = {
      ...freshProgress('w1'),
      box: 3,
      seen: 5,
    };
    const afterArticleError = applyResult(p3, false, 'article', false);
    expect(afterArticleError.box).toBe(2); // Demoted 3 -> 2
    expect(afterArticleError.errorCounts.article).toBe(1);

    // Starting at box 1
    const p1: WordProgress = {
      ...freshProgress('w2'),
      box: 1,
      seen: 3,
    };
    const afterArticleErrorAtBox1 = applyResult(p1, false, 'article', false);
    expect(afterArticleErrorAtBox1.box).toBe(1); // Min box is 1
  });

  it('spelling error does not change box', () => {
    const p: WordProgress = {
      ...freshProgress('w1'),
      box: 3,
      seen: 5,
    };
    const next = applyResult(p, false, 'spelling', false);
    expect(next.box).toBe(3);
    expect(next.errorCounts.spelling).toBe(1);
  });

  it('meaning error resets box to 1', () => {
    const p: WordProgress = {
      ...freshProgress('w1'),
      box: 4,
      seen: 8,
    };
    const next = applyResult(p, false, 'meaning', false);
    expect(next.box).toBe(1);
    expect(next.errorCounts.meaning).toBe(1);
  });

  it('stubborn word cannot be promoted above box 2 until it clears', () => {
    // Word is stubborn (e.g. recent has 2 false in last 5)
    const stubbornWord: WordProgress = {
      ...freshProgress('w_stubborn'),
      box: 2,
      seen: 6,
      stubborn: true,
      recent: [false, false, true, true, false],
    };

    // Correct answer on box 2
    const next = applyResult(stubbornWord, true, null, false);
    // Should NOT be promoted to box 3 because it is still stubborn!
    expect(next.box).toBe(2);

    // If it was at box 1, it can be promoted to box 2
    const stubbornAtBox1: WordProgress = {
      ...freshProgress('w_stubborn_1'),
      box: 1,
      seen: 4,
      stubborn: true,
      recent: [false, false, true, true, false],
    };
    const promotedToBox2 = applyResult(stubbornAtBox1, true, null, false);
    expect(promotedToBox2.box).toBe(2);
  });

  it('stubborn word clears after 3 consecutive correct answers and can then promote above box 2', () => {
    let p: WordProgress = {
      ...freshProgress('w_clear'),
      box: 1,
      seen: 5,
      stubborn: true,
      recent: [false, false, true, false, false],
    };

    // 1st correct answer (day 0)
    p = applyResult(p, true, null, false);
    expect(p.stubborn).toBe(true);
    expect(p.box).toBe(2);

    // 2nd correct answer (day 1)
    setDayOffset(1);
    p = applyResult(p, true, null, false);
    expect(p.stubborn).toBe(true);
    expect(p.box).toBe(2); // Capped at 2

    // 3rd correct answer (day 2) — clears stubborn!
    setDayOffset(2);
    p = applyResult(p, true, null, false);
    expect(p.stubborn).toBe(false); // Cleared!

    // 4th correct answer (day 3) — now promotes to box 4!
    setDayOffset(3);
    p = applyResult(p, true, null, false);
    expect(p.box).toBe(4);
  });
});

describe('1.5 Demo data realism and constraints', () => {
  it('generates demo history consistent with V2 rules', () => {
    const demo = generateDemoHistory();

    expect(demo.attempts.length).toBeGreaterThan(15);
    expect(demo.isDemoData).toBe(true);

    // Attempts should be spread over multiple days (~5 days)
    const times = demo.attempts.map((a) => a.at);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const daysSpread = (maxTime - minTime) / (86_400_000);
    expect(daysSpread).toBeGreaterThanOrEqual(3);

    // Mix of error types
    const errorTypes = demo.attempts.map((a) => a.errorType).filter(Boolean);
    const hasArticle = errorTypes.includes('article');
    const hasMeaning = errorTypes.includes('meaning');
    const hasSpelling = errorTypes.includes('spelling');
    expect(hasArticle).toBe(true);
    expect(hasMeaning).toBe(true);
    expect(hasSpelling).toBe(true);

    // No word with >= 2 recent misses in box 4 or 5
    for (const [wordId, prog] of Object.entries(demo.progress)) {
      if (prog.box >= 4) {
        const recentMisses = prog.recent.filter((r) => !r).length;
        expect(recentMisses, `Word ${wordId} has >= 2 recent misses but is in box ${prog.box}`).toBeLessThan(2);
        expect(prog.stubborn, `Word ${wordId} is stubborn but in box ${prog.box}`).toBe(false);
      }
    }
  });
});
