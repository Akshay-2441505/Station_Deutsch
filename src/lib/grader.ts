// ============================================================
// grader.ts — grading and error classification
// Rules per LEARNING_DESIGN.md §5.
// ============================================================

import type { GradeResult, Word } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalise(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Remove diacritics: ä→a, ö→o, ü→u, ß→ss etc. */
function removeDiacritics(s: string): string {
  return s
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/Ä/g, 'a')
    .replace(/Ö/g, 'o')
    .replace(/Ü/g, 'u')
    .replace(/ß/g, 'ss');
}

/** Substitute ae/oe/ue/ss back to ä/ö/ü/ß. */
function substituteUmlauts(s: string): string {
  return s
    .replace(/ae/g, 'ä')
    .replace(/oe/g, 'ö')
    .replace(/ue/g, 'ü')
    .replace(/ss/g, 'ß');
}

/** Simple Levenshtein edit distance. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Returns true if `typed` is a spelling near-miss of `target`:
 * - Edit distance of 1
 * - Matches after ae/oe/ue/ss → umlaut substitution
 * - Matches after diacritic removal
 */
function isSpellingNearMiss(typed: string, target: string): boolean {
  const t = normalise(typed);
  const tgt = normalise(target);
  if (levenshtein(t, tgt) <= 1) return true;
  if (normalise(substituteUmlauts(t)) === tgt) return true;
  if (removeDiacritics(t) === removeDiacritics(tgt)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// MCQ / match / article / fill (option-based)
// ---------------------------------------------------------------------------

/**
 * Grade an option-based exercise (mcq_de_en, mcq_en_de, match, article, fill with options).
 * `chosenIndex` is the index into `options`; `correctIndex` is the expected answer.
 *
 * For mcq_en_de nouns: if the chosen option has the right noun but wrong article,
 * that is an `article` error (the options array must be structured accordingly,
 * and caller passes `articleMismatch: true`).
 */
export function gradeOption(
  chosenIndex: number,
  correctIndex: number,
  articleMismatch = false,
): GradeResult {
  if (chosenIndex === correctIndex) {
    return { outcome: 'correct' };
  }
  if (articleMismatch) {
    return { outcome: 'error', errorType: 'article' };
  }
  return { outcome: 'error', errorType: 'meaning' };
}

// ---------------------------------------------------------------------------
// Typed recall
// ---------------------------------------------------------------------------

export interface TypedRecallInput {
  word: Word;
  typedWord: string;
  chosenArticle: string | null; // null for non-nouns
}

/**
 * Grade a typed recall answer per LEARNING_DESIGN.md §5.
 * Decision order:
 *   1. Noun matches + article matches → correct (check capitalisation)
 *   2. Noun matches + article wrong   → article error
 *   3. Noun differs by near-miss      → spelling error
 *   4. Anything else                  → meaning error
 */
export function gradeTyped(input: TypedRecallInput): GradeResult {
  const { word, typedWord, chosenArticle } = input;
  const normTyped = normalise(typedWord);
  const normTarget = normalise(word.de);

  const nounMatches = normTyped === normTarget;

  // Non-noun: compare whole string only
  if (word.pos !== 'noun' || word.article === null) {
    if (nounMatches) {
      // Check capitalisation for words that should start with upper case
      // (German nouns always capitalised, but this branch is non-nouns)
      return { outcome: 'correct' };
    }
    if (isSpellingNearMiss(normTyped, normTarget)) {
      return { outcome: 'error', errorType: 'spelling' };
    }
    return { outcome: 'error', errorType: 'meaning' };
  }

  // Noun path
  if (nounMatches) {
    const articleCorrect = chosenArticle === word.article;
    if (articleCorrect) {
      // Check if learner forgot to capitalise the noun
      const rawTyped = typedWord.trim();
      const startsLower = rawTyped.length > 0 && rawTyped[0] === rawTyped[0].toLowerCase() && rawTyped[0] !== rawTyped[0].toUpperCase();
      if (startsLower) {
        return { outcome: 'correct', note: 'capitalisation' };
      }
      return { outcome: 'correct' };
    }
    return { outcome: 'error', errorType: 'article' };
  }

  if (isSpellingNearMiss(normTyped, normTarget)) {
    return { outcome: 'error', errorType: 'spelling' };
  }

  return { outcome: 'error', errorType: 'meaning' };
}

// ---------------------------------------------------------------------------
// Plural recall
// ---------------------------------------------------------------------------

export function gradePlural(typedPlural: string, correctPlural: string): GradeResult {
  const norm = normalise(typedPlural);
  const target = normalise(correctPlural);
  if (norm === target) return { outcome: 'correct' };
  if (isSpellingNearMiss(norm, target)) return { outcome: 'error', errorType: 'spelling' };
  return { outcome: 'error', errorType: 'plural' };
}

// Re-export helper for tests
export { isSpellingNearMiss, levenshtein };
