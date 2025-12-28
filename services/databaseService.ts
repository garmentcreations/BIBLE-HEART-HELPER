import { supabase } from './supabaseClient';
import { JournalEntryRequest, AnalysisResponse } from '../types';

const LOCAL_STORAGE_KEY = 'bible_helper_entries';

// Helper: Save to local storage (Offline Mode)
const saveLocally = (userId: string, request: JournalEntryRequest, analysis: AnalysisResponse) => {
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing = existingStr ? JSON.parse(existingStr) : [];
    
    const newEntry = {
      id: crypto.randomUUID(),
      user_id: userId,
      transcript: request.transcript,
      emotion: analysis.detected_heart_state.specific_emotion,
      jar_color: analysis.detected_heart_state.jar_color,
      quadrant: analysis.detected_heart_state.quadrant,
      context_activity: analysis.context_tags.activity,
      context_location: analysis.context_tags.location,
      context_companions: analysis.context_tags.companions,
      primary_verse: analysis.biblical_response.primary_verse,
      reflection: analysis.biblical_response.deep_dive_reflection,
      prayer: analysis.biblical_response.prayer_prompt,
      created_at: new Date().toISOString()
    };

    existing.push(newEntry);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    return null; // No error
  } catch (e) {
    console.error("Local save failed", e);
    return e;
  }
};

// Helper: Get from local storage
const getLocally = (userId: string) => {
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing = existingStr ? JSON.parse(existingStr) : [];
    
    // Filter by user_id and check date (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return existing
      .filter((e: any) => e.user_id === userId)
      .filter((e: any) => new Date(e.created_at) >= sevenDaysAgo)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } catch (e) {
    console.error("Local fetch failed", e);
    return [];
  }
};

export const saveJournalEntry = async (userId: string, request: JournalEntryRequest, analysis: AnalysisResponse) => {
  // 1. If this is an offline-generated user ID (starts with 'local_'), skip Supabase entirely
  if (userId.startsWith('local_')) {
    saveLocally(userId, request, analysis);
    return;
  }

  // 2. Try Supabase
  try {
    const { error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        transcript: request.transcript,
        emotion: analysis.detected_heart_state.specific_emotion,
        jar_color: analysis.detected_heart_state.jar_color,
        quadrant: analysis.detected_heart_state.quadrant,
        context_activity: analysis.context_tags.activity,
        context_location: analysis.context_tags.location,
        context_companions: analysis.context_tags.companions,
        primary_verse: analysis.biblical_response.primary_verse,
        reflection: analysis.biblical_response.deep_dive_reflection,
        prayer: analysis.biblical_response.prayer_prompt,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Supabase write failed, falling back to local storage:', error.message);
      // Fallback: Save locally if cloud fails so user doesn't lose data
      saveLocally(userId, request, analysis);
    }
  } catch (err) {
    console.warn("Network error during saveJournalEntry, falling back to local", err);
    saveLocally(userId, request, analysis);
  }
};

export const getWeeklyEntries = async (userId: string) => {
  if (userId === 'guest') return [];

  // 1. If offline user, read local
  if (userId.startsWith('local_')) {
    const localData = getLocally(userId);
    return localData.map((entry: any) => ({
      date: new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long' }),
      emotion: entry.emotion,
      context: `${entry.context_activity} at ${entry.context_location}`
    }));
  }

  // 2. Try Supabase
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetch failed:', error.message);
      // If network fails, try returning local data if any exists as a fallback
      const localFallback = getLocally(userId);
      if (localFallback.length > 0) {
        return localFallback.map((entry: any) => ({
            date: new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long' }),
            emotion: entry.emotion,
            context: `${entry.context_activity} at ${entry.context_location}`
        }));
      }
      return null;
    }

    return data.map((entry: any) => ({
      date: new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long' }),
      emotion: entry.emotion,
      context: `${entry.context_activity} at ${entry.context_location}`
    }));
  } catch (err) {
      console.warn("Network error during getWeeklyEntries", err);
      return null; 
  }
};