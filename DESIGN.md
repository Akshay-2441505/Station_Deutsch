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

**Where the boldness goes:** the word card. Everything else stays quiet, white and disciplined so the card is the memorable moment.

## 2. Color tokens

| Token | Hex | Use |
|---|---|---|
| `--black` | `#000000` | Detail and progress screens, text, outlines, primary pills |
| `--white` | `#FFFFFF` | Home, practice, settings screens |
| `--lemon` | `#FFD21F` | Learn card, German side |
| `--mint` | `#6EE57A` | Learn card, meaning side. "Correct" feedback sheet |
| `--coral` | `#FF8A75` | "Not quite" feedback sheet |
| `--grey` | `#5F5F5F` | Secondary text on white |
| `--line` | `#D9D9D9` | Dividers, disabled outlines |

Article chips (small pills, white text, always show the article as text):

| Article | Hex |
|---|---|
| der | `#1D4ED8` |
| die | `#C62828` |
| das | `#15803D` |

These follow a common but not universal German-learning colour convention. Chips are small and always carry the word "der", "die" or "das", so colour is never the only signal. Correct and not-quite feedback always include an icon and text.

Contrast: black on lemon, mint and coral, and white on the three chip colours, is intended to meet WCAG AA (4.5:1 for text). The figures were estimated by hand. Verify every pair with a contrast checker before shipping and adjust a hex if any fails.

Do not add gradients, shadows or extra accent colours.

## 3. Typography

| Role | Family | Weight | Size and line height |
|---|---|---|---|
| German headword | Fraunces (variable) | 700 | 56/60 (scale down to 44/48 for long words) |
| Meaning, large statements | Figtree | 600 | 30/36 |
| Screen titles | Figtree | 700 | 24/30 |
| Body | Figtree | 400 | 17/26 |
| Buttons | Figtree | 600 | 17/24 |
| Small text | Figtree | 500 | 14/20 (the minimum) |

- Self-host with `@fontsource-variable/fraunces` and `@fontsource-variable/figtree` so the app works on slow connections.
- Include the `latin` subset. Confirm that ä, ö, ü, Ä, Ö, Ü and ß render correctly in both fonts on a real phone.
- Sentence case everywhere. No all-caps labels. Line length stays short on phones by default.
- German text carries `lang="de"` so screen readers and speech synthesis pronounce it correctly.

## 4. Layout

- Design width 390 px. Content container max width 480 px, centred on larger screens with the page background matching the current screen colour.
- Side padding 24 px. Bottom action zone about 96 px plus the safe-area inset. Use `dvh` units, not `vh`.
- One primary action per screen, anchored at the bottom. Content is left-aligned. The headword on the learn card is left-aligned and vertically centred, as in the reference.
- Shape language: screens and cards are full-bleed rectangles with no rounding. Interactive controls are pills (fully rounded) or 44 px circles. This difference is intentional and tells the learner what can be tapped.

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
|  ( Flip )                |   <- outlined pill, full width
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

Home (white):

```
+--------------------------+
|  Your level: A1  (change)|
|                          |
|  Today                   |
|  4 of 10 answers         |
|  =====-----              |
|                          |
|  ( Practise )            |   <- black filled pill
|  ( Learn new words )     |   <- outlined pill
|                          |
|  Weak words (3)          |
|  Progress                |
+--------------------------+
```

Progress (black):

```
+--------------------------+
|  <back>   Progress       |
|  Words by state          |
|  12 New  6 Learning ...  |   <- large Fraunces numerals
|  Weak words              |
|  [der] Kopf    missed 3x |
|  ( Practise these )      |
|  Mistakes by type        |
|  Article  ======         |   <- lemon bars
|  Spelling ===            |
+--------------------------+
```

## 5. Screens

1. **Welcome.** One sentence on what the app does, then "Start check" and "Choose my level".
2. **Placement question.** One question per screen, progress bar, options as pills.
3. **Placement result.** "Your starting point: A1" with the explanation and "Change level".
4. **Home.** As wireframe. "You're caught up" state replaces the goal block when nothing is due, with "Practise anyway".
5. **Learn.** Lemon and mint cards, then an optional detail view on black with tabs: "Meaning", "Example", "Tip".
6. **Practice.** One exercise per screen, white. Feedback sheet slides up from the bottom after "Check".
7. **Typed recall.** Article buttons (der, die, das), a text field, and a row of ä ö ü ß buttons above the keyboard.
8. **Session summary.** Accuracy, words that moved up, new mistakes, and "Keep practising" as the primary pill.
9. **Progress.** As wireframe.
10. **Settings.** Level, About (states that progress is stored in this browser only), Demo tools: "Simulate tomorrow", "Load demo history" (labelled as sample data), "Reset all data".

## 6. Components

- `PillButton`: variants primary (black fill, white text), outline (black 2 px border), on-colour (black outline on lemon, mint or coral). Height 56 px.
- `IconButton`: 44 px circle, 2 px outline, Lucide icon at 24 px with 2 px stroke.
- `ArticleChip`: small pill, 28 px high, white text 14 px.
- `OptionButton`: full-width pill 56 px, outline. States: default, selected, correct, wrong (wrong and correct add an icon and a text label, not colour alone).
- `FeedbackSheet`: bottom sheet, full width, mint or coral, with icon, "Correct" or "Not quite", the explanation, and "Continue".
- `ProgressBar`: 8 px high, black on line grey.
- `StateBadge`: text only. New, Learning, Familiar, Strong, Mastered.
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
