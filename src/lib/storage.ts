// ============================================================
// storage.ts — safe localStorage wrapper
// All reads and writes are wrapped in try/catch.
// ============================================================

const STORAGE_KEY = 'station-deutsch:v1';
const CURRENT_VERSION = 1;

let _storageBlocked = false;

export function isStorageBlocked(): boolean {
  return _storageBlocked;
}

export function loadState<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    _storageBlocked = true;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    _storageBlocked = true;
  }
}
