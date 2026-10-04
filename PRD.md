# PRD: Station Deutsch (working title)

Medical German practice for Indian nurses at A1 and A2.
Status: Draft v1. Format: responsive website, mobile-first. Build window: 48 hours.

Related docs: `LEARNING_DESIGN.md` (learning rules, source of truth), `DESIGN.md` (visual spec), `TECH.md` (stack, data model, milestones).

---

## 1. Problem

Help an Indian nurse at A1 to A2 German learn, remember and repeatedly practise medical vocabulary in a simple, engaging way.

The experience must support this loop and must never feel "finished" after one quiz:

Learn, practise, make mistakes, get feedback, revisit, improve, keep practising.

**Assumption to verify:** Skillcase teaches through live classes with trainers, so vocabulary fades between classes. This product is a between-class practice companion. If the real product differs, only the framing changes, not the build.

## 2. Users and context

- Primary user: an Indian nurse learning A1 or A2 German, preparing to work in Germany.
- Device: a phone, most likely Android. Sessions of 5 to 10 minutes between shifts or classes.
- Interface language: English. German appears only as target content.
- The learner is not expected to understand complicated medical German. Vocabulary stays at beginner and elementary level.

## 3. Goals and non-goals

### Goals

1. A learner can go from first open to a completed practice session in under 3 minutes.
2. Every wrong answer produces a clear, specific explanation and an immediate retry.
3. Mistakes are saved and visibly shape what the learner sees next.
4. The learner can always keep practising. There is no dead end.
5. German content is accurate. Every entry is verified before it ships.

### Non-goals (MVP)

- Accounts, login, cloud sync, leaderboards.
- Speech recognition or pronunciation scoring.
- Grammar lessons or a full A1/A2 curriculum.
- Live AI grading. Grading is rule-based.

## 4. Product principles

1. **Retrieval over re-reading.** Learners answer from memory, not only look at cards.
2. **Every mistake teaches.** Name the error type, show the right answer, retry soon.
3. **Nothing is ever finished.** Mastered words return at longer gaps. "Keep practising" is always available.
4. **Short and thumb-friendly.** One primary action per screen.
5. **Trustworthy content.** A small verified word bank beats a large doubtful one.

## 5. Core loop

```
Quick check (once) -> Learn a batch (5-8 words) -> Practise immediately
      ^                                                  |
      |                                           wrong answer
      |                                                  v
 Keep practising <- Revisit due and weak words <- Feedback + retry
```

## 6. Scope

### MVP (must ship)

- Placement quick check with manual override (US-1).
- Learn batches of flashcards (US-2).
- Five practice exercise types (US-3).
- Error classification, feedback and immediate retry (US-4, US-5).
- Spaced revisit engine with five boxes (US-6).
- Endless "Keep practising" session (US-7).
- Progress screen with weak words and error breakdown (US-8).
- Demo tools: simulate tomorrow, load demo history, reset data (US-9).
- Persisted progress in the browser. Deployed link.

### Stretch (only if time remains)

- Listen-and-pick exercise using browser speech synthesis.
- Installable web app (PWA).
- One optional AI feature behind a flag (see Open decisions).

## 7. User stories and acceptance criteria

**US-1 Placement.** As a new learner I take a short check so the app picks a sensible start.
- 8 questions: 5 at A1 difficulty, then 3 at A2, ordered easy to hard.
- Result screen says "Your starting point: A1" or "A2" and explains it is a starting point.
- Learner can switch level on the result screen and later in Settings.
- Learner can skip the check and choose a level directly.

**US-2 Learn.** As a learner I see new words in small batches.
- A batch has 5 to 8 words from one topic and the chosen level.
- The front shows the German word with article chip and an audio button. The back shows the English meaning, one example sentence with translation, and a tip if one exists.
- Self-rating buttons exist in learn mode only and do not move a word between boxes.
- After a batch, the learner goes straight into a short practice round on those words.

**US-3 Practise.** As a learner I practise in varied formats.
- Exercise types: multiple choice (German to English), multiple choice (English to German with article), typed recall, fill in the blank, match pairs, article drill.
- Exercise type depends on the word's box (see `LEARNING_DESIGN.md`).
- Typed recall provides ä ö ü ß buttons above the keyboard.

**US-4 Feedback.** As a learner I see why I was wrong.
- After each answer a bottom sheet shows "Correct" or "Not quite", the right answer, and a one-line reason by error type.
- The word is queued to reappear 2 to 4 items later in the same session.

**US-5 Mistake log.** As a learner my mistakes are saved.
- Each attempt stores word, exercise type, result and error type.
- A word wrong twice in its last five attempts is flagged as stubborn and gets a memory tip and an easier format next time.

**US-6 Revisit.** As a learner I see words again at the right time.
- Boxes 1 to 5 with intervals defined in `LEARNING_DESIGN.md`.
- A correct answer promotes a word. Errors follow the rules table.
- The app never shows a "you are done forever" state.

**US-7 Keep practising.** As a learner I can always continue.
- If nothing is due, Home shows "You're caught up" and a "Practise anyway" button that serves weakest and oldest words.
- The session summary always offers "Keep practising" as the primary action.

**US-8 Progress.** As a learner I see how I am doing.
- Counts of words by state: New, Learning, Familiar, Strong, Mastered.
- Weak words list (top 5 stubborn words) with a "Practise these" button.
- Error breakdown by type.
- Today's goal: 10 answers.

**US-9 Demo tools.** As an evaluator I can see the product working without waiting days.
- Settings has "Demo tools": simulate tomorrow (advances the app clock by one day), load demo history (clearly labelled sample progress), reset all data.

## 8. Content scope

- 5 topics: Body (`body`), Symptoms and pain (`symptoms`), Care actions (`care`), Ward and equipment (`ward`), Patient details (`patient`).
- Target about 40 A1 words (around 8 per topic) and about 25 A2 entries (around 5 per topic). A2 entries mainly add contextual sentences, not only new words.
- Content is generated with AI at build time, checked by a second critic pass, then verified by a human against an external source (Duden, Goethe-Institut A1 and A2 word lists). See `TECH.md` for the schema and the validation script.
- Nothing ships as "verified" without a source noted in the entry.

## 9. Success metrics for testing

Test with 3 to 5 people, ideally including a nurse or a German learner.

| Metric | Target |
|---|---|
| Finishes first session without help | at least 4 of 5 testers |
| Time from open to first answer | under 60 seconds |
| Retry correct after feedback | above 60% |
| Accuracy on second session vs first | higher |
| "Would you open this tomorrow?" | majority yes, with reasons recorded |

Record each test in a short log: what broke, what confused people, what you changed.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Wrong German (article, plural, level) | Critic pass plus external verification; schema field `verification`; validation script |
| Speech synthesis missing or poor on some phones | Audio is optional. Hide the button if no German voice. Test on a real Android phone |
| Progress lost when browser storage clears | State this limitation in About. Keep a try/catch around storage |
| Scope creep in 48 hours | Build in milestones. Stretch items only after M4 |
| Agent quota runs out in Antigravity | Write the docs first. Build in large milestones. Reserve quota for testing and fixes |

## 11. Open decisions

1. Optional AI feature (post-MVP): for example "explain this mistake" or a short A2 ward dialogue. Needs a server route and a graceful fallback. Decide after M4.
2. Final product name and visual identity.
3. Whether the mistake log should become a mentor or trainer view (idea only, not in MVP).
