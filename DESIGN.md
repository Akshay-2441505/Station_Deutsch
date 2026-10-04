# DESIGN: Station Deutsch

Visual and interaction spec. Build mobile-first at 390 px width. Behaviour and learning rules live in `LEARNING_DESIGN.md`.

---

## 1. Reference and what we take from it

Reference: a flashcard app concept with three phone screens. A full-bleed green screen holds the meaning in large bold sans text. A full-bleed yellow screen shows the headword in a bold serif with a pronunciation line and a single outlined "flip" pill at the bottom. A black screen holds the detail view with pill tabs and small outlined round icon buttons.

**Take:**
- One idea per screen, in very large type, on a flat full-bleed colour.
- Colour changes mark what the card is showing (word, meaning, detail).
- Few controls: outlined round icon buttons and wide outlined pills anchored at the bottom, in thumb reach.
- Bold serif for the target-language word, clean sans for everything else.

**Change, and why:**
- The reference shows tiny text (phonetics, tab labels). Our users are on phones between shifts. Minimum text size is 14 px and every tap target is at least 44 px.
- Thumbs up/down self-rating is fine while learning, but practice answers are checked by the app. Self-rating never moves a word between boxes.
- No phonetic (IPA) line. Nurses will not read it. Use an audio button instead.
- Do not copy the reference's layout pixel for pixel. Use the pattern, not the artwork.

**Color principle (V2):** **Colour marks progress and state; white is for work screens.** (Welcome is full-bleed lemon; Learn uses lemon and mint; Home features a full-bleed lemon top band; Practice is white; Summary is full-bleed mint; Progress is black).

## 2. Color tokens

| Token | Hex | Use |
|---|---|---|
| `--black` | `#000000` | Detail, progress, desktop container, text, primary pills |
| `--white` | `#FFFFFF` | Work screens: practice, settings, home body |
| `--lemon` | `#FFD21F` | Welcome screen, learn card German side, Home top band |
| `--mint` | `#6EE57A` | Summary screen, learn card meaning side, "Correct" feedback sheet |
| `--coral` | `#FF8A75` | "Not quite" feedback sheet, retry chip |
| `--grey` | `#5F5F5F` | Secondary text on white |
| `--line` | `#D9D9D9` | Dividers, disabled outlines |

Article chips (small pills, white text, always show the article as text):

| Article | Hex |
|---|---|
| der | `#1D4ED8` |
| die | `#C62828` |
| das | `#15803D` |

These follow a common German-learning colour convention. Chips are small and always carry the word "der", "die" or "das", so colour is never the only signal. Correct and not-quite feedback always include an icon and text.

## 3. Typography

| Role | Family | Weight | Size and line height |
|---|---|---|---|
| Welcome headline | Fraunces (variable) | 700 | 44/48 |
| German headword (Learn) | Fraunces (variable) | 700 | 56/60 (44/48 for long words) |
| Practice German test word | Fraunces (variable) | 700 | 40/44 |
| Practice English prompt | Figtree | 600 | 32/38 |
| Large numerals (Summary, Progress, Home) | Fraunces (variable) | 700 | 64/68 (Summary), 48/52 (Progress), 40/44 (Home) |
| Meaning, large statements | Figtree | 600 | 30/36 |
| Screen titles | Figtree | 700 | 24/30 |
| Body & Question labels | Figtree | 400 | 17/26 |
| Buttons | Figtree | 600 | 17/24 |
| Small text | Figtree | 500 | 14/20 (the minimum) |

- Self-host with `@fontsource-variable/fraunces` and `@fontsource-variable/figtree` so the app works on slow connections.
- Include the `latin` subset. Confirm that ä, ö, ü, Ä, Ö, Ü and ß render correctly in both fonts on a real phone.
- Sentence case everywhere. No all-caps labels. Line length stays short on phones by default.
- German text carries `lang="de"` so screen readers and speech synthesis pronounce it correctly.

## 4. Layout

- Mobile design width 390 px. Content container max width 480 px.
- Desktop presentation (1024 px and above): two columns on a black page (`#000000`). Left column displays the text wordmark "Station Deutsch" and a three-sentence explanation of the learning loop. Right column presents the app inside a 390 by 820 px frame (8 px black border, 36 px radius), scrolling within the frame with all sheets and overlays self-contained.
- Side padding 24 px. Bottom action zone about 96 px plus the safe-area inset. Use `dvh` units, not `vh`.
- One primary action per screen, anchored at the bottom.
- Shape language: screens and cards are full-bleed rectangles. Interactive controls are pills (fully rounded, 56 px high) or 44 px circles.

### Wireframes

Learn card, German side (lemon):

```
+--------------------------+
|  <back>          3 of 6  |
|                          |
|                          |
|  [der]                   |
|  Kopf                    |   <- Fraunces 56
|  (audio)                 |
|                          |
|                          |
|  ( Flip )                |   <- full width 56px pill
+--------------------------+
```

Learn card, meaning side (mint):

```
+--------------------------+
|  <back>          3 of 6  |
|                          |
|  head                    |   <- Figtree 30
|                          |
|  Mein Kopf tut weh.      |
|  My head hurts.          |
|                          |
|  (Not yet)  (Got it)     |   <- two pills
+--------------------------+
```

Practice, multiple choice (white), then feedback sheet:

```
+--------------------------+      +--------------------------+
|  <close>   =====--  4/10 |      |                          |
|                          |      |  ... question dimmed ... |
|  What does this mean?    |      +==========================+
|                          |      | (x) Not quite            |  coral
|  das Fieber              |      | das Fieber means "fever".|
|                          |      | You chose "pain".        |
|  ( pain          )       |      | ( Continue )             |  black pill
|  ( fever         )       |      +==========================+
|  ( head          )       |
|  ( cough         )       |
|  ( Check )               |
+--------------------------+
```

