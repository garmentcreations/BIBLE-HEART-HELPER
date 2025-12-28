import React from 'react';
import { JarColor, parseJarColor } from '../types';

interface JarVisualProps {
  colorString: string | JarColor;
  loading: boolean;
}

const colorMap: Record<JarColor, string> = {
  [JarColor.YELLOW]: '#FACC15', // Happy (Yellow)
  [JarColor.PINK]: '#FBCFE8',   // Thankful (Light Pink)
  [JarColor.RED]: '#EF4444',    // Angry (Red)
  [JarColor.GREEN]: '#A3E635',  // Anxious (Lime Green)
  [JarColor.BLUE]: '#1E3A8A',   // Lonely (Dark Blue)
  [JarColor.PURPLE]: '#38BDF8', // Sad (Sky Blue) - using PURPLE enum
  [JarColor.NEUTRAL]: '#E2E8F0', // Slate
};

export const JarVisual: React.FC<JarVisualProps> = ({ colorString, loading }) => {
  const color = typeof colorString === 'string' ? parseJarColor(colorString) : colorString;
  
  const fillHeight = loading ? '50%' : color === JarColor.NEUTRAL ? '5%' : '85%';
  const fillColor = colorMap[color];
  
  // Animation for the liquid inside
  const liquidStyle = {
    height: fillHeight,
    backgroundColor: fillColor,
    transition: 'height 1.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 1s ease',
  };

  return (
    <div className="relative w-40 h-56 mx-auto flex items-center justify-center">
      {/* Jar Container SVG */}
      <svg
        viewBox="0 0 100 140"
        className="w-full h-full drop-shadow-xl z-10"
        style={{ overflow: 'visible' }}
      >
        {/* Glass Reflection/Highlight */}
        <defs>
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.1 }} />
            <stop offset="50%" style={{ stopColor: 'white', stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0.2 }} />
          </linearGradient>
        </defs>

        {/* Jar Outline */}
        <path
          d="M 25 5 L 25 15 L 15 20 L 15 130 C 15 136 20 140 26 140 L 74 140 C 80 140 85 136 85 130 L 85 20 L 75 15 L 75 5 Z"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="2"
          className="z-20"
        />
        
        {/* Lid */}
        <rect x="23" y="2" width="54" height="6" rx="1" fill="#64748B" />
        
        {/* Glass Overlay */}
        <path
           d="M 26 5 L 26 15 L 16 20 L 16 130 C 16 136 21 140 27 140 L 73 140 C 79 140 84 136 84 130 L 84 20 L 74 15 L 74 5 Z"
           fill="url(#glassGradient)"
           className="pointer-events-none"
        />
      </svg>

      {/* Liquid Container (Masked by CSS or effectively placed behind the outline) */}
      <div className="absolute bottom-2 w-[70%] left-[15%] h-[120px] overflow-hidden rounded-b-xl z-0">
         <div 
           className={`w-full absolute bottom-0 left-0 ${loading ? 'animate-pulse' : ''}`}
           style={liquidStyle}
         >
            {/* Bubbles if active */}
            {color !== JarColor.NEUTRAL && !loading && (
                 <>
                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-white opacity-40 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute bottom-6 left-8 w-1 h-1 bg-white opacity-30 rounded-full animate-bounce" style={{ animationDuration: '2.5s' }}></div>
                    <div className="absolute bottom-4 right-4 w-3 h-3 bg-white opacity-20 rounded-full animate-bounce" style={{ animationDuration: '4s' }}></div>
                 </>
            )}
         </div>
      </div>
    </div>
  );
};