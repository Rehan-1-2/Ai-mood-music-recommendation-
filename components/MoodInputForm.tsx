import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Mic, MicOff, Send, X, RefreshCw, Sparkles, Smile } from 'lucide-react';

interface MoodInputFormProps {
  onSubmit: (text: string, imageData?: string) => void;
  isLoading: boolean;
}

const MoodInputForm: React.FC<MoodInputFormProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'camera'>('text');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopCamera();
    };
  }, []);

  // Handle camera start/stop based on inputMode
  useEffect(() => {
    if (inputMode === 'camera' && !capturedImage) {
      startCamera();
    } else if (inputMode !== 'camera') {
      stopCamera();
    }
    
    return () => {
      // Don't stop camera on every render, only when mode changes or unmounts
      // handled by the logic above
    };
  }, [inputMode, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      
      streamRef.current = stream;
      setIsCameraActive(true);

      // Give React a moment to render the video element if it's new
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.error("Error playing video:", playErr);
          }
        }
        setIsCameraLoading(false);
      }, 100);

    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera. Please check permissions.");
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Use actual video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the capture to match the mirrored preview
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // startCamera will be re-triggered by useEffect
  };

  const toggleCameraMode = () => {
    if (inputMode === 'text') {
      setInputMode('camera');
    } else {
      setInputMode('text');
      setCapturedImage(null);
    }
  };

  const startListening = () => {
    setMicError(null);

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        setMicError("Voice input not supported.");
        return;
    }

    try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setText(transcript);

            if (event.results[0].isFinal) {
                recognition.stop();
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                setMicError("Mic access denied.");
            } else if (event.error === 'no-speech') {
                setMicError(null); 
            } else if (event.error === 'network') {
                setMicError("Network error.");
            } else {
                 setMicError("Error. Try again.");
            }
        };

        recognitionRef.current = recognition;
        recognition.start();

    } catch (e) {
        console.error("Failed to initialize speech recognition", e);
        setMicError("Could not start voice input.");
        setIsListening(false);
    }
  };

  const stopListening = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
  };

  const handleMicClick = () => {
    if (isListening) {
        stopListening();
    } else {
        if (text.trim().length > 0) {
             setText('');
        }
        startListening();
    }
  };

  const emojiMoods = [
    { emoji: '😀', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '🥳', label: 'Party' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '😎', label: 'Cool' },
    { emoji: '🥰', label: 'Love' },
    { emoji: '🧘', label: 'Calm' },
    { emoji: '🤯', label: 'Mindblown' },
    { emoji: '👻', label: 'Spooky' },
    { emoji: '🥺', label: 'Emotional' },
    { emoji: '😤', label: 'Determined' },
  ];

  const handleEmojiClick = (emoji: string) => {
    setText(prev => {
        const separator = prev.length > 0 ? ' ' : '';
        return prev + separator + emoji;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'text') {
      if (text.trim()) {
        if (isListening) stopListening();
        onSubmit(text);
      }
    } else if (capturedImage) {
      onSubmit(text, capturedImage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-8 relative z-10">
      <div className="flex justify-center mb-4 gap-2">
        <button
          type="button"
          onClick={() => {
            setInputMode('text');
            stopCamera();
            setCapturedImage(null);
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${inputMode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/20'}`}
        >
          Text & Voice
        </button>
        <button
          type="button"
          onClick={toggleCameraMode}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${inputMode === 'camera' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/20'}`}
        >
          <Camera size={16} />
          Face Detection
        </button>
      </div>

      <AnimatePresence mode="wait">
        {inputMode === 'text' ? (
          <motion.div
            key="text-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative group"
          >
            <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-2xl opacity-0 group-hover:opacity-30 transition duration-1000 blur-lg ${isListening ? 'animate-pulse opacity-50' : ''}`}></div>
            
            <div className={`relative w-full h-36 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 shadow-xl ${isListening ? 'border-indigo-500/30 bg-white/80 dark:bg-white/10' : 'hover:border-indigo-300 dark:hover:border-white/20'}`}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Describe your mood, speak it, or pick an emoji..."}
                    className="w-full h-full p-6 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400/70 focus:outline-none resize-none pr-20 text-lg font-light tracking-wide z-10 relative"
                    disabled={isLoading}
                />
                
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-20">
                    {micError && (
                        <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded border border-red-200 dark:border-red-800 animate-fadeIn whitespace-nowrap">
                            {micError}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleMicClick}
                        disabled={isLoading}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-slate-200 dark:border-white/10 ${isListening ? 'bg-red-500/80 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 hover:scale-105'}`}
                        title={isListening ? "Stop Listening" : "Start Voice Input"}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                </div>
                
                {isListening && (
                    <div className="absolute top-4 right-4 flex space-x-1 z-20">
                        <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="camera-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <div className="relative w-full aspect-video bg-black/20 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center">
              {cameraError ? (
                <div className="text-center p-6 text-red-500">
                  <Camera size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{cameraError}</p>
                  <button 
                    onClick={startCamera}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                  >
                    Try Again
                  </button>
                </div>
              ) : capturedImage ? (
                <div className="relative w-full h-full group">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-transform"
                      title="Retake Photo"
                    >
                      <RefreshCw size={24} />
                    </button>
                    <div className="text-white text-center">
                      <p className="font-bold flex items-center justify-center gap-2">
                        <Smile size={18} /> Mood Captured!
                      </p>
                      <p className="text-xs opacity-80">Add text below if you like</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {isCameraLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md">
                      <RefreshCw className="w-10 h-10 text-white animate-spin mb-3" />
                      <p className="text-white font-medium">Initializing Camera...</p>
                    </div>
                  )}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover mirror transition-opacity duration-500 ${isCameraLoading ? 'opacity-0' : 'opacity-100'}`}
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform border-4 border-white/20"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-white/40" />
                    </button>
                  </div>
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs flex items-center gap-2">
                     <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                     Live Detection Active
                  </div>
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="mt-4">
               <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Optional: Tell AI more about how you're feeling..."
                  className="w-full px-6 py-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-all shadow-lg"
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Emoji Bar */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center opacity-80 flex items-center justify-center gap-2">
          <Sparkles size={12} /> Quick Expressions
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
            {emojiMoods.map((item, index) => (
                <motion.button
                    key={index}
                    whileHover={{ y: -4, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleEmojiClick(item.emoji)}
                    disabled={isLoading}
                    className="group relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-white dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-md shadow-lg"
                    title={item.label}
                >
                    <span className="text-2xl filter grayscale-[0.3] group-hover:grayscale-0 transition-all duration-200">{item.emoji}</span>
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-md -z-10"></div>
                </motion.button>
            ))}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading || (inputMode === 'text' ? !text.trim() : !capturedImage && !text.trim())}
        className="w-full flex items-center justify-center h-[64px] px-8 bg-gradient-to-r from-indigo-600 via-indigo-500 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] border border-white/20 group"
      >
        {isLoading ? (
          <RefreshCw className="animate-spin mr-3" />
        ) : (
          <Sparkles className="mr-3 group-hover:scale-125 transition-transform" />
        )}
        {isLoading ? 'Analyzing Mood...' : inputMode === 'camera' ? 'Detect Mood & Recommend' : 'Get Recommendations'}
      </button>
    </form>
  );
};

export default MoodInputForm;