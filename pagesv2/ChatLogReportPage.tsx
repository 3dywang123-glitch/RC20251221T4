
import React, { useState, useRef } from 'react';
import { TargetProfile, RelationshipReport } from '../types';
import { ChevronRight, BrainIcon, TrashIcon, ChartIcon } from '../componentsv2/Icons';
import { downloadElementAsImage } from '../utils';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  target: TargetProfile | null;
  report: RelationshipReport | null;
  onNavigate: (view: string) => void;
  onSelectReport: (report: RelationshipReport | null) => void;
  onDeleteReport: (id: string) => void;
}

const ChatLogReportPage: React.FC<Props> = ({ target, report, onNavigate, onSelectReport, onDeleteReport }) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!report) return null;

  const handleDownload = async () => {
    if (!reportContentRef.current) return;
    setIsDownloading(true);
    await downloadElementAsImage(reportContentRef.current, `Consultation_Strategy_${Date.now()}.png`);
    setIsDownloading(false);
  };

  const getChatGoalLabel = (goalKey: string) => {
    if (goalKey?.includes('Get a Date')) return t('analysis.goals.iceBreaker');
    if (goalKey?.includes('Heat Up')) return t('analysis.goals.heatUp');
    if (goalKey?.includes('Recovery')) return t('analysis.goals.recovery');
    if (goalKey?.includes('Maintenance')) return t('analysis.goals.maintain');
    return goalKey || "General Strategy";
  };

  // Helper to parse markdown-like structure
  const parseStrategy = (text: string) => {
    if (!text) return [];
    // Try splitting by Markdown headers (H2 or H3)
    const parts = text.split(/(?=#{2,3}\s)/);
    
    const parsed = parts.filter(s => s.trim()).map(section => {
      const lines = section.trim().split('\n');
      const titleLine = lines[0];
      
      // Check if the first line looks like a header
      const isHeader = /^#{2,3}\s/.test(titleLine);
      
      if (isHeader) {
          const title = titleLine.replace(/^#{2,3}\s*/, '').replace(/[*:]+$/, '').trim();
          const content = lines.slice(1).join('\n').trim();
          return { title, content };
      } else {
          return null;
      }
    }).filter(s => s && s.title && s.content) as {title: string, content: string}[];

    return parsed;
  };

  const renderStyledContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i}/>;
      
      // Check for bullet points
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const cleanLine = line.replace(/^[\*\-]\s+/, '');

      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={i} className={`text-sm text-navy/80 leading-relaxed mb-2 ${isBullet ? 'pl-4 flex' : ''}`}>
           {isBullet && <span className="mr-2 text-gold">•</span>}
           <div>
             {parts.map((part, idx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                   return <strong key={idx} className="font-bold text-navy">{part.slice(2, -2)}</strong>;
                }
                return <span key={idx}>{part}</span>;
             })}
           </div>
        </div>
      );
    });
  };

  // Fallback: Construct strategy from other fields if main strategy is missing
  const buildSyntheticStrategy = (r: RelationshipReport) => {
      let parts = [];
      if (r.statusAssessment) parts.push(`### 1. Executive Summary\n${r.statusAssessment}`);
      if (r.partnerPersonalityAnalysis) parts.push(`### 2. Psychological Insight\n${r.partnerPersonalityAnalysis}`);
      
      if (r.greenFlags?.length) parts.push(`### 3. Positive Signals\n${r.greenFlags.map(f => `* ${f}`).join('\n')}`);
      if (r.redFlags?.length) parts.push(`### 4. Warning Signs\n${r.redFlags.map(f => `* ${f}`).join('\n')}`);
      
      if (r.communicationDos?.length) parts.push(`### 5. Recommended Actions\n${r.communicationDos.map(f => `* ${f}`).join('\n')}`);
      
      return parts.join('\n\n');
  };

  const activeStrategy = report.strategy || buildSyntheticStrategy(report);
  const sections = parseStrategy(activeStrategy);
  // Show raw content if we have content but parsing failed to find sections
  const showRawContent = sections.length === 0 && !!activeStrategy;

  return (
    <div className="h-full bg-cream flex flex-col animate-fade-in relative z-10">
       
       {lightboxImage && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setLightboxImage(null)}>
             <img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Full size" />
          </div>
       )}

       <div className="bg-white/90 backdrop-blur-md p-4 shadow-sm flex items-center justify-between gap-3 sticky top-0 z-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => onSelectReport(null)} className="p-2 hover:bg-gray-50 rounded-full transition active:scale-95">
               <ChevronRight className="rotate-180 w-6 h-6 text-navy" />
            </button>
            <h2 className="text-xl font-serif font-bold text-navy">{t('reports.consultation')}</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onDeleteReport(report.id!)} 
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
                  <h1 className="text-2xl font-serif font-bold text-navy leading-tight">{t('reports.chatHistoryReport')}</h1>
                  <div className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                      {target?.name} <span className="w-1 h-1 rounded-full bg-gold"></span> {new Date(report.generatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                     {report.tags?.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-navy/5 text-navy border border-navy/10 rounded-md text-[9px] font-bold uppercase tracking-wide">#{tag.replace(/^#/, '')}</span>
                     ))}
                  </div>
               </div>

               {/* Chat Log Evidence Section */}
               {report.archivedInput?.images && report.archivedInput.images.length > 0 && (
                  <div className="mb-6">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Chat Logs Evidence</h3>
                     <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {report.archivedInput.images.map((img, i) => (
                           <div key={i} onClick={() => setLightboxImage(img)} className="w-24 h-32 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0 cursor-zoom-in relative bg-black/5">
                              <img src={img} className="w-full h-full object-cover" alt={`chat-log-${i}`} />
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               <div className="space-y-4">
                   {/* Score Card */}
                   <div className="bg-navy p-6 rounded-3xl shadow-lg relative overflow-hidden text-white flex items-center justify-between">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gold opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      
                      <div className="relative z-10 flex flex-col justify-center">
                         <div className="text-[10px] text-gold font-bold uppercase tracking-widest mb-2">{t('reports.compatibilityScore')}</div>
                         <div className="text-lg font-serif font-bold text-white/90 tracking-wide">
                            {getChatGoalLabel(report.goalContext || '')}
                         </div>
                      </div>

                      <div className="relative z-10 text-right">
                         <div className="text-5xl font-serif font-bold">{report.compatibilityScore}<span className="text-xl text-white/50">%</span></div>
                      </div>
                   </div>

                   {/* Strategy Sections */}
                   <div className="space-y-4">
                      {sections.map((section, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                           <h4 className="font-serif font-bold text-lg text-navy mb-3 border-b border-gray-50 pb-2">{section.title}</h4>
                           {renderStyledContent(section.content)}
                        </div>
                      ))}

                      {/* Fallback for raw/unstructured strategy */}
                      {showRawContent && (
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                           <h4 className="font-serif font-bold text-lg text-navy mb-3 border-b border-gray-50 pb-2">{t('reports.strategy')}</h4>
                           {renderStyledContent(activeStrategy)}
                        </div>
                      )}
                      
                      {!showRawContent && sections.length === 0 && (
                         <div className="text-center p-8 text-gray-400 italic text-xs border-2 border-dashed border-gray-200 rounded-3xl">
                            {t('reports.noStrategy')}
                         </div>
                      )}
                   </div>

               </div>
               <div className="mt-8 pt-6 border-t border-gray-200 text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">{t('app.generatedBy')}</div>
           </div>
       </div>
    </div>
  );
};
export default ChatLogReportPage;
