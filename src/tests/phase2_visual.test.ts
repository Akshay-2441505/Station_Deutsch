// ============================================================
// phase2_visual.test.ts — Desktop narrative & visual tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { DESKTOP_TEXT } from '../lib/constants';

describe('2.5 Desktop narrative constants', () => {
  it('defines desktop prototype title, badge and three steps', () => {
    expect(DESKTOP_TEXT).toBeDefined();
    expect(DESKTOP_TEXT.title).toBe('Station Deutsch');
    expect(DESKTOP_TEXT.badge).toBe('Prototype preview');
    expect(DESKTOP_TEXT.sentences).toHaveLength(3);
    expect(DESKTOP_TEXT.steps).toHaveLength(3);

    // Verify forbidden hype words are removed
    const fullText = JSON.stringify(DESKTOP_TEXT).toLowerCase();
    expect(fullText).not.toContain('fully mastered');
    expect(fullText).not.toContain('intelligently');
  });
});
