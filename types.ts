export enum Mood {
  Happy = 'Happy',
  Sad = 'Sad',
  Angry = 'Angry',
  Relaxed = 'Relaxed',
  Energetic = 'Energetic',
  Lonely = 'Lonely',
  Hopeful = 'Hopeful',
  Stressed = 'Stressed',
  Romantic = 'Romantic',
  Focused = 'Focused',
  Nostalgic = 'Nostalgic',
  Anxious = 'Anxious',
}

export interface Song {
  title: string;
  artist: string;
  spotifyUrl: string;
  albumArtUrl: string;
  previewUrl: string | null;
}

export interface RecommendationResponse {
  mood: Mood;
  songs: Song[];
}

export interface UserProfile {
  username: string;
  email: string;
  joinDate: string;
  avatarUrl?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface UserRewards {
  points: number;
  level: number;
  unlockedBadges: string[]; // List of Badge IDs
  songsPlayed: number;
  currentStreak: number;
  lastActiveDate: string | null; // ISO Date string YYYY-MM-DD
}