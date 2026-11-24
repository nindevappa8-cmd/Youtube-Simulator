import React from 'react';
import {
  Award,
  BarChart3,
  Clapperboard,
  Home,
  ShoppingBag,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BrandLogoMark, CreatorAvatar } from './Icons';
import { formatCurrency } from '../lib/gameData';
import { soundManager } from '../lib/soundManager';
import type { AppSection, UserProfile } from '../types';

interface NavbarProps {
  profile: UserProfile;
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const NAV_ITEMS: { id: AppSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Homepage', icon: Home },
  { id: 'studio', label: 'Studio', icon: Clapperboard },
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'leaderboards', label: 'Leaderboards', icon: BarChart3 },
  { id: 'ranks', label: 'Ranks', icon: Award },
];

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeSection,
  onNavigate,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#080808]/95 border-b border-zinc-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          type="button"
          onClick={() => {
            soundManager.play('click');
            onNavigate('home');
          }}
          className="flex items-center gap-2.5 shrink-0 text-left"
        >
          <BrandLogoMark size={28} />
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            YouTube Studio
          </span>
        </button>

        {/* Desktop 6-section navigation */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  onNavigate(item.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#FF2020] text-white'
                    : 'text-[#A0A0A0] hover:text-white hover:bg-[#171717]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Balance, Sound & Profile Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-[#111111] border border-zinc-800 text-xs font-mono tabular-nums font-semibold text-[#20D878] whitespace-nowrap">
            {formatCurrency(profile.balance)}
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-[#111111] border border-zinc-800 text-[#A0A0A0] hover:text-white transition-colors"
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onNavigate('profile');
            }}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl bg-[#111111] border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <CreatorAvatar avatarId={profile.avatarId} username={profile.username} size={26} />
            <span className="hidden sm:inline text-xs font-medium text-white max-w-[100px] truncate">
              {profile.username}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Navigation Bar */}
      <nav
        className="lg:hidden border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around gap-1 overflow-x-auto"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                soundManager.play('click');
                onNavigate(item.id);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                active ? 'bg-[#FF2020] text-white' : 'text-[#A0A0A0] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
