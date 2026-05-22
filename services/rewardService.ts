import { Badge } from '../types';

export const LEVELS = [
  { level: 1, minPoints: 0 },
  { level: 2, minPoints: 100 },
  { level: 3, minPoints: 300 },
  { level: 4, minPoints: 600 },
  { level: 5, minPoints: 1000 },
  { level: 6, minPoints: 1500 },
  { level: 7, minPoints: 2100 },
  { level: 8, minPoints: 2800 },
  { level: 9, minPoints: 3600 },
  { level: 10, minPoints: 5000 },
];

export const BADGES: Badge[] = [
  {
    id: 'first_vibe',
    name: 'Vibe Explorer',
    description: 'Generated your first mood playlist.',
    icon: 'fa-wand-magic-sparkles',
    color: 'text-yellow-400'
  },
  {
    id: 'streak_3',
    name: 'On Fire',
    description: 'Reached a 3-day streak.',
    icon: 'fa-fire',
    color: 'text-orange-500'
  },
  {
    id: 'streak_7',
    name: 'Weekly Vibe',
    description: 'Reached a 7-day streak.',
    icon: 'fa-fire-flame-curved',
    color: 'text-orange-600'
  },
  {
    id: 'streak_30',
    name: 'Unstoppable',
    description: 'Reached a 30-day streak.',
    icon: 'fa-calendar-check',
    color: 'text-amber-500'
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Vibed late at night (10PM - 4AM).',
    icon: 'fa-moon',
    color: 'text-indigo-400'
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Used the app on a weekend.',
    icon: 'fa-calendar-day',
    color: 'text-pink-500'
  },
  {
    id: 'collector_5',
    name: 'Curator',
    description: 'Saved 5 songs to your favorites.',
    icon: 'fa-heart',
    color: 'text-red-500'
  },
  {
    id: 'collector_20',
    name: 'Super Fan',
    description: 'Saved 20 songs to your favorites.',
    icon: 'fa-record-vinyl',
    color: 'text-fuchsia-500'
  },
  {
    id: 'listener_100',
    name: 'Audiophile',
    description: 'Played 100 songs.',
    icon: 'fa-headphones',
    color: 'text-emerald-500'
  },
  {
    id: 'listener_200',
    name: 'Music Legend',
    description: 'Played 200 songs.',
    icon: 'fa-star',
    color: 'text-purple-500'
  },
  {
    id: 'mood_master',
    name: 'Mood Master',
    description: 'Tried 5 different moods.',
    icon: 'fa-palette',
    color: 'text-indigo-500'
  },
  {
    id: 'early_bird',
    name: 'Daily Discoverer',
    description: 'Revealed the Song of the Day.',
    icon: 'fa-sun',
    color: 'text-amber-500'
  },
  {
    id: 'level_5',
    name: 'High Frequency',
    description: 'Reached Level 5.',
    icon: 'fa-music',
    color: 'text-cyan-400'
  }
];

export const calculateLevel = (points: number): number => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i].level;
    }
  }
  return 1;
};

export const getNextLevelThreshold = (currentLevel: number): number => {
  const nextLevel = LEVELS.find(l => l.level === currentLevel + 1);
  return nextLevel ? nextLevel.minPoints : LEVELS[LEVELS.length - 1].minPoints * 1.5; // Cap scaling
};

export const getProgressToNextLevel = (points: number, currentLevel: number): number => {
  const currentThreshold = LEVELS.find(l => l.level === currentLevel)?.minPoints || 0;
  const nextThreshold = getNextLevelThreshold(currentLevel);
  
  if (nextThreshold === currentThreshold) return 100; // Max level
  
  const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};