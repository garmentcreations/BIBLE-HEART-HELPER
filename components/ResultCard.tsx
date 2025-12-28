
import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResponse, parseJarColor, JarColor, ReflectionMode } from '../types';
import { PenLine, BookOpen, HeartHandshake, ArrowLeft, X, Sparkles, Volume2, StopCircle, Loader2, AlertCircle, MoreHorizontal, ChevronDown, Trash2, MessageSquareWarning, RefreshCw, MessageSquare, Shuffle, Zap, Heart, TriangleAlert, Check } from 'lucide-react';
import { generateSpeech, generateReflectionPrompt } from '../services/geminiService';

interface ResultCardProps {
  data: AnalysisResponse;
  reset: () => void;
  onAddEntry: () => void;
}

// Map colors to hex values and Tailwind classes
const colorMap: Record<JarColor, { text: string; bg: string; border: string; glow: string }> = {
  [JarColor.YELLOW]: { text: 'text-yellow-400', bg: 'bg-yellow-950/40', border: 'border-yellow-400/20', glow: 'shadow-yellow-500/20' },
  [JarColor.PINK]: { text: 'text-pink-300', bg: 'bg-pink-950/40', border: 'border-pink-300/20', glow: 'shadow-pink-400/20' },
  [JarColor.RED]: { text: 'text-red-500', bg: 'bg-red-950/40', border: 'border-red-500/20', glow: 'shadow-red-500/20' },
  [JarColor.GREEN]: { text: 'text-[#A3E635]', bg: 'bg-lime-950/40', border: 'border-lime-400/20', glow: 'shadow-lime-500/20' }, 
  [JarColor.BLUE]: { text: 'text-blue-500', bg: 'bg-blue-950/40', border: 'border-blue-500/20', glow: 'shadow-blue-500/20' },
  [JarColor.PURPLE]: { text: 'text-sky-400', bg: 'bg-sky-950/40', border: 'border-sky-400/20', glow: 'shadow-sky-500/20' },
  [JarColor.NEUTRAL]: { text: 'text-slate-200', bg: 'bg-slate-800/40', border: 'border-slate-700/50', glow: 'shadow-white/10' },
};

// Gradient definitions matching BubbleSelector for the 3D heart look
const GRADIENT_COLORS: Record<JarColor, { start: string; stop: string; shadow: string }> = {
  [JarColor.YELLOW]: { start: '#FDE047', stop: '#EAB308', shadow: 'rgba(234, 179, 8, 0.6)' },
  [JarColor.PINK]: { start: '#FBCFE8', stop: '#EC4899', shadow: 'rgba(244, 114, 182, 0.6)' },
  [JarColor.RED]: { start: '#EF4444', stop: '#991B1B', shadow: 'rgba(239, 68, 68, 0.6)' },
  [JarColor.GREEN]: { start: '#D9F99D', stop: '#65A30D', shadow: 'rgba(132, 204, 22, 0.6)' },
  [JarColor.BLUE]: { start: '#60A5FA', stop: '#1E3A8A', shadow: 'rgba(59, 130, 246, 0.6)' },
  [JarColor.PURPLE]: { start: '#7DD3FC', stop: '#0369A1', shadow: 'rgba(14, 165, 233, 0.6)' },
  [JarColor.NEUTRAL]: { start: '#F1F5F9', stop: '#94A3B8', shadow: 'rgba(148, 163, 184, 0.6)' },
};

