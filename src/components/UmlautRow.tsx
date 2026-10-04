// ============================================================
// UmlautRow.tsx — ä ö ü ß insertion buttons
// ============================================================


interface UmlautRowProps {
  onInsert: (char: string) => void;
}

const UMLAUTS = ['ä', 'ö', 'ü', 'ß'];

export default function UmlautRow({ onInsert }: UmlautRowProps) {
  return (
    <div className="umlaut-row" role="group" aria-label="Special characters">
      {UMLAUTS.map((char) => (
        <button
          key={char}
          type="button"
          className="umlaut-btn"
          onClick={() => onInsert(char)}
          aria-label={`Insert ${char}`}
        >
          {char}
        </button>
      ))}
    </div>
  );
}
