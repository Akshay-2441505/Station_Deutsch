// ============================================================
// demo.ts — deterministic demo history generator
// ============================================================

import type { AppState, Attempt, WordProgress } from './types';
import { freshProgress } from './scheduler';

const DEMO_WORD_IDS = [
  'kopf', 'arm', 'bein', 'hand', 'auge', 'ohr', 'mund', 'nase',
  'fieber', 'schmerz', 'husten', 'allergie',
  'blutdruck', 'puls', 'temperatur',
];

const DEMO_BASE_MS = 1_700_000_000_000; // fixed past timestamp for determinism

export function generateDemoHistory(): Pick<AppState, 'progress' | 'attempts' | 'isDemoData'> {
  const progress: Record<string, WordProgress> = {};
  const attempts: Attempt[] = [];
  let attemptIdx = 0;

  const boxes: Array<WordProgress['box']> = [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 1, 2, 3, 4, 1];

  DEMO_WORD_IDS.forEach((wordId, i) => {
    const box = boxes[i] ?? 1;
    const prog = freshProgress(wordId);
    prog.box = box;
    prog.seen = box * 2 + 1;
    prog.correct = box * 2;
    prog.wrong = 1;
    prog.recent = [false, true, true, true, true].slice(-Math.min(5, prog.seen));
    prog.stubborn = false;
    prog.lastSeenAt = DEMO_BASE_MS - i * 3_600_000;
    prog.nextDueAt = DEMO_BASE_MS + (i % 3) * 86_400_000 - 86_400_000;
    prog.lastPromotedDay = null;
    progress[wordId] = prog;

    // Add some attempts
    for (let j = 0; j < Math.min(prog.seen, 4); j++) {
      attempts.push({
        id: `demo-${attemptIdx++}`,
        wordId,
        exercise: j % 2 === 0 ? 'mcq_de_en' : 'typed',
        correct: j < prog.correct,
        errorType: j === 0 ? 'article' : null,
        isRetry: false,
        at: DEMO_BASE_MS - (prog.seen - j) * 3_600_000,
      });
    }
  });

  // Mark a couple as stubborn
  if (progress['fieber']) {
    progress['fieber'].recent = [false, true, false, true, false];
    progress['fieber'].stubborn = true;
    progress['fieber'].errorCounts.article = 2;
  }
  if (progress['schmerz']) {
    progress['schmerz'].recent = [true, false, true, false, true];
    progress['schmerz'].stubborn = true;
    progress['schmerz'].errorCounts.spelling = 1;
  }

  return { progress, attempts: attempts.slice(-500), isDemoData: true };
}
