// ============================================================
// clock.ts — app clock with day-offset support
// Never call Date.now() / new Date() outside this module.
// ============================================================

let _dayOffset = 0; // number of simulated days added

/** Returns the current app time in ms (real time + offset). */
export function now(): number {
  return Date.now() + _dayOffset * 86_400_000;
}

/** Set the number of simulated days to add to the real clock. */
export function setDayOffset(days: number): void {
  _dayOffset = days;
}

/** Get the current day offset. */
export function getDayOffset(): number {
  return _dayOffset;
}

/** Returns the day key string "YYYY-MM-DD" for a given ms timestamp. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
