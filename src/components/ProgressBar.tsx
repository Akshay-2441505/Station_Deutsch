// ============================================================
// ProgressBar.tsx
// ============================================================


interface ProgressBarProps {
  value: number; // 0-1
  label?: string;
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
