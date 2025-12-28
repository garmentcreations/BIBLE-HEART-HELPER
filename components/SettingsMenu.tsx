
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, User, Bell, Lock, Accessibility, Sliders, Users, Sparkles, PenTool, FlaskConical, Phone, Heart, DollarSign, ArrowLeft, Check } from 'lucide-react';
import { HandHeartGraphic } from './HandHeartGraphic';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  initialView?: 'main' | 'donation';
}

type View = 'main' | 'ai_settings' | 'notifications' | 'security' | 'donation';

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose, userName = "Friend", initialView = 'main' }) => {
  const [currentView, setCurrentView] = useState<View>('main');
  const [showDonation, setShowDonation] = useState(false);
  const [showAIConsent, setShowAIConsent] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  
  // Settings State
  const [aiEnabled, setAiEnabled] = useState(false);

  // Reset view when opening/closing
  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView || 'main');
      // Auto-show donation slide-up after delay on main view ONLY if we start at main
      if (initialView === 'main') {
          const timer = setTimeout(() => {
              setShowDonation(true);
          }, 600);
          return () => clearTimeout(timer);
      }
    } else {
      setShowDonation(false);
      setShowAIConsent(false);
      setSelectedAmount(null);
    }
  }, [isOpen, initialView]);

  // Hide donation slide-up when navigating away from main
  useEffect(() => {
      if (currentView !== 'main') {
          setShowDonation(false);
      }
  }, [currentView]);

  const handleToggleAI = () => {
    if (aiEnabled) {
      setAiEnabled(false);
    } else {
      setShowAIConsent(true);
    }
  };

  const confirmEnableAI = () => {
    setAiEnabled(true);
    setShowAIConsent(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Bible Heart Helper',
      text: 'Align your heart with God using Bible Heart Helper.',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('App link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white animate-in slide-in-from-bottom duration-500 flex flex-col font-sans">
      
      {/* ------------------ MAIN VIEW ------------------ */}
      {currentView === 'main' && (
        <>
          {/* Header */}
          <div className="px-6 py-12 pb-4 flex items-end justify-between sticky top-0 bg-black z-20">
            <div className="flex flex-col gap-1">
              <button 
                onClick={onClose} 
                className="p-2 -ml-2 w-10 h-10 hover:bg-zinc-900 rounded-full transition-colors flex items-center justify-center mb-4"
              >
                <X className="w-6 h-6" />
              </button>
              <h1 className="text-4xl font-serif font-bold tracking-tight">Settings</h1>
            </div>
            <button 
                onClick={() => setCurrentView('donation')}
                className="p-3 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors mb-1 group"
            >
              <DollarSign className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-48 custom-scrollbar">
            
            {/* Profile Section */}
            <div className="py-6 border-b border-zinc-900 mb-2">
              <div className="flex items-center justify-between group cursor-pointer hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-medium">{userName}</span>
                </div>
                <ChevronRight className="w-6 h-6 text-zinc-600" />
              </div>
            </div>

            {/* Main Settings List */}
            <div className="space-y-1 py-4">
              <SettingsItem icon={Bell} label="Notifications" onClick={() => {}} />
              <SettingsItem icon={Lock} label="Security & data" onClick={() => {}} />
              <SettingsItem icon={Accessibility} label="Accessibility" onClick={() => {}} />
            </div>

            {/* Features Section */}
            <div className="py-6">
              <h3 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-wider pl-1">Features</h3>
              <div className="space-y-1">
                <SettingsItem icon={Sliders} label="Check-in preferences" onClick={() => {}} />
                <SettingsItem icon={Users} label="Friends & Sharing" onClick={handleShare} />
                <SettingsItem 
                    icon={Sparkles} 
                    label="AI settings" 
                    onClick={() => setCurrentView('ai_settings')}
                    value={aiEnabled ? "On" : "Off"}
                />
                <SettingsItem icon={PenTool} label="Tool settings" onClick={() => {}} />
                <SettingsItem icon={FlaskConical} label="The Heart Research Project" onClick={() => {}} />
              </div>
            </div>
            
            {/* Resources Section */}
            <div className="py-6">
              <h3 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-wider pl-1">Resources</h3>
              <div className="space-y-1">
                <SettingsItem icon={Phone} label="Mental health hotlines" onClick={() => {}} />
                <SettingsItem icon={Heart} label="Donate to Support" onClick={() => setCurrentView('donation')} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ------------------ AI SETTINGS VIEW ------------------ */}
      {currentView === 'ai_settings' && (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
             {/* Header */}
             <div className="px-6 py-12 pb-6 flex items-end sticky top-0 bg-black z-20">
                <div className="flex flex-col gap-1 w-full">
                    <button 
                        onClick={() => setCurrentView('main')} 
                        className="p-2 -ml-2 w-10 h-10 hover:bg-zinc-900 rounded-full transition-colors flex items-center justify-center mb-4 text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-serif font-bold tracking-tight">AI settings</h1>
                </div>
            </div>

            <div className="px-6 pt-4">
                <div 
                    onClick={handleToggleAI}
                    className="flex items-center justify-between py-4 cursor-pointer -mx-4 px-4 hover:bg-zinc-900/50 rounded-xl transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <Sparkles className="w-6 h-6 text-zinc-500" />
                        <span className="text-lg font-medium">Enable AI Features</span>
                    </div>
                    {/* Toggle Switch */}
                    <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${aiEnabled ? 'bg-white' : 'bg-zinc-800'}`}>
                        <div className={`w-6 h-6 rounded-full bg-black shadow-md transform transition-transform duration-300 ${aiEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ------------------ DONATION VIEW ------------------ */}
      {currentView === 'donation' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right duration-300 bg-black">
              {/* Header */}
              <div className="px-6 pt-12 pb-2 flex items-center sticky top-0 bg-black z-20">
                  <button 
                      onClick={() => {
                        if (initialView === 'donation') {
                            onClose();
                        } else {
                            setCurrentView('main');
                        }
                      }} 
                      className="p-2 -ml-2 w-10 h-10 hover:bg-zinc-900 rounded-full transition-colors flex items-center justify-center text-zinc-100 hover:text-white"
                  >
                      <ArrowLeft className="w-6 h-6" />
                  </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar">
                  <h1 className="text-4xl font-serif font-bold tracking-tight mb-4 leading-tight">Support our mission</h1>
                  
                  <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                      Your donation helps keep the app free and accessible to everyone. Contribute any amount to support our mission and future development.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                      {[25, 75, 150, 300].map((amount) => (
                          <button
                              key={amount}
                              onClick={() => setSelectedAmount(amount)}
                              className={`py-4 rounded-2xl border font-medium text-lg transition-all ${
                                  selectedAmount === amount 
                                  ? 'bg-zinc-800 border-zinc-700 text-white' 
                                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white bg-transparent'
                              }`}
                          >
                              ${amount}
                          </button>
                      ))}
                  </div>

                  <button className="w-full py-4 rounded-2xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 bg-transparent font-medium text-lg transition-all mb-3">
                      Choose amount
                  </button>

                  <button className="w-full py-4 rounded-2xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 bg-transparent font-medium text-lg transition-all mb-12">
                      Add your email for a receipt
                  </button>

                  {/* Graphic */}
                  <div className="flex justify-center mb-8 h-48 opacity-50">
                       <HandHeartGraphic className="w-48 h-48" />
                  </div>
              </div>

              {/* Bottom Fixed Button */}
              <div className="p-6 bg-black z-30 pb-10">
                  <button className="w-full bg-white text-black font-bold py-4 rounded-full text-lg hover:bg-zinc-200 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2">
                      Donate
                  </button>
              </div>
          </div>
      )}


      {/* ------------------ DONATION SLIDE-UP CARD (MAIN VIEW ONLY) ------------------ */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-700 cubic-bezier(0.32, 0.72, 0, 1) z-30 ${showDonation && currentView === 'main' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
      >
        <div className="bg-zinc-900 rounded-[2rem] p-6 pr-4 relative overflow-hidden shadow-2xl border border-zinc-800">
           
           {/* Graphic - Hand Heart Pop */}
           <div className="absolute bottom-2 right-2 w-28 h-28 pointer-events-none transform translate-y-2 translate-x-2">
               <HandHeartGraphic className="w-full h-full" />
           </div>

          <div className="relative z-10 max-w-[70%]">
            <h3 className="text-lg font-medium mb-2 leading-snug text-white">
              Support our mission — <br/>
              <span className="text-zinc-400 text-base">Bible Heart Helper is made possible by donations</span>
            </h3>
            
            <div className="flex items-center gap-4 mt-6">
              <button 
                onClick={() => setCurrentView('donation')}
                className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg active:scale-95 transform"
              >
                Donate
              </button>
              <button 
                onClick={() => setShowDonation(false)} 
                className="text-zinc-500 text-sm font-bold hover:text-white transition-colors px-2"
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------ AI CONSENT OVERLAY (FULL SCREEN MODAL) ------------------ */}
      {showAIConsent && (
        <div className="absolute inset-0 z-50 bg-black p-6 flex flex-col animate-in fade-in duration-300">
            <button 
                onClick={() => setShowAIConsent(false)}
                className="absolute top-6 left-6 p-2 -ml-2 text-white/70 hover:text-white"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="flex-1 flex flex-col justify-end pb-8">
                <h2 className="text-4xl font-serif font-bold text-white mb-8 leading-tight">
                    Do you want to use AI features?
                </h2>

                <div className="space-y-8 mb-12">
                    <div>
                        <h3 className="font-bold text-lg text-white mb-2">AI is your choice</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            All AI features are optional. You can still use Bible Heart Helper without them.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-white mb-2">Powered by Google Gemini</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            Bible Heart Helper's AI features are powered by Google Gemini. Your check-in data will be processed on Google's servers.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-white mb-2">Google does not retain your data</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            Bible Heart Helper and Google have a "Zero Data Retention" agreement in place so that Google does not retain the check-in data you provide.
                        </p>
                        <p className="text-zinc-400 mt-4 text-sm">
                            Please review <a href="#" className="underline text-white">Google's privacy policy</a> for more details.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={confirmEnableAI}
                        className="w-full bg-white text-black font-bold py-4 rounded-full text-lg hover:bg-zinc-200 transition-colors"
                    >
                        Enable AI features
                    </button>
                    <button 
                        onClick={() => setShowAIConsent(false)}
                        className="w-full bg-transparent border border-zinc-700 text-white font-bold py-4 rounded-full text-lg hover:bg-zinc-900 transition-colors"
                    >
                        Don't Enable
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

const SettingsItem = ({ icon: Icon, label, onClick, value }: { icon: any, label: string, onClick: () => void, value?: string }) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between py-4 cursor-pointer hover:bg-zinc-900/50 -mx-4 px-4 rounded-xl transition-colors group"
  >
    <div className="flex items-center gap-4">
      <Icon className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
      <span className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors">{label}</span>
    </div>
    <div className="flex items-center gap-2">
        {value && <span className="text-zinc-500 text-sm font-medium">{value}</span>}
        <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
    </div>
  </div>
);
