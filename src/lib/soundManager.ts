export type SoundEvent =
  | 'click'
  | 'purchaseSuccess'
  | 'purchaseFailure'
  | 'uploadStart'
  | 'uploadComplete'
  | 'rankIncrease'
  | 'badgeUnlock';

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.6;
  private lastPlayedAt: Record<string, number> = {};

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.volume;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public play(event: SoundEvent) {
    if (!this.enabled || this.volume <= 0) return;

    const nowMs = Date.now();
    const minCooldown = event === 'click' ? 60 : 120;
    if (this.lastPlayedAt[event] && nowMs - this.lastPlayedAt[event] < minCooldown) {
      return;
    }
    this.lastPlayedAt[event] = nowMs;

    const ctx = this.getContext();
    if (!ctx) return;

    const baseGain = this.volume * 0.22;
    const now = ctx.currentTime;

    switch (event) {
      case 'click': {
        this.tone(ctx, 560, 420, now, 0.045, 'sine', baseGain * 0.5);
        break;
      }
      case 'purchaseSuccess': {
        this.tone(ctx, 523.25, 523.25, now, 0.08, 'triangle', baseGain);
        this.tone(ctx, 659.25, 659.25, now + 0.07, 0.09, 'triangle', baseGain);
        this.tone(ctx, 783.99, 783.99, now + 0.14, 0.16, 'sine', baseGain * 1.1);
        break;
      }
      case 'purchaseFailure': {
        this.tone(ctx, 220, 175, now, 0.11, 'sawtooth', baseGain * 0.65);
        this.tone(ctx, 165, 130, now + 0.11, 0.16, 'sawtooth', baseGain * 0.65);
        break;
      }
      case 'uploadStart': {
        this.tone(ctx, 320, 640, now, 0.18, 'sine', baseGain * 0.85);
        break;
      }
      case 'uploadComplete': {
        this.tone(ctx, 440, 440, now, 0.08, 'sine', baseGain);
        this.tone(ctx, 554.37, 554.37, now + 0.08, 0.08, 'sine', baseGain);
        this.tone(ctx, 659.25, 659.25, now + 0.16, 0.1, 'sine', baseGain);
        this.tone(ctx, 880, 880, now + 0.25, 0.22, 'triangle', baseGain * 1.1);
        break;
      }
      case 'rankIncrease': {
        this.tone(ctx, 587.33, 587.33, now, 0.09, 'triangle', baseGain);
        this.tone(ctx, 739.99, 739.99, now + 0.09, 0.09, 'triangle', baseGain);
        this.tone(ctx, 880, 880, now + 0.18, 0.12, 'triangle', baseGain);
        this.tone(ctx, 1174.66, 1174.66, now + 0.29, 0.32, 'sine', baseGain * 1.2);
        break;
      }
      case 'badgeUnlock': {
        this.tone(ctx, 659.25, 659.25, now, 0.08, 'sine', baseGain);
        this.tone(ctx, 987.77, 987.77, now + 0.08, 0.14, 'sine', baseGain * 1.1);
        this.tone(ctx, 1318.51, 1318.51, now + 0.2, 0.34, 'triangle', baseGain * 1.2);
        break;
      }
    }
  }

  private tone(
    ctx: AudioContext,
    startFreq: number,
    endFreq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    peakGain: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    if (endFreq !== startFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);
    }

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}

export const soundManager = new SoundManager();
