import React, { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AuthScreen } from './components/AuthScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './components/HomePage';
import { LeaderboardsPage } from './components/LeaderboardsPage';
import { Navbar } from './components/Navbar';
import { ProfilePage } from './components/ProfilePage';
import { RanksPage } from './components/RanksPage';
import { StorePage } from './components/StorePage';
import { StudioPage } from './components/StudioPage';
import { auth, db } from './lib/firebase';
import {
  fetchOrRecoverProfile,
  fetchUserVideos,
  updatePlayerProfileSettings,
} from './lib/playerService';
import { soundManager } from './lib/soundManager';
import type { AppSection, MarketStockState, UserProfile, VideoRecord } from './types';

function StudioAppShell() {
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [pendingRecoveryUid, setPendingRecoveryUid] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [marketStock, setMarketStock] = useState<MarketStockState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadMarketStock = useCallback(async () => {
    try {
      const resp = await fetch('/api/market/stock');
      if (resp.ok) {
        const data = (await resp.json()) as MarketStockState;
        setMarketStock(data);
      }
    } catch {
      // Non-fatal; retry on next poll
    }
  }, []);

  const refreshPlayerData = useCallback(async (uid?: string) => {
    const targetUid = uid || auth.currentUser?.uid;
    if (!targetUid) return;
    try {
      const snap = await getDoc(doc(db, 'users', targetUid));
      if (snap.exists()) {
        const loaded = snap.data() as UserProfile;
        setProfile(loaded);
        soundManager.setEnabled(loaded.settings?.soundEnabled ?? true);
        soundManager.setVolume(loaded.settings?.soundVolume ?? 0.6);
      }
      const vidList = await fetchUserVideos(targetUid);
      setVideos(vidList);
    } catch {
      // Errors are logged via handleFirestoreError; preserve current state safely
    }
  }, []);

  useEffect(() => {
    void loadMarketStock();
  }, [loadMarketStock]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) {
        setProfile(null);
        setVideos([]);
        setPendingRecoveryUid(null);
        setAuthReady(true);
        return;
      }

      try {
        const { profile: loadedProfile, recovered } = await fetchOrRecoverProfile(user);
        setProfile(loadedProfile);
        setPendingRecoveryUid(null);
        soundManager.setEnabled(loadedProfile.settings?.soundEnabled ?? true);
        soundManager.setVolume(loadedProfile.settings?.soundVolume ?? 0.6);
        const vidList = await fetchUserVideos(user.uid);
        setVideos(vidList);
        if (recovered) {
          setNotice('Session restored and player profile verified.');
        }
      } catch {
        setPendingRecoveryUid(user.uid);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRetryRecovery = async () => {
    if (!auth.currentUser) return;
    try {
      const { profile: recoveredProfile } = await fetchOrRecoverProfile(auth.currentUser);
      setProfile(recoveredProfile);
      setPendingRecoveryUid(null);
      const vidList = await fetchUserVideos(auth.currentUser.uid);
      setVideos(vidList);
    } catch {
      setPendingRecoveryUid(auth.currentUser.uid);
    }
  };

  const handleToggleSound = async () => {
    if (!profile) return;
    const nextEnabled = !profile.settings.soundEnabled;
    soundManager.setEnabled(nextEnabled);
    if (nextEnabled) soundManager.play('click');
    await updatePlayerProfileSettings(profile.uid, {
      settings: {
        soundEnabled: nextEnabled,
        soundVolume: profile.settings.soundVolume,
      },
    });
    await refreshPlayerData(profile.uid);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#FF2020] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-[#A0A0A0]">Restoring studio session...</div>
        </div>
      </div>
    );
  }

  if (!authUser || !profile) {
    return (
      <AuthScreen
        pendingRecoveryUid={pendingRecoveryUid}
        onRetryRecovery={handleRetryRecovery}
        onAuthenticated={async (loadedProfile, msg) => {
          setProfile(loadedProfile);
          setPendingRecoveryUid(null);
          setActiveSection('home');
          if (msg) setNotice(msg);
          soundManager.setEnabled(loadedProfile.settings?.soundEnabled ?? true);
          soundManager.setVolume(loadedProfile.settings?.soundVolume ?? 0.6);
          try {
            const vidList = await fetchUserVideos(loadedProfile.uid);
            setVideos(vidList);
          } catch {
            setVideos([]);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      <Navbar
        profile={profile}
        activeSection={activeSection}
        onNavigate={(sec) => {
          setNotice(null);
          setActiveSection(sec);
        }}
        soundEnabled={profile.settings.soundEnabled}
        onToggleSound={() => void handleToggleSound()}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {notice && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#20D878]/10 border border-[#20D878]/40 flex items-center justify-between text-xs text-[#20D878]">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-white/70 hover:text-white ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeSection === 'home' && (
          <HomePage
            profile={profile}
            videos={videos}
            onNavigate={setActiveSection}
          />
        )}

        {activeSection === 'studio' && (
          <StudioPage
            profile={profile}
            videos={videos}
            onRefreshProfile={() => refreshPlayerData(profile.uid)}
            onNavigate={setActiveSection}
          />
        )}

        {activeSection === 'store' && (
          <StorePage
            profile={profile}
            marketStock={marketStock}
            onRefreshProfile={() => refreshPlayerData(profile.uid)}
            onRefreshStock={loadMarketStock}
          />
        )}

        {activeSection === 'profile' && (
          <ProfilePage
            profile={profile}
            videos={videos}
            onRefreshProfile={() => refreshPlayerData(profile.uid)}
            onLoggedOut={() => {
              setProfile(null);
              setVideos([]);
              setActiveSection('home');
            }}
          />
        )}

        {activeSection === 'leaderboards' && <LeaderboardsPage profile={profile} />}

        {activeSection === 'ranks' && <RanksPage profile={profile} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StudioAppShell />
    </ErrorBoundary>
  );
}
