// ============================================================
// TopBar.tsx
// ============================================================
import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  variant?: 'back' | 'close' | 'none';
  onAction?: () => void;
  progress?: { current: number; total: number };
  title?: string;
  right?: React.ReactNode;
}

export default function TopBar({ variant = 'back', onAction, progress, title, right }: TopBarProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) { onAction(); return; }
    navigate(-1);
  };

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        {variant !== 'none' && (
          <button className="icon-btn" onClick={handleAction} aria-label={variant === 'back' ? 'Go back' : 'Close'}>
            {variant === 'back' ? <ArrowLeft size={24} strokeWidth={2} /> : <X size={24} strokeWidth={2} />}
          </button>
        )}
        {title && <span className="topbar__title" style={{ marginLeft: variant !== 'none' ? 8 : 0 }}>{title}</span>}
      </div>

      {progress && (
        <span className="text-small" style={{ whiteSpace: 'nowrap' }}>
          {progress.current} of {progress.total}
        </span>
      )}

      {right && <div>{right}</div>}
    </div>
  );
}
