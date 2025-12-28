
import React from 'react';

export const HandHeartGraphic: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`${className} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="popHeartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" /> {/* Pink */}
            <stop offset="50%" stopColor="#A78BFA" /> {/* Purple */}
            <stop offset="100%" stopColor="#60A5FA" /> {/* Blue */}
          </linearGradient>
          <filter id="glow">
             <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
             <feMerge>
                 <feMergeNode in="coloredBlur"/>
                 <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>

        {/* Hand Silhouette - Stylized cupped hands */}
        <g className="animate-in slide-in-from-bottom-4 duration-1000">
            <path 
            d="M15 85 C15 85 35 100 50 100 C 65 100 85 85 85 85"
            fill="none" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            opacity="0.5" 
            />
             {/* Palm Fill */}
            <path 
            d="M15 85 C15 85 35 100 50 100 C 65 100 85 85 85 85 L 85 110 L 15 110 Z"
            fill="white"
            opacity="0.05"
            />
        </g>

        {/* Heart - Floating and Popping */}
        <g className="animate-bounce" style={{ animationDuration: '4s' }}>
           <path 
             d="M50 75 C50 75 90 50 90 28 C90 5 70 -5 50 15 C30 -5 10 5 10 28 C10 50 50 75 50 75 Z" 
             fill="url(#popHeartGradient)" 
             filter="url(#glow)"
             className="drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]"
           />
           {/* Shine */}
           <path 
             d="M 25 25 Q 45 10 65 25" 
             fill="none" 
             stroke="white" 
             strokeWidth="3" 
             strokeLinecap="round" 
             opacity="0.4" 
           />
           <circle cx="30" cy="22" r="3" fill="white" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};
