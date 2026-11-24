import React from 'react';
import type { Rarity } from '../lib/gameData';

export const AVATAR_OPTIONS = [
  { id: 'avatar-red', label: 'Crimson Core', primary: '#FF2020', secondary: '#1A0505' },
  { id: 'avatar-obsidian', label: 'Obsidian Blade', primary: '#E5E7EB', secondary: '#18181B' },
  { id: 'avatar-gold', label: 'Apex Gold', primary: '#F59E0B', secondary: '#271A06' },
  { id: 'avatar-emerald', label: 'Signal Mint', primary: '#20D878', secondary: '#062817' },
  { id: 'avatar-cobalt', label: 'Studio Cobalt', primary: '#38BDF8', secondary: '#082032' },
  { id: 'avatar-violet', label: 'Royal Prism', primary: '#A855F7', secondary: '#1E0B36' },
];

export function CreatorAvatar({
  avatarId,
  username,
  size = 40,
  className = '',
}: {
  avatarId: string;
  username: string;
  size?: number;
  className?: string;
}) {
  const preset = AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];
  const initial = (username || 'C').trim().charAt(0).toUpperCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`shrink-0 rounded-xl ${className}`}
      aria-label={`${username} avatar`}
    >
      <defs>
        <linearGradient id={`grad-${preset.id}-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={preset.primary} stopOpacity="0.28" />
          <stop offset="100%" stopColor={preset.secondary} stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#grad-${preset.id}-${size})`} />
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="11"
        fill="none"
        stroke={preset.primary}
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <path
        d="M10 38 L24 10 L38 38"
        fill="none"
        stroke={preset.primary}
        strokeOpacity="0.2"
        strokeWidth="2"
      />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Outfit, sans-serif"
        fontWeight="700"
        fontSize="19"
      >
        {initial}
      </text>
    </svg>
  );
}

export function BrandLogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#141414" stroke="#FF2020" strokeWidth="1.5" />
      <polygon points="12,9.5 23.5,16 12,22.5" fill="#FF2020" />
    </svg>
  );
}

export function LaptopIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="11" rx="1.5" />
      <path d="M2 18h20l-1.5 2H3.5L2 18z" />
    </svg>
  );
}

export function GpuIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="9" cy="12" r="2.75" />
      <circle cx="15.5" cy="12" r="2.25" />
      <path d="M6 18v2M10 18v2M14 18v2" />
    </svg>
  );
}

export function GamepadIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="7" width="19" height="10" rx="4" />
      <path d="M7.5 10v4M5.5 12h4" />
      <circle cx="15.5" cy="11" r="0.8" fill="currentColor" />
      <circle cx="17.5" cy="13" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function EditorIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 4v16M14 14l3 2-3 2v-4z" />
    </svg>
  );
}

export function CurrencyIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5v11M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 1.8 3 2.2 3 1.1 3 2.3-1.3 2-3 2-3-.9-3-2" />
    </svg>
  );
}

export function TrophySvgIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v5M8 20h8" />
    </svg>
  );
}

