import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Clock, Download, HardDrive, Lock, Trash2 } from 'lucide-react';
import {
  EditorIcon,
  GamepadIcon,
  GpuIcon,
  LaptopBlueprintPreview,
  LaptopIcon,
  getRarityBorderClass,
  getRarityTextClass,
} from './Icons';
import { Laptop3DViewer } from './Laptop3DViewer';
import {
  EDITORS,
  GAMES,
  GPUS,
  LAPTOPS,
  SETUP_COMING_SOON_CATEGORIES,
  formatCurrency,
  getGameById,
  getGpuById,
  getLaptopById,
} from '../lib/gameData';
import {
  equipLaptop,
  getUsedStorageGB,
  installGpuOnActiveLaptop,
  installOwnedGame,
  purchaseStoreItem,
  uninstallOwnedGame,
} from '../lib/playerService';
import { soundManager } from '../lib/soundManager';
import type { MarketStockState, StoreCategory, UserProfile } from '../types';

interface StorePageProps {
  profile: UserProfile;
  marketStock: MarketStockState | null;
  onRefreshProfile: () => Promise<void>;
  onRefreshStock: () => Promise<void>;
}

const CATEGORIES: { id: StoreCategory; label: string }[] = [
  { id: 'laptops', label: 'Laptops' },
  { id: 'gpus', label: 'Laptop GPUs' },
  { id: 'games', label: 'Games' },
  { id: 'editors', label: 'Editors' },
  { id: 'setup', label: 'Setup' },
];

