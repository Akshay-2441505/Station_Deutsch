// ============================================================
// useAppStore.ts — Zustand store with persistence (v2)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Attempt, Level, SessionSummary } from '../lib/types';
import { applyResult, freshProgress } from '../lib/scheduler';
import { getDayOffset, setDayOffset } from '../lib/clock';
import { generateDemoHistory } from '../lib/demo';
import { clearState } from '../lib/storage';

const CURRENT_VERSION = 2 as const;

function makeInitialState(): AppState {
  return {
    version: CURRENT_VERSION,
    level: null,
    levelSource: null,
    progress: {},
    attempts: [],
    sessions: [],
    dayOffset: 0,
    isDemoData: false,
  };
}

interface AppStore extends AppState {
  // Actions
  setLevel: (level: Level, source: 'placement' | 'manual') => void;
  recordAttempt: (attempt: Omit<Attempt, 'id'>) => void;
  recordSessionSummary: (summary: Omit<SessionSummary, 'id'>) => void;
  importProgress: (imported: AppState) => void;
  initWordProgress: (wordId: string) => void;
  simulateTomorrow: () => void;
  loadDemoHistory: () => void;
  resetAll: () => void;
  storageBlocked: boolean;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...makeInitialState(),
      storageBlocked: false,

      setLevel: (level, source) => {
        set({ level, levelSource: source });
      },

      initWordProgress: (wordId) => {
        const { progress } = get();
        if (!progress[wordId]) {
          set({ progress: { ...progress, [wordId]: freshProgress(wordId) } });
        }
      },

      recordAttempt: (attemptData) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const attempt: Attempt = { ...attemptData, id };

        set((state) => {
          const existing = state.progress[attemptData.wordId] ?? freshProgress(attemptData.wordId);
          const updated = applyResult(
            existing,
            attemptData.correct,
            attemptData.errorType,
            attemptData.isRetry,
            attemptData.at,
          );

          const newAttempts = [...state.attempts, attempt].slice(-500);

          return {
            progress: { ...state.progress, [attemptData.wordId]: updated },
            attempts: newAttempts,
          };
        });
      },

      recordSessionSummary: (summaryData) => {
        const id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const summary: SessionSummary = { ...summaryData, id };
        set((state) => ({
          sessions: [summary, ...state.sessions].slice(0, 30),
        }));
      },

      importProgress: (imported) => {
        set({
          ...imported,
          version: CURRENT_VERSION,
        });
      },

      simulateTomorrow: () => {
        const newOffset = getDayOffset() + 1;
        setDayOffset(newOffset);
        set({ dayOffset: newOffset });
      },

      loadDemoHistory: () => {
        const { progress, attempts, sessions, isDemoData } = generateDemoHistory();
        setDayOffset(0);
        set({
          progress,
          attempts,
          sessions,
          isDemoData,
          dayOffset: 0,
          level: 'A1',
          levelSource: 'manual',
        });
      },

      resetAll: () => {
        clearState();
        setDayOffset(0);
        set({ ...makeInitialState() });
      },
    }),
    {
      name: 'station-deutsch:v2',
      version: CURRENT_VERSION,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          return makeInitialState();
        }
        return persistedState as AppState;
      },
      // Custom storage with safe wrapper
      storage: {
        getItem: (key) => {
          try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch {
            // storage blocked - state continues in memory
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key);
          } catch {
            // ignore
          }
        },
      },
      onRehydrateStorage: () => (state) => {
        if (state?.dayOffset) {
          setDayOffset(state.dayOffset);
        }
      },
    },
  ),
);
