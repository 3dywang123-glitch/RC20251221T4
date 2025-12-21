
import React, { useState, useRef, useEffect } from 'react';
import { TargetProfile } from '../types';
import { UploadIcon, BrainIcon, SparklesIcon, ChevronRight, ImportIcon, ChartIcon, ZapIcon, EditIcon } from '../componentsv2/Icons';
import LoadingScreen from '../componentsv2/LoadingScreen';
import * as Gemini from '../servicesv2/geminiService';
import { compressImage } from '../servicesv2/geminiService';
import { useTranslation } from '../contextsv2/LanguageContext';

// Reusable Wireframe Icon Component
const WireframeIcon = ({ type }: { type: 'profile' | 'moment' | 'chat' }) => {
  if (type === 'profile') {
    return (
       <div className="w-16 sm:w-20 aspect-[3/4] bg-white border-2 border-gray-100 rounded-xl p-1.5 flex flex-col items-center shadow-sm relative overflow-hidden select-none">
          <div className="w-6 h-6 rounded-full bg-gray-200 border border-white shadow-sm mb-2 flex-shrink-0"></div>
          <div className="flex gap-1 mb-2 w-full justify-center">
              <div className="w-3 h-0.5 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-0.5 bg-gray-300 rounded-full"></div>
          </div>
          <div className="grid grid-cols-3 gap-1 w-full mt-auto mb-1 px-1">
              {[...Array(6)].map((_,i)=><div key={i} className="aspect-square bg-blue-100/50 rounded-[2px]"></div>)}
          </div>
          <div className="absolute bottom-1 right-1 opacity-100"><ChartIcon className="w-3.5 h-3.5 text-blue-500" /></div>
       </div>
    );
  }
  if (type === 'moment') {
    return (
       <div className="w-16 sm:w-20 aspect-[3/4] bg-white border-2 border-gray-100 rounded-xl p-1.5 flex flex-col shadow-sm relative overflow-hidden select-none">
          <div className="flex items-center gap-1 mb-1.5"><div className="w-3 h-3 rounded-full bg-gray-200"></div><div className="w-8 h-0.5 bg-gray-300 rounded-full"></div></div>
          <div className="w-full aspect-square bg-gray-100 rounded-lg mb-1.5 relative overflow-hidden flex items-center justify-center"><div className="w-5 h-5 bg-gray-200 rounded-full opacity-50"></div></div>
          <div className="flex gap-1 mb-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div></div>
          <div className="w-3/4 h-1 bg-gray-200 rounded-full"></div>
          <div className="absolute bottom-1 right-1 opacity-100"><ZapIcon className="w-3.5 h-3.5 text-gold-dark" /></div>
       </div>
    );
  }
  if (type === 'chat') {
    return (
       <div className="w-16 sm:w-20 aspect-[3/4] bg-white border-2 border-gray-100 rounded-xl p-1.5 flex flex-col justify-center gap-2 shadow-sm relative overflow-hidden select-none">
          <div className="flex items-end gap-1"><div className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0"></div><div className="w-10 h-3 bg-gray-100 rounded-lg rounded-bl-none border border-gray-200"></div></div>
          <div className="w-full flex justify-center py-0.5"><div className="w-5 h-0.5 bg-gray-200 rounded-full"></div></div>
          <div className="flex items-end gap-1 justify-end"><div className="w-9 h-3 bg-purple-100 rounded-lg rounded-br-none border border-purple-200"></div></div>
          <div className="absolute bottom-1 right-1 opacity-100"><BrainIcon className="w-3.5 h-3.5 text-purple-500" /></div>
       </div>
    );
  }
  return null;
};

interface Props {
  targets: TargetProfile[];
  onCancel: () => void;
  onSuccess: (newTarget: TargetProfile, type: 'PROFILE' | 'POST' | 'CHAT' | 'FEED', originalImages: string[], contextNote?: string) => void;
  initialMergeTargetId?: string;
}

