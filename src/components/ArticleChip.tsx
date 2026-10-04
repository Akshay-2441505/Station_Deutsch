// ============================================================
// ArticleChip.tsx
// ============================================================
import type { Article } from '../lib/types';

interface ArticleChipProps {
  article: Article;
}

export default function ArticleChip({ article }: ArticleChipProps) {
  return (
    <span className={`chip chip--${article}`} aria-label={`Article: ${article}`}>
      {article}
    </span>
  );
}
