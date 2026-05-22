import React from 'react';
import { Song } from '../types';

interface AudioPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  volume: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleQueue: () => void;
  isQueueOpen: boolean;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  song,
  isPlaying,
  progress,
  duration,
  currentTime,
  volume,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleQueue,
  isQueueOpen,
}) => {
  if (!song) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fadeInUp" style={{ animation: `fadeInUp 0.3s ease-out forwards`, opacity: 0 }}>
      <div className="bg-white/90 dark:bg-[#020617]/70 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10 px-4 py-3 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
        <div className="container mx-auto flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
              <div className="relative group">
                  <img
                    src={song.albumArtUrl}
                    alt={song.title}
                    className={`w-14 h-14 rounded-xl object-cover shadow-lg border border-slate-200 dark:border-white/10 ${isPlaying ? 'animate-pulse-slow' : ''}`}
                  />
                  <div className="absolute inset-0 bg-black/10 rounded-xl"></div>
              </div>
              <div className="min-w-0 overflow-hidden">
                <div className="font-bold text-slate-800 dark:text-white truncate text-sm leading-tight tracking-tight">{song.title}</div>
                <div className="text-xs text-indigo-600 dark:text-indigo-300 truncate mt-1 font-light">{song.artist}</div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-lg">
              <div className="flex items-center gap-6 mb-1">
                <button onClick={onPrev} className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors p-2 hover:scale-110" aria-label="Previous song">
                  <i className="fa-solid fa-backward-step text-lg"></i>
                </button>
                <button
                  onClick={onPlayPause}
                  className="w-11 h-11 flex items-center justify-center bg-indigo-600 dark:bg-white rounded-full text-white dark:text-indigo-600 shadow-lg hover:scale-105 hover:bg-indigo-700 dark:hover:bg-indigo-50 transition-all duration-200"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-0.5'}`}></i>
                </button>
                <button onClick={onNext} className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors p-2 hover:scale-110" aria-label="Next song">
                  <i className="fa-solid fa-forward-step text-lg"></i>
                </button>
              </div>
              <div className="w-full flex items-center gap-3 text-[10px] font-medium text-slate-500 dark:text-slate-400 font-mono">
                <span className="w-8 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  value={progress || 0}
                  onChange={onSeek}
                  className="w-full h-1 bg-slate-300 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-primary focus:outline-none hover:h-1.5 transition-all"
                  aria-label="Song progress"
                />
                <span className="w-8">{formatTime(duration)}</span>
              </div>
            </div>
            
            <div className="w-1/4 min-w-[150px] flex justify-end items-center gap-3">
              <button 
                onClick={onToggleQueue}
                className={`p-2 rounded-lg transition-colors ${isQueueOpen ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
                title="Queue"
              >
                <i className="fa-solid fa-list-ul"></i>
              </button>
              
              <div className="h-4 w-[1px] bg-slate-300 dark:bg-white/10 mx-1"></div>

              <i className={`fa-solid text-slate-500 dark:text-slate-400 ${volume > 0.5 ? 'fa-volume-high' : volume > 0 ? 'fa-volume-low' : 'fa-volume-xmark'} text-xs`}></i>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={onVolumeChange}
                className="w-20 h-1 bg-slate-300 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-primary focus:outline-none"
                aria-label="Volume control"
              />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;