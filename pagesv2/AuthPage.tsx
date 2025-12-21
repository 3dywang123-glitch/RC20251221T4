
import React, { useState } from 'react';
import { DiamondIcon, EyeIcon, EyeOffIcon, ChevronRight } from '../componentsv2/Icons';
import * as AuthService from '../servicesv2/authService';
import { User } from '../types';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  onAuthSuccess: (user: User) => void;
}

const AuthPage: React.FC<Props> = ({ onAuthSuccess }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); 

  const mapError = (msg: string) => {
    if (msg.includes("Email already registered")) return t('errors.emailTaken');
    if (msg.includes("Username already taken")) return t('errors.usernameTaken');
    if (msg.includes("Invalid credentials")) return t('errors.invalidCredentials');
    if (msg.includes("User record not found")) return t('errors.userNotFound');
    return msg || t('errors.authFailed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user: User;
      if (mode === 'signup') {
        if (!username.trim()) throw new Error("Username is required");
        user = await AuthService.register(username, identifier, password);
      } else {
        user = await AuthService.login(identifier, password);
      }
      onAuthSuccess(user);
    } catch (err: any) {
      setError(mapError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
       const guest = await AuthService.loginAsGuest();
       onAuthSuccess(guest);
    } catch (e) {
       setError(t('auth.guestLoginFailed'));
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-cream">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-gold opacity-5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-navy opacity-5 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-block">
             <div className="w-20 h-20 bg-navy text-gold rounded-3xl flex items-center justify-center shadow-2xl shadow-navy/20 border border-gold/20 mb-6 mx-auto rotate-6 hover:rotate-0 transition-transform duration-700">
                <DiamondIcon className="w-10 h-10" />
             </div>
             {/* Accent dot */}
             <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce-slight border border-gray-100">
               <div className="w-2 h-2 bg-gold rounded-full"></div>
             </div>
          </div>
          
          <h1 className="text-4xl font-serif font-bold text-navy tracking-tight mb-2">{t('app.name')}<span className="text-gold">{t('app.suffix')}</span></h1>
          <p className="text-navy/40 text-xs font-bold uppercase tracking-[0.3em]">{t('app.tagline')}</p>
        </div>

        {/* Clean Light Card */}
        <div className="w-full bg-white rounded-[2rem] shadow-xl shadow-navy/5 border border-gray-100 overflow-hidden animate-slide-up">
          
          {/* Toggle Tabs */}
          <div className="flex p-1.5 gap-1.5 bg-gray-50 m-1.5 rounded-[1.7rem] border border-gray-100">
            <button 
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 py-3.5 rounded-3xl text-xs font-bold uppercase tracking-wide transition-all ${mode === 'signin' ? 'bg-white text-navy shadow-sm border border-gray-100' : 'text-gray-400 hover:text-navy hover:bg-white/50'}`}
            >
              {t('auth.login')}
            </button>
            <button 
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-3.5 rounded-3xl text-xs font-bold uppercase tracking-wide transition-all ${mode === 'signup' ? 'bg-white text-navy shadow-sm border border-gray-100' : 'text-gray-400 hover:text-navy hover:bg-white/50'}`}
            >
              {t('auth.signup')}
            </button>
          </div>

          <div className="p-8 pt-6">
            <div className="mb-6 text-center sm:text-left">
               <h2 className="text-2xl font-serif font-bold text-navy">
                 {mode === 'signin' ? t('auth.welcomeBack') : t('auth.getStarted')}
               </h2>
               <p className="text-gray-400 text-xs mt-1 font-medium leading-relaxed">
                 {mode === 'signin' 
                   ? t('auth.loginSubtitle') 
                   : t('auth.signupSubtitle')}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gold-dark uppercase tracking-widest pl-2">{t('auth.username')}</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 bg-[#F5F2EA] rounded-2xl border border-transparent outline-none focus:bg-white focus:border-gold/30 transition text-navy font-bold text-sm placeholder-gray-400"
                    placeholder={t('auth.chooseUsername')}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gold-dark uppercase tracking-widest pl-2">
                  {mode === 'signin' ? t('auth.emailUser') : t('auth.email')}
                </label>
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full p-4 bg-[#F5F2EA] rounded-2xl border border-transparent outline-none focus:bg-white focus:border-gold/30 transition text-navy font-bold text-sm placeholder-gray-400"
                  placeholder={mode === 'signin' ? t('auth.enterId') : "hello@example.com"}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gold-dark uppercase tracking-widest pl-2">{t('auth.password')}</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 bg-[#F5F2EA] rounded-2xl border border-transparent outline-none focus:bg-white focus:border-gold/30 transition text-navy font-bold text-sm pr-12 placeholder-gray-400"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition"
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2 animate-fade-in">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-navy text-white rounded-2xl font-bold shadow-lg shadow-navy/20 active:scale-[0.98] transition hover:bg-navy-light uppercase tracking-widest text-xs flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('common.processing')}</span>
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? t('auth.accessAccount') : t('auth.createAccount')}
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Area */}
          <div className="bg-gray-50 p-6 flex flex-col items-center justify-center gap-3 border-t border-gray-100">
             <button 
               onClick={handleGuestLogin}
               disabled={loading}
               className="text-xs font-bold text-navy/40 hover:text-navy transition flex items-center gap-2 group"
             >
               <span>{t('auth.continueVisitor')}</span>
               <span className="group-hover:translate-x-1 transition-transform">→</span>
             </button>
          </div>

        </div>
        
        <div className="mt-8 flex gap-6 opacity-30 text-[9px] font-bold text-navy uppercase tracking-widest">
           {t('app.secureBadge')}
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
