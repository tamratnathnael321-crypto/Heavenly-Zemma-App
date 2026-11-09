import React from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useMusic();

  if (!toastMessage) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#282828] text-white text-xs font-semibold rounded-full shadow-2xl border border-[#3e3e3e] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none select-none max-w-[90vw] truncate">
      <span className="w-2 h-2 rounded-full bg-[#1ed760] shrink-0" />
      <span className="truncate">{toastMessage}</span>
    </div>
  );
};

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useMusic();

  if (isOnline) return null;

  return (
    <div className="bg-amber-950/80 border-b border-amber-800/40 text-amber-200 px-4 py-1.5 text-xs flex items-center justify-between select-none">
      <div className="flex items-center gap-2">
        <WifiOff size={14} className="text-amber-400 shrink-0" />
        <span>Offline Mode · Playing from local cached storage</span>
      </div>
      <span className="text-[10px] bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded font-mono">
        CACHED
      </span>
    </div>
  );
};

export const SongCardSkeleton: React.FC = () => (
  <div className="w-36 sm:w-44 shrink-0 space-y-2 animate-pulse">
    <div className="w-full aspect-square bg-[#222222] rounded-lg" />
    <div className="h-3.5 bg-[#222222] rounded w-3/4" />
    <div className="h-3 bg-[#1a1a1a] rounded w-1/2" />
  </div>
);

export const TrackRowSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-2 rounded-lg animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#222222] rounded" />
      <div className="space-y-1.5">
        <div className="h-3.5 bg-[#222222] rounded w-32" />
        <div className="h-3 bg-[#1a1a1a] rounded w-20" />
      </div>
    </div>
    <div className="h-3 bg-[#1a1a1a] rounded w-10" />
  </div>
);
