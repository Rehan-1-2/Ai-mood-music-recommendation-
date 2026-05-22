import React, { useMemo } from 'react';
import { Mood } from '../types';

export interface MoodEntry {
  mood: Mood;
  timestamp: number;
}

interface AnalyticsDashboardProps {
  history: MoodEntry[];
  onGoBack: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ history, onGoBack }) => {
  // --- Data Processing ---

  const totalSessions = history.length;

  // 1. Mood Frequency (Distribution)
  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(entry => {
      counts[entry.mood] = (counts[entry.mood] || 0) + 1;
    });
    return counts;
  }, [history]);

  // Top Mood
  const topMood = useMemo(() => {
    if (totalSessions === 0) return 'N/A';
    const entries = Object.entries(moodCounts);
    if (entries.length === 0) return 'N/A';
    return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }, [moodCounts, totalSessions]);

  // Sort moods by frequency for the chart
  const sortedMoods = useMemo(() => {
    return Object.entries(moodCounts)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 5); // Top 5
  }, [moodCounts]);

  // 2. Weekly Activity (Last 7 days)
  const dailyActivity = useMemo(() => {
    const days = 7;
    const activity = new Array(days).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    history.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today.getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays < days) {
        // diffDays is 0 for today, 1 for yesterday... index needs to be reversed for chart (0 is 6 days ago)
        if (days - 1 - diffDays >= 0) {
            activity[days - 1 - diffDays]++;
        }
      }
    });
    return activity;
  }, [history]);

  const maxActivity = Math.max(...dailyActivity, 1);

  // Helper for Chart colors
  const getMoodColor = (moodName: string) => {
    // Simple hash to color or preset map could work, using distinct Tailwind-ish hexes
    const colors: Record<string, string> = {
      [Mood.Happy]: '#fbbf24', // Amber
      [Mood.Sad]: '#60a5fa',   // Blue
      [Mood.Angry]: '#ef4444', // Red
      [Mood.Relaxed]: '#34d399', // Emerald
      [Mood.Energetic]: '#f472b6', // Pink
      [Mood.Romantic]: '#f87171', // Red-400
      [Mood.Focused]: '#818cf8', // Indigo
      [Mood.Lonely]: '#94a3b8', // Slate
    };
    return colors[moodName] || '#a78bfa'; // Default Purple
  };

  const getDayLabel = (index: number) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (history.length === 0) {
    return (
      <div className="w-full max-w-4xl animate-fadeInUp">
        <div className="text-center text-slate-400 mt-12 p-12 border border-dashed border-slate-300 dark:border-slate-700/50 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-sm">
          <div className="w-20 h-20 bg-white/50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-white/10">
              <i className="fa-solid fa-chart-line text-3xl text-slate-400 dark:text-slate-500"></i>
          </div>
          <p className="text-xl font-medium text-slate-600 dark:text-slate-300">No data yet.</p>
          <p className="text-sm text-slate-500 mt-2 font-light">Start using the app to track your mood history.</p>
          <button 
              onClick={onGoBack}
              className="mt-6 px-6 py-2 bg-indigo-600/10 dark:bg-indigo-600/20 hover:bg-indigo-600/20 dark:hover:bg-indigo-600/40 text-indigo-600 dark:text-indigo-300 rounded-xl border border-indigo-500/20 dark:border-indigo-500/30 transition-all duration-300"
          >
              Start Exploring
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl animate-fadeInUp space-y-6 pb-24">
      
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Sessions */}
        <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Vibe Checks</p>
            <p className="text-4xl font-bold text-slate-800 dark:text-white mt-1">{totalSessions}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-400">
             <i className="fa-solid fa-layer-group text-xl"></i>
          </div>
        </div>

        {/* Top Mood */}
        <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Top Mood</p>
            <p className="text-4xl font-bold text-slate-800 dark:text-white mt-1 truncate">{topMood}</p>
          </div>
           <div className="w-12 h-12 bg-fuchsia-500/10 dark:bg-fuchsia-500/20 rounded-xl flex items-center justify-center text-fuchsia-500 dark:text-fuchsia-400">
             <i className="fa-solid fa-crown text-xl"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 2. Mood Distribution Chart */}
        <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-md flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Most Common Moods</h3>
          <div className="flex-1 flex flex-col justify-center space-y-4">
            {sortedMoods.map(([mood, count], index) => {
               const percentage = (count / totalSessions) * 100;
               return (
                 <div key={mood} className="space-y-1">
                   <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                     <span>{mood}</span>
                     <span>{count} ({Math.round(percentage)}%)</span>
                   </div>
                   <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                     <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: getMoodColor(mood),
                          animation: `slideRight 1s ease-out forwards`
                        }}
                     ></div>
                   </div>
                 </div>
               );
            })}
          </div>
        </div>

        {/* 3. Weekly Activity Graph */}
        <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-md flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Activity (Last 7 Days)</h3>
          <div className="flex-1 flex items-end justify-between gap-2 min-h-[150px] relative pb-6">
             {/* Y-axis lines (Visual only) */}
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-t border-slate-400 dark:border-white w-full"></div>
                <div className="border-t border-slate-400 dark:border-white w-full"></div>
                <div className="border-t border-slate-400 dark:border-white w-full"></div>
             </div>
             
             {dailyActivity.map((count, index) => {
                const heightPercentage = count === 0 ? 0 : (count / maxActivity) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1 h-full justify-end z-10 group">
                    <div 
                      className="w-full max-w-[24px] bg-indigo-400 dark:bg-indigo-500 rounded-t-lg transition-all duration-700 ease-out hover:bg-fuchsia-400 dark:hover:bg-fuchsia-500 relative"
                      style={{ 
                          height: `${heightPercentage}%`,
                          minHeight: count > 0 ? '4px' : '0' 
                      }}
                    >
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {count} sessions
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">{getDayLabel(index)}</span>
                  </div>
                );
             })}
          </div>
        </div>
      </div>
      
      {/* 4. Recent History Log */}
      <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-md">
         <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Vibe Log</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                        <th className="py-2 px-4 font-medium uppercase tracking-wider">Date</th>
                        <th className="py-2 px-4 font-medium uppercase tracking-wider">Mood</th>
                        <th className="py-2 px-4 font-medium uppercase tracking-wider text-right">Time</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {history.slice().reverse().slice(0, 5).map((entry, idx) => (
                        <tr key={idx} className="border-b border-slate-200/50 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                {new Date(entry.timestamp).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300">
                                    {entry.mood}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 font-mono text-xs">
                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                        </tr>
                    ))}
                    {history.length === 0 && (
                        <tr>
                            <td colSpan={3} className="py-4 text-center text-slate-500">No history available</td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
      </div>

      <style>{`
        @keyframes slideRight {
          from { width: 0; }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;