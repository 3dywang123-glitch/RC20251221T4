
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TargetProfile, SocialAnalysisResult, SocialPostAnalysis, RelationshipReport, ConsultationGoal, RelationshipStage } from '../types';
import { ChevronRight, BrainIcon, UploadIcon, TrashIcon, SparklesIcon, ChartIcon, ZapIcon, BookIcon, PlusIcon, ImportIcon } from '../componentsv2/Icons';
import { compressImage } from '../servicesv2/ai/core';
import { useTranslation } from '../contextsv2/LanguageContext';

// Helper interface for image state
interface ImageState {
  data: string;
  isAnalyzing: boolean;
}

// Reusable Wireframe Icon Component
const WireframeIcon = ({ type }: { type: 'profile' | 'moment' | 'chat' }) => {
  if (type === 'profile') {
    return (
       <div className="w-16 aspect-[3/4] bg-white border-2 border-gray-100 rounded-lg p-1 flex flex-col items-center shadow-sm relative overflow-hidden select-none">
          <div className="w-5 h-5 rounded-full bg-gray-200 border border-white shadow-sm mb-1.5 flex-shrink-0"></div>
          <div className="flex gap-0.5 mb-1.5 w-full justify-center">
              <div className="w-2.5 h-0.5 bg-gray-300 rounded-full"></div>
              <div className="w-2.5 h-0.5 bg-gray-300 rounded-full"></div>
          </div>
          <div className="grid grid-cols-3 gap-0.5 w-full mt-auto mb-0.5 px-0.5">
              {[...Array(6)].map((_,i)=><div key={i} className="aspect-square bg-blue-100/50 rounded-[1px]"></div>)}
          </div>
          <div className="absolute bottom-0.5 right-0.5 opacity-100">
              <ChartIcon className="w-2.5 h-2.5 text-blue-500" />
          </div>
       </div>
    );
  }
  if (type === 'moment') {
    return (
       <div className="w-16 aspect-[3/4] bg-white border-2 border-gray-100 rounded-lg p-1 flex flex-col shadow-sm relative overflow-hidden select-none">
          <div className="flex items-center gap-0.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
              <div className="w-6 h-0.5 bg-gray-300 rounded-full"></div>
          </div>
          <div className="w-full aspect-square bg-gray-100 rounded-md mb-1 relative overflow-hidden flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-200 rounded-full opacity-50"></div>
          </div>
          <div className="flex gap-0.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
          <div className="w-3/4 h-0.5 bg-gray-200 rounded-full"></div>
          <div className="absolute bottom-0.5 right-0.5 opacity-100">
              <ZapIcon className="w-2.5 h-2.5 text-gold-dark" />
          </div>
       </div>
    );
  }
  if (type === 'chat') {
    return (
       <div className="w-16 aspect-[3/4] bg-white border-2 border-gray-100 rounded-lg p-1 flex flex-col justify-center gap-1.5 shadow-sm relative overflow-hidden select-none">
          <div className="flex items-end gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300 flex-shrink-0"></div>
              <div className="w-9 h-3 bg-gray-100 rounded-md rounded-bl-none border border-gray-200"></div>
          </div>
          <div className="w-full flex justify-center py-0.5">
              <div className="w-5 h-0.5 bg-gray-200 rounded-full"></div>
          </div>
          <div className="flex items-end gap-0.5 justify-end">
              <div className="w-8 h-3 bg-purple-100 rounded-md rounded-br-none border border-purple-200"></div>
          </div>
          <div className="absolute bottom-0.5 right-0.5 opacity-100">
              <BrainIcon className="w-2.5 h-2.5 text-purple-500" />
          </div>
       </div>
    );
  }
  return null;
};

