import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import LandingPage from './components/LandingPage';
import MusicRecommender from './components/MusicRecommender';
import { UserProfile } from './types';
import { auth } from './src/lib/firebase';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [showApp, setShowApp] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const userProfile: UserProfile = {
          username: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          joinDate: new Date(user.metadata.creationTime || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          avatarUrl: user.photoURL || undefined
        };
        setCurrentUser(userProfile);
        setShowApp(true);
      } else {
        setCurrentUser(null);
        setShowApp(false);
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowApp(false);
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col selection:bg-indigo-500/30 relative overflow-x-hidden">
       {/* Ambient Background Mesh */}
       <div className="fixed inset-0 z-[-1] bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-400/20 dark:bg-fuchsia-600/15 blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-400/20 dark:bg-cyan-600/15 blur-[120px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
       </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
         @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        /* Custom styles for range inputs */
        input[type=range].accent-primary::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: #818cf8; /* Indigo 400 */
          border-radius: 50%;
          cursor: pointer;
          margin-top: -5px;
          box-shadow: 0 0 10px rgba(129, 140, 248, 0.5);
          transition: background 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        input[type=range].accent-primary::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: #818cf8;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(129, 140, 248, 0.5);
        }
        input[type=range].accent-primary:hover::-webkit-slider-thumb {
            background: #a5b4fc;
            transform: scale(1.2);
        }
        input[type=range].accent-primary:hover::-moz-range-thumb {
            background: #a5b4fc;
            transform: scale(1.2);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {!showApp ? (
        <LandingPage 
          isDark={theme === 'dark'}
          toggleTheme={toggleTheme}
        />
      ) : (
        <MusicRecommender 
          isDark={theme === 'dark'}
          toggleTheme={toggleTheme}
          user={currentUser!}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
        />
      )}
    </div>
  );
};

export default App;