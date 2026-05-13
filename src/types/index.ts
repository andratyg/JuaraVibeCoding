export type VibeMode = 'deep-work' | 'recovery' | 'balance';

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    messages: boolean;
    alerts: boolean;
  };
  privacy: {
    visibility: 'public' | 'friends' | 'private';
    dataSharing: boolean;
  };
  aiPreferences: {
    coachTone: 'balanced' | 'tough' | 'supportive' | 'stoic';
    nudgeFrequency: 'low' | 'normal' | 'high';
    focusAreas: string[];
  };
  accessibility: {
    highContrast: boolean;
    fontScale: number;
    reducedMotion: boolean;
  };
  theme?: 'light' | 'dark' | 'system';
}

export interface UserProfile {
  id: string;
  displayName: string | null;
  fullName?: string;
  email: string | null;
  phoneNumber?: string;
  photoURL: string | null;
  bio?: string;
  energyScore: number;
  vibeMode: VibeMode;
  fitnessProfile?: {
    height: number;
    weight: number;
    goal: string;
    equipment: string[];
  };
  socialLinks?: {
    google?: boolean;
    github?: boolean;
    twitter?: string;
    linkedin?: string;
  };
  streak: number;
  lastCheckIn?: Date;
  settings?: UserSettings;
}

export interface Task {
  id: string;
  title: string;
  duration: number; // minutes
  priority: 'Critical' | 'High' | 'Med' | 'Low';
  status: 'To-Do' | 'In Progress' | 'Blocked' | 'Waiting for Review' | 'Completed';
  category: string;
  tags?: string[];
  project?: string;
  deadline?: Date | null;
  recurrence?: 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom';
  reminders?: number[]; // minutes before
  attachments?: { name: string; url: string }[];
  startTime?: Date;
  endTime?: Date;
  completed: boolean;
  createdAt: Date;
}

export interface EnergyCheckIn {
  id: string;
  energy: number;
  stress: number;
  focus: number;
  enthusiasm?: number;
  score: number;
  mode: string;
  quote: string;
  recommendations?: string[];
  explanation?: {
    energy: string;
    stress: string;
    focus: string;
    enthusiasm: string;
  };
  createdAt: Date;
}

export interface Workout {
  id: string;
  name: string;
  type: string;
  exercises: Exercise[];
  totalDuration: number;
  duration: number;
  intensity: string;
  estimatedCalories: number;
  motivationalMessage: string;
  energyScoreAtTime: number;
  completed: boolean;
  createdAt: Date;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  duration?: string;
  description: string;
  formTip?: string;
}

export interface Journal {
  id: string;
  rating: number;
  highlight: string;
  challenge: string;
  mood: string;
  reflection: string;
  aiResponse: string;
  createdAt: Date;
}
