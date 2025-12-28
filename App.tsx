
import React, { useState, useEffect } from 'react';
import { JarVisual } from './components/JarVisual';
import { InputForm } from './components/InputForm';
import { ResultCard } from './components/ResultCard';
import { NudgePanel } from './components/NudgePanel';
import { TrendDashboard } from './components/TrendDashboard';
import { Onboarding } from './components/Onboarding';
import { SplashScreen } from './components/SplashScreen';
import { DonationSection } from './components/DonationSection';
import { BubbleSelector } from './components/BubbleSelector';
import { BottomSheet } from './components/BottomSheet';
import { EmotionWheelLoader } from './components/EmotionWheelLoader';
import { HomeCircle } from './components/HomeCircle';
import { SettingsMenu } from './components/SettingsMenu';
import { alignHeart, generateNudge } from './services/geminiService';
import { saveJournalEntry } from './services/databaseService';
import { soundService } from './services/soundService';
import { JournalEntryRequest, AnalysisResponse, JarColor, NudgeRequest, NudgeResponse, UserProfile, parseJarColor } from './types';
import { Cross, PlusCircle, BellRing, TrendingUp, User, Keyboard, Loader2, AlertCircle, Heart, Hexagon, Share } from 'lucide-react';
import { supabase } from './services/supabaseClient';

