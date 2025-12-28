
export enum JarColor {
  YELLOW = 'YELLOW', // Happy
  PINK = 'PINK',     // Thankful
  RED = 'RED',       // Angry
  GREEN = 'GREEN',   // Anxious
  BLUE = 'BLUE',     // Lonely
  PURPLE = 'PURPLE', // Sad
  NEUTRAL = 'NEUTRAL' // Default state
}

export type ReflectionMode = 'reflect' | 'reframe' | 'action' | 'affirmation' | 'trap';

export interface JournalEntryRequest {
  transcript: string;
  timestamp: string;
  inputType: 'text' | 'audio' | 'video';
}

export interface AnalysisResponse {
  detected_heart_state: {
    quadrant: string;
    specific_emotion: string;
    jar_color: string;
  };
  context_tags: {
    activity: string;
    companions: string;
    location: string;
  };
  biblical_response: {
    primary_verse: string;
    deep_dive_reflection: string;
    prayer_prompt: string;
  };
  disclaimer: string; // Mandatory safety boundary
}

export interface NudgeRequest {
  time_of_day: string;
  user_goal: string;
  recent_dominant_emotion?: string;
  check_in_streak: number;
}

export interface NudgeResponse {
  notification: {
    title: string;
    body: string;
    category: string;
  };
  in_app_nudge: {
    text: string;
    associated_jar_color: string;
  };
}

export interface Reminder {
  id: string;
  label: string;
  time: string; // Format "HH:mm" 24h
  isEnabled: boolean;
  isSurprise?: boolean;
}

export interface WeeklyAnalysisRequest {
  past_entries: Array<{
    date: string;
    emotion: string;
    context: string;
  }>;
}

export interface WeeklyAnalysisResponse {
  dominant_color: string;
  trend_summary: string;
  environmental_insight: string; // e.g., "Work is a trigger for anxiety"
  spiritual_mission: {
    focus_area: string;
    deep_study_passage: string;
    practical_discipline: string;
  };
}

export interface UserProfile {
  id?: string;
  email?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  spiritual_goals: string[];
  privacy_agreed: boolean;
  has_onboarded: boolean;
}

// Helper to extract color enum from the string response "COLOR (DESCRIPTION)"
export const parseJarColor = (colorString: string): JarColor => {
  if (!colorString) return JarColor.NEUTRAL;
  const upper = colorString.toUpperCase();
  if (upper.includes('YELLOW')) return JarColor.YELLOW;
  if (upper.includes('PINK')) return JarColor.PINK;
  if (upper.includes('RED')) return JarColor.RED;
  if (upper.includes('GREEN')) return JarColor.GREEN;
  if (upper.includes('BLUE')) return JarColor.BLUE;
  if (upper.includes('PURPLE')) return JarColor.PURPLE;
  return JarColor.NEUTRAL;
};
