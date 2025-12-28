
import React, { useState } from 'react';
import { JarColor } from '../types';
import { soundService } from '../services/soundService';

interface BubbleSelectorProps {
  onSelect: (emotion: string) => void;
  disabled: boolean;
}

const EMOTIONS = [
  { name: 'Happy', color: JarColor.YELLOW, size: 'w-28 h-28 md:w-32 md:h-32 text-sm md:text-base', rotate: 'rotate-2' },
  { name: 'Worried', color: JarColor.GREEN, size: 'w-24 h-24 md:w-28 md:h-28 text-xs md:text-sm', rotate: '-rotate-2' },
  { name: 'Mad', color: JarColor.RED, size: 'w-32 h-32 md:w-36 md:h-36 text-lg md:text-xl', rotate: 'rotate-3' },
  { name: 'Thankful', color: JarColor.PINK, size: 'w-28 h-28 md:w-32 md:h-32 text-sm md:text-base', rotate: '-rotate-1' },
  { name: 'Sad', color: JarColor.PURPLE, size: 'w-32 h-32 md:w-36 md:h-36 text-base md:text-lg', rotate: 'rotate-1' },
  { name: 'Lonely', color: JarColor.BLUE, size: 'w-28 h-28 md:w-32 md:h-32 text-sm md:text-base', rotate: '-rotate-3' },
  { name: 'Excited', color: JarColor.YELLOW, size: 'w-24 h-24 md:w-28 md:h-28 text-xs md:text-sm', rotate: 'rotate-6' },
  { name: 'Scared', color: JarColor.GREEN, size: 'w-32 h-32 md:w-36 md:h-36 text-base md:text-lg', rotate: '-rotate-2' },
  { name: 'Angry', color: JarColor.RED, size: 'w-28 h-28 md:w-32 md:h-32 text-sm md:text-base', rotate: 'rotate-2' },
  { name: 'Blessed', color: JarColor.PINK, size: 'w-24 h-24 md:w-28 md:h-28 text-xs md:text-sm', rotate: '-rotate-3' },
  { name: 'Gloomy', color: JarColor.PURPLE, size: 'w-24 h-24 md:w-28 md:h-28 text-xs md:text-sm', rotate: 'rotate-3' },
  { name: 'Left Out', color: JarColor.BLUE, size: 'w-24 h-24 md:w-28 md:h-28 text-[10px] md:text-xs', rotate: '-rotate-2' },
  { name: 'Joyful', color: JarColor.YELLOW, size: 'w-28 h-28 md:w-32 md:h-32 text-sm md:text-base', rotate: 'rotate-1' },
  { name: 'Nervous', color: JarColor.GREEN, size: 'w-20 h-20 md:w-24 md:h-24 text-xs', rotate: '-rotate-6' },
  { name: 'Frustrated', color: JarColor.RED, size: 'w-28 h-28 md:w-32 md:h-32 text-xs md:text-sm', rotate: 'rotate-2' },
  { name: 'Glad', color: JarColor.PINK, size: 'w-24 h-24 md:w-28 md:h-28 text-xs md:text-sm', rotate: '-rotate-1' },
  { name: 'Heartbroken', color: JarColor.PURPLE, size: 'w-32 h-32 md:w-36 md:h-36 text-sm md:text-base', rotate: 'rotate-2' },
  { name: 'All Alone', color: JarColor.BLUE, size: 'w-24 h-24 md:w-28 md:h-28 text-xs md:text-sm', rotate: '-rotate-2' },
  { name: 'Cheerful', color: JarColor.YELLOW, size: 'w-24 h-24 md:w-28 md:h-28 text-xs md:text-sm', rotate: 'rotate-3' },
  { name: 'Restless', color: JarColor.GREEN, size: 'w-24 h-24 md:w-28 md:h-28 text-xs md:text-sm', rotate: '-rotate-3' },
  { name: 'Furious', color: JarColor.RED, size: 'w-24 h-24 md:w-28 md:h-28 text-sm md:text-base', rotate: 'rotate-1' },
  { name: 'Grateful', color: JarColor.PINK, size: 'w-32 h-32 md:w-36 md:h-36 text-base md:text-lg', rotate: '-rotate-2' },
  { name: 'Unhappy', color: JarColor.PURPLE, size: 'w-28 h-28 md:w-32 md:h-32 text-sm md:text-base', rotate: 'rotate-2' },
  { name: 'Empty', color: JarColor.BLUE, size: 'w-20 h-20 md:w-24 md:h-24 text-xs', rotate: '-rotate-1' },
  { name: 'Good', color: JarColor.YELLOW, size: 'w-32 h-32 md:w-36 md:h-36 text-lg md:text-xl', rotate: 'rotate-3' },
  { name: 'Anxious', color: JarColor.GREEN, size: 'w-28 h-28 md:w-32 md:h-32 text-sm md:text-base', rotate: '-rotate-2' },
  { name: 'Annoyed', color: JarColor.RED, size: 'w-20 h-20 md:w-24 md:h-24 text-[10px] md:text-xs', rotate: 'rotate-6' },
  { name: 'Hopeful', color: JarColor.YELLOW, size: 'w-24 h-24 md:w-28 md:h-28 text-xs', rotate: '-rotate-3' },
  { name: 'Forgotten', color: JarColor.BLUE, size: 'w-28 h-28 md:w-32 md:h-32 text-sm md:text-base', rotate: 'rotate-2' },
  { name: 'Down', color: JarColor.PURPLE, size: 'w-20 h-20 md:w-24 md:h-24 text-[10px] md:text-xs', rotate: '-rotate-2' },
  { name: 'Delighted', color: JarColor.YELLOW, size: 'w-28 h-28 md:w-32 md:h-32 text-sm md:text-base', rotate: 'rotate-2' },
  { name: 'Upset', color: JarColor.RED, size: 'w-24 h-24 md:w-28 md:h-28 text-sm md:text-base', rotate: '-rotate-3' },
  { name: 'Appreciative', color: JarColor.PINK, size: 'w-32 h-32 md:w-36 md:h-36 text-sm md:text-base', rotate: 'rotate-1' },
  { name: 'Uneasy', color: JarColor.GREEN, size: 'w-24 h-24 md:w-28 md:h-28 text-xs', rotate: '-rotate-2' },
  { name: 'Panic', color: JarColor.GREEN, size: 'w-24 h-24 md:w-28 md:h-28 text-sm', rotate: 'rotate-3' },
  { name: 'Unwanted', color: JarColor.BLUE, size: 'w-28 h-28 md:w-32 md:h-32 text-xs md:text-sm', rotate: '-rotate-1' },
  { name: 'Tearful', color: JarColor.PURPLE, size: 'w-24 h-24 md:w-28 md:h-28 text-xs', rotate: 'rotate-2' },
  { name: 'Peaceful', color: JarColor.YELLOW, size: 'w-24 h-24 md:w-28 md:h-28 text-sm', rotate: 'rotate-1' },
  { name: 'Jealous', color: JarColor.RED, size: 'w-28 h-28 md:w-32 md:h-32 text-sm', rotate: '-rotate-2' },
  { name: 'Bored', color: JarColor.PURPLE, size: 'w-24 h-24 md:w-28 md:h-28 text-xs', rotate: 'rotate-3' },
  { name: 'Silly', color: JarColor.YELLOW, size: 'w-20 h-20 md:w-24 md:h-24 text-xs', rotate: '-rotate-1' },
  { name: 'Guilty', color: JarColor.BLUE, size: 'w-28 h-28 md:w-32 md:h-32 text-sm', rotate: 'rotate-2' },
  { name: 'Proud', color: JarColor.YELLOW, size: 'w-24 h-24 md:w-28 md:h-28 text-sm', rotate: '-rotate-3' },
];

