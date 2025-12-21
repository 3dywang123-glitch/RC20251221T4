
import React, { useState, useEffect } from 'react';
import AuthPage from './pagesv2/AuthPage';
import DirectoryPage from './pagesv2/DirectoryPage';
import ProfilePage from './pagesv2/ProfilePage';
import AnalysisPage from './pagesv2/AnalysisPage'; 
import ChatPage from './pagesv2/ChatPage';
import UserPage from './pagesv2/UserPage';
import PaymentPage from './pagesv2/PaymentPage';
import SmartAnalysisPage from './pagesv2/SmartAnalysisPage';
import PostReportPage from './pagesv2/PostReportPage';
import PersonalityReportPage from './pagesv2/PersonalityReportPage';
import ProfileRecordsPage from './pagesv2/ProfileRecordsPage';
import OverviewReportPage from './pagesv2/OverviewReportPage';
import ChatLogReportPage from './pagesv2/ChatLogReportPage';
import AdvancedSettingsPage from './pagesv2/AdvancedSettingsPage';
import HelpPage from './pagesv2/HelpPage';

import BottomNav from './componentsv2/BottomNav';
import LoadingScreen from './componentsv2/LoadingScreen';
import WelcomeModal from './componentsv2/WelcomeModal';

import * as Storage from './servicesv2/storageService';
import * as AuthService from './servicesv2/authService';
import * as Gemini from './servicesv2/geminiService';
import { User, TargetProfile, ChatSession, SocialPostAnalysis, RelationshipReport, SocialAnalysisResult, UserProfile, ChatMessage } from './types';
import { LanguageProvider, useTranslation } from './contextsv2/LanguageContext';

