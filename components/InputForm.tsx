import React, { useState, useRef, useEffect } from 'react';
import { JournalEntryRequest } from '../types';
import { Send, Loader2, Mic, Video, StopCircle, AlertCircle } from 'lucide-react';

// Extend the window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface InputFormProps {
  onSubmit: (data: JournalEntryRequest) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
            // Use abort() instead of stop() on unmount to immediately cut connection
            // and prevent network errors from trying to finalize the stream.
            recognitionRef.current.abort();
        } catch (e) {
            // Ignore errors during cleanup
        }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setSpeechError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support talking to the app. Try using Chrome or Safari!");
      return;
    }

    try {
        // If an instance exists, abort it before creating a new one
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsRecording(true);
            setSpeechError(null);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
            setIsRecording(false);
            
            // Handle specific errors gracefully without alarming console logs
            if (event.error === 'network') {
                console.warn("Speech API Network error.");
                setSpeechError("Network error. Please check your connection or type instead.");
            } else if (event.error === 'not-allowed') {
                console.warn("Speech API Permission denied.");
                setSpeechError("Microphone access denied. Please allow permissions.");
            } else if (event.error === 'no-speech') {
                // Common, non-critical error
                setSpeechError("Didn't hear anything. Please try again.");
            } else if (event.error === 'aborted') {
                // Ignore aborted errors (user stopped or component unmounted)
                return;
            } else {
                console.error("Speech recognition error:", event.error);
                setSpeechError("Problem with voice input. Please type instead.");
            }
        };

        recognition.onresult = (event: any) => {
            let finalTranscriptChunk = '';
            
            // We only care about the final results to append to the existing text
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscriptChunk += event.results[i][0].transcript;
                }
            }

            if (finalTranscriptChunk) {
                setTranscript(prev => {
                    const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                    return prev + spacer + finalTranscriptChunk;
                });
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    } catch (e) {
        console.error("Failed to start recognition", e);
        setSpeechError("Could not start voice input.");
        setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecording) {
        // If submitting while recording, just stop recording and proceed
        stopRecording();
    }
    
    onSubmit({
      transcript,
      timestamp: new Date().toISOString(),
      inputType: 'text'
    });
  };

  const isFormValid = transcript.length > 2;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-600 flex justify-between items-center">
          <span>How are you feeling?</span>
          {isRecording && (
            <span className="text-red-500 text-xs font-bold animate-pulse uppercase tracking-wider">
              Listening...
            </span>
          )}
        </label>
        
        <div className="relative group">
          <textarea
            value={transcript}
            onChange={(e) => {
                setTranscript(e.target.value);
                if (speechError) setSpeechError(null);
            }}
            placeholder={isRecording ? "Listening..." : "Write how you feel here... (Example: 'I am sad because my friend was mean' or 'I am happy because I played outside')"}
            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none shadow-sm text-slate-800 placeholder:text-slate-400 min-h-[160px] resize-none pb-14
              ${isRecording 
                ? 'border-red-400 ring-2 ring-red-100 bg-red-50/30' 
                : speechError
                    ? 'border-red-300 ring-2 ring-red-50 bg-white'
                    : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white'
              }`}
            disabled={isLoading}
          />
          
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button 
              type="button" 
              onClick={toggleRecording}
              className={`p-3 rounded-full transition-all duration-300 shadow-sm ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-105 animate-pulse' 
                  : 'bg-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50'
              }`} 
              title={isRecording ? "Stop Recording" : "Record Audio"}
            >
              {isRecording ? <StopCircle className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <button 
              type="button" 
              className="p-3 rounded-full bg-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm" 
              title="Record Video (Coming Soon)"
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="min-h-[1.5em] text-center">
            {speechError ? (
                <p className="text-xs text-red-500 font-bold flex items-center justify-center gap-1 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-3 h-3" />
                    {speechError}
                </p>
            ) : isRecording ? (
                <p className="text-xs text-red-500 font-medium">Tap the red button when you are done talking.</p>
            ) : (
                <p className="text-xs text-slate-400">You can write, speak, or record a video.</p>
            )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full flex items-center justify-center py-4 rounded-xl font-semibold text-white transition-all transform ${
            !isFormValid || isLoading
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 hover:scale-[1.02] shadow-lg shadow-slate-200'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Finding Verses...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Find Verses
            </>
          )}
        </button>
      </div>
    </form>
  );
};