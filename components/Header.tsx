import React from 'react';

interface HeaderProps {
  currentView: 'home' | 'favorites' | 'analytics' | 'profile';
  onViewChange: (view: 'home' | 'favorites' | 'analytics' | 'profile') => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, isDark, toggleTheme }) => {
  return (
    <header className="pt-10 pb-6 px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center">
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm hover:scale-110 transition-all duration-300 text-slate-600 dark:text-slate-300"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className="w-14 h-14 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <i className="fa-solid fa-music text-2xl md:text-3xl text-indigo-500 dark:text-indigo-400"></i>
        </div>
        <h1 className="text-[28px] md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 dark:from-indigo-300 dark:via-purple-300 dark:to-fuchsia-300 drop-shadow-sm">
          AI Mood Music
        </h1>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex p-1 bg-slate-200/50 dark:bg-white/5 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-white/10 shadow-lg overflow-x-auto max-w-full no-scrollbar">
        <button
          onClick={() => onViewChange('home')}
          className={`flex items-center px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            currentView === 'home' 
              ? 'bg-white dark:bg-indigo-500/20 text-indigo-600 dark:text-white shadow-sm border border-slate-200 dark:border-indigo-500/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
          Discover
        </button>
        <button
          onClick={() => onViewChange('favorites')}
          className={`flex items-center px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            currentView === 'favorites' 
              ? 'bg-white dark:bg-red-500/20 text-red-500 dark:text-white shadow-sm border border-slate-200 dark:border-red-500/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-heart mr-2"></i>
          Favorites
        </button>
        <button
          onClick={() => onViewChange('analytics')}
          className={`flex items-center px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            currentView === 'analytics' 
              ? 'bg-white dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-white shadow-sm border border-slate-200 dark:border-fuchsia-500/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-chart-pie mr-2"></i>
          Analytics
        </button>
        <button
          onClick={() => onViewChange('profile')}
          className={`flex items-center px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            currentView === 'profile' 
              ? 'bg-white dark:bg-sky-500/20 text-sky-600 dark:text-white shadow-sm border border-slate-200 dark:border-sky-500/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <i className="fa-solid fa-user mr-2"></i>
          Profile
        </button>
      </div>

      {currentView === 'home' && (
        <p className="mt-6 text-md md:text-lg text-slate-500 dark:text-slate-300/80 font-light tracking-wide animate-fadeIn">
          Tell us how you feel, and we'll find the perfect soundtrack.
        </p>
      )}
    </header>
  );
};

export default Header;