function AppContent() {
  const { t, language } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [viewState, setViewState] = useState<string>('auth');
  const [targets, setTargets] = useState<TargetProfile[]>([]);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [draftTarget, setDraftTarget] = useState<TargetProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [loadingType, setLoadingType] = useState<'social' | 'post' | 'chat' | 'default' | 'personality'>('default');
  
  // Specific View State
  const [selectedPost, setSelectedPost] = useState<SocialPostAnalysis | null>(null);
  const [selectedReport, setSelectedReport] = useState<RelationshipReport | null>(null);
  const [selectedSocialReport, setSelectedSocialReport] = useState<SocialAnalysisResult | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'overall' | 'post' | 'chatlog'>('overall');

  // Chat State
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession>({ targetId: '', messages: [] });
  const [replyOptions, setReplyOptions] = useState<string[]>([]);
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [isChatAnalyzing, setIsChatAnalyzing] = useState(false);

  // Welcome / Context State
  const [showWelcome, setShowWelcome] = useState(true);
  
  const [prefillData, setPrefillData] = useState<{
    type: 'PROFILE'|'POST'|'CHAT'|'FEED', images: string[], context?: string
  } | null>(null);

  // Help System State
  const [helpAnchor, setHelpAnchor] = useState<string | undefined>(undefined);
  const [returnView, setReturnView] = useState<string>('directory');

  const activeTarget = activeTargetId ? (targets.find(t => t.id === activeTargetId) || null) : draftTarget;

  // --- HISTORY MANAGEMENT ---
  useEffect(() => {
    if (!window.history.state) {
        window.history.replaceState({ view: 'auth' }, '');
    }
    const onPopState = (event: PopStateEvent) => {
        if (event.state && event.state.view) {
            setViewState(event.state.view);
        }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setView = (newView: string) => {
    if (newView !== viewState) {
        setViewState(newView);
        window.history.pushState({ view: newView }, '');
    }
  };

  // Init
  useEffect(() => {
    const session = AuthService.getSession();
    if (session) {
      setUser(session);
      Storage.setContext(session.id);
      setTargets(Storage.getTargets());
      setView('directory');
    } else {
      setView('auth');
    }
    setShowWelcome(true);
  }, []);

  useEffect(() => {
    if (activeTargetId) {
      const session = Storage.getChatSession(activeTargetId);
      setCurrentChatSession(session);
      setReplyOptions([]);
    }
  }, [activeTargetId]);

  // Language switch side-effect
  useEffect(() => {
    if ((language === 'cn' && activeTargetId === 'sample_mary') ||
        (language === 'en' && activeTargetId === 'sample_vivi')) {
      setActiveTargetId(null);
    }
  }, [language, activeTargetId]);

  const handleAuthSuccess = (u: User) => {
    setUser(u);
    Storage.setContext(u.id);
    setTargets(Storage.getTargets());
    setView('directory');
    setShowWelcome(false);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    setTargets([]);
    setActiveTargetId(null);
    setDraftTarget(null);
    setView('auth');
  };

  const refreshTargets = () => {
    setTargets(Storage.getTargets());
  };

  const handleStorageError = (e: any) => {
    if (e.message === 'STORAGE_FULL') {
      alert(t('errors.storageFull'));
    } else if (e.message === 'STORAGE_LIMIT_REACHED') {
      alert(t('errors.storageLimit'));
    } else if (e.message === 'CHAT_HISTORY_FULL') {
      alert(t('errors.chatHistoryFull'));
    } else {
      console.error(e);
    }
  };

  const handleUpdateTarget = (id: string, updates: Partial<TargetProfile>) => {
    try {
      if (id === 'new' && draftTarget) {
        const newTarget: TargetProfile = { ...draftTarget, ...updates, id: Date.now().toString() };
        Storage.saveTarget(newTarget);
        refreshTargets();
        setDraftTarget(null);
        setActiveTargetId(newTarget.id);
      } else {
        const target = targets.find(t => t.id === id);
        if (target) {
          const updated = { ...target, ...updates };
          Storage.saveTarget(updated);
          setTargets(prev => prev.map(t => t.id === id ? updated : t));
        }
      }
    } catch (e) {
      handleStorageError(e);
    }
  };

  const handleSmartAnalysisSuccess = (newTarget: TargetProfile, type: 'PROFILE' | 'POST' | 'CHAT' | 'FEED', images: string[], contextNote?: string) => {
    try {
      Storage.saveTarget(newTarget);
      setTargets(prev => {
          const idx = prev.findIndex(t => t.id === newTarget.id);
          if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = newTarget;
              return copy;
          }
          return [...prev, newTarget];
      });
      setDraftTarget(null);
      setActiveTargetId(newTarget.id);
      setPrefillData({ type, images, context: contextNote });
      
      setView('analysis'); 
    } catch (e) {
      handleStorageError(e);
    }
  };

  const handleViewHelp = (section?: string) => {
     setReturnView(viewState);
     setHelpAnchor(section);
     setView('help');
  };

  const handleGuestEntry = async (targetView: string) => {
    setLoading(true);
    setLoadingType('default'); 
    setLoadingText(t('app.loadingStates.guest'));
    try {
      const guestUser = await AuthService.loginAsGuest();
      setUser(guestUser);
      Storage.setContext(guestUser.id);
      setTargets(Storage.getTargets());
      setView(targetView);
      setShowWelcome(false);
    } catch (e) {
      console.error("Guest login failed", e);
      alert(t('app.alerts.guestFailed'));
    } finally {
      setLoading(false);
    }
  };

  // --- Core Analysis Service Calls ---

  const runConsultation = async (context: { stage: string, goal: string, duration: string, chatLogs: string, chatImages: string[] }) => {
    if (!activeTarget || !user) return;
    setLoading(true);
    setLoadingType('chat');
    setLoadingText(t('app.loadingStates.consult'));

    try {
        const report = await Gemini.analyzeChatLog(activeTarget, Storage.getUserProfile(), context, language);
        
        report.archivedInput = {
            chatLogs: context.chatLogs,
            images: context.chatImages
        };

        const updatedHistory = [...(activeTarget.consultationHistory || []), report];
        handleUpdateTarget(activeTarget.id, { consultationHistory: updatedHistory });
        setSelectedReport(report);
        setView('chatlog-report'); 
    } catch (e) {
        console.error(e);
        alert(t('app.alerts.consultFailed'));
    } finally {
        setLoading(false);
    }
  };

  const runSocialProfileAnalysis = async (url: string, screenshots: string[]) => {
    if (!activeTarget) return;
    setLoading(true);
    setLoadingType('social');
    setLoadingText(t('app.loadingStates.social'));

    try {
        const result = await Gemini.analyzeProfileOverview(url, screenshots, language);
        
        const finalHistory = [...(activeTarget.socialAnalysisHistory || []), result];
        const profileUpdates: Partial<TargetProfile> = { socialAnalysisHistory: finalHistory };
        if (!activeTarget.socialLinks && url) profileUpdates.socialLinks = url;
        
        handleUpdateTarget(activeTarget.id, profileUpdates);
        setSelectedSocialReport(result);
        setView('overview-report');
    } catch (e) {
        console.error(e);
        alert(t('app.alerts.socialFailed'));
    } finally {
        setLoading(false);
    }
  };

  const runPostAnalysis = async (content: string, images: string[]) => {
     if (!activeTarget) return;
     setLoading(true);
     setLoadingType('post');
     setLoadingText(t('app.loadingStates.post'));

     try {
         const { analysis, suggestedReplies, tags } = await Gemini.analyzePost(content, images, language);
         
         const finalPost: SocialPostAnalysis = {
            id: Date.now().toString(),
            content,
            images,
            analysis,
            suggestedReplies,
            tags,
            timestamp: Date.now(),
            status: 'completed'
         };
         
         const finalHistory = [...(activeTarget.postAnalysisHistory || []), finalPost];
         handleUpdateTarget(activeTarget.id, { postAnalysisHistory: finalHistory });
         setSelectedPost(finalPost);
         setView('post-report');
     } catch (e) {
         console.error(e);
         alert(t('app.alerts.postFailed'));
     } finally {
         setLoading(false);
     }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeTarget) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user' as const, text, timestamp: Date.now() };
    const updatedMessages = [...currentChatSession.messages, userMsg];
    const updatedSession = { ...currentChatSession, messages: updatedMessages };
    
    setCurrentChatSession(updatedSession);
    try {
      Storage.saveChatSession(updatedSession);
    } catch (e) {
      handleStorageError(e);
    }
    
    setIsChatAnalyzing(true); 
    try {
        const critique = await Gemini.analyzeUserMessage(activeTarget, text);
        const messagesWithCritique = updatedMessages.map(m => 
            m.id === userMsg.id ? { ...m, userCritique: critique } : m
        );
        const sessionWithCritique = { ...updatedSession, messages: messagesWithCritique };
        setCurrentChatSession(sessionWithCritique);
        try {
          Storage.saveChatSession(sessionWithCritique);
        } catch (e) {
          handleStorageError(e);
        }
    } catch (e) {
        console.error("Critique failed", e);
    } finally {
        setIsChatAnalyzing(false);
    }
  };

  const handlePartnerReplyAnalysis = async (text: string, manualInsight?: string) => {
     if (!activeTarget) return;
     setIsChatAnalyzing(true);
     try {
        let insight = manualInsight;
        if (!insight) {
           insight = await Gemini.analyzePartnerMessage(activeTarget, text);
        }
        
        const partnerMsg = { 
           id: Date.now().toString(), 
           sender: 'persona' as const, 
           text: text, 
           timestamp: Date.now(),
           coachInsight: insight
        };
        const updated = { ...currentChatSession, messages: [...currentChatSession.messages, partnerMsg] };
        setCurrentChatSession(updated);
        try {
          Storage.saveChatSession(updated);
        } catch (e) {
          handleStorageError(e);
        }
        
        Gemini.generateReplyOptions(activeTarget, [{ sender: 'persona', text }]).then(opts => {
           setReplyOptions(opts);
        });

     } catch (e) {
        console.error(e);
     } finally {
        setIsChatAnalyzing(false);
     }
  };

  const handleRunPersonalityAnalysis = async (supplementaryInfo?: string, customImages?: string[]) => {
    if (!activeTarget || !user) return;
    setLoading(true);
    setLoadingType('personality');
    setLoadingText(t('app.loadingStates.personality'));

    try {
       const allAdditionalImages = [
          ...(activeTarget.additionalImages || []),
          ...(customImages || [])
       ];

       const report = await Gemini.analyzePersonality(
          { name: activeTarget.name, occupation: activeTarget.occupation, bio: activeTarget.bio, age: activeTarget.age, socialLinks: activeTarget.socialLinks },
          activeTarget.avatarB64,
          allAdditionalImages,
          { texts: [], images: [] },
          activeTarget.socialAnalysisHistory || [],
          activeTarget.postAnalysisHistory || [],
          activeTarget.avatarAnalysis,
          activeTarget.consultationHistory,
          supplementaryInfo,
          language
       );
       
       handleUpdateTarget(activeTarget.id, { personalityReport: report });
       setView('personality');

    } catch (e) {
       console.error(e);
       alert(t('app.alerts.personalityFailed'));
    } finally {
       setLoading(false);
    }
  };

  const handleTestLoading = (type: 'social' | 'post' | 'chat' | 'default' | 'personality') => {
     setLoading(true);
     setLoadingType(type);
     setLoadingText(t('app.loadingStates.test'));
     setTimeout(() => {
        setLoading(false);
     }, 10000);
  };

  const renderView = () => {
    if (showWelcome) {
       return (
         <WelcomeModal 
           onSmartAnalyze={() => {
               if (user) {
                   setShowWelcome(false);
                   setView('smart-analysis');
               } else {
                   handleGuestEntry('smart-analysis');
               }
           }} 
           onSkip={() => {
               if (user) {
                   setShowWelcome(false);
                   setView('directory');
               } else {
                   setShowWelcome(false);
                   setView('auth');
               }
           }} 
           isLoading={loading}
         />
       );
    }
    
    if (!user || viewState === 'auth') {
       return <AuthPage onAuthSuccess={handleAuthSuccess} />;
    }

    if (viewState === 'help') {
       return <HelpPage onBack={() => setView(returnView)} anchor={helpAnchor} />;
    }

    if (viewState === 'smart-analysis') {
       return (
         <SmartAnalysisPage 
           targets={targets} 
           onCancel={() => {
              if (activeTarget) {
                 setView('analysis');
              } else {
                 setActiveTargetId(null);
                 setDraftTarget({ 
                    id: 'new', 
                    name: '', 
                    age: '', 
                    occupation: '', 
                    bio: '', 
                    socialMediaData: [], 
                    consultationHistory: [], 
                    socialAnalysisHistory: [], 
                    postAnalysisHistory: [] 
                 });
                 setView('profile');
              }
           }} 
           onSuccess={handleSmartAnalysisSuccess} 
           initialMergeTargetId={activeTargetId && !activeTarget?.isSample ? activeTargetId : undefined}
         />
       );
    }

    if (viewState === 'user') {
       const userProfile = Storage.getUserProfile();
       const mergedProfile = { ...userProfile, name: user.name, avatarB64: user.avatarB64, subscriptionTier: user.subscriptionTier, isVip: user.isVip };
       
       return <UserPage profile={mergedProfile} userAuth={user} onUpdateProfile={(p) => { setUser({...user, ...p}); Storage.saveUserProfile({...p}); }} onNavigate={setView} onLogout={handleLogout} />;
    }

    if (viewState === 'advanced-settings') {
       return <AdvancedSettingsPage onBack={() => setView('user')} onTestLoading={handleTestLoading} onViewHelp={handleViewHelp} />;
    }

    if (viewState === 'payment') {
       return <PaymentPage onNavigate={setView} />;
    }

    if (viewState === 'directory') {
       return (
         <DirectoryPage 
            targets={targets} 
            onSelectTarget={(id) => { 
                setDraftTarget(null);
                setActiveTargetId(id); 
                setView('profile'); 
            }} 
            onCreateTarget={() => { 
                setActiveTargetId(null);
                setDraftTarget({ id: 'new', name: '', age: '', occupation: '', bio: '', socialMediaData: [], consultationHistory: [], socialAnalysisHistory: [], postAnalysisHistory: [] });
                setView('profile'); 
            }} 
            onNavigate={setView} 
         />
       );
    }

    if (!activeTarget && viewState !== 'directory' && viewState !== 'analysis' && viewState !== 'social') {
       setView('directory');
       return null;
    }

    if (viewState === 'profile') {
       return (
         <ProfilePage 
            target={activeTarget} 
            onUpdateTarget={(updates) => handleUpdateTarget(activeTarget!.id, updates)}
            onDeleteTarget={(id) => { 
                if (id === 'new') { setDraftTarget(null); } else { Storage.deleteTarget(id); setTargets(Storage.getTargets()); }
                setView('directory'); 
            }}
            onAnalyze={(info, images) => handleRunPersonalityAnalysis(info, images)}
            onNavigate={setView}
            isNewProfile={!activeTargetId}
            onProfileSaved={() => { if (!activeTargetId) { const all = Storage.getTargets(); if (all.length > 0) setActiveTargetId(all[all.length - 1].id); } }}
            onSmartImport={() => setView('smart-analysis')}
            onSelectHistoryItem={(type, item) => {
               if (type === 'consult') { setSelectedReport(item); setView('chatlog-report'); }
               if (type === 'post') { setSelectedPost(item); setView('post-report'); }
               if (type === 'social') { setSelectedSocialReport(item); setView('overview-report'); }
            }}
         />
       );
    }

    if (viewState === 'analysis' || viewState === 'social') {
       return (
         <AnalysisPage 
           target={activeTarget}
           onAnalyzeProfile={runSocialProfileAnalysis}
           onAnalyzePost={runPostAnalysis}
           onRunConsult={runConsultation}
           onNavigate={setView}
           onViewPostDetails={(post) => { setSelectedPost(post); setView('post-report'); }}
           onViewSocialProfileDetails={(report) => { setSelectedSocialReport(report); setView('overview-report'); }}
           onViewConsultDetails={(report) => { setSelectedReport(report); setView('chatlog-report'); }}
           prefillData={prefillData}
           onClearPrefill={() => setPrefillData(null)}
           onViewHelp={handleViewHelp}
           initialTab={activeAnalysisTab}
           onCreateProfile={() => { setActiveTargetId(null); setDraftTarget({ id: 'new', name: '', age: '', occupation: '', bio: '', socialMediaData: [], consultationHistory: [], socialAnalysisHistory: [], postAnalysisHistory: [] }); setView('profile'); }}
           onSmartAnalyze={() => setView('smart-analysis')}
         />
       );
    }

    if (viewState === 'post-report') {
       return <PostReportPage target={activeTarget} post={selectedPost} onBack={() => { setActiveAnalysisTab('post'); setView('analysis'); }} onDelete={() => { if (!selectedPost || !activeTarget) return; const newHistory = (activeTarget.postAnalysisHistory || []).filter(p => p.id !== selectedPost.id); handleUpdateTarget(activeTarget.id, { postAnalysisHistory: newHistory }); setActiveAnalysisTab('post'); setView('analysis'); }} />;
    }
    if (viewState === 'overview-report') {
       return <OverviewReportPage target={activeTarget} report={selectedSocialReport} onBack={() => { setActiveAnalysisTab('overall'); setView('analysis'); }} onDelete={() => { if (!selectedSocialReport || !activeTarget) return; const newHistory = (activeTarget.socialAnalysisHistory || []).filter(h => h.id !== selectedSocialReport.id); handleUpdateTarget(activeTarget.id, { socialAnalysisHistory: newHistory }); setActiveAnalysisTab('overall'); setView('analysis'); }} />;
    }
    if (viewState === 'chatlog-report' && selectedReport) {
       return <ChatLogReportPage target={activeTarget} report={selectedReport} onNavigate={setView} onSelectReport={(r) => { if(!r) { setActiveAnalysisTab('chatlog'); setView('analysis'); } else setSelectedReport(r); }} onDeleteReport={(id) => { if (!activeTarget) return; const newHistory = (activeTarget.consultationHistory || []).filter(h => h.id !== id); handleUpdateTarget(activeTarget.id, { consultationHistory: newHistory }); if (selectedReport?.id === id) { setActiveAnalysisTab('chatlog'); setView('analysis'); } }} />;
    }
    if (viewState === 'personality') {
       return <PersonalityReportPage target={activeTarget} onBack={() => setView('profile')} onDelete={() => { if (!activeTarget) return; handleUpdateTarget(activeTarget.id, { personalityReport: undefined }); setView('profile'); }} />;
    }
    if (viewState === 'profile-records') {
       return <ProfileRecordsPage target={activeTarget} onBack={() => setView('profile')} />;
    }
    if (viewState === 'simulate' || viewState === 'chat') {
       return (
         <ChatPage 
           target={activeTarget}
           session={currentChatSession}
           replyOptions={replyOptions}
           onSendMessage={handleSendMessage}
           onGetReplyOptions={(lastMsg) => Gemini.generateReplyOptions(activeTarget!, [{ sender: 'persona', text: lastMsg }]).then(setReplyOptions)}
           onPartnerReply={handlePartnerReplyAnalysis}
           isThinking={isChatThinking}
           isAnalyzing={isChatAnalyzing}
         />
       );
    }

    return null;
  };

  return (
    <>
      <div className="h-full bg-cream safe-area-view">
        {renderView()}
      </div>

      <LoadingScreen isLoading={loading} text={loadingText} type={loadingType} />
      
      {user && !showWelcome && viewState !== 'auth' && viewState !== 'smart-analysis' && !['post-report', 'overview-report', 'personality', 'profile-records', 'advanced-settings', 'help', 'chatlog-report'].includes(viewState) && (
        <BottomNav 
          currentView={viewState} 
          setView={(v) => {
             setSelectedReport(null);
             setSelectedPost(null);
             if (v !== 'profile') {
                setDraftTarget(null);
             }
             setView(v);
          }}
          hasActiveTarget={!!activeTarget}
          activeTargetAvatar={activeTarget?.avatarB64}
          onSmartImport={() => {
             if (activeTarget && activeTarget.isSample) {
                setView('analysis');
             } else {
                setView('smart-analysis');
             }
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