type Tab = 'journal' | 'trends' | 'nudge' | 'profile';
type JournalView = 'circle' | 'bubbles';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('journal');
  const [journalView, setJournalView] = useState<JournalView>('circle');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialView, setSettingsInitialView] = useState<'main' | 'donation'>('main');
  
  // Journal State
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalResult, setJournalResult] = useState<AnalysisResponse | null>(null);
  const [showResultSheet, setShowResultSheet] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [journalError, setJournalError] = useState<string | null>(null);

  // Nudge State
  const [nudgeLoading, setNudgeLoading] = useState(false);

  // Handle Global Sound & Haptics
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // 1. Resume Audio Context (needs user gesture)
      soundService.resume();

      // 2. Determine if we should play a "Tap" sound
      // We look for clickable ancestors
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, input, [role="button"], .cursor-pointer');
      
      // We avoid playing the generic tap if the element has a specific "data-sound" attribute handled elsewhere,
      // though typically layering the subtle tap is fine.
      if (clickable) {
         soundService.playTap();
         soundService.triggerHaptic(5); // Very light haptic for general UI
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Handle Splash Screen Timer & Auth Check
  useEffect(() => {
    // Splash timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // Show splash for 3 seconds

    // Auth Check
    const checkUser = async () => {
      // 1. Check for Local Offline Profile first
      try {
        const localProfileStr = localStorage.getItem('bible_helper_user');
        if (localProfileStr) {
            setUserProfile(JSON.parse(localProfileStr));
            return;
        }
      } catch (e) {
        console.error("Local profile parse error", e);
      }

      // 2. Check Supabase
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
           console.warn("Supabase auth check failed (using offline mode if available):", error.message);
           return;
        }

        if (session?.user) {
          const name = session.user.user_metadata?.first_name 
              ? `${session.user.user_metadata.first_name}` 
              : session.user.email?.split('@')[0] || 'Friend';
              
          setUserProfile({
            id: session.user.id,
            email: session.user.email,
            name: name,
            firstName: session.user.user_metadata?.first_name,
            lastName: session.user.user_metadata?.last_name,
            spiritual_goals: ['Growing Closer to God'],
            privacy_agreed: true,
            has_onboarded: true
          });
        }
      } catch (err) {
        console.warn("Network error during auth check:", err);
      }
    };
    checkUser();

    return () => clearTimeout(timer);
  }, []);

  const handleAlignment = async (data: JournalEntryRequest) => {
    setJournalLoading(true);
    setJournalError(null);
    // If text input was open, close it
    setShowTextInput(false);
    
    try {
      soundService.playChime(); // Play chime when analysis starts/submits
      
      // 1. Get Analysis from Gemini
      const response = await alignHeart(data);
      
      // 2. Save to Supabase OR LocalStorage (handled by service)
      if (userProfile?.id && userProfile.id !== 'guest') {
        try {
          await saveJournalEntry(userProfile.id, data, response);
        } catch (dbError) {
          console.error("Failed to save to history, but showing result anyway.", dbError);
        }
      }

      setJournalResult(response);
      setShowResultSheet(true);
    } catch (error) {
      console.error("Error aligning heart:", error);
      setJournalError("We couldn't connect to the helper right now. Please check your internet and try again.");
    } finally {
      setJournalLoading(false);
    }
  };

  const handleBubbleSelect = (emotion: string) => {
    // Bubble sound is handled in BubbleSelector, but we trigger the flow here
    handleAlignment({
        transcript: `I am feeling ${emotion}`,
        timestamp: new Date().toISOString(),
        inputType: 'text'
    });
  };

  const handleResetJournal = () => {
    setJournalResult(null);
    setShowResultSheet(false);
    // Optional: Return to circle after result closed? 
    // For now, let's keep them on the bubbles so they can pick another emotion if they want, 
    // or they can click "Check-in" nav to go back to circle.
  };

  const handleGoHome = () => {
    setActiveTab('journal');
    setJournalView('circle');
    // Close any overlays to ensure we return to the main check-in screen
    setShowResultSheet(false);
    setShowTextInput(false);
    setJournalError(null);
  };

  const handleGenerateNudge = async (data: NudgeRequest): Promise<NudgeResponse | null> => {
    setNudgeLoading(true);
    try {
      const response = await generateNudge(data);
      return response;
    } catch (error) {
      console.error("Error generating nudge:", error);
      return null;
    } finally {
      setNudgeLoading(false);
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    soundService.playChime();
    setUserProfile(profile);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Bible Heart Helper',
      text: 'Align your heart with God using Bible Heart Helper.',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('App link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const openSettings = (view: 'main' | 'donation' = 'main') => {
    setSettingsInitialView(view);
    setIsSettingsOpen(true);
  };

  // 1. Show Splash Screen first
  if (showSplash) {
    return <SplashScreen />;
  }

  // 2. Show Check-In Screen (Onboarding) if no profile set
  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // 3. Show Main App
  return (
    <div className="min-h-screen pb-24 md:pb-20 bg-black text-white transition-colors duration-500">
      
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-black border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          
           {/* Mobile Journal Header (Replaces default header on Journal tab) */}
           {activeTab === 'journal' ? (
              <div className="md:hidden flex items-center justify-between w-full animate-in fade-in">
                  <button 
                      onClick={() => openSettings('main')}
                      className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors"
                  >
                      <Hexagon className="w-6 h-6" />
                  </button>
                  
                  <div className="flex gap-2">
                      <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                          1 emotion
                      </div>
                      <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                          1 day streak
                      </div>
                  </div>

                  <button onClick={handleShare} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors">
                      <Share className="w-5 h-5" />
                  </button>
              </div>
           ) : null}

          {/* Standard Header (Visible on Desktop OR when not on Journal tab on mobile) */}
          <div 
             className={`items-center gap-2 cursor-pointer ${activeTab === 'journal' ? 'hidden md:flex' : 'flex'}`} 
             onClick={handleGoHome}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border border-white/20 text-white">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <h1 className="font-serif text-lg font-bold tracking-tight text-white hidden md:block">Bible Heart Helper</h1>
            <h1 className="font-serif text-lg font-bold tracking-tight text-white md:hidden">Bible Heart Helper</h1>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-1 p-1 rounded-lg bg-white/10">
            <button 
              onClick={handleGoHome} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'journal' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <PlusCircle className="w-3.5 h-3.5" /> Check-in
            </button>
            <button 
              onClick={() => setActiveTab('trends')} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'trends' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> My Week
            </button>
            <button 
              onClick={() => setActiveTab('nudge')} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'nudge' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <BellRing className="w-3.5 h-3.5" /> Reminders
            </button>
            <button 
              onClick={() => setActiveTab('profile')} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <User className="w-3.5 h-3.5" /> Me
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pt-8 md:pt-12">
        
        {/* Tab: Journal (Circle OR Bubble Interface) */}
        {activeTab === 'journal' && (
          <div className="flex flex-col items-center">
            
            {/* View 1: Landing Circle */}
            {journalView === 'circle' && (
                <HomeCircle onCheckIn={() => setJournalView('bubbles')} />
            )}

            {/* View 2: Bubbles */}
            {journalView === 'bubbles' && (
                <>
                    <div className="text-center mb-8 animate-in fade-in zoom-in duration-500">
                        <h2 className="text-3xl md:text-5xl font-serif font-medium text-white mb-4">
                            How are you feeling?
                        </h2>
                        <p className="text-white/60 text-lg max-w-xl mx-auto">
                            Tap a bubble to see what God says about your feeling.
                        </p>
                    </div>

                    {/* Error Message Toast */}
                    {journalError && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 max-w-md mx-auto animate-in slide-in-from-top-4">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-200 text-sm">{journalError}</p>
                        <button 
                        onClick={() => setJournalError(null)} 
                        className="ml-auto text-red-400 hover:text-red-300"
                        >
                        <Cross className="w-4 h-4 rotate-45" />
                        </button>
                    </div>
                    )}

                    {/* Bubble Grid */}
                    <div className={`transition-opacity duration-300 ${journalLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <BubbleSelector onSelect={handleBubbleSelect} disabled={journalLoading} />
                    </div>

                    {/* Floating Action Button for Text Input */}
                    <button 
                        onClick={() => setShowTextInput(true)}
                        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-40 bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-full hover:bg-white/20 transition-all shadow-2xl"
                        title="Type or Record"
                    >
                        <Keyboard className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Loading Indicator Overlay */}
            {journalLoading && (
                <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                    <EmotionWheelLoader />
                </div>
            )}

            {/* Bottom Sheet for Result */}
            <BottomSheet 
                isOpen={showResultSheet} 
                onClose={() => setShowResultSheet(false)}
                color={journalResult?.detected_heart_state.jar_color}
            >
                {journalResult && (
                    <div className="pt-2">
                         <ResultCard 
                             data={journalResult} 
                             reset={handleResetJournal} 
                             onAddEntry={() => setShowTextInput(true)}
                         />
                    </div>
                )}
            </BottomSheet>

             {/* Text Input Modal */}
             <BottomSheet isOpen={showTextInput} onClose={() => setShowTextInput(false)}>
                 <div className="pt-6">
                    <h3 className="text-2xl font-serif font-bold text-white mb-6 text-center">My Check-in</h3>
                    <div className="bg-zinc-900/50 p-4 rounded-3xl">
                       <InputForm onSubmit={handleAlignment} isLoading={journalLoading} />
                    </div>
                 </div>
             </BottomSheet>

          </div>
        )}

        {/* Tab: Trends */}
        {activeTab === 'trends' && (
          <div className="max-w-3xl mx-auto">
             <div className="text-center mb-10 animate-in fade-in zoom-in duration-500">
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mb-4">
                My Week in Review
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto leading-relaxed">
                See how you've been feeling this week and get a special mission.
              </p>
            </div>
            <TrendDashboard userId={userProfile?.id} />
          </div>
        )}

        {/* Tab: Nudge */}
        {activeTab === 'nudge' && (
          <>
             <div className="text-center mb-10 animate-in fade-in zoom-in duration-500">
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mb-4">
                Reminders
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto leading-relaxed">
                See how the app sends you friendly reminders to check in with God.
              </p>
            </div>
            <NudgePanel onGenerate={handleGenerateNudge} isLoading={nudgeLoading} onBack={handleGoHome} />
          </>
        )}

        {/* Tab: Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-800">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold font-serif text-white">My Profile</h2>
                <button 
                    onClick={async () => {
                        await supabase.auth.signOut();
                        localStorage.removeItem('bible_helper_user');
                        setUserProfile(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
                >
                    Sign Out
                </button>
              </div>
              <div className="space-y-4">
                 <div>
                   <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Name</label>
                   <div className="text-white font-medium">{userProfile?.name || "Friend"}</div>
                 </div>
                 {userProfile?.email && (
                     <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Email</label>
                        <div className="text-white font-medium">{userProfile.email}</div>
                     </div>
                 )}
                 <div>
                   <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">My Goals</label>
                   <div className="text-white font-medium">
                    {userProfile?.spiritual_goals && userProfile.spiritual_goals.length > 0
                       ? userProfile.spiritual_goals.join(", ")
                       : "Not set"
                    }
                   </div>
                 </div>
                 <div className="pt-4 border-t border-zinc-800">
                    <p className="text-sm text-zinc-500">
                       <span className="text-green-500 font-medium">✓ Safe & Private:</span> We don't keep your secrets forever.
                    </p>
                 </div>
              </div>
            </div>
            <DonationSection onDonate={() => openSettings('donation')} />
          </div>
        )}

      </main>

      {/* Mobile Footer Nav (Dark Mode) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 px-6 py-3 flex justify-between z-30 bg-black">
        <button 
          onClick={handleGoHome} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'journal' ? 'text-white' : 'text-zinc-600'}`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">Check-in</span>
        </button>
        <button 
          onClick={() => setActiveTab('trends')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'trends' ? 'text-white' : 'text-zinc-600'}`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] font-medium">My Week</span>
        </button>
        <button 
          onClick={() => setActiveTab('nudge')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'nudge' ? 'text-white' : 'text-zinc-600'}`}
        >
          <BellRing className="w-5 h-5" />
          <span className="text-[10px] font-medium">Notify</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-white' : 'text-zinc-600'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Me</span>
        </button>
      </div>

      <SettingsMenu 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        userName={userProfile?.name} 
        initialView={settingsInitialView}
      />
    </div>
  );
};

export default App;