interface Props {
  target: TargetProfile | null;
  onAnalyzeProfile: (url: string, screenshots: string[]) => void;
  onAnalyzePost: (content: string, images: string[]) => void;
  onRunConsult: (context: { stage: string, goal: string, duration: string, chatLogs: string, chatImages: string[] }) => void;
  onNavigate: (view: string) => void;
  onViewPostDetails: (post: SocialPostAnalysis) => void;
  onViewSocialProfileDetails: (report: SocialAnalysisResult) => void;
  onViewConsultDetails: (report: RelationshipReport) => void;
  prefillData?: {
    type: 'PROFILE' | 'POST' | 'CHAT' | 'FEED';
    images: string[];
    context?: string;
  } | null;
  onClearPrefill?: () => void;
  onViewHelp?: (section: string) => void;
  initialTab?: 'overall' | 'post' | 'chatlog';
  onCreateProfile?: () => void;
  onSmartAnalyze?: () => void;
}

const AnalysisPage: React.FC<Props> = ({ 
  target, 
  onAnalyzeProfile, 
  onAnalyzePost, 
  onRunConsult,
  onNavigate, 
  onViewPostDetails, 
  onViewSocialProfileDetails, 
  onViewConsultDetails,
  prefillData,
  onClearPrefill,
  onViewHelp,
  initialTab,
  onCreateProfile,
  onSmartAnalyze
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overall' | 'post' | 'chatlog'>(initialTab || 'overall');
  
  // Tab-specific slogans
  const SLOGANS = {
    overall: t('analysis.slogan.overall'),
    post: t('analysis.slogan.post'),
    chatlog: t('analysis.slogan.chatlog')
  };

  // Sync tab if prop changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Form States
  const [url, setUrl] = useState('');
  const [profileImages, setProfileImages] = useState<ImageState[]>([]);
  const [postText, setPostText] = useState('');
  const [postImages, setPostImages] = useState<ImageState[]>([]);
  const [chatGoal, setChatGoal] = useState<string>("");
  const [chatDuration, setChatDuration] = useState('');
  const [chatLogsText, setChatLogsText] = useState('');
  const [chatImages, setChatImages] = useState<ImageState[]>([]);

  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [isTipFading, setIsTipFading] = useState(false);
  const tipIntervalRef = useRef<number | null>(null);

  // Using 'tips.*' to align with Loading Screen Tips Area content
  const tipsData = useMemo(() => ({
    overall: t('tips.social') as string[] || ["Analyzing social persona..."],
    post: t('tips.post') as string[] || ["Decoding moments..."],
    chatlog: t('tips.chat') as string[] || ["Mapping dynamics..."]
  }), [t]);

  const advanceTip = useCallback(() => {
    setIsTipFading(true);
    setTimeout(() => {
        const currentTips = tipsData[activeTab];
        setTipIndex(prev => (prev + 1) % currentTips.length);
        setIsTipFading(false);
    }, 300);
  }, [activeTab, tipsData]);

  const startTipTimer = useCallback(() => {
    if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
    tipIntervalRef.current = window.setInterval(advanceTip, 7000);
  }, [advanceTip]);

  useEffect(() => {
    setTipIndex(0);
    startTipTimer();
    return () => { if (tipIntervalRef.current) clearInterval(tipIntervalRef.current); };
  }, [activeTab, startTipTimer]);

  const handleTipClick = () => { advanceTip(); startTipTimer(); };

  // PREFILL DATA LOGIC - Resilient to state clearing
  useEffect(() => {
    if (prefillData && prefillData.images && prefillData.images.length > 0) {
      const imgStates = prefillData.images.map(img => ({ data: img, isAnalyzing: false }));
      const contextText = prefillData.context || "";

      if (prefillData.type === 'POST') {
        setActiveTab('post');
        setPostImages(imgStates);
        if (contextText) setPostText(contextText);
      } else if (prefillData.type === 'PROFILE' || prefillData.type === 'FEED') {
        setActiveTab('overall');
        setProfileImages(imgStates);
        if (contextText) setUrl(contextText);
      } else if (prefillData.type === 'CHAT') {
        setActiveTab('chatlog');
        setChatImages(imgStates);
        if (contextText) setChatLogsText(contextText);
      }
      
      // Delay clearing global prefill until next cycle
      setTimeout(() => {
        if (onClearPrefill) onClearPrefill();
      }, 500);
    }
  }, [prefillData]);

  if (!target) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<ImageState[]>>, maxSize = 1024) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingImages(true);
    try {
      const promises = Array.from(files).map(file => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            let b64 = reader.result as string;
            b64 = await compressImage(b64, maxSize, 0.7, 500);
            setter(prev => [...prev, { data: b64, isAnalyzing: false }]);
            resolve();
          };
          reader.readAsDataURL(file as Blob);
        });
      });
      await Promise.all(promises);
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number, setter: React.Dispatch<React.SetStateAction<ImageState[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const submitOverall = () => {
    const rawImages = profileImages.map(img => img.data);
    if (!url.trim() && rawImages.length === 0) return;
    onAnalyzeProfile(url, rawImages);
    setUrl(''); setProfileImages([]);
  };

  const submitPost = () => {
    const rawImages = postImages.map(img => img.data);
    if (!postText.trim() && rawImages.length === 0) return;
    onAnalyzePost(postText, rawImages);
    setPostText(''); setPostImages([]);
  };

  const submitChatlog = () => {
    const rawImages = chatImages.map(img => img.data);
    if (!chatGoal && !chatLogsText && rawImages.length === 0) return;
    onRunConsult({ stage: RelationshipStage.TALKING, goal: chatGoal, duration: chatDuration, chatLogs: chatLogsText, chatImages: rawImages });
    setChatLogsText(''); setChatImages([]);
  };

  const getChatGoalLabel = (goalKey: string) => {
    switch(goalKey) {
      case ConsultationGoal.GET_DATE: return t('analysis.goals.iceBreaker');
      case ConsultationGoal.HEAT_UP: return t('analysis.goals.heatUp');
      case ConsultationGoal.RECOVERY: return t('analysis.goals.recovery');
      case ConsultationGoal.MAINTAIN: return t('analysis.goals.maintain');
      default: return goalKey || "General";
    }
  };

  const getFormattedDate = (timestamp: number) => {
    const dateObj = new Date(timestamp);
    const localeCode = language === 'en' ? 'en-US' : 'zh-CN';
    return { 
        dateStr: dateObj.toLocaleDateString(localeCode, { month: 'short', day: 'numeric' }),
        timeStr: dateObj.toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  const socialHistory = target.socialAnalysisHistory ? [...target.socialAnalysisHistory].reverse() : [];
  const postHistory = target.postAnalysisHistory ? [...target.postAnalysisHistory].reverse() : []; 
  const consultHistory = target.consultationHistory ? [...target.consultationHistory].reverse() : [];

  return (
     <div className="h-screen flex flex-col bg-cream relative pb-24">
       
       {isProcessingImages && (
          <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] flex items-center justify-center cursor-wait">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce-slight">
               <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
               <span className="text-sm font-bold text-navy">{t('common.processing')}</span>
            </div>
          </div>
       )}

       <div className="flex-shrink-0 bg-cream pt-1.5 px-6 z-20 relative">
          <div className="flex flex-col items-center justify-center animate-fade-in">
             <h2 className="text-xs sm:text-lg font-handwriting font-medium tracking-wide text-navy/60 mb-1 text-center relative z-10 transition-all duration-300 whitespace-nowrap">
                {SLOGANS[activeTab] || "..."}
             </h2>
             <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent relative z-10"></div>
          </div>
       </div>

       <div className="flex-1 flex flex-col px-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4 flex-shrink-0 pt-2">
              <h2 className="text-2xl font-serif font-bold text-navy">{t('analysis.hub')}</h2>
              <button onClick={() => onViewHelp && onViewHelp('screenshot')} className="text-[10px] font-bold text-gold-dark bg-gold/10 px-3 py-1.5 rounded-full hover:bg-gold/20 transition flex items-center gap-1">
                <BookIcon className="w-3 h-3" /> {t('analysis.help')}
              </button>
          </div>

          <div className="flex bg-[#F5F2EA] rounded-xl p-1 mb-6 flex-shrink-0 border border-[#EBE5D9]">
              <button onClick={() => { setActiveTab('overall'); setTipIndex(0); }} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'overall' ? 'bg-navy text-white shadow-md' : 'text-navy/40 hover:text-navy'}`}>{t('analysis.tabs.overview')}</button>
              <button onClick={() => { setActiveTab('post'); setTipIndex(0); }} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'post' ? 'bg-navy text-white shadow-md' : 'text-navy/40 hover:text-navy'}`}>{t('analysis.tabs.post')}</button>
              <button onClick={() => { setActiveTab('chatlog'); setTipIndex(0); }} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'chatlog' ? 'bg-navy text-white shadow-md' : 'text-navy/40 hover:text-navy'}`}>{t('analysis.tabs.chatlog')}</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-12">
              {activeTab === 'overall' && (
                <div className="animate-slide-up space-y-4">
                    <div className="flex items-start gap-4 px-1">
                        <WireframeIcon type="profile" />
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 pt-0.5">
                            <div className="flex items-center gap-2">
                                <ChartIcon className="w-4 h-4 text-blue-500" />
                                <h3 className="font-serif font-bold text-navy text-base">{t('analysis.headers.socialOverview')}</h3>
                            </div>
                            <div onClick={handleTipClick} className="bg-white/60 backdrop-blur-md border border-white/50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold text-navy/60 shadow-sm w-full cursor-pointer active:scale-95 transition-transform select-none">
                                <SparklesIcon className="w-3 h-3 text-gold flex-shrink-0" />
                                <span className={`whitespace-pre-line text-left leading-snug transition-opacity duration-300 ${isTipFading ? 'opacity-0' : 'opacity-100'}`}>
                                    {tipsData['overall'][tipIndex]}
                                </span>
                            </div>
                        </div>
                    </div>
                    {!target.isSample && (
                      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex gap-3 mb-4 overflow-x-auto no-scrollbar items-center pb-2">
                            <label className={`${profileImages.length > 0 ? 'w-12 h-12 rounded-xl' : 'w-20 h-20 rounded-2xl'} bg-gold border-2 border-dashed border-[#D4C5A5] flex flex-col items-center justify-center gap-1 cursor-pointer flex-shrink-0`}>
                              <UploadIcon className="text-navy" />
                              {profileImages.length === 0 && <span className="text-[8px] font-bold text-navy/60 uppercase">{t('analysis.import')}</span>}
                              <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, setProfileImages)} />
                            </label>
                            {profileImages.map((img, idx) => (
                              <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                  <img src={img.data} className="w-full h-full object-cover" />
                                  <button onClick={() => removeImage(idx, setProfileImages)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 scale-75"><TrashIcon /></button>
                              </div>
                            ))}
                        </div>
                        <label className="text-[10px] font-bold text-navy uppercase tracking-widest block mb-2 pl-1">{t('analysis.labels.supplementary')}</label>
                        <textarea className="w-full p-4 bg-[#F5F2EA] rounded-2xl text-xs font-medium text-navy outline-none min-h-[100px] resize-none mb-4" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('analysis.contextPlaceholder.social')} />
                        <button onClick={submitOverall} disabled={!url && profileImages.length === 0} className="w-full py-4 bg-navy text-white font-bold rounded-2xl shadow-lg hover:bg-navy-light transition flex items-center justify-center gap-2 disabled:opacity-50"><BrainIcon className="w-4 h-4" /><span>{t('analysis.buttons.analyzeProfile')}</span></button>
                      </div>
                    )}
                    <div className="pt-6 border-t-2 border-dashed border-gray-200/60">
                      <div className="flex items-center gap-2 mb-4"><span className="text-lg">📜</span><h4 className="text-xs font-bold text-navy uppercase tracking-widest">{t('analysis.history.title')}</h4></div>
                      {socialHistory.length > 0 ? (
                          <div className="space-y-3">
                            {socialHistory.map((record, index) => {
                                const { dateStr, timeStr } = getFormattedDate(record.timestamp);
                                return (
                                  <button key={record.id || index} onClick={() => onViewSocialProfileDetails(record)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2.5 text-left">
                                      <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center gap-2 min-w-0">
                                              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm"><ChartIcon className="w-3.5 h-3.5" /></div>
                                              <h4 className="text-sm font-bold text-navy truncate">{record.handle || t('common.processing')}</h4>
                                          </div>
                                          <div className="text-right flex-shrink-0"><span className="text-[10px] font-bold text-navy/40 tabular-nums mr-1.5">{dateStr}</span><span className="text-[9px] text-navy/20 tabular-nums font-medium">{timeStr}</span></div>
                                      </div>
                                      <div className="flex flex-row items-center gap-1.5 w-full overflow-hidden whitespace-nowrap">
                                         {(record.reportTags || []).slice(0, 3).map((tag, idx) => (<span key={idx} className="text-[9px] font-bold text-blue-600/80 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 truncate">{tag.replace(/^#/, '')}</span>))}
                                      </div>
                                  </button>
                                );
                            })}
                          </div>
                      ) : (<div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200"><p className="text-xs text-gray-400 italic">{t('analysis.history.noSocial')}</p></div>)}
                    </div>
                </div>
              )}

              {activeTab === 'post' && (
                <div className="animate-slide-up space-y-4">
                    <div className="flex items-start gap-4 px-1">
                        <WireframeIcon type="moment" />
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 pt-0.5">
                            <div className="flex items-center gap-2"><ZapIcon className="w-4 h-4 text-gold-dark" /><h3 className="font-serif font-bold text-navy text-base">{t('analysis.headers.microDecode')}</h3></div>
                            <div onClick={handleTipClick} className="bg-white/60 backdrop-blur-md border border-white/50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold text-navy/60 shadow-sm w-full cursor-pointer active:scale-95 transition-transform select-none">
                                <SparklesIcon className="w-3 h-3 text-gold flex-shrink-0" />
                                <span className={`whitespace-pre-line text-left leading-snug transition-opacity duration-300 ${isTipFading ? 'opacity-0' : 'opacity-100'}`}>{tipsData['post'][tipIndex]}</span>
                            </div>
                        </div>
                    </div>
                    {!target.isSample && (
                      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex gap-3 mb-4 overflow-x-auto no-scrollbar items-center pb-2">
                            <label className={`${postImages.length > 0 ? 'w-12 h-12 rounded-xl' : 'w-20 h-20 rounded-2xl'} bg-gold border-2 border-dashed border-[#D4C5A5] flex flex-col items-center justify-center gap-1 cursor-pointer flex-shrink-0`}>
                              <UploadIcon className="text-navy" />
                              {postImages.length === 0 && <span className="text-[8px] font-bold text-navy/60 uppercase">{t('analysis.import')}</span>}
                              <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, setPostImages)} />
                            </label>
                            {postImages.map((img, idx) => (
                              <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                  <img src={img.data} className="w-full h-full object-cover" />
                                  <button onClick={() => removeImage(idx, setPostImages)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 scale-75"><TrashIcon /></button>
                              </div>
                            ))}
                        </div>
                        <label className="text-[10px] font-bold text-navy uppercase tracking-widest block mb-2 pl-1">{t('analysis.labels.contextCaption')}</label>
                        <textarea className="w-full p-4 bg-[#F5F2EA] rounded-2xl text-xs font-medium text-navy outline-none min-h-[100px] resize-none mb-4" value={postText} onChange={(e) => setPostText(e.target.value)} placeholder={t('analysis.contextPlaceholder.post')} />
                        <button onClick={submitPost} disabled={!postText && postImages.length === 0} className="w-full py-4 bg-navy text-white font-bold rounded-2xl shadow-lg hover:bg-navy-light transition flex items-center justify-center gap-2 disabled:opacity-50"><BrainIcon className="w-4 h-4" /><span>{t('analysis.buttons.decodeSubtext')}</span></button>
                      </div>
                    )}
                    <div className="pt-6 border-t-2 border-dashed border-gray-200/60">
                      <div className="flex items-center gap-2 mb-4"><span className="text-lg">📜</span><h4 className="text-xs font-bold text-navy uppercase tracking-widest">{t('analysis.history.title')}</h4></div>
                      {postHistory.length > 0 ? (
                          <div className="space-y-3">
                            {postHistory.map((record) => {
                                const { dateStr, timeStr } = getFormattedDate(record.timestamp);
                                return (
                                  <button key={record.id} onClick={() => onViewPostDetails(record)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2.5 text-left">
                                      <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center gap-2 min-w-0">
                                              <div className="w-6 h-6 rounded-full bg-gold/10 text-gold-dark flex items-center justify-center flex-shrink-0 shadow-sm"><ZapIcon className="w-3.5 h-3.5" /></div>
                                              <h4 className="text-sm font-bold text-navy truncate">{record.content ? `"${record.content}"` : t('smartAnalysis.examples.moment')}</h4>
                                          </div>
                                          <div className="text-right flex-shrink-0"><span className="text-[10px] font-bold text-navy/40 tabular-nums mr-1.5">{dateStr}</span><span className="text-[9px] text-navy/20 tabular-nums font-medium">{timeStr}</span></div>
                                      </div>
                                      <div className="flex flex-row items-center gap-1.5 w-full overflow-hidden whitespace-nowrap">
                                         {(record.tags || []).slice(0, 3).map((tag, idx) => (<span key={idx} className="text-[9px] font-bold text-gold-dark bg-gold/5 px-1.5 py-0.5 rounded border border-gold/10 truncate">{tag.replace(/^#/, '')}</span>))}
                                      </div>
                                  </button>
                                );
                            })}
                          </div>
                      ) : (<div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200"><p className="text-xs text-gray-400 italic">{t('analysis.history.noPost')}</p></div>)}
                    </div>
                </div>
              )}

              {activeTab === 'chatlog' && (
                <div className="animate-slide-up space-y-4">
                    <div className="flex items-start gap-4 px-1">
                        <WireframeIcon type="chat" />
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 pt-0.5">
                            <div className="flex items-center gap-2"><BrainIcon className="w-4 h-4 text-purple-500" /><h3 className="font-serif font-bold text-navy text-base">{t('analysis.headers.relStrategy')}</h3></div>
                            <div onClick={handleTipClick} className="bg-white/60 backdrop-blur-md border border-white/50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold text-navy/60 shadow-sm w-full cursor-pointer active:scale-95 transition-transform select-none">
                                <SparklesIcon className="w-3 h-3 text-gold flex-shrink-0" />
                                <span className={`whitespace-pre-line text-left leading-snug transition-opacity duration-300 ${isTipFading ? 'opacity-0' : 'opacity-100'}`}>{tipsData['chatlog'][tipIndex]}</span>
                            </div>
                        </div>
                    </div>
                    {!target.isSample && (
                      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex gap-3 mb-4 overflow-x-auto no-scrollbar items-center pb-2">
                            <label className={`${chatImages.length > 0 ? 'w-12 h-12 rounded-xl' : 'w-20 h-20 rounded-2xl'} bg-gold border-2 border-dashed border-[#D4C5A5] flex flex-col items-center justify-center gap-1 cursor-pointer flex-shrink-0`}>
                              <UploadIcon className="text-navy" />
                              {chatImages.length === 0 && <span className="text-[8px] font-bold text-navy/60 uppercase">{t('analysis.import')}</span>}
                              <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, setChatImages)} />
                            </label>
                            {chatImages.map((img, idx) => (
                              <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                  <img src={img.data} className="w-full h-full object-cover" />
                                  <button onClick={() => removeImage(idx, setChatImages)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 scale-75"><TrashIcon /></button>
                              </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="relative">
                              <select className="w-full p-3 bg-[#F5F2EA] rounded-xl text-xs font-bold text-navy outline-none appearance-none cursor-pointer" value={chatGoal} onChange={(e) => setChatGoal(e.target.value)}>
                                  <option value="" disabled hidden>{t('analysis.goals.select')}</option>
                                  <option value={ConsultationGoal.GET_DATE}>{t('analysis.goals.iceBreaker')}</option>
                                  <option value={ConsultationGoal.HEAT_UP}>{t('analysis.goals.heatUp')}</option>
                                  <option value={ConsultationGoal.RECOVERY}>{t('analysis.goals.recovery')}</option>
                                  <option value={ConsultationGoal.MAINTAIN}>{t('analysis.goals.maintain')}</option>
                              </select>
                              <ChevronRight className="rotate-90 w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <input className="w-full p-3 bg-[#F5F2EA] rounded-xl text-xs font-bold text-navy outline-none" placeholder={t('analysis.contextPlaceholder.duration')} value={chatDuration} onChange={(e) => setChatDuration(e.target.value)} />
                        </div>
                        <label className="text-[10px] font-bold text-navy uppercase tracking-widest block mb-2 pl-1">{t('analysis.labels.contextLogs')}</label>
                        <textarea className="w-full p-4 bg-[#F5F2EA] rounded-2xl text-xs font-medium text-navy outline-none min-h-[100px] resize-none mb-4" value={chatLogsText} onChange={(e) => setChatLogsText(e.target.value)} placeholder={t('analysis.contextPlaceholder.chat')} />
                        <button onClick={submitChatlog} disabled={(!chatGoal && !chatLogsText && chatImages.length === 0)} className="w-full py-4 bg-navy text-white font-bold rounded-2xl shadow-lg hover:bg-navy-light transition flex items-center justify-center gap-2 disabled:opacity-50"><BrainIcon className="w-4 h-4" /><span>{t('analysis.buttons.analyzeChat')}</span></button>
                      </div>
                    )}
                    <div className="pt-6 border-t-2 border-dashed border-gray-200/60">
                      <div className="flex items-center gap-2 mb-4"><span className="text-lg">📜</span><h4 className="text-xs font-bold text-navy uppercase tracking-widest">{t('analysis.history.title')}</h4></div>
                      {consultHistory.length > 0 ? (
                          <div className="space-y-3">
                            {consultHistory.map((report) => {
                                const { dateStr, timeStr } = getFormattedDate(report.generatedAt);
                                return (
                                  <button key={report.id} onClick={() => onViewConsultDetails(report)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2.5 text-left">
                                      <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center gap-2 min-w-0">
                                              <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm"><BrainIcon className="w-3.5 h-3.5" /></div>
                                              <h4 className="text-sm font-bold text-navy truncate">{getChatGoalLabel(report.goalContext || '')}</h4>
                                          </div>
                                          <div className="text-right flex-shrink-0"><span className="text-[10px] font-bold text-navy/40 tabular-nums mr-1.5">{dateStr}</span><span className="text-[9px] text-navy/20 tabular-nums font-medium">{timeStr}</span></div>
                                      </div>
                                      <div className="flex flex-row items-center gap-1.5 w-full overflow-hidden whitespace-nowrap">
                                         {(report.tags || []).slice(0, 3).map((tag, idx) => (<span key={idx} className="text-[9px] font-bold text-purple-600/80 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 truncate">{tag.replace(/^#/, '')}</span>))}
                                      </div>
                                  </button>
                                );
                            })}
                          </div>
                      ) : (<div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200"><p className="text-xs text-gray-400 italic">{t('analysis.history.noChat')}</p></div>)}
                    </div>
                </div>
              )}
              {target.isSample && (
                 <div className="mt-8 pt-4 border-t border-gray-100">
                    <div className="flex flex-col gap-3">
                       <button onClick={onCreateProfile} className="w-full bg-[#F5F2EA] border-2 border-dashed border-[#D4C5A5] text-navy font-bold py-4 rounded-2xl hover:bg-white transition flex items-center justify-center gap-2"><PlusIcon /><span>{t('smartAnalysis.newProfile')}</span></button>
                       <button onClick={onSmartAnalyze} className="w-full bg-navy text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-navy-light transition flex items-center justify-center gap-2"><SparklesIcon className="w-4 h-4 text-gold" /><span>{t('profile.smartAnalysis')}</span></button>
                    </div>
                 </div>
              )}
          </div>
       </div>
     </div>
  );
};

export default AnalysisPage;
