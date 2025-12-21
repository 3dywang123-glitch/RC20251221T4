
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TargetProfile, ChatSession, ChatMessage } from '../types';
import { BrainIcon, SendIcon, ImportIcon, ChevronRight, SparklesIcon, ZapIcon } from '../componentsv2/Icons';
import { getAvatarSrc } from '../utils';
import * as Gemini from '../servicesv2/geminiService';
import * as Storage from '../servicesv2/storageService';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  target: TargetProfile | null;
  session: ChatSession;
  replyOptions: string[];
  onSendMessage: (text: string) => void;
  onGetReplyOptions: (lastMessage: string) => void;
  onPartnerReply: (text: string, manualInsight?: string) => void;
  isThinking?: boolean;
  isAnalyzing?: boolean;
}

const ChatPage: React.FC<Props> = ({ 
  target, 
  session, 
  replyOptions: initialReplyOptions, 
  onSendMessage, 
  onGetReplyOptions, 
  onPartnerReply, 
  isThinking = false, 
  isAnalyzing = false 
}) => {
  const { t, language } = useTranslation();
  const [userMessage, setUserMessage] = useState('');
  const [partnerMessage, setPartnerMessage] = useState('');
  
  // Local Loading States
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  
  // Style cycle for New Topic & Suggested Replies
  const [topicStyleCounter, setTopicStyleCounter] = useState(0);
  const [replyStyleCounter, setReplyStyleCounter] = useState(0);
  
  const styles = language === 'cn' 
    ? ["观察细节", "深度共鸣", "调侃幽默", "哲学思考", "分享瞬间"]
    : ["Observational Detail", "Deep Resonance", "Playful Teasing", "Philosophical Thought", "Moment Sharing"];

  const replyStyles = language === 'cn'
    ? ["幽默俏皮", "沉稳直接", "共情暖男", "稍微推拉", "好奇宝宝"]
    : ["Playful/Witty", "Direct/Confident", "Empathetic", "Push-Pull", "Curious"];

  // Local Options State (to handle Refresh/Topics) - Now only holds 1 item as requested
  const [localOptions, setLocalOptions] = useState<string[]>(initialReplyOptions.length > 0 ? [initialReplyOptions[0]] : []);

  // Chat Tips State
  const chatTips = useMemo(() => t('tips.chatSim') as string[], [t]);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [isTipFading, setIsTipFading] = useState(false);
  const tipIntervalRef = useRef<number | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync initial options (only take first one)
  useEffect(() => {
    if (initialReplyOptions.length > 0) {
      setLocalOptions([initialReplyOptions[0]]);
    } else {
      setLocalOptions([]);
    }
  }, [initialReplyOptions]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, localOptions, isSimulating, isAnalyzing]);

  const advanceTip = useCallback(() => {
    setIsTipFading(true);
    setTimeout(() => {
        setActiveTipIndex(prev => (prev + 1) % chatTips.length);
        setIsTipFading(false);
    }, 300);
  }, [chatTips.length]);

  const startTipTimer = useCallback(() => {
    if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current);
    }
    tipIntervalRef.current = window.setInterval(() => {
        advanceTip();
    }, 7000);
  }, [advanceTip]);

  // Chat Tip Auto-Rotation
  useEffect(() => {
    startTipTimer();
    return () => {
        if (tipIntervalRef.current) {
            clearInterval(tipIntervalRef.current);
        }
    };
  }, [startTipTimer]);

  const handleTipClick = () => {
    advanceTip();
    startTipTimer(); // Reset timer on click
  };

  // Helper to render bold text from **markdown**
  const renderBoldText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-extrabold text-navy">{part.slice(2, -2)}</strong>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  if (!target) return null;

  // --- LOGIC HANDLERS ---

  const handleSendUser = async () => {
    if (!userMessage.trim()) return;
    const text = userMessage;
    setUserMessage('');
    onSendMessage(text); 
  };

  const handleSimulateReply = async () => {
    setIsSimulating(true);
    try {
        const { reply, insight } = await Gemini.generatePersonaReply(target, session.messages, language);
        onPartnerReply(reply, insight);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSimulating(false);
    }
  };

  const handlePartnerInput = async () => {
    if (!partnerMessage.trim()) return;
    const text = partnerMessage;
    setPartnerMessage('');
    onPartnerReply(text);
  };

  const handleRefreshSuggestions = async () => {
    if (session.messages.length === 0) return;
    const lastMsg = session.messages[session.messages.length - 1];
    const promptText = lastMsg.text;
    const userDesc = Storage.getUserProfile()?.personalityDescription || "Average";
    
    setIsGeneratingOptions(true);
    const styleToUse = replyStyles[replyStyleCounter % replyStyles.length];
    try {
        // Updated call signature for one-at-a-time suggestions
        const opt = await Gemini.generateReplyOptions(target.name, promptText, userDesc, language, styleToUse);
        setLocalOptions(opt);
        setReplyStyleCounter(prev => prev + 1);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGeneratingOptions(false);
    }
  };

  const handleGetTopics = async () => {
    setIsGeneratingOptions(true);
    const styleToUse = styles[topicStyleCounter % styles.length];
    try {
        const topicArray = await Gemini.generateConversationStarters(target, language, styleToUse);
        setLocalOptions(topicArray); 
        setTopicStyleCounter(prev => prev + 1);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGeneratingOptions(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-cream relative overflow-hidden">
      
      {/* 1. Slogan */}
      <div className="flex-shrink-0 bg-cream pt-1.5 px-6 z-20 relative">
         <div className="flex flex-col items-center justify-center animate-fade-in">
            <h2 className="text-xs sm:text-lg font-handwriting font-medium tracking-wide text-navy/60 mb-1 relative z-10 text-center whitespace-nowrap">
               {t('chat.slogan')}
            </h2>
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent relative z-10"></div>
         </div>
      </div>

      {/* 2. Header */}
      <div className="bg-white/90 backdrop-blur-md px-4 py-3 shadow-sm flex items-center justify-between z-30 flex-shrink-0 border-b border-gray-100 relative">
         <div className="flex items-center space-x-3 overflow-hidden flex-1 mr-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
              <img src={getAvatarSrc(target.avatarB64)} className="w-full h-full object-cover" alt="chat avatar" />
            </div>
            <div className="min-w-0 flex flex-col items-start gap-0.5">
                <div className="flex items-center gap-2 max-w-full">
                    <h3 className="font-bold text-navy text-sm font-serif truncate">{target.name}</h3>
                    {/* Simulate Button (Moved) */}
                    <button 
                       onClick={handleSimulateReply}
                       disabled={isSimulating}
                       className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-navy text-white rounded-full shadow-sm text-[9px] font-bold uppercase tracking-wider hover:bg-navy-light transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSimulating ? <div className="w-2 h-2 border-[1.5px] border-white/50 border-t-white rounded-full animate-spin"></div> : <span>🤖</span>}
                        <span>{t('chat.simulate')}</span>
                    </button>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide truncate">{t('chat.coachActive')}</span>
                </div>
            </div>
         </div>
         
         <div className="flex items-center flex-shrink-0">
             {/* New Topic - With Text */}
             <button 
               onClick={handleGetTopics}
               disabled={isGeneratingOptions}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 text-gold-dark hover:bg-gold hover:text-white transition active:scale-95 border border-gold/20 text-[10px] font-bold uppercase tracking-wider"
               title={t('chat.newTopic')}
             >
                {isGeneratingOptions ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-3.5 h-3.5" />}
                <span>{t('chat.newTopic')}</span>
             </button>
         </div>
      </div>

      {/* 3. Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-cream scroll-smooth pb-4">
        
        {/* Chat Tips */}
        <div className="flex justify-center mb-4 animate-fade-in relative z-0 cursor-pointer active:scale-95 transition-transform" onClick={handleTipClick}>
           <div className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-md border border-gold/30 shadow-sm px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold text-navy/70 max-w-[90%]">
              <SparklesIcon className="w-3 h-3 text-gold flex-shrink-0" />
              <span className={`transition-opacity duration-300 text-center uppercase tracking-wide whitespace-pre-line md:whitespace-normal ${isTipFading ? 'opacity-0' : 'opacity-100'}`}>
                {chatTips[activeTipIndex]}
              </span>
           </div>
        </div>

        {/* Messages */}
        {session.messages.map((msg) => {
          if(msg.sender === 'system') {
             return (
               <div key={msg.id} className="flex justify-center my-6">
                  <div className="text-[10px] font-bold text-gold-dark bg-gold/10 px-4 py-1 rounded-full uppercase tracking-widest">{msg.text}</div>
               </div>
             )
          }
          return (
            <div key={msg.id}>
              <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-navy text-white rounded-tr-none' 
                    : 'bg-white text-navy border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>

              {msg.coachInsight && msg.sender !== 'user' && (
                <div className="mt-2 flex justify-start">
                  <div className="max-w-[85%] bg-white border border-gold/30 rounded-2xl p-4 ml-2 relative shadow-sm">
                      <div className="text-[10px] font-bold text-gold-dark uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <BrainIcon className="w-3 h-3" /> {t('chat.coachInsight')}
                      </div>
                      <div className="text-xs text-navy/80 italic leading-relaxed font-medium">
                        "{renderBoldText(msg.coachInsight)}"
                      </div>
                  </div>
                </div>
              )}

              {msg.userCritique && msg.sender === 'user' && (
                <div className="mt-2 flex justify-end">
                  <div className="max-w-[85%] bg-blue-50 border border-blue-100 rounded-2xl p-3 mr-2 relative shadow-sm text-right">
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 flex items-center justify-end gap-1.5">
                        {t('chat.feedback')} <BrainIcon className="w-3 h-3" />
                      </div>
                      <div className="text-xs text-navy/80 italic leading-relaxed font-medium">
                        "{renderBoldText(msg.userCritique)}"
                      </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {isSimulating && (
          <div className="flex justify-start animate-pulse mb-4">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 shadow-sm">
              <div className="w-5 h-5 rounded-full border-2 border-navy/20 border-t-navy animate-spin"></div>
              <span className="text-xs text-gray-400">{t('chat.simulating')}</span>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex justify-end animate-pulse mb-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tr-none p-3 flex items-center gap-2 shadow-sm">
              <span className="text-xs text-blue-400">{t('chat.critiquing')}</span>
              <div className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin"></div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Footer - COMPACT INPUT AREA */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0 z-20 pb-12 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.03)]">
         
         {/* Suggested Replies Ribbon - Displays only one as requested */}
         {(localOptions.length > 0 || isGeneratingOptions) && (
           <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 max-h-48 overflow-y-auto">
             <div className="flex justify-between items-center mb-1.5">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('chat.suggestedReplies')}</div>
                <button 
                   onClick={handleRefreshSuggestions}
                   disabled={isGeneratingOptions}
                   className="text-[9px] font-bold text-navy bg-white border border-gray-200 px-2 py-0.5 rounded-md hover:bg-gray-100 active:scale-95 transition flex items-center gap-1"
                >
                   <ZapIcon className="w-2.5 h-2.5 text-blue-500" /> {t('chat.refresh')}
                </button>
             </div>
             
             {isGeneratingOptions ? (
                <div className="py-2 text-center text-[10px] text-gray-400 italic flex items-center justify-center gap-2">
                   <div className="w-3 h-3 border-2 border-gray-300 border-t-gold rounded-full animate-spin"></div>
                   {t('chat.dreaming')}
                </div>
             ) : (
                <div className="flex flex-col gap-1.5 pb-1">
                  {localOptions.map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => setUserMessage(opt)}
                      className="w-full text-left bg-white border border-gold/15 text-navy text-[11px] px-3 py-2 rounded-lg hover:bg-gold/5 transition shadow-sm active:scale-[0.99] leading-normal font-medium"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
             )}
           </div>
         )}

         <div className="p-3 space-y-2">
           
           {/* Row 1: Partner Reply Input */}
           <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#F5F7FA] rounded-xl px-3 py-2.5 flex items-center transition h-11">
                 <span className="text-gray-400 mr-2 flex-shrink-0"><ImportIcon className="w-4 h-4" /></span>
                 <input 
                   value={partnerMessage}
                   onChange={(e) => setPartnerMessage(e.target.value)}
                   placeholder={t('chat.pasteReply', { name: target.name })}
                   className="flex-1 bg-transparent text-[11px] text-navy font-medium placeholder-gray-400 outline-none"
                   disabled={isAnalyzing}
                 />
              </div>
              <button 
                onClick={handlePartnerInput}
                disabled={!partnerMessage.trim() || isAnalyzing}
                className="w-11 h-11 bg-[#D4C5A5] text-white rounded-xl hover:brightness-105 disabled:opacity-50 transition shadow-md flex-shrink-0 flex items-center justify-center active:scale-95"
              >
                <BrainIcon className="w-5 h-5" />
              </button>
           </div>

           {/* Row 2: User Reply Input */}
           <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border-2 border-navy/80 rounded-xl px-3 py-2.5 flex items-center transition shadow-sm h-11">
                 <input 
                   value={userMessage}
                   onChange={(e) => setUserMessage(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSendUser()}
                   placeholder={t('chat.typeReply')}
                   className="flex-1 bg-transparent text-[12px] text-navy font-semibold outline-none"
                 />
              </div>
              <button 
                onClick={handleSendUser}
                disabled={!userMessage.trim()}
                className="w-11 h-11 bg-[#8E97A4] text-white rounded-xl shadow-lg hover:brightness-105 disabled:opacity-50 transition flex-shrink-0 flex items-center justify-center active:scale-95"
              >
                <SendIcon className="w-5 h-5 rotate-0" />
              </button>
           </div>

         </div>
      </div>
    </div>
  );
};

export default ChatPage;
