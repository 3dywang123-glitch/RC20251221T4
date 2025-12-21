
import React from 'react';
import { TargetProfile } from '../types';
import { PlusIcon, ChevronRight } from '../componentsv2/Icons';
import { getAvatarSrc } from '../utils';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  targets: TargetProfile[];
  onSelectTarget: (id: string) => void;
  onCreateTarget: () => void;
  onNavigate?: (view: string) => void;
}

const DirectoryPage: React.FC<Props> = ({ targets, onSelectTarget, onCreateTarget, onNavigate }) => {
  const { t, language } = useTranslation();

  // Filter sample profiles based on the current language
  const displayedTargets = targets.filter(target => {
    if (!target.isSample) {
      return true; // Always show user-created profiles
    }
    if (language === 'en') {
      return target.id === 'sample_mary';
    }
    if (language === 'cn') {
      return target.id === 'sample_vivi';
    }
    // Default fallback if language is somehow neither
    return false;
  });

  return (
    <div className="p-6 pb-24 space-y-8 bg-cream min-h-full">
      <header className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-3xl font-serif text-navy font-bold tracking-tight">{t('directory.title')}</h1>
          <p className="text-sm text-navy/60 mt-1 font-medium">{t('directory.subtitle')}</p>
        </div>
        <div className="flex gap-3 items-center">
          {onNavigate && (
             <button 
               onClick={() => onNavigate('user')}
               className="p-3 bg-white text-navy rounded-full shadow-sm hover:bg-gray-50 transition border border-gray-100"
               title={t('directory.settings')}
             >
               <span className="text-xl">⚙️</span>
             </button>
          )}
        </div>
      </header>

      <div className="grid gap-4">
        {displayedTargets.map(target => (
          <div 
            key={target.id} 
            onClick={() => onSelectTarget(target.id)}
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-5 active:scale-98 transition cursor-pointer hover:shadow-md hover:border-gold/30 group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm group-hover:border-gold/50 transition-colors">
              {target.avatarB64 ? (
                <img src={getAvatarSrc(target.avatarB64)} alt={target.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-navy/30">?</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                 <h3 className="text-lg font-bold text-navy truncate font-serif">{target.name}</h3>
                 {target.age && <span className="text-xs text-navy/40 font-medium">({target.age})</span>}
              </div>
              <p className="text-xs text-navy/60 truncate font-medium mt-0.5">{target.occupation || t('directory.noDetails')}</p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {target.personalityReport?.mbti && (
                   <span className="inline-block bg-gold/10 text-gold-dark text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-gold/20">
                     {target.personalityReport.mbti}
                   </span>
                )}
                <span className="inline-block bg-navy/5 text-navy text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                   {t('directory.consults')}: {target.consultationHistory ? target.consultationHistory.length : 0}
                </span>
              </div>
            </div>
            <ChevronRight className="text-gold/50 group-hover:text-gold transition-colors" />
          </div>
        ))}
        
        {/* Add New Card - Positioned at the end of the list */}
        <button 
          onClick={onCreateTarget}
          className="bg-[#F5F2EA] p-5 rounded-3xl border-2 border-dashed border-[#D4C5A5] flex items-center justify-center space-x-3 active:scale-95 transition cursor-pointer hover:bg-white hover:border-gold/50 hover:shadow-sm group h-[116px]"
        >
           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-colors text-gold-dark shadow-sm">
              <PlusIcon />
           </div>
           <span className="font-bold text-navy/60 group-hover:text-navy transition-colors text-sm uppercase tracking-wide">{t('directory.createNew')}</span>
        </button>

      </div>
    </div>
  );
};

export default DirectoryPage;
