
import React from 'react';
import { HandHeartGraphic } from './HandHeartGraphic';

interface DonationSectionProps {
  onDonate: () => void;
}

export const DonationSection: React.FC<DonationSectionProps> = ({ onDonate }) => {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-24 h-24 mx-auto mb-4 relative z-10">
        <HandHeartGraphic className="w-full h-full" />
      </div>
      
      <h2 className="text-2xl font-serif font-bold mb-3 relative z-10">Support the Mission</h2>
      <p className="text-slate-300 mb-8 max-w-md mx-auto leading-relaxed relative z-10">
        Bible Heart Helper is free to use because we believe access to God's word shouldn't have a paywall. Support our server costs and development if you feel led.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
        <button 
          onClick={onDonate}
          className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-900/20"
        >
           Donate
        </button>
         <button className="px-6 py-3 bg-transparent border border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 transition-colors">
           Learn More
        </button>
      </div>
      <p className="mt-6 text-xs text-slate-500 uppercase tracking-widest relative z-10">Secure • Tax Deductible • Impactful</p>
    </div>
  );
};
