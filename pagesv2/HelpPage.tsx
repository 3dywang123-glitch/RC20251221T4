
import React, { useEffect, useRef } from 'react';
import { ChevronRight, BrainIcon, ChartIcon, ZapIcon, BookIcon } from '../componentsv2/Icons';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  onBack: () => void;
  anchor?: string;
}

const HelpPage: React.FC<Props> = ({ onBack, anchor }) => {
  const { t } = useTranslation();
  const screenshotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (anchor === 'screenshot' && screenshotRef.current) {
        setTimeout(() => {
            screenshotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
  }, [anchor]);

  return (
    <div className="h-full bg-cream flex flex-col animate-fade-in relative z-10">
       {/* Header */}
       <div className="bg-white/90 backdrop-blur-md p-4 shadow-sm flex items-center gap-3 sticky top-0 z-50 border-b border-gray-100 flex-shrink-0">
          <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-full transition active:scale-95">
             <ChevronRight className="rotate-180 w-6 h-6 text-navy" />
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-navy flex items-center gap-2">
                {t('help.title')}
            </h2>
            <p className="text-[10px] text-gray-400">{t('help.subtitle')}</p>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-cream scroll-smooth pb-24">
           
           {/* Intro Card */}
           <div className="bg-navy p-6 rounded-3xl shadow-lg relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                 <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                    <BookIcon className="w-6 h-6 text-gold" />
                 </div>
                 <h3 className="text-xl font-serif font-bold mb-2">{t('help.welcome')}</h3>
                 <p className="text-sm opacity-80 leading-relaxed">
                    {t('help.welcomeDesc')}
                 </p>
              </div>
           </div>

           {/* Quick Start Steps */}
           <div className="space-y-4">
              <h3 className="text-xs font-bold text-gold-dark uppercase tracking-[0.2em] ml-1">{t('help.quickStart')}</h3>
              
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                 <div>
                    <h4 className="font-bold text-navy text-sm mb-1">{t('help.steps.1.title')}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                       {t('help.steps.1.desc')}
                    </p>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                 <div>
                    <h4 className="font-bold text-navy text-sm mb-1">{t('help.steps.2.title')}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                       {t('help.steps.2.desc')}
                    </p>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                 <div>
                    <h4 className="font-bold text-navy text-sm mb-1">{t('help.steps.3.title')}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                       {t('help.steps.3.desc')}
                    </p>
                 </div>
              </div>
           </div>

           {/* Feature Deep Dives */}
           <div className="space-y-4">
              <h3 className="text-xs font-bold text-gold-dark uppercase tracking-[0.2em] ml-1">{t('help.coreModules')}</h3>
              
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <ChartIcon className="w-5 h-5 text-blue-500 mb-2" />
                    <h4 className="font-bold text-navy text-xs mb-1">{t('help.modules.detective.title')}</h4>
                    <p className="text-[10px] text-gray-400">{t('help.modules.detective.desc')}</p>
                 </div>
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <ZapIcon className="w-5 h-5 text-gold-dark mb-2" />
                    <h4 className="font-bold text-navy text-xs mb-1">{t('help.modules.micro.title')}</h4>
                    <p className="text-[10px] text-gray-400">{t('help.modules.micro.desc')}</p>
                 </div>
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <BrainIcon className="w-5 h-5 text-purple-500 mb-2" />
                    <h4 className="font-bold text-navy text-xs mb-1">{t('help.modules.persona.title')}</h4>
                    <p className="text-[10px] text-gray-400">{t('help.modules.persona.desc')}</p>
                 </div>
              </div>
           </div>

           {/* Screenshot Guide Anchor */}
           <div ref={screenshotRef} className="pt-4 space-y-4 scroll-mt-20">
              <h3 className="text-xs font-bold text-gold-dark uppercase tracking-[0.2em] ml-1">{t('help.screenshot.title')}</h3>
              
              <div className="bg-white border border-gold/30 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gold"></div>
                 
                 <h4 className="text-lg font-serif font-bold text-navy mb-4">{t('help.screenshot.howTo')}</h4>
                 
                 <div className="space-y-4">
                    <div>
                       <h5 className="text-xs font-bold text-navy uppercase mb-1">{t('help.screenshot.chat')}</h5>
                       <p className="text-xs text-gray-500 leading-relaxed">
                          {t('help.screenshot.chatDesc')}
                       </p>
                    </div>
                    
                    <div>
                       <h5 className="text-xs font-bold text-navy uppercase mb-1">{t('help.screenshot.profile')}</h5>
                       <p className="text-xs text-gray-500 leading-relaxed">
                          {t('help.screenshot.profileDesc')}
                       </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                       <h5 className="text-xs font-bold text-navy uppercase mb-2">{t('help.screenshot.shortcuts')}</h5>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <span className="block text-[10px] font-bold text-gray-400 uppercase">{t('help.screenshot.iphone')}</span>
                             <span className="text-sm font-bold text-navy">{t('help.screenshot.powerVolUp')}</span>
                          </div>
                          <div>
                             <span className="block text-[10px] font-bold text-gray-400 uppercase">{t('help.screenshot.android')}</span>
                             <span className="text-sm font-bold text-navy">{t('help.screenshot.powerVolDown')}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Privacy Note */}
           <div className="text-center px-8 py-4">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                 {t('help.privacy')}
              </p>
           </div>

       </div>
    </div>
  );
};

export default HelpPage;
