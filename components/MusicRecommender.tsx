import React, { useState, useRef, useEffect, useMemo } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import Header from './Header';
import MoodInputForm from './MoodInputForm';
import SongCard from './SongCard';
import Loader from './Loader';
import Footer from './Footer';
import AudioPlayer from './AudioPlayer';
import SongQueue from './SongQueue';
import AnalyticsDashboard, { MoodEntry } from './AnalyticsDashboard';
import SongOfTheDay from './SongOfTheDay';
import ProfileSection from './ProfileSection';
import { Song, Mood, UserProfile, UserRewards } from '../types';
import { getMoodAndRecommendations, getSongOfTheDay } from '../services/geminiService';

export interface RecentMood {
  id: string;
  input: string;
  mood: Mood;
  songs: Song[];
  timestamp: number;
}
import { calculateLevel, BADGES } from '../services/rewardService';
import { auth, db } from '../src/lib/firebase';
import { handleFirestoreError, OperationType } from '../src/lib/firestoreUtils';

interface MusicRecommenderProps {
  isDark: boolean;
  toggleTheme: () => void;
  user: UserProfile;
  onLogout: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

const MusicRecommender: React.FC<MusicRecommenderProps> = ({ isDark, toggleTheme, user, onLogout, onUpdateUser }) => {
  // Navigation State
  const [view, setView] = useState<'home' | 'favorites' | 'analytics' | 'profile'>('home');
  
  // Data State
  const [recommendations, setRecommendations] = useState<Song[] | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDataSyncing, setIsDataSyncing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Song of the Day State
  const [sotd, setSotd] = useState<Song | null>(null);
  const [isSotdLoading, setIsSotdLoading] = useState(false);

  // Favorites State
  const [favorites, setFavorites] = useState<Song[]>([]);

  // History State for Analytics
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);

  // Recent Moods State (last 5 searches) persisted in localStorage
  const [recentMoods, setRecentMoods] = useState<RecentMood[]>(() => {
    try {
      const saved = localStorage.getItem('recentMoods');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse recent moods in initializer", e);
      return [];
    }
  });

  // Persist recentMoods
  useEffect(() => {
    localStorage.setItem('recentMoods', JSON.stringify(recentMoods));
  }, [recentMoods]);

  const handleDeleteRecentMood = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRecentMoods(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAllRecentMoods = () => {
    setRecentMoods([]);
  };

  // --- REWARD SYSTEM STATE ---
  const [rewards, setRewards] = useState<UserRewards>({ 
      points: 0, 
      level: 1, 
      unlockedBadges: [], 
      songsPlayed: 0,
      currentStreak: 0,
      lastActiveDate: null
  });

  // Sync with Firestore when auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsDataSyncing(false);
        return;
      }

      setIsDataSyncing(true);
      try {
        // 1. Sync Profile & Rewards
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRewards({
            points: userData.points || 0,
            level: userData.level || 1,
            unlockedBadges: userData.unlockedBadges || [],
            songsPlayed: userData.songsPlayed || 0,
            currentStreak: userData.currentStreak || 0,
            lastActiveDate: userData.lastActiveDate || null
          });
        } else {
          // Initialize first-time user in Firestore
          const initialData = {
            username: user.displayName || 'User',
            email: user.email,
            joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            points: 0,
            level: 1,
            unlockedBadges: [],
            songsPlayed: 0,
            currentStreak: 0,
            lastActiveDate: null
          };
          await setDoc(userDocRef, initialData);
        }

        // 2. Sync Favorites
        const favoritesRef = collection(db, 'users', user.uid, 'favorites');
        const favoritesSnapshot = await getDocs(favoritesRef);
        const favs: Song[] = [];
        favoritesSnapshot.forEach(doc => {
            favs.push(doc.data() as Song);
        });
        setFavorites(favs);

