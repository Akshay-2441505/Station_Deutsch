// ============================================================
// PillButton.tsx
// ============================================================
import React from 'react';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'on-color';
  children: React.ReactNode;
}

export default function PillButton({ variant = 'primary', children, className = '', disabled, ...props }: PillButtonProps) {
  const cls = [
    'pill',
    `pill--${variant}`,
    disabled ? 'pill--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