const parseVerse = (rawVerse: string) => {
  let clean = rawVerse.trim();
  
  // First, check if the whole string is wrapped in quotes and strip them
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  
  // Try to find the reference at the end in parentheses (e.g. "... (Psalm 23:1)")
  const refParenRegex = /^(.*)\s*\((.*?)\)[\.\s]*$/;
  const parenMatch = clean.match(refParenRegex);
  if (parenMatch) {
     let text = parenMatch[1].trim();
     // Aggressively remove any leading/trailing quotes from the text part
     text = text.replace(/^["']+|["']+$/g, '');
     return { text: text, ref: parenMatch[2].trim() };
  }

  // Fallback for dash separator
  const refDashRegex = /^(.*?)["']?\s*[-–]\s*((?:\d\s*)?[A-Za-z]+\s+(?:\d+:)?\d+(?::\d+(?:-\d+)?)?)$/;
  const dashMatch = clean.match(refDashRegex);
  if (dashMatch) {
    let text = dashMatch[1].trim();
    text = text.replace(/^["']+|["']+$/g, '');
    return { text: text, ref: dashMatch[2].trim() };
  }
  
  // Final fallback: return text without quotes
  return { text: clean.replace(/^["']+|["']+$/g, ''), ref: "" };
};

// Audio Decode Helper
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// PCM to AudioBuffer Helper
async function rawPcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data, reset, onAddEntry }) => {
  const [view, setView] = useState<'main' | 'reflection' | 'prayer' | 'writing'>('main');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);
  
  // Reflect View State
  const [reflectionPrompt, setReflectionPrompt] = useState('');
  const [userReflection, setUserReflection] = useState('');
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  
  const [showMenu, setShowMenu] = useState(false); // Three dots menu
  const [showReflectMenu, setShowReflectMenu] = useState(false); // Dropdown menu
  const [reflectMode, setReflectMode] = useState<ReflectionMode>('reflect');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reflectMenuRef = useRef<HTMLDivElement>(null);
  
  const jarColor = parseJarColor(data.detected_heart_state.jar_color);
  const theme = colorMap[jarColor];
  const heartStyle = GRADIENT_COLORS[jarColor];
  const { text, ref } = parseVerse(data.biblical_response.primary_verse);

  // Cleanup audio context on unmount or view change
  useEffect(() => {
    return () => {
        if (sourceRef.current) sourceRef.current.stop();
        if (audioCtxRef.current) audioCtxRef.current.close();
    }
  }, []);

  // Stop audio when changing views
  useEffect(() => {
    if (isPlaying) {
        sourceRef.current?.stop();
        setIsPlaying(false);
    }
    setAudioError(false);
  }, [view]);

  // Handle outside click for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (reflectMenuRef.current && !reflectMenuRef.current.contains(event.target as Node)) {
        setShowReflectMenu(false);
      }
    };
    if (showMenu || showReflectMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, showReflectMenu]);

  // Handle Text-to-Speech
  const handleSpeak = async (textToRead: string) => {
    if (isPlaying) {
        sourceRef.current?.stop();
        setIsPlaying(false);
        return;
    }

    setAudioLoading(true);
    setAudioError(false);
    try {
        const base64 = await generateSpeech(textToRead);
        const bytes = decodeBase64(base64);
        
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        // Ensure context is running (especially on mobile)
        if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
        }

        const buffer = await rawPcmToAudioBuffer(bytes, audioCtxRef.current);
        
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
        
        sourceRef.current = source;
        setIsPlaying(true);
    } catch (e) {
        console.error("TTS Error", e);
        setAudioError(true);
    } finally {
        setAudioLoading(false);
    }
  }

  // Handle Reflect View Prompt Generation
  const handleReflectClick = async () => {
    setView('writing');
    if (!reflectionPrompt) {
        await loadNewPrompt('reflect');
    }
  };

  const loadNewPrompt = async (mode: ReflectionMode = reflectMode) => {
    setIsPromptLoading(true);
    try {
        const prompt = await generateReflectionPrompt(data.detected_heart_state.specific_emotion, mode);
        setReflectionPrompt(prompt);
    } catch (e) {
        console.error("Failed to generate reflection prompt", e);
        setReflectionPrompt("Take a moment to write down what's on your heart...");
    } finally {
        setIsPromptLoading(false);
    }
  };

  const handleModeSelect = (mode: ReflectionMode) => {
      setReflectMode(mode);
      setShowReflectMenu(false);
      loadNewPrompt(mode);
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    switch(action) {
        case 'regenerate':
            loadNewPrompt();
            break;
        case 'delete':
            setUserReflection('');
            break;
        case 'support':
            alert("If you are in crisis, please call 988 or text HOME to 741741.");
            break;
        case 'feedback':
            // Placeholder for feedback
            break;
    }
  };

  const getModeConfig = (mode: ReflectionMode) => {
    switch(mode) {
        case 'reflect': return { label: 'Reflect', icon: Sparkles, color: 'text-yellow-400' };
        case 'reframe': return { label: 'See it differently', icon: Shuffle, color: 'text-blue-400' };
        case 'action': return { label: 'Suggest an action', icon: Zap, color: 'text-amber-400' };
        case 'affirmation': return { label: 'Suggest affirmations', icon: Heart, color: 'text-pink-400' };
        case 'trap': return { label: 'Identify a thinking trap', icon: TriangleAlert, color: 'text-orange-400' };
    }
  };

  // Helper to remove any existing "Amen" from the AI generated text for display
  const cleanPrayerBody = (text: string) => {
    return text.trim().replace(/(?:In\s+Jesus['’]?\s+name(?:[.,]?\s*(?:I\s+pray)?|)?\s*)?Amen\.?$/i, '').trim();
  };

  const prayerBody = cleanPrayerBody(data.biblical_response.prayer_prompt);
  const closingPhrase = "In Jesus name, Amen.";
  const fullPrayerForAudio = `${prayerBody}\n\n${closingPhrase}`;

  // Unified visual style for both cards to ensure consistency
  const cardStyle = {
    background: `linear-gradient(145deg, ${heartStyle.start}20, rgba(0,0,0,0.6))`,
    borderColor: `${heartStyle.start}40`,
    boxShadow: `0 0 30px ${heartStyle.shadow}, inset 0 0 20px ${heartStyle.shadow}`
  };

  // Content for the overlay views
  const renderOverlay = () => {
    if (view === 'writing') {
        const currentConfig = getModeConfig(reflectMode);
        const CurrentIcon = currentConfig.icon;

        return (
          <div className="absolute inset-0 bg-[#121212] z-40 flex flex-col animate-in slide-in-from-bottom-10 duration-500 font-sans">
              {/* Reflect Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 relative z-50">
                <div ref={reflectMenuRef} className="relative">
                    <button 
                        onClick={() => setShowReflectMenu(!showReflectMenu)}
                        className={`flex items-center gap-2 font-semibold ${currentConfig.color} active:opacity-80 transition-opacity`}
                    >
                        <CurrentIcon className="w-4 h-4 fill-current" />
                        <span>{currentConfig.label}</span>
                        <ChevronDown className={`w-4 h-4 ml-0.5 transition-transform duration-300 ${showReflectMenu ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* DROP DOWN MENU */}
                    {showReflectMenu && (
                        <div className="absolute top-full left-0 mt-3 w-72 bg-[#1C1C1E] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top-left ring-1 ring-black/50">
                           <div className="flex flex-col py-1.5">
                               {(['reflect', 'reframe', 'action', 'affirmation', 'trap'] as ReflectionMode[]).map((mode, i) => {
                                   const config = getModeConfig(mode);
                                   const ModeIcon = config.icon;
                                   const isSelected = reflectMode === mode;
                                   return (
                                       <div 
                                        key={mode} 
                                        onClick={() => handleModeSelect(mode)}
                                        className={`flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-white/5 group transition-colors ${i < 4 ? 'border-b border-white/5' : ''}`}
                                       >
                                           <div className="flex items-center gap-3">
                                               <div className="w-5 flex justify-center">
                                                 {isSelected && <Check className="w-4 h-4 text-white" />}
                                               </div>
                                               <span className={`text-base ${isSelected ? 'text-white font-medium' : 'text-zinc-300'}`}>
                                                   {config.label}
                                               </span>
                                           </div>
                                           <ModeIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'} transition-colors`} />
                                       </div>
                                   );
                               })}
                           </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)} className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors">
                        <MoreHorizontal className="w-6 h-6" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-[#1C1C1E] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/50">
                            <div className="p-1.5">
                                <button onClick={() => handleMenuAction('support')} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-zinc-700/50 rounded-lg flex items-center gap-3 transition-colors">
                                    <MessageSquareWarning className="w-4 h-4 text-zinc-400" /> Get Immediate Support
                                </button>
                                <button onClick={() => handleMenuAction('regenerate')} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-zinc-700/50 rounded-lg flex items-center gap-3 transition-colors">
                                    <RefreshCw className="w-4 h-4 text-zinc-400" /> Regenerate
                                </button>
                                <button onClick={() => handleMenuAction('feedback')} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-zinc-700/50 rounded-lg flex items-center gap-3 transition-colors">
                                    <MessageSquare className="w-4 h-4 text-zinc-400" /> Send Feedback
                                </button>
                                <div className="h-px bg-white/10 my-1 mx-2"></div>
                                <button onClick={() => handleMenuAction('delete')} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-3 transition-colors">
                                    <Trash2 className="w-4 h-4" /> Delete Reflections
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              </div>

              {/* Reflect Content */}
              <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
                {isPromptLoading ? (
                    <div className="flex items-center gap-3 text-zinc-500 animate-pulse mb-6">
                        <CurrentIcon className="w-5 h-5" />
                        <span className="font-serif italic text-lg">Thinking...</span>
                    </div>
                ) : (
                    <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                         {/* Render prompt text with improved typography */}
                         <div className="text-xl font-serif leading-relaxed text-white/95 whitespace-pre-wrap">
                            {reflectionPrompt}
                         </div>
                    </div>
                )}
                
                <textarea 
                    value={userReflection}
                    onChange={(e) => setUserReflection(e.target.value)}
                    placeholder="Write"
                    className="w-full flex-1 bg-transparent text-lg text-white placeholder:text-zinc-600 outline-none resize-none font-serif leading-relaxed min-h-[150px]"
                    autoFocus
                />
              </div>

              {/* Bottom Bar */}
              <div className="px-6 py-4 border-t border-white/5 bg-[#121212] flex items-center gap-3 safe-area-bottom">
                 <button 
                    onClick={() => setView('main')}
                    className="flex-1 bg-transparent border border-white/20 text-white font-semibold py-3.5 rounded-full hover:bg-white/5 transition-colors active:scale-95 duration-200"
                 >
                    Finish
                 </button>
                 <button 
                    onClick={() => loadNewPrompt()}
                    className="flex-1 bg-[#2C2C2E] text-white font-semibold py-3.5 rounded-full hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-200"
                 >
                    Go deeper
                    <ArrowLeft className="w-4 h-4 rotate-90" />
                 </button>
              </div>
              <div className="text-center pb-4 pt-1 bg-[#121212]">
                 <p className="text-[10px] text-zinc-600">If you are in crisis, get professional support <span className="underline cursor-pointer hover:text-zinc-400" onClick={() => handleMenuAction('support')}>here</span></p>
              </div>
          </div>
        );
    }

    const isReflection = view === 'reflection';
    const contentText = isReflection 
        ? data.biblical_response.deep_dive_reflection 
        : fullPrayerForAudio; // Use full constructed string for prayer audio
    
    // Background gradient for the whole overlay
    const overlayGradient = {
      background: `radial-gradient(circle at 50% 0%, ${heartStyle.start}20 0%, #09090b 80%)`
    };

    return (
      <div className="absolute inset-0 bg-zinc-950 z-30 flex flex-col animate-in slide-in-from-bottom-10 duration-500">
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 right-0 h-[30rem] pointer-events-none opacity-60" style={overlayGradient}></div>
        
        {/* Header */}
        <div className="relative px-6 py-6 flex items-center justify-between z-20">
          <button 
            onClick={() => setView('main')}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className={`px-3 py-1 rounded-full border ${theme.border} ${theme.bg} backdrop-blur-md`}>
             <span className={`text-xs font-bold uppercase tracking-widest ${theme.text}`}>
                {isReflection ? 'Deep Dive' : 'Prayer'}
            </span>
          </div>
          {/* Invisible spacer to balance header */}
          <div className="w-10"></div>
        </div>

        {/* Scrollable Content */}
        <div className="relative flex-1 overflow-y-auto px-6 pb-8 z-10 custom-scrollbar">
          
          <div className="flex flex-col items-center mb-6 mt-2">
             <div className={`w-20 h-20 rounded-3xl rotate-3 flex items-center justify-center mb-6 shadow-2xl border ${theme.border} backdrop-blur-xl ${theme.bg} ${theme.glow}`}>
                {isReflection ? (
                    <BookOpen className={`w-10 h-10 ${theme.text}`} />
                ) : (
                    <HeartHandshake className={`w-10 h-10 ${theme.text}`} />
                )}
             </div>
             <h3 className="text-4xl font-serif font-bold text-center mb-3 text-white leading-tight">
               {isReflection ? 'Understanding Your Heart' : "Let's Talk to God"}
             </h3>
             <div className="w-16 h-1 rounded-full bg-white/20"></div>
          </div>

          <div className="max-w-md mx-auto">
             {/* 
                UNIFIED CARD CONTAINER
                Used for both Reflection and Prayer to ensure identical spacing and design.
             */}
             <div 
                className="rounded-[2rem] p-8 border backdrop-blur-md relative overflow-hidden animate-in slide-in-from-bottom-20 zoom-in duration-700 delay-100"
                style={cardStyle}
             >
                 {/* Animated shine effect on the border/bg */}
                 <div className="absolute inset-0 bg-white/5 mix-blend-overlay animate-pulse" style={{ animationDuration: '4s' }}></div>
                 
                 {/* SHARED CARD HEADER: Label and Audio Button */}
                 <div className="flex items-center justify-between mb-4 relative z-10">
                     <h4 className={`text-sm font-bold uppercase tracking-widest ${theme.text} flex items-center gap-2`}>
                         {isReflection ? <Sparkles className="w-4 h-4" /> : <HeartHandshake className="w-4 h-4" />}
                         {isReflection ? 'Insight' : 'Prayer'}
                     </h4>
                     <div className="flex items-center gap-2">
                         {audioError && <span className="text-[10px] text-red-400 font-bold uppercase">Audio Error</span>}
                         <button 
                             onClick={() => handleSpeak(contentText)}
                             disabled={audioLoading}
                             className={`p-2 rounded-full transition-all ${
                                 isPlaying 
                                 ? 'bg-white text-black animate-pulse' 
                                 : `bg-white/10 text-white hover:bg-white/20 ${theme.text}`
                             }`}
                         >
                             {audioLoading ? (
                                 <Loader2 className="w-5 h-5 animate-spin" />
                             ) : isPlaying ? (
                                 <StopCircle className="w-5 h-5" />
                             ) : (
                                 <Volume2 className="w-5 h-5" />
                             )}
                         </button>
                     </div>
                 </div>
                 
                 {/* SHARED CARD CONTENT AREA */}
                 <div className="relative z-10">
                    {isReflection ? (
                        <p className="text-white leading-relaxed font-serif text-xl drop-shadow-md">
                           {data.biblical_response.deep_dive_reflection}
                        </p>
                    ) : (
                        <div className="text-white leading-relaxed font-serif text-xl drop-shadow-md">
                            <p className="mb-4">{prayerBody}</p>
                            <p className={`font-bold not-italic ${theme.text} opacity-90 text-lg`}>{closingPhrase}</p>
                        </div>
                    )}
                 </div>
             </div>
             
             {/* Subtext under card */}
             <p className="text-center text-zinc-500 text-sm mt-4">
                {isReflection ? 'Read this slowly and let it sink in.' : 'Read this aloud or say it in your heart.'}
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent z-20 safe-area-bottom">
          <button 
             onClick={() => setView('main')}
             className="w-full py-4 font-bold rounded-2xl bg-white text-black hover:bg-zinc-200 transition-colors shadow-xl active:scale-95 duration-200"
          >
             I'm Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-[85vh] bg-zinc-950 text-white font-sans relative overflow-hidden rounded-t-[2.5rem]">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
      
      {/* Overlay Views (Reflection/Prayer/Writing) - Rendered conditionally on top */}
      {view !== 'main' && renderOverlay()}

      {/* Main Content */}
      <div className={`flex flex-col h-full transition-opacity duration-300 ${view === 'main' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Top Section: 3D Heart & Emotion */}
        <div className="flex flex-col items-center pt-10 pb-6 relative z-10">
          
          {/* Subtle colored glow behind the heart */}
          <div 
            className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full opacity-30 blur-3xl transition-colors duration-500"
            style={{ backgroundColor: heartStyle.start }}
          ></div>

          {/* Animated 3D Heart */}
          <div className="w-48 h-48 mb-6 relative z-10 animate-float">
             <svg 
               viewBox="0 0 100 100" 
               className="w-full h-full overflow-visible transition-all duration-500"
               style={{ 
                 filter: `drop-shadow(0px 10px 20px ${heartStyle.shadow}) drop-shadow(0px 4px 6px rgba(0,0,0,0.5))` 
               }}
             >
                <defs>
                   <linearGradient id="resultHeartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={heartStyle.start} />
                      <stop offset="100%" stopColor={heartStyle.stop} />
                   </linearGradient>
                </defs>
                
                {/* Main Heart Shape */}
                <path 
                  d="M50 90 C50 90 90 65 90 35 C90 15 72 5 53 20 C51 21 49 21 47 20 C28 5 10 15 10 35 C10 65 50 90 50 90 Z" 
                  fill="url(#resultHeartGradient)" 
                />
                
                {/* Top Gloss Reflection */}
                <path 
                  d="M 25 30 Q 50 15 75 30" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  opacity="0.3" 
                  className="mix-blend-overlay" 
                />
                
                {/* Specular Highlight */}
                <circle cx="30" cy="30" r="3" fill="white" opacity="0.6" />
             </svg>
          </div>

          <h2 className="font-serif italic text-3xl text-center leading-tight mb-2 text-white opacity-90">
            I'm feeling
          </h2>
          <h2 className={`${theme.text} font-bold text-4xl text-center tracking-tight shadow-black drop-shadow-lg`}>
            {data.detected_heart_state.specific_emotion}
          </h2>
        </div>

        {/* Verse Section */}
        <div className="px-8 mb-8 text-center space-y-4 relative z-10">
           <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
           <p className="text-xl font-serif leading-relaxed text-white/95">
              "{text}"
           </p>
           {ref && (
               <p className={`text-sm font-bold tracking-wide ${theme.text} opacity-80`}>
                  {ref.toUpperCase()}
               </p>
           )}
           <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 flex gap-4 mb-8 z-10">
          <button 
            onClick={() => setView('reflection')}
            className="flex-1 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-white py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group backdrop-blur-sm shadow-lg"
          >
            <BookOpen className={`w-6 h-6 text-zinc-400 group-hover:${theme.text} transition-colors`} />
            <span className="font-medium text-sm">Deep Dive</span>
          </button>
          <button 
            onClick={() => setView('prayer')}
            className="flex-1 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-white py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group backdrop-blur-sm shadow-lg"
          >
            <HeartHandshake className={`w-6 h-6 text-zinc-400 group-hover:${theme.text} transition-colors`} />
            <span className="font-medium text-sm">Let's Pray</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="px-6 mt-auto pb-10 space-y-4 z-10">
             <button 
                onClick={handleReflectClick}
                className="w-full py-4 rounded-2xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all flex items-center justify-center gap-2 group"
            >
                <PenLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Reflect</span>
            </button>

            <button 
                onClick={reset}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-colors shadow-lg active:scale-95"
            >
                Done
            </button>
        </div>

      </div>
    </div>
  );
};
