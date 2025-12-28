import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-out fade-out duration-1000 delay-[2500ms] fill-mode-forwards">
      <div className="relative flex flex-col items-center">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-pink-600/40 via-purple-600/40 to-blue-600/40 rounded-full blur-[80px] animate-pulse"></div>
        
        {/* Logo Container */}
        <div className="relative w-40 h-40 animate-in zoom-in duration-1000 ease-out">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_25px_rgba(236,72,153,0.5)]">
             <defs>
               <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#F472B6" /> {/* Pink */}
                 <stop offset="50%" stopColor="#A78BFA" /> {/* Purple */}
                 <stop offset="100%" stopColor="#60A5FA" /> {/* Blue */}
               </linearGradient>
             </defs>
             
             {/* Heart Shape */}
             <path 
               d="M50 90 C50 90 90 65 90 35 C90 15 72 5 53 20 C51 21 49 21 47 20 C28 5 10 15 10 35 C10 65 50 90 50 90 Z" 
               fill="url(#logoGradient)" 
               className="animate-pulse"
               style={{ animationDuration: '3s' }}
             />
             
             {/* Gloss */}
             <path 
               d="M 25 30 Q 50 15 75 30" 
               fill="none" 
               stroke="white" 
               strokeWidth="4" 
               strokeLinecap="round" 
               opacity="0.4" 
             />
          </svg>
        </div>

        <h1 className="mt-8 text-2xl font-serif font-bold text-white tracking-wider animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300">
          Bible Heart Helper
        </h1>
        <p className="text-white/50 text-sm mt-2 animate-in slide-in-from-bottom-2 fade-in duration-1000 delay-500">
          Aligning hearts with Truth
        </p>
      </div>
    </div>
  );
};