        // 3. Sync History
        const historyRef = collection(db, 'users', user.uid, 'moodHistory');
        const historySnapshot = await getDocs(historyRef);
        const history: MoodEntry[] = [];
        historySnapshot.forEach(doc => {
            history.push(doc.data() as MoodEntry);
        });
        setMoodHistory(history);

      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      } finally {
        setIsDataSyncing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Persist Rewards to Firestore
  useEffect(() => {
    const persistRewards = async () => {
        const user = auth.currentUser;
        if (!user || isDataSyncing) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                points: rewards.points,
                level: rewards.level,
                unlockedBadges: rewards.unlockedBadges,
                songsPlayed: rewards.songsPlayed,
                currentStreak: rewards.currentStreak,
                lastActiveDate: rewards.lastActiveDate
            });
        } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        }
    };
    persistRewards();
  }, [rewards, isDataSyncing]);

  // Check and Update Streak on Mount
  useEffect(() => {
    const checkStreak = () => {
        const today = new Date().toISOString().split('T')[0];
        const lastActive = rewards.lastActiveDate;

        if (lastActive !== today) {
            let newStreak = 1;
            
            if (lastActive) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                
                if (lastActive === yesterdayStr) {
                    newStreak = (rewards.currentStreak || 0) + 1;
                } else {
                    // Reset streak if missed a day
                    newStreak = 1; 
                }
            } else {
                newStreak = 1;
            }

            setRewards(prev => ({
                ...prev,
                lastActiveDate: today,
                currentStreak: newStreak
            }));
        }
    };
    
    checkStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount
  
  // Function to add points and check for level up
  const addPoints = (amount: number) => {
    setRewards(prev => {
        const newPoints = prev.points + amount;
        const newLevel = calculateLevel(newPoints);
        return {
            ...prev,
            points: newPoints,
            level: newLevel
        };
    });
  };

  // Function to unlock a badge
  const unlockBadge = (badgeId: string) => {
    setRewards(prev => {
        if (prev.unlockedBadges.includes(badgeId)) return prev;
        return {
            ...prev,
            unlockedBadges: [...prev.unlockedBadges, badgeId]
        };
    });
  };

  const incrementPlayCount = () => {
    setRewards(prev => ({
        ...prev,
        songsPlayed: (prev.songsPlayed || 0) + 1
    }));
  };

  // Check achievements whenever relevant state changes
  useEffect(() => {
    // 1. First Vibe (Generated any mood)
    if (moodHistory.length > 0) unlockBadge('first_vibe');

    // 2. Collector (Favorites count)
    if (favorites.length >= 5) unlockBadge('collector_5');
    if (favorites.length >= 20) unlockBadge('collector_20');

    // 3. Mood Master (Unique moods)
    const uniqueMoods = new Set(moodHistory.map(m => m.mood)).size;
    if (uniqueMoods >= 5) unlockBadge('mood_master');

    // 4. Level 5
    if (rewards.level >= 5) unlockBadge('level_5');

    // 5. Listener Milestones
    if ((rewards.songsPlayed || 0) >= 100) unlockBadge('listener_100');
    if ((rewards.songsPlayed || 0) >= 200) unlockBadge('listener_200');

    // 6. Streak Milestones
    const streak = rewards.currentStreak || 0;
    if (streak >= 3) unlockBadge('streak_3');
    if (streak >= 7) unlockBadge('streak_7');
    if (streak >= 30) unlockBadge('streak_30');

  }, [moodHistory, favorites, rewards.level, rewards.songsPlayed, rewards.currentStreak]);

  // --- END REWARD SYSTEM ---
  
  // Player State
  const [playerSource, setPlayerSource] = useState<'recommendations' | 'favorites' | 'sotd'>('recommendations');
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  // Error Tracking State
  const [failedSongIds, setFailedSongIds] = useState<Set<string>>(new Set());

  // Derived State
  const activePlaylist = useMemo(() => {
    if (playerSource === 'sotd' && sotd) {
        return [sotd];
    }
    return playerSource === 'recommendations' ? recommendations : favorites;
  }, [playerSource, recommendations, favorites, sotd]);

  const getSongId = (song: Song) => `${song.title}-${song.artist}`;

  // Refs for accessing state in event listeners
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleNextSongRef = useRef<(ignoreId?: string) => void>();
  const incrementPlayCountRef = useRef(incrementPlayCount);
  const activePlaylistRef = useRef(activePlaylist);
  const currentSongIndexRef = useRef(currentSongIndex);

  useEffect(() => {
    activePlaylistRef.current = activePlaylist;
    currentSongIndexRef.current = currentSongIndex;
    incrementPlayCountRef.current = incrementPlayCount;
  }, [activePlaylist, currentSongIndex, incrementPlayCount]);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Persist history
  useEffect(() => {
    localStorage.setItem('moodHistory', JSON.stringify(moodHistory));
  }, [moodHistory]);

  // Load SOTD from local storage
  useEffect(() => {
    try {
        const today = new Date().toLocaleDateString();
        const savedDate = localStorage.getItem('sotd_date');
        const savedData = localStorage.getItem('sotd_data');
        if (savedDate === today && savedData) {
            setSotd(JSON.parse(savedData));
        }
    } catch (e) {
        console.error("Failed to load SOTD", e);
    }
  }, []);

  const toggleFavorite = async (song: Song) => {
    const user = auth.currentUser;
    if (!user) return;

    const favoriteId = getSongId(song).replace(/[^a-zA-Z0-9_-]/g, '_');
    const favPath = `users/${user.uid}/favorites/${favoriteId}`;
    const favDocRef = doc(db, 'users', user.uid, 'favorites', favoriteId);

    const isFav = favorites.some(f => f.title === song.title && f.artist === song.artist);
    
    try {
      if (isFav) {
        await deleteDoc(favDocRef);
        setFavorites(prev => prev.filter(f => !(f.title === song.title && f.artist === song.artist)));
      } else {
        await setDoc(favDocRef, song);
        setFavorites(prev => [...prev, song]);
        addPoints(5);
      }
    } catch (err) {
      handleFirestoreError(err, isFav ? OperationType.DELETE : OperationType.CREATE, favPath);
    }
  };

  const isSongFavorite = (song: Song) => {
    return favorites.some(f => f.title === song.title && f.artist === song.artist);
  };

  const findNextPlayableSong = (startIndex: number, direction: 1 | -1, playlist: Song[] | null, ignoreId?: string): number | null => {
    if (!playlist || playlist.length === 0) return null;
    
    let nextIndex = (startIndex + direction + playlist.length) % playlist.length;
    let count = 0;
    
    // Iterate through playlist to find a playable song
    while (count < playlist.length) {
        const song = playlist[nextIndex];
        const id = getSongId(song);
        const isFailed = failedSongIds.has(id) || id === ignoreId;
        const hasUrl = !!song.previewUrl;
        
        if (hasUrl && !isFailed) {
            return nextIndex;
        }
        
        nextIndex = (nextIndex + direction + playlist.length) % playlist.length;
        count++;
    }
    
    return null;
  };

  const handleNextSong = (ignoreId?: string) => {
    const playlist = activePlaylistRef.current; // Use ref for latest playlist in callbacks
    const idx = currentSongIndexRef.current;
    
    if (idx === null || !playlist) return;

    // Single song playlist logic (SOTD)
    if (playlist.length === 1) {
       const song = playlist[0];
       if (ignoreId && getSongId(song) === ignoreId) {
           setIsPlaying(false); // Stop if the only song failed
           return;
       }
       // If single song is valid, we normally loop or stop. Let's loop.
       if (audioRef.current) {
           audioRef.current.currentTime = 0;
           audioRef.current.play().catch(e => console.warn("Replay failed", e));
       }
       return;
    }

    const nextIndex = findNextPlayableSong(idx, 1, playlist, ignoreId);
    if (nextIndex !== null) {
      setCurrentSongIndex(nextIndex);
      setIsPlaying(true);
    } else {
      setIsPlaying(false); // No playable songs found
    }
  };

  useEffect(() => {
    handleNextSongRef.current = handleNextSong;
  });

  // Audio setup
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const onEnded = () => {
      incrementPlayCountRef.current?.();
      handleNextSongRef.current?.();
    };
    
    const onError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const playlist = activePlaylistRef.current;
      const index = currentSongIndexRef.current;

      console.warn("Audio playback error encountered:", target.error, target.src);

      if (playlist && index !== null) {
          const song = playlist[index];
          const id = getSongId(song);
          
          setFailedSongIds(prev => {
              const next = new Set(prev);
              next.add(id);
              return next;
          });

          // Skip to next, ignoring this failed one
          handleNextSongRef.current?.(id);
      } else {
          setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  // Playback control
  useEffect(() => {
    if (!activePlaylist || currentSongIndex === null || !audioRef.current) return;
    
    const song = activePlaylist[currentSongIndex];
    if (song?.previewUrl) {
      // Check if song is known to fail
      if (failedSongIds.has(getSongId(song))) {
          // If we somehow selected a failed song, try to skip immediately
          // prevent infinite loop if strict mode
          if (isPlaying) handleNextSong(); 
          return;
      }

      if (audioRef.current.src !== song.previewUrl) {
        audioRef.current.src = song.previewUrl;
        audioRef.current.load(); // Ensure new source is loaded
      }

      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.warn("Audio playback play() promise rejected:", e);
                // The onError event usually fires for src issues, 
                // but promise rejection happens for interaction policies.
                // We don't mark as failed here typically, just pause UI.
                if (e.name === 'NotAllowedError') {
                    setIsPlaying(false);
                }
            });
        }
      } else {
        audioRef.current.pause();
      }
    } else if (isPlaying) {
      handleNextSongRef.current?.();
    } else {
      setIsPlaying(false);
      audioRef.current.pause();
    }
  }, [currentSongIndex, isPlaying, activePlaylist, failedSongIds]); // Added failedSongIds dep


  const handleSelectSong = (index: number, source: 'recommendations' | 'favorites' | 'sotd') => {
    let targetPlaylist;
    if (source === 'sotd' && sotd) {
        targetPlaylist = [sotd];
    } else {
        targetPlaylist = source === 'recommendations' ? recommendations : favorites;
    }
    
    const song = targetPlaylist?.[index];
    if (!song?.previewUrl || failedSongIds.has(getSongId(song))) return;

    if (playerSource === source && currentSongIndex === index) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayerSource(source);
      setCurrentSongIndex(index);
      setIsPlaying(true);
    }
  };

  const handleRevealSOTD = async () => {
    setIsSotdLoading(true);
    try {
        const song = await getSongOfTheDay();
        setSotd(song);
        localStorage.setItem('sotd_date', new Date().toLocaleDateString());
        localStorage.setItem('sotd_data', JSON.stringify(song));
        
        // Reward: +25 points for SOTD
        addPoints(25);
        unlockBadge('early_bird');

    } catch (e) {
        console.error("Failed to fetch SOTD", e);
    } finally {
        setIsSotdLoading(false);
    }
  };

  const handlePlaySOTD = () => {
    if (!sotd || !sotd.previewUrl || failedSongIds.has(getSongId(sotd))) return;
    
    if (playerSource === 'sotd' && currentSongIndex === 0) {
        setIsPlaying(!isPlaying);
    } else {
        setPlayerSource('sotd');
        setCurrentSongIndex(0);
        setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (currentSongIndex !== null) {
      setIsPlaying(!isPlaying);
    }
  };

  const handlePrevSong = () => {
    if (currentSongIndex === null || !activePlaylist) return;
    if (activePlaylist.length === 1) {
        if (audioRef.current) audioRef.current.currentTime = 0;
        return;
    }
    const prevIndex = findNextPlayableSong(currentSongIndex, -1, activePlaylist);
    if (prevIndex !== null) {
      setCurrentSongIndex(prevIndex);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && duration) {
        const newProgress = Number(e.target.value);
        const newTime = (newProgress / 100) * duration;
        audioRef.current.currentTime = newTime;
        setProgress(newProgress);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
  };

  const handleSubmit = async (text: string, imageData?: string) => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    setMood(null);
    setIsQueueOpen(false);
    setFailedSongIds(new Set()); // Reset failures on new search
    setView('home'); 
    
    if (audioRef.current) {
        audioRef.current.pause();
    }
    
    if (playerSource === 'recommendations') {
        setCurrentSongIndex(null);
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
    }

    const userAuth = auth.currentUser;

    try {
      const response = await getMoodAndRecommendations(text, imageData);
      setRecommendations(response.songs);
      setMood(response.mood);
      
      const newEntry: MoodEntry = { mood: response.mood, timestamp: Date.now() };
      setMoodHistory(prev => [...prev, newEntry]);

      // Save to Recent Moods list (limit to last 5, keep unique inputs)
      const recentItem: RecentMood = {
        id: Date.now().toString(),
        input: text.trim() || `${response.mood} vibe`,
        mood: response.mood,
        songs: response.songs,
        timestamp: Date.now()
      };
      setRecentMoods(prev => {
        const filtered = prev.filter(item => item.input.toLowerCase() !== recentItem.input.toLowerCase());
        return [recentItem, ...filtered].slice(0, 5);
      });
      
      // Reward: +10 points for a vibe check
      addPoints(10);
      setPlayerSource('recommendations');

      // Sync to Firestore
      if (userAuth) {
        const historyId = Date.now().toString();
        const historyPath = `users/${userAuth.uid}/moodHistory/${historyId}`;
        try {
          await setDoc(doc(db, 'users', userAuth.uid, 'moodHistory', historyId), newEntry);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, historyPath);
        }
      }

      // Check Time/Day Rewards
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay(); // 0 is Sunday, 6 is Saturday

      // Night Owl: 10PM - 4AM
      if (hour >= 22 || hour < 4) {
          unlockBadge('night_owl');
      }

      // Weekend Warrior: Sat or Sun
      if (day === 0 || day === 6) {
          unlockBadge('weekend_warrior');
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShuffle = () => {
    if (activePlaylist && activePlaylist.length > 1) {
        const shuffled = [...activePlaylist];
        let currentIndex = shuffled.length;
        let randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [shuffled[currentIndex], shuffled[randomIndex]] = [
            shuffled[randomIndex], shuffled[currentIndex]];
        }
        
        if (playerSource === 'recommendations') {
            setRecommendations(shuffled);
        } else if (playerSource === 'favorites') {
            setFavorites(shuffled);
        }
        setCurrentSongIndex(0);
        setIsPlaying(false); 
    }
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (!activePlaylist || activePlaylist.length <= 1) return;
    
    const newSongs = [...activePlaylist];
    [newSongs[fromIndex], newSongs[toIndex]] = [newSongs[toIndex], newSongs[fromIndex]];
    
    if (playerSource === 'recommendations') {
        setRecommendations(newSongs);
    } else if (playerSource === 'favorites') {
        setFavorites(newSongs);
    }

    if (currentSongIndex === fromIndex) {
        setCurrentSongIndex(toIndex);
    } else if (currentSongIndex === toIndex) {
        setCurrentSongIndex(fromIndex);
    }
  };

  const getMoodEmoji = (currentMood: Mood | null): string => {
    switch (currentMood) {
      case Mood.Happy: return '😄';
      case Mood.Sad: return '😢';
      case Mood.Angry: return '😠';
      case Mood.Relaxed: return '😌';
      case Mood.Energetic: return '⚡️';
      case Mood.Lonely: return '😔';
      case Mood.Hopeful: return '✨';
      case Mood.Stressed: return '😩';
      case Mood.Romantic: return '😍';
      case Mood.Focused: return '🎯';
      case Mood.Nostalgic: return '🕰️';
      case Mood.Anxious: return '😟';
      default: return '🎶';
    }
  };

  const currentSong = currentSongIndex !== null && activePlaylist ? activePlaylist[currentSongIndex] : null;

  return (
    <div style={{ animation: `fadeIn 0.5s ease-out forwards`}} className="pb-32 relative z-10">
      <Header currentView={view} onViewChange={setView} isDark={isDark} toggleTheme={toggleTheme} />
      
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        
        {/* HOME VIEW */}
        {view === 'home' && (
          <>
            <div className="w-full">
               <SongOfTheDay 
                 song={sotd}
                 isLoading={isSotdLoading}
                 onReveal={handleRevealSOTD}
                 onPlayPause={handlePlaySOTD}
                 isPlaying={isPlaying}
                 isCurrent={playerSource === 'sotd'}
                 isFavorite={sotd ? isSongFavorite(sotd) : false}
                 onToggleFavorite={() => sotd && toggleFavorite(sotd)}
               />
              <MoodInputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
            
            <div className="w-full max-w-3xl mt-12">
              {isLoading && <Loader />}
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-200 p-6 rounded-2xl text-center backdrop-blur-md shadow-xl" role="alert">
                  <i className="fa-solid fa-triangle-exclamation text-2xl mb-2 text-red-500 dark:text-red-400"></i>
                  <p className="font-semibold">Oops! Something went wrong.</p>
                  <p className="text-sm mt-1 opacity-80">{error}</p>
                </div>
              )}

              {recommendations && mood && !isLoading && (
                <div className="space-y-6 animate-fadeInUp">
                  {/* COMPACT RECENT MOODS ROW */}
                  {recentMoods.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 dark:text-slate-500 uppercase whitespace-nowrap mr-1">
                        Recent Vibes:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {recentMoods.map((item) => {
                          const isActive = item.songs[0]?.title === recommendations[0]?.title && item.songs[0]?.artist === recommendations[0]?.artist;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setRecommendations(item.songs);
                                setMood(item.mood);
                                setPlayerSource('recommendations');
                                setCurrentSongIndex(null);
                                setIsPlaying(false);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 backdrop-blur-md whitespace-nowrap cursor-pointer ${
                                isActive 
                                  ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white border-transparent shadow-md shadow-indigo-500/15 scale-102'
                                  : 'bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20'
                              }`}
                            >
                              <span>{getMoodEmoji(item.mood)}</span>
                              <span className="max-w-[120px] truncate">"{item.input}"</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
                        <div className="flex items-center gap-4">
                            <div className="text-5xl drop-shadow-lg">{getMoodEmoji(mood)}</div>
                            <div>
                                 <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                                    {mood} <span className="text-slate-500 dark:text-slate-400 font-light">Vibes</span>
                                </h2>
                                <p className="text-indigo-600 dark:text-indigo-200 text-sm font-light mt-1">
                                    Found {recommendations.length} tracks matching your energy
                                </p>
                            </div>
                        </div>
                      
                        {recommendations.length > 1 && (
                            <button
                                onClick={handleShuffle}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-200 rounded-xl transition-all text-sm font-medium border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 backdrop-blur-md"
                            >
                                <i className="fa-solid fa-shuffle"></i>
                                Shuffle
                            </button>
                        )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {recommendations.map((song, index) => (
                      <SongCard 
                        key={`${song.title}-${song.artist}-${index}`} 
                        song={song} 
                        index={index}
                        onSelectSong={(idx) => handleSelectSong(idx, 'recommendations')}
                        isCurrentlySelected={playerSource === 'recommendations' && currentSongIndex === index}
                        isPlaying={isPlaying}
                        isFavorite={isSongFavorite(song)}
                        onToggleFavorite={() => toggleFavorite(song)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT MOODS - GLORIOUS DASHBOARD (When not loading, no active recommendations, and has recent moods) */}
              {!isLoading && !error && !recommendations && recentMoods.length > 0 && (
                <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl mb-8 animate-fadeInUp w-full">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20 dark:border-indigo-500/30">
                        <i className="fa-solid fa-clock-rotate-left text-lg text-indigo-600 dark:text-indigo-400"></i>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Recent Moods</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-light mt-0.5">Pick up where you left off</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleClearAllRecentMoods}
                      className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-all text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentMoods.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setRecommendations(item.songs);
                          setMood(item.mood);
                          setPlayerSource('recommendations');
                          setCurrentSongIndex(null);
                          setIsPlaying(false);
                        }}
                        className="group relative cursor-pointer text-left p-5 bg-white/40 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 rounded-2xl transition-all duration-300 hover:shadow-lg flex flex-col justify-between h-40"
                      >
                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteRecentMood(e, item.id)}
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg cursor-pointer z-20"
                          title="Remove from history"
                        >
                          <i className="fa-solid fa-xmark text-sm"></i>
                        </button>

                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl filter drop-shadow">{getMoodEmoji(item.mood)}</span>
                            <div>
                              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">{item.mood}</span>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            "{item.input}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-4 border-t border-slate-100 dark:border-white/5 pt-3 font-light">
                          <span className="bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-medium">
                            {item.songs.length} Song{item.songs.length !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium transition-colors">
                            Load Playlist <i className="fa-solid fa-chevron-right text-[10px] transform group-hover:translate-x-1 transition-transform"></i>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isLoading && !error && !recommendations && (
                 <div className="text-center text-slate-400 mt-12 p-12 border border-dashed border-slate-300 dark:border-slate-700/50 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-white/50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-white/10">
                        <i className="fa-solid fa-headphones text-3xl text-slate-400 dark:text-slate-500"></i>
                    </div>
                    <p className="text-xl font-medium text-slate-600 dark:text-slate-300">Your personalized playlist awaits.</p>
                    <p className="text-sm text-slate-500 mt-2 font-light">Enter your mood above to get started.</p>
                 </div>
              )}
            </div>
          </>
        )}

        {/* FAVORITES VIEW */}
        {view === 'favorites' && (
          <div className="w-full max-w-3xl animate-fadeInUp">
            <div className="bg-gradient-to-r from-red-500/10 to-indigo-500/10 dark:from-red-900/40 dark:to-indigo-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center border border-red-500/20 dark:border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                             <i className="fa-solid fa-heart text-3xl text-red-500 dark:text-red-400 drop-shadow-md"></i>
                        </div>
                        <div>
                             <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                                Your <span className="text-red-500 dark:text-red-400">Collection</span>
                            </h2>
                            <p className="text-indigo-600 dark:text-indigo-200 text-sm font-light mt-1">
                                {favorites.length} {favorites.length === 1 ? 'song' : 'songs'} saved to your library
                            </p>
                        </div>
                    </div>
                    
                    {favorites.length > 1 && (
                        <button
                            onClick={handleShuffle}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-200 rounded-xl transition-all text-sm font-medium border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 backdrop-blur-md"
                        >
                            <i className="fa-solid fa-shuffle"></i>
                            Shuffle
                        </button>
                    )}
                </div>
            </div>

            {favorites.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                {favorites.map((song, index) => (
                    <SongCard 
                    key={`${song.title}-${song.artist}-${index}`} 
                    song={song} 
                    index={index}
                    onSelectSong={(idx) => handleSelectSong(idx, 'favorites')}
                    isCurrentlySelected={playerSource === 'favorites' && currentSongIndex === index}
                    isPlaying={isPlaying}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(song)}
                    />
                ))}
                </div>
            ) : (
                <div className="text-center text-slate-400 mt-12 p-12 border border-dashed border-slate-300 dark:border-slate-700/50 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-white/50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-white/10">
                        <i className="fa-regular fa-heart text-3xl text-slate-400 dark:text-slate-500"></i>
                    </div>
                    <p className="text-xl font-medium text-slate-600 dark:text-slate-300">No favorites yet.</p>
                    <p className="text-sm text-slate-500 mt-2 font-light">Start discovering music and tap the heart icon to save songs here.</p>
                    <button 
                        onClick={() => setView('home')}
                        className="mt-6 px-6 py-2 bg-indigo-600/10 dark:bg-indigo-600/20 hover:bg-indigo-600/20 dark:hover:bg-indigo-600/40 text-indigo-600 dark:text-indigo-300 rounded-xl border border-indigo-500/20 dark:border-indigo-500/30 transition-all duration-300"
                    >
                        Go Discover
                    </button>
                </div>
            )}
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {view === 'analytics' && (
            <AnalyticsDashboard 
                history={moodHistory}
                onGoBack={() => setView('home')}
            />
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && (
            <ProfileSection 
                user={user}
                rewards={rewards}
                stats={{
                    favoritesCount: favorites.length,
                    totalMoods: moodHistory.length
                }}
                onLogout={onLogout}
                onUpdateUser={onUpdateUser}
            />
        )}

      </main>
      <Footer />
      
      {activePlaylist && (
        <SongQueue 
            songs={activePlaylist}
            currentSongIndex={currentSongIndex}
            isOpen={isQueueOpen}
            onClose={() => setIsQueueOpen(false)}
            onSelect={(idx) => handleSelectSong(idx, playerSource)}
            onReorder={handleReorder}
        />
      )}

      <AudioPlayer 
        song={currentSong}
        isPlaying={isPlaying}
        progress={progress}
        volume={volume}
        duration={duration}
        currentTime={currentTime}
        onPlayPause={handlePlayPause}
        onNext={handleNextSong}
        onPrev={handlePrevSong}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        isQueueOpen={isQueueOpen}
      />
    </div>
  );
};

export default MusicRecommender;