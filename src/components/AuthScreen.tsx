import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { BrandLogoMark } from './Icons';
import {
  isValidGmailAddress,
  loginWithGmailPassword,
  registerWithGmailPassword,
  sendGmailPasswordReset,
  signInWithGoogleGmail,
} from '../lib/playerService';
import { soundManager } from '../lib/soundManager';
import type { UserProfile } from '../types';

interface AuthScreenProps {
  onAuthenticated: (profile: UserProfile, notice?: string) => void;
  pendingRecoveryUid: string | null;
  onRetryRecovery: () => Promise<void>;
}

type AuthMode = 'login' | 'signup' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated,
  pendingRecoveryUid,
  onRetryRecovery,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    soundManager.play('click');
    setMode(next);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.play('click');
    setError(null);
    setSuccessMsg(null);

    if (!isValidGmailAddress(email)) {
      setError('Enter a valid Gmail address.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { profile } = await registerWithGmailPassword(
          username,
          email,
          password,
          confirmPassword
        );
        soundManager.play('purchaseSuccess');
        onAuthenticated(profile, `Welcome to YouTube Studio, ${profile.username}.`);
      } else if (mode === 'login') {
        const { profile, recovered } = await loginWithGmailPassword(email, password);
        soundManager.play('purchaseSuccess');
        onAuthenticated(
          profile,
          recovered
            ? 'Your account signed in and your player profile was safely recovered.'
            : undefined
        );
      } else {
        await sendGmailPasswordReset(email);
        soundManager.play('purchaseSuccess');
        setSuccessMsg(
          'Password reset instructions have been sent by Firebase Authentication to your Gmail address.'
        );
      }
    } catch (err) {
      soundManager.play('purchaseFailure');
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    soundManager.play('click');
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const { profile, isNew } = await signInWithGoogleGmail();
      soundManager.play('purchaseSuccess');
      onAuthenticated(
        profile,
        isNew
          ? `Verified Gmail account created. Starting balance: $5,000.`
          : undefined
      );
    } catch (err) {
      soundManager.play('purchaseFailure');
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Studio Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 bg-[#111111] border border-zinc-800 rounded-3xl p-8 sm:p-10 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <BrandLogoMark size={36} />
              <div>
                <div className="text-lg font-bold tracking-tight text-white">YouTube Studio</div>
                <div className="text-xs text-[#A0A0A0]">Creator Simulation Platform · By Geforce</div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
                Build your channel from zero to one billion subscribers.
              </h1>
              <p className="text-sm text-[#A0A0A0] leading-relaxed">
                Start with $5,000 in studio capital. Acquire Geforce hardware, install compatible GPUs and games, hire editors, and climb persistent global leaderboards.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800/80 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-[#A0A0A0]">Starting Capital</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#20D878] mt-1">$5,000</div>
            </div>
            <div>
              <div className="text-xs text-[#A0A0A0]">Hardware Models</div>
              <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">8 Laptops</div>
            </div>
            <div>
              <div className="text-xs text-[#A0A0A0]">Market Cycle</div>
              <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">3m Stock</div>
            </div>
          </div>
        </motion.div>

        {/* Right Auth Panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 bg-[#171717] border border-zinc-800 rounded-3xl p-8 sm:p-10 flex flex-col justify-center"
        >
          {pendingRecoveryUid && (
            <div className="mb-6 p-4 rounded-2xl bg-[#111111] border border-[#FF2020]/50 space-y-3">
              <div className="flex items-start gap-2.5 text-sm text-white">
                <AlertCircle className="w-4 h-4 text-[#FF3535] shrink-0 mt-0.5" />
                <div>
                  Your authentication account is signed in, but your player profile could not be loaded.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  void onRetryRecovery();
                }}
                className="w-full py-2 px-4 rounded-xl bg-[#FF2020] hover:bg-[#e01b1b] text-xs font-semibold text-white transition-transform active:scale-95"
              >
                Recover Player Profile
              </button>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#111111] border border-zinc-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                mode === 'login' ? 'bg-[#FF2020] text-white' : 'text-[#A0A0A0] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                mode === 'signup' ? 'bg-[#FF2020] text-white' : 'text-[#A0A0A0] hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                mode === 'forgot' ? 'bg-[#FF2020] text-white' : 'text-[#A0A0A0] hover:text-white'
              }`}
            >
              Reset Password
            </button>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">
            {mode === 'login'
              ? 'Sign in to your studio'
              : mode === 'signup'
                ? 'Create a creator account'
                : 'Reset account password'}
          </h2>
          <p className="text-xs text-[#A0A0A0] mb-6">
            {mode === 'login'
              ? 'Authenticate with your registered Gmail address and password.'
              : mode === 'signup'
                ? 'Only @gmail.com addresses are accepted. Your permanent UID stores all progress in the cloud.'
                : 'Enter your registered Gmail address to receive a Firebase password reset link.'}
          </p>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#FF3535]/10 border border-[#FF3535]/40 flex items-start gap-2.5 text-xs text-[#FF3535]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#20D878]/10 border border-[#20D878]/40 flex items-start gap-2.5 text-xs text-[#20D878]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
                  Channel Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#A0A0A0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={32}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="GeforceCreator"
                    className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
                Gmail Address (@gmail.com only)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A0A0A0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@gmail.com"
                  className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#A0A0A0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#A0A0A0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#111111] border border-zinc-800 focus:border-[#FF2020] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#FF2020] hover:bg-[#e01b1b] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                  ? 'Login to Studio'
                  : mode === 'signup'
                    ? 'Create Account'
                    : 'Send Password Reset Email'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-3 flex items-center justify-between text-xs text-[#A0A0A0]">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="hover:text-white transition-colors"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="hover:text-white transition-colors"
              >
                Need an account? Sign Up
              </button>
            </div>
          )}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[11px] text-[#A0A0A0]">OR</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-[#111111] hover:bg-zinc-900 border border-zinc-700 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          >
            <ShieldCheck className="w-4 h-4 text-[#20D878]" />
            <span>Continue with Google (Verified Gmail Ownership)</span>
          </button>

          <p className="mt-4 text-[11px] text-[#A0A0A0] leading-relaxed">
            Note: Email/password registration checks @gmail.com formatting and creates a persistent Firebase account without OTP verification; Google sign-in directly confirms live Gmail account ownership.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
