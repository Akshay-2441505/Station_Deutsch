// ============================================================
// phase2_visual.test.ts — Phase 2 failing tests first
// ============================================================

import { describe, it, expect } from 'vitest';
import { DESKTOP_TEXT } from '../lib/constants';

describe('2.5 Desktop narrative constants', () => {
  it('defines desktop prototype title and three sentences on the learning loop', () => {
    expect(DESKTOP_TEXT).toBeDefined();
    expect(DESKTOP_TEXT.title).toBe('Station Deutsch');
    expect(DESKTOP_TEXT.sentences).toHaveLength(3);
    for (const s of DESKTOP_TEXT.sentences) {
      expect(typeof s).toBe('string');
      expect(s.length).toBeGreaterThan(10);
    }
  });
});
