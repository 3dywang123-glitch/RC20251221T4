
import React, { useRef, useState } from 'react';
import { SocialPostAnalysis, TargetProfile } from '../types';
import { BrainIcon, ChevronRight, ZapIcon, TrashIcon, TimerIcon, EyeIcon, CopyIcon, ChartIcon } from '../componentsv2/Icons';
import { downloadElementAsImage } from '../utils';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  target: TargetProfile | null;
  post: SocialPostAnalysis | null;
  onBack: () => void;
  onDelete: () => void;
}

const PostReportPage: React.FC<Props> = ({ target, post, onBack, onDelete }) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  if (!post) return null;

  const handleDownload = async () => {
    if (!reportContentRef.current) return;
    setIsDownloading(true);
    const success = await downloadElementAsImage(reportContentRef.current, `Post_Analysis_${Date.now()}.png`);
    if (!success) {
      alert(t('errors.imageGeneration'));
    }
    setIsDownloading(false);
  };

  const handleCopyReply = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Improved markdown parsing to section headers properly
  const parseAnalysis = (text: string) => {
    return text.split(/(?=#{2,3}\s)/).filter(s => s.trim()).map(section => {
      const lines = section.trim().split('\n');
      const title = lines[0].replace(/^[#\s*]+/, '').replace(/[*:]+$/, '').trim();
      const content = lines.slice(1).join('\n').trim();
      return { title, content };
    }).filter(s => s.title && s.content);
  };

  const renderHighlighter = (text: string) => {
     // Split by **bold** syntax
     const parts = text.split(/(\*\*.*?\*\*)/g);
     return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
           return (
             <span key={idx} className="bg-yellow-100/80 text-navy font-bold px-1 mx-0.5 rounded-sm box-decoration-clone">
                {part.slice(2, -2)}
             </span>
           );
        }
        return part;
     });
  };

  const renderStyledContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-3" />;

      // List Item (Arrows or Checkmarks)
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.match(/^\d+\./)) {
         const cleanText = trimmed.replace(/^[\*\-\d\.]+\s*/, '');
         return (
            <div key={i} className="flex gap-3 mb-2 items-start group">
               <div className="mt-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-gold/10 text-gold-dark text-[10px] flex-shrink-0 font-bold">
                  →
               </div>
               <p className="text-sm text-navy/90 leading-relaxed">
                  {renderHighlighter(cleanText)}
               </p>
            </div>
         );
      }

      // Standard Paragraph
      return (
         <p key={i} className="text-sm text-navy/80 leading-relaxed mb-3">
            {renderHighlighter(trimmed)}
         </p>
      );
    });
  };

  const getIconForSection = (title: string) => {
    const lower = title.toLowerCase();
    
    // 1. Visual Context & Atmosphere (视觉语境与氛围解码)
    if (lower.includes('visual') || lower.includes('视觉') || lower.includes('context') || lower.includes('氛围')) {
        return <EyeIcon className="w-5 h-5 text-blue-500" />;
    }
    
    // 2. Subtext & Hidden Signals (潜台词与深层信号)
    if (lower.includes('subtext') || lower.includes('hidden') || lower.includes('潜台词') || lower.includes('信号')) {
        return <ZapIcon className="w-5 h-5 text-gold-dark" />;
    }
    
    // 3. Target Audience & Directionality (目标受众与指向性)
    if (lower.includes('audience') || lower.includes('target') || lower.includes('受众') || lower.includes('指向')) {
        return <ChartIcon className="w-5 h-5 text-purple-500" />;
    }
    
    // 4. Persona & Impression Management (人设与印象管理)
    if (lower.includes('persona') || lower.includes('impression') || lower.includes('人设') || lower.includes('印象')) {
        return <BrainIcon className="w-5 h-5 text-navy" />;
    }
    
    // 5. Motivation & Strategic Verdict (动机与博弈评估)
    if (lower.includes('motivation') || lower.includes('strategic') || lower.includes('verdict') || lower.includes('动机') || lower.includes('博弈')) {
        return <TimerIcon className="w-5 h-5 text-red-500" />;
    }
    
    return <BrainIcon className="w-5 h-5 text-navy" />;
  };

  const sections = parseAnalysis(post.analysis);
  const displayImages = post.images && post.images.length > 0 ? post.images : (post.imageB64 ? [post.imageB64] : []);

  return (
    <div className="h-full bg-cream flex flex-col overflow-hidden animate-fade-in relative z-10">
       {lightboxImage && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setLightboxImage(null)}>
             <img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Full size" />
          </div>
       )}

       <div className="bg-white/90 backdrop-blur-md p-4 shadow-sm flex items-center justify-between gap-3 sticky top-0 z-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-full transition active:scale-95"><ChevronRight className="rotate-180 w-6 h-6 text-navy" /></button>
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
           <div ref={reportContentRef} className="p-6 pb-24 bg-cream min-h-full">
               
               {/* 1. Header with Tags */}
               <div className="mb-6 border-b-2 border-gold/20 pb-4">
                  <h1 className="text-2xl font-serif font-bold text-navy leading-tight">{t('reports.postAnalysis')}</h1>
                  <div className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                      {target?.name} <span className="w-1 h-1 rounded-full bg-gold"></span> {new Date(post.timestamp).toLocaleDateString()}
                  </div>

                  {post.tags && post.tags.length > 0 && (
                     <div className="flex gap-2 mt-3 flex-wrap">
                        {post.tags.map((tag, idx) => (
                           <span key={idx} className="px-2 py-1 bg-navy/5 text-navy border border-navy/10 rounded-md text-[9px] font-bold uppercase tracking-wide">
                              {tag.replace(/^#/, '')}
                           </span>
                        ))}
                     </div>
                  )}
               </div>

               {/* 2. Target Content Display */}
               <div className="bg-navy p-5 rounded-3xl shadow-lg relative overflow-hidden text-white mb-8 border border-white/10">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-gold opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                   
                   <div className="relative z-10">
                       <div className="text-gold/80 text-[9px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse"></span>
                          {t('reports.subjectEvidence')}
                       </div>
                       
                       {displayImages.length > 0 && (
                           <div className="flex gap-3 mb-4 overflow-x-auto no-scrollbar pb-1">
                               {displayImages.map((img, idx) => (
                                 <div key={idx} onClick={() => setLightboxImage(img)} className="w-24 h-24 rounded-2xl overflow-hidden shadow-md border border-white/20 flex-shrink-0 cursor-zoom-in bg-black/20">
                                    <img src={img} className="w-full h-full object-cover" alt="analyzed post" />
                                 </div>
                               ))}
                           </div>
                       )}
                       {post.content && (
                          <div className="relative mt-2">
                             <p className="text-sm font-medium italic text-white/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                          </div>
                       )}
                   </div>
               </div>

               {/* 3. Structured Analysis Cards */}
               <div className="space-y-4">
                  {sections.map((section, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:border-gold/30">
                       <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-3">
                          <div className="p-2 rounded-xl shadow-sm bg-navy/5 text-navy">{getIconForSection(section.title)}</div>
                          <h4 className="font-serif font-bold text-lg text-navy">{section.title}</h4>
                       </div>
                       <div>
                          {renderStyledContent(section.content)}
                       </div>
                    </div>
                  ))}
               </div>
               
               {/* 4. Action Section (Replies) - Navy & Gold Theme */}
               {post.suggestedReplies && post.suggestedReplies.length > 0 && (
                 <div className="mt-8">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
                       <ZapIcon className="w-4 h-4 text-gold-dark" /> {t('reports.openingLines')}
                    </h3>
                    
                    <div className="space-y-3">
                      {post.suggestedReplies.map((reply, i) => (
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

               <div className="mt-8 pt-6 border-t border-gray-200 text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">{t('app.generatedBy')}</div>
           </div>
       </div>
    </div>
  );
};

export default PostReportPage;
