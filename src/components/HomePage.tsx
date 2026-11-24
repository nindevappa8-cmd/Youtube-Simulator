import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Clapperboard, Film, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import {
  CreatorAvatar,
  CurrencyIcon,
  GamepadIcon,
  GpuIcon,
  LaptopIcon,
  getRankTextStyle,
  getTierTextStyle,
} from './Icons';
import {
  calculateRank,
  calculateTier,
  formatCompactNumber,
  formatCurrency,
  getGpuById,
  getLaptopById,
} from '../lib/gameData';
import { soundManager } from '../lib/soundManager';
import type { AppSection, UserProfile, VideoRecord } from '../types';

interface HomePageProps {
  profile: UserProfile;
  videos: VideoRecord[];
  onNavigate: (section: AppSection) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ profile, videos, onNavigate }) => {
  const rankDef = calculateRank(profile.subscribers);
  const tierDef = calculateTier(profile.totalEarned);
  const activeLaptop = getLaptopById(profile.inventory.activeLaptopId);
  const activeGpu = activeLaptop ? getGpuById(profile.inventory.laptopGpus[activeLaptop.id]) : undefined;

  const lastVideo = videos[0] || null;
  const popularVideos = useMemo(() => {
    return [...videos].sort((a, b) => b.views - a.views).slice(0, 5);
  }, [videos]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Creator Identity & Primary Stats */}
      <section className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <CreatorAvatar avatarId={profile.avatarId} username={profile.username} size={64} />
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#A0A0A0]">
              {profile.displayId} · {profile.email}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {profile.username}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span>
                Rank: <span className={getRankTextStyle(rankDef.gradientKey)}>{rankDef.name}</span>
              </span>
              <span className="text-zinc-600">·</span>
              <span>
                Tier: <span className={getTierTextStyle(tierDef.gradientKey)}>{tierDef.name}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onNavigate('studio');
            }}
            className="px-5 py-2.5 rounded-xl bg-[#FF2020] hover:bg-[#e01b1b] text-white text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
          >
            <Clapperboard className="w-4 h-4" />
            <span>Open Studio</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onNavigate('store');
            }}
            className="px-5 py-2.5 rounded-xl bg-[#171717] hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Hardware Store</span>
          </button>
        </div>
      </section>

      {/* Core 6 Economy & Channel KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
            <span>Spendable Balance</span>
            <CurrencyIcon className="w-4 h-4 text-[#20D878]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
            {formatCurrency(profile.balance)}
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1 font-mono tabular-nums">
            Spent: {formatCurrency(profile.totalSpent)}
          </div>
        </div>

        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
            <span>Subscribers</span>
            <Users className="w-4 h-4 text-[#FF2020]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
            {profile.subscribers.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1">
            Rank: <span className={getRankTextStyle(rankDef.gradientKey)}>{rankDef.name}</span>
          </div>
        </div>

        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
            <span>Total Views</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
            {formatCompactNumber(profile.totalViews)}
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1 font-mono tabular-nums">
            {profile.totalViews.toLocaleString('en-US')} exact
          </div>
        </div>

        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
            <span>Lifetime Earnings</span>
            <CurrencyIcon className="w-4 h-4 text-[#20D878]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#20D878] mt-2">
            {formatCurrency(profile.totalEarned)}
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1">
            Tier: <span className={getTierTextStyle(tierDef.gradientKey)}>{tierDef.name}</span>
          </div>
        </div>

        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
            <span>Total Videos</span>
            <Film className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
            {profile.totalVideos.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1">
            Installed Games: {profile.inventory.installedGames.length}
          </div>
        </div>
      </section>

      {/* Active Studio Rig Summary */}
      <section className="bg-[#111111] border border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <LaptopIcon className="w-4 h-4 text-[#FF2020]" />
            <span className="text-[#A0A0A0]">Active Laptop:</span>
            <span className="font-semibold text-white">
              {activeLaptop ? activeLaptop.name : 'None Equipped'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GpuIcon className="w-4 h-4 text-[#20D878]" />
            <span className="text-[#A0A0A0]">Installed GPU:</span>
            <span className="font-semibold text-white">
              {activeGpu ? activeGpu.name : 'None Installed'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GamepadIcon className="w-4 h-4 text-zinc-400" />
            <span className="text-[#A0A0A0]">Ready Games:</span>
            <span className="font-semibold text-white font-mono tabular-nums">
              {profile.inventory.installedGames.length}
            </span>
          </div>
        </div>
        {(!activeLaptop || !activeGpu || profile.inventory.installedGames.length === 0) && (
          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onNavigate('store');
            }}
            className="text-xs font-semibold text-[#FF2020] hover:underline flex items-center gap-1"
          >
            <span>Complete your creator setup in Store</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </section>

      {/* 3-Column Content Area: Last Video, Popular Videos, Recent Subscribers */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Last Uploaded Video */}
        <div className="lg:col-span-4 bg-[#171717] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-4">Last Uploaded Video</h2>
            {lastVideo ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-[#A0A0A0]">
                    {lastVideo.gameName} · {lastVideo.editorName}
                  </div>
                  <div className="text-lg font-bold text-white mt-1 line-clamp-2">
                    {lastVideo.title}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800">
                  <div>
                    <div className="text-[11px] text-[#A0A0A0]">Views</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-white mt-0.5">
                      {formatCompactNumber(lastVideo.views)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#A0A0A0]">Subs</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-white mt-0.5">
                      +{formatCompactNumber(lastVideo.subscribersGained)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#A0A0A0]">Revenue</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-[#20D878] mt-0.5">
                      {formatCurrency(lastVideo.earnings)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-[#A0A0A0]">
                  No videos uploaded yet. Equip a laptop, GPU, game, and editor to publish your first video.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    onNavigate('studio');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#FF2020] text-white text-xs font-semibold"
                >
                  Go to Studio
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Most Popular Videos */}
        <div className="lg:col-span-5 bg-[#171717] border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4">Most Popular Videos</h2>
          {popularVideos.length > 0 ? (
            <div className="divide-y divide-zinc-800/80">
              {popularVideos.map((vid, idx) => (
                <div key={vid.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {idx + 1}. {vid.title}
                    </div>
                    <div className="text-[11px] text-[#A0A0A0]">
                      {vid.gameName} · +{vid.subscribersGained.toLocaleString('en-US')} subs
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono tabular-nums font-semibold text-white">
                      {formatCompactNumber(vid.views)} views
                    </div>
                    <div className="text-xs font-mono tabular-nums text-[#20D878]">
                      {formatCurrency(vid.earnings)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#A0A0A0] py-8 text-center">
              Your highest-performing uploads will rank here automatically.
            </p>
          )}
        </div>

        {/* Recent Subscribers */}
        <div className="lg:col-span-3 bg-[#171717] border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4">Recent Subscribers</h2>
          {profile.recentSubscribers && profile.recentSubscribers.length > 0 ? (
            <div className="divide-y divide-zinc-800/80">
              {profile.recentSubscribers.slice(0, 6).map((evt, i) => (
                <div key={`${evt.timestamp}-${i}`} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="text-xs font-semibold font-mono tabular-nums text-[#20D878]">
                    +{evt.count.toLocaleString('en-US')} subscribers
                  </div>
                  <div className="text-[11px] text-[#A0A0A0] truncate mt-0.5">
                    From: {evt.videoTitle}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#A0A0A0] py-8 text-center">
              Subscriber gains from your uploaded videos appear here.
            </p>
          )}
        </div>
      </section>
    </motion.div>
  );
};
