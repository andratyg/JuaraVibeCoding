export type VibeMode = 'hustle' | 'zen' | 'balance';

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
  theme?: 'light' | 'dark' | 'system';
}

export interface UserProfile {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  energyScore: number;
  vibeMode: VibeMode;
  fitnessProfile?: {
    height: number;
    weight: number;
    goal: string;
    equipment: string[];
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
  score: number;
  mode: string;
  quote: string;
  createdAt: Date;
}

export interface Workout {
  id: string;
  name: string;
  type: string;
  exercises: Exercise[];
  duration: number;
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
