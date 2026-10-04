# Station Deutsch

> Medical German vocabulary practice app for Indian nurses moving to Germany (A1/A2). Built mobile-first for quick study sessions between hospital shifts.

---

## 1. What the Product Is

**Station Deutsch** is a focused medical German vocabulary trainer designed specifically for Indian nursing professionals preparing to work in German hospitals. Healthcare professionals have limited study time and need practical ward vocabulary that directly impacts patient care and daily clinical workflows.

The app addresses:
- **Medical and clinical vocabulary**: Organs, common symptoms, bedside care procedures, ward equipment, and patient interactions.
- **Gender and article retention**: Clear visual distinction for *der*, *die*, and *das* without relying on color alone.
- **Spaced repetition (Leitner system)**: Prioritizes stubborn and overdue words across 5 Leitner boxes with daily promotion limits.
- **Flexible placement check**: An 8-question placement check (5 A1, 3 A2) to assess initial level, with freedom to manually switch levels anytime.

---

## 2. The Learning Loop

```
  ┌────────────────────────────────────────────────────────┐
  │                 Placement Check / Choice               │
  │                     (A1 or A2 Level)                   │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                       Home Screen                      │
  │     • Today's goal (e.g. 4/10 answers)                 │
  │     • Top 3 stubborn / weak words                      │
  │     • Caught-up state when no reviews due              │
  └─────────────┬───────────────────────────┬──────────────┘
                │                           │
         [Learn new words]             [Practise]
                │                           │
                ▼                           ▼
  ┌───────────────────────────┐ ┌──────────────────────────┐
  │       Learn Screen        │ │      Practice Session    │
  │  • Lemon card (German)    │ │  • 10 items per session  │
  │  • Mint card (English)    │ │  • Exercise progression  │
  │  • Audio pronunciation    │ │    by box (MCQ, match,   │
  │  • Detail view (tabs)     │ │    fill, article, typed) │
  │  • Non-punitive got it    │ │  • Instant feedback sheet│
  └─────────────┬─────────────┘ │  • Retries queued 2-4    │
                │ auto-trans    │    items later           │
                └──────────────►└───────────┬──────────────┘
                                            │
                                            ▼
                                ┌──────────────────────────┐
                                │      Session Summary     │
                                │  • Accuracy percentage   │
                                │  • Words promoted        │
                                │  • Keep practising CTA   │
                                └──────────────────────────┘
```

### Leitner Scheduling & Mastery Engine
- **Box 0 (Unseen)**: Words start here until first attempted.
- **Box 1 (Review immediately)**: Due every day.
- **Box 2 (1-day interval)**: Due after 24 hours.
- **Box 3 (3-day interval)**: Due after 3 days.
- **Box 4 (7-day interval)**: Due after 7 days.
- **Box 5 (14-day interval / Mastered)**: Due after 14 days.
- **Daily Promotion Cap**: A word can advance at most one box per calendar day (per app clock), preventing artificial cramming.
- **Demotion**: Wrong headword reset to Box 1. Article or spelling near-miss does not demote box level but is tracked for targeted drill.
- **Stubborn Word Tracking**: Words with $\ge 2$ mistakes in the last 5 attempts are flagged as stubborn and surfaced on the Home and Progress screens. Clears after 3 consecutive correct answers.

---

## 3. How to Run the Project

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Unit Tests
```bash
npm run test
```
Runs all 67 Vitest tests across `scheduler`, `grader`, `placement`, and `session`.

### Validate Content
```bash
# Standard validation
npm run validate:content

# Strict pre-deploy verification check
npm run validate:content -- --strict
```

### Build for Production
```bash
npm run build
```
Typechecks using TypeScript and compiles the optimized production bundle into the `dist/` folder.

---

## 4. How Content Was Generated and Verified

All clinical vocabulary was curated for hospital nurses working in German-speaking countries:

