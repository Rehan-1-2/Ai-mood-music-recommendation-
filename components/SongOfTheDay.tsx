import React from 'react';
import { Song } from '../types';

interface SongOfTheDayProps {
  song: Song | null;
  isLoading: boolean;
  onReveal: () => void;
  onPlayPause: () => void;
  isPlaying: boolean;
  isCurrent: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const SongOfTheDay: React.FC<SongOfTheDayProps> = ({ 
  song, 
  isLoading, 
  onReveal, 
  onPlayPause, 
  isPlaying, 
  isCurrent,
  isFavorite,
  onToggleFavorite
}) => {
  const showPlayIcon = !isCurrent || !isPlaying;

  if (!song && !isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mb-10 p-1 bg-gradient-to-r from-amber-200/50 via-yellow-400/50 to-orange-500/50 rounded-2xl shadow-lg backdrop-blur-sm animate-fadeIn">
        <div className="bg-white/80 dark:bg-[#0f172a]/90 rounded-xl p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
               <i className="fa-solid fa-sun text-2xl animate-spin-slow"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Song of the Day</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Discover today's curated track</p>
            </div>
          </div>
          <button 
            onClick={onReveal}
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold text-sm hover:scale-105 transition-transform shadow-md"
          >
            Reveal
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mb-10 p-1 bg-slate-200 dark:bg-white/10 rounded-2xl animate-pulse">
        <div className="bg-white/80 dark:bg-[#0f172a]/90 rounded-xl p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700"></div>
               <div className="space-y-2">
                   <div className="h-4 w-32 bg-slate-300 dark:bg-slate-700 rounded"></div>
                   <div className="h-3 w-24 bg-slate-300 dark:bg-slate-700 rounded"></div>
               </div>
           </div>
        </div>
      </div>
    );
  }

  if (song) {
    return (
      <div className="w-full max-w-2xl mx-auto mb-10 relative group">
        {/* Outer Glow */}
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-amber-300 via-orange-500 to-red-500 rounded-2xl blur transition-all duration-1000 ${isCurrent ? 'opacity-80 animate-pulse' : 'opacity-30 group-hover:opacity-60'}`}></div>
        
        {/* Main Card Content */}
        <div className={`relative bg-white/90 dark:bg-[#0f172a]/95 rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden transition-all duration-300 ${isCurrent ? 'border-2 border-amber-500/50 scale-[1.02]' : 'border border-amber-200/50 dark:border-amber-500/20'}`}>
            
            {/* Badge */}
            <div className="absolute top-0 right-0 p-3 bg-gradient-to-bl from-amber-100 to-transparent dark:from-amber-900/20 rounded-bl-2xl rounded-tr-xl flex items-center gap-2">
                 {isCurrent && isPlaying && (
                    <div className="flex gap-1 items-end h-3 mb-0.5">
                        <span className="w-1 bg-amber-500 animate-[bounce_1s_infinite] h-2"></span>
                        <span className="w-1 bg-amber-500 animate-[bounce_1.2s_infinite] h-3"></span>
                        <span className="w-1 bg-amber-500 animate-[bounce_0.8s_infinite] h-1"></span>
                    </div>
                 )}
                 <span className={`text-[10px] font-bold uppercase tracking-widest px-2 ${isCurrent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                    {isCurrent ? 'Now Playing' : 'Daily Pick'}
                 </span>
            </div>

            <div className="flex items-center gap-5">
                {/* Album Art with Play Button Overlay */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                    <img 
                        src={song.albumArtUrl} 
                        alt={song.title} 
                        className={`w-full h-full object-cover rounded-xl shadow-md transition-all duration-300 ${isCurrent ? 'ring-2 ring-amber-500 shadow-amber-500/20' : ''}`}
                    />
                    {song.previewUrl && (
                        <button
                        onClick={onPlayPause}
                        className={`absolute inset-0 w-full h-full bg-black/30 rounded-xl flex items-center justify-center text-white text-4xl transition-all duration-300 ${isCurrent ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100'}`}
                        aria-label={showPlayIcon ? "Play song of the day" : "Pause song of the day"}
                        >
                        <i className={`fa-solid ${showPlayIcon ? 'fa-play pl-1' : 'fa-pause'} drop-shadow-lg hover:scale-110 transition-transform text-white`}></i>
                        </button>
                    )}
                </div>

                <div className="flex-1 min-w-0 z-10 py-1">
                    <h3 className={`text-xl sm:text-2xl font-bold truncate transition-colors duration-300 ${isCurrent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                        {song.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium truncate">{song.artist}</p>
                    
                    <div className="flex items-center gap-3 mt-4">
                         <button
                            onClick={onToggleFavorite}
                            className={`h-10 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 font-medium text-sm ${isFavorite ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/30' : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                            <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                            <span className="hidden xs:inline">Save</span>
                        </button>
                        <a 
                            href={song.spotifyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-10 px-4 rounded-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#1DB954] hover:text-white transition-all duration-300 text-sm font-medium border border-transparent hover:border-[#1DB954]"
                        >
                            <i className="fa-brands fa-spotify text-lg"></i>
                            <span>Spotify</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SongOfTheDay;