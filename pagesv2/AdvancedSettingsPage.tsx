
import React, { useState, useEffect } from 'react';
import { BrainIcon, ChartIcon, ZapIcon, ChevronRight, BookIcon } from '../componentsv2/Icons';
import { resetAi } from '../servicesv2/ai/core';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  onBack: () => void;
  onTestLoading: (type: 'social' | 'post' | 'chat' | 'default' | 'personality') => void;
  onViewHelp?: () => void;
}

const AdvancedSettingsPage: React.FC<Props> = ({ onBack, onTestLoading, onViewHelp }) => {
  const { t } = useTranslation();
  const [aiModel, setAiModel] = useState<string>('gemini-3-flash-preview');
  const [analysisModel, setAnalysisModel] = useState<string>('gemini-3-flash-preview');
  const [apiEndpoint, setApiEndpoint] = useState<string>('https://hnd1.aihub.zeabur.ai/');

  useEffect(() => {
    const savedModel = localStorage.getItem('soulsync_model_preference');
    if (savedModel) setAiModel(savedModel);
    
    const savedAnalysisModel = localStorage.getItem('soulsync_analysis_model_preference');
    if (savedAnalysisModel) setAnalysisModel(savedAnalysisModel);
    
    const savedEndpoint = localStorage.getItem('soulsync_api_endpoint');
    if (savedEndpoint) setApiEndpoint(savedEndpoint);
  }, []);

  const handleModelChange = (model: string) => {
    setAiModel(model);
    localStorage.setItem('soulsync_model_preference', model);
  };

  const handleAnalysisModelChange = (model: string) => {
    setAnalysisModel(model);
    localStorage.setItem('soulsync_analysis_model_preference', model);
  };

  const handleEndpointChange = (endpoint: string) => {
    setApiEndpoint(endpoint);
    localStorage.setItem('soulsync_api_endpoint', endpoint);
    resetAi(); 
  };

  return (
    <div className="h-full bg-cream flex flex-col animate-fade-in relative z-10">
       {/* Header */}
       <div className="bg-white/90 backdrop-blur-md p-4 shadow-sm flex items-center gap-3 sticky top-0 z-50 border-b border-gray-100 flex-shrink-0">
          <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-full transition active:scale-95">
             <ChevronRight className="rotate-180 w-6 h-6 text-navy" />
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-navy">
                {t('settings.title')}
            </h2>
            <p className="text-[10px] text-gray-400">{t('settings.subtitle')}</p>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cream scroll-smooth pb-24">
           
           {/* Help Button */}
           <button 
             onClick={() => onViewHelp && onViewHelp()}
             className="w-full bg-white py-4 px-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition group hover:border-gold/30 hover:shadow-md"
           >
             <div className="flex items-center space-x-4">
               <div className="p-2.5 bg-gold/10 text-gold-dark rounded-xl"><BookIcon className="w-5 h-5" /></div>
               <div>
                 <span className="font-bold text-navy text-sm block">{t('settings.help')}</span>
                 <span className="text-[10px] text-gray-400">{t('settings.helpDesc')}</span>
               </div>
             </div>
             <ChevronRight className="text-gray-300 group-hover:text-gold transition" />
           </button>

           {/* General AI Model */}
           <div className="bg-white py-4 px-5 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 bg-navy/5 text-navy rounded-xl"><BrainIcon className="w-5 h-5" /></div>
                    <div>
                      <span className="font-bold text-navy text-sm block">{t('settings.model')}</span>
                      <span className="text-[10px] text-gray-400">{t('settings.current')}: {aiModel}</span>
                    </div>
                  </div>
               </div>

               <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
                  <button 
                    onClick={() => handleModelChange('gemini-3-flash-preview')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${aiModel === 'gemini-3-flash-preview' ? 'bg-white text-navy shadow-sm border border-gray-100' : 'text-gray-400 hover:text-navy'}`}
                  >
                     ⚡ Gemini 3 Flash
                  </button>
               </div>
               <div className="mt-3 text-[10px] text-green-600 bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-2">
                  <ZapIcon className="w-3 h-3" />
                  {t('settings.optimized')}
               </div>
           </div>

           {/* Deep Analysis Model */}
           <div className="bg-white py-4 px-5 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 bg-gold/10 text-gold-dark rounded-xl"><ChartIcon /></div>
                    <div>
                      <span className="font-bold text-navy text-sm block">{t('settings.deepModel')}</span>
                      <span className="text-[10px] text-gray-400">{t('settings.deepModelDesc')}</span>
                    </div>
                  </div>
               </div>

               <div className="flex flex-col gap-2">
                  <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100 gap-1">
                      <button
                        onClick={() => handleAnalysisModelChange('gemini-3-pro')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${analysisModel === 'gemini-3-pro' ? 'bg-navy text-white shadow-sm' : 'text-gray-400 hover:text-navy'}`}
                      >
                        Gemini 3 Pro
                      </button>
                      <button
                        onClick={() => handleAnalysisModelChange('gemini-3-flash-preview')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${analysisModel === 'gemini-3-flash-preview' ? 'bg-navy text-white shadow-sm' : 'text-gray-400 hover:text-navy'}`}
                      >
                        Gemini 3 Flash
                      </button>
                  </div>
                  <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100 gap-1">
                      <button
                        onClick={() => handleAnalysisModelChange('chatgpt-5-2')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${analysisModel === 'chatgpt-5-2' ? 'bg-navy text-white shadow-sm' : 'text-gray-400 hover:text-navy'}`}
                      >
                        ChatGPT 5.2
                      </button>
                      <button
                        onClick={() => handleAnalysisModelChange('claude-sonnet-4-5')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${analysisModel === 'claude-sonnet-4-5' ? 'bg-navy text-white shadow-sm' : 'text-gray-400 hover:text-navy'}`}
                      >
                        Claude Sonnet 4.5
                      </button>
                  </div>
               </div>
               
               <div className="mt-3 text-[10px] text-navy/60 bg-gray-50 p-2 rounded-lg border border-gray-100 leading-relaxed">
                  <strong>Selected: {analysisModel}</strong>. {t('settings.advancedReasoning')}
               </div>
           </div>

           {/* API Region */}
           <div className="bg-white py-4 px-5 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 bg-navy/5 text-navy rounded-xl">🌐</div>
                    <div>
                      <span className="font-bold text-navy text-sm block">{t('settings.region')}</span>
                      <span className="text-[10px] text-gray-400">{t('settings.optimization')}</span>
                    </div>
                  </div>
               </div>

               <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
                  <button 
                    onClick={() => handleEndpointChange('https://hnd1.aihub.zeabur.ai/')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${apiEndpoint === 'https://hnd1.aihub.zeabur.ai/' ? 'bg-white text-navy shadow-sm border border-gray-100' : 'text-gray-400 hover:text-navy'}`}
                  >
                     Tokyo (HND1)
                  </button>
                  <button 
                    onClick={() => handleEndpointChange('https://sfo1.aihub.zeabur.ai/')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${apiEndpoint === 'https://sfo1.aihub.zeabur.ai/' ? 'bg-white text-navy shadow-sm border border-gray-100' : 'text-gray-400 hover:text-navy'}`}
                  >
                     San Francisco (SFO1)
                  </button>
               </div>
           </div>

           {/* Loading Screen Test Tools */}
           <div className="bg-white py-4 px-5 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl"><ZapIcon className="w-5 h-5" /></div>
                    <div>
                      <span className="font-bold text-navy text-sm block">{t('settings.testTools')}</span>
                      <span className="text-[10px] text-gray-400">{t('settings.testDesc')}</span>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onTestLoading('default')}
                    className="py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-navy hover:bg-navy hover:text-white transition active:scale-95"
                  >
                    {t('settings.testDefault')}
                  </button>
                  <button 
                    onClick={() => onTestLoading('personality')}
                    className="py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-navy hover:bg-navy hover:text-white transition active:scale-95"
                  >
                    {t('settings.testPersonality')}
                  </button>
                  <button 
                    onClick={() => onTestLoading('social')}
                    className="py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-navy hover:bg-navy hover:text-white transition active:scale-95"
                  >
                    {t('settings.testSocial')}
                  </button>
                  <button 
                    onClick={() => onTestLoading('post')}
                    className="py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-navy hover:bg-navy hover:text-white transition active:scale-95"
                  >
                    {t('settings.testPost')}
                  </button>
               </div>
           </div>

       </div>
    </div>
  );
};

export default AdvancedSettingsPage;
