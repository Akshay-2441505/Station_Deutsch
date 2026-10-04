// ============================================================
// App.tsx — Router and storage-blocked banner
// ============================================================
import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isStorageBlocked } from './lib/storage';

import WelcomeScreen from './screens/WelcomeScreen';
import ChooseLevelScreen from './screens/ChooseLevelScreen';
import PlacementScreen from './screens/PlacementScreen';
import PlacementResultScreen from './screens/PlacementResultScreen';
import HomeScreen from './screens/HomeScreen';
import LearnScreen from './screens/LearnScreen';
import SessionScreen from './screens/SessionScreen';
import SummaryScreen from './screens/SummaryScreen';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';

function StorageBanner() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Check after a tick to allow store to hydrate
    const t = setTimeout(() => setBlocked(isStorageBlocked()), 100);
    return () => clearTimeout(t);
  }, []);

  if (!blocked) return null;

  return (
    <div className="storage-banner" role="alert">
      Progress can't be saved in this browser. Answers will be lost when you close this tab.
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <StorageBanner />
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/choose-level" element={<ChooseLevelScreen />} />
        <Route path="/placement" element={<PlacementScreen />} />
        <Route path="/placement-result" element={<PlacementResultScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/learn" element={<LearnScreen />} />
        <Route path="/session" element={<SessionScreen />} />
        <Route path="/summary" element={<SummaryScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
