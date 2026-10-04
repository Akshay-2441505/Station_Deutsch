// ============================================================
// ExerciseErrorBoundary.tsx
// Wraps each exercise so that if one throws, it logs the error,
// offers a skip button, and never freezes the session.
// ============================================================

import { Component, type ReactNode, type ErrorInfo } from 'react';
import PillButton from './PillButton';

interface Props {
  children: ReactNode;
  onSkip: () => void;
  exerciseKey: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ExerciseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ExerciseErrorBoundary] Error in exercise:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.exerciseKey !== this.props.exerciseKey) {
      if (this.state.hasError) {
        this.setState({ hasError: false, error: null });
      }
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <p className="text-body" style={{ color: 'var(--coral)', marginBottom: 16 }}>
            This exercise couldn't be loaded.
          </p>
          <PillButton variant="primary" onClick={this.props.onSkip}>
            Skip to next
          </PillButton>
        </div>
      );
    }
    return this.props.children;
  }
}
