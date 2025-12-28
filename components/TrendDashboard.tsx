
import React, { useState, useEffect } from 'react';
import { WeeklyAnalysisResponse } from '../types';
import { generateWeeklyAnalysis } from '../services/geminiService';
import { getWeeklyEntries } from '../services/databaseService';
import { BarChart3, TrendingUp, MapPin, BookOpen, Loader2, AlertCircle } from 'lucide-react';

interface TrendDashboardProps {
  userId?: string;
}

export const TrendDashboard: React.FC<TrendDashboardProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WeeklyAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasHistory, setHasHistory] = useState(false);

  // Check if user has entries on mount
  useEffect(() => {
    if (userId && userId !== 'guest') {
       getWeeklyEntries(userId).then(entries => {
         if (entries && entries.length > 0) {
           setHasHistory(true);
         }
       }).catch(err => console.error("Error checking history", err));
    }
  }, [userId]);

  const handleAnalyze = async () => {
    if (!userId) return;
    
    if (userId === 'guest') {
        setError("Guest accounts don't have history saved. Sign up to track your trends!");
        return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch real entries from Supabase
      const pastEntries = await getWeeklyEntries(userId);
      
      // Handle network or DB error
      if (pastEntries === null) {
          setError("Unable to connect to your history. Please check your internet connection.");
          return;
      }

      // Handle empty history
      if (pastEntries.length === 0) {
        setError("You haven't checked in yet this week. Try checking in first!");
        return;
      }

      // 2. Send to Gemini for Analysis
      const result = await generateWeeklyAnalysis({ past_entries: pastEntries });
      setData(result);
    } catch (e) {
      console.error(e);
      setError("Couldn't analyze your week right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-white">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h2 className="font-serif text-2xl font-bold">My Week</h2>
          </div>
          <button 
            onClick={handleAnalyze} 
            disabled={loading || !userId}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Review My Week"}
          </button>
        </div>

        {error && (
            <div className="mb-6 bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-3 border border-red-500/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
            </div>
        )}

        {!data ? (
          <div className="text-center py-12 bg-zinc-950/50 rounded-xl border-2 border-dashed border-zinc-800">
            {hasHistory ? (
               <>
                <p className="text-zinc-400 mb-2 font-medium">Ready to review.</p>
                <p className="text-xs text-zinc-600">Click "Review My Week" to see your spiritual trends.</p>
               </>
            ) : (
               <>
                <p className="text-zinc-400 mb-2">No check-ins yet.</p>
                <p className="text-xs text-zinc-600">Go to the "Check-in" tab and tell us how you feel first.</p>
               </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Row Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                 <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-indigo-400 mt-1" />
                    <div>
                      <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-wide">How I Felt</h3>
                      <p className="text-indigo-100 mt-1 text-sm leading-relaxed">{data.trend_summary}</p>
                    </div>
                 </div>
              </div>
              <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-500/20">
                 <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-400 mt-1" />
                    <div>
                      <h3 className="text-sm font-semibold text-amber-200 uppercase tracking-wide">Where I Was</h3>
                      <p className="text-amber-100 mt-1 text-sm leading-relaxed">{data.environmental_insight}</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Spiritual Mission */}
            <div className="border border-zinc-700 rounded-xl overflow-hidden">
               <div className="bg-zinc-800 text-white px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-300" />
                    <span className="font-semibold tracking-wide text-sm">My Goal</span>
                  </div>
                  <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">Next 7 Days</span>
               </div>
               <div className="p-6 bg-zinc-900 space-y-4">
                  <div>
                    <h4 className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Focus Area</h4>
                    <p className="text-lg font-serif text-white">{data.spiritual_mission.focus_area}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/20">
                       <h5 className="text-purple-300 font-semibold text-sm mb-1">Verse to Read</h5>
                       <p className="text-purple-100 text-sm">{data.spiritual_mission.deep_study_passage}</p>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                       <h5 className="text-white font-semibold text-sm mb-1">Try This</h5>
                       <p className="text-zinc-300 text-sm">{data.spiritual_mission.practical_discipline}</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
