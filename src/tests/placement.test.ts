// ============================================================
// placement.test.ts — unit tests for placement.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import { scorePlacement } from '../lib/placement';
import type { PlacementItem } from '../lib/types';

const items: PlacementItem[] = [
  // 5 A1 items
  { id: 'p1', level: 'A1', kind: 'meaning', prompt: 'Q1', options: ['a', 'b'], answerIndex: 0, verification: { status: 'unverified', sources: [] } },
  { id: 'p2', level: 'A1', kind: 'meaning', prompt: 'Q2', options: ['a', 'b'], answerIndex: 0, verification: { status: 'unverified', sources: [] } },
  { id: 'p3', level: 'A1', kind: 'meaning', prompt: 'Q3', options: ['a', 'b'], answerIndex: 1, verification: { status: 'unverified', sources: [] } },
  { id: 'p4', level: 'A1', kind: 'meaning', prompt: 'Q4', options: ['a', 'b'], answerIndex: 0, verification: { status: 'unverified', sources: [] } },
  { id: 'p5', level: 'A1', kind: 'meaning', prompt: 'Q5', options: ['a', 'b'], answerIndex: 1, verification: { status: 'unverified', sources: [] } },
  // 3 A2 items
  { id: 'p6', level: 'A2', kind: 'meaning', prompt: 'Q6', options: ['a', 'b'], answerIndex: 0, verification: { status: 'unverified', sources: [] } },
  { id: 'p7', level: 'A2', kind: 'meaning', prompt: 'Q7', options: ['a', 'b'], answerIndex: 1, verification: { status: 'unverified', sources: [] } },
  { id: 'p8', level: 'A2', kind: 'meaning', prompt: 'Q8', options: ['a', 'b'], answerIndex: 0, verification: { status: 'unverified', sources: [] } },
];

describe('scorePlacement', () => {
  it('suggests A2 when ≥4 A1 and ≥2 A2 correct', () => {
    // All correct
    const answers = [0, 0, 1, 0, 1, 0, 1, 0];
    const result = scorePlacement(items, answers);
    expect(result.suggestedLevel).toBe('A2');
    expect(result.a1Correct).toBe(5);
    expect(result.a2Correct).toBe(3);
  });

  it('suggests A1 when only 3 A1 correct (below threshold)', () => {
    // A1: q1, q2 wrong; q3, q4, q5 correct
    const answers = [1, 1, 1, 0, 1, 0, 1, 0];
    const result = scorePlacement(items, answers);
    expect(result.suggestedLevel).toBe('A1');
    expect(result.a1Correct).toBe(3);
  });

  it('suggests A1 when only 1 A2 correct (below threshold)', () => {
    // A1: 4 correct, A2: only 1 correct
    const answers = [0, 0, 1, 0, 1, 0, 0, 1];
    const result = scorePlacement(items, answers);
    expect(result.suggestedLevel).toBe('A1');
    expect(result.a2Correct).toBe(1);
  });

  it('boundary: exactly 4 A1 + exactly 2 A2 → A2', () => {
    // A1: indices 0,1,2,3 correct, 4 wrong
    // A2: indices 5,6 correct, 7 wrong
    const answers = [0, 0, 1, 0, 0 /* wrong */, 0, 1, 1 /* wrong */];
    const result = scorePlacement(items, answers);
    expect(result.suggestedLevel).toBe('A2');
    expect(result.a1Correct).toBe(4);
    expect(result.a2Correct).toBe(2);
  });
});