const SmartAnalysisPage: React.FC<Props> = ({ targets, onCancel, onSuccess, initialMergeTargetId }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [croppedAvatar, setCroppedAvatar] = useState<string | null>(null);
  const [manualAvatar, setManualAvatar] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>(initialMergeTargetId || '');
  const [isAutoMatched, setIsAutoMatched] = useState(false);

  const [formData, setFormData] = useState({ name: '', gender: 'Female', age: '', occupation: '', bio: '' });
  const existingTarget = targets.find(t => t.id === mergeTargetId);
  const activeAvatar = manualAvatar || (existingTarget?.avatarB64) || croppedAvatar || originalImages[0];

  useEffect(() => {
    if (step !== 'review' || !analysisResult) return;
    const auto = analysisResult.extractedProfile || {};
    
    const resolve = (existingVal: string | undefined, autoVal: string, defaultVal: string = '') => {
        if (mergeTargetId && existingTarget && existingVal && existingVal.trim().length > 0) return existingVal;
        if (autoVal && autoVal.trim().length > 0 && autoVal.toLowerCase() !== 'unknown') return autoVal;
        return defaultVal;
    };

    setFormData({
        name: resolve(existingTarget?.name, auto.name, t('common.unknown')),
        gender: (existingTarget?.gender || auto.gender || 'Female') as any,
        age: resolve(existingTarget?.age, auto.age),
        occupation: resolve(existingTarget?.occupation, auto.occupation),
        bio: resolve(existingTarget?.bio, auto.bio)
    });
  }, [step, analysisResult, mergeTargetId, existingTarget, t]);

  useEffect(() => {
    if (step !== 'review' || initialMergeTargetId || mergeTargetId || isAutoMatched) return;
    if (analysisResult?.extractedProfile?.name) {
        const detectedName = analysisResult.extractedProfile.name.trim().toLowerCase();
        const match = targets.find(t => !t.isSample && t.name.toLowerCase() === detectedName);
        if (match) { setMergeTargetId(match.id); setIsAutoMatched(true); }
    }
  }, [step, analysisResult, targets, initialMergeTargetId, mergeTargetId, isAutoMatched]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const processedImages: string[] = [];
    setStep('analyzing');
    // Removed slice to allow all images selected by user
    const promises = fileArray.map(file => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const b64 = reader.result as string;
          try { const compressed = await compressImage(b64, 1280, 0.8, 600); processedImages.push(compressed); } catch (e) { processedImages.push(b64); }
          resolve();
        };
        reader.readAsDataURL(file as Blob);
      });
    });
    await Promise.all(promises);
    if (processedImages.length > 0) { setOriginalImages(processedImages); performAnalysis(processedImages); }
  };

  const handleManualAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            let b64 = reader.result as string;
            try { b64 = await compressImage(b64, 800, 0.8, 400); } catch (error) {}
            setManualAvatar(b64);
        };
        reader.readAsDataURL(file);
    }
  };

  const cropAvatar = (base64Image: string, box: number[], type?: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const [ymin, xmin, ymax, xmax] = box;
        const canvas = document.createElement('canvas');
        const realY = (ymin / 1000) * img.height;
        const realX = (xmin / 1000) * img.width;
        const realH = ((ymax - ymin) / 1000) * img.height;
        const realW = ((xmax - xmin) / 1000) * img.width;
        let padScale = type === 'CHAT' ? 0.3 : 0.15;
        const padX = realW * padScale; const padY = realH * padScale;
        const cropX = Math.max(0, realX - padX); const cropY = Math.max(0, realY - padY);
        const cropW = Math.min(img.width - cropX, realW + (padX * 2));
        const cropH = Math.min(img.height - cropY, realH + (padY * 2));
        canvas.width = cropW; canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH); resolve(canvas.toDataURL('image/jpeg')); } else { resolve(base64Image); }
      };
      img.src = base64Image;
    });
  };

  const performAnalysis = async (imgs: string[]) => {
    try {
      const result = await Gemini.classifyAndExtract(imgs);
      setAnalysisResult(result);
      if (result.avatarBox && imgs.length > 0) {
         try { 
            // Determine the correct image index to crop from
            const sourceIndex = (result.avatarSourceIndex !== undefined && result.avatarSourceIndex >= 0 && result.avatarSourceIndex < imgs.length) 
                ? result.avatarSourceIndex 
                : 0;
            const avatarSrc = imgs[sourceIndex];
            const avatar = await cropAvatar(avatarSrc, result.avatarBox, result.type); 
            setCroppedAvatar(avatar); 
         } catch (e) { 
            setCroppedAvatar(imgs[0]); 
         }
      } else if (imgs.length > 0) { setCroppedAvatar(imgs[0]); }
      setStep('review');
    } catch (e) { console.error(e); alert("Analysis failed."); setStep('upload'); }
  };

  const handleConfirm = () => {
    if (originalImages.length === 0) return;
    let finalTarget: TargetProfile;
    if (mergeTargetId && existingTarget) {
       finalTarget = { ...existingTarget, ...formData, avatarB64: activeAvatar };
    } else {
       finalTarget = {
         id: Date.now().toString(),
         name: formData.name || t('common.unknown'),
         ...formData,
         avatarB64: activeAvatar, 
         socialMediaData: [], consultationHistory: [], socialAnalysisHistory: [], postAnalysisHistory: []
       };
    }
    const finalType = (analysisResult?.type === 'UNKNOWN' || !analysisResult?.type) ? 'PROFILE' : analysisResult.type;
    onSuccess(finalTarget, finalType, originalImages, '');
  };

  return (
    <div className="fixed inset-0 z-50 bg-cream flex flex-col animate-fade-in">
      <div className="px-6 py-4 flex justify-between items-center max-w-xl w-full mx-auto flex-shrink-0">
        <button onClick={onCancel} className="text-sm font-bold text-navy/50 hover:text-navy transition flex items-center gap-1 group">
          <ChevronRight className="rotate-180 w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t('common.cancel')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        <div className="max-w-xl mx-auto w-full px-5 h-full flex flex-col">
          {step === 'upload' && (
            <div className="flex flex-col flex-1 animate-slide-up">
              <div className="mt-10 mb-10 flex items-center justify-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gold flex items-center justify-center shadow-md border-2 border-white">
                   <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy tracking-tight">{t('smartAnalysis.title')}</h1>
              </div>

              <label className="w-[90%] mx-auto aspect-[4/4.5] rounded-[2.5rem] border-2 border-dashed border-[#D4C5A5] bg-[#F5F2EA] hover:bg-[#EBE5D9] transition-all cursor-pointer relative flex flex-col overflow-hidden group shadow-sm hover:shadow-lg">
                  <div className="flex-1 flex flex-col items-center justify-center"><div className="bg-navy text-white rounded-2xl px-8 py-4 shadow-xl group-hover:scale-105 transition-transform flex items-center gap-3"><UploadIcon className="w-6 h-6" /><span className="text-sm font-bold uppercase tracking-[0.2em]">{t('smartAnalysis.tapToUpload')}</span></div></div>
                  <div className="w-full h-px bg-[#D4C5A5]/40"></div>
                  <div className="w-full bg-navy/5 py-6 px-6 flex flex-col items-center gap-4">
                      <div className="flex justify-between w-full">
                          <div className="flex flex-col items-center gap-2"><WireframeIcon type="profile" /><span className="text-[10px] font-bold text-navy/50 uppercase tracking-[0.1em]">{t('smartAnalysis.examples.profile')}</span></div>
                          <div className="flex flex-col items-center gap-2"><WireframeIcon type="moment" /><span className="text-[10px] font-bold text-navy/50 uppercase tracking-[0.1em]">{t('smartAnalysis.examples.moment')}</span></div>
                          <div className="flex flex-col items-center gap-2"><WireframeIcon type="chat" /><span className="text-[10px] font-bold text-navy/50 uppercase tracking-[0.1em]">{t('smartAnalysis.examples.chatlog')}</span></div>
                      </div>
                      <div className="text-[9px] font-bold text-navy/30 bg-white/50 px-3 py-1 rounded-full border border-navy/5 flex items-center gap-2"><SparklesIcon className="w-2.5 h-2.5 text-gold" /> {t('smartAnalysis.autoDetect')}</div>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
              </label>
              
              <div className="mt-8 mb-8 text-center">
                 <button onClick={onCancel} className="text-[11px] font-bold text-navy/30 underline hover:text-navy transition uppercase tracking-widest">
                    {t('smartAnalysis.enterManually')}
                 </button>
              </div>
            </div>
          )}

          {step === 'analyzing' && <LoadingScreen isLoading={true} text={t('common.processing')} type="smart-import" />}

          {step === 'review' && (
             <div className="flex flex-col h-full animate-slide-up pb-10">
                <div className="flex justify-between items-center mb-3 px-1">
                   <h3 className="text-xl font-serif font-bold text-navy">{mergeTargetId ? (t('smartAnalysis.actions.updateAnalyze') || "更新") : (t('smartAnalysis.newProfile') || "新建")}</h3>
                   <div className="text-[9px] font-bold bg-gold/10 text-gold-dark px-2 py-0.5 rounded border border-gold/20 flex items-center gap-1"><SparklesIcon className="w-2 h-2" /> {t('smartAnalysis.detected')}</div>
                </div>
                <div className="flex-1 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col space-y-4 overflow-y-auto no-scrollbar">
                    <div className="flex items-start gap-4">
                       <label className="relative w-24 h-24 flex-shrink-0 cursor-pointer group">
                          <div className="w-24 h-24 rounded-full bg-gray-50 overflow-hidden border-2 border-white shadow-md group-hover:border-gold/30 transition-all relative">
                             <img src={activeAvatar} className="w-full h-full object-cover transition-transform" alt="avatar" />
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><UploadIcon className="w-6 h-6 text-white" /></div>
                          </div>
                          <div className="absolute bottom-1 right-1 bg-gold p-1.5 rounded-full shadow-lg border border-white"><EditIcon className="w-3 h-3 text-white" /></div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleManualAvatarUpload} />
                       </label>
                       <div className="flex-1 flex flex-col gap-2.5">
                          <div className={`p-2.5 rounded-xl border transition-all ${mergeTargetId ? 'bg-gold/5 border-gold/30 shadow-sm' : 'bg-gray-50 border-transparent'}`}>
                              <label className="block text-[8px] font-bold uppercase tracking-widest text-[#8B6F38] mb-0.5">{mergeTargetId ? t('smartAnalysis.mergingInto') : t('smartAnalysis.saveTo')}</label>
                              <select value={mergeTargetId} onChange={(e) => { setMergeTargetId(e.target.value); setIsAutoMatched(false); }} className="w-full bg-transparent font-serif font-bold text-sm outline-none appearance-none cursor-pointer text-navy leading-tight">
                                <option value="">{t('smartAnalysis.newProfile')}</option>
                                {targets.filter(t => !t.isSample).map(t => <option key={t.id} value={t.id}>📂 {t.name}</option>)}
                              </select>
                          </div>
                          <div className="space-y-0.5">
                             <label className="text-[8px] font-bold text-gold-dark uppercase tracking-widest pl-1">{t('smartAnalysis.form.name')}</label>
                             <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder={t('profile.enterName')} className="w-full p-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white outline-none transition text-sm text-navy font-bold" />
                          </div>
                       </div>
                    </div>
                    <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-0.5"><label className="text-[8px] font-bold text-gold-dark uppercase tracking-widest pl-1">{t('smartAnalysis.form.occupation')}</label><input value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} className="w-full p-2 bg-gray-50 rounded-xl border-transparent outline-none transition text-sm text-navy font-medium" /></div>
                            <div className="space-y-0.5"><label className="text-[8px] font-bold text-gold-dark uppercase tracking-widest pl-1">{t('smartAnalysis.form.gender')}</label><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value as any})} className="w-full p-2 bg-gray-50 rounded-xl border-transparent outline-none text-sm text-navy font-medium appearance-none cursor-pointer"><option value="Female">Female</option><option value="Male">Male</option></select></div>
                        </div>
                        <div className="space-y-0.5"><label className="text-[8px] font-bold text-gold-dark uppercase tracking-widest pl-1">{t('smartAnalysis.form.age')}</label><input value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full p-2 bg-gray-50 rounded-xl border-transparent outline-none text-sm text-navy font-medium" placeholder="e.g. 24" /></div>
                        <div className="space-y-0.5"><label className="text-[8px] font-bold text-gold-dark uppercase tracking-widest pl-1">{t('smartAnalysis.form.bio')}</label><textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full p-2.5 bg-gray-50 rounded-xl border-transparent outline-none text-[11px] text-navy font-medium h-16 resize-none" placeholder={t('profile.bio')} /></div>
                        <div className="pt-2 border-t border-gray-50">
                           <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mb-2">{t('reports.visualEvidence')}</p>
                           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                              {originalImages.map((img, i) => (<img key={i} src={img} className="w-10 h-10 rounded-lg border border-gray-100 shadow-sm object-cover opacity-40 hover:opacity-100 transition-opacity flex-shrink-0" alt="evidence" />))}
                           </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                   <button onClick={handleConfirm} className="w-full py-4 bg-navy text-white rounded-2xl font-bold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"><ImportIcon className="w-5 h-5" /><span>{mergeTargetId ? (t('smartAnalysis.actions.updateAnalyze') || "更新并分析") : (t('smartAnalysis.actions.saveAnalyze') || "保存并分析")}</span></button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartAnalysisPage;
