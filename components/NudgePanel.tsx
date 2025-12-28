
import React, { useState, useEffect, useRef } from 'react';
import { NudgeRequest, NudgeResponse, Reminder } from '../types';
import { ArrowLeft, X, Edit2, BellRing } from 'lucide-react';
import { soundService } from '../services/soundService';

interface NudgePanelProps {
  onGenerate: (data: NudgeRequest) => Promise<NudgeResponse | null>;
  isLoading: boolean;
  onBack: () => void;
}

// Helper to format time for display (e.g. "08:15" -> "8:15 AM")
const formatTimeDisplay = (time24: string) => {
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  return `${hour}:${minStr} ${ampm}`;
};

export const NudgePanel: React.FC<NudgePanelProps> = ({ onGenerate, isLoading, onBack }) => {
  // State
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('bible_helper_reminders');
    return saved ? JSON.parse(saved) : [
      { id: '1', label: 'Morning', time: '08:15', isEnabled: true },
      { id: '2', label: 'Evening', time: '18:30', isEnabled: false }
    ];
  });
  
  const [masterSwitch, setMasterSwitch] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Null = creating new

  // Modal State
  const [modalLabel, setModalLabel] = useState('My Reminder');
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(15);
  const [selectedAmpm, setSelectedAmpm] = useState<'AM'|'PM'>('AM');
  const [isSurprise, setIsSurprise] = useState(false);

  // --- Notification Logic ---
  useEffect(() => {
    // Request permission on mount
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bible_helper_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Check every minute for active reminders
  useEffect(() => {
    const checkReminders = () => {
      if (!masterSwitch) return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      reminders.forEach(reminder => {
        if (reminder.isEnabled && reminder.time === currentTimeString) {
          sendNotification(reminder.label);
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders, masterSwitch]);

  const sendNotification = (label: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
       new Notification('Bible Heart Helper', {
         body: `Time for your ${label} check-in! How is your heart doing?`,
         icon: '/icon.png' // Fallback icon
       });
    } else {
       // Fallback for demo if permissions denied
       console.log(`Notification triggered: ${label}`);
    }
  };

  // --- Handlers ---

  const handleToggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, isEnabled: !r.isEnabled } : r
    ));
  };

  const openAddModal = () => {
    setEditingId(null);
    setModalLabel('Daily Reminder');
    const now = new Date();
    let h = now.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    setSelectedHour(h);
    setSelectedMinute(now.getMinutes());
    setSelectedAmpm(ampm);
    setIsSurprise(false);
    setIsModalOpen(true);
  };

  const openEditModal = (r: Reminder) => {
    setEditingId(r.id);
    setModalLabel(r.label);
    const [hStr, mStr] = r.time.split(':');
    let h = parseInt(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    setSelectedHour(h);
    setSelectedMinute(parseInt(mStr));
    setSelectedAmpm(ampm);
    setIsSurprise(!!r.isSurprise);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // Convert back to 24h
    let h24 = selectedHour;
    if (selectedAmpm === 'PM' && h24 !== 12) h24 += 12;
    if (selectedAmpm === 'AM' && h24 === 12) h24 = 0;
    
    const timeStr = `${h24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;

    if (editingId) {
      setReminders(prev => prev.map(r => r.id === editingId ? {
        ...r, label: modalLabel, time: timeStr, isSurprise
      } : r));
    } else {
      const newReminder: Reminder = {
        id: Date.now().toString(),
        label: modalLabel,
        time: timeStr,
        isEnabled: true,
        isSurprise
      };
      setReminders(prev => [...prev, newReminder]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingId) {
      setReminders(prev => prev.filter(r => r.id !== editingId));
      setIsModalOpen(false);
    }
  };

  // --- Scroll Wheel Component ---
  const Wheel = ({ options, value, onChange }: { options: number[] | string[], value: number | string, onChange: (val: any) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    return (
      <div className="h-32 overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative py-12" ref={containerRef}>
        {options.map((opt) => (
          <div 
            key={opt} 
            onClick={() => onChange(opt)}
            className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all duration-200 ${opt === value ? 'text-white font-bold text-xl' : 'text-zinc-600 text-lg'}`}
          >
            {opt}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-[80vh] relative">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="md:hidden">
                <ArrowLeft className="w-6 h-6 text-zinc-500 hover:text-white transition-colors" />
            </button>
            <h1 className="text-3xl font-serif font-bold text-white">Notifications</h1>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
          Build a habit of checking in with God. Consistent reflection aligns your heart with His truth.
        </p>
      </div>

      {/* Main List */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6">
        
        {/* Master Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-zinc-500" />
            <span className="font-medium text-zinc-200">Daily Reminders</span>
          </div>
          <Toggle checked={masterSwitch} onChange={() => setMasterSwitch(!masterSwitch)} />
        </div>

        <div className="h-px bg-white/10 w-full" />

        {/* Reminder Items */}
        <div className={`space-y-6 transition-opacity duration-300 ${!masterSwitch ? 'opacity-50 pointer-events-none' : ''}`}>
          {reminders.map(r => (
            <div key={r.id} className="flex items-center justify-between group">
              <div className="cursor-pointer" onClick={() => openEditModal(r)}>
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold font-serif text-white">{r.label}</h3>
                    <Edit2 className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-light text-zinc-400 mt-1">{formatTimeDisplay(r.time)}</div>
              </div>
              <Toggle checked={r.isEnabled} onChange={() => handleToggleReminder(r.id)} />
            </div>
          ))}

          {/* Additional static rows to match screenshot aesthetic */}
          <div className="h-px bg-white/10 w-full" />
          
          <div className="flex items-center justify-between py-2 opacity-60">
             <div className="flex items-center gap-3">
               <div className="w-5 flex justify-center"><div className="w-0.5 h-4 bg-zinc-600 rounded-full"></div></div>
               <span className="font-medium text-zinc-200">Weekly Review Notifications</span>
             </div>
             <Toggle checked={true} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-2 opacity-60">
             <div className="flex items-center gap-3">
               <div className="w-5 flex justify-center"><div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div></div>
               <span className="font-medium text-zinc-200">Friends Notifications</span>
             </div>
             <Toggle checked={true} onChange={() => {}} />
          </div>

        </div>

        {/* Add Button */}
        <div className="pt-8 pb-24">
          <button 
            onClick={openAddModal}
            className="w-full bg-white text-black font-bold py-4 rounded-full text-lg shadow-lg hover:bg-zinc-200 transition-colors active:scale-95"
          >
            Add Daily Reminder
          </button>
        </div>
      </div>

      {/* ---------------- TIME PICKER MODAL (Dark Theme) ---------------- */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C1C1E] rounded-t-3xl border-t border-white/10 animate-in slide-in-from-bottom duration-300 pb-10">
             
             {/* Modal Header */}
             <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <input 
                  type="text" 
                  value={modalLabel} 
                  onChange={(e) => setModalLabel(e.target.value)}
                  className="bg-transparent text-2xl font-serif font-bold text-white outline-none placeholder:text-zinc-600 w-full"
                  placeholder="Reminder Name"
                />
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white ml-4">
                   <X className="w-5 h-5" />
                </button>
             </div>

             {/* Modal Content */}
             <div className="p-6">
                
                {/* Time Display/Preview */}
                <div className="text-center mb-8">
                   <span className="text-5xl font-light text-white tracking-tight">
                     {selectedHour}:{selectedMinute.toString().padStart(2, '0')}
                   </span>
                   <span className="text-xl font-medium text-zinc-500 ml-2">{selectedAmpm}</span>
                </div>

                {/* The "Wheels" */}
                <div className="flex justify-center gap-2 mb-8 relative h-32 overflow-hidden bg-black/20 rounded-xl">
                   {/* Selection Overlay Line */}
                   <div className="absolute top-1/2 left-0 right-0 h-10 -mt-5 bg-white/5 pointer-events-none border-y border-white/10" />
                   
                   {/* Hours */}
                   <div className="w-16 text-center z-10">
                      <Wheel 
                        options={Array.from({length: 12}, (_, i) => i + 1)} 
                        value={selectedHour} 
                        onChange={setSelectedHour} 
                      />
                   </div>
                   {/* Divider */}
                   <div className="flex items-center text-zinc-600 pb-1">:</div>
                   {/* Minutes */}
                   <div className="w-16 text-center z-10">
                      <Wheel 
                        options={Array.from({length: 12}, (_, i) => (i * 5).toString().padStart(2, '0'))} 
                        value={selectedMinute.toString().padStart(2, '0')} 
                        onChange={(v) => setSelectedMinute(parseInt(v))} 
                      />
                   </div>
                   {/* AM/PM */}
                   <div className="w-16 text-center z-10 ml-4 bg-black/20">
                      <Wheel 
                        options={['AM', 'PM']} 
                        value={selectedAmpm} 
                        onChange={setSelectedAmpm} 
                      />
                   </div>
                </div>

                {/* Options */}
                <div className="bg-[#2C2C2E] rounded-xl overflow-hidden mb-8">
                   <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">Surprise me</span>
                        <span className="text-xs text-zinc-500">Reminder at a random time</span>
                      </div>
                      <Toggle checked={isSurprise} onChange={() => setIsSurprise(!isSurprise)} />
                   </div>
                   {editingId && (
                     <div 
                        onClick={handleDelete}
                        className="p-4 text-red-500 font-medium text-center cursor-pointer hover:bg-white/5 transition-colors"
                     >
                        Delete Reminder
                     </div>
                   )}
                </div>

                {/* Save Button */}
                <button 
                  onClick={handleSave}
                  className="w-full bg-white text-black font-bold py-4 rounded-full text-lg active:scale-95 transition-transform"
                >
                  Save
                </button>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

// Reusable Toggle Component with Sound
const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => {
  const handleToggle = () => {
    soundService.playSwitch(!checked);
    soundService.triggerHaptic(10);
    onChange();
  };

  return (
    <button 
      onClick={handleToggle}
      className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${checked ? 'bg-[#34C759]' : 'bg-zinc-700'}`}
    >
      <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </button>
  );
};
