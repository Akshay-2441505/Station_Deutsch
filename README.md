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
  │     • Top stubborn / weak words                        │
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

### Content Validation & Verification Worksheet
```bash
# Standard validation
npm run validate:content

# Strict validation (requires all entries to have verified checkable sources)
npm run validate:content -- --strict

# Generate human verification worksheet
npm run content:worksheet
```

### Build for Production
```bash
npm run build
```

---

## 4. Content Status

The active vocabulary bank is validated via `scripts/validate-content.ts`. Words requiring owner review or deemed above beginner level are parked in `content/words.parked.json`.

Run `npm run validate:content` to view live counts from the validator:

| Metric | Active Word Bank (`words.json`) | Placement (`placement.json`) | Parked (`words.parked.json`) |
|---|---|---|---|
| **Total Entries** | 60 | 8 | 10 |
| **Verified** | 0 | 0 | 0 |
| **Unverified** | 60 | 8 | 10 |

### Breakdown by Topic & Level (Active Bank)
- **`body`**: 11 at A1, 3 at A2 (14 total)
- **`symptoms`**: 10 at A1, 3 at A2 (13 total)
- **`care`**: 11 at A1, 1 at A2 (12 total)
- **`ward`**: 7 at A1, 4 at A2 (11 total)
- **`patient`**: 6 at A1, 4 at A2 (10 total)

*Note: All entries are currently marked `unverified` with sources cleared until human verification against Goethe-Institut A1/A2 word lists and Duden is completed via `content/verification-worksheet.md`.*

---

## 5. Why No Login Yet

- **Prototype Focus**: The initial project specification focuses on rapid validation of the core spaced-repetition and exercise loop between hospital shifts.
- **Zero Friction**: Requiring account creation or authentication creates unnecessary friction for reviewers and early testers trying the tool for 3–5 minutes.
- **Next Steps**: A future iteration will introduce optional cloud authentication to synchronize Leitner box progress across desktop and mobile devices.

---

## 6. What I Would Build Next

1. **Audio Listen Mode (`listen`)**: Browser speech synthesis dictation exercise where nurses listen to spoken German orders or symptoms and select the corresponding English meaning.
2. **Plural Form Drills (`plural`)**: Specific drills for irregular medical plurals (e.g., *das Bett* $\rightarrow$ *die Betten*, *der Magen* $\rightarrow$ *die Mägen*).
3. **Progressive Web App (PWA) Offline Support**: Service worker and web manifest allowing Indian nurses on ward night shifts to open and practice offline without cellular reception.
4. **Clinical Mistake Explainer**: On-demand breakdown of false friends (e.g., *Gift* vs *poison*, *bekommen* vs *become*) and case declensions (*den Blutdruck messen* vs *der Blutdruck*).
5. **My Mistakes (`#/mistakes`)**: A dedicated review screen grouping missed items with direct retry drills.

---

## 7. Test Log (Template)

> To be filled by the project owner with real tester feedback.

| Date | Tester Type | Task Tested | What Broke / Confused | What Changed |
|---|---|---|---|---|
| *YYYY-MM-DD* | *e.g. Nurse / Student / Trainer* | *e.g. Learn batch -> Practice* | *Observations* | *Action taken* |
| | | | | |
| | | | | |
| | | | | |
