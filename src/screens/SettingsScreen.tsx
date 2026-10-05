// ============================================================
// SettingsScreen.tsx — Level, about, demo tools, import/export (V2 §3.6)
// ============================================================
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Calendar, BarChart2, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { exportProgress, validateImportedProgress } from '../lib/features';
import { APP_URL, getInviteWhatsAppUrl } from '../lib/copy';
import {
  computePrototypeMetrics,
  downloadDailyReminderIcs,
  track,
} from '../lib/metrics';
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
  const sessions = store.sessions;
  const attempts = store.attempts;

  const [resetConfirm, setResetConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [reminderDownloaded, setReminderDownloaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prototypeMetrics = useMemo(() => {
    return computePrototypeMetrics(sessions, attempts);
  }, [sessions, attempts]);

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

  const handleInvitePartner = () => {
    track('share_clicked', { context: 'invite_study_partner_settings', channel: 'whatsapp' });
    window.open(getInviteWhatsAppUrl(), '_blank');
  };

  const handleDownloadReminder = () => {
    track('share_clicked', { context: 'daily_reminder_ics', channel: 'calendar' });
    downloadDailyReminderIcs(APP_URL);
    setReminderDownloaded(true);
    setTimeout(() => setReminderDownloaded(false), 3500);
  };

  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    resetAll();
    navigate('/');
  };

  return (
    <div className="screen screen--white" style={{ position: 'relative' }}>
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

        {/* Study partner & Habits */}
        <section aria-labelledby="partner-heading" style={{ marginBottom: 28 }}>
          <h2 id="partner-heading" className="text-title" style={{ marginBottom: 8 }}>
            Partner & routine
          </h2>
          <p className="text-body" style={{ color: 'var(--grey)', marginBottom: 16 }}>
            Practise regularly with a colleague or set a quiet daily calendar reminder.
          </p>
          <div className="stack" style={{ gap: 12 }}>
            <PillButton
              variant="outline"
              id="invite-partner-settings-btn"
              onClick={handleInvitePartner}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Share2 size={18} /> Invite a study partner
            </PillButton>

            <PillButton
              variant="outline"
              id="download-reminder-ics-btn"
              onClick={handleDownloadReminder}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Calendar size={18} /> Add a daily reminder (.ics)
            </PillButton>

            {reminderDownloaded && (
              <p className="text-small" style={{ color: 'var(--das)', textAlign: 'center', marginTop: 4 }}>
                ✓ Calendar reminder downloaded! Tap to import to your calendar.
              </p>
            )}
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

            {/* Prototype metrics button */}
            <PillButton
              variant="outline"
              id="prototype-metrics-btn"
              onClick={() => setShowMetrics(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <BarChart2 size={18} /> Prototype metrics
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

      {/* Prototype Metrics Modal */}
      {showMetrics && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="metrics-modal-title"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(2px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMetrics(false);
          }}
        >
          <div
            style={{
              background: 'var(--white)',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: '24px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
              maxHeight: '85%',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 id="metrics-modal-title" className="text-title" style={{ margin: 0, fontSize: 20 }}>
                Prototype metrics
              </h2>
              <button
                className="icon-btn"
                onClick={() => setShowMetrics(false)}
                aria-label="Close prototype metrics"
                id="close-metrics-btn"
                style={{ width: 36, height: 36, borderColor: 'var(--line)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-small" style={{ color: 'var(--grey)', marginBottom: 20 }}>
              Calculated entirely from local device history. Zero personal data collected.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--gray-light, #F8FAFC)', padding: '14px', borderRadius: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--black)' }}>
                  {prototypeMetrics.sessionsCompleted}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey)', marginTop: 2 }}>
                  Sessions completed
                </div>
              </div>

              <div style={{ background: 'var(--gray-light, #F8FAFC)', padding: '14px', borderRadius: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--black)' }}>
                  {prototypeMetrics.answers}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey)', marginTop: 2 }}>
                  Total answers
                </div>
              </div>

              <div style={{ background: 'var(--gray-light, #F8FAFC)', padding: '14px', borderRadius: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--black)' }}>
                  {prototypeMetrics.firstTryAccuracy}%
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey)', marginTop: 2 }}>
                  First-try accuracy
                </div>
              </div>

              <div style={{ background: 'var(--gray-light, #F8FAFC)', padding: '14px', borderRadius: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--black)' }}>
                  {prototypeMetrics.daysPractised}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey)', marginTop: 2 }}>
                  Days practised
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--gray-light, #F8FAFC)', padding: '14px', borderRadius: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey)' }}>Retry success rate</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--black)' }}>
                  {prototypeMetrics.retrySuccessRate !== null
                    ? `${prototypeMetrics.retrySuccessRate}%`
                    : 'N/A (no retries)'}
                </div>
              </div>
            </div>

            <PillButton variant="primary" id="dismiss-metrics-btn" onClick={() => setShowMetrics(false)}>
              Close
            </PillButton>
          </div>
        </div>
      )}
    </div>
  );
}