export const StorePage: React.FC<StorePageProps> = ({
  profile,
  marketStock,
  onRefreshProfile,
  onRefreshStock,
}) => {
  const [activeCategory, setActiveCategory] = useState<StoreCategory>('laptops');
  const [inspectLaptopId, setInspectLaptopId] = useState<string>(
    profile.inventory.activeLaptopId || LAPTOPS[0].id
  );
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(180);

  useEffect(() => {
    if (!marketStock) return;
    const updateTimer = () => {
      const remainingMs = Math.max(0, marketStock.nextRefreshAt - Date.now());
      const sec = Math.ceil(remainingMs / 1000);
      setSecondsLeft(sec);
      if (remainingMs <= 0) {
        void onRefreshStock();
      }
    };
    updateTimer();
    const id = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(id);
  }, [marketStock, onRefreshStock]);

  const formatCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const inspectedLaptop = getLaptopById(inspectLaptopId) || LAPTOPS[0];
  const activeLaptop = getLaptopById(profile.inventory.activeLaptopId);
  const activeGpu = activeLaptop ? getGpuById(profile.inventory.laptopGpus[activeLaptop.id]) : undefined;
  const usedStorage = getUsedStorageGB(profile.inventory);
  const hasMiniBook = profile.inventory.laptops.includes('geforce-mini-book');
  const highestOwnedLaptopTier = profile.inventory.laptops.reduce((max, lid) => {
    const l = getLaptopById(lid);
    return l && l.tier > max ? l.tier : max;
  }, -1);

  const handleBuy = async (category: Exclude<StoreCategory, 'setup'>, itemId: string, itemName: string) => {
    if (busyItemId) return;
    soundManager.play('click');
    setBusyItemId(itemId);
    setFeedback(null);
    try {
      const result = await purchaseStoreItem(profile, category, itemId);
      await onRefreshProfile();
      soundManager.play('purchaseSuccess');

      if (category === 'laptops') {
        setInspectLaptopId(itemId);
        setFeedback({
          type: 'success',
          text: `Purchased ${itemName} for ${formatCurrency(result.price)}. Redirected to Laptop GPU Store to equip a compatible GPU.`,
        });
        setActiveCategory('gpus');
      } else {
        setFeedback({
          type: 'success',
          text: `Purchased ${itemName} for ${formatCurrency(result.price)}${
            result.autoInstalledGpu ? ' and installed on your active laptop.' : '.'
          }`,
        });
      }
    } catch (err) {
      soundManager.play('purchaseFailure');
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Purchase failed.',
      });
    } finally {
      setBusyItemId(null);
    }
  };

  const handleEquipLaptop = async (laptopId: string, name: string) => {
    if (busyItemId) return;
    soundManager.play('click');
    setBusyItemId(laptopId);
    setFeedback(null);
    try {
      await equipLaptop(profile.uid, laptopId);
      await onRefreshProfile();
      setInspectLaptopId(laptopId);
      soundManager.play('purchaseSuccess');
      setFeedback({ type: 'success', text: `Equipped ${name} as your active studio laptop.` });
    } catch (err) {
      soundManager.play('purchaseFailure');
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to equip laptop.' });
    } finally {
      setBusyItemId(null);
    }
  };

  const handleInstallGpu = async (gpuId: string, name: string) => {
    if (busyItemId) return;
    soundManager.play('click');
    setBusyItemId(gpuId);
    setFeedback(null);
    try {
      await installGpuOnActiveLaptop(profile.uid, gpuId);
      await onRefreshProfile();
      soundManager.play('purchaseSuccess');
      setFeedback({
        type: 'success',
        text: `Installed ${name} onto ${activeLaptop?.name || 'active laptop'}.`,
      });
    } catch (err) {
      soundManager.play('purchaseFailure');
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'GPU installation failed.' });
    } finally {
      setBusyItemId(null);
    }
  };

  const handleInstallGame = async (gameId: string, name: string) => {
    if (busyItemId) return;
    soundManager.play('click');
    setBusyItemId(gameId);
    setFeedback(null);
    try {
      await installOwnedGame(profile.uid, gameId);
      await onRefreshProfile();
      soundManager.play('purchaseSuccess');
      setFeedback({ type: 'success', text: `Downloaded and installed ${name}.` });
    } catch (err) {
      soundManager.play('purchaseFailure');
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Download failed.' });
    } finally {
      setBusyItemId(null);
    }
  };

  const handleUninstallGame = async (gameId: string, name: string) => {
    if (busyItemId) return;
    soundManager.play('click');
    setBusyItemId(gameId);
    setFeedback(null);
    try {
      await uninstallOwnedGame(profile.uid, gameId);
      await onRefreshProfile();
      setFeedback({
        type: 'success',
        text: `Uninstalled ${name} to free storage. You retain permanent ownership and can reinstall anytime.`,
      });
    } catch (err) {
      soundManager.play('purchaseFailure');
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Uninstall failed.' });
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Store Header & Persistent Stock Countdown */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Creator Store</h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            All hardware, GPUs, games, and editors appear below. Market stock rolls independently every 3 minutes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#111111] border border-zinc-800 flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4 text-[#FF2020]" />
            <span className="text-[#A0A0A0]">Stock Refresh:</span>
            <span className="font-mono tabular-nums font-bold text-white">
              {formatCountdown(secondsLeft)}
            </span>
          </div>

          {activeLaptop && (
            <div className="px-4 py-2 rounded-xl bg-[#111111] border border-zinc-800 flex items-center gap-2 text-xs">
              <HardDrive className="w-4 h-4 text-[#20D878]" />
              <span className="text-[#A0A0A0]">Storage:</span>
              <span className="font-mono tabular-nums font-semibold text-white">
                {usedStorage}GB / {activeLaptop.storageLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-[#111111] border border-zinc-800 rounded-2xl overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              soundManager.play('click');
              setActiveCategory(cat.id);
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === cat.id
                ? 'bg-[#FF2020] text-white'
                : 'text-[#A0A0A0] hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Action Feedback Banner */}
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
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* LAPTOPS TAB */}
      {activeCategory === 'laptops' && (
        <div className="space-y-6">
          {/* Interactive 3D Hardware Inspection Stage */}
          <Laptop3DViewer laptop={inspectedLaptop} heightClass="h-[360px]" />

          {!hasMiniBook && (
            <div className="p-4 rounded-xl bg-[#111111] border border-[#FF2020]/40 text-xs text-zinc-200 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[#FF2020] shrink-0" />
              <span>
                Starter Requirement: Purchase <strong className="text-white">Geforce Mini Book</strong> ($1,200) before unlocking any other Geforce laptop.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {LAPTOPS.map((laptop) => {
              const inStock = marketStock ? Boolean(marketStock.stock.laptops[laptop.id]) : true;
              const owned = profile.inventory.laptops.includes(laptop.id);
              const isEquipped = profile.inventory.activeLaptopId === laptop.id;
              const lockedByStarter = !hasMiniBook && laptop.id !== 'geforce-mini-book';
              const affordable = profile.balance >= laptop.price;
              const isInspected = inspectLaptopId === laptop.id;

              return (
                <div
                  key={laptop.id}
                  className={`rounded-2xl p-5 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 ${getRarityBorderClass(
                    laptop.rarity,
                    isEquipped || isInspected
                  )}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={getRarityTextClass(laptop.rarity)}>{laptop.rarity}</span>
                      <span className="font-mono tabular-nums text-[#A0A0A0]">
                        {laptop.stockChance}% stock
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.play('click');
                        setInspectLaptopId(laptop.id);
                      }}
                      className="w-full bg-[#111111] rounded-xl p-2 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                      title="Inspect in 3D Stage"
                    >
                      <LaptopBlueprintPreview
                        laptopId={laptop.id}
                        accentColor={laptop.chassisStyle.accentColor}
                        bodyColor={laptop.chassisStyle.bodyColor}
                      />
                    </button>

                    <div>
                      <h3 className="text-base font-bold text-white flex items-center justify-between gap-2">
                        <span>{laptop.name}</span>
                        <LaptopIcon className="w-4 h-4 text-[#A0A0A0] shrink-0" />
                      </h3>
                      <p className="text-[11px] text-[#A0A0A0] mt-1 leading-relaxed">
                        {laptop.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-2 border-t border-zinc-800/80">
                      <div className="text-[#A0A0A0]">Storage: <span className="text-white font-mono">{laptop.storageLabel}</span></div>
                      <div className="text-[#A0A0A0]">Memory: <span className="text-white font-mono">{laptop.ramLabel}</span></div>
                      <div className="text-[#A0A0A0]">CPU: <span className="text-white">{laptop.cpu}</span></div>
                      <div className="text-[#A0A0A0]">Cam: <span className="text-white font-mono">{laptop.cameraLabel}</span></div>
                      <div className="col-span-2 text-[#A0A0A0]">OS: <span className="text-white">{laptop.os}</span></div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-base font-bold font-mono tabular-nums text-white">
                        {formatCurrency(laptop.price)}
                      </div>
                      <div className={`text-[11px] ${inStock ? 'text-[#20D878]' : 'text-[#FF3535]'}`}>
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.play('click');
                          setInspectLaptopId(laptop.id);
                        }}
                        className="px-2.5 py-2 rounded-xl bg-[#111111] border border-zinc-700 text-[11px] font-medium text-zinc-200 hover:text-white"
                      >
                        3D
                      </button>

                      {owned ? (
                        <button
                          type="button"
                          disabled={isEquipped || busyItemId === laptop.id}
                          onClick={() => handleEquipLaptop(laptop.id, laptop.name)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-transform active:scale-95 ${
                            isEquipped
                              ? 'bg-[#20D878]/20 text-[#20D878] border border-[#20D878]/40 cursor-default'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                          }`}
                        >
                          {isEquipped ? 'Equipped' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            !inStock ||
                            lockedByStarter ||
                            !affordable ||
                            busyItemId === laptop.id
                          }
                          onClick={() => handleBuy('laptops', laptop.id, laptop.name)}
                          className="px-3.5 py-2 rounded-xl bg-[#FF2020] hover:bg-[#e01b1b] disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold transition-transform active:scale-95 whitespace-nowrap"
                        >
                          {busyItemId === laptop.id
                            ? 'Buying...'
                            : lockedByStarter
                              ? 'Locked'
                              : !inStock
                                ? 'Sold Out'
                                : !affordable
                                  ? 'Low Funds'
                                  : 'Buy'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LAPTOP GPUs TAB */}
      {activeCategory === 'gpus' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#111111] border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[#A0A0A0]">Active Laptop CPU: </span>
              <span className="font-semibold text-white">
                {activeLaptop ? `${activeLaptop.name} (${activeLaptop.cpu})` : 'No laptop owned or equipped'}
              </span>
            </div>
            <div>
              <span className="text-[#A0A0A0]">Currently Installed GPU: </span>
              <span className="font-semibold text-[#20D878]">
                {activeGpu ? activeGpu.name : 'None'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {GPUS.map((gpu) => {
              const inStock = marketStock ? Boolean(marketStock.stock.gpus[gpu.id]) : true;
              const owned = profile.inventory.gpus.includes(gpu.id);
              const installedOnActive = activeGpu?.id === gpu.id;
              const cpuCompatibleForPurchase = highestOwnedLaptopTier >= gpu.minLaptopTier;
              const cpuCompatibleForActive = activeLaptop ? activeLaptop.tier >= gpu.minLaptopTier : false;
              const affordable = profile.balance >= gpu.price;

              return (
                <div
                  key={gpu.id}
                  className={`rounded-2xl p-5 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 ${getRarityBorderClass(
                    gpu.rarity,
                    installedOnActive
                  )}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={getRarityTextClass(gpu.rarity)}>{gpu.rarity}</span>
                      <span className="font-mono tabular-nums text-[#A0A0A0]">{gpu.stockChance}% stock</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">{gpu.name}</h3>
                      <GpuIcon className="w-5 h-5 text-[#FF2020]" />
                    </div>

                    <p className="text-xs text-[#A0A0A0] leading-relaxed">{gpu.description}</p>

                    <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-[11px]">
                      <div className="text-[#A0A0A0]">
                        VRAM / Clock: <span className="text-white font-mono">{gpu.vramLabel} · {gpu.clockLabel}</span>
                      </div>
                      <div className={cpuCompatibleForPurchase ? 'text-[#20D878]' : 'text-[#FF3535]'}>
                        CPU Requirement: {gpu.requiredCpuLabel}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-base font-bold font-mono tabular-nums text-white">
                        {formatCurrency(gpu.price)}
                      </div>
                      <div className={`text-[11px] ${inStock ? 'text-[#20D878]' : 'text-[#FF3535]'}`}>
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </div>

                    {owned ? (
                      <button
                        type="button"
                        disabled={installedOnActive || !cpuCompatibleForActive || busyItemId === gpu.id}
                        onClick={() => handleInstallGpu(gpu.id, gpu.name)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-transform active:scale-95 ${
                          installedOnActive
                            ? 'bg-[#20D878]/20 text-[#20D878] border border-[#20D878]/40 cursor-default'
                            : cpuCompatibleForActive
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                              : 'bg-zinc-900 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {installedOnActive
                          ? 'Installed'
                          : cpuCompatibleForActive
                            ? 'Install on Laptop'
                            : 'CPU Incompatible'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          !inStock ||
                          !cpuCompatibleForPurchase ||
                          !affordable ||
                          busyItemId === gpu.id
                        }
                        onClick={() => handleBuy('gpus', gpu.id, gpu.name)}
                        className="px-4 py-2 rounded-xl bg-[#FF2020] hover:bg-[#e01b1b] disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold transition-transform active:scale-95"
                      >
                        {busyItemId === gpu.id
                          ? 'Buying...'
                          : !cpuCompatibleForPurchase
                            ? 'Incompatible CPU'
                            : !inStock
                              ? 'Sold Out'
                              : !affordable
                                ? 'Low Funds'
                                : 'Buy GPU'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GAMES TAB */}
      {activeCategory === 'games' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {GAMES.map((game) => {
            const inStock = marketStock ? Boolean(marketStock.stock.games[game.id]) : true;
            const owned = profile.inventory.games.includes(game.id);
            const installed = profile.inventory.installedGames.includes(game.id);
            const affordable = profile.balance >= game.price;
            const reqLaptop = LAPTOPS.find((l) => l.tier === game.minLaptopTier);
            const reqGpu = GPUS.find((g) => g.tier === game.minGpuTier);
            const missingPrereqGame = game.requiresGameId && !profile.inventory.games.includes(game.requiresGameId);

            const laptopOk = activeLaptop ? activeLaptop.tier >= game.minLaptopTier : false;
            const gpuOk = activeGpu ? activeGpu.tier >= game.minGpuTier : false;
            const freeStorage = activeLaptop ? activeLaptop.storageGB - usedStorage : 0;
            const storageOk = freeStorage >= game.storageGB;

            return (
              <div
                key={game.id}
                className={`rounded-2xl p-5 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 ${getRarityBorderClass(
                  game.rarity,
                  installed
                )}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={getRarityTextClass(game.rarity)}>{game.rarity}</span>
                    <span className="font-mono tabular-nums text-[#20D878] font-semibold">
                      {game.multiplier}x Earnings · {game.stockChance}% stock
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{game.name}</h3>
                    <GamepadIcon className="w-5 h-5 text-[#FF2020]" />
                  </div>

                  <p className="text-xs text-[#A0A0A0] leading-relaxed">{game.description}</p>

                  <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-[11px]">
                    <div className="text-[#A0A0A0]">
                      Size: <span className="text-white font-mono">{game.storageLabel}</span> · Views: <span className="text-white font-mono">{game.minViews.toLocaleString('en-US')}–100M</span>
                    </div>
                    <div className="text-[#A0A0A0]">
                      Trend Range: <span className="text-white font-mono">{game.trendMinViews.toLocaleString('en-US')}–100M</span>
                    </div>
                    <div className="text-[#A0A0A0]">
                      Min Hardware: <span className="text-white">{reqLaptop?.name} + {reqGpu?.name}</span>
                    </div>
                    {game.requiresGameId && (
                      <div className={missingPrereqGame ? 'text-[#FF3535]' : 'text-[#20D878]'}>
                        Requires: {getGameById(game.requiresGameId)?.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-bold font-mono tabular-nums text-white">
                      {formatCurrency(game.price)}
                      {game.isUpgrade ? <span className="text-[11px] text-[#A0A0A0] font-sans ml-1">Upgrade</span> : null}
                    </div>
                    <div className={`text-[11px] ${owned ? 'text-[#20D878]' : inStock ? 'text-[#20D878]' : 'text-[#FF3535]'}`}>
                      {owned ? (installed ? 'Installed' : 'Owned (Not Downloaded)') : inStock ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </div>

                  {owned ? (
                    installed ? (
                      <button
                        type="button"
                        disabled={busyItemId === game.id}
                        onClick={() => handleUninstallGame(game.id, game.name)}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Uninstall</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!laptopOk || !gpuOk || !storageOk || busyItemId === game.id}
                        onClick={() => handleInstallGame(game.id, game.name)}
                        className="px-3.5 py-2 rounded-xl bg-[#20D878] hover:bg-[#1bc26b] disabled:bg-zinc-800 disabled:text-zinc-500 text-black text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {!laptopOk || !gpuOk
                            ? 'Upgrade Rig'
                            : !storageOk
                              ? 'Low Storage'
                              : 'Download'}
                        </span>
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={
                        !inStock ||
                        Boolean(missingPrereqGame) ||
                        !activeLaptop ||
                        !activeGpu ||
                        !affordable ||
                        busyItemId === game.id
                      }
                      onClick={() => handleBuy('games', game.id, game.name)}
                      className="px-4 py-2 rounded-xl bg-[#FF2020] hover:bg-[#e01b1b] disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold transition-transform active:scale-95"
                    >
                      {busyItemId === game.id
                        ? 'Buying...'
                        : !activeLaptop || !activeGpu
                          ? 'Need Rig'
                          : missingPrereqGame
                            ? 'Need Base Game'
                            : !inStock
                              ? 'Sold Out'
                              : !affordable
                                ? 'Low Funds'
                                : 'Buy Game'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDITORS TAB */}
      {activeCategory === 'editors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {EDITORS.map((ed) => {
            const owned = profile.inventory.editors.includes(ed.id);
            const affordable = profile.balance >= ed.price;

            return (
              <div
                key={ed.id}
                className={`rounded-2xl p-5 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 ${getRarityBorderClass(
                  ed.rarity,
                  owned
                )}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={getRarityTextClass(ed.rarity)}>{ed.rarity}</span>
                    <span className="font-mono tabular-nums text-[#20D878]">100% Available</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{ed.name}</h3>
                    <EditorIcon className="w-5 h-5 text-[#FF2020]" />
                  </div>

                  <p className="text-xs text-[#A0A0A0] leading-relaxed">{ed.description}</p>

                  <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#111111] rounded-xl p-2.5 border border-zinc-800">
                      <div className="text-[11px] text-[#A0A0A0]">Lowest Chance</div>
                      <div className="font-bold font-mono tabular-nums text-white mt-0.5">
                        {ed.lowestChance}%
                      </div>
                    </div>
                    <div className="bg-[#111111] rounded-xl p-2.5 border border-zinc-800">
                      <div className="text-[11px] text-[#A0A0A0]">Highest Chance</div>
                      <div className="font-bold font-mono tabular-nums text-[#20D878] mt-0.5">
                        {ed.highestChance}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <div className="text-base font-bold font-mono tabular-nums text-white">
                    {formatCurrency(ed.price)}
                  </div>

                  {owned ? (
                    <span className="px-4 py-2 rounded-xl bg-[#20D878]/15 border border-[#20D878]/40 text-[#20D878] text-xs font-semibold">
                      Owned
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!affordable || busyItemId === ed.id}
                      onClick={() => handleBuy('editors', ed.id, ed.name)}
                      className="px-4 py-2 rounded-xl bg-[#FF2020] hover:bg-[#e01b1b] disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold transition-transform active:scale-95"
                    >
                      {busyItemId === ed.id ? 'Hiring...' : !affordable ? 'Low Funds' : 'Hire Editor'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SETUP — COMING SOON TAB */}
      {activeCategory === 'setup' && (
        <div className="space-y-6">
          <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-8 text-center space-y-2">
            <div className="text-xs font-mono tracking-widest uppercase text-[#FF2020]">
              Studio Expansion
            </div>
            <h2 className="text-2xl font-bold text-white">COMING SOON</h2>
            <p className="text-xs text-[#A0A0A0] max-w-xl mx-auto">
              Dedicated creator desk peripherals and broadcast studio gear are currently in production and will launch in an upcoming store expansion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SETUP_COMING_SOON_CATEGORIES.map((item) => (
              <div
                key={item.id}
                className="bg-[#171717] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-4 opacity-85"
              >
                <div>
                  <div className="text-xs font-mono text-[#A0A0A0]">COMING SOON</div>
                  <h3 className="text-base font-bold text-white mt-1">{item.name}</h3>
                  <p className="text-xs text-[#A0A0A0] mt-1.5 leading-relaxed">{item.description}</p>
                </div>
                <div className="text-[11px] font-semibold text-zinc-500 pt-3 border-t border-zinc-800">
                  Unavailable until release
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
