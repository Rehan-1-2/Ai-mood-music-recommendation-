import React, { useState } from 'react';
import { Song } from '../types';

interface SongCardProps {
  song: Song;
  index: number;
  onSelectSong: (index: number) => void;
  isCurrentlySelected: boolean;
  isPlaying: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const SongCard: React.FC<SongCardProps> = ({ 
  song, 
  index, 
  onSelectSong, 
  isCurrentlySelected, 
  isPlaying,
  isFavorite,
  onToggleFavorite
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const showPlayIcon = !isCurrentlySelected || !isPlaying;

  return (
    <div
      className={`group relative p-3 rounded-2xl border transition-all duration-300 overflow-hidden backdrop-blur-md ${isCurrentlySelected 
        ? 'bg-indigo-50 dark:bg-white/10 border-indigo-200 dark:border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.15)]' 
        : 'bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/10 hover:border-indigo-200 dark:hover:border-white/10 hover:shadow-lg'}`}
      style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`, opacity: 0 }}
    >
      {/* Active Indicator Line */}
      {isCurrentlySelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-fuchsia-400"></div>
      )}

      <div className="flex items-center space-x-5 pl-2">
        <div className="relative flex-shrink-0 w-16 h-16 group-hover:scale-105 transition-transform duration-300">
          {song.albumArtUrl && !imageError ? (
            <img
              src={song.albumArtUrl}
              alt={`Album art for ${song.title}`}
              className={`w-full h-full rounded-xl object-cover shadow-lg ${isCurrentlySelected ? 'grayscale-0 ring-2 ring-indigo-400/50' : 'grayscale-[20%] group-hover:grayscale-0 transition-all duration-500'}`}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-300 dark:border-white/5">
              <i className="fa-solid fa-music text-2xl text-slate-400 dark:text-slate-600"></i>
            </div>
          )}
          
          {song.previewUrl && (
            <button
              onClick={() => onSelectSong(index)}
              className={`absolute inset-0 w-full h-full bg-black/40 rounded-xl flex items-center justify-center text-white text-2xl transition-all duration-300 backdrop-blur-[2px] ${isCurrentlySelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              aria-label={showPlayIcon ? `Play preview for ${song.title}` : `Pause preview for ${song.title}`}
            >
              <i className={`fa-solid ${showPlayIcon ? 'fa-play' : 'fa-pause'} drop-shadow-md scale-90 hover:scale-110 transition-transform`}></i>
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0 py-1">
          <p className={`text-lg font-bold truncate ${isCurrentlySelected ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-200 group-hover:text-indigo-900 dark:group-hover:text-white transition-colors'}`}>{song.title}</p>
          <p className={`text-sm truncate transition-colors font-light ${isCurrentlySelected ? 'text-indigo-700/80 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>{song.artist}</p>
        </div>
        
        <div className="flex items-center space-x-2">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                }}
                className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 backdrop-blur-sm ${isFavorite 
                    ? 'bg-red-500/10 dark:bg-red-500/20 border-red-500/30 dark:border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                    : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 hover:bg-red-50 dark:hover:bg-white/10 hover:text-red-500 hover:border-red-300 dark:hover:border-red-400/30'}`}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
                <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-xl`}></i>
            </button>

            <a
            href={song.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-400 hover:bg-[#1DB954] hover:text-white hover:border-[#1DB954] transition-all duration-300 hover:scale-110 mr-2 backdrop-blur-sm"
            title="Listen on Spotify"
            >
            <i className="fa-brands fa-spotify text-xl"></i>
            </a>
        </div>
      </div>
    </div>
  );
};

export default SongCard;