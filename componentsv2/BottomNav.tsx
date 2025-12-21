
import React from 'react';
import { getAvatarSrc } from '../utils';
import { SparklesIcon } from './Icons';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  currentView: string;
  setView: (view: string) => void;
  hasActiveTarget: boolean;
  activeTargetAvatar?: string;
  onSmartImport: () => void;
}

const BottomNav: React.FC<Props> = ({ currentView, setView, hasActiveTarget, activeTargetAvatar, onSmartImport }) => {
  const { t } = useTranslation();
  
  const navItemClass = (isActive: boolean, disabled: boolean = false) => `
    flex flex-col items-center justify-center space-y-0.5 w-full transition-all
    ${disabled ? 'opacity-30 pointer-events-none' : 'cursor-pointer'}
    ${isActive ? 'text-navy font-bold' : 'text-gray-400 hover:text-navy'}
  `;

  const isAlreadyInAnalysis = currentView === 'analysis' || currentView === 'social';

  return (
    <div className="fixed bottom-0 left-0 w-full bg-cream-dark/95 backdrop-blur-md border-t border-gray-200 pb-safe px-2 z-50 h-12 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-end h-full pb-1">
        
        {/* 1. Directory */}
        <button
          onClick={() => setView('directory')}
          className={navItemClass(currentView === 'directory')}
        >
          <div className="h-4 flex items-center justify-center text-base">📂</div>
          <span className="text-[8px] uppercase tracking-wider">{t('nav.directory')}</span>
        </button>

        {/* 2. Profile */}
        <button
          onClick={() => setView('profile')}
          disabled={!hasActiveTarget}
          className={navItemClass(currentView === 'profile', !hasActiveTarget)}
        >
          <div className="h-4 w-4 flex items-center justify-center">
            {(hasActiveTarget && activeTargetAvatar) ? (
              <img src={getAvatarSrc(activeTargetAvatar)} className="w-4 h-4 rounded-full object-cover shadow-sm border border-gray-200" alt="profile" />
            ) : (
              <span className="text-base">👤</span>
            )}
          </div>
          <span className="text-[8px] uppercase tracking-wider">{t('nav.profile')}</span>
        </button>

        {/* 3. ANALYZE (Center) - GOLD CIRCLE */}
        <button
          onClick={(e) => {
             if (isAlreadyInAnalysis) return;
             e.preventDefault();
             e.stopPropagation();
             onSmartImport();
          }}
          disabled={isAlreadyInAnalysis}
          className={`${navItemClass(currentView === 'analysis', false)} ${isAlreadyInAnalysis ? '!opacity-40 !pointer-events-none grayscale' : '!pointer-events-auto'}`}
          style={{ zIndex: 60 }} // Ensure it stays on top
        >
          <div className={`relative flex items-center justify-center transition-transform ${currentView === 'analysis' ? '-translate-y-1' : '-translate-y-0.5'}`}>
             <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-4 border-cream bg-gold text-white">
                <SparklesIcon className="w-4 h-4" />
             </div>
          </div>
          <span className={`text-[8px] uppercase tracking-wider font-bold -mt-1 ${currentView === 'analysis' ? 'text-navy' : ''}`}>{t('nav.analyze')}</span>
        </button>

        {/* 4. Simulate (Chat) */}
        <button
          onClick={() => setView('simulate')}
          disabled={!hasActiveTarget}
          className={navItemClass(currentView === 'simulate', !hasActiveTarget)}
        >
          <div className="h-4 flex items-center justify-center text-base">💬</div>
          <span className="text-[8px] uppercase tracking-wider">{t('nav.simulate')}</span>
        </button>

        {/* 5. User (Config) */}
        <button
          onClick={() => setView('user')}
          className={navItemClass(currentView === 'user')}
        >
          <div className="h-4 flex items-center justify-center text-base">⚙️</div>
          <span className="text-[8px] uppercase tracking-wider">{t('nav.config')}</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;
