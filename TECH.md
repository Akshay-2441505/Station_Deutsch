# TECH: Station Deutsch

Stack, structure, data model, milestones and rules for the coding agent. Read `PRD.md`, `LEARNING_DESIGN.md` and `DESIGN.md` first. Learning rules in `LEARNING_DESIGN.md` win over anything here.

---

## 0. Rules for the agent

1. Read all four docs before writing code. Reply with an implementation plan and wait for approval before starting a milestone.
2. Never invent German content. Use only entries in `content/words.json` and `content/placement.json`. If content is missing, stop and say so.
3. Put all learning logic (grading, scheduling, session composition, placement, feedback text) in `src/lib` as pure functions with no UI or storage imports. Write unit tests for them first.
4. Never call `Date.now()` or `new Date()` outside `src/lib/clock.ts`. Everything else uses `now()` so "simulate tomorrow" works.
5. Wrap every localStorage read and write in try/catch. The app must still run when storage is blocked.
6. Do not add dependencies beyond section 1 without saying why.
7. Do not add colours, fonts or components outside `DESIGN.md`.
8. Work in the milestones in section 8. Commit after each milestone with a clear message. Stop at the end of each milestone and summarise what works and what does not.
9. Keep quota in mind: build in large steps, avoid repeated tiny edits, and leave time for testing and fixes.

## 1. Stack

Use the current stable version of each at project creation and follow its official docs for setup.

- Vite, React and TypeScript.
- Tailwind CSS (via its Vite plugin), configured with the tokens in `DESIGN.md`.
- React Router using `HashRouter`. Hash URLs need no host-specific fallback configuration, so deployment stays simple on any static host.
- Zustand with its `persist` middleware for state.
- `zod` for content validation.
- `lucide-react` for icons.
- `@fontsource-variable/fraunces` and `@fontsource-variable/figtree`.
- Vitest for unit tests. Playwright for one end-to-end smoke test.
- No backend. No analytics. No accounts.

Optional AI is out of the MVP (see PRD open decisions). If added later it must sit behind a flag and fail gracefully.

## 2. Project structure

```
/docs                  PRD.md, LEARNING_DESIGN.md, DESIGN.md, TECH.md
/content
  words.json           learning bank
  placement.json       quick-check items (separate from the bank)
/scripts
  validate-content.ts  schema and quality checks
/src
  /lib                 pure logic, fully unit tested
    types.ts
    clock.ts
    scheduler.ts       boxes, intervals, promotion, stubborn
    grader.ts          grading and error classification
    session.ts         session composer, exercise chooser, distractors
    placement.ts       quick-check scoring
    feedback.ts        feedback strings
    storage.ts         safe localStorage wrapper
    demo.ts            demo history generator
  /store
    useAppStore.ts
  /components
  /screens
  /styles
```

## 3. Data model

```ts
type Level = 'A1' | 'A2';
type Topic = 'body' | 'symptoms' | 'care' | 'ward' | 'patient';
type Article = 'der' | 'die' | 'das';
type Pos = 'noun' | 'verb' | 'adjective' | 'phrase';
type ErrorType = 'meaning' | 'article' | 'spelling' | 'plural';
type ExerciseType =
  | 'mcq_de_en' | 'mcq_en_de' | 'match' | 'article'
  | 'fill' | 'typed' | 'plural' | 'listen';

interface Sentence {
  level: Level;
  de: string;
  en: string;
  blank: string;          // the token in `de` that is hidden in fill exercises
}

interface Word {
  id: string;             // slug, unique
  de: string;             // headword without article, e.g. "Kopf"
  article: Article | null;// null for verbs, adjectives, phrases
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

interface WordProgress {
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

interface Attempt {
  id: string;
  wordId: string;
  exercise: ExerciseType;
  correct: boolean;
  errorType: ErrorType | null;
  isRetry: boolean;
  at: number;
}

interface PlacementItem {
  id: string;
  level: Level;
  kind: 'meaning' | 'article' | 'sentence';
  prompt: string;
  options: string[];
  answerIndex: number;
  verification: { status: 'unverified' | 'verified'; sources: string[] };
}

interface AppState {
  version: 1;
  level: Level | null;
  levelSource: 'placement' | 'manual' | null;
  progress: Record<string, WordProgress>;
  attempts: Attempt[];          // keep the newest 500
  dayOffset: number;            // for "simulate tomorrow"
  isDemoData: boolean;
}
```

Persist under the key `station-deutsch:v1`. If the stored `version` does not match, ignore the stored data and start fresh instead of crashing.

## 4. Content files

### `content/words.json`

An array of `Word`. Seed examples below come from the assignment brief. They are marked unverified on purpose: a human must check article, plural and level against Duden and the Goethe-Institut A1 and A2 word lists before they are marked verified.

```json
[
  {
    "id": "kopf",
    "de": "Kopf",
    "article": "der",
    "pos": "noun",
    "plural": "Köpfe",
    "pluralOnly": false,
    "en": "head",
    "topic": "body",
    "level": "A1",
    "sentences": [
      { "level": "A1", "de": "Mein Kopf tut weh.", "en": "My head hurts.", "blank": "Kopf" }
    ],
    "tip": null,
    "verification": { "status": "unverified", "sources": [] }
  },
  {
    "id": "fieber",
    "de": "Fieber",
    "article": "das",
    "pos": "noun",
    "plural": null,
    "pluralOnly": false,
    "en": "fever",
    "topic": "symptoms",
    "level": "A1",
    "sentences": [],
    "tip": null,
    "verification": { "status": "unverified", "sources": [] }
  },
  {
    "id": "kopfschmerzen",
    "de": "Kopfschmerzen",
    "article": "die",
    "pos": "noun",
    "plural": null,
    "pluralOnly": true,
    "en": "headache",
    "topic": "symptoms",
    "level": "A2",
    "sentences": [
      {
        "level": "A2",
        "de": "Der Patient hat starke Kopfschmerzen.",
        "en": "The patient has a severe headache.",
        "blank": "Kopfschmerzen"
      }
    ],
    "tip": null,
    "verification": { "status": "unverified", "sources": [] }
  }
]
```

