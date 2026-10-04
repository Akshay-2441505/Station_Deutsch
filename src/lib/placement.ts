// ============================================================
// placement.ts — placement quick-check scoring
// Rules per LEARNING_DESIGN.md §8.
// ============================================================

import type { Level, PlacementItem } from './types';

export interface PlacementResult {
  suggestedLevel: Level;
  a1Correct: number;
  a1Total: number;
  a2Correct: number;
  a2Total: number;
}

/**
 * Score a placement check.
 * Items: 5 tagged A1 (indices 0-4) then 3 tagged A2 (indices 5-7).
 * Threshold: ≥ 4/5 A1 correct AND ≥ 2/3 A2 correct → suggest A2, else A1.
 */
export function scorePlacement(
  items: PlacementItem[],
  answers: number[], // chosen option index for each item
): PlacementResult {
  const a1Items = items.filter((i) => i.level === 'A1');
  const a2Items = items.filter((i) => i.level === 'A2');

  let a1Correct = 0;
  let a2Correct = 0;

  for (const item of a1Items) {
    const idx = items.indexOf(item);
    if (answers[idx] === item.answerIndex) a1Correct++;
  }
  for (const item of a2Items) {
    const idx = items.indexOf(item);
    if (answers[idx] === item.answerIndex) a2Correct++;
  }

  const suggestedLevel: Level =
    a1Correct >= 4 && a2Correct >= 2 ? 'A2' : 'A1';

  return {
    suggestedLevel,
    a1Correct,
    a1Total: a1Items.length,
    a2Correct,
    a2Total: a2Items.length,
  };
}
