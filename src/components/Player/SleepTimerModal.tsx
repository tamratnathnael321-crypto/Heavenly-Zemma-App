import React from 'react';
import { X, Moon, Clock, Check } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const SleepTimerModal: React.FC = () => {
  const { isSleepTimerOpen, setIsSleepTimerOpen, sleepTimerRemaining, setSleepTimer } = useMusic();

  if (!isSleepTimerOpen) return null;

  const options: Array<{ label: string; value: number | null | 'end_of_song' }> = [
    { label: '5 minutes', value: 5 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '1 hour', value: 60 },
    { label: 'End of current track', value: 'end_of_song' },
    { label: 'Turn off timer', value: null },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="w-full sm:max-w-sm bg-[#181818] border border-[#282828] rounded-t-2xl sm:rounded-2xl overflow-hidden pb-safe animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#242424]">
          <div className="flex items-center gap-2">
            <Moon size={18} className="text-[#1ed760]" />
            <h3 className="text-base font-bold text-white">Sleep Timer</h3>
          </div>
          <button
            onClick={() => setIsSleepTimerOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options List */}
        <div className="p-2 space-y-1">
          {options.map((option, idx) => {
            const isTurnOff = option.value === null;
            const isCurrentlySet =
              (isTurnOff && sleepTimerRemaining === null) ||
              (typeof option.value === 'number' &&
                sleepTimerRemaining !== null &&
                Math.abs(sleepTimerRemaining - option.value * 60) < 60);

            return (
              <button
                key={idx}
                onClick={() => setSleepTimer(option.value)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm text-left hover:bg-[#242424] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock size={16} className={isCurrentlySet ? 'text-[#1ed760]' : 'text-[#777]'} />
                  <span className={isCurrentlySet ? 'text-[#1ed760] font-semibold' : 'text-white'}>
                    {option.label}
                  </span>
                </div>
                {isCurrentlySet && <Check size={16} className="text-[#1ed760]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
