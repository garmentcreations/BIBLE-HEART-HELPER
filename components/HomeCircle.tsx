
import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { soundService } from '../services/soundService';

interface HomeCircleProps {
  onCheckIn: () => void;
}

const EMOTIONS = [
  { label: 'Happy', color: '#FACC15', tailwindColor: 'text-yellow-400' },
  { label: 'Thankful', color: '#FBCFE8', tailwindColor: 'text-pink-300' },
  { label: 'Angry', color: '#EF4444', tailwindColor: 'text-red-500' },
  { label: 'Anxious', color: '#A3E635', tailwindColor: 'text-lime-400' },
  { label: 'Lonely', color: '#1E3A8A', tailwindColor: 'text-blue-500' },
  { label: 'Sad', color: '#38BDF8', tailwindColor: 'text-sky-400' },
];

export const HomeCircle: React.FC<HomeCircleProps> = ({ onCheckIn }) => {
  const [activeEmotionIndex, setActiveEmotionIndex] = useState(0);
  const [isFullCircle, setIsFullCircle] = useState(false);

  useEffect(() => {
    const SEGMENT_DURATION = 1000;
    const HOLD_DURATION = 3000;
    const TOTAL_CYCLE = (EMOTIONS.length * SEGMENT_DURATION) + HOLD_DURATION;

    const runCycle = () => {
        setIsFullCircle(false);
        setActiveEmotionIndex(0);

        EMOTIONS.forEach((_, idx) => {
            setTimeout(() => {
                setActiveEmotionIndex(idx);
            }, idx * SEGMENT_DURATION);
        });

        setTimeout(() => {
            setIsFullCircle(true);
        }, EMOTIONS.length * SEGMENT_DURATION);
    };

    runCycle();
    const interval = setInterval(runCycle, TOTAL_CYCLE);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    soundService.playChime();
    soundService.triggerHaptic([10, 30, 10]); // Success-like vibration
    onCheckIn();
  };

  const activeEmotion = EMOTIONS[activeEmotionIndex];

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-700">
      
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-serif font-medium text-white mb-2 leading-tight">
            How are you feeling<br />
            <span className="text-zinc-500">right now?</span>
        </h2>
      </div>

      <div className="relative group cursor-pointer select-none" onClick={handleClick}>
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
      
      <p className="text-zinc-500 mt-12 text-center max-w-xs mx-auto">
        Tap the circle to align your heart with God's truth.
      </p>
    </div>
  );
};
