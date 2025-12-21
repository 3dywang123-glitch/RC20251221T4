
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { TargetProfile } from '../types';
import { UploadIcon, BrainIcon, EditIcon, ChartIcon, ChevronRight, SparklesIcon, BookIcon, ZapIcon, PlusIcon, TrashIcon, CheckCircleIcon } from '../componentsv2/Icons';
import { getAvatarSrc } from '../utils';
import * as Gemini from '../servicesv2/geminiService';
import { compressImage } from '../servicesv2/geminiService';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  target: TargetProfile | null;
  onUpdateTarget: (updates: Partial<TargetProfile>) => void;
  onDeleteTarget: (id: string) => void;
  onAnalyze: (supplementaryInfo?: string, customImages?: string[]) => void;
  onNavigate: (view: string) => void;
  isNewProfile?: boolean;
  onProfileSaved?: () => void;
  onSmartImport: () => void;
  onSelectHistoryItem?: (type: 'consult' | 'post' | 'social', item: any) => void;
}

const ProfilePage: React.FC<Props> = ({ 
  target, 
  onUpdateTarget, 
  onDeleteTarget, 
  onAnalyze, 
  onNavigate, 
  isNewProfile = false,
  onProfileSaved,
  onSmartImport,
  onSelectHistoryItem
}) => {
  const { t, language } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalyzingAvatar, setIsAnalyzingAvatar] = useState(false);
  
  // Local state for editing
  const [editForm, setEditForm] = useState<TargetProfile | null>(null);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // New State for Personality Input Modal
  const [isPersonalityModalOpen, setIsPersonalityModalOpen] = useState(false);
  const [supplementaryInfo, setSupplementaryInfo] = useState('');
  
  // State for newly uploaded context images in the modal
  const [newSocialImages, setNewSocialImages] = useState<string[]>([]);
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [newChatImages, setNewChatImages] = useState<string[]>([]);

  // Tips State - USING TIPS AREA CONTENT
  const profileTips = useMemo(() => t('tips.personality') as string[], [t]);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [isTipFading, setIsTipFading] = useState(false);
  const tipIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isEditing && target) {
      setEditForm({ ...target });
    }
  }, [isEditing, target]);

  useEffect(() => {
    if (isNewProfile) {
      setIsEditing(true);
    }
  }, [isNewProfile]);

  const advanceTip = useCallback(() => {
    setIsTipFading(true);
    setTimeout(() => {
        setActiveTipIndex(prev => (prev + 1) % profileTips.length);
        setIsTipFading(false);
    }, 300);
  }, [profileTips.length]);

  const startTipTimer = useCallback(() => {
    if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current);
    }
    tipIntervalRef.current = window.setInterval(() => {
        advanceTip();
    }, 7000);
  }, [advanceTip]);

  // Tip Rotation
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

  // Unified History List (Memoized)
  const historyItems = useMemo(() => {
    if (!target) return [];
    const items: any[] = [];
    if (target.socialAnalysisHistory) {
        items.push(...target.socialAnalysisHistory.map(h => ({ ...h, type: 'social', date: h.timestamp })));
    }
    if (target.postAnalysisHistory) {
        items.push(...target.postAnalysisHistory.map(p => ({ ...p, type: 'post', date: p.timestamp })));
    }
    if (target.consultationHistory) {
        items.push(...target.consultationHistory.map(c => ({ ...c, type: 'consult', date: c.generatedAt })));
    }
    // Sort descending by date (newest first)
    return items.sort((a, b) => b.date - a.date);
  }, [target]);

  if (!target) return null;
  const report = target.personalityReport;
  const hasReport = !!report;

  // Helper to extract the first section of the summary (The Archetype)
  const getArchetypeSummary = (summary?: string) => {
    if (!summary) return undefined;
    // Extract text after "### 1. The Archetype" and before "### 2."
    const parts = summary.split(/###\s*2\./);
    let firstPart = parts[0];
    
    // Remove the header line "### 1. ..."
    firstPart = firstPart.replace(/###\s*1\..*(\n|$)/, '').trim();
    
    return firstPart;
  };

  // Render text with bold support and remove quotes
  const renderSummaryText = (text?: string) => {
    if (!text) return <span className="italic opacity-40">{t('profile.noSummary')}</span>;
    
    // Clean quotes from the beginning and end if they exist on the whole block
    let cleanText = text.trim();
    if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
        cleanText = cleanText.slice(1, -1);
    }

    return cleanText.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        return <span key={idx}>{part}</span>;
    });
  };

  const handleAvatarAnalysis = async () => {
    if (!target.avatarB64) return;
    setIsAnalyzingAvatar(true);
    try {
      const insight = await Gemini.analyzeAvatar(target.name, target.avatarB64);
      onUpdateTarget({ avatarAnalysis: insight });
    } catch (e) {
      console.error(e);
      alert(t('app.alerts.avatarAnalysisFailed'));
    } finally {
      setIsAnalyzingAvatar(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    onUpdateTarget(editForm);
    setIsEditing(false);
    if (onProfileSaved) onProfileSaved();
  };

  const updateEditForm = (updates: Partial<TargetProfile>) => {
    if (!editForm) return;
    setEditForm({ ...editForm, ...updates });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editForm) return;

    setIsProcessingImages(true);
    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            let b64 = reader.result as string;
            b64 = await compressImage(b64, 800); 
            updateEditForm({ avatarB64: b64 });
            setIsProcessingImages(false);
        };
        reader.readAsDataURL(file);
    } catch (e) {
        console.error(e);
        setIsProcessingImages(false);
    }
  };

  // Generic helper for uploading context images
  const handleContextUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    const promises = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          let b64 = reader.result as string;
          try {
             // Compress context images (800px max, moderate quality)
             b64 = await compressImage(b64, 800, 0.7, 500);
          } catch(err) { console.error("Compression error", err); }
          resolve(b64);
        };
        reader.readAsDataURL(file as Blob);
      });
    });

    try {
       const results = await Promise.all(promises);
       setter(prev => [...prev, ...results]);
    } catch (e) {
       console.error("Context upload failed", e);
    } finally {
       setIsProcessingImages(false);
       e.target.value = ''; // Reset input
    }
  };

  const removeContextImage = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
     setter(prev => prev.filter((_, i) => i !== index));
  };

  // Step 1: Open Modal directly
  const handleGenerateReportClick = () => {
    if (target.isSample) return; // Prevent for sample
    // Reset modal state
    setNewSocialImages([]);
    setNewPostImages([]);
    setNewChatImages([]);
    setSupplementaryInfo('');
    setIsPersonalityModalOpen(true);
  };

  // Step 2: Actually trigger analysis from modal
  const handleConfirmAnalysis = () => {
    setIsPersonalityModalOpen(false);
    // Aggregate all new custom images
    const allCustomImages = [...newSocialImages, ...newPostImages, ...newChatImages];
    onAnalyze(supplementaryInfo, allCustomImages);
  };

  // Helper to extract images from history for the modal
  const getHistoryImages = () => {
    const socialImages = target.socialAnalysisHistory?.flatMap(h => h.inputImages || []) || [];
    const postImages = target.postAnalysisHistory?.flatMap(p => p.images || (p.imageB64 ? [p.imageB64] : [])) || [];
    const chatImages = target.consultationHistory?.flatMap(c => c.archivedInput?.images || []) || [];
    return { socialImages, postImages, chatImages };
  };

  const { socialImages, postImages, chatImages } = getHistoryImages();

  // Data availability check for "Intelligence Sources"
  const hasSocialReport = target.socialAnalysisHistory && target.socialAnalysisHistory.length > 0;
  const hasPostReport = target.postAnalysisHistory && target.postAnalysisHistory.length > 0;
  const hasConsultReport = target.consultationHistory && target.consultationHistory.length > 0;

  // --- Modal for Personality Input ---
  const renderPersonalityInputModal = () => {
    if (!isPersonalityModalOpen) return null;

    const hasSocialImages = newSocialImages.length > 0 || socialImages.length > 0;
    const hasPostImages = newPostImages.length > 0 || postImages.length > 0;
    const hasChatImages = newChatImages.length > 0 || chatImages.length > 0;

    return (
      <div className="fixed inset-0 z-[150] bg-cream flex flex-col animate-slide-up">
         {/* Modal Header */}
         <div className="bg-white/90 backdrop-blur-md p-4 shadow-sm flex items-center justify-between gap-3 sticky top-0 z-50 border-b border-gray-100 flex-shrink-0">
            <button onClick={() => setIsPersonalityModalOpen(false)} className="text-sm font-bold text-navy/50 hover:text-navy transition">
               {t('common.cancel')}
            </button>
            <h2 className="text-base font-serif font-bold text-navy">{t('profile.contextAssembly')}</h2>
            <div className="w-10"></div>
         </div>

         <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-5 bg-cream">
            
            {/* Target Header - Compact */}
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
               <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                  {target.avatarB64 ? (
                     <img src={getAvatarSrc(target.avatarB64)} className="w-full h-full object-cover" alt="avatar" width={56} height={56} />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-xl text-navy/30">?</div>
                  )}
               </div>
               <div>
                  <h1 className="text-lg font-serif font-bold text-navy leading-tight">{target.name}</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-xs text-navy/60 font-medium">{target.occupation}</span>
                     {target.age && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-bold">{target.age}</span>}
                  </div>
               </div>
            </div>

            {/* NEW: Intelligence Sources Status */}
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-2">
               <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest flex items-center gap-2">
                  <BrainIcon className="w-3 h-3 text-gold" /> Connected Intelligence
               </h4>
               <div className="space-y-1.5">
                  <div className={`flex items-center gap-2 text-[10px] ${hasSocialReport ? 'text-green-700' : 'text-gray-400'}`}>
                     <CheckCircleIcon className={`w-3.5 h-3.5 ${hasSocialReport ? 'text-green-500' : 'text-gray-200'}`} />
                     <span>Latest Social Profile Report ({hasSocialReport ? 'Ready' : 'Missing'})</span>
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] ${hasPostReport ? 'text-green-700' : 'text-gray-400'}`}>
                     <CheckCircleIcon className={`w-3.5 h-3.5 ${hasPostReport ? 'text-green-500' : 'text-gray-200'}`} />
                     <span>Recent Post Analysis ({hasPostReport ? 'Ready' : 'Missing'})</span>
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] ${hasConsultReport ? 'text-green-700' : 'text-gray-400'}`}>
                     <CheckCircleIcon className={`w-3.5 h-3.5 ${hasConsultReport ? 'text-green-500' : 'text-gray-200'}`} />
                     <span>Consultation History ({hasConsultReport ? 'Ready' : 'Missing'})</span>
                  </div>
               </div>
            </div>

            {/* Image Categories with Upload - Compact */}
            <div className="space-y-4">
               
               {/* 1. Social Media Overall */}
               <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gold-dark uppercase tracking-widest flex items-center gap-2">
                     <ChartIcon className="w-3 h-3" /> {t('profile.socialOverall')}
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-1 min-h-[5rem] items-center">
                     {/* Upload Button */}
                     <label className={`flex-shrink-0 ${hasSocialImages ? 'w-12' : 'w-20'} h-20 bg-[#F5F2EA] rounded-xl border-2 border-dashed border-[#D4C5A5] flex flex-col items-center justify-center cursor-pointer hover:bg-[#EBE5D9] transition gap-1 group`}>
                        <div className="bg-white p-1.5 rounded-full shadow-sm group-hover:scale-110 transition"><PlusIcon className="w-4 h-4" /></div>
                        {!hasSocialImages && <span className="text-[8px] font-bold text-navy/50 uppercase">Add</span>}
                        <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleContextUpload(e, setNewSocialImages)} />
                     </label>

                     {/* New Images */}
                     {newSocialImages.map((img, i) => (
                        <div key={`new-social-${i}`} className="relative flex-shrink-0 group">
                           <img src={img} className="h-20 w-auto rounded-lg border-2 border-gold shadow-md" alt={`new-social-${i}`} />
                           <div className="absolute top-1 right-1 bg-gold text-white text-[6px] font-bold px-1 rounded-full shadow-sm">NEW</div>
                           <button onClick={() => removeContextImage(i, setNewSocialImages)} className="absolute top-1 left-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition scale-75"><TrashIcon /></button>
                        </div>
                     ))}

                     {/* Historical Images */}
                     {socialImages.map((img, i) => (
                        <img key={`hist-social-${i}`} src={img} className="h-20 w-auto rounded-lg border-2 border-white shadow-md opacity-80 hover:opacity-100 transition" alt={`social-${i}`} />
                     ))}
                     
                     {!hasSocialImages && (
                        <span className="text-[10px] text-gray-400 italic pl-1">{t('profile.noHistoryImage')}</span>
                     )}
                  </div>
               </div>

               {/* 2. Single Post Highlights */}
               <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gold-dark uppercase tracking-widest flex items-center gap-2">
                     <ZapIcon className="w-3 h-3" /> {t('profile.singlePost')}
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-1 min-h-[5rem] items-center">
                     {/* Upload Button */}
                     <label className={`flex-shrink-0 ${hasPostImages ? 'w-12' : 'w-20'} h-20 bg-[#F5F2EA] rounded-xl border-2 border-dashed border-[#D4C5A5] flex flex-col items-center justify-center cursor-pointer hover:bg-[#EBE5D9] transition gap-1 group`}>
                        <div className="bg-white p-1.5 rounded-full shadow-sm group-hover:scale-110 transition"><PlusIcon className="w-4 h-4" /></div>
                        {!hasPostImages && <span className="text-[8px] font-bold text-navy/50 uppercase">Add</span>}
                        <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleContextUpload(e, setNewPostImages)} />
                     </label>

                     {/* New Images */}
                     {newPostImages.map((img, i) => (
                        <div key={`new-post-${i}`} className="relative flex-shrink-0 group">
                           <img src={img} className="h-20 w-auto rounded-lg border-2 border-gold shadow-md" alt={`new-post-${i}`} />
                           <div className="absolute top-1 right-1 bg-gold text-white text-[6px] font-bold px-1 rounded-full shadow-sm">NEW</div>
                           <button onClick={() => removeContextImage(i, setNewPostImages)} className="absolute top-1 left-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition scale-75"><TrashIcon /></button>
                        </div>
                     ))}

                     {/* Historical Images */}
                     {postImages.map((img, i) => (
                        <img key={`hist-post-${i}`} src={img} className="h-20 w-auto rounded-lg border-2 border-white shadow-md opacity-80 hover:opacity-100 transition" alt={`post-${i}`} />
                     ))}

                     {!hasPostImages && (
                        <span className="text-[10px] text-gray-400 italic pl-1">{t('profile.noHistoryText')}</span>
                     )}
                  </div>
               </div>

               {/* 3. Chat Logs */}
               <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gold-dark uppercase tracking-widest flex items-center gap-2">
                     <BrainIcon className="w-3 h-3" /> {t('profile.chatLogs')}
                  </h4>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 min-h-[5rem] items-center">
                     {/* Upload Button */}
                     <label className={`flex-shrink-0 ${hasChatImages ? 'w-12' : 'w-20'} h-20 bg-[#F5F2EA] rounded-xl border-2 border-dashed border-[#D4C5A5] flex flex-col items-center justify-center cursor-pointer hover:bg-[#EBE5D9] transition gap-1 group`}>
                        <div className="bg-white p-1.5 rounded-full shadow-sm group-hover:scale-110 transition"><PlusIcon className="w-4 h-4" /></div>
                        {!hasChatImages && <span className="text-[8px] font-bold text-navy/50 uppercase">Add</span>}
                        <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleContextUpload(e, setNewChatImages)} />
                     </label>

                     {/* New Images */}
                     {newChatImages.map((img, i) => (
                        <div key={`new-chat-${i}`} className="relative flex-shrink-0 group">
                           <img src={img} className="h-20 w-auto rounded-lg border-2 border-gold shadow-md" alt={`new-chat-${i}`} />
                           <div className="absolute top-1 right-1 bg-gold text-white text-[6px] font-bold px-1 rounded-full shadow-sm">NEW</div>
                           <button onClick={() => removeContextImage(i, setNewChatImages)} className="absolute top-1 left-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition scale-75"><TrashIcon /></button>
                        </div>
                     ))}

                     {/* Historical Images */}
                     {chatImages.map((img, i) => (
                        <img key={`hist-chat-${i}`} src={img} className="h-20 w-auto rounded-lg border-2 border-white shadow-md opacity-80 hover:opacity-100 transition" alt={`chat-${i}`} />
                     ))}

                     {!hasChatImages && (
                        <span className="text-[10px] text-gray-400 italic pl-1">{t('profile.noHistoryText')}</span>
                     )}
                  </div>
               </div>
            </div>

            {/* Supplementary Info */}
            <div className="space-y-1.5 pt-1">
               <label className="text-[10px] font-bold text-navy uppercase tracking-widest block pl-1">{t('profile.supplementary')}</label>
               <div className="relative">
                  <textarea 
                     className="w-full p-3 bg-white rounded-xl text-xs font-medium text-navy border border-gray-200 focus:border-gold/50 focus:shadow-md outline-none resize-none h-24 transition leading-relaxed placeholder-gray-300"
                     placeholder={t('profile.supplementaryPlaceholder')}
                     value={supplementaryInfo}
                     onChange={(e) => setSupplementaryInfo(e.target.value)}
                  />
               </div>
            </div>

            <button 
               onClick={handleConfirmAnalysis}
               className="w-full py-3.5 bg-navy text-white rounded-2xl font-bold shadow-xl shadow-navy/20 hover:bg-navy-light active:scale-[0.98] transition flex items-center justify-center gap-2 group mt-2"
            >
               <div className="w-6 h-6 bg-gold text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-md border-2 border-navy">
                  <BrainIcon className="w-3.5 h-3.5" />
               </div>
               <span className="text-xs font-serif uppercase tracking-wide">{t('profile.generateDeepProfile')}</span>
            </button>

         </div>
      </div>
    );
  };

  // --- Modal for Editing ---
  const renderEditModal = () => {
    if (!editForm) return null;
    const title = isNewProfile ? t('profile.add') : t('profile.edit');
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-6 animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-2xl font-serif font-bold text-navy">{title}</h3>
               <button 
                 onClick={() => setIsEditing(false)} 
                 className="w-8 h-8 bg-gray-50 rounded-full font-bold text-navy/50 flex items-center justify-center hover:bg-gray-100 transition"
               >
                 ✕
               </button>
            </div>
            
            <div className="space-y-5">
               <div className="flex items-center gap-5">
                  <label className="relative w-24 h-24 flex-shrink-0 cursor-pointer group">
                     <div className="w-24 h-24 rounded-full bg-gray-50 overflow-hidden border-2 border-white shadow-lg group-hover:border-gold/30 transition-all">
                        {editForm.avatarB64 ? (
                           <img src={getAvatarSrc(editForm.avatarB64)} className="w-full h-full object-cover" alt="avatar" width={96} height={96} />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-3xl text-navy/20 bg-gray-100">?</div>
                        )}
                     </div>
                     <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>

                  <div className="flex-1 flex flex-col justify-center gap-3">
                     <label className="self-start inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-navy shadow-sm cursor-pointer hover:bg-gray-50 transition active:scale-95">
                        <UploadIcon /> 
                        <span>{t('profile.uploadAvatar')}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                     </label>
                     <input 
                        value={editForm.name} 
                        onChange={(e) => updateEditForm({ name: e.target.value })}
                        placeholder={t('profile.enterName')}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-navy/20 transition text-sm text-navy font-bold placeholder-gray-400"
                     />
                  </div>
               </div>
  
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-xs font-bold text-gold-dark uppercase tracking-widest block mb-2">{t('profile.occupation')}</label>
                   <input 
                     value={editForm.occupation || ''} 
                     onChange={(e) => updateEditForm({ occupation: e.target.value })}
                     className="w-full p-3 bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-navy/20 transition text-sm text-navy font-medium"
                   />
                 </div>
                 <div className="w-1/3">
                   <label className="text-xs font-bold text-gold-dark uppercase tracking-widest block mb-2">{t('profile.gender')}</label>
                   <select
                      value={editForm.gender || 'Female'}
                      onChange={(e) => updateEditForm({ gender: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-navy/20 transition text-sm text-navy font-medium appearance-none cursor-pointer"
                   >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Other</option>
                   </select>
                 </div>
               </div>

               <div>
                 <label className="text-xs font-bold text-gold-dark uppercase tracking-widest block mb-2">{t('profile.age')}</label>
                 <input 
                    placeholder="e.g. 25"
                    value={editForm.age || ''} 
                    onChange={(e) => updateEditForm({ age: e.target.value })}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-navy/20 transition text-sm text-navy font-medium"
                  />
               </div>
               <div>
                 <label className="text-xs font-bold text-gold-dark uppercase tracking-widest block mb-2">{t('profile.bio')}</label>
                 <textarea 
                   value={editForm.bio || ''} 
                   onChange={(e) => updateEditForm({ bio: e.target.value })}
                   className="w-full p-3 bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-navy/20 transition text-sm text-navy font-medium resize-none leading-relaxed"
                   rows={4}
                 />
               </div>
            </div>
  
            <div className="flex gap-4 pt-4">
              {!isNewProfile && (
                <button 
                  onClick={() => {
                     onDeleteTarget(target.id);
                     setIsEditing(false);
                  }}
                  className="flex-1 py-3.5 bg-red-50 text-red-500 font-bold rounded-xl text-sm border border-red-100 hover:bg-red-100 transition"
                >
                  {t('profile.deleteProfile')}
                </button>
              )}
              <button 
                onClick={handleSaveEdit}
                className="flex-[2] py-3.5 bg-navy text-white font-bold rounded-xl text-sm shadow-lg shadow-navy/20 hover:bg-navy-light transition active:scale-95"
              >
                {t('profile.saveProfile')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      
      {isProcessingImages && (
        <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px] flex items-center justify-center cursor-wait">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce-slight">
              <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-navy">{t('profile.processingImages')}</span>
          </div>
        </div>
      )}

      {isEditing && renderEditModal()}
      {renderPersonalityInputModal()}

      {/* Slogan - Full width at top */}
      <div className="flex-shrink-0 bg-cream pt-1.5 px-6 z-20 relative">
         <div className="flex flex-col items-center justify-center animate-fade-in">
            <h2 className="text-xs sm:text-lg font-handwriting font-medium tracking-wide text-navy/60 mb-1 text-center relative z-10 whitespace-nowrap">
               {t('profile.slogan')}
            </h2>
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent relative z-10"></div>
         </div>
      </div>

      <div className="px-6">
        {/* --- Header Section --- */}
        <div className="flex items-start justify-between mb-6 pt-2">
           <div className="flex items-center gap-4">
              <div className="relative">
                 <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-md">
                    {target.avatarB64 ? (
                       <img src={getAvatarSrc(target.avatarB64)} className="w-full h-full object-cover" alt="avatar" width={64} height={64} />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-xl text-navy/30">?</div>
                    )}
                 </div>
                 <button 
                    onClick={handleAvatarAnalysis}
                    disabled={isAnalyzingAvatar || target.isSample}
                    className={`absolute -bottom-1 -right-1 bg-white text-navy text-[10px] p-1.5 rounded-full shadow-sm border border-gray-100 active:scale-90 transition ${target.isSample ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                    {isAnalyzingAvatar ? <div className="w-3 h-3 border-2 border-navy/20 border-t-navy rounded-full animate-spin"></div> : <SparklesIcon className="w-3 h-3 text-gold" />}
                 </button>
              </div>
              
              <div>
                 <h1 className="text-2xl font-serif font-bold text-navy leading-tight flex items-center gap-2">
                    {target.name}
                    {target.isSample && <span className="text-[9px] bg-gold/10 text-gold-dark border border-gold/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">{t('profile.sample')}</span>}
                 </h1>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-navy/60 font-medium">{target.occupation}</span>
                    {target.age && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-bold">{target.age}</span>}
                 </div>
              </div>
           </div>

           <div className="flex gap-2">
              <button 
                 onClick={() => setIsEditing(true)}
                 className="p-3 bg-white text-navy rounded-xl shadow-sm border border-gray-100 hover:border-gold/30 active:scale-95 transition"
              >
                 <EditIcon />
              </button>
              <button 
                 onClick={() => onNavigate('profile-records')}
                 className="p-3 bg-white text-navy/60 rounded-xl shadow-sm border border-gray-100 hover:border-gold/30 active:scale-95 transition"
              >
                 <BookIcon />
              </button>
           </div>
        </div>

        {target.avatarAnalysis && (
           <div className="mb-6 bg-white/50 p-3 rounded-xl border border-gold/20 text-xs text-navy/80 italic animate-fade-in">
              "{target.avatarAnalysis}"
           </div>
        )}

        {/* --- 1. PERSONALITY ACTION SECTION --- */}
        <div className="mb-6 space-y-4">
           
           {/* The Generate/Regenerate Button - Disabled for Sample */}
           {!target.isSample && (
             <button 
                onClick={handleGenerateReportClick}
                className={`w-full py-4 rounded-3xl font-bold shadow-md transition flex items-center justify-center gap-2 group ${hasReport ? 'bg-white border-2 border-navy text-navy hover:bg-gray-50' : 'bg-navy text-white shadow-navy/20 hover:bg-navy-light active:scale-[0.98]'}`}
             >
                <BrainIcon className={`w-5 h-5 ${hasReport ? 'text-navy' : 'text-gold'}`} />
                <span>{hasReport ? t('profile.regenerateReport') : t('profile.generateReport')}</span>
             </button>
           )}

           {/* General Summary (Clickable Entry Point to Report) */}
           <div 
              onClick={() => hasReport && onNavigate('personality')}
              className={`p-5 rounded-3xl shadow-sm border relative group text-left ${hasReport ? 'cursor-pointer active:scale-[0.99] transition hover:shadow-md' : ''} bg-navy border-navy`}
           >
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-xs font-bold text-gold/80 uppercase tracking-widest flex items-center gap-2">
                    {t('profile.generalSummary')}
                 </h3>
                 {hasReport && (
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold bg-gold text-navy px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">{t('profile.viewReport')}</span>
                       <ChevronRight className="w-4 h-4 text-gold group-hover:text-white transition" />
                    </div>
                 )}
              </div>
              
              <div className="text-sm text-white/90 leading-relaxed font-medium line-clamp-4 whitespace-pre-wrap">
                 {renderSummaryText(getArchetypeSummary(target.personalityReport?.summary) || target.generalSummary || target.bio)}
              </div>
           </div>

           {/* Tips Box (Updated) */}
           <div className="flex justify-center animate-fade-in pt-1 cursor-pointer active:scale-95 transition-transform" onClick={handleTipClick}>
              <div className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-md border border-gold/30 shadow-sm px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold text-navy/70 max-w-[95%]">
                 <SparklesIcon className="w-3 h-3 text-gold flex-shrink-0" />
                 <span className={`transition-opacity duration-300 text-center whitespace-pre-line md:whitespace-normal ${isTipFading ? 'opacity-0' : 'opacity-100'}`}>
                    {profileTips[activeTipIndex]}
                 </span>
              </div>
           </div>
        </div>

        {/* --- 2. MIDDLE (ANALYSIS) & RIGHT (SIMULATE) GRID --- */}
        <div className="grid grid-cols-2 gap-3 mb-8">
           
           {/* Left Column: Analysis Tools */}
           <div className="flex flex-col gap-3">
              <button 
                 onClick={() => {
                    if (target.isSample) {
                       onNavigate('analysis'); 
                    } else {
                       onSmartImport();
                    }
                 }}
                 className="flex-1 bg-navy p-3 rounded-2xl shadow-lg shadow-navy/10 flex flex-row items-center gap-3 active:scale-95 transition text-left group min-h-[4.2rem]"
              >
                 <div className="w-9 h-9 bg-gold text-white rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                    <SparklesIcon className="w-4 h-4" />
                 </div>
                 <div>
                    <div className="text-xs font-bold text-white leading-tight">{t('profile.smartAnalysis')}</div>
                    <div className="text-[9px] text-white/60 leading-tight mt-0.5">{t('profile.smartAnalysisDesc')}</div>
                 </div>
              </button>

              <button 
                 onClick={() => onNavigate('analysis')}
                 className="flex-1 bg-navy p-3 rounded-2xl shadow-lg shadow-navy/10 flex flex-row items-center gap-3 active:scale-95 transition text-left group min-h-[4.2rem]"
              >
                 <div className="w-9 h-9 bg-white/10 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <ChartIcon className="w-4 h-4" />
                 </div>
                 <div>
                    <div className="text-xs font-bold text-white leading-tight">{t('profile.manualAnalysis')}</div>
                    <div className="text-[9px] text-white/60 leading-tight mt-0.5">{t('profile.manualAnalysisDesc')}</div>
                 </div>
              </button>
           </div>

           {/* Right Column: Simulate (Tall Card) */}
           <button 
              onClick={() => onNavigate('simulate')}
              className="bg-navy p-3 rounded-2xl shadow-lg shadow-navy/10 flex flex-col justify-center active:scale-95 transition text-left group relative overflow-hidden h-full min-h-[9.15rem]"
           >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gold/10 rounded-full blur-xl -mr-5 -mt-5"></div>
              
              <div className="relative z-10 flex flex-row items-center gap-3 pl-1">
                 <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                    <span className="text-xl">💬</span>
                 </div>
                 <div>
                    <div className="text-sm font-bold text-white font-serif leading-tight">{t('profile.simulate')}</div>
                    <div className="flex items-center gap-1 text-[8px] font-bold text-gold uppercase tracking-wide mt-1">
                       {t('profile.aiPersona')} <ChevronRight className="w-2.5 h-2.5" />
                    </div>
                 </div>
              </div>
           </button>

        </div>

        {/* --- 3. HISTORY REPORTS (Footer) --- */}
        <div className="pt-4 border-t border-gray-100">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">{t('profile.historyReports')}</h3>
           
           <div className="flex flex-col gap-3 pb-8">
              {historyItems.map((item: any) => {
                 let typeIcon, typeColor, typeTitle, typeTags: string[] = [];
                 
                 if (item.type === 'social') {
                    typeIcon = <ChartIcon className="w-4 h-4" />;
                    typeColor = "blue";
                    typeTitle = t('reports.types.social');
                    typeTags = item.reportTags || [];
                 } else if (item.type === 'post') {
                    typeIcon = <ZapIcon className="w-4 h-4" />;
                    typeColor = "gold";
                    typeTitle = t('reports.types.post');
                    typeTags = item.tags || [];
                 } else if (item.type === 'consult') {
                    typeIcon = <BrainIcon className="w-4 h-4" />;
                    typeColor = "purple";
                    typeTitle = t('reports.types.chat');
                    typeTags = item.tags || [];
                 }

                 const dateObj = new Date(item.date);
                 const localeCode = language === 'en' ? 'en-US' : 'zh-CN';
                 const dateStr = dateObj.toLocaleDateString(localeCode, { month: 'short', day: 'numeric' });
                 const timeStr = dateObj.toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit', hour12: false });

                 return (
                    <button 
                       key={`${item.type}-${item.id}`} 
                       onClick={() => {
                          if (item.type === 'consult') onSelectHistoryItem?.('consult', item);
                          if (item.type === 'post') onSelectHistoryItem?.('post', item);
                          if (item.type === 'social') onSelectHistoryItem?.('social', item);
                       }} 
                       className={`w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition hover:border-${typeColor}-200 group flex flex-col gap-2.5 text-left`}
                    >
                        {/* Row 1: Icon + Title + Date/Time */}
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 rounded-full bg-${typeColor}-50 text-${typeColor}-600 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                    {/* Fix: Explicit type cast for React.cloneElement to include className */}
                                    {React.cloneElement(typeIcon as React.ReactElement<{ className?: string }>, { className: 'w-3.5 h-3.5' })}
                                </div>
                                <h4 className="text-sm font-bold text-navy truncate group-hover:text-navy-light">{typeTitle}</h4>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className="text-[10px] font-bold text-navy/40 tabular-nums mr-1.5">{dateStr}</span>
                                <span className="text-[9px] text-navy/20 tabular-nums font-medium">{timeStr}</span>
                            </div>
                        </div>
                        
                        {/* Row 2: Strictly Single Line Tags - Max 3 */}
                        <div className="flex flex-row items-center gap-1.5 w-full overflow-hidden whitespace-nowrap">
                           {typeTags.slice(0, 3).map((tag, idx) => (
                              <span 
                                key={idx} 
                                className={`text-[9px] font-bold text-${typeColor}-600/80 bg-${typeColor}-50 px-1.5 py-0.5 rounded border border-${typeColor}-100 truncate`}
                                style={{ flexShrink: idx === 2 ? 1 : 0, minWidth: 0 }}
                              >
                                 {tag.replace(/^#/, '')}
                              </span>
                           ))}
                           {typeTags.length === 0 && <span className="text-[9px] text-gray-400 italic">No tags</span>}
                        </div>
                    </button>
                 );
              })}

              {historyItems.length === 0 && (
                 <div className="text-xs text-gray-400 italic px-2 py-8 text-center bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
                    {t('profile.noHistory')}
                 </div>
              )}
           </div>
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
