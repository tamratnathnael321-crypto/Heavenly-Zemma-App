import React, { useState } from 'react';
import {
  LogOut,
  Trash2,
  AlertCircle,
  Radio,
  Moon,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { supabase } from '../services/supabase';
import { getStorageUsageEstimate, clearLocalMusicCache } from '../services/offlineCache';

export const SettingsScreen: React.FC = () => {
  const {
    currentUser,
    isGuest,
    signOutUser,
    showToast,
  } = useMusic();

  // Auth form states
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Cache
  const [cacheSize, setCacheSize] = useState(getStorageUsageEstimate());

  // Audio quality
  const [audioQuality, setAudioQuality] = useState<'normal' | 'high' | 'very_high'>('very_high');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        showToast('Successfully signed in!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        showToast('Account created! Check your email to confirm if required.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'Google sign-in failed.');
    }
  };

  const handleClearCache = () => {
    clearLocalMusicCache();
    setCacheSize(getStorageUsageEstimate());
    showToast('Offline music cache cleared');
  };

  return (
    <div className="pb-32 px-4 sm:px-6 pt-3 space-y-6 max-w-2xl mx-auto select-none text-white">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Settings</h1>

      {/* Account & Sign-In Section */}
      <section className="p-4 sm:p-5 rounded-xl bg-[#181818] border border-[#242424] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#242424] text-[#1ed760] flex items-center justify-center font-bold text-sm">
              {currentUser?.full_name ? currentUser.full_name[0].toUpperCase() : 'G'}
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {currentUser?.full_name || 'Guest Listener'}
              </div>
              <div className="text-xs text-[#a7a7a7]">
                {isGuest ? 'Guest Session' : currentUser?.email}
              </div>
            </div>
          </div>

          {!isGuest && (
            <button
              onClick={signOutUser}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a2a2a] hover:bg-[#333333] text-xs font-semibold text-white transition-colors"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* If Guest, show Google & Email Sign-In */}
        {isGuest && (
          <div className="pt-3 border-t border-[#242424] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1ed760]">
                {authMode === 'signin' ? 'Sign in to sync favorites & library' : 'Create new account'}
              </span>
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-xs text-[#a7a7a7] hover:text-white underline"
              >
                {authMode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </div>

            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full h-10 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.2 21.32 7.27 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.99 0 12s.43 3.9 1.19 5.42l4.09-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.27 0 3.2 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#333]"></div>
              <span className="flex-shrink mx-3 text-[10px] text-[#777] uppercase tracking-wider">or email</span>
              <div className="flex-grow border-t border-[#333]"></div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full h-10 px-3.5 rounded-lg bg-[#242424] text-white text-xs placeholder-[#777] border border-[#333] focus:outline-none focus:border-[#1ed760]"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full h-10 px-3.5 rounded-lg bg-[#242424] text-white text-xs placeholder-[#777] border border-[#333] focus:outline-none focus:border-[#1ed760]"
              />

              {authError && (
                <div className="p-2.5 rounded bg-red-950/60 border border-red-800/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-10 rounded-full bg-[#1ed760] text-black font-bold text-xs hover:bg-[#1fdf64] transition-colors disabled:opacity-50"
              >
                {authLoading
                  ? 'Processing...'
                  : authMode === 'signin'
                  ? 'Sign In with Email'
                  : 'Create Account with Email'}
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Audio Streaming Quality */}
      <section className="p-4 sm:p-5 rounded-xl bg-[#181818] border border-[#242424] space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#a7a7a7]">
          Audio Streaming Quality
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'normal', label: 'Normal', bitrate: '128 kbps' },
            { id: 'high', label: 'High', bitrate: '256 kbps' },
            { id: 'very_high', label: 'Very High', bitrate: '320 kbps' },
          ].map((q) => (
            <button
              key={q.id}
              onClick={() => {
                setAudioQuality(q.id as any);
                showToast(`Audio quality set to ${q.label}`);
              }}
              className={`p-2.5 rounded-lg border text-center transition-colors ${
                audioQuality === q.id
                  ? 'border-[#1ed760] bg-[#1ed760]/10 text-white'
                  : 'border-[#282828] bg-[#202020] text-[#a7a7a7] hover:border-[#383838]'
              }`}
            >
              <div className="text-xs font-bold text-white">{q.label}</div>
              <div className="text-[10px] text-[#a7a7a7] mt-0.5">{q.bitrate}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Cache & Local Storage */}
      <section className="p-4 sm:p-5 rounded-xl bg-[#181818] border border-[#242424] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#a7a7a7]">
            Offline Storage & Cache
          </h2>
          <span className="text-xs font-mono text-[#1ed760] font-bold">{cacheSize}</span>
        </div>

        <button
          onClick={handleClearCache}
          className="flex items-center justify-center gap-2 w-full h-9 rounded-lg bg-[#242424] hover:bg-[#2a2a2a] text-xs font-semibold text-[#ef4444] transition-colors"
        >
          <Trash2 size={14} />
          <span>Clear Local Music Cache</span>
        </button>
      </section>
    </div>
  );
};
