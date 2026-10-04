// ============================================================
// SettingsScreen.tsx — Level, about, demo tools, import/export (V2 §3.6)
// ============================================================
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { exportProgress, validateImportedProgress } from '../lib/features';
import TopBar from '../components/TopBar';
import PillButton from '../components/PillButton';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const store = useAppStore();
  const level = store.level;
  const setLevel = store.setLevel;
  const simulateTomorrow = store.simulateTomorrow;
  const loadDemoHistory = store.loadDemoHistory;
  const resetAll = store.resetAll;
  const isDemoData = store.isDemoData;
  const importProgress = store.importProgress;

  const [resetConfirm, setResetConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    const dataStr = exportProgress({
      version: 2,
      level: store.level,
      levelSource: store.levelSource,
      progress: store.progress,
      attempts: store.attempts,
      sessions: store.sessions,
      dayOffset: store.dayOffset,
      isDemoData: store.isDemoData,
    });
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `station-deutsch-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateImportedProgress(content);
      if (res.success && res.data) {
        importProgress(res.data);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        setImportError(res.error || 'Failed to import progress file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    resetAll();
    navigate('/');
  };

  return (
    <div className="screen screen--white">
      <TopBar variant="back" title="Settings" />

      <div className="content" style={{ paddingBottom: 32 }}>
        {/* Level */}
        <section aria-labelledby="level-heading" style={{ marginBottom: 28 }}>
          <h2 id="level-heading" className="text-title" style={{ marginBottom: 16 }}>Level</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['A1', 'A2'] as const).map((l) => (
              <button
                key={l}
                className={`option-btn ${level === l ? 'option-btn--selected' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setLevel(l, 'manual')}
                aria-pressed={level === l}
                id={`level-${l}`}
              >
                {l}
              </button>
            ))}
          </div>
        </section>

        <div className="divider" />

        {/* 3.6 Export and import progress */}
        <section aria-labelledby="backup-heading" style={{ marginBottom: 28 }}>
          <h2 id="backup-heading" className="text-title" style={{ marginBottom: 8 }}>
            Progress & backup
          </h2>
          <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 16 }}>
            Export your learning progress to a file or restore from a previous backup.
          </p>
          <div className="stack" style={{ gap: 12 }}>
            <PillButton variant="outline" id="download-progress-btn" onClick={handleDownload}>
              Download my progress
            </PillButton>

            <PillButton
              variant="outline"
              id="restore-progress-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Restore from file
            </PillButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              id="restore-file-input"
            />
          </div>

          {importSuccess && (
            <p className="text-small" style={{ color: 'var(--das)', marginTop: 8 }}>
              ✓ Progress restored successfully!
            </p>
          )}
          {importError && (
            <p className="text-small" style={{ color: 'var(--coral)', marginTop: 8 }}>
              ⚠ {importError}
            </p>
          )}
        </section>

        <div className="divider" />

        {/* About */}
        <section aria-labelledby="about-heading" style={{ marginBottom: 28 }}>
          <h2 id="about-heading" className="text-title" style={{ marginBottom: 8 }}>About</h2>
          <p className="text-body" style={{ color: 'var(--grey)' }}>
            Station Deutsch — Medical German vocabulary practice for nurses at A1 and A2 level.
          </p>
          <p className="text-body" style={{ color: 'var(--grey)', marginTop: 8 }}>
            Progress is stored in this browser only. Download a backup to keep answers safe.
          </p>
          {isDemoData && (
            <p className="text-small" style={{ color: 'var(--coral)', marginTop: 8 }}>
              ⚠ You are viewing sample data.
            </p>
          )}
        </section>

        <div className="divider" />

        {/* Demo tools */}
        <section aria-labelledby="demo-heading" style={{ marginBottom: 28 }}>
          <h2 id="demo-heading" className="text-title" style={{ marginBottom: 4 }}>Demo tools</h2>
          <p className="text-small" style={{ color: 'var(--grey)', marginBottom: 16 }}>
            For evaluators. These affect your progress.
          </p>
          <div className="stack" style={{ gap: 12 }}>
            <PillButton
              variant="outline"
              id="simulate-tomorrow"
              onClick={() => { simulateTomorrow(); navigate('/home'); }}
            >
              Simulate tomorrow
            </PillButton>
            <PillButton
              variant="outline"
              id="load-demo"
              onClick={() => { loadDemoHistory(); navigate('/home'); }}
            >
              Load demo history (sample data)
            </PillButton>
          </div>
        </section>

        <div className="divider" />

        {/* Danger zone */}
        <section>
          <PillButton
            variant="outline"
            id="reset-all"
            onClick={handleReset}
            style={resetConfirm ? { borderColor: 'var(--coral)', color: 'var(--coral)' } : {}}
          >
            {resetConfirm ? 'Tap again to confirm reset' : 'Reset all data'}
          </PillButton>
          {resetConfirm && (
            <p className="text-small" style={{ color: 'var(--grey)', marginTop: 8, textAlign: 'center' }}>
              This cannot be undone.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
