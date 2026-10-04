// ============================================================
// storage.ts — safe localStorage wrapper (v2)
// All reads and writes are wrapped in try/catch.
// If localStorage is unavailable, blocked or full,
// falls back to in-memory store so the app never crashes.
// ============================================================

export const STORAGE_KEY = 'station-deutsch:v2';
export const CURRENT_VERSION = 2;

let _storageBlocked = false;
const _memoryStore = new Map<string, string>();

export function isStorageBlocked(): boolean {
  return _storageBlocked;
}

export function setStorageBlocked(blocked: boolean): void {
  _storageBlocked = blocked;
}

function getSafeStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    _storageBlocked = true;
  }
  return null;
}

export function loadState<T>(fallback: T): T {
  try {
    const storage = getSafeStorage();
    const raw = storage ? storage.getItem(STORAGE_KEY) : _memoryStore.get(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { version?: number };
    if (parsed.version !== CURRENT_VERSION) {
      // Version mismatch: ignore stored data and start fresh
      return fallback;
    }
    return parsed as T;
  } catch {
    _storageBlocked = true;
    return fallback;
  }
}

export function saveState<T>(state: T): void {
  try {
    const storage = getSafeStorage();
    const serialized = JSON.stringify(state);
    if (storage) {
      storage.setItem(STORAGE_KEY, serialized);
    } else {
      _memoryStore.set(STORAGE_KEY, serialized);
    }
  } catch {
    _storageBlocked = true;
    try {
      _memoryStore.set(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
}

export function clearState(): void {
  try {
    const storage = getSafeStorage();
    if (storage) {
      storage.removeItem(STORAGE_KEY);
    }
    _memoryStore.delete(STORAGE_KEY);
  } catch {
    _storageBlocked = true;
    _memoryStore.delete(STORAGE_KEY);
  }
}
