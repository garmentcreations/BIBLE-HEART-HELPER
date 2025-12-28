import React, { useEffect, useState } from 'react';

const EMOTIONS = [
  { color: '#FACC15' }, // Happy
  { color: '#FBCFE8' }, // Thankful
  { color: '#EF4444' }, // Angry
  { color: '#A3E635' }, // Anxious
  { color: '#1E3A8A' }, // Lonely
  { color: '#38BDF8' }, // Sad
];

export const EmotionWheelLoader: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % EMOTIONS.length);
    }, 120); // Fast spin
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
        <div className="relative w-24 h-24 mb-6">
            <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="42" fill="none" stroke="#333" strokeWidth="6" className="opacity-50" />
                
                {/* Segments */}
                {EMOTIONS.map((emotion, index) => {
                    const isActive = index === activeIdx;
                    // Calculate segment props (simple 6 segments)
                    const C = 2 * Math.PI * 42; 
                    const gap = 4;
                    const segmentLength = (C / 6) - gap;
                    
                    return (
                        <circle 
                            key={index}
                            cx="50" cy="50" r="42" 
                            fill="none" 
                            stroke={emotion.color}
                            strokeWidth="8"
                            strokeDasharray={`${segmentLength} ${C - segmentLength}`}
                            strokeDashoffset={-((segmentLength + gap) * index)}
                            strokeLinecap="round"
                            className={`transition-all duration-200 ${isActive ? 'opacity-100 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'opacity-20'}`}
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
            </div>
        </div>
        <p className="text-white font-serif text-xl animate-pulse">Finding Verses...</p>
    </div>
  );
};