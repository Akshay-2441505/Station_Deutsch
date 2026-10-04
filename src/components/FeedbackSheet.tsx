// ============================================================
// FeedbackSheet.tsx
// ============================================================
import { CheckCircle, XCircle } from 'lucide-react';
import type { FeedbackData } from '../lib/types';
import PillButton from './PillButton';

interface FeedbackSheetProps {
  feedback: FeedbackData;
  onContinue: () => void;
}

export default function FeedbackSheet({ feedback, onContinue }: FeedbackSheetProps) {
  return (
    <div className="feedback-sheet-overlay" role="dialog" aria-modal="true" aria-label={feedback.correct ? 'Correct answer' : 'Incorrect answer'}>
      <div className="feedback-sheet-backdrop" onClick={onContinue} />
      <div className={`feedback-sheet feedback-sheet--${feedback.correct ? 'correct' : 'wrong'}`}>
        <div className="feedback-sheet__headline">
          {feedback.correct
            ? <CheckCircle size={28} strokeWidth={2} aria-hidden="true" />
            : <XCircle size={28} strokeWidth={2} aria-hidden="true" />}
          {feedback.headline}
        </div>
        {feedback.body && (
          <p className="feedback-sheet__body">{feedback.body}</p>
        )}
        {feedback.tip && (
          <p className="feedback-sheet__tip">💡 {feedback.tip}</p>
        )}
        <PillButton variant="primary" onClick={onContinue} id="feedback-continue">
          Continue
        </PillButton>
      </div>
    </div>
  );
}
