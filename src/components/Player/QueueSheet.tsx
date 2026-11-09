import React from 'react';
import { X, Trash2, ListMusic } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song } from '../../types';
import { CoverArtTile } from '../Common/CoverArtTile';

export const QueueSheet: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    queue,
    queueIndex,
    currentSong,
    playSong,
    removeFromQueue,
    clearQueue,
  } = useMusic();

  if (!isQueueOpen) return null;

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining.toString().padStart(2, '0')}`;
  };

  const upcomingTracks = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 select-none">
      <div className="w-full max-w-lg h-[80vh] bg-[#141414] border-t border-[#242424] rounded-t-2xl flex flex-col pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#242424] bg-[#181818]">
          <div className="flex items-center gap-2">
            <ListMusic size={20} className="text-[#1ed760]" />
            <h3 className="text-base font-bold text-white tracking-tight">Play Queue</h3>
          </div>
          <div className="flex items-center gap-2">
            {upcomingTracks.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-xs text-[#a7a7a7] hover:text-white px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsQueueOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Currently Playing Track */}
          {currentSong && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#a7a7a7] mb-2 px-1">
                Now Playing
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#202020] border border-[#2e2e2e]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0">
                    <CoverArtTile
                      src={currentSong.cover_art_url}
                      title={currentSong.title}
                      type="song"
                      className="w-10 h-10"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#1ed760] truncate">
                      {currentSong.title}
                    </div>
                    {currentSong.artist_name && (
                      <div className="text-xs text-[#a7a7a7] truncate">
                        {currentSong.artist_name}
                      </div>
                    )}
                  </div>
                </div>
                {currentSong.duration_seconds > 0 && (
                  <span className="text-xs font-mono text-[#a7a7a7] pl-2">
                    {formatDuration(currentSong.duration_seconds)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Up Next List */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#a7a7a7] mb-2 px-1">
              Next Up ({upcomingTracks.length})
            </div>

            {upcomingTracks.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#777]">
                No more tracks in queue.
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingTracks.map((song: Song, idx: number) => {
                  const absoluteIndex = queueIndex + 1 + idx;
                  return (
                    <div
                      key={`${song.id}-${idx}`}
                      className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#202020] transition-colors"
                    >
                      <button
                        onClick={() => playSong(song, queue)}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left"
                      >
                        <span className="text-xs font-mono text-[#777] w-5 text-center">
                          {idx + 1}
                        </span>
                        <div className="w-9 h-9 shrink-0">
                          <CoverArtTile
                            src={song.cover_art_url}
                            title={song.title}
                            type="song"
                            className="w-9 h-9"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-white group-hover:text-[#1ed760] truncate transition-colors">
                            {song.title}
                          </div>
                          {song.artist_name && (
                            <div className="text-xs text-[#a7a7a7] truncate">
                              {song.artist_name}
                            </div>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-2 pl-2">
                        {song.duration_seconds > 0 && (
                          <span className="text-xs font-mono text-[#777]">
                            {formatDuration(song.duration_seconds)}
                          </span>
                        )}
                        <button
                          onClick={() => removeFromQueue(absoluteIndex)}
                          className="w-7 h-7 flex items-center justify-center rounded text-[#777] hover:text-red-400"
                          title="Remove from queue"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
