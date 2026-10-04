// ============================================================
// AudioButton.tsx — browser speech synthesis
// ============================================================
import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioButtonProps {
  text: string;
}

export default function AudioButton({ text }: AudioButtonProps) {
  const [hasVoice, setHasVoice] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setHasVoice(false);
      return;
    }
    function checkVoices() {
      try {
        const voices = window.speechSynthesis.getVoices();
        const german = voices.find((v) => v.lang.startsWith('de'));
        setHasVoice(!!german);
      } catch {
        setHasVoice(false);
      }
    }
    checkVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', checkVoices);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', checkVoices);
  }, []);

  if (hasVoice === false) return null;

  const speak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      if (playing) { window.speechSynthesis.cancel(); setPlaying(false); return; }
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'de-DE';
      const voices = window.speechSynthesis.getVoices();
      const german = voices.find((v) => v.lang.startsWith('de'));
      if (german) utt.voice = german;
      utt.onend = () => setPlaying(false);
      utt.onerror = () => setPlaying(false);
      setPlaying(true);
      window.speechSynthesis.speak(utt);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={speak}
      aria-label={playing ? 'Stop audio' : `Listen to ${text}`}
    >
      {playing ? <VolumeX size={24} strokeWidth={2} /> : <Volume2 size={24} strokeWidth={2} />}
    </button>
  );
}
