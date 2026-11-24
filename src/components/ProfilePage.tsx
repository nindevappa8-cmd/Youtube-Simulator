import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  LogOut,
  ShieldAlert,
  Trash2,
  Volume2,
} from 'lucide-react';
import {
  AVATAR_OPTIONS,
  CreatorAvatar,
  getRankTextStyle,
  getTierTextStyle,
} from './Icons';
import {
  calculateRank,
  calculateTier,
  formatCompactNumber,
  formatCurrency,
  getEditorById,
  getGameById,
  getGpuById,
  getLaptopById,
} from '../lib/gameData';
import {
  changePlayerEmail,
  changePlayerPassword,
  deletePlayerAccount,
  logoutPlayer,
  updatePlayerProfileSettings,
} from '../lib/playerService';
import { auth } from '../lib/firebase';
import { soundManager } from '../lib/soundManager';
import type { UserProfile, VideoRecord } from '../types';

interface ProfilePageProps {
  profile: UserProfile;
  videos: VideoRecord[];
  onRefreshProfile: () => Promise<void>;
  onLoggedOut: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  videos,
  onRefreshProfile,
  onLoggedOut,
}) => {
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarId);
  const [soundEnabled, setSoundEnabled] = useState(profile.settings.soundEnabled);
  const [soundVolume, setSoundVolume] = useState(profile.settings.soundVolume);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const rankDef = calculateRank(profile.subscribers);
  const tierDef = calculateTier(profile.totalEarned);
  const isPasswordProvider = Boolean(
    auth.currentUser?.providerData?.some((p) => p.providerId === 'password')
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.play('click');
    setBusy(true);
    setFeedback(null);
    try {
      await updatePlayerProfileSettings(profile.uid, {
        username: usernameInput,
        avatarId: selectedAvatar,
        settings: { soundEnabled, soundVolume },
      });
      soundManager.setEnabled(soundEnabled);
      soundManager.setVolume(soundVolume);
      await onRefreshProfile();
      soundManager.play('purchaseSuccess');
      setFeedback({ type: 'success', text: 'Profile and sound preferences saved.' });
    } catch (err) {
      soundManager.play('purchaseFailure');
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save settings.' });
    } finally {
      setBusy(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.play('click');
    setBusy(true);
    setFeedback(null);
    try {
      await changePlayerEmail(newEmail, emailPassword || undefined);
      soundManager.play('purchaseSuccess');
      setNewEmail('');
      setEmailPassword('');
      setFeedback({
        type: 'success',
        text: 'Firebase sent a verification email to your new Gmail address. Your email updates once confirmed.',
      });
    } catch (err) {
      soundManager.play('purchaseFailure');
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Email update failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.play('click');
    setBusy(true);
    setFeedback(null);
    try {
      await changePlayerPassword(currentPassword, newPassword);
      soundManager.play('purchaseSuccess');
      setCurrentPassword('');
      setNewPassword('');
      setFeedback({ type: 'success', text: 'Password updated securely in Firebase Authentication.' });
    } catch (err) {
      soundManager.play('purchaseFailure');
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Password update failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    soundManager.play('click');
    setBusy(true);
    try {
      await logoutPlayer();
      onLoggedOut();
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Logout failed.' });
      setBusy(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setFeedback({ type: 'error', text: 'Type DELETE to confirm permanent account deletion.' });
      return;
    }
    soundManager.play('click');
    setBusy(true);
    setFeedback(null);
    try {
      await deletePlayerAccount(isPasswordProvider ? deletePassword : undefined);
      onLoggedOut();
    } catch (err) {
      soundManager.play('purchaseFailure');
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Account deletion failed.' });
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Profile Header */}
      <section className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <CreatorAvatar avatarId={profile.avatarId} username={profile.username} size={72} />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
            <div className="text-xs font-mono text-[#A0A0A0]">
              User ID: <span className="text-white">{profile.displayId}</span>
            </div>
            <div className="text-xs text-[#A0A0A0]">
              Gmail: <span className="text-white">{profile.email}</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500 break-all">
              Auth UID: {profile.uid}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-xl bg-[#171717] hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-white flex items-center gap-2 self-start lg:self-auto transition-transform active:scale-95"
        >
          <LogOut className="w-4 h-4 text-[#FF2020]" />
          <span>Log Out</span>
        </button>
      </section>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
            feedback.type === 'success'
              ? 'bg-[#20D878]/10 border-[#20D878]/40 text-[#20D878]'
              : 'bg-[#FF3535]/10 border-[#FF3535]/40 text-[#FF3535]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Channel Stats & Owned Inventory Overview */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs text-[#A0A0A0]">Subscribers</div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            {profile.subscribers.toLocaleString('en-US')}
          </div>
          <div className={`text-xs font-semibold mt-1 ${getRankTextStyle(rankDef.gradientKey)}`}>
            {rankDef.name}
          </div>
        </div>
        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs text-[#A0A0A0]">Views & Videos</div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            {formatCompactNumber(profile.totalViews)}
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1 font-mono tabular-nums">
            {videos.length} uploaded videos
          </div>
        </div>
        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs text-[#A0A0A0]">Lifetime Earnings</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#20D878] mt-1">
            {formatCurrency(profile.totalEarned)}
          </div>
          <div className={`text-xs font-semibold mt-1 ${getTierTextStyle(tierDef.gradientKey)}`}>
            {tierDef.name}
          </div>
        </div>
        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5">
          <div className="text-xs text-[#A0A0A0]">Unlocked Badges</div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            {profile.badges.length}
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1 truncate">
            {profile.badges.length > 0 ? profile.badges.join(' · ') : 'None yet'}
          </div>
        </div>
      </section>

      {/* Inventory Breakdown: Hardware, Games, Editors */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white">Owned Hardware</h2>
          <div className="space-y-2 text-xs">
            <div>
              <div className="text-[#A0A0A0] mb-1">Laptops ({profile.inventory.laptops.length})</div>
              {profile.inventory.laptops.length === 0 ? (
                <div className="text-zinc-500">None owned</div>
              ) : (
                <ul className="space-y-1">
                  {profile.inventory.laptops.map((id) => (
                    <li key={id} className="text-white flex justify-between">
                      <span>{getLaptopById(id)?.name || id}</span>
                      {profile.inventory.activeLaptopId === id && (
                        <span className="text-[#20D878]">Active</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="pt-2 border-t border-zinc-800">
              <div className="text-[#A0A0A0] mb-1">GPUs ({profile.inventory.gpus.length})</div>
              {profile.inventory.gpus.length === 0 ? (
                <div className="text-zinc-500">None owned</div>
              ) : (
                <ul className="space-y-1 text-white">
                  {profile.inventory.gpus.map((id) => (
                    <li key={id}>{getGpuById(id)?.name || id}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white">Owned & Installed Games</h2>
          {profile.inventory.games.length === 0 ? (
            <div className="text-xs text-zinc-500">No games purchased yet.</div>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {profile.inventory.games.map((id) => {
                const installed = profile.inventory.installedGames.includes(id);
                return (
                  <li key={id} className="flex items-center justify-between text-white">
                    <span>{getGameById(id)?.name || id}</span>
                    <span className={installed ? 'text-[#20D878]' : 'text-[#A0A0A0]'}>
                      {installed ? 'Installed' : 'Library'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white">Hired Editors</h2>
          {profile.inventory.editors.length === 0 ? (
            <div className="text-xs text-zinc-500">No editors hired yet.</div>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {profile.inventory.editors.map((id) => {
                const ed = getEditorById(id);
                return (
                  <li key={id} className="flex items-center justify-between text-white">
                    <span>{ed?.name || id}</span>
                    <span className="font-mono tabular-nums text-[#20D878]">
                      {ed?.highestChance}% High
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Settings Panels */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity & Sound Settings */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-[#171717] border border-zinc-800 rounded-2xl p-6 space-y-5"
        >
          <h2 className="text-base font-bold text-white">Channel & Sound Settings</h2>

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
              Channel Username
            </label>
            <input
              type="text"
              minLength={2}
              maxLength={32}
              required
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div>
            <div className="text-xs font-medium text-[#A0A0A0] mb-2">Choose Avatar</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setSelectedAvatar(av.id);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                    selectedAvatar === av.id
                      ? 'border-[#FF2020] bg-[#111111]'
                      : 'border-zinc-800 bg-[#111111]/60 hover:border-zinc-700'
                  }`}
                >
                  <CreatorAvatar avatarId={av.id} username={usernameInput} size={36} />
                  <span className="text-[10px] text-[#A0A0A0] truncate w-full text-center">
                    {av.label.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-white">
                <Volume2 className="w-4 h-4 text-[#FF2020]" />
                <span>Sound Effects</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled((v) => !v)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  soundEnabled
                    ? 'bg-[#20D878]/20 text-[#20D878] border border-[#20D878]/40'
                    : 'bg-zinc-800 text-[#A0A0A0]'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#A0A0A0]">Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={soundVolume}
                onChange={(e) => setSoundVolume(Number(e.target.value))}
                className="flex-1 accent-[#FF2020]"
              />
              <span className="text-xs font-mono tabular-nums text-white w-10 text-right">
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FF2020] hover:bg-[#e01b1b] text-white text-xs font-semibold transition-transform active:scale-[0.98]"
          >
            Save Profile & Audio Settings
          </button>
        </form>

        {/* Security Settings: Email, Password, Delete Account */}
        <div className="space-y-6">
          <form
            onSubmit={handleEmailUpdate}
            className="bg-[#171717] border border-zinc-800 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-white">Change Gmail Address</h2>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="newaddress@gmail.com"
              className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
            />
            {isPasswordProvider && (
              <input
                type="password"
                required
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Current password to verify"
                className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
              />
            )}
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white"
            >
              Send Email Update Verification
            </button>
          </form>

          {isPasswordProvider && (
            <form
              onSubmit={handlePasswordUpdate}
              className="bg-[#171717] border border-zinc-800 rounded-2xl p-6 space-y-4"
            >
              <h2 className="text-base font-bold text-white">Change Password</h2>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
              />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white"
              >
                Update Password
              </button>
            </form>
          )}

          {/* Danger Zone: Permanent Account Deletion */}
          <div className="bg-[#171717] border border-[#FF3535]/40 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-[#FF3535] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Delete Account</span>
            </h2>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Permanently deletes your creator profile, video history, inventory, leaderboard entry, and Firebase Authentication account. Logging out does not delete your account.
            </p>
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setShowDeleteModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#FF3535]/15 hover:bg-[#FF3535]/25 border border-[#FF3535]/50 text-[#FF3535] text-xs font-semibold flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account Permanently</span>
            </button>
          </div>
        </div>
      </section>

      {/* Account Deletion Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <motion.form
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleDeleteAccount}
            className="max-w-md w-full bg-[#171717] border border-[#FF3535]/60 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-white">Confirm Permanent Account Deletion</h3>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              This action cannot be undone. All videos, balances, hardware, and authentication credentials for <span className="text-white">{profile.email}</span> will be permanently removed.
            </p>

            {isPasswordProvider && (
              <div>
                <label className="block text-xs text-[#A0A0A0] mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter password to reauthenticate"
                  className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF3535] rounded-xl px-3.5 py-2 text-sm text-white outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-[#A0A0A0] mb-1">
                Type <span className="font-mono text-white">DELETE</span> to confirm
              </label>
              <input
                type="text"
                required
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF3535] rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-[#FF3535] hover:bg-[#dc2626] text-xs font-semibold text-white"
              >
                {busy ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </motion.div>
  );
};
