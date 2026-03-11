import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../contextsv2/LanguageContext';
import { wakeUpServer, onWarmupStateChange, type WarmupState } from '../servicesv2/warmupService';

interface Props {
  onReady: () => void;
  onSkip?: () => void;
}

const ServerWakeUp: React.FC<Props> = ({ onReady, onSkip }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<WarmupState>({
    status: 'idle',
    latencyMs: null,
    retryCount: 0,
    lastPingAt: null,
    errorMessage: null,
  });
  const [fadeOut, setFadeOut] = useState(false);
  const [dots, setDots] = useState('');

  // Subscribe to state changes
  useEffect(() => {
    const unsub = onWarmupStateChange(setState);
    return unsub;
  }, []);

  // Animate ellipsis dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Start waking up the server
  useEffect(() => {
    let cancelled = false;

    const doWake = async () => {
      const ok = await wakeUpServer();
      if (cancelled) return;
      if (ok) {
        // Brief delay to show success state
        setTimeout(() => {
          if (!cancelled) {
            setFadeOut(true);
            setTimeout(() => {
              if (!cancelled) onReady();
            }, 500);
          }
        }, 800);
      }
    };

    doWake();
    return () => { cancelled = true; };
  }, [onReady]);

  const handleRetry = useCallback(async () => {
    const ok = await wakeUpServer();
    if (ok) {
      setFadeOut(true);
      setTimeout(() => onReady(), 500);
    }
  }, [onReady]);

  const statusText = (() => {
    switch (state.status) {
      case 'idle':
      case 'pinging':
        return t('warmup.connecting');
      case 'waking':
        return state.retryCount > 0
          ? `${t('warmup.waking')} (${state.retryCount}/${8})`
          : t('warmup.waking');
      case 'online':
        return t('warmup.online');
      case 'error':
        return t('warmup.error');
      default:
        return t('warmup.connecting');
    }
  })();

  const subtitleText = (() => {
    switch (state.status) {
      case 'idle':
      case 'pinging':
        return t('warmup.connectingSub');
      case 'waking':
        return state.retryCount > 2 
          ? t('warmup.coldStartSub') 
          : t('warmup.wakingSub');
      case 'online':
        return state.latencyMs 
          ? `${t('warmup.onlineSub')} (${state.latencyMs}ms)` 
          : t('warmup.onlineSub');
      case 'error':
        return t('warmup.errorSub');
      default:
        return '';
    }
  })();

  const isOnline = state.status === 'online';
  const isError = state.status === 'error';

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-32 -top-32 w-96 h-96 bg-gradient-to-br from-navy/5 to-transparent rounded-full blur-3xl breathing-bg-1" />
        <div className="absolute -right-32 -bottom-32 w-96 h-96 bg-gradient-to-tl from-gold/10 to-transparent rounded-full blur-3xl breathing-bg-2" />
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-200/10 rounded-full blur-3xl breathing-bg-3" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-sm w-full">

        {/* Breathing Core Animation */}
        <div className="relative mb-10">
          {/* Outer breathing rings */}
          <div className={`absolute inset-0 -m-8 rounded-full border-2 transition-colors duration-1000 ${
            isOnline ? 'border-emerald-400/40' : isError ? 'border-red-400/30' : 'border-gold/20'
          } breathing-ring-1`} />
          <div className={`absolute inset-0 -m-14 rounded-full border transition-colors duration-1000 ${
            isOnline ? 'border-emerald-400/20' : isError ? 'border-red-400/15' : 'border-navy/10'
          } breathing-ring-2`} />
          <div className={`absolute inset-0 -m-20 rounded-full border transition-colors duration-1000 ${
            isOnline ? 'border-emerald-400/10' : isError ? 'border-red-400/10' : 'border-gold/5'
          } breathing-ring-3`} />

          {/* Central orb */}
          <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-1000 ${
            isOnline 
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30' 
              : isError
                ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-br from-navy to-blue-700 shadow-lg shadow-navy/30'
          } breathing-orb`}>
            {/* Icon */}
            {isOnline ? (
              <svg className="w-10 h-10 text-white animate-scale-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : isError ? (
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
              </svg>
            )}
          </div>

          {/* Pulse dots around the orb (only when waking) */}
          {!isOnline && !isError && (
            <>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 w-1.5 h-1.5 bg-gold/60 rounded-full breathing-dot" style={{ animationDelay: '0s' }} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 w-1.5 h-1.5 bg-navy/40 rounded-full breathing-dot" style={{ animationDelay: '1s' }} />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-1.5 h-1.5 bg-gold/40 rounded-full breathing-dot" style={{ animationDelay: '2s' }} />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-1.5 h-1.5 bg-navy/60 rounded-full breathing-dot" style={{ animationDelay: '0.5s' }} />
            </>
          )}
        </div>

        {/* Status Text */}
        <h2 className={`text-xl font-serif font-bold mb-2 transition-colors duration-700 ${
          isOnline ? 'text-emerald-700' : isError ? 'text-red-600' : 'text-navy'
        }`}>
          {statusText}{!isOnline && !isError ? dots : ''}
        </h2>
        
        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed max-w-xs">
          {subtitleText}
        </p>

        {/* Signal bars visualization */}
        {!isError && (
          <div className="flex items-end gap-1 mb-8 h-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-500 ${
                  isOnline
                    ? 'bg-emerald-500'
                    : state.retryCount >= i * 1.5
                      ? 'bg-gold/60 signal-bar-active'
                      : 'bg-gray-200'
                }`}
                style={{
                  height: `${i * 4 + 4}px`,
                  transitionDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Error: Retry button */}
        {isError && (
          <div className="flex flex-col items-center gap-3 mb-6">
            <button
              onClick={handleRetry}
              className="px-8 py-3 bg-navy text-white font-semibold rounded-xl shadow-md hover:bg-navy/90 active:scale-95 transition-all"
            >
              {t('warmup.retry')}
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t('warmup.skipOffline')}
              </button>
            )}
          </div>
        )}

        {/* Progress hint for long waits */}
        {state.status === 'waking' && state.retryCount > 3 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gold/20 px-4 py-3 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              {t('warmup.longWaitHint')}
            </p>
          </div>
        )}
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 flex flex-col items-center gap-1">
        <span className="text-[10px] text-gray-300 tracking-widest uppercase">
          {t('warmup.brandTag')}
        </span>
      </div>

      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes breathing-slow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes breathing-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.2; }
        }
        @keyframes breathing-ring-2 {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.08); opacity: 0.1; }
        }
        @keyframes breathing-dot {
          0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.4); }
        }
        @keyframes bg-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.1); }
        }
        @keyframes bg-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -30px) scale(1.05); }
        }
        @keyframes bg-drift-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.2; }
        }
        @keyframes signal-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .breathing-orb {
          animation: breathing 3s ease-in-out infinite;
        }
        .breathing-ring-1 {
          animation: breathing-ring 3s ease-in-out infinite;
        }
        .breathing-ring-2 {
          animation: breathing-ring-2 3.5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .breathing-ring-3 {
          animation: breathing-ring-2 4s ease-in-out infinite;
          animation-delay: 1s;
        }
        .breathing-dot {
          animation: breathing-dot 2.5s ease-in-out infinite;
        }
        .breathing-bg-1 {
          animation: bg-drift-1 8s ease-in-out infinite;
        }
        .breathing-bg-2 {
          animation: bg-drift-2 10s ease-in-out infinite;
        }
        .breathing-bg-3 {
          animation: bg-drift-3 6s ease-in-out infinite;
        }
        .signal-bar-active {
          animation: signal-pulse 1.5s ease-in-out infinite;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ServerWakeUp;
