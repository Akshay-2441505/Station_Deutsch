#!/usr/bin/env tsx
// ============================================================
// validate-content.ts — content schema and quality checks
// Run: npm run validate:content
// Run: npm run validate:content -- --strict
// ============================================================

import { z } from 'zod';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const strict = process.argv.includes('--strict');

// ---- Zod schemas ----

const SentenceSchema = z.object({
  level: z.enum(['A1', 'A2']),
  de: z.string().min(1),
  en: z.string().min(1),
  blank: z.string().min(1),
});

const WordSchema = z.object({
  id: z.string().min(1),
  de: z.string().min(1),
  article: z.enum(['der', 'die', 'das']).nullable(),
  pos: z.enum(['noun', 'verb', 'adjective', 'phrase']),
  plural: z.string().nullable(),
  pluralOnly: z.boolean(),
  en: z.string().min(1),
  topic: z.enum(['body', 'symptoms', 'care', 'ward', 'patient']),
  level: z.enum(['A1', 'A2']),
  sentences: z.array(SentenceSchema),
  tip: z.string().nullable(),
  verification: z.object({
    status: z.enum(['unverified', 'verified']),
    sources: z.array(z.string()),
  }),
  conflicts: z.array(z.string()).optional(),
});

const PlacementItemSchema = z.object({
  id: z.string().min(1),
  level: z.enum(['A1', 'A2']),
  kind: z.enum(['meaning', 'article', 'sentence']),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  answerIndex: z.number().int().min(0),
  verification: z.object({
    status: z.enum(['unverified', 'verified']),
    sources: z.array(z.string()),
  }),
});

// ---- Load files ----

const root = resolve(process.cwd());
const wordsRaw = JSON.parse(readFileSync(resolve(root, 'content/words.json'), 'utf8')) as unknown[];
const placementRaw = JSON.parse(readFileSync(resolve(root, 'content/placement.json'), 'utf8')) as unknown[];

let errors = 0;
let warnings = 0;

function fail(msg: string) {
  console.error(`  ✗ ${msg}`);
  errors++;
}

function warn(msg: string) {
  console.warn(`  ⚠ ${msg}`);
  warnings++;
}

function pass(msg: string) {
  console.log(`  ✓ ${msg}`);
}

// ---- Validate words ----

console.log('\n── words.json ──────────────────────────────────────────');

const words = wordsRaw.map((raw, i) => {
  const result = WordSchema.safeParse(raw);
  if (!result.success) {
    fail(`Entry ${i}: schema error — ${result.error.message}`);
    return null;
  }
  return result.data;
}).filter(Boolean) as z.infer<typeof WordSchema>[];

// Unique IDs
const wordIds = words.map((w) => w.id);
const duplicateIds = wordIds.filter((id, i) => wordIds.indexOf(id) !== i);
if (duplicateIds.length > 0) {
  fail(`Duplicate IDs: ${duplicateIds.join(', ')}`);
} else {
  pass('All IDs are unique');
}

// Nouns have article, non-nouns do not
let articleOk = true;
for (const w of words) {
  if (w.pos === 'noun' && w.article === null && !w.pluralOnly) {
    fail(`${w.id}: noun must have an article`);
    articleOk = false;
  }
  if (w.pos !== 'noun' && w.article !== null) {
    fail(`${w.id}: non-noun should not have an article`);
    articleOk = false;
  }
}
if (articleOk) pass('Article rules: all correct');

// pluralOnly nouns have plural: null
let pluralOnlyOk = true;
for (const w of words) {
  if (w.pluralOnly && w.plural !== null) {
    fail(`${w.id}: pluralOnly noun must have plural: null`);
    pluralOnlyOk = false;
  }
}
if (pluralOnlyOk) pass('pluralOnly rules: all correct');

// At least one sentence per entry; blank appears in de
let sentenceOk = true;
const emptySentence: string[] = [];
for (const w of words) {
  if (w.sentences.length === 0) {
    fail(`${w.id}: no sentences (at least one required)`);
    emptySentence.push(w.id);
    sentenceOk = false;
    continue;
  }
  for (const s of w.sentences) {
    if (!s.de.includes(s.blank)) {
      fail(`${w.id}: blank "${s.blank}" not found in sentence "${s.de}"`);
      sentenceOk = false;
    }
  }
}
if (sentenceOk) pass('Sentence rules: all correct');
if (emptySentence.length > 0) {
  warn(`Entries with no sentences (must be fixed before shipping): ${emptySentence.join(', ')}`);
}

