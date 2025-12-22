
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrainIcon, SparklesIcon, ChevronRight } from './Icons';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  isLoading: boolean;
  text: string;
  type?: 'social' | 'post' | 'chat' | 'default' | 'personality' | 'smart-import';
}

const LoadingScreen: React.FC<Props> = ({ isLoading, text, type = 'default' }) => {
  const { t } = useTranslation();
  const [tipIndex, setTipIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  
  // Terminal & Progress State
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Get Tips for the TOP WHITE CARD (Emotional/Insight)
  const getTips = (): string[] => {
    let result;
    switch(type) {
      case 'social': result = t('tips.social'); break;
      case 'post': result = t('tips.post'); break;
      case 'chat': result = t('tips.chat'); break;
      case 'personality': result = t('tips.personality'); break;
      case 'smart-import': result = t('tips.smartImport'); break;
      default: result = t('tips.personality'); break;
    }
    return Array.isArray(result) ? result : [];
  };

  // 2. Get Logs for the BOTTOM TERMINAL (Technical/System)
  const getLogs = (): string[] => {
    let result;
    switch(type) {
      case 'social': result = t('loading.logs.social'); break;
      case 'post': result = t('loading.logs.post'); break;
      case 'chat': result = t('loading.logs.chat'); break;
      case 'personality': result = t('loading.logs.personality'); break;
      case 'smart-import': result = t('loading.logs.smartImport'); break;
      default: result = t('loading.logs.default'); break;
    }
    return Array.isArray(result) ? result : ["Initializing system protocols...", "Establishing secure connection..."];
  };

  // Randomized Tips State (Top Box)
  const [randomizedTips, setRandomizedTips] = useState<string[]>([]);

  useEffect(() => {
    if (isLoading) {
      const baseTips = getTips();
      // Simple shuffle for variety
      const shuffled = [...baseTips].sort(() => Math.random() - 0.5);
      setRandomizedTips(shuffled);
      setTipIndex(0);
    }
  }, [isLoading, type]);

  // Terminal Content Source (Bottom Box) - Now using Logs again
  const TERMINAL_CONTENT = getLogs();

  useEffect(() => {
    if (!isLoading) {
      setSeconds(0);
      setProgress(0);
      setVisibleLogs([]);
      return;
    }
    
    // 1. Tip Cycling (Top Box) - Slower for reading
    const tipInterval = setInterval(() => {
      if (randomizedTips.length > 0) {
        setIsFading(true);
        setTimeout(() => {
          setTipIndex((prev) => (prev + 1) % randomizedTips.length);
          setIsFading(false);
        }, 500);
      }
    }, 5000); 

    // 2. Timer & Progress
    let targetDuration = 30;
    if (type === 'personality') targetDuration = 60;
    else if (type === 'social') targetDuration = 40; 
    else if (type === 'post') targetDuration = 30;   
    else if (type === 'chat') targetDuration = 35;   
    else if (type === 'smart-import') targetDuration = 8;

    const startTime = Date.now();
    
    const timerInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setSeconds(elapsed);
      
      const k = 4 / targetDuration;
      const calculatedProgress = 100 * (1 - Math.exp(-k * elapsed));
      
      setProgress(prev => {
        if (prev >= 99) return 99;
        return Math.max(prev, Math.min(calculatedProgress, 99));
      });
    }, 100);

    // 3. Terminal Log Streaming (Bottom Box) - Faster for "Tech" feel
    const sourceContent = TERMINAL_CONTENT.length > 0 ? TERMINAL_CONTENT : ["System initializing...", "Loading core modules...", "Connecting to neural engine..."];
    
    let logIndex = 0;
    
    if (sourceContent.length > 0) {
      setVisibleLogs([sourceContent[0]]);
      logIndex++;

      // Adjust speed: fast enough to look busy, slow enough to see keywords
      const logIntervalTime = Math.max(800, (targetDuration * 1000) / sourceContent.length * 0.8);

      const logInterval = setInterval(() => {
        if (logIndex < sourceContent.length) {
          setVisibleLogs(prev => {
             const newLogs = [...prev, sourceContent[logIndex]];
             // Keep only last 8 logs to maintain the "streaming" look without overflow issues
             return newLogs.slice(-8);
          });
          logIndex++;
        }
      }, logIntervalTime);

      return () => {
        clearInterval(tipInterval);
        clearInterval(timerInterval);
        clearInterval(logInterval);
      };
    }

    return () => {
      clearInterval(tipInterval);
      clearInterval(timerInterval);
    };
  }, [isLoading, type, randomizedTips.length, TERMINAL_CONTENT.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLogs]);

  const handleNextTip = () => {
    if (randomizedTips.length === 0) return;
    setIsFading(true);
    setTimeout(() => {
      setTipIndex((prev) => (prev + 1) % randomizedTips.length);
      setIsFading(false);
    }, 150);
  };

  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 z-[60] flex flex-col cursor-wait bg-cream/98 backdrop-blur-xl animate-fade-in items-center justify-center p-6">
      
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
      <div className="absolute -left-20 top-20 w-64 h-64 bg-navy/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -right-20 bottom-20 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm flex flex-col items-center space-y-8 z-10 relative">
        
        {/* 1. Main Text (Contextual) */}
        {text && text.trim().length > 0 && (
           <h2 className="text-xl font-serif font-bold text-navy text-center animate-pulse">
              {text}
           </h2>
        )}

        {/* 2. Tips Area (Top) - Gold/Emotional Theme */}
        <div className="w-full animate-slide-up">
          <div
            onClick={handleNextTip}
            className="bg-white/60 border border-white/50 px-4 py-4 rounded-2xl shadow-sm relative overflow-hidden backdrop-blur-sm text-center cursor-pointer active:scale-95 transition-all hover:bg-white/80 group select-none h-auto min-h-0 max-w-md mx-auto"
          >
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-navy/20 group-hover:text-navy/50 transition-colors">
                 <ChevronRight className="w-4 h-4" />
              </div>

              <div className={`flex items-center justify-center gap-2 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                  <SparklesIcon className="w-5 h-5 text-gold flex-shrink-0" />
                  <p className="text-base text-navy font-semibold leading-relaxed flex items-center text-left whitespace-pre-line md:whitespace-normal pr-2 line-clamp-2">
                    {randomizedTips[tipIndex] || "Analyzing psychological patterns..."}
                  </p>
              </div>
          </div>
        </div>

        {/* 3. Central Spinner */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative mb-6">
            <div className="absolute -inset-4 border-4 border-gold/20 border-t-gold/80 rounded-full animate-spin"></div>
            <div className="relative bg-white p-6 rounded-full shadow-2xl shadow-gold/20 border-4 border-white">
              <BrainIcon className="w-14 h-14 text-navy" />
            </div>
          </div>
          
          <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden relative shadow-inner mb-2">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-navy via-blue-500 to-navy bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"
                style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
              ></div>
          </div>
          
          <div className="flex items-center gap-3">
             <span className="font-mono text-2xl font-bold text-navy">{Math.floor(progress)}%</span>
          </div>
        </div>

        {/* 4. Terminal Logs (Bottom) - Green/Tech Theme */}
        <div className="w-full animate-slide-up">
            <div className="bg-[#0F172A]/95 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-md">
               {/* Terminal Header */}
               <div className="bg-white/5 px-4 py-2.5 flex justify-between items-center border-b border-white/5">
                  <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-500/50 border border-white/10"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50 border border-white/10"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-green-500/50 border border-white/10"></div>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                     <span className="text-[9px] font-mono text-green-500/80 uppercase tracking-widest font-bold">
                        SYSTEM_CORE_{type.toUpperCase().replace('-', '_')}
                     </span>
                  </div>
                  <div className="font-mono text-[9px] text-white/30 tabular-nums">
                     T+{seconds.toFixed(1)}s
                  </div>
               </div>

               {/* Terminal Content */}
               <div ref={scrollRef} className="h-32 p-4 overflow-y-auto font-mono text-[10px] space-y-2 no-scrollbar scroll-smooth mask-image-b relative">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                  
                  {visibleLogs.map((log, i) => (
                    <div key={i} className="animate-slide-up opacity-90 break-words leading-relaxed flex gap-2">
                       <span className="opacity-50 text-green-500 whitespace-nowrap select-none">{'>'}</span>
                       <span className={`text-gray-400 ${i === visibleLogs.length - 1 ? 'text-green-400 font-bold' : ''}`}>
                         {log}
                       </span>
                    </div>
                  ))}
                  <div className="animate-pulse text-green-500 font-bold pt-1">_</div>
               </div>
            </div>
        </div>

      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .mask-image-b {
           mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 100%);
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