Home (white with lemon top band):

```
+==========================+
|  Your level: A1  (change)|  lemon band
|  Today                   |
|  4 of 10                 |  Fraunces 40
|  =====-----              |
+==========================+
|  ( Practise )            |  white body
|  ( Learn new words )     |
|                          |
|  Weak words (3)          |
|  Progress >              |
+--------------------------+
```

Progress (black):

```
+--------------------------+
|  <back>   Progress       |
|  Words by state          |
|  12 New  6 Learning ...  |   <- large Fraunces numerals
|  Needs attention         |
|  [der] Kopf    missed 3x |
|  ( Practise these )      |   <- on-black pill with white outline
|  Mistakes by type        |
|  Article  ======         |   <- lemon bars
|  Spelling ===            |
+--------------------------+
```

## 5. Screens

1. **Welcome.** Full-bleed lemon. Fraunces 44/48 headline: "Medical German for nurses." Subtitle: "A1 and A2 words. A few minutes a day." 3-step loop summary. Actions: "Start check", "Choose my level", and "Try with sample progress".
2. **Placement question.** One question per screen, progress bar, options as pills.
3. **Placement result.** "Your starting point: A1" with explanation and "Change level".
4. **Home.** Full-bleed lemon band at top with "Today", count in large Fraunces numerals (e.g. "4 of 10"), and progress bar. Below on white: primary "Practise", Weak words, and Progress link.
5. **Learn.** Lemon and mint cards, then detail view on black with tabs: "Meaning", "Example", "Tip".
6. **Practice.** One exercise per screen, white. Tested German word in Fraunces 40/44, English prompt in Figtree 600 32/38. Fixed denominator counter (e.g. 4/10), "Retry" chip on retries. Error boundary with skip fallback.
7. **Typed recall.** Article buttons (der, die, das), text field with umlaut shortcuts.
8. **Session summary.** Full-bleed mint screen. Accuracy in large Fraunces numeral (64/68). "Keep practising" as primary pill.
9. **Progress.** Black screen. Sentence case headings, "Needs attention" list (never shows "Mastered"), mistakes by type (plural hidden until plural exercises exist), "Practise these" in `.pill--on-black`.
10. **Settings.** Level, About (browser storage notice), Demo tools: "Simulate tomorrow", "Load demo history" (labelled as sample data), "Reset all data".

## 6. Components

- `PillButton`: variants `primary` (black fill, white text), `outline` (black 2 px border), `on-color` (black outline on lemon, mint or coral), and `on-black` (white 2px border, white text, hover white fill on black). Height 56 px, full width, padding 0 24px.
- `IconButton`: 44 px circle, 2 px outline, Lucide icon at 20-24 px with 2 px stroke.
- `ArticleChip`: small pill, 28 px high, white text 14 px.
- `OptionButton`: full-width pill 56 px, outline. States: default, selected, correct (mint + tick icon), wrong (coral + cross icon). Never relies on colour alone.
- `FeedbackSheet`: bottom sheet, full width on mobile, aligned to container max-width on desktop, mint or coral, with icon, "Correct" or "Not quite", explanation, and "Continue".
- `ProgressBar`: 8 px high, black on line grey (lemon on dark grey for black screen).
- `StateBadge`: text only. New, Learning, Familiar, Strong, Mastered (never shown under weak words).
- `UmlautRow`: four 44 px buttons that insert ä, ö, ü or ß at the cursor.
- `Tabs`: pill tabs with outline, as in the reference detail screen.
- `TopBar`: back or close icon, fixed progress counter e.g. 4/10, no title unless needed.
- `UmlautRow`: four 44 px buttons that insert ä, ö, ü or ß at the cursor.
- `Tabs`: pill tabs with outline, as in the reference detail screen.
- `TopBar`: back or close icon, optional progress, no title unless needed.

## 7. Motion

- Card flip: 250 ms, a simple turn on the vertical axis. Triggered by the learner.
- Feedback sheet: 200 ms slide up. Triggered by the learner pressing "Check".
- No decorative or entrance animation. Respect `prefers-reduced-motion` by replacing the flip and slide with an instant change.

## 8. Writing

- Plain verbs, sentence case, active voice. A button names what happens: "Check", "Continue", "Flip", "Practise", "Learn new words", "Keep practising", "Practise these".
- Keep an action's name the same across the flow.
- Errors and empty states say what happened and what to do. No apologies.
  - Empty: "You're caught up. Practise anyway to keep words fresh."
  - No German voice: "No German voice on this device. Audio is off."
  - Storage blocked: "Progress can't be saved in this browser. Answers will be lost when you close this tab."
- Do not use praise inflation or streak guilt. Never say a learner has "finished".

## 9. Accessibility checklist

- Text contrast at least 4.5:1, large text at least 3:1. Verify with a checker.
- Tap targets at least 44 by 44 px, with 8 px spacing.
- Visible keyboard focus ring on every control (2 px black outline, 2 px offset; white on black screens).
- Colour is never the only signal for article, correct or wrong.
- Minimum text size 14 px. Allow browser zoom to 200% without breaking layout.
- Audio is optional. Everything works without sound.

## 10. Do not

- Do not add gradients, drop shadows or illustrations.
- Do not round cards. Do not square off pills.
- Do not add decorative icons, mascots or confetti.
- Do not use more than the colours in the token table.
