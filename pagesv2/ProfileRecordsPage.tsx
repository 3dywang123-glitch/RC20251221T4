
import React from 'react';
import { TargetProfile } from '../types';
import { ChevronRight, BrainIcon, ChartIcon, ZapIcon } from '../componentsv2/Icons';
import { getAvatarSrc } from '../utils';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  target: TargetProfile | null;
  onBack: () => void;
}

const ProfileRecordsPage: React.FC<Props> = ({ target, onBack }) => {
  const { t } = useTranslation();
  if (!target) return null;

  const socialHistory = target.socialAnalysisHistory ? [...target.socialAnalysisHistory].reverse() : [];
  const postHistory = target.postAnalysisHistory ? [...target.postAnalysisHistory] : [];
  const consultHistory = target.consultationHistory ? [...target.consultationHistory].reverse() : [];

  return (
    <div className="h-full bg-cream flex flex-col animate-fade-in relative z-10">
       {/* Header */}
       <div className="bg-white/90 backdrop-blur-md p-4 shadow-sm flex items-center gap-3 sticky top-0 z-50 border-b border-gray-100 flex-shrink-0">
          <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-full transition active:scale-95">
             <ChevronRight className="rotate-180 w-6 h-6 text-navy" />
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-navy flex items-center gap-2">
                Data Archive
            </h2>
            <p className="text-[10px] text-gray-400">Master Record of User Inputs & Analysis</p>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-cream scroll-smooth pb-24">
           
           {/* Section 1: Identity Document */}
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-navy opacity-5 rounded-full blur-xl -mr-8 -mt-8"></div>
              
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                📁 {t('reports.identityDoc')}
              </h3>
              
              <div className="flex items-start gap-4">
                 <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                    <img src={getAvatarSrc(target.avatarB64)} className="w-full h-full object-cover" alt="avatar" />
                 </div>
                 <div className="space-y-1">
                    <div className="text-lg font-serif font-bold text-navy">{target.name}</div>
                    <div className="text-xs text-gray-500">
                       <span className="font-bold">{t('profile.occupation')}:</span> {target.occupation}
                    </div>
                    <div className="text-xs text-gray-500">
                       <span className="font-bold">{t('profile.age')}:</span> {target.age || 'N/A'}
                    </div>
                 </div>
              </div>
              
              {target.bio && (
                 <div className="mt-4 bg-gray-50 p-3 rounded-xl text-xs text-navy leading-relaxed border-l-2 border-navy/20">
                    <span className="font-bold block mb-1">{t('profile.bio')}:</span>
                    "{target.bio}"
                 </div>
              )}
           </div>

           {/* Section 2: Visual Evidence */}
           {(target.additionalImages && target.additionalImages.length > 0) && (
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   📸 {t('reports.visualEvidence')}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                   {target.additionalImages.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                         <img src={img} className="w-full h-full object-cover" alt={`evidence-${idx}`} />
                      </div>
                   ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic">
                   Reference photos uploaded for personality analysis.
                </p>
             </div>
           )}

           {/* Section 3: Digital Footprint (Social Links) */}
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 🌐 {t('reports.digitalFootprint')}
              </h3>
              
              {socialHistory.length > 0 ? (
                 <div className="space-y-3">
                    {socialHistory.map((record, i) => (
                       <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white text-blue-500 flex items-center justify-center font-bold text-xs border border-gray-200">
                             {record.platform.substring(0, 1)}
                          </div>
                          <div>
                             <div className="text-xs font-bold text-navy">{record.platform} Profile</div>
                             <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{record.url}</div>
                             <div className="mt-1 flex gap-1">
                                <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 rounded">
                                   {record.personaImpression || (record as any).contentType || 'Analysis'}
                                </span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="text-xs text-gray-400 italic">{t('analysis.history.noSocial')}</div>
              )}
           </div>

           {/* Section 4: Behavioral Logs (Posts) */}
           {postHistory.length > 0 && (
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   💬 {t('reports.behavioralLogs')}
                </h3>
                <div className="space-y-3">
                   {postHistory.map((post, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-navy bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                               {new Date(post.timestamp).toLocaleDateString()}
                            </span>
                            {post.tags && post.tags[0] && (
                               <span className="text-[9px] text-gray-500">#{post.tags[0]}</span>
                            )}
                         </div>
                         <div className="text-xs text-navy italic mb-2">
                            "{post.content || '[Image Only Post]'}"
                         </div>
                         {(post.images || post.imageB64) && (
                            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                               {(post.images || [post.imageB64!]).map((img, idx) => (
                                  <img key={idx} src={img} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                               ))}
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
           )}

           {/* Section 5: Consultation Logs */}
           {consultHistory.length > 0 && (
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   🩺 {t('reports.consultationContexts')}
                </h3>
                <div className="space-y-3">
                   {consultHistory.map((consult, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-purple-600 uppercase">
                               {consult.goalContext || 'General Session'}
                            </span>
                            <span className="text-[10px] text-gray-400">{new Date(consult.generatedAt).toLocaleDateString()}</span>
                         </div>
                         <div className="text-xs text-navy mb-1">
                            <span className="font-bold">Outcome:</span> {consult.statusAssessment.substring(0, 60)}...
                         </div>
                         {consult.partnerPersonalityAnalysis && (
                            <div className="text-[10px] text-gray-500 mt-1 border-t border-gray-200 pt-1">
                               <span className="font-bold">Insight:</span> {consult.partnerPersonalityAnalysis.substring(0, 80)}...
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
           )}
           
           <div className="text-center text-[10px] text-gray-400 pt-6 px-8 leading-relaxed">
              {t('reports.archiveFooter')}
           </div>

       </div>
    </div>
  );
};

export default ProfileRecordsPage;
