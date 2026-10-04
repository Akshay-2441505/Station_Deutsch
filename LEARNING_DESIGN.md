# LEARNING_DESIGN: Station Deutsch

This file is the source of truth for all learning rules. If `TECH.md` or `DESIGN.md` disagree with it, this file wins. All rules here must be implemented as pure functions in `src/lib` and covered by unit tests.

---

## 1. Word states and boxes

Every word has a `box` from 0 to 5.

| Box | State label | Meaning | Due again after |
|---|---|---|---|
| 0 | New | Never answered | n/a |
| 1 | Learning | Answered at least once, not yet secure | immediately |
| 2 | Familiar | Correct once after learning | 1 day |
| 3 | Familiar | Correct again | 3 days |
| 4 | Strong | Correct again | 7 days |
| 5 | Mastered | Correct again | 14 days |

Rules:
- The first checked answer moves a word from box 0 to box 1, whatever the result. A wrong first answer is still logged as an error.
- A word can be promoted at most once per calendar day (app clock). Extra correct answers the same day do not promote further. This stops repeats inside one session from inflating progress.
- Mastered words are never retired. They return every 14 days and can fall back if answered wrongly. This is how the product avoids a "finished" state.
- Self-rating in learn mode ("Got it", "Not yet") never changes the box. Only checked answers do.

## 2. Promotion and demotion

| Result | Box change | Logged error type |
|---|---|---|
| Correct, first try this session | +1, max 5 (subject to once-per-day cap) | none |
| Correct on retry in the same session | stays where it is | none (counted as retry success) |
| Right word, wrong article | **-1**, minimum box 1 | `article` |
| Spelling near-miss (see grading) | no change | `spelling` |
| Wrong word or wrong meaning | move to box 1 | `meaning` |
| Wrong plural (stretch exercise only) | no change | `plural` |

`nextDueAt = now() + interval(box)` using the table in section 1, set after every attempt that is not a retry.

## 3. Stubborn words

- Keep the last 5 results for each word (`recent`).
- A word is stubborn when at least 2 of the last 5 results are wrong.
- A stubborn word clears when it gets 3 correct answers in a row.
- Promotion cap: a stubborn word cannot be promoted above box 2 until it clears.
- Effects: next exercise for a stubborn word is forced to a recognition format (multiple choice German to English), the memory tip is shown in feedback if one exists, and the word appears at the top of the weak words list.
- The weak words list on Home and Progress must never show a "Mastered" state: show "missed N times" instead.

## 4. Exercise types

| Type | Id | Applies to | Direction | Checks |
|---|---|---|---|---|
| Multiple choice, meaning | `mcq_de_en` | all words | German word to English | recognition |
| Multiple choice, with article | `mcq_en_de` | nouns, verbs, phrases | English to German (nouns show article) | recognition, article |
| Match pairs | `match` | all words | 4 or 5 German to English pairs, tap to match | recognition |
| Article drill | `article` | nouns that have an article | noun shown, pick der, die or das | article |
| Fill in the blank | `fill` | words with a sentence | sentence with gap, pick or type the word | recall in context |
| Typed recall | `typed` | all words | English prompt, learner types the German | recall, spelling, article |
| Plural recall (stretch) | `plural` | nouns with a plural | type the plural | plural |
| Listen and pick (stretch) | `listen` | all words | audio plays, pick the English meaning | listening |

### Choosing the exercise by box

Pick the first applicable type from the list for the word's box. Skip a type if the word does not qualify. Rotate so the same type does not appear more than twice in a row.

| Box | Preferred types, in order |
|---|---|
| 0 and 1 | `match`, `mcq_de_en`, `mcq_en_de` |
| 2 | `mcq_en_de`, `article`, `fill` |
| 3 | `fill`, `article`, `typed` |
| 4 and 5 | `typed`, `fill`, `plural` (if stretch is on) |
| Stubborn (any box) | force `mcq_de_en` |

At A2, prefer `fill` with an A2 sentence whenever the word has one.

### Distractors

- Same topic and same part of speech as the target, never the target's translation or a near-duplicate.
- For `mcq_en_de` on nouns: four options. One correct (for example "der Kopf"), one is the same noun with a wrong article, two are other nouns from the topic with their correct articles. This tests the article without making the right answer obvious.
- Shuffle options. Do not place the correct answer in the same position more than twice in a row.

## 5. Grading

### Multiple choice, match, article, fill with options
Exact option match. Article errors in `mcq_en_de` are detected when the chosen option has the right noun and the wrong article.

### Typed recall
The learner picks an article (nouns only) with three buttons and types the word.

Normalise both sides before comparing: trim spaces, collapse repeated spaces, compare case-insensitively.

