export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  currentStreak: number;
  lastSessionDate?: string;
  totalFocusMinutes: number;
  createdAt: any;
}

export interface FocusSession {
  id?: string;
  userId: string;
  quote: string;
  plannedDuration: number; // in seconds
  actualDuration?: number; // in seconds
  startTime: any;
  endTime?: any;
  averageScore: number;
  productiveMinutes: number;
  distractedMinutes: number;
  idleMinutes: number;
  tabSwitches: number;
  classification?: "Superb" | "Good" | "Fair" | "Distracted";
  silentMode: boolean;
}

export interface MonthlyStats {
  userId: string;
  month: string; // YYYY-MM
  totalTime: number;
  avgScore: number;
  bestDay: string;
  worstDay: string;
}
