import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Clapperboard, UploadCloud } from 'lucide-react';
import { EditorIcon, GamepadIcon, GpuIcon, LaptopIcon } from './Icons';
import {
  formatCompactNumber,
  formatCurrency,
  getEditorById,
  getGameById,
  getGpuById,
  getLaptopById,
} from '../lib/gameData';
import {
  UploadOutcome,
  executeStudioUpload,
  generateNonceId,
  getUsedStorageGB,
} from '../lib/playerService';
import { soundManager } from '../lib/soundManager';
import type { AppSection, UserProfile, VideoRecord } from '../types';

interface StudioPageProps {
  profile: UserProfile;
  videos: VideoRecord[];
  onRefreshProfile: () => Promise<void>;
  onNavigate: (section: AppSection) => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({
  profile,
  videos,
  onRefreshProfile,
  onNavigate,
}) => {
  const activeLaptop = getLaptopById(profile.inventory.activeLaptopId);
  const activeGpuId = activeLaptop ? profile.inventory.laptopGpus[activeLaptop.id] : undefined;
  const activeGpu = getGpuById(activeGpuId);

  const installedGameSpecs = useMemo(() => {
    return profile.inventory.installedGames
      .map((id) => getGameById(id))
      .filter((g): g is NonNullable<typeof g> => Boolean(g));
  }, [profile.inventory.installedGames]);

  const ownedEditorSpecs = useMemo(() => {
    return profile.inventory.editors
      .map((id) => getEditorById(id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
  }, [profile.inventory.editors]);

  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [selectedEditorId, setSelectedEditorId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState<UploadOutcome | null>(null);

  useEffect(() => {
    if (!selectedGameId && installedGameSpecs.length > 0) {
      setSelectedGameId(installedGameSpecs[0].id);
    } else if (selectedGameId && !installedGameSpecs.some((g) => g.id === selectedGameId)) {
      setSelectedGameId(installedGameSpecs[0]?.id || '');
    }
  }, [installedGameSpecs, selectedGameId]);

  useEffect(() => {
    if (!selectedEditorId && ownedEditorSpecs.length > 0) {
      setSelectedEditorId(ownedEditorSpecs[0].id);
    }
  }, [ownedEditorSpecs, selectedEditorId]);

  const selectedGame = getGameById(selectedGameId);
  const selectedEditor = getEditorById(selectedEditorId);

  const hardwareValidationError = useMemo(() => {
    if (!activeLaptop) return 'Purchase and equip a Geforce laptop in the Store first.';
    if (!activeGpu) return `Install a compatible GPU onto ${activeLaptop.name} in the Store.`;
    if (activeLaptop.tier < activeGpu.minLaptopTier) {
      return `${activeGpu.name} is not compatible with ${activeLaptop.cpu}.`;
    }
    if (installedGameSpecs.length === 0) {
      return 'Purchase and download at least one game onto your laptop in the Store.';
    }
    if (ownedEditorSpecs.length === 0) {
      return 'Purchase at least one Editor (starting with Self-Editing) in the Store.';
    }
    if (!selectedGame) return 'Select an installed game.';
    if (activeLaptop.tier < selectedGame.minLaptopTier) {
      return `${selectedGame.name} requires a higher-tier laptop.`;
    }
    if (activeGpu.tier < selectedGame.minGpuTier) {
      return `${selectedGame.name} requires a higher-tier GPU installed.`;
    }
    if (!selectedEditor) return 'Select an owned editor.';
    return null;
  }, [activeLaptop, activeGpu, installedGameSpecs.length, ownedEditorSpecs.length, selectedGame, selectedEditor]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    setError(null);

    if (hardwareValidationError) {
      soundManager.play('purchaseFailure');
      setError(hardwareValidationError);
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      soundManager.play('purchaseFailure');
      setError('Enter a video title before uploading.');
      return;
    }

    const uploadNonce = generateNonceId('up');
    setUploading(true);
    setProgress(8);
    setLastOutcome(null);
    soundManager.play('uploadStart');

    // Animate deterministic upload progress before committing server-calculated outcome
    let currentPct = 8;
    const timer = window.setInterval(() => {
      currentPct = Math.min(88, currentPct + 16);
      setProgress(currentPct);
    }, 180);

    try {
      const outcome = await executeStudioUpload(
        profile,
        cleanTitle,
        selectedGameId,
        selectedEditorId,
        uploadNonce
      );

      window.clearInterval(timer);
      setProgress(100);
      await onRefreshProfile();

      setLastOutcome(outcome);
      setTitle('');

      if (outcome.newlyUnlockedBadges.length > 0) {
        soundManager.play('badgeUnlock');
      } else if (outcome.newRank !== outcome.previousRank) {
        soundManager.play('rankIncrease');
      } else {
        soundManager.play('uploadComplete');
      }
    } catch (err) {
      window.clearInterval(timer);
      setProgress(0);
      soundManager.play('purchaseFailure');
      setError(err instanceof Error ? err.message : 'Video upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const usedStorage = getUsedStorageGB(profile.inventory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Header & Rig Check */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Creator Studio</h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Produce and upload videos using your active hardware, installed games, and editor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs bg-[#111111] border border-zinc-800 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <LaptopIcon className="w-4 h-4 text-[#FF2020]" />
            <span className="text-white font-medium">{activeLaptop ? activeLaptop.name : 'No Laptop'}</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1.5">
            <GpuIcon className="w-4 h-4 text-[#20D878]" />
            <span className="text-white font-medium">{activeGpu ? activeGpu.name : 'No GPU'}</span>
          </div>
          {activeLaptop && (
            <>
              <span className="text-zinc-700">|</span>
              <span className="font-mono tabular-nums text-[#A0A0A0]">
                {usedStorage}GB / {activeLaptop.storageLabel} used
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Production Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleUpload}
          className="lg:col-span-7 bg-[#171717] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-[#FF2020]" />
              <span>Produce New Video</span>
            </h2>
            {selectedGame && (
              <span className="text-xs font-mono tabular-nums text-[#20D878]">
                {selectedGame.multiplier}x Multiplier
              </span>
            )}
          </div>

          {hardwareValidationError && (
            <div className="p-4 rounded-xl bg-[#111111] border border-[#FF2020]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-zinc-200">
                <AlertCircle className="w-4 h-4 text-[#FF3535] shrink-0 mt-0.5" />
                <span>{hardwareValidationError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  onNavigate('store');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#FF2020] text-white text-xs font-semibold shrink-0"
              >
                Open Store
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-[#FF3535]/10 border border-[#FF3535]/40 flex items-center gap-2.5 text-xs text-[#FF3535]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
              Video Title
            </label>
            <input
              type="text"
              maxLength={100}
              disabled={uploading}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Surviving 100 Days on Max Graphics..."
              className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Installed Game Selector */}
            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5 flex items-center gap-1.5">
                <GamepadIcon className="w-3.5 h-3.5" />
                <span>Installed Game</span>
              </label>
              <select
                disabled={uploading || installedGameSpecs.length === 0}
                value={selectedGameId}
                onChange={(e) => {
                  soundManager.play('click');
                  setSelectedGameId(e.target.value);
                }}
                className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              >
                {installedGameSpecs.length === 0 ? (
                  <option value="">No games installed</option>
                ) : (
                  installedGameSpecs.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.multiplier}x)
                    </option>
                  ))
                )}
              </select>
              {selectedGame && (
                <div className="text-[11px] text-[#A0A0A0] mt-1.5 font-mono tabular-nums">
                  Views: {selectedGame.minViews.toLocaleString('en-US')}–100M · Trend: {selectedGame.trendMinViews.toLocaleString('en-US')}–100M
                </div>
              )}
            </div>

            {/* Owned Editor Selector */}
            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5 flex items-center gap-1.5">
                <EditorIcon className="w-3.5 h-3.5" />
                <span>Editor</span>
              </label>
              <select
                disabled={uploading || ownedEditorSpecs.length === 0}
                value={selectedEditorId}
                onChange={(e) => {
                  soundManager.play('click');
                  setSelectedEditorId(e.target.value);
                }}
                className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              >
                {ownedEditorSpecs.length === 0 ? (
                  <option value="">No editor owned</option>
                ) : (
                  ownedEditorSpecs.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.name} ({ed.highestChance}% High)
                    </option>
                  ))
                )}
              </select>
              {selectedEditor && (
                <div className="text-[11px] text-[#A0A0A0] mt-1.5 font-mono tabular-nums">
                  Lowest: {selectedEditor.lowestChance}% · Highest: {selectedEditor.highestChance}%
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress Bar */}
          {(uploading || progress > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A0A0A0]">
                  {uploading ? 'Rendering and publishing video...' : 'Upload complete'}
                </span>
                <span className="font-mono tabular-nums text-white">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#111111] rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-[#FF2020] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || Boolean(hardwareValidationError)}
            className="w-full py-3.5 px-5 rounded-xl bg-[#FF2020] hover:bg-[#e01b1b] disabled:opacity-45 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? 'Uploading Video...' : 'Upload Video'}</span>
          </button>
        </form>

        {/* Result & Upload Telemetry Card */}
        <div className="lg:col-span-5 bg-[#171717] border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          {lastOutcome ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#20D878]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Video Published</span>
                </div>
                <span className="text-xs font-mono text-[#A0A0A0]">
                  {lastOutcome.video.outcomeTier === 'highest' ? 'Highest Tier Roll' : 'Standard Tier Roll'}
                </span>
              </div>

              <div>
                <div className="text-xs text-[#A0A0A0]">
                  {lastOutcome.video.gameName} · {lastOutcome.video.editorName}
                </div>
                <h3 className="text-xl font-bold text-white mt-1">{lastOutcome.video.title}</h3>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800">
                <div>
                  <div className="text-[11px] text-[#A0A0A0]">Views</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                    {formatCompactNumber(lastOutcome.video.views)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#A0A0A0]">Subscribers</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                    +{lastOutcome.video.subscribersGained.toLocaleString('en-US')}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#A0A0A0]">Earnings</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#20D878] mt-0.5">
                    {formatCurrency(lastOutcome.video.earnings)}
                  </div>
                </div>
              </div>

              {(lastOutcome.newRank !== lastOutcome.previousRank ||
                lastOutcome.newTier !== lastOutcome.previousTier ||
                lastOutcome.newlyUnlockedBadges.length > 0) && (
                <div className="p-4 rounded-xl bg-[#111111] border border-[#FF2020]/50 space-y-1.5 text-xs">
                  {lastOutcome.newRank !== lastOutcome.previousRank && (
                    <div className="text-white">
                      Rank Promoted: <span className="font-bold text-[#FF2020]">{lastOutcome.newRank}</span>
                    </div>
                  )}
                  {lastOutcome.newTier !== lastOutcome.previousTier && (
                    <div className="text-white">
                      Tier Upgraded: <span className="font-bold text-[#20D878]">{lastOutcome.newTier}</span>
                    </div>
                  )}
                  {lastOutcome.newlyUnlockedBadges.length > 0 && (
                    <div className="text-white">
                      Badge Unlocked:{' '}
                      <span className="font-bold text-amber-400">
                        {lastOutcome.newlyUnlockedBadges.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="my-auto text-center space-y-3 py-8">
              <div className="text-sm font-semibold text-white">Ready for Production</div>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Every upload generates a single server-verified result. Subscribers equal floor(views / 10), and revenue equals views × $0.10 × game multiplier.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800 text-[11px] text-[#A0A0A0] flex justify-between font-mono tabular-nums">
            <span>Total Videos: {profile.totalVideos}</span>
            <span>Lifetime Video Revenue: {formatCurrency(profile.lifetimeVideoEarnings)}</span>
          </div>
        </div>
      </div>

      {/* Saved Video History Table */}
      <section className="bg-[#171717] border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-4">Published Video History</h2>
        {videos.length === 0 ? (
          <p className="text-xs text-[#A0A0A0] py-6 text-center">No uploaded videos recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-[#A0A0A0]">
                  <th className="py-2.5 pr-4 font-medium">Title</th>
                  <th className="py-2.5 px-4 font-medium">Game</th>
                  <th className="py-2.5 px-4 font-medium">Editor</th>
                  <th className="py-2.5 px-4 font-medium text-right">Views</th>
                  <th className="py-2.5 px-4 font-medium text-right">Subs</th>
                  <th className="py-2.5 pl-4 font-medium text-right">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {videos.map((v) => (
                  <tr key={v.id} className="hover:bg-[#111111]/60 transition-colors">
                    <td className="py-3 pr-4 font-medium text-white max-w-[260px] truncate">{v.title}</td>
                    <td className="py-3 px-4 text-[#A0A0A0] whitespace-nowrap">{v.gameName}</td>
                    <td className="py-3 px-4 text-[#A0A0A0] whitespace-nowrap">{v.editorName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-white">
                      {v.views.toLocaleString('en-US')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-300">
                      +{v.subscribersGained.toLocaleString('en-US')}
                    </td>
                    <td className="py-3 pl-4 text-right font-mono tabular-nums text-[#20D878] font-semibold">
                      {formatCurrency(v.earnings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
};
