import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadState, saveState, isStorageBlocked, setStorageBlocked } from '../lib/storage';
import { validateImportedProgress } from '../lib/features';
import { freshProgress } from '../lib/scheduler';
import type { AppState } from '../lib/types';

describe('Phase 4: Quality & Resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setStorageBlocked(false);
  });

  describe('Storage Resilience', () => {
    it('returns fallback and flags storageBlocked when localStorage throws', () => {
      // Simulate localStorage.getItem throwing SecurityError or QuotaExceededError
      const mockStorage = {
        getItem: vi.fn(() => {
          throw new Error('SecurityError: The operation is insecure.');
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      (globalThis as any).localStorage = mockStorage;

      const fallback = { test: true };
      const loaded = loadState(fallback);

      expect(loaded).toEqual(fallback);
      expect(isStorageBlocked()).toBe(true);
    });

    it('safely handles corrupted JSON without crashing', () => {
      const mockStorage = {
        getItem: vi.fn(() => '{ invalid json string'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      (globalThis as any).localStorage = mockStorage;

      const fallback = { safe: true };
      const loaded = loadState(fallback);

      expect(loaded).toEqual(fallback);
    });

    it('ignores older storage version (v1) and returns fallback', () => {
      const mockStorage = {
        getItem: vi.fn(() => JSON.stringify({ version: 1, level: 'A1', progress: {} })),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      (globalThis as any).localStorage = mockStorage;

      const fallback = { safe: true, version: 2 };
      const loaded = loadState(fallback);

      expect(loaded).toEqual(fallback);
    });

    it('flags storageBlocked when localStorage.setItem throws', () => {
      const mockStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceededError');
        }),
        removeItem: vi.fn(),
      };
      (globalThis as any).localStorage = mockStorage;

      saveState({ version: 2 });
      expect(isStorageBlocked()).toBe(true);
    });
  });

  describe('Import / Export validation resilience', () => {
    it('rejects null or non-object import data', () => {
      expect(validateImportedProgress(null).valid).toBe(false);
      expect(validateImportedProgress('string data').valid).toBe(false);
      expect(validateImportedProgress([1, 2, 3]).valid).toBe(false);
    });

    it('rejects state missing version 2', () => {
      const v1Data = { version: 1, progress: {}, attempts: [], sessions: [] };
      const res = validateImportedProgress(v1Data);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/version 2/i);
    });

    it('rejects state with corrupted progress map', () => {
      const corruptData = { version: 2, progress: 'not an object', attempts: [], sessions: [] };
      const res = validateImportedProgress(corruptData);
      expect(res.valid).toBe(false);
    });

    it('accepts valid v2 AppState export (both as object and JSON string)', () => {
      const validState: AppState = {
        version: 2,
        level: 'A1',
        levelSource: 'placement',
        progress: {
          w_01: {
            ...freshProgress('w_01'),
            box: 2,
          },
        },
        attempts: [],
        sessions: [
          {
            id: 'sess-1',
            at: 1760000000000,
            accuracy: 100,
            answered: 10,
            promotedIds: ['w_01'],
          },
        ],
        dayOffset: 0,
        isDemoData: false,
      };

      // Test object input
      const res1 = validateImportedProgress(validState);
      expect(res1.valid).toBe(true);
      expect(res1.state?.version).toBe(2);

      // Test string input
      const res2 = validateImportedProgress(JSON.stringify(validState));
      expect(res2.valid).toBe(true);
      expect(res2.state?.version).toBe(2);
    });
  });

  describe('WCAG 2.1 Luminance & Contrast ratios', () => {
    // Standard relative luminance formula (WCAG 2.1)
    function hexToLuminance(hex: string): number {
      const rgb = hex.replace('#', '').match(/.{2}/g)!.map((x) => parseInt(x, 16) / 255);
      const [r, g, b] = rgb.map((c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
      );
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function contrastRatio(hex1: string, hex2: string): number {
      const lum1 = hexToLuminance(hex1);
      const lum2 = hexToLuminance(hex2);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    }

    const TOKENS = {
      black: '#0F172A',
      lemon: '#E8FF8C',
      mint: '#85E874',
      white: '#FFFFFF',
      grayDark: '#475569',
      mintTint: '#D4F8CD',
      coralTint: '#FFE0E0',
    };

    it('Black (#0F172A) on Lemon (#E8FF8C) exceeds WCAG AAA (7:1)', () => {
      const ratio = contrastRatio(TOKENS.black, TOKENS.lemon);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('Black (#0F172A) on Mint (#85E874) exceeds WCAG AAA (7:1)', () => {
      const ratio = contrastRatio(TOKENS.black, TOKENS.mint);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('Black (#0F172A) on White (#FFFFFF) exceeds WCAG AAA (7:1)', () => {
      const ratio = contrastRatio(TOKENS.black, TOKENS.white);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('White (#FFFFFF) on Black (#0F172A) exceeds WCAG AAA (7:1)', () => {
      const ratio = contrastRatio(TOKENS.white, TOKENS.black);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('Dark Gray (#475569) on White (#FFFFFF) exceeds WCAG AA (4.5:1)', () => {
      const ratio = contrastRatio(TOKENS.grayDark, TOKENS.white);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('Black text on Mint tint and Coral tint exceeds WCAG AAA (7:1)', () => {
      expect(contrastRatio(TOKENS.black, TOKENS.mintTint)).toBeGreaterThanOrEqual(7.0);
      expect(contrastRatio(TOKENS.black, TOKENS.coralTint)).toBeGreaterThanOrEqual(7.0);
    });
  });
});
