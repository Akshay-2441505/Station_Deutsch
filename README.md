# Station Deutsch

> Medical German vocabulary practice app for Indian nurses moving to Germany (A1/A2). Built mobile-first for quick study sessions between hospital shifts.

---

## 1. What the Product Is

**Station Deutsch** is a focused medical German vocabulary trainer designed specifically for Indian nursing professionals preparing to work in German hospitals. Healthcare professionals have limited study time and need practical ward vocabulary that directly impacts patient care and daily clinical workflows.

The app addresses:
- **Medical and clinical vocabulary**: Organs, common symptoms, bedside care procedures, ward equipment, and patient interactions.
- **Gender and article retention**: Clear visual distinction for *der*, *die*, and *das* without relying on color alone.
- **Spaced repetition (Leitner system)**: Prioritizes stubborn and overdue words across 5 Leitner boxes with daily promotion limits and stubborn demotion caps.
- **Flexible placement check**: An 8-question placement check (5 A1, 3 A2) to assess initial level, with freedom to manually switch levels anytime.
- **Desktop presentation container**: On viewports $\ge 1024$px, displays an authentic $390 \times 820$ px phone mockup with contextual learning notes in the left column.
- **Ward Context & Topic Map**: Top-level topic cards on Home showing learned vs total counts, and clinical topic labels on all exercise and learn screens.
- **Mistakes Ledger (`#/mistakes`)**: Persistent log of learner slips with given vs expected answers, relative timestamps, fixed badges, and targeted "Practise these" drills.
- **Data Portability & WhatsApp Sharing**: Instant WhatsApp sharing of weak words with mentors/colleagues, and offline JSON progress download and restoration.

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
  │     • Today's count in lemon band (e.g. 4 of 10)       │
  │     • Topic cards map (Body, Symptoms, Care, Ward...)  │
  │     • Weak words list (never shows false Mastered)     │
  │     • Quick links: My mistakes & WhatsApp share        │
  └─────────────┬───────────────────────────┬──────────────┘
                │                           │
         [Topic Learn batch]           [Practise]
                │                           │
                ▼                           ▼
  ┌───────────────────────────┐ ┌──────────────────────────┐
  │       Learn Screen        │ │      Practice Session    │
  │  • Lemon card (German)    │ │  • Fixed total (10 items)│
  │  • Mint card (English)    │ │  • Ward topic badge      │
  │  • Audio pronunciation    │ │  • Exercise progression  │
  │  • Non-punitive self-rate │ │    by box (MCQ, match,   │
  └─────────────┬─────────────┘ │    fill, article, typed) │
                │ auto-trans    │  • Instant feedback sheet│
                └──────────────►│  • Retries queued 2-4    │
                                │    items later with chip │
                                └───────────┬──────────────┘
                                            │
                                            ▼
                                ┌──────────────────────────┐
                                │      Session Summary     │
                                │  • Mint full-bleed screen│
                                │  • Large Fraunces score  │
                                │  • Trend vs last session │
                                │  • Next review due clock │
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

# Strict validation (enforces zero unverified entries before release)
npm run validate:strict

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
- **Data Ownership**: Learners can download their full state as JSON and restore it on any device via Settings without creating an account.
- **Next Steps**: A future iteration will introduce optional cloud authentication to synchronize Leitner box progress across devices.

---

## 6. What I Would Build Next

1. **Sentence Builder Drill (`build`)**: Interactive tile arrangement exercise where nurses construct ward sentences in correct German word order (Time-Manner-Place / Verb-second).
2. **Slow Audio Toggle**: A 0.7x speed toggle on audio playback for complex compound nouns (*Blutdruckmessgerät*, *Krankenhausbett*).
3. **Verified Pronunciation & Phonetic Tips**: Contextual pronunciation hints displayed for tricky consonant clusters (e.g. *ch*, *st/sp*, *sch*).
4. **Listen-and-Pick Exercise (`listen`)**: Spoken audio prompt where learners identify the correct German medical term from hearing ward instructions.
5. **Progressive Web App (PWA) Offline Cache**: Service Worker and Web Manifest allowing nurses on ward night shifts or in basement clinics to practice without cellular connectivity.

---

## 7. Test Log (Template)

> To be filled by the project owner with real tester feedback.

| Date | Tester Type | Task Tested | What Broke / Confused | What Changed |
|---|---|---|---|---|
| *YYYY-MM-DD* | *e.g. Nurse / Student / Trainer* | *e.g. Learn batch -> Practice* | *Observations* | *Action taken* |
| | | | | |
| | | | | |
| | | | | |

---

## 8. Deploying to Vercel (Owner Notes)

> **IMPORTANT**: The agent must not deploy to production without the project owner. Follow these steps when ready to deploy:

1. **Push Repository**: Ensure the latest commits on `master` are pushed to your GitHub or GitLab repository.
2. **Connect to Vercel**:
   - Log in to [vercel.com](https://vercel.com) and click **"Add New..." > "Project"**.
   - Select the `Skillcase` repository.
3. **Build & Output Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Configuration**:
   - A pre-configured `vercel.json` is provided in the repository root.
   - Because the app uses React Router with HashRouter (`#/`), client-side routing works reliably across all static hosting platforms without custom 404 rewriting.
5. **Post-Deployment Smoke Test**:
   - Open the deployed Vercel URL on a mobile device (Android Chrome).
   - Test Welcome "Try with sample progress" -> Home -> Practise session -> Summary.
   - Verify speech synthesis audio button plays German words when device volume is up.
