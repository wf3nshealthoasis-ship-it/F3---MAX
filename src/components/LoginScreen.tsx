import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, KeyRound, AlertCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { signInWithGoogle, signInAsStaffGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const APP_PASSWORD = '8606';

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.trim() === APP_PASSWORD) {
      setLoading(true);
      try {
        await signInAsStaffGuest();
        onSuccess?.();
      } finally {
        setLoading(false);
      }
    } else {
      setErrorMsg('Incorrect password. Please enter "8606".');
    }
  };

  const handleQuickUnlock = async () => {
    setPassword(APP_PASSWORD);
    setLoading(true);
    setErrorMsg('');
    try {
      await signInAsStaffGuest();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. Enter password "8606" below to unlock.');
      } else {
        setErrorMsg('Could not complete Google Sign-in. Enter password "8606".');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#093547] via-[#095163] to-[#077b7f] text-white select-none relative overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        {/* F3 Logo Emblem Container */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl mb-8 sm:mb-9 ring-1 ring-white/10">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">
            F3
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight text-center mb-3">
          Medication Chart
        </h1>

        {/* Subtitle / Tagline */}
        <p className="text-lg sm:text-xl text-teal-100/90 font-medium text-center mb-8">
          Your Medication. Managed.
        </p>

        {/* Color Urgency Status Badges Pill Row */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap mb-10 sm:mb-12">
          {/* Overdue */}
          <div className="px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-xs border border-white/15 flex items-center space-x-2 text-xs font-medium text-white shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E74C3C] shadow-2xs"></span>
            <span>Overdue</span>
          </div>

          {/* 1 day */}
          <div className="px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-xs border border-white/15 flex items-center space-x-2 text-xs font-medium text-white shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E67E22] shadow-2xs"></span>
            <span>1 day</span>
          </div>

          {/* 2-3 days */}
          <div className="px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-xs border border-white/15 flex items-center space-x-2 text-xs font-medium text-white shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F1C40F] shadow-2xs"></span>
            <span>2–3 days</span>
          </div>

          {/* On track */}
          <div className="px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-xs border border-white/15 flex items-center space-x-2 text-xs font-medium text-white shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#27AE60] shadow-2xs"></span>
            <span>On track</span>
          </div>
        </div>

        {/* Password / Login Container */}
        {!showPasswordPrompt ? (
          <div className="flex flex-col items-center space-y-3 w-full">
            {/* Primary "Sign in" Button */}
            <button
              onClick={() => setShowPasswordPrompt(true)}
              className="w-48 py-3.5 px-6 rounded-2xl bg-[#EDF3F7] hover:bg-white text-[#133A4B] font-bold text-base shadow-xl transition-all hover:scale-105 active:scale-95 text-center cursor-pointer border border-white/40"
            >
              Sign in
            </button>

            {/* Quick 1-click unlock button for password 8606 */}
            <button
              onClick={handleQuickUnlock}
              disabled={loading}
              className="text-xs text-teal-200 hover:text-white transition flex items-center space-x-1.5 py-1 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 cursor-pointer mt-1"
            >
              <KeyRound className="w-3.5 h-3.5 text-teal-300" />
              <span>Unlock with Password “8606”</span>
            </button>
          </div>
        ) : (
          /* Password "8606" Form Modal / Card */
          <form
            onSubmit={handlePasswordSubmit}
            className="w-full max-w-xs bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/25 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-100 uppercase tracking-wider flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-300" />
                <span>Enter Password</span>
              </span>
              <span className="text-[10px] text-teal-200/80 font-mono bg-white/10 px-1.5 py-0.5 rounded">
                Password: 8606
              </span>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-900/70 border border-red-400/40 text-xs text-red-200 text-center flex items-center justify-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Enter password (8606)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                  // Auto-submit if exact password 8606 is typed
                  if (e.target.value.trim() === APP_PASSWORD) {
                    setLoading(true);
                    signInAsStaffGuest().then(() => onSuccess?.());
                  }
                }}
                className="w-full py-2.5 px-3.5 text-sm rounded-xl bg-white/90 text-[#133A4B] font-mono font-bold tracking-widest text-center placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-400 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#EDF3F7] hover:bg-white text-[#133A4B] font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <span>{loading ? 'Unlocking...' : 'Unlock Ward F3'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleQuickUnlock}
                className="text-teal-200 hover:text-white font-medium underline"
              >
                Use 8606
              </button>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="text-teal-200 hover:text-white font-medium"
              >
                Google Sign in
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordPrompt(false)}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Hospital Footer Note */}
      <div className="absolute bottom-6 text-center text-[11px] text-teal-200/50">
        Health Oasis Hospital • Inpatient CareWare V5.0 • Ward F3
      </div>
    </div>
  );
};
