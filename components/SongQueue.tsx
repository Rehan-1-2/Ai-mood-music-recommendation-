import React from 'react';
import { Song } from '../types';

interface SongQueueProps {
  songs: Song[];
  currentSongIndex: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

const SongQueue: React.FC<SongQueueProps> = ({
  songs,
  currentSongIndex,
  isOpen,
  onClose,
  onSelect,
  onReorder,
}) => {
  return (
    <div
      className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-50/90 dark:bg-[#0f172a]/70 backdrop-blur-3xl border-l border-slate-200 dark:border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-white/5 backdrop-blur-md">
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Queue</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">Next up from your mood</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 flex items-center justify-center transition-colors border border-slate-200 dark:border-white/5"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-32">
        {songs.map((song, index) => {
          const isCurrent = currentSongIndex === index;
          return (
            <div
              key={`${song.title}-${index}`}
              className={`group flex items-center gap-3 p-3 rounded-xl transition-all ${
                isCurrent
                  ? 'bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30'
                  : 'hover:bg-white/60 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/5'
              }`}
            >
              <div 
                onClick={() => onSelect(index)}
                className="relative w-10 h-10 flex-shrink-0 cursor-pointer"
              >
                <img
                  src={song.albumArtUrl}
                  alt={song.title}
                  className={`w-full h-full rounded-lg object-cover ${isCurrent ? 'opacity-50' : ''}`}
                />
                {isCurrent && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-0.5 h-3 bg-indigo-600 dark:bg-white mx-[1px] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-0.5 h-4 bg-indigo-600 dark:bg-white mx-[1px] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-0.5 h-3 bg-indigo-600 dark:bg-white mx-[1px] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
                {!isCurrent && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                         <i className="fa-solid fa-play text-white text-xs"></i>
                    </div>
                )}
              </div>

              <div className="flex-1 min-w-0" onClick={() => onSelect(index)}>
                <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'}`}>
                  {song.title}
                </p>
                <p className="text-xs text-slate-500 truncate font-light">{song.artist}</p>
              </div>

              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index > 0) onReorder(index, index - 1);
                  }}
                  disabled={index === 0}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white/50 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  title="Move Up"
                >
                  <i className="fa-solid fa-chevron-up text-xs"></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index < songs.length - 1) onReorder(index, index + 1);
                  }}
                  disabled={index === songs.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white/50 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  title="Move Down"
                >
                  <i className="fa-solid fa-chevron-down text-xs"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SongQueue;