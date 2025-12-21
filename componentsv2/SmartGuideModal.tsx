
import React from 'react';
import { BrainIcon, ChartIcon, ZapIcon, ChevronRight } from './Icons';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  isOpen: boolean;
  type: 'PROFILE' | 'POST' | 'CHAT' | 'FEED' | 'UNKNOWN';
  targetName: string;
  avatarB64?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const SmartGuideModal: React.FC<Props> = ({ isOpen, type: rawType, targetName, avatarB64, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  // Fallback for safety
  const type = (rawType === 'UNKNOWN' || !rawType) ? 'PROFILE' : rawType;

  const getConfig = () => {
    switch (type) {
      case 'PROFILE':
        return {
          title: t('smartGuide.profile.title') || "Social Dossier Ready",
          subtitle: t('smartGuide.profile.subtitle') || "Profile Identified",
          icon: <ChartIcon className="w-6 h-6 text-gold" />,
          description: t('smartGuide.profile.desc', { name: targetName }) || `Identified ${targetName}'s profile.`,
          action: t('smartGuide.profile.action') || "Run Deep Psychological Audit",
          detail: t('smartGuide.profile.detail') || "AI will mine for hidden traits and persona masks."
        };
      case 'FEED':
        return {
          title: t('smartGuide.feed.title') || "Content Pattern Detected",
          subtitle: t('smartGuide.feed.subtitle') || "Timeline Analysis",
          icon: <ChartIcon className="w-6 h-6 text-gold" />,
          description: t('smartGuide.feed.desc', { name: targetName }) || `Detected content from ${targetName}.`,
          action: t('smartGuide.feed.action') || "Run Overall Profile Analysis",
          detail: t('smartGuide.feed.detail') || "Building comprehensive personality profile."
        };
      case 'POST':
        return {
          title: t('smartGuide.post.title') || "Content Decoded",
          subtitle: t('smartGuide.post.subtitle') || "Single Post Context",
          icon: <ZapIcon className="w-6 h-6 text-gold" />,
          description: t('smartGuide.post.desc', { name: targetName }) || `Captured a moment from ${targetName}.`,
          action: t('smartGuide.post.action') || "Analyze Micro-Expressions",
          detail: t('smartGuide.post.detail') || "Decoding subconscious motive and subtext."
        };
      case 'CHAT':
        return {
          title: t('smartGuide.chat.title') || "Conversation Captured",
          subtitle: t('smartGuide.chat.subtitle') || "Interaction Log",
          icon: <BrainIcon className="w-6 h-6 text-gold" />,
          description: t('smartGuide.chat.desc', { name: targetName }) || `Chat log with ${targetName} is ready.`,
          action: t('smartGuide.chat.action') || "Generate Relationship Strategy",
          detail: t('smartGuide.chat.detail') || "Assessing compatibility and red signals."
        };
      default:
        return { 
          title: "Intelligence Ready", 
          subtitle: "System Calibrated", 
          icon: <ChartIcon className="w-6 h-6 text-gold" />, 
          description: "Data has been synced to profile.", 
          action: "Continue to Analysis", 
          detail: "Refining psychological models." 
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-navy/80 backdrop-blur-sm animate-fade-in p-6">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-up relative">
        <div className="h-32 bg-navy relative p-6 flex items-center justify-center overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-gold opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <div className="text-center relative z-10">
              <div className="w-16 h-16 mx-auto bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20 mb-2">
                 {config.icon}
              </div>
              <div className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">{config.subtitle}</div>
           </div>
        </div>
        <div className="p-8 text-center space-y-6">
           <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-navy">{config.title}</h3>
              <p className="text-sm text-navy/60 font-medium leading-relaxed">
                {config.description} <br/>
                <span className="text-xs text-gray-400 mt-1 block">{config.detail}</span>
              </p>
           </div>
           <div className="flex items-center justify-center gap-3 py-4 border-t border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-200 shadow-sm">
                 {avatarB64 ? <img src={avatarB64} className="w-full h-full object-cover" alt="target" /> : <div className="w-full h-full flex items-center justify-center text-xs">?</div>}
              </div>
              <span className="font-serif font-bold text-navy">{targetName}</span>
              <span className="text-xs text-gray-400">{t('smartGuide.targetFile')}</span>
           </div>
           <div className="space-y-3">
              <button onClick={onConfirm} className="w-full py-4 bg-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-navy-light flex items-center justify-center gap-2 group">
                <span>{config.action}</span>
                <ChevronRight className="w-4 h-4 text-gold/80 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={onCancel} className="text-xs font-bold text-gray-400 hover:text-navy transition py-2">{t('smartGuide.skip')}</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SmartGuideModal;