// 0.4 ASCII umlaut warning rule
const asciiUmlautPattern = /(ae|oe|ue)/i;
const knownLegitAscii = new Set(['feuer', 'neue', 'treue', 'abenteuer', 'knie', 'patient']);
for (const w of words) {
  if (asciiUmlautPattern.test(w.de) && !knownLegitAscii.has(w.de.toLowerCase())) {
    warn(`${w.id}: headword "${w.de}" contains ae/oe/ue where an umlaut (ä/ö/ü) is likely`);
  }
}

// 0.7 Conflicts validation
for (const w of words) {
  if (w.conflicts) {
    for (const cid of w.conflicts) {
      if (!words.some((other) => other.id === cid)) {
        fail(`${w.id}: conflict ID "${cid}" does not exist in words.json`);
      }
    }
  }
}

// Level coverage per topic
console.log('\n  Level coverage by topic:');
const topics = ['body', 'symptoms', 'care', 'ward', 'patient'] as const;
const levels = ['A1', 'A2'] as const;
for (const topic of topics) {
  for (const level of levels) {
    const count = words.filter((w) => w.topic === topic && w.level === level).length;
    const mark = count >= 4 ? '✓' : count > 0 ? '⚠' : '✗';
    console.log(`    ${mark} ${topic} / ${level}: ${count} entries`);
    if (count < 4) {
      warn(`${topic}/${level} has fewer than 4 entries (distractor minimum not met)`);
    }
  }
}

// Verified status
const unverified = words.filter((w) => w.verification.status === 'unverified');
const verifiedWithNoSource = words.filter(
  (w) => w.verification.status === 'verified' && w.verification.sources.length === 0,
);

console.log(`\n  Unverified entries: ${unverified.length} / ${words.length}`);
if (verifiedWithNoSource.length > 0) {
  fail(`${verifiedWithNoSource.length} entries marked verified but have no sources: ${verifiedWithNoSource.map((w) => w.id).join(', ')}`);
} else {
  pass('All verified entries have at least one source');
}

if (strict && unverified.length > 0) {
  fail(`--strict: ${unverified.length} unverified entries. All must be verified before release.`);
}

// ---- Validate placement ----

console.log('\n── placement.json ───────────────────────────────────────');

const placement = placementRaw.map((raw, i) => {
  const result = PlacementItemSchema.safeParse(raw);
  if (!result.success) {
    fail(`Placement entry ${i}: ${result.error.message}`);
    return null;
  }
  return result.data;
}).filter(Boolean) as z.infer<typeof PlacementItemSchema>[];

const a1Items = placement.filter((p) => p.level === 'A1');
const a2Items = placement.filter((p) => p.level === 'A2');

if (a1Items.length !== 5) fail(`Expected 5 A1 placement items, got ${a1Items.length}`);
else pass(`A1 placement items: ${a1Items.length}`);

if (a2Items.length !== 3) fail(`Expected 3 A2 placement items, got ${a2Items.length}`);
else pass(`A2 placement items: ${a2Items.length}`);

// answerIndex in range
for (const p of placement) {
  if (p.answerIndex >= p.options.length) {
    fail(`${p.id}: answerIndex ${p.answerIndex} out of range (${p.options.length} options)`);
  }
}

// Placement IDs unique and not overlapping with words
const placementIds = placement.map((p) => p.id);
const duplicatePlacementIds = placementIds.filter((id, i) => placementIds.indexOf(id) !== i);
if (duplicatePlacementIds.length > 0) fail(`Duplicate placement IDs: ${duplicatePlacementIds.join(', ')}`);
else pass('Placement IDs unique');

const overlap = placementIds.filter((id) => wordIds.includes(id));
if (overlap.length > 0) fail(`Placement IDs overlap with word IDs: ${overlap.join(', ')}`);
else pass('Placement IDs do not overlap with word bank');

// ---- Summary ----

console.log('\n══════════════════════════════════════════════════════════');
if (errors === 0 && warnings === 0) {
  console.log('✅  All checks passed.\n');
} else {
  if (warnings > 0) console.warn(`⚠  ${warnings} warning(s).`);
  if (errors > 0) console.error(`❌  ${errors} error(s). Fix these before shipping.\n`);
}

if (errors > 0) process.exit(1);
