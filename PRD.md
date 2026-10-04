# PRD: Station Deutsch

Medical German practice for Indian nurses at A1 and A2.
Status: V2 Completed. Format: responsive website, mobile-first with desktop phone frame.

Related docs: `LEARNING_DESIGN.md` (learning rules, source of truth), `DESIGN.md` (visual spec), `TECH.md` (stack, data model, architecture), `V2_CHANGES.md` (change spec).

---

## 1. Problem

Help an Indian nurse at A1 to A2 German learn, remember and repeatedly practise medical vocabulary in a simple, engaging way.

The experience must support this loop and must never feel "finished" after one quiz:

Learn, practise, make mistakes, get feedback, revisit, improve, keep practising.

**Framing:** Skillcase teaches through live classes with trainers, so vocabulary fades between classes. This product is a between-class practice companion.

## 2. Users and context

- Primary user: an Indian nurse learning A1 or A2 German, preparing to work in Germany.
- Device: a phone, most likely Android (responsive mobile-first layout; 390x820 desktop mockup for larger screens). Sessions of 5 to 10 minutes between shifts or classes.
- Interface language: English. German appears only as target content.
- The learner is not expected to understand complicated medical German. Vocabulary stays at beginner and elementary level.

## 3. Goals and non-goals

### Goals

1. A learner can go from first open to a completed practice session in under 3 minutes.
2. Every wrong answer produces a clear, specific explanation and an immediate retry.
3. Mistakes are saved and visibly shape what the learner sees next.
4. The learner can always keep practising. There is no dead end.
5. German content is accurate. Every entry is verified before it ships.

### Non-goals (MVP & V2)

- Cloud accounts, login, server-side leaderboards (zero sign-up friction; offline JSON import/export provided).
- Speech recognition or pronunciation scoring.
- Full grammar curriculum.
- Live AI grading. Grading is rule-based and deterministic.

## 4. Product principles

1. **Retrieval over re-reading.** Learners answer from memory, not only look at cards.
2. **Every mistake teaches.** Name the error type, show the right answer, retry soon.
3. **Nothing is ever finished.** Mastered words return at longer gaps. "Keep practising" is always available.
4. **Short and thumb-friendly.** One primary action per screen.
5. **Trustworthy content.** A small verified word bank beats a large doubtful one.
6. **Colour marks progress and state.** White is reserved for active work screens.

## 5. Core loop

```
Quick check (or level choose) -> Learn batch (by topic) -> Practise immediately
      ^                                                         |
      |                                                  wrong answer
      |                                                         v
 Keep practising <- Revisit due and weak words <- Feedback + retry with chip
```

## 6. Scope

### V2 Features (Delivered)

- Placement quick check (8 items) with manual override and instant sample data on Welcome.
- Topic map cards on Home (Body, Symptoms, Care, Ward, Patient) with learned counts.
- Learn batches (5–8 words) with audio and clinical ward labels.
- Six practice exercise types (MCQ de-en, MCQ en-de, typed recall, fill in blank, match pairs, article drill) with ErrorBoundary protection.
- Fixed session denominator with retry chip (never overflows e.g. 1/11).
- Demotion rules: article errors demote by -1; stubborn words capped at Box 2 until cleared.
- Spaced revisit engine with 5 Leitner boxes and once-per-day promotion cap.
- Endless "Keep practising" session.
- My Mistakes screen (`#/mistakes`) with given vs expected answers, fixed badges, and dedicated practice drills.
- WhatsApp sharing of weak words (`https://wa.me/?text=...`) without hardcoded phone numbers.
- Offline progress backup & restore via JSON export/import.
- Desktop presentation frame (390x820 phone inside black desktop container with learning loop sidebar).
- Safe fallbacks for blocked storage and unavailable speech synthesis.

## 7. User stories and acceptance criteria

**US-1 Placement.** As a new learner I take a short check so the app picks a sensible start.
- 8 questions: 5 at A1 difficulty, then 3 at A2, ordered easy to hard.
- Result screen says "Your starting point: A1" or "A2" and explains it is a starting point.
- Learner can switch level on the result screen and later in Settings.
- Welcome offers "Try with sample progress" for instant evaluation.

**US-2 Learn.** As a learner I see new words in small batches.
- A batch has 5 to 8 words from one topic and the chosen level.
- Front shows German word with article chip, ward topic label, and audio button. Back shows English meaning and example sentence.
- Self-rating in learn mode does not move boxes.

**US-3 Practise.** As a learner I practise in varied formats.
- Exercise types: multiple choice (German to English), multiple choice (English to German with article), typed recall, fill in the blank, match pairs, article drill.
- Exercise type depends on the word's box. Match pairs track slips per word and advance with Continue sheet.

**US-4 Feedback.** As a learner I see why I was wrong.
- Bottom sheet shows "Correct" or "Not quite", the right answer, and a one-line reason by error type.
- The word is queued to reappear 2 to 4 items later with a "Retry" label.

**US-5 Mistake log & Review.** As a learner my mistakes are saved and reviewable.
- Each attempt stores word, given, expected, result, and error type.
- Dedicated `#/mistakes` screen lists errors with "Fixed" badges and a "Practise these" session builder.

**US-6 Revisit.** As a learner I see words again at the right time.
- Boxes 1 to 5 with Leitner intervals.
- Correct answers promote (+1/day). Article errors demote by -1. Stubborn cap at Box 2.

**US-7 Keep practising.** As a learner I can always continue.
- Summary screen shows accuracy trend vs previous session, next review due time, and primary "Keep practising" button.

**US-8 Progress & Sharing.** As a learner I see and share how I am doing.
- Progress screen shows Leitner box distribution and error breakdowns.
- Weak words list displays missed counts (never false "Mastered").
- Share weak words via WhatsApp button.

**US-9 Demo tools & Data Portability.**
- Settings provides: simulate tomorrow, load 5-day demo history, reset all data, download JSON progress, and restore from file.

---

## 8. Content scope

- 5 topics: Body (`body`), Symptoms and pain (`symptoms`), Care actions (`care`), Ward and equipment (`ward`), Patient details (`patient`).
- 60 active words in `words.json`, 10 complex words parked in `words.parked.json`, 8 placement questions in `placement.json`.
- All entries marked `unverified` pending human review via `content/verification-worksheet.md`.

---

## 9. Success metrics for testing

To be validated with 3 to 5 real nurses or German learners and documented in `README.md` test log.

---

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Unverified German content | Human verification worksheet (`content/verification-worksheet.md`) and strict validation script |
| Speech synthesis missing on some devices | Guarded safely; button hidden gracefully if German voice is absent |
| Storage blocked or in private browsing | Graceful fallback to memory storage without crashing; export/import for persistence |
| Accessibility barriers | WCAG AAA contrast for main tokens, :focus-visible rings, 200% zoom responsiveness |