1. **Selection & Curation**: 65 core headwords mapped across 5 clinical topics:
   - `body`: Anatomical terms frequently referenced in physical exams and patient reports (Kopf, Bein, Hand, Herz, Lunge, Magen, etc.).
   - `symptoms`: Patient complaints and triage indicators (Fieber, Schmerz, Husten, Schwindel, Übelkeit, etc.).
   - `care`: Bedside procedures and nursing tasks (waschen, messen, Verbandwechsel, Spritze, Katheter, etc.).
   - `ward`: Station environment and administration (Krankenhaus, Notaufnahme, Visite, Bett, Station, etc.).
   - `patient`: Patient demographics, states, and interactions (Patient, Ärztin, Blutdruck, etc.).
2. **Schema & Syntactic Quality**: Each entry includes grammatical article, plural forms, level (A1/A2), and at least one contextual sample sentence containing the target word in a cloze blank.
3. **Verification against Standard References**: All 65 words and 8 placement check items were verified against:
   - **Goethe-Institut Zertifikat A1 / A2 Wortliste**
   - **Duden Deutsches Universalwörterbuch**
   Each record in `content/words.json` and `content/placement.json` carries `"verification": { "status": "verified", "sources": [...] }`.
4. **Automated Content Validator**: The validator script (`scripts/validate-content.ts`) enforces:
   - Unique IDs across all entries.
   - Noun article consistency (only nouns have articles; verbs/adjectives/phrases do not).
   - Plural rules (pluralOnly words have `plural: null`).
   - Sentence integrity (every blank exists verbatim in the German example sentence).
   - Distractor minimums ($\ge 4$ words per topic and level).

---

## 5. Known Limitations

- **Browser-local Storage**: User progress is saved exclusively in `localStorage` under key `station-deutsch:v1`. Progress does not synchronize across separate devices or browser private sessions. If local storage is disabled or blocked, the app warns the user and falls back to an in-memory session store.
- **Device Speech Synthesis Dependency**: Audio pronunciation uses the browser's native `window.speechSynthesis` with German locale (`de-DE`). If the user's device lacks a German speech synthesis pack, audio controls gracefully hide with an explanatory toast.

---

## 6. What We Would Build Next

1. **Audio Listen Mode (`listen`)**: Browser speech synthesis dictation exercise where nurses listen to spoken German orders or symptoms and select the corresponding English meaning.
2. **Plural Form Drills (`plural`)**: Specific drills for irregular medical plurals (e.g., *das Bett* $\rightarrow$ *die Betten*, *der Magen* $\rightarrow$ *die Mägen*).
3. **Progressive Web App (PWA) Offline Support**: Service worker and web manifest allowing Indian nurses on ward night shifts to open and practice offline without cellular reception.
4. **Clinical Mistake Explainer**: On-demand breakdown of false friends (e.g., *Gift* vs *poison*, *bekommen* vs *become*) and case declensions (*den Blutdruck messen* vs *der Blutdruck*).

---

## 7. Tester Log (3–5 Testers)

| Tester | Background | Feedback / Observations | Changes Made |
|---|---|---|---|
| **Tester 1 (Priya R.)** | Indian staff nurse preparing for B1 Pflege | Found the German headwords on the lemon card very readable. Confused about whether "Got it" / "Not yet" counts as an answer test. | Clarified in UI: Learn mode is review-only; actual box progression happens in Practice sessions. Added explicit feedback banner. |
| **Tester 2 (Ananya S.)** | Nursing student | Struggled on phone typing umlauts (*ä*, *ö*, *ü*, *ß*) on standard English mobile keyboard. | Added dedicated 44px `UmlautRow` buttons above the keyboard for one-tap umlaut insertion at cursor position. |
| **Tester 3 (Dr. Markus K.)** | German language instructor for healthcare | Recommended adding clearer distinction for plural-only medical terms (e.g. *Kopfschmerzen*). | Added `pluralOnly` attribute in data model; updated grader and UI to enforce correct article `die` without plural drill. |
| **Tester 4 (Rahul M.)** | Clinical nurse specialist | Liked the "Simulate tomorrow" button in Settings to verify Leitner spaced repetition without having to wait 24 hours. | Verified simulated clock offset properly triggers due words and updates streak/review counters. |
| **Tester 5 (Kavita D.)** | General nurse | Tested with browser storage restricted (Private Browsing with quota blocked). | Confirmed storage-blocked banner displays cleanly without throwing runtime exceptions; progress gracefully stored in memory. |
