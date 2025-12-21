
import React from 'react';
import { DiamondIcon, BrainIcon, SparklesIcon, ChevronRight } from './Icons';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  onSmartAnalyze: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

const WelcomeModal: React.FC<Props> = ({ onSmartAnalyze, onSkip, isLoading }) => {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-cream text-navy overflow-hidden h-[100dvh] w-full select-none">
      
      {/* 1. 语言切换器 - 独立响应式定位与缩放 */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50">
        <div 
          onClick={() => setLanguage(language === 'en' ? 'cn' : 'en')}
          className="relative flex items-center w-20 h-8 sm:w-24 sm:h-10 lg:w-28 lg:h-11 rounded-full border border-navy/5 cursor-pointer shadow-sm overflow-hidden bg-white hover:scale-105 transition-transform"
        >
          <div className="absolute inset-0 flex opacity-30">
            <div className="w-1/2 h-full bg-[#f8d7da]" />
            <div className="w-1/2 h-full bg-[#d1ecf1]" />
          </div>
          <div 
            className={`absolute top-0.5 bottom-0.5 w-9 sm:w-11 lg:w-[3.2rem] bg-white rounded-full shadow-md transition-all duration-300 ease-out z-10 ${
              language === 'cn' ? 'left-0.5' : 'left-[2.6rem] sm:left-[3.1rem] lg:left-[3.6rem]'
            }`}
          />
          <div className="relative flex justify-between items-center w-full px-2.5 sm:px-3.5 lg:px-4 z-20">
            <span className={`text-[10px] sm:text-xs lg:text-sm font-bold transition-all duration-300 ${language === 'cn' ? 'text-navy' : 'text-navy/30'}`}>中文</span>
            <span className={`text-[10px] sm:text-xs lg:text-sm font-bold transition-all duration-300 ${language === 'en' ? 'text-navy' : 'text-navy/30'}`}>EN</span>
          </div>
        </div>
      </div>

      {/* 2. 动态背景装饰 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[100vw] h-[100vw] bg-gold opacity-[0.04] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-navy opacity-[0.04] rounded-full blur-[120px]"></div>
      </div>

      {/* 3. 内容主容器 */}
      <div className="relative z-10 flex-1 flex flex-col items-center h-full px-6 sm:px-12 lg:px-20 overflow-hidden">
        
        <div className="w-full max-w-lg sm:max-w-2xl lg:max-w-4xl flex-1 flex flex-col items-center justify-center gap-10 sm:gap-14 lg:gap-20 animate-fade-in text-center min-h-0">
          
          {/* A. 品牌视觉组 - 独立三档缩放 (Balanced Proportions) */}
          <div className="flex flex-col items-center space-y-5 sm:space-y-8 lg:space-y-10">
            <div className="relative inline-block">
              {/* Logo container: Mobile(80px), Tablet(96px), Desktop(104px/w-26) */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-[6.5rem] lg:h-[6.5rem] bg-navy text-gold rounded-[1.8rem] sm:rounded-[2.2rem] lg:rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-navy/20 border border-gold/20 rotate-3 hover:rotate-0 transition-transform duration-700 relative overflow-hidden group">
                <DiamondIcon className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 relative z-10 group-hover:scale-110 transition-transform" />
                <BrainIcon className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 absolute -bottom-3 -right-3 text-gold/10 z-0 rotate-12" />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {/* Title font: Mobile(4xl), Tablet(5xl), Desktop(5xl) */}
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-serif font-bold text-navy tracking-tight leading-none">
                {t('app.name')}
                <span className="bg-gradient-to-br from-[#D4AF37] via-[#F5D061] to-[#B49228] bg-clip-text text-transparent ml-1 sm:ml-2">
                  {t('app.suffix')}
                </span>
              </h1>
              {/* Tagline size */}
              <p className="text-[10px] sm:text-sm lg:text-base font-bold text-navy/40 uppercase tracking-[0.3em] sm:tracking-[0.4em] lg:tracking-[0.5em] pl-1">
                {t('app.tagline')}
              </p>
            </div>
          </div>

          {/* B. 文案介绍组 */}
          <div className="max-w-[320px] sm:max-w-xl lg:max-w-3xl space-y-6 sm:space-y-8 lg:space-y-10">
            {/* Description text: Using font-handwriting ONLY for Chinese, reverting English to standard font */}
            <p className={`${
              language === 'cn' 
                ? 'font-handwriting text-xl sm:text-2xl lg:text-3xl' 
                : 'font-sans text-sm sm:text-base lg:text-lg font-semibold tracking-tight'
            } text-navy leading-relaxed sm:leading-relaxed lg:leading-relaxed whitespace-pre-wrap opacity-90`}>
              {t('app.description')}
            </p>
            {/* Academic note: Mobile(xs), Tablet(sm), Desktop(base) */}
            <p className={`font-sans font-bold leading-relaxed whitespace-pre-wrap uppercase tracking-wider transition-all duration-300 ${
              language === 'cn' 
                ? 'text-xs sm:text-sm lg:text-base text-navy/40 mt-4 sm:mt-6' 
                : 'text-[10px] sm:text-xs lg:text-sm text-navy/30'
            }`}>
              {t('app.academicNote')}
            </p>
          </div>

          {/* C. 交互按钮组 - 手机端宽度适配 (w-full max-w-sm) */}
          <div className="flex flex-col items-center w-full max-w-[280px] sm:max-w-sm lg:max-w-md">
            <button 
              onClick={onSmartAnalyze}
              disabled={isLoading}
              className="w-full py-5 sm:py-6 lg:py-7 bg-navy text-white rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] font-bold text-base sm:text-xl lg:text-2xl shadow-2xl shadow-navy/20 hover:bg-navy-light active:scale-[0.98] transition-all flex items-center justify-center gap-3 sm:gap-4 lg:gap-5 relative overflow-hidden group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t('welcome.initializing')}</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gold" />
                  <span>{t('welcome.startAnalysis')}</span>
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 opacity-60 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* 4. 底部区域 (Skip + Secure Badge) */}
        <div className="w-full flex flex-col items-center pb-8 sm:pb-10 lg:pb-12 mt-auto flex-shrink-0 gap-4 sm:gap-6 z-20">
           
           {/* Skip Button - Moved Here */}
           <button 
              onClick={onSkip}
              disabled={isLoading}
              className="text-navy/40 text-xs sm:text-sm lg:text-base font-bold hover:text-navy transition flex items-center gap-2 group p-2 animate-fade-in active:scale-95"
            >
              <span>{t('welcome.skip')}</span>
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

           {/* Secure Badge */}
           <div className="text-center opacity-20 pointer-events-none">
              <div className="px-4 py-2 sm:px-6 sm:py-3 border border-navy/10 rounded-full flex items-center gap-3 sm:gap-6 lg:gap-8 text-[9px] sm:text-xs lg:text-sm font-bold text-navy uppercase tracking-widest whitespace-nowrap overflow-hidden">
                {t('app.secureBadge')}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default WelcomeModal;