export function LaptopBlueprintPreview({
  laptopId,
  accentColor,
  bodyColor,
}: {
  laptopId: string;
  accentColor: string;
  bodyColor: string;
}) {
  const isMini = laptopId.includes('mini');
  const isPro = laptopId.includes('pro') || laptopId.includes('gaming');
  const isMaxed = laptopId === 'geforce-maxed-gaming';
  const screenInset = isMini ? 14 : laptopId === 'geforce-book' ? 9 : 6;

  return (
    <svg viewBox="0 0 240 130" className="w-full h-32 select-none" aria-hidden="true">
      <defs>
        <linearGradient id={`scr-${laptopId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor="#09090b" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* Lid casing */}
      <rect
        x={isMini ? 48 : 34}
        y="12"
        width={isMini ? 144 : 172}
        height="74"
        rx="6"
        fill={isMaxed ? '#d4d4d8' : bodyColor}
        stroke={accentColor}
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      {/* Screen */}
      <rect
        x={(isMini ? 48 : 34) + screenInset}
        y={12 + screenInset * 0.65}
        width={(isMini ? 144 : 172) - screenInset * 2}
        height={74 - screenInset * 1.3}
        rx="3"
        fill={`url(#scr-${laptopId})`}
      />
      {/* Screen UI line */}
      <rect
        x={(isMini ? 48 : 34) + screenInset + 10}
        y={32}
        width={48}
        height="4"
        rx="2"
        fill={accentColor}
        fillOpacity="0.8"
      />
      <rect
        x={(isMini ? 48 : 34) + screenInset + 10}
        y={41}
        width={80}
        height="3"
        rx="1.5"
        fill="#FFFFFF"
        fillOpacity="0.25"
      />
      {/* Hinge */}
      <rect x="66" y="85" width="108" height="4" rx="2" fill="#09090b" />
      {/* Thick keyboard base */}
      <polygon
        points={
          isMini
            ? '42,89 198,89 212,114 28,114'
            : '28,89 212,89 226,114 14,114'
        }
        fill={isMaxed ? '#e4e4e7' : '#18181b'}
        stroke={accentColor}
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      {/* Front thickness lip */}
      <rect
        x={isMini ? 28 : 14}
        y="114"
        width={isMini ? 184 : 212}
        height={isMini ? 8 : 6}
        rx="2"
        fill="#0f0f12"
      />
      {/* RGB / Trim bar */}
      {isPro && (
        <rect
          x="52"
          y="115.5"
          width="136"
          height="2"
          rx="1"
          fill={accentColor}
          fillOpacity="0.85"
        />
      )}
      {/* Trackpad */}
      <rect
        x="98"
        y="102"
        width="44"
        height="9"
        rx="2"
        fill={isMaxed ? '#a1a1aa' : '#27272a'}
      />
    </svg>
  );
}

export function getRarityBorderClass(rarity: Rarity, isSelected = false): string {
  if (isSelected) return 'border-grad-selected';
  switch (rarity) {
    case 'Legendary':
      return 'border-grad-legendary';
    case 'Mythic':
      return 'border-grad-mythic';
    case 'Prismatic':
    case 'Secret':
    case 'Super-Secret':
    case 'Super Secret':
      return 'border-grad-special';
    default:
      return 'border border-zinc-800';
  }
}

export function getRarityTextClass(rarity: Rarity): string {
  switch (rarity) {
    case 'Uncommon':
      return 'text-zinc-300';
    case 'Common':
      return 'text-emerald-400';
    case 'Rare':
      return 'text-sky-400';
    case 'Epic':
      return 'text-purple-400';
    case 'Legendary':
      return 'text-amber-400';
    case 'Mythic':
      return 'text-[#FF2020]';
    case 'Prismatic':
      return 'rank-rainbow font-semibold';
    case 'Secret':
    case 'Super-Secret':
    case 'Super Secret':
      return 'text-white font-semibold';
    default:
      return 'text-zinc-300';
  }
}

export function getRankTextStyle(gradientKey: string): string {
  switch (gradientKey) {
    case 'white':
      return 'text-white';
    case 'brown':
      return 'text-amber-600';
    case 'silver':
      return 'text-zinc-300';
    case 'gold':
      return 'text-amber-400';
    case 'diamond':
      return 'text-cyan-300';
    case 'purple-yellow':
      return 'bg-gradient-to-r from-purple-400 to-amber-300 bg-clip-text text-transparent';
    case 'rainbow':
      return 'rank-rainbow';
    default:
      return 'text-white';
  }
}

export function getTierTextStyle(gradientKey: string): string {
  switch (gradientKey) {
    case 'brown':
      return 'text-amber-700';
    case 'yellow':
      return 'text-yellow-400';
    case 'green':
      return 'text-[#20D878]';
    case 'orange':
      return 'text-orange-400';
    case 'blue':
      return 'text-sky-400';
    case 'gold':
      return 'text-amber-300';
    case 'red-black':
      return 'bg-gradient-to-r from-[#FF2020] to-zinc-300 bg-clip-text text-transparent';
    case 'rainbow':
      return 'rank-rainbow';
    case 'black-white':
      return 'bg-gradient-to-r from-white via-zinc-400 to-white bg-clip-text text-transparent';
    default:
      return 'text-zinc-300';
  }
}