const GRADIENT_CONFIGS = {
  [JarColor.YELLOW]: { id: 'grad-YELLOW', text: 'text-yellow-950', glow: 'rgba(234, 179, 8, 0.6)' },
  [JarColor.PINK]: { id: 'grad-PINK', text: 'text-pink-900', glow: 'rgba(244, 114, 182, 0.6)' },
  [JarColor.RED]: { id: 'grad-RED', text: 'text-white', glow: 'rgba(239, 68, 68, 0.6)' },
  [JarColor.GREEN]: { id: 'grad-GREEN', text: 'text-lime-900', glow: 'rgba(132, 204, 22, 0.6)' },
  [JarColor.BLUE]: { id: 'grad-BLUE', text: 'text-white', glow: 'rgba(59, 130, 246, 0.6)' },
  [JarColor.PURPLE]: { id: 'grad-PURPLE', text: 'text-sky-950', glow: 'rgba(14, 165, 233, 0.6)' },
  'NEUTRAL': { id: 'grad-NEUTRAL', text: 'text-slate-800', glow: 'rgba(148, 163, 184, 0.6)' },
};

const FloatKeyframes = () => (
  <style>{`
    @keyframes float {
      0% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-8px) rotate(2deg); }
      66% { transform: translateY(4px) rotate(-2deg); }
      100% { transform: translateY(0px) rotate(0deg); }
    }
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
    .transition-bounce {
      transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
  `}</style>
);

