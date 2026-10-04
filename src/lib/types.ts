// ============================================================
// types.ts — all shared TypeScript types for Station Deutsch
// ============================================================

export type Level = 'A1' | 'A2';
export type Topic = 'body' | 'symptoms' | 'care' | 'ward' | 'patient';
export type Article = 'der' | 'die' | 'das';
export type Pos = 'noun' | 'verb' | 'adjective' | 'phrase';
export type ErrorType = 'meaning' | 'article' | 'spelling' | 'plural';
export type ExerciseType =
  | 'mcq_de_en'
  | 'mcq_en_de'
  | 'match'
  | 'article'
  | 'fill'
  | 'typed'
  | 'plural'
  | 'listen';

export type WordState = 'New' | 'Learning' | 'Familiar' | 'Strong' | 'Mastered';

export interface Sentence {
  level: Level;
  de: string;
  en: string;
  blank: string; // the token in `de` that is hidden in fill exercises
}

export interface Word {
  id: string;             // slug, unique
  de: string;             // headword without article, e.g. "Kopf"
  article: Article | null; // null for verbs, adjectives, phrases
  pos: Pos;
  plural: string | null;  // e.g. "Köpfe". null if none
  pluralOnly: boolean;    // true for nouns that only exist in plural
  en: string;
  topic: Topic;
  level: Level;
  sentences: Sentence[];  // at least one
  tip: string | null;     // memory tip, shown for stubborn words
  verification: {
    status: 'unverified' | 'verified';
    sources: string[];    // required when status is 'verified'
  };
  conflicts?: string[];   // word IDs that must never appear together as options
}

export interface WordProgress {
  wordId: string;
  box: 0 | 1 | 2 | 3 | 4 | 5;
  seen: number;
  correct: number;
  wrong: number;
  recent: boolean[];      // last 5 results, newest last
  stubborn: boolean;
  lastSeenAt: number;     // ms, app clock
  nextDueAt: number;      // ms, app clock
  lastPromotedDay: string | null; // 'YYYY-MM-DD' app clock, for the once-per-day cap
  errorCounts: Record<ErrorType, number>;
}

export interface Attempt {
  id: string;
  wordId: string;
  exercise: ExerciseType;
  correct: boolean;
  errorType: ErrorType | null;
  isRetry: boolean;
  at: number;
}

export interface PlacementItem {
  id: string;
  level: Level;
  kind: 'meaning' | 'article' | 'sentence';
  prompt: string;
  options: string[];
  answerIndex: number;
  verification: { status: 'unverified' | 'verified'; sources: string[] };
}

export interface AppState {
  version: 1;
  level: Level | null;
  levelSource: 'placement' | 'manual' | null;
  progress: Record<string, WordProgress>;
  attempts: Attempt[]; // keep the newest 500
  dayOffset: number;   // for "simulate tomorrow"
  isDemoData: boolean;
}

// ---- Session types ----

export interface SessionItem {
  wordId: string;
  exercise: ExerciseType;
  isRetry: boolean;
}

export interface MatchPair {
  wordId: string;
  de: string;
  en: string;
}

export interface DistractorOption {
  text: string;          // display text
  wordId: string | null; // null for "wrong article" distractors
  isCorrect: boolean;
}

// ---- Grading results ----

export type GradeResult =
  | { outcome: 'correct'; note?: 'capitalisation' }
  | { outcome: 'error'; errorType: ErrorType };

// ---- Feedback ----

export interface FeedbackData {
  correct: boolean;
  errorType: ErrorType | null;
  headline: string;
  body: string;
  tip: string | null;
}

// ---- State labels ----

export function stateLabel(box: WordProgress['box']): WordState {
  if (box === 0) return 'New';
  if (box === 1) return 'Learning';
  if (box <= 3) return 'Familiar';
  if (box === 4) return 'Strong';
  return 'Mastered';
}
