import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { CreatorAvatar, TrophySvgIcon, getRankTextStyle, getTierTextStyle } from './Icons';
import { calculateRank, calculateTier, formatCompactNumber } from '../lib/gameData';
import { fetchGlobalLeaderboard } from '../lib/playerService';
import { soundManager } from '../lib/soundManager';
import type { LeaderboardEntry, UserProfile } from '../types';

interface LeaderboardsPageProps {
  profile: UserProfile;
}

export const LeaderboardsPage: React.FC<LeaderboardsPageProps> = ({ profile }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchGlobalLeaderboard();
      // Guarantee subscriber-only descending sort
      list.sort((a, b) => b.subscribers - a.subscribers);
      setEntries(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load global leaderboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Global Leaderboards
          </h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Live registered creators ranked strictly by total subscriber count.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundManager.play('click');
            void loadLeaderboard();
          }}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#171717] hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#FF3535]/10 border border-[#FF3535]/40 text-xs text-[#FF3535]">
          {error}
        </div>
      )}

      <section className="bg-[#171717] border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="h-12 rounded-xl bg-[#111111] animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#A0A0A0]">
            No registered creator records found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#111111] text-[#A0A0A0]">
                  <th className="py-3.5 px-5 font-medium">Position</th>
                  <th className="py-3.5 px-4 font-medium">Creator</th>
                  <th className="py-3.5 px-4 font-medium text-right">Subscribers</th>
                  <th className="py-3.5 px-4 font-medium">Rank</th>
                  <th className="py-3.5 px-5 font-medium text-right">Tier / Reward Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {entries.map((entry, index) => {
                  const isSelf = entry.uid === profile.uid;
                  const rankDef = calculateRank(entry.subscribers);
                  const tierMatch = entry.tier;
                  const position = index + 1;
                  const rewardLabel =
                    position === 1
                      ? 'Top Creator Crown'
                      : position === 2
                        ? 'Runner-Up Honour'
                        : position === 3
                          ? 'Podium Bronze'
                          : tierMatch;

                  return (
                    <tr
                      key={entry.uid}
                      className={`transition-colors ${
                        isSelf ? 'bg-[#FF2020]/10' : 'hover:bg-[#111111]/60'
                      }`}
                    >
                      <td className="py-3.5 px-5 font-mono tabular-nums font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {position <= 3 && (
                            <TrophySvgIcon
                              className={`w-4 h-4 ${
                                position === 1
                                  ? 'text-amber-400'
                                  : position === 2
                                    ? 'text-zinc-300'
                                    : 'text-amber-700'
                              }`}
                            />
                          )}
                          <span>#{position}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <CreatorAvatar
                            avatarId={entry.avatarId}
                            username={entry.username}
                            size={32}
                          />
                          <div>
                            <div className="font-semibold text-white">
                              {entry.username} {isSelf && <span className="text-[#FF2020] ml-1">(You)</span>}
                            </div>
                            <div className="text-[11px] font-mono text-[#A0A0A0]">
                              {entry.displayId} · {entry.totalVideos} videos
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-white">
                        {formatCompactNumber(entry.subscribers)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold whitespace-nowrap">
                        <span className={getRankTextStyle(rankDef.gradientKey)}>
                          {rankDef.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <span
                          className={
                            position <= 3
                              ? 'text-[#20D878] font-semibold'
                              : getTierTextStyle(calculateTier(0).gradientKey)
                          }
                        >
                          {rewardLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
};
