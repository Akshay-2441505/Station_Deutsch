// ============================================================
// feedback.ts — feedback string builder
// Rules per LEARNING_DESIGN.md §9.
// ============================================================

import type { ErrorType, FeedbackData, Word } from './types';

/**
 * Build the FeedbackData for a given result.
 */
export function buildFeedback(params: {
  correct: boolean;
  errorType: ErrorType | null;
  word: Word;
  chosenText?: string;
  capitalisationNote?: boolean;
  showPlural?: boolean;
}): FeedbackData {
  const { correct, errorType, word, chosenText, capitalisationNote, showPlural } = params;
  const articleStr = word.article ? `${word.article} ` : '';
  const fullDe = `${articleStr}${word.de}`;

  if (correct) {
    let headline = 'Correct.';
    let body = '';

    if (capitalisationNote) {
      headline = 'Correct.';
      body = `German nouns start with a capital letter: ${word.de}.`;
    } else if (showPlural && word.plural && !word.pluralOnly) {
      body = `Plural: die ${word.plural}.`;
    }

    return {
      correct: true,
      errorType: null,
      headline,
      body,
      tip: word.tip,
    };
  }

  // Wrong answer
  let headline = 'Not quite.';
  let body = '';

  switch (errorType) {
    case 'meaning': {
      const chosen = chosenText ? `"${chosenText}"` : 'something else';
      body = `${fullDe} means "${word.en}". You chose ${chosen}.`;
      break;
    }
    case 'article':
      body = `It's ${fullDe}. Learn the article together with the noun.`;
      break;
    case 'spelling':
      body = `Almost. It's spelled ${word.de}.`;
      break;
    case 'plural':
      body = `The plural of ${fullDe} is die ${word.plural ?? word.de}.`;
      break;
    default:
      body = `The answer is ${fullDe}.`;
  }

  return {
    correct: false,
    errorType,
    headline,
    body,
    tip: word.tip,
  };
}

export function buildFillFeedback(params: {
  answer: string;
  sentenceDe: string;
  sentenceEn: string;
}): Pick<FeedbackData, 'headline' | 'body'> {
  return {
    headline: 'Not quite.',
    body: `The missing word is ${params.answer}: ${params.sentenceDe} (${params.sentenceEn})`,
  };
}