const GradientDefs = () => (
  <svg width="0" height="0" className="absolute block">
    <defs>
      <linearGradient id="grad-YELLOW" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" /> <stop offset="100%" stopColor="#EAB308" />
      </linearGradient>
      <linearGradient id="grad-PINK" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBCFE8" /> <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <linearGradient id="grad-RED" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" /> <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
      <linearGradient id="grad-GREEN" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#D9F99D" /> <stop offset="100%" stopColor="#65A30D" />
      </linearGradient>
      <linearGradient id="grad-BLUE" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" /> <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      <linearGradient id="grad-PURPLE" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#7DD3FC" /> <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="grad-NEUTRAL" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F1F5F9" /> <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
    </defs>
  </svg>
);

export const BubbleSelector: React.FC<BubbleSelectorProps> = ({ onSelect, disabled }) => {
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);

  const handleSelect = (index: number, name: string) => {
    if (disabled || selectingIndex !== null) return;
    
    // Play Pop Sound
    soundService.playPop();
    // Strong haptic feedback for selection
    soundService.triggerHaptic(15);

    setSelectingIndex(index);
    
    // Play animation then trigger callback
    setTimeout(() => {
      onSelect(name);
      // Reset state nicely if user comes back
      setTimeout(() => setSelectingIndex(null), 500);
    }, 450);
  };

  return (
    <div className="w-full h-[65vh] md:h-full overflow-y-auto md:overflow-visible snap-y snap-proximity md:snap-none pb-32 hide-scrollbar">
      <FloatKeyframes />
      <GradientDefs />
      
      {/* Container */}
      <div className="flex flex-wrap justify-center content-start max-w-5xl mx-auto px-1 py-4 gap-0.5">
        {EMOTIONS.map((emotion, idx) => {
            const config = GRADIENT_CONFIGS[emotion.color] || GRADIENT_CONFIGS.NEUTRAL;
            // Generate a random-looking delay so they don't move in unison
            const animationDelay = `${(idx * 0.7) % 5}s`; 
            const duration = `${5 + (idx % 3)}s`;
            
            const isSelected = selectingIndex === idx;
            const isOtherSelected = selectingIndex !== null && !isSelected;

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx, emotion.name)}
                disabled={disabled || selectingIndex !== null}
                className={`
                  relative group flex-shrink-0 flex items-center justify-center font-serif font-bold tracking-tight
                  ${emotion.size}
                  -m-2 md:-m-3 
                  snap-center
                  transition-all duration-500 transition-bounce
                  ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
                  ${isSelected ? 'scale-125 z-50 brightness-110 drop-shadow-2xl' : ''}
                  ${isOtherSelected ? 'opacity-20 scale-90 blur-[1px]' : ''}
                  ${selectingIndex === null ? 'hover:scale-110 hover:z-30' : ''}
                `}
                style={{ 
                   zIndex: isSelected ? 100 : idx 
                }}
              >
                {/* 
                  Inner Wrapper for Float Animation 
                  We apply the float animation here so the parent button can handle the scale/select animation without conflict.
                */}
                <div 
                    className={`w-full h-full relative flex items-center justify-center ${isSelected ? '' : 'animate-float'}`}
                    style={{
                       animationDelay,
                       animationDuration: duration,
                       // Apply rotation here to maintain the jaunty angles
                       transform: isSelected ? 'rotate(0deg)' : undefined 
                    }}
                >
                    {/* Apply the static rotation via class if not selected, or reset if selected for a clean pop */}
                    <div className={`w-full h-full transition-transform duration-500 ${isSelected ? 'rotate-0' : emotion.rotate}`}>
                        {/* Heart SVG Background */}
                        <svg 
                        viewBox="0 0 100 100" 
                        className="absolute inset-0 w-full h-full transition-all duration-300 group-hover:brightness-110"
                        style={{ 
                            overflow: 'visible',
                            filter: `drop-shadow(0px 4px 6px ${config.glow}) drop-shadow(0px 10px 15px rgba(0,0,0,0.3))` 
                        }}
                        >
                        <path d="M50 90 C50 90 90 65 90 35 C90 15 72 5 53 20 C51 21 49 21 47 20 C28 5 10 15 10 35 C10 65 50 90 50 90 Z" 
                                fill={`url(#${config.id})`} />
                        
                        <path d="M 25 30 Q 50 15 75 30" 
                                fill="none" 
                                stroke="white" 
                                strokeWidth="4" 
                                strokeLinecap="round"
                                opacity="0.3" 
                                className="mix-blend-overlay" />
                        
                        <circle cx="30" cy="30" r="3" fill="white" opacity="0.6" />
                        </svg>
                        
                        {/* Centered Text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-center leading-none px-2 pb-1 ${config.text} drop-shadow-sm`}>
                            {emotion.name}
                            </span>
                        </div>
                    </div>
                </div>
              </button>
            );
        })}
      </div>
    </div>
  );
};