Note that the second example has an empty `sentences` array, which breaks the "at least one sentence" rule. The validator must flag it, and the content pipeline must add a verified sentence. Keep it in the seed to prove the validator works.

### `content/placement.json`

An array of `PlacementItem`: 5 items tagged A1 and 3 tagged A2. Separate from `words.json`.

### `content/words.parked.json`

Entries moved out of the active learning bank (e.g. advanced or specialized words pending owner review). Not loaded by the application at runtime.

### Human Verification Worksheet

Generated via `npm run content:worksheet` into `content/verification-worksheet.md`. Contains links to Wiktionary and Duden for manual human verification before release.

### Content pipeline (build time, outside the app)

1. Draft entries with an LLM into the schema above, one topic at a time.
2. Run a second LLM pass as a critic to flag wrong articles, plurals, level mismatches and over-complex sentences.
3. A human verifies every entry against Duden and the Goethe-Institut A1 and A2 word lists and records the source in `verification.sources`.
4. Keep a short log of how many entries each step changed. This shows quality was measured.

### `scripts/validate-content.ts`

Run with `npm run validate:content`. It must check:
- Schema validity for every entry using zod.
- Unique `id` values.
- Nouns have an `article`. Verbs, adjectives and phrases do not.
- `pluralOnly` nouns have `plural: null`.
- At least one sentence per entry, and each sentence's `blank` appears in its `de` text.
- Level coverage: print counts per topic and level.
- Distractor feasibility: each topic and part of speech has at least 4 entries.
- `verified` entries list at least one source.
- Print the number of unverified entries.

Exit non-zero on any schema failure. With `--strict`, also exit non-zero when any entry is unverified. The production build runs the non-strict check. Run the strict check before final submission.

## 5. State, clock and persistence

- `lib/clock.ts` exports `now()`, `setDayOffset(n)` and `dayKey(ms)`. `now()` returns the real time plus `dayOffset * 86 400 000` ms.
- `useAppStore` holds `AppState` and actions: `setLevel`, `recordAttempt`, `startSession`, `simulateTomorrow`, `loadDemoHistory`, `resetAll`.
- `loadDemoHistory` calls `lib/demo.ts`, which generates deterministic sample progress and attempts, sets `isDemoData: true`, and the UI labels it clearly as sample data.
- If localStorage throws, keep state in memory and show the banner from `DESIGN.md`.

## 6. Audio

Use the browser's `speechSynthesis` with `lang = 'de-DE'`.
- On load, check `speechSynthesis.getVoices()` for a German voice. Voices may load late, so listen for `voiceschanged`.
- If none is found, hide audio buttons and show the notice once.
- Test on a real Android phone. Do not rely on desktop results.

## 7. Testing

- Unit tests (Vitest) for everything in `src/lib`, covering every case listed in section 12 of `LEARNING_DESIGN.md`.
- One Playwright smoke test of the main journey: skip check, choose A1, learn a batch, answer a wrong item, see feedback, retry, finish, see the summary, open Progress, simulate tomorrow, see due words.
- Manual checks: real Android phone, Chrome and Safari; storage blocked; keyboard-only navigation; 200% zoom.

## 8. Milestones

Work one at a time. Stop and report after each.

**M1: Foundation and logic.**
Scaffold the project, tokens and fonts, content schema, validation script, seed content, and all of `src/lib` with tests passing. No UI beyond a blank shell.
Done when: `npm run test` and `npm run validate:content` run, and the validator flags the empty-sentence seed entry.

**M2: Learn and practise.**
Learn batches with flip cards, the six MVP exercise types, feedback sheet, retry, session summary, persisted progress.
Done when: a full session works on a phone-size viewport and a wrong answer is retried 2 to 4 items later.

**M3: Placement, Home, Progress, Settings.**
Quick check and result, Home with goal and caught-up state, Progress, Settings with Demo tools.
Done when: "Simulate tomorrow" makes box 2 words due, and "Load demo history" fills Progress.

**M4: Polish, accessibility and deploy.**
Contrast verification, focus rings, reduced motion, 200% zoom, storage-blocked banner, About text, README. Deploy a public link.
Done when: the accessibility checklist in `DESIGN.md` passes and the deployed link works on a real phone.

**M5: Stretch (only if time remains).**
`listen` exercise, `plural` exercise, installable web app, one optional AI feature behind a flag.

## 9. Deployment

Build output is static in `dist`.

**Vercel (primary):** import the Git repo, framework preset Vite, build command `npm run build`, output directory `dist`.

**Cloudflare (backup):** use Workers with static assets and set the assets directory to `./dist`, using `wrangler`. Check the current Cloudflare docs for exact commands, since the platform has been changing. Because routing uses `HashRouter`, no single-page-app fallback is needed.

Commands:
```
npm run dev
npm run build
npm run test
npm run validate:content
npm run validate:content -- --strict
```

## 10. Definition of done

- All unit tests pass. The Playwright smoke test passes.
- `validate:content --strict` passes: every shipped entry is verified with a named source.
- The deployed link works on a real Android phone and a desktop browser.
- Every item in the `DESIGN.md` accessibility checklist is checked.
- The app works with browser storage blocked, and with speech synthesis unavailable.
- README covers: what the product is, the learning loop, how to run it, how content was generated and verified, known limitations (progress stored per browser only), and what you would build next.
- A short test log from 3 to 5 testers is in the repo.
