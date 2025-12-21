
import React, { useState, useRef } from 'react';
import { SocialAnalysisResult, TargetProfile } from '../types';
import { ChevronRight, ChartIcon, TrashIcon, BookIcon, ZapIcon, EyeIcon, CopyIcon } from '../componentsv2/Icons';
import { downloadElementAsImage } from '../utils';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  target: TargetProfile | null;
  report: SocialAnalysisResult | null;
  onBack: () => void;
  onDelete: () => void;
}

const OverviewReportPage: React.FC<Props> = ({ target, report, onBack, onDelete }) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!report) return null;

  const handleDownload = async () => {
    if (!reportContentRef.current) return;
    setIsDownloading(true);
    await downloadElementAsImage(reportContentRef.current, `Overview_${report.handle}_${Date.now()}.png`);
    setIsDownloading(false);
  };

  const handleCopyReply = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to render bold text from **markdown**
  const renderStyledText = (text: string) => {
    if (!text) return null;
    return text.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} className="font-bold text-navy">{part.slice(2, -2)}</strong>;
        }
        return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="h-full bg-cream flex flex-col animate-fade-in relative z-10">
       
       {lightboxImage && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setLightboxImage(null)}>
             <img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Full size" />
          </div>
       )}

       <div className="bg-white/90 backdrop-blur-md p-4 shadow-sm flex items-center justify-between gap-3 sticky top-0 z-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-full transition active:scale-95">
               <ChevronRight className="rotate-180 w-6 h-6 text-navy" />
            </button>
            <h2 className="text-xl font-serif font-bold text-navy">{t('reports.consultation')}</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onDelete} 
              disabled={target?.isSample}
              className="p-2 bg-red-50 text-red-500 rounded-xl shadow-sm active:scale-95 hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
            >
              <TrashIcon />
            </button>
            <button onClick={handleDownload} disabled={isDownloading} className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl shadow-md active:scale-95 hover:bg-navy-light disabled:opacity-50">
               {isDownloading ? t('reports.saving') : t('reports.saveImage')}
            </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto bg-cream scroll-smooth">
           <div ref={reportContentRef} className="p-6 pb-16 bg-cream min-h-full">
               <div className="mb-6 border-b-2 border-gold/20 pb-4">
                  <h1 className="text-2xl font-serif font-bold text-navy">{t('reports.socialReport')}</h1>
                  <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mt-1">
                     {target?.name || report.handle} <span className="w-1 h-1 rounded-full bg-gold"></span> {new Date(report.timestamp).toLocaleDateString()}
                  </div>
                  {report.reportTags && report.reportTags.length > 0 && (
                     <div className="flex gap-2 mt-3 flex-wrap">
                        {report.reportTags.map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-navy/5 text-navy border border-navy/10 rounded-md text-[9px] font-bold uppercase tracking-wide">#{tag.replace(/^#/, '')}</span>
                        ))}
                     </div>
                  )}
               </div>

               {/* Visual Evidence Section */}
               {report.inputImages && report.inputImages.length > 0 && (
                  <div className="mb-6">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('reports.visualEvidence')}</h3>
                     <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {report.inputImages.map((img, i) => (
                           <div key={i} onClick={() => setLightboxImage(img)} className="w-24 h-32 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0 cursor-zoom-in relative">
                              <img src={img} className="w-full h-full object-cover" alt={`evidence-${i}`} />
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               <div className="space-y-4">
                   
                   {/* 1. Surface vs. Subtext */}
                   <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                       <h4 className="text-sm font-bold text-navy flex items-center gap-2 mb-3">
                          <EyeIcon className="w-5 h-5 text-blue-500" /> {t('reports.surfaceSubtext')}
                       </h4>
                       <div className="text-sm text-navy/80 leading-relaxed whitespace-pre-wrap">
                          {renderStyledText(report.surfaceSubtext)}
                       </div>
                   </div>

                   {/* 2. Target Audience */}
                   <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                       <h4 className="text-sm font-bold text-navy flex items-center gap-2 mb-3">
                          🎯 {t('reports.targetAudience')}
                       </h4>
                       <div className="text-sm text-navy/80 leading-relaxed whitespace-pre-wrap">
                          {renderStyledText(report.targetAudience)}
                       </div>
                   </div>

                   {/* 3. Persona & Impression */}
                   <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                       <h4 className="text-sm font-bold text-navy flex items-center gap-2 mb-3">
                          🎭 {t('reports.personaImpression')}
                       </h4>
                       <div className="text-sm text-navy/80 leading-relaxed whitespace-pre-wrap">
                          {renderStyledText(report.personaImpression)}
                       </div>
                   </div>

                   {/* 4. Performance & Purpose */}
                   <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                       <h4 className="text-sm font-bold text-navy flex items-center gap-2 mb-3">
                          <ChartIcon className="w-5 h-5 text-purple-500" /> {t('reports.performancePurpose')}
                       </h4>
                       <div className="text-sm text-navy/80 italic leading-relaxed whitespace-pre-wrap">
                          {renderStyledText(report.performancePurpose)}
                       </div>
                   </div>

                   {/* 5. Suggested Replies */}
                   {report.suggestedReplies && report.suggestedReplies.length > 0 && (
                     <div className="mt-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
                           <ZapIcon className="w-4 h-4 text-gold-dark" /> {t('reports.openingLines')}
                        </h3>
                        
                        <div className="space-y-3">
                          {report.suggestedReplies.map((reply, i) => (
                            <div key={i} className="relative group">
                               <div className="bg-navy text-white p-4 rounded-2xl shadow-md border border-navy relative z-10 pr-12">
                                  <p className="text-sm font-medium leading-relaxed">{reply}</p>
                               </div>
                               
                               <button 
                                  onClick={() => handleCopyReply(reply, i)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition active:scale-90"
                               >
                                  {copiedIndex === i ? (
                                     <span className="text-[10px] font-bold bg-white text-navy px-1.5 py-0.5 rounded">{t('reports.copied')}</span>
                                  ) : (
                                     <CopyIcon className="w-5 h-5" />
                                  )}
                               </button>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}

               </div>
               <div className="mt-8 pt-6 border-t border-gray-200 text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">{t('app.generatedBy')}</div>
           </div>
       </div>
    </div>
  );
};
export default OverviewReportPage;
