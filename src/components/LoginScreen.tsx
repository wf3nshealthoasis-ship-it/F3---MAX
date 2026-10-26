import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { signInWithGoogle, signInAsStaffGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      // If popup was blocked or closed, give clean feedback
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. You can also sign in as Ward F3 Staff.');
      } else {
        setErrorMsg('Could not complete Google Sign-in. You can use Staff Access.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStaffDemoLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInAsStaffGuest();
      onSuccess?.();
    } catch (err) {
      console.warn('Staff login error:', err);
      onSuccess?.();
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
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap mb-12 sm:mb-14">
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

        {/* Error message if any */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/60 border border-red-400/40 text-xs text-red-200 text-center flex items-center justify-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary "Sign in" Button */}
        {!showOptions ? (
          <div className="flex flex-col items-center space-y-3 w-full">
            <button
              onClick={() => setShowOptions(true)}
              disabled={loading}
              className="w-48 py-3.5 px-6 rounded-2xl bg-[#EDF3F7] hover:bg-white text-[#133A4B] font-bold text-base shadow-xl transition-all hover:scale-105 active:scale-95 text-center cursor-pointer border border-white/40"
            >
              Sign in
            </button>

            <button
              onClick={handleStaffDemoLogin}
              className="text-xs text-teal-200/80 hover:text-white underline transition mt-2 cursor-pointer"
            >
              Quick Staff Access (Ward F3 Demo)
            </button>
          </div>
        ) : (
          /* Sign-In Options Sheet / Card */
          <div className="w-full max-w-xs bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <p className="text-xs text-teal-100 font-semibold text-center uppercase tracking-wider">
              Choose Sign-In Method
            </p>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs shadow-md flex items-center justify-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>

            {/* Staff Clinician Quick Enter */}
            <button
              onClick={handleStaffDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#0c314b] font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Ward F3 Clinician Access</span>
            </button>

            <button
              onClick={() => setShowOptions(false)}
              className="w-full py-1.5 text-center text-xs text-teal-200/80 hover:text-white transition"
            >
              Back
            </button>
          </div>
        )}
      </div>

      {/* Hospital Footer Note */}
      <div className="absolute bottom-6 text-center text-[11px] text-teal-200/50">
        Health Oasis Hospital • Inpatient CareWare V5.0
      </div>
    </div>
  );
};
