import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { JarColor, parseJarColor } from '../types';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  color?: string; 
}

// We are overriding the color map to strictly use dark backgrounds for the "Result" view 
// to match the screenshot provided by the user.
const colorMap: Record<JarColor, string> = {
  [JarColor.YELLOW]: 'bg-zinc-950',
  [JarColor.PINK]: 'bg-zinc-950',
  [JarColor.RED]: 'bg-zinc-950',
  [JarColor.GREEN]: 'bg-zinc-950',
  [JarColor.BLUE]: 'bg-zinc-950',
  [JarColor.PURPLE]: 'bg-zinc-950',
  [JarColor.NEUTRAL]: 'bg-zinc-950',
};

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, color }) => {
  const [visible, setVisible] = useState(false);
  
  // Use the dark theme map
  const jarColor = color ? parseJarColor(color) : JarColor.NEUTRAL;
  const bgClass = colorMap[jarColor] || 'bg-zinc-950';

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setVisible(false), 300); // Wait for animation
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[70] ${bgClass} rounded-t-[2.5rem] shadow-2xl transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) transform ${isOpen ? 'translate-y-0' : 'translate-y-full'} max-h-[95vh] overflow-y-auto border-t border-white/10`}
      >
        <div className="sticky top-0 left-0 right-0 h-8 flex justify-center items-center z-10 bg-inherit rounded-t-[2.5rem] touch-none" onClick={onClose}>
             <div className="w-12 h-1.5 bg-zinc-800 rounded-full cursor-pointer hover:bg-zinc-700 transition-colors"></div>
        </div>
        
        <div className="relative pb-10 px-0 md:px-0">
             <button 
                onClick={onClose}
                className="absolute top-0 right-6 p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors z-20 border border-zinc-800 text-zinc-400"
             >
                <X className="w-5 h-5" />
             </button>
            {children}
        </div>
      </div>
    </>
  );
};