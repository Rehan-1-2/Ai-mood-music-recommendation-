import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile, UserRewards } from '../types';
import { BADGES, getProgressToNextLevel, getNextLevelThreshold } from '../services/rewardService';
import { auth, db } from '../src/lib/firebase';
import { handleFirestoreError, OperationType } from '../src/lib/firestoreUtils';

interface ProfileSectionProps {
  user: UserProfile;
  rewards: UserRewards;
  stats: {
    favoritesCount: number;
    totalMoods: number;
  };
  onLogout: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, rewards, stats, onLogout, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
      username: user.username,
      avatarUrl: user.avatarUrl || ''
  });

  const progressToNextLevel = getProgressToNextLevel(rewards.points, rewards.level);
  const nextLevelPoints = getNextLevelThreshold(rewards.level);
  const unlockedCount = rewards.unlockedBadges.length;
  const totalBadges = BADGES.length;

  const handleEditClick = () => {
      setEditForm({ 
          username: user.username, 
          avatarUrl: user.avatarUrl || '' 
      });
      setIsEditing(true);
  };

  const handleSave = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      setIsSaving(true);
      try {
          // 1. Update Firebase Auth Profile
          await updateProfile(currentUser, {
              displayName: editForm.username,
              photoURL: editForm.avatarUrl
          });

          // 2. Update Firestore User Doc
          await updateDoc(doc(db, 'users', currentUser.uid), {
              username: editForm.username,
              avatarUrl: editForm.avatarUrl
          });

          onUpdateUser({
              ...user,
              username: editForm.username,
              avatarUrl: editForm.avatarUrl
          });
          setIsEditing(false);
      } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="w-full max-w-4xl animate-fadeInUp pb-24 space-y-8">
      
      {/* User Card */}
      <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group cursor-pointer" onClick={handleEditClick} title="Click to edit profile picture">
             <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden relative">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500">
                            {user.username.charAt(0).toUpperCase()}
                        </span>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fa-solid fa-camera text-white text-3xl drop-shadow-md"></i>
                    </div>
                </div>
             </div>
             <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white dark:border-slate-900 shadow-md">
                Lvl {rewards.level}
             </div>
          </div>
          
          <div className="text-center md:text-left flex-1 w-full">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{user.username}</h2>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-slate-500 dark:text-slate-400 text-sm mb-4">
                <span className="flex items-center gap-2">
                    <i className="fa-regular fa-envelope"></i>
                    {user.email}
                </span>
                <span className="hidden md:inline w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                <span className="flex items-center gap-2">
                    <i className="fa-regular fa-calendar"></i>
                    Joined {user.joinDate}
                </span>
            </div>

            {/* Level Progress */}
            <div className="w-full max-w-md">
                <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    <span>{rewards.points} XP</span>
                    <span>Next Level: {nextLevelPoints} XP</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${progressToNextLevel}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex gap-3">
             <button 
                onClick={handleEditClick}
                className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors text-sm font-medium"
             >
                Edit Profile
             </button>
          </div>
        </div>
      </div>

      {/* Rewards & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Achievements Section */}
        <div className="md:col-span-2 bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-lg backdrop-blur-md">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <i className="fa-solid fa-trophy text-yellow-500"></i>
                Achievements
                <span className="ml-auto text-sm font-medium px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-full text-slate-500 dark:text-slate-400">
                    {unlockedCount} / {totalBadges} Unlocked
                </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {BADGES.map((badge) => {
                    const isUnlocked = rewards.unlockedBadges.includes(badge.id);
                    return (
                        <div 
                            key={badge.id} 
                            className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center gap-2 ${
                                isUnlocked 
                                ? 'bg-white/50 dark:bg-white/10 border-indigo-200 dark:border-indigo-500/30 shadow-md scale-100' 
                                : 'bg-slate-100/50 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-60 grayscale'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1 ${isUnlocked ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <i className={`fa-solid ${badge.icon} ${isUnlocked ? badge.color : 'text-slate-400'}`}></i>
                            </div>
                            <div>
                                <h4 className={`font-bold text-sm ${isUnlocked ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {badge.name}
                                </h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                                    {badge.description}
                                </p>
                            </div>
                            {!isUnlocked && (
                                <div className="mt-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                    Locked
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Stats Cards */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-4 group hover:border-indigo-500/30 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                    <i className="fa-solid fa-fire"></i>
                </div>
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Current Streak</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{rewards.currentStreak || 0} Days</p>
                </div>
            </div>

            <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-4 group hover:border-indigo-500/30 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <i className="fa-solid fa-heart"></i>
                </div>
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Liked Songs</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{stats.favoritesCount}</p>
                </div>
            </div>

            <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-4 group hover:border-indigo-500/30 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Vibes Found</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{stats.totalMoods}</p>
                </div>
            </div>
            
            <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-4 group hover:border-indigo-500/30 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <i className="fa-solid fa-headphones"></i>
                </div>
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Songs Played</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{rewards.songsPlayed || 0}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Settings / Actions */}
      <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
         <div className="p-6 border-b border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Account Settings</h3>
         </div>
         <div className="divide-y divide-slate-200 dark:divide-white/5">
            <div className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <i className="fa-solid fa-bell"></i>
                    </div>
                    <div>
                        <p className="font-medium text-slate-800 dark:text-white">Notifications</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your email preferences</p>
                    </div>
                </div>
                <i className="fa-solid fa-chevron-right text-slate-400 text-sm"></i>
            </div>
            
            <div className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <div>
                        <p className="font-medium text-slate-800 dark:text-white">Privacy & Security</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Change password and security settings</p>
                    </div>
                </div>
                <i className="fa-solid fa-chevron-right text-slate-400 text-sm"></i>
            </div>
         </div>
      </div>

      <div className="flex justify-center">
         <button 
            onClick={onLogout}
            className="group flex items-center gap-3 px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all duration-300 font-medium"
         >
            <i className="fa-solid fa-arrow-right-from-bracket group-hover:-translate-x-1 transition-transform"></i>
            Log Out
         </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-fadeInUp">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Edit Profile</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Username</label>
                        <input 
                            type="text" 
                            value={editForm.username}
                            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="opacity-60 cursor-not-allowed">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Email (Read-only)</label>
                        <input 
                            type="email" 
                            value={user.email}
                            disabled
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none text-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Profile Picture URL</label>
                        <input 
                            type="text" 
                            value={editForm.avatarUrl}
                            onChange={(e) => setEditForm({...editForm, avatarUrl: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-white placeholder-slate-400"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="flex-1 py-3 px-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                    >
                        {isSaving ? (
                            <span className="flex items-center justify-center gap-2">
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Saving...
                            </span>
                        ) : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ProfileSection;