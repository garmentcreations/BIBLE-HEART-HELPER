import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { Plus, Share, Hexagon, Loader2, Mail, Lock, User, ArrowRight, AlertCircle, UserCircle, WifiOff } from 'lucide-react';
import { SettingsMenu } from './SettingsMenu';
import { supabase } from '../services/supabaseClient';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const EMOTIONS = [
  { label: 'Happy', color: '#FACC15', tailwindColor: 'text-yellow-400' },
  { label: 'Thankful', color: '#FBCFE8', tailwindColor: 'text-pink-300' },
  { label: 'Angry', color: '#EF4444', tailwindColor: 'text-red-500' },
  { label: 'Anxious', color: '#A3E635', tailwindColor: 'text-lime-400' },
  { label: 'Lonely', color: '#1E3A8A', tailwindColor: 'text-blue-500' },
  { label: 'Sad', color: '#38BDF8', tailwindColor: 'text-sky-400' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Animation State
  const [activeEmotionIndex, setActiveEmotionIndex] = useState(0);
  const [isFullCircle, setIsFullCircle] = useState(false);
  
  // Auth State
  const [showAuth, setShowAuth] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    // Function to update time
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(now);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  // Cycle Animation Logic
  useEffect(() => {
    if (showAuth) return; // Stop animation updates if auth modal is open

    const SEGMENT_DURATION = 1000; // 1 second per emotion
    const HOLD_DURATION = 3000;    // Hold "Check In" for 3 seconds
    const TOTAL_CYCLE = (EMOTIONS.length * SEGMENT_DURATION) + HOLD_DURATION;

    const runCycle = () => {
        // Reset to start
        setIsFullCircle(false);
        setActiveEmotionIndex(0);

        // Schedule updates for each emotion
        EMOTIONS.forEach((_, idx) => {
            setTimeout(() => {
                setActiveEmotionIndex(idx);
            }, idx * SEGMENT_DURATION);
        });

        // Schedule the "Full Circle / Check In" state
        setTimeout(() => {
            setIsFullCircle(true);
        }, EMOTIONS.length * SEGMENT_DURATION);
    };

    // Run immediately
    runCycle();

    // Loop
    const interval = setInterval(runCycle, TOTAL_CYCLE);

    return () => clearInterval(interval);
  }, [showAuth]);

  const handleCheckInClick = () => {
    setShowAuth(true);
  };

  const handleGuestLogin = () => {
    onComplete({
      id: 'guest',
      name: 'Guest Friend',
      spiritual_goals: ['Growing Closer to God'],
      privacy_agreed: true,
      has_onboarded: true
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg('');

    try {
      if (isLoginMode) {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          const name = data.user.user_metadata?.first_name 
            ? `${data.user.user_metadata.first_name}` 
            : data.user.email?.split('@')[0] || 'Friend';

          onComplete({
            id: data.user.id,
            email: data.user.email,
            name: name,
            spiritual_goals: ['Growing Closer to God'],
            privacy_agreed: true,
            has_onboarded: true
          });
        }
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
            const displayName = formData.firstName || 'Friend';
            
            onComplete({
                id: data.user.id,
                email: data.user.email,
                name: displayName,
                firstName: formData.firstName,
                lastName: formData.lastName,
                spiritual_goals: ['Growing Closer to God'],
                privacy_agreed: true,
                has_onboarded: true
            });
        }
      }
    } catch (err: any) {
      console.warn("Supabase Auth Error:", err);
      
      // AUTO-FALLBACK: If it's a network error or fetch failure, enable "Offline Mode" automatically
      // so the user can just get into the app.
      const message = err.message || '';
      if (
        message === 'Failed to fetch' || 
        message.toLowerCase().includes('failed to fetch') ||
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('connection')
      ) {
        console.log("Switching to Local Offline Profile due to connection error.");
        
        // Generate a local offline profile
        const localId = `local_${Date.now()}`;
        const localName = formData.firstName || (formData.email ? formData.email.split('@')[0] : 'Friend');
        
        const localProfile = {
            id: localId,
            email: formData.email,
            name: localName,
            firstName: formData.firstName,
            lastName: formData.lastName,
            spiritual_goals: ['Growing Closer to God'],
            privacy_agreed: true,
            has_onboarded: true
        };

        // Save to localStorage so App.tsx picks it up on refresh
        localStorage.setItem('bible_helper_user', JSON.stringify(localProfile));
        
        // Complete onboarding
        onComplete(localProfile);
      } else {
        setErrorMsg(message || 'Something went wrong. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const dateString = currentDate.toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric' 
  }).replace(',', ''); 

  const timeString = currentDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', minute: '2-digit' 
  });

  const activeEmotion = EMOTIONS[activeEmotionIndex];

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col font-sans overflow-hidden">
        
        {/* Top Header */}
        <div className={`px-6 py-6 flex items-center justify-between transition-opacity duration-300 ${showAuth ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
                <div className="relative">
                    <Hexagon className="w-6 h-6" />
                </div>
            </button>
            
            <div className="flex gap-2">
                <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                    1 emotion
                </div>
                <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                    1 day streak
                </div>
            </div>

            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                <Share className="w-5 h-5" />
            </button>
        </div>

        {/* Main Content (Emotion Wheel) */}
        <div className={`flex-1 flex flex-col items-center justify-center p-6 pb-24 transition-all duration-700 transform ${showAuth ? 'scale-90 opacity-40 blur-sm' : 'scale-100 opacity-100'}`}>
            
            <h1 className="text-4xl md:text-5xl font-serif text-center mb-12 leading-tight">
                How are you feeling<br />
                <span className="text-zinc-500">right now?</span>
            </h1>

            {/* ANIMATED CHECK-IN BUTTON */}
            <div className="relative group cursor-pointer select-none" onClick={handleCheckInClick}>
                
                {/* Background Glow */}
                <div 
                    className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 opacity-20 ${isFullCircle ? 'bg-white' : ''}`}
                    style={{ backgroundColor: isFullCircle ? undefined : activeEmotion?.color }}
                ></div>

                {/* The Circle Container */}
                <div className="relative w-72 h-72 flex items-center justify-center">
                    
                    {/* SVG Ring Animation */}
                    <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#27272a" strokeWidth="6" />
                        {EMOTIONS.map((emotion, index) => {
                            const C = 2 * Math.PI * 46; 
                            const segmentLength = C / 6; 
                            const drawLength = segmentLength - 2; 

                            const isActive = isFullCircle || index <= activeEmotionIndex;
                            const isCurrent = !isFullCircle && index === activeEmotionIndex;
                            
                            return (
                                <circle 
                                    key={emotion.label}
                                    cx="50" cy="50" r="46" 
                                    fill="none" 
                                    stroke={emotion.color}
                                    strokeWidth="6"
                                    strokeDasharray={`${drawLength} ${C - drawLength}`}
                                    strokeDashoffset={-(segmentLength * index)}
                                    strokeLinecap="round"
                                    className={`transition-all duration-500 ease-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
                                    style={{
                                        filter: isCurrent ? `drop-shadow(0 0 4px ${emotion.color})` : 'none'
                                    }}
                                />
                            );
                        })}
                    </svg>

                    {/* Inner Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center transition-all duration-300 transform group-active:scale-95">
                        
                        {/* State 1: Emotion Cycle */}
                        <div className={`transition-all duration-500 absolute inset-0 flex flex-col items-center justify-center ${!isFullCircle ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                            <div className={`text-xl font-bold mb-1 ${activeEmotion?.tailwindColor} drop-shadow-sm`}>
                                {activeEmotion?.label}
                            </div>
                            <div className="text-zinc-600 text-[10px] font-medium tracking-widest uppercase">
                                Identifying...
                            </div>
                        </div>

                        {/* State 2: Check In (Full Circle) */}
                        <div className={`transition-all duration-500 absolute inset-0 flex flex-col items-center justify-center ${isFullCircle ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
                            <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg mb-3">
                                <Plus className="w-8 h-8" strokeWidth={3} />
                            </div>
                            <span className="text-sm font-bold tracking-widest uppercase text-white">
                                Check In
                            </span>
                        </div>
                        <div className="w-32 h-32"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Date and Time */}
        <div className={`absolute bottom-8 left-8 transition-opacity duration-300 text-left ${showAuth ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-zinc-400 font-medium text-sm tracking-wide">{dateString}</div>
            <div className="text-zinc-600 font-medium text-xs mt-1">{timeString}</div>
        </div>

        {/* AUTH FORM OVERLAY (Slide Up) */}
        <div className={`fixed inset-x-0 bottom-0 z-[60] bg-zinc-900 rounded-t-[2rem] border-t border-white/10 p-8 transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${showAuth ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="max-w-md mx-auto">
                <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6"></div>
                
                <h2 className="text-3xl font-serif font-bold text-white mb-2">
                    {isLoginMode ? 'Welcome back' : 'Save your journey'}
                </h2>
                <p className="text-zinc-400 mb-6">
                    {isLoginMode 
                     ? 'Enter your details to continue.' 
                     : 'Create an account to track your spiritual heart state.'}
                </p>

                {errorMsg && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {!isLoginMode && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase">First Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Jane"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-white/40 outline-none transition-colors placeholder:text-zinc-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Last Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-white/40 outline-none transition-colors placeholder:text-zinc-700"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                            <input 
                                type="email"
                                required
                                placeholder="jane@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-white/40 outline-none transition-colors placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                            <input 
                                type="password"
                                required
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-white/40 outline-none transition-colors placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl mt-4 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                        {authLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {isLoginMode ? 'Sign In' : 'Start Journey'}
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                {/* Guest Mode Option */}
                <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="mt-3 w-full py-3 rounded-xl border border-zinc-700 text-zinc-400 font-medium hover:text-white hover:border-zinc-500 transition-all text-sm flex items-center justify-center gap-2"
                >
                    <UserCircle className="w-4 h-4" />
                    Continue as Guest (No Account)
                </button>

                <div className="mt-4 text-center">
                    <button 
                        onClick={() => {
                            setIsLoginMode(!isLoginMode);
                            setErrorMsg('');
                        }}
                        className="text-zinc-500 text-sm hover:text-white transition-colors"
                    >
                        {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
                
                <button 
                    onClick={() => setShowAuth(false)}
                    className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-white"
                >
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
    
    <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};