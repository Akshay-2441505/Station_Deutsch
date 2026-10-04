import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface Sentence {
  level: string;
  de: string;
  en: string;
  blank: string;
}

interface Word {
  id: string;
  de: string;
  article: string | null;
  pos: string;
  plural: string | null;
  pluralOnly: boolean;
  en: string;
  topic: string;
  level: string;
  sentences: Sentence[];
  tip: string | null;
  verification: {
    status: string;
    sources: string[];
  };
}

const root = resolve(process.cwd());
const wordsPath = resolve(root, 'content/words.json');
const outputPath = resolve(root, 'content/verification-worksheet.md');

const words = JSON.parse(readFileSync(wordsPath, 'utf8')) as Word[];

// Sort by level, topic, then headword
words.sort((a, b) => {
  if (a.level !== b.level) return a.level.localeCompare(b.level);
  if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
  return a.de.localeCompare(b.de);
});

let md = '# Content Verification Worksheet\n\n';
md += '> One row per word in `content/words.json`. To be checked and filled by hand against official Goethe-Institut A1/A2 word lists and Duden.\n\n';
md += '| ID | Article | Headword | Plural | English | Level | Example Sentence | Wiktionary | Duden | Article OK | Plural OK | On Goethe List (A1/A2/none) | Sentence OK | Checked By | Source |\n';
md += '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n';

for (const w of words) {
  const article = w.article ?? (w.pluralOnly ? 'die (pl)' : '-');
  const plural = w.plural ?? (w.pluralOnly ? 'plural only' : '-');
  const sentence = w.sentences[0]?.de ?? '-';
  const encodedWord = encodeURIComponent(w.de);
  const wiktionaryLink = `[Wiktionary](https://de.wiktionary.org/wiki/${encodedWord})`;
  const dudenLink = `[Duden](https://www.duden.de/suchen/dudenonline/${encodedWord})`;

  // Escape any pipe characters in sentences or translations
  const safeSentence = sentence.replace(/\|/g, '\\|');
  const safeEnglish = w.en.replace(/\|/g, '\\|');

  md += `| \`${w.id}\` | ${article} | **${w.de}** | ${plural} | ${safeEnglish} | ${w.level} | ${safeSentence} | ${wiktionaryLink} | ${dudenLink} | | | | | | |\n`;
}

writeFileSync(outputPath, md, 'utf8');
console.log(`Generated verification worksheet for ${words.length} words at: ${outputPath}`);