Decision order:
1. Noun matches and article matches: **correct**. If the learner did not capitalise a noun, still correct, but show the note "German nouns start with a capital letter: Kopf".
2. Noun matches, article wrong: `article`.
3. Noun differs only by a spelling near-miss: `spelling`. A near-miss is any of: edit distance of 1; the typed word matches after replacing ae, oe, ue, ss with ä, ö, ü, ß; the typed word matches after removing diacritics.
4. Anything else: `meaning`.

For verbs and phrases there is no article. Skip step 2 and compare the whole string.

Plural-only nouns (such as Kopfschmerzen) have no singular drill. Show them with the article "die" and exclude them from the `plural` exercise.

Typing aids: show buttons for ä, ö, ü and ß above the keyboard. Indian phone keyboards rarely have quick access to them.

## 6. Retry rule

- After a wrong answer, put the word back in the queue 2 to 4 items later in the same session.
- The retry uses a recognition format (`mcq_de_en` or `mcq_en_de`) so the learner can recover quickly.
- A correct retry does not promote the word. It is logged as a retry success, which is a key metric.
- A wrong retry is logged, and the word is not shown again in that session.

## 7. Session composition

A session targets 10 items, which matches the daily goal.

1. Retry items come first when their turn arrives.
2. Due words, ordered by: stubborn first, then lowest box, then most overdue.
3. If fewer than 10 words are due, fill with the weakest non-due words (lowest box, then oldest `lastSeenAt`). This is "Practise anyway" mode.
4. A word appears at most twice per session, not counting retries.
5. Never show the same word twice in a row. Never use the same exercise type more than twice in a row.
6. If the learner has no words beyond box 0, Practise is disabled and Home promotes "Learn new words".

### Learn batches
- 5 to 8 words from one topic and the chosen level.
- Learner flips through the batch, then immediately does a practice round on those words: one `match` and one `mcq_de_en` for each word.
- New words are drawn from the chosen level only. At A2 level, draw A2 entries first. When every word at the current level has been seen, Home suggests the next level or "Practise anyway". The product never shows an end screen.

## 8. Placement quick check

- 8 questions from `content/placement.json`: 5 tagged A1, then 3 tagged A2, ordered easy to hard.
- Mix of meaning, article and short-sentence questions. These items are separate from the learning bank so the check does not teach the answers.
- Scoring: if the learner gets at least 4 of 5 A1 questions right and at least 2 of 3 A2 questions right, suggest A2. Otherwise suggest A1.
- Result copy: "Your starting point: A1" with a plain explanation that this is a short check, not a grade, and a "Change level" control.
- The check can be skipped.

## 9. Feedback copy

Voice: plain, short, no apologies, no praise inflation. Always show the right answer. Sentence case. Add the entry's `tip` after the main line when it exists.

| Case | Line |
|---|---|
| Correct | "Correct." Optional second line for nouns at box 3 and above: "Plural: die Köpfe." |
| Capitalisation note | "Correct. German nouns start with a capital letter: Kopf." |
| `meaning` | "{article} {de} means “{en}”. You chose “{chosen}”." |
| `article` | "It's {article} {de}. Learn the article together with the noun." |
| `spelling` | "Almost. It's spelled {de}." Highlight the differing letters. |
| `plural` | "The plural of {article} {de} is die {plural}." |
| `fill` wrong | "The missing word is {answer}: {sentence_de} ({sentence_en})" |

Do not invent grammar rules for gender. Only mention a gender pattern if it is written in the entry's `tip`.

## 10. Content rules

- A1 words and sentences: everyday basics. Example sentences are short present-tense statements of about 6 words or fewer. Example from the brief: "Mein Kopf tut weh."
- A2 sentences: slightly more context, up to about 9 words. Example from the brief: "Der Patient hat starke Kopfschmerzen."
- No complicated medical German. If a word would not appear in an A1 or A2 course book, leave it out.
- Every entry needs the article for nouns, plural where it exists, English meaning, topic, level and one example sentence with translation.
- Every entry carries `verification` metadata (status and sources). Nothing is marked verified without a named source.

## 11. Events and metrics

Store one attempt per answer: `wordId`, `exercise`, `correct`, `errorType`, `isRetry`, `at`.

Derived values used on the Progress screen and in testing:
- Words per state (from `box`).
- Error counts by type.
- Weak words: stubborn words, then lowest box.
- Retry success rate: correct retries divided by all retries.
- Session accuracy: correct first-try answers divided by all first-try answers in a session.

## 12. Unit tests required

Write tests for these cases before wiring the UI:
- First answer moves box 0 to 1 for both correct and wrong.
- Once-per-day promotion cap.
- Wrong word resets to box 1. Article and spelling errors do not change the box.
- Stubborn set and clear conditions.
- Grading: correct, wrong article, ae/oe/ue/ss near-miss, one-letter typo, missing capital, plural-only noun.
- Session composer: no consecutive duplicates, per-session cap, practise-anyway fill, retry spacing.
- Placement scoring at the 3 threshold boundaries.
- Simulated clock: advancing one day makes box 2 words due.
