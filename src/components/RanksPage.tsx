import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Lock } from 'lucide-react';
import { getRankTextStyle, getTierTextStyle } from './Icons';
import {
  BASE_BADGES,
  RANKS,
  TIERS,
  calculateRank,
  calculateTier,
  calculateUnlockedBadges,
  formatCompactNumber,
  formatCurrency,
} from '../lib/gameData';
import type { UserProfile } from '../types';

interface RanksPageProps {
  profile: UserProfile;
}

export const RanksPage: React.FC<RanksPageProps> = ({ profile }) => {
  const currentRank = calculateRank(profile.subscribers);
  const currentTier = calculateTier(profile.totalEarned);
  const unlockedBadges = calculateUnlockedBadges(profile.subscribers);

  const nextRank = RANKS.find((r) => r.minSubscribers > profile.subscribers) || null;
  const nextTier = TIERS.find((t) => t.minEarnings > profile.totalEarned) || null;
  const nextBadge = BASE_BADGES.find((b) => b.requirement > profile.subscribers) || null;

  const rankPct = nextRank
    ? Math.min(100, Math.round((profile.subscribers / nextRank.minSubscribers) * 100))
    : 100;
  const tierPct = nextTier
    ? Math.min(100, Math.round((profile.totalEarned / nextTier.minEarnings) * 100))
    : 100;

  const nextTasks = [
    !profile.inventory.laptops.includes('geforce-mini-book')
      ? 'Purchase Geforce Mini Book ($1,200) in the Store to unlock hardware upgrades.'
      : null,
    profile.inventory.laptops.length > 0 && profile.inventory.gpus.length === 0
      ? 'Purchase and install a compatible GPU in the Laptop GPU Store.'
      : null,
    profile.inventory.installedGames.length === 0
      ? 'Buy and download a game in the Game Store.'
      : null,
    profile.inventory.editors.length === 0
      ? 'Hire an editor (starting with Self-Editing) in the Editor Store.'
      : null,
    nextRank
      ? `Gain ${(nextRank.minSubscribers - profile.subscribers).toLocaleString('en-US')} more subscribers to unlock ${nextRank.name}.`
      : 'Maximum Subscriber Rank achieved.',
    nextTier
      ? `Earn ${formatCurrency(nextTier.minEarnings - profile.totalEarned)} more in lifetime video revenue to reach ${nextTier.name} tier.`
      : 'Goat lifetime earnings tier achieved.',
    nextBadge
      ? `Reach ${formatCompactNumber(nextBadge.requirement)} subscribers to unlock the ${nextBadge.label} creator badge.`
      : '1B Subscriber Badge unlocked.',
  ].filter((t): t is string => Boolean(t));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Ranks, Tiers & Milestones
        </h1>
        <p className="text-xs text-[#A0A0A0] mt-1">
          Ranks depend strictly on subscribers. Tiers depend strictly on cumulative lifetime earnings.
        </p>
      </div>

      {/* Next Tasks & Active Milestones */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Active Milestones</h2>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#A0A0A0]">
                  Rank Progress: <span className={`font-semibold ${getRankTextStyle(currentRank.gradientKey)}`}>{currentRank.name}</span>
                </span>
                <span className="font-mono tabular-nums text-white">
                  {nextRank
                    ? `${formatCompactNumber(profile.subscribers)} / ${formatCompactNumber(nextRank.minSubscribers)} (${rankPct}%)`
                    : 'Max Rank (100%)'}
                </span>
              </div>
              <div className="h-2 bg-[#111111] rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-[#FF2020]" style={{ width: `${rankPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#A0A0A0]">
                  Tier Progress: <span className={`font-semibold ${getTierTextStyle(currentTier.gradientKey)}`}>{currentTier.name}</span>
                </span>
                <span className="font-mono tabular-nums text-[#20D878]">
                  {nextTier
                    ? `${formatCurrency(profile.totalEarned)} / ${formatCurrency(nextTier.minEarnings)} (${tierPct}%)`
                    : 'Goat Tier (100%)'}
                </span>
              </div>
              <div className="h-2 bg-[#111111] rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-[#20D878]" style={{ width: `${tierPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-bold text-white">Next Tasks</h2>
          <ul className="space-y-2 text-xs text-zinc-200">
            {nextTasks.map((task, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-mono text-[#FF2020] font-semibold">0{idx + 1}.</span>
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Subscriber Ranks (All 17 Levels) */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Subscriber Ranks (17 Levels)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {RANKS.map((rank) => {
            const unlocked = profile.subscribers >= rank.minSubscribers;
            const isCurrent = currentRank.name === rank.name;
            return (
              <div
                key={rank.name}
                className={`rounded-2xl p-4 flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'border-grad-selected'
                    : unlocked
                      ? 'bg-[#171717] border border-zinc-700'
                      : 'bg-[#111111] border border-zinc-800/80 opacity-65'
                }`}
              >
                <div>
                  <div className={`text-sm font-bold ${getRankTextStyle(rank.gradientKey)}`}>
                    {rank.name}
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-[#A0A0A0] mt-0.5">
                    {rank.minSubscribers.toLocaleString('en-US')} subscribers
                  </div>
                </div>
                {unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-[#20D878] shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Lifetime Earnings Tiers (All 9 Levels) */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Lifetime Earnings Tiers (9 Levels)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {TIERS.map((tier) => {
            const unlocked = profile.totalEarned >= tier.minEarnings;
            const isCurrent = currentTier.name === tier.name;
            return (
              <div
                key={tier.name}
                className={`rounded-2xl p-4 flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'border-grad-selected'
                    : unlocked
                      ? 'bg-[#171717] border border-zinc-700'
                      : 'bg-[#111111] border border-zinc-800/80 opacity-65'
                }`}
              >
                <div>
                  <div className={`text-sm font-bold ${getTierTextStyle(tier.gradientKey)}`}>
                    {tier.name}
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-[#A0A0A0] mt-0.5">
                    {formatCurrency(tier.minEarnings)} lifetime earnings
                  </div>
                </div>
                {unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-[#20D878] shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Subscriber Milestone Badges */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Creator Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3.5">
          {BASE_BADGES.map((badge) => {
            const unlocked = unlockedBadges.includes(badge.id);
            const appearanceClass =
              badge.appearance === 'bronze'
                ? 'text-amber-600'
                : badge.appearance === 'silver'
                  ? 'text-zinc-300'
                  : badge.appearance === 'gold'
                    ? 'text-amber-400'
                    : badge.appearance === 'diamond'
                      ? 'text-cyan-300'
                      : badge.appearance === 'purple-yellow'
                        ? 'bg-gradient-to-r from-purple-400 to-amber-300 bg-clip-text text-transparent'
                        : 'text-white';

            return (
              <div
                key={badge.id}
                className={`rounded-2xl p-4 text-center space-y-1.5 ${
                  unlocked
                    ? 'bg-[#171717] border border-zinc-700'
                    : 'bg-[#111111] border border-zinc-800/80 opacity-55'
                }`}
              >
                <div className={`text-lg font-extrabold font-mono ${appearanceClass}`}>
                  {badge.label}
                </div>
                <div className="text-[10px] font-mono tabular-nums text-[#A0A0A0]">
                  {formatCompactNumber(badge.requirement)} subs
                </div>
                <div className="text-[10px] font-semibold">
                  {unlocked ? (
                    <span className="text-[#20D878]">Unlocked</span>
                  ) : (
                    <span className="text-zinc-500">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
};
