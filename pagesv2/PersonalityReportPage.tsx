
import React, { useState, useRef, useMemo } from 'react';
import { TargetProfile } from '../types';
import { ChevronRight, TrashIcon } from '../componentsv2/Icons';
import RadarChartComponent from '../componentsv2/RadarChart';
import { downloadElementAsImage } from '../utils';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  target: TargetProfile | null;
  onBack: () => void;
  onDelete: () => void;
}

const PersonalityReportPage: React.FC<Props> = ({ target, onBack, onDelete }) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);

  if (!target || !target.personalityReport) return null;
  const report = target.personalityReport;

  const handleDownloadImage = async () => {
    if (!reportContentRef.current) return;
    setIsDownloading(true);
    await downloadElementAsImage(reportContentRef.current, `Personality_Analysis_${target.name.replace(/\s+/g, '_')}_${Date.now()}.png`);
    setIsDownloading(false);
  };

  // Parse the monolithic summary string into sections
  const parsedSections = useMemo(() => {
    if (!report.summary) return [];
    
    // Split by ### Header (tolerant of numbering or no numbering)
    // Regex looks for ### followed by optional space, then optional digit+dot, then space/text
    const parts = report.summary.split(/(?=###\s)/);
    
    return parts
      .filter(p => p.trim().startsWith('###'))
      .map(part => {
        const firstLineEnd = part.indexOf('\n');
        const titleLine = part.substring(0, firstLineEnd > -1 ? firstLineEnd : part.length).trim();
        // Remove '###', optional '1.', and whitespace
        const title = titleLine.replace(/^###\s*(\d+\.)?\s*/, '').trim();
        const content = part.substring(firstLineEnd > -1 ? firstLineEnd : part.length).trim();
        return { title, content };
      });
  }, [report.summary]);

  const findSection = (keywords: string[]) => {
    return parsedSections.find(s => {
      const lowerTitle = s.title.toLowerCase();
      return keywords.some(k => lowerTitle.includes(k.toLowerCase()));
    });
  };

  const archetypeSection = findSection(['archetype', '核心原型', '原型', '核心', 'archetype']);
  const bigFiveSection = findSection(['big five', '五维', '人格维度', '五大', 'dimension', 'model']);
  const decodingSection = findSection(['decoding', '深度', '心理侧写', 'deep', 'psychological', '侧写']);

  // Helper to render markdown-like bold text
  const renderContent = (text: string, isDarkBg = false) => {
    const baseTextClass = isDarkBg ? 'text-white/90' : 'text-navy/80';
    const boldTextClass = isDarkBg ? 'text-white' : 'text-navy';

    // Clean up potential duplicate headers from legacy reports if they exist in the content body
    // This regex looks for lines starting with ### or **Strategic Playbook** at the start
    const cleanedText = text.replace(/^###\s*Strategic Playbook\s*\n?/i, '')
                            .replace(/^\*\*Strategic Playbook\*\*\s*\n?/i, '');

    return cleanedText.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      
      const isListItem = trimmed.startsWith('* ') || trimmed.startsWith('- ');
      const content = isListItem ? trimmed.substring(2) : trimmed;

      return (
        <div key={i} className={`text-sm ${baseTextClass} leading-relaxed mb-2 ${isListItem ? 'flex gap-2' : ''}`}>
           {isListItem && <span className="text-gold mt-1.5">•</span>}
           <p>
             {content.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={idx} className={`font-bold ${boldTextClass}`}>{part.slice(2, -2)}</strong>;
                }
                return <span key={idx}>{part}</span>;
             })}
           </p>
        </div>
      );
    });
  };

  return (
    <div className="h-full bg-cream flex flex-col animate-fade-in relative z-10">
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
            <button onClick={handleDownloadImage} disabled={isDownloading} className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl shadow-md active:scale-95 hover:bg-navy-light disabled:opacity-50">
               {isDownloading ? t('reports.saving') : t('reports.saveImage')}
            </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto bg-cream scroll-smooth">
           <div ref={reportContentRef} className="p-6 pb-24 bg-cream min-h-full">
               
               <div className="mb-6 border-b-2 border-gold/20 pb-4">
                  <h1 className="text-2xl font-serif font-bold text-navy leading-tight">{t('reports.personalityAnalysis')}</h1>
                  <div className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                      {target.name} <span className="w-1 h-1 rounded-full bg-gold"></span> {new Date(report.generatedAt).toLocaleDateString()}
                  </div>
                  {report.tags && report.tags.length > 0 && (
                     <div className="flex gap-2 mt-3 flex-wrap">
                        {report.tags.map((tag, idx) => (
                           <span key={idx} className="px-2 py-1 bg-navy/5 text-navy border border-navy/10 rounded-md text-[9px] font-bold uppercase tracking-wide">
                              {tag.replace(/^#/, '')}
                           </span>
                        ))}
                     </div>
                  )}
               </div>

               <div className="space-y-6">
                   
                   {/* 1. The Archetype */}
                   {archetypeSection && (
                     <div className="bg-navy p-6 rounded-3xl shadow-lg relative overflow-hidden text-white border border-white/10">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gold opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-4">{archetypeSection.title}</h3>
                        <div className="relative z-10">
                           {renderContent(archetypeSection.content, true)}
                        </div>
                     </div>
                   )}

                   {/* 2. Big Five - Responsive Layout (Side-by-side on desktop) */}
                   {bigFiveSection && (
                     <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-serif font-bold text-lg text-navy">{bigFiveSection.title}</h3>
                           <div className="text-xs font-bold bg-green-50 text-green-600 px-2 py-1 rounded">
                              {t('reports.stability')}: {report.emotionalStability}%
                           </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                            {/* Radar Chart - Left on Desktop */}
                            <div className="h-64 w-full md:w-1/2 flex-shrink-0 mb-6 md:mb-0 md:-ml-4">
                               <RadarChartComponent data={report.bigFive} />
                            </div>

                            {/* Text Content - Right on Desktop */}
                            <div className="w-full md:w-1/2">
                               {renderContent(bigFiveSection.content)}
                            </div>
                        </div>
                     </div>
                   )}

                   {/* 3. Deep Psychological Decoding */}
                   {decodingSection && (
                     <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-serif font-bold text-lg text-navy mb-4 border-b border-gray-50 pb-2">{decodingSection.title}</h3>
                        <div>
                           {renderContent(decodingSection.content)}
                        </div>
                     </div>
                   )}

                   {/* 4. Strategic Playbook (datingAdvice) */}
                   {report.datingAdvice && (
                     <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        {/* Use translated title, avoid rendering duplicate header from content */}
                        <h3 className="font-serif font-bold text-lg text-navy mb-4 border-b border-gray-50 pb-2">{t('reports.strategy')}</h3>
                        <div>
                           {renderContent(report.datingAdvice)}
                        </div>
                     </div>
                   )}
                   
                   {/* Avatar Analysis section removed as requested */}

               </div>
               
               <div className="mt-8 pt-6 border-t border-gray-200 text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
                  {t('app.generatedBy')}
               </div>

           </div>
       </div>
    </div>
  );
};

export default PersonalityReportPage;
