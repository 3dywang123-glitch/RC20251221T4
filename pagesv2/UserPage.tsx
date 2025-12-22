
import React, { useState, useEffect } from 'react';
import { UserProfile, User, PaymentTransaction } from '../types';
import { UploadIcon, ChevronRight, ZapIcon, DiamondIcon, EyeIcon, EyeOffIcon, AlipayIcon, WeChatPayIcon, CreditCardIcon, AppleIcon } from '../componentsv2/Icons';
import { getAvatarSrc } from '../utils';
import { compressImage } from '../servicesv2/ai/core';
import * as AuthService from '../servicesv2/authService';
import * as Storage from '../servicesv2/storageService';
import { getVisitorId } from '../servicesv2/storageService';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  profile: UserProfile;
  userAuth: User;
  onUpdateProfile: (updates: UserProfile) => void;
  onNavigate?: (view: string) => void;
  onLogout: () => void;
}

export default function UserPage({ profile, userAuth, onUpdateProfile, onNavigate, onLogout }: Props) {
  const { t, language, setLanguage } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  
  // Local form state for the modal
  const [editForm, setEditForm] = useState<UserProfile>(profile);
  
  // Blocking state for uploads
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // Sync profile prop to editForm when modal opens
  useEffect(() => {
    if (isEditing) {
      setEditForm({ ...profile });
    }
  }, [isEditing, profile]);

  // Guest Registration State
  const [showRegForm, setShowRegForm] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Payment History
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);

  useEffect(() => {
    // Load Payments
    setPaymentHistory(Storage.getPaymentHistory());
  }, []);

  const handleUserAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        setIsProcessingImages(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
           let b64 = reader.result as string;
           
           try {
             b64 = await compressImage(b64, 800);
           } catch (err) {
             console.error("Compression failed", err);
           }

           setEditForm(prev => ({ ...prev, avatarB64: b64 }));
           setIsProcessingImages(false);
        };
        reader.readAsDataURL(file);
     }
  };

  const handleSaveProfile = () => {
      onUpdateProfile(editForm);
      setIsEditing(false);
  };

  const handleGuestRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);

    try {
       await AuthService.register(regUsername, regEmail, regPassword, userAuth.id);
       window.location.reload(); 
    } catch (err: any) {
       setRegError(err.message || 'Registration failed');
       setRegLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'cn' : 'en');
  };

  const renderEditModal = () => {
    if (!isEditing) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-6 animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
          <div className="p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-2xl font-serif font-bold text-navy">{t('user.editModal.title')}</h3>
               <button 
                 onClick={() => setIsEditing(false)} 
                 className="w-8 h-8 bg-gray-50 rounded-full font-bold text-navy/50 flex items-center justify-center hover:bg-gray-100 transition"
               >
                 ✕
               </button>
            </div>

            {/* Avatar Section */}
            <div className="space-y-5">
               <div className="flex items-center gap-5">
                  <label className="relative w-24 h-24 flex-shrink-0 cursor-pointer group">
                     <div className="w-24 h-24 rounded-full bg-gray-50 overflow-hidden border-2 border-white shadow-lg group-hover:border-gold/30 transition-all">
                        {editForm.avatarB64 ? (
                           <img src={getAvatarSrc(editForm.avatarB64)} className="w-full h-full object-cover" alt="avatar" width={96} height={96} />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-3xl text-navy/20 bg-gray-100">?</div>
                        )}
                        
                        {isProcessingImages && (
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                           </div>
                        )}
                     </div>
                     <input type="file" className="hidden" accept="image/*" onChange={handleUserAvatarUpload} />
                  </label>

                  <div className="flex-1 flex flex-col justify-center gap-3">
                     <label className="self-start inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-navy shadow-sm cursor-pointer hover:bg-gray-50 transition active:scale-95">
                        <UploadIcon /> 
                        <span>{t('user.editModal.upload')}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleUserAvatarUpload} />
                     </label>
                     <input 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        placeholder={t('user.editModal.yourName')}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-navy/20 transition text-sm text-navy font-bold placeholder-gray-400"
                     />
                  </div>
               </div>

               {/* Form Fields */}
               <div>
                 <label className="text-xs font-bold text-gold-dark uppercase tracking-widest block mb-2">{t('user.editModal.occupation')}</label>
                 <input 
                   value={editForm.occupation} 
                   onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                   className="w-full p-3 bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-navy/20 transition text-sm text-navy font-medium"
                   placeholder="e.g. Architect"
                 />
               </div>

               <div>
                 <label className="text-xs font-bold text-gold-dark uppercase tracking-widest block mb-2">{t('user.editModal.selfDesc')}</label>
                 <textarea 
                   value={editForm.personalityDescription} 
                   onChange={(e) => setEditForm({...editForm, personalityDescription: e.target.value})}
                   className="w-full p-3 bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-navy/20 transition text-sm text-navy font-medium resize-none leading-relaxed h-32"
                   placeholder={t('user.editModal.selfDescPlaceholder')}
                 />
                 <p className="text-[10px] text-navy/40 mt-2 leading-relaxed font-medium">
                   {t('user.editModal.selfDescHint')}
                 </p>
               </div>
            </div>

            {/* Save Button */}
            <button 
              onClick={handleSaveProfile}
              className="w-full py-3.5 bg-navy text-white font-bold rounded-xl text-sm shadow-lg shadow-navy/20 hover:bg-navy-light transition active:scale-95"
            >
              {t('common.saveChanges')}
            </button>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 pb-24 space-y-8 bg-cream min-h-full animate-fade-in">
      
      {/* Full Screen Blocking Overlay for Image Processing */}
      {isProcessingImages && (
        <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px] flex items-center justify-center cursor-wait">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce-slight">
              <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-navy">{t('common.processing')}</span>
          </div>
        </div>
      )}

      {renderEditModal()}

      {/* Header */}
      <div className="flex items-center space-x-5 mt-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-md">
           {profile.avatarB64 ? (
             <img src={getAvatarSrc(profile.avatarB64)} alt="User" className="w-full h-full object-cover" width={40} height={40} />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-xl text-navy/30">👤</div>
           )}
        </div>
        <div>
           <h2 className="text-2xl font-serif font-bold text-navy">
             {t('user.hello', { name: profile.name || userAuth.name || 'User' })}
           </h2>
           {userAuth.isGuest ? (
             <div className="mt-1 space-y-1">
               <span className="inline-block text-[10px] bg-gray-200 text-gray-500 font-bold px-2 py-0.5 rounded border border-gray-300 uppercase tracking-wide">
                 {t('user.guest')}
               </span>
               <div className="text-[9px] text-navy/50 font-mono">
                 ID: {getVisitorId()}
               </div>
             </div>
           ) : (
             <button onClick={() => onNavigate && onNavigate('payment')} className="mt-1 text-[10px] text-red-500 font-bold bg-red-50 px-2.5 py-1 rounded border border-red-100 flex items-center gap-1.5 animate-pulse uppercase tracking-wide">
                <ZapIcon className="w-3 h-3" /> {t('user.planExpiring')}
             </button>
           )}
        </div>
      </div>
      
      {/* GUEST: Register to Save Data */}
      {userAuth.isGuest && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gold/20 relative overflow-hidden">
           {!showRegForm ? (
             <div className="relative z-10 text-center space-y-4">
                <div className="w-12 h-12 bg-navy text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                   <DiamondIcon className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-xl font-serif font-bold text-navy">{t('user.saveProgress')}</h3>
                   <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                     {t('user.saveDesc')}
                   </p>
                </div>
                <button 
                  onClick={() => setShowRegForm(true)}
                  className="w-full py-3 bg-navy text-white rounded-xl font-bold shadow-lg shadow-navy/20 active:scale-95 transition"
                >
                  {t('user.createAccountSync')}
                </button>
             </div>
           ) : (
             <div className="relative z-10 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold text-navy">{t('user.createAccount')}</h3>
                   <button onClick={() => setShowRegForm(false)} className="text-gray-400 text-sm">{t('common.cancel')}</button>
                </div>
                <form onSubmit={handleGuestRegistration} className="space-y-3">
                   <input 
                     value={regUsername}
                     onChange={(e) => setRegUsername(e.target.value)}
                     placeholder={t('auth.username')}
                     className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-transparent focus:bg-white focus:border-navy/20 outline-none text-navy font-medium"
                     required
                   />
                   <input 
                     value={regEmail}
                     onChange={(e) => setRegEmail(e.target.value)}
                     placeholder={t('auth.email')}
                     className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-transparent focus:bg-white focus:border-navy/20 outline-none text-navy font-medium"
                     required
                   />
                   <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder={t('auth.password')}
                        className="w-full p-3 bg-gray-50 rounded-xl text-sm border border-transparent focus:bg-white focus:border-navy/20 outline-none text-navy font-medium"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                         {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                   </div>
                   
                   {regError && <div className="text-[10px] text-red-500 font-bold">{regError}</div>}

                   <button 
                     type="submit"
                     disabled={regLoading}
                     className="w-full py-3 bg-gold text-white rounded-xl font-bold shadow-md active:scale-95 transition disabled:opacity-50"
                   >
                     {regLoading ? t('user.syncing') : t('user.confirmSync')}
                   </button>
                </form>
             </div>
           )}
        </div>
      )}

      {/* Upgrade Banner - Premium Navy/Gold */}
      {!userAuth.isGuest && (
        <div onClick={() => onNavigate && onNavigate('payment')} className="bg-navy p-6 rounded-3xl shadow-xl shadow-navy/20 relative overflow-hidden group cursor-pointer active:scale-95 transition-all border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold opacity-20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="flex justify-between items-center relative z-10">
              <div>
                <div className="flex items-center gap-1.5 text-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                  <DiamondIcon className="w-3 h-3" /> {t('user.vipTitle')}
                </div>
                <h3 className="text-white font-serif font-bold text-xl mb-1">{t('user.vipTitle')}</h3>
                <p className="text-gray-400 text-xs font-medium">{t('user.vipDesc')}</p>
              </div>
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-navy">
                <ChevronRight />
              </div>
          </div>
        </div>
      )}

      {/* Menu Options - Compact Mode */}
      <div className="space-y-2">
         
         <button 
           onClick={() => setIsEditing(true)}
           className="w-full bg-white py-2 px-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition group hover:border-navy/10"
         >
           <div className="flex items-center space-x-4">
             <div className="p-2 bg-navy/5 text-navy rounded-xl">👤</div>
             <span className="font-bold text-navy text-sm">{t('user.menu.profile')}</span>
           </div>
           <ChevronRight className="text-gray-300 group-hover:text-navy transition" />
         </button>
         
         <button 
           onClick={() => onNavigate && onNavigate('payment')}
           className="w-full bg-white py-2 px-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition group hover:border-navy/10"
         >
           <div className="flex items-center space-x-4">
             <div className="p-2 bg-gold/10 text-gold-dark rounded-xl">💎</div>
             <span className="font-bold text-navy text-sm">{t('user.menu.plan')}</span>
           </div>
           <div className="flex items-center gap-3">
             <span className="text-[9px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded border border-red-100 uppercase tracking-wide">{t('user.menu.actionRequired')}</span>
             <ChevronRight className="text-gray-300 group-hover:text-navy transition" />
           </div>
         </button>

         {/* Payment History Section */}
         {paymentHistory.length > 0 && (
            <div className="bg-white py-2 px-5 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-4 mt-2">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-navy/5 text-navy rounded-xl">🧾</div>
                    <span className="font-bold text-navy text-sm">{t('user.menu.billing')}</span>
                  </div>
               </div>
               
               <div className="space-y-3 mb-2">
                  {paymentHistory.map((tx) => (
                     <div key={tx.id} className="flex justify-between items-center text-xs border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                        <div>
                           <div className="font-bold text-navy">{tx.planName}</div>
                           <div className="text-[10px] text-gray-400 font-mono">{tx.id}</div>
                        </div>
                        <div className="text-right">
                           <div className="font-bold text-navy">{tx.amount}</div>
                           <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400">
                              {tx.method === 'Alipay' && <AlipayIcon className="w-3 h-3 text-blue-500" />}
                              {tx.method === 'WeChat' && <WeChatPayIcon className="w-3 h-3 text-green-500" />}
                              {tx.method === 'Apple' && <AppleIcon className="w-3 h-3" />}
                              {tx.method === 'Card' && <CreditCardIcon className="w-3 h-3 text-blue-600" />}
                              {new Date(tx.timestamp).toLocaleDateString()}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         <button 
           onClick={() => onNavigate && onNavigate('advanced-settings')}
           className="w-full bg-white py-2 px-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition group hover:border-navy/10"
         >
           <div className="flex items-center space-x-4">
             <div className="p-2 bg-navy/5 text-navy rounded-xl">⚙️</div>
             <span className="font-bold text-navy text-sm">{t('user.menu.advanced')}</span>
           </div>
           <ChevronRight className="text-gray-300 group-hover:text-navy transition" />
         </button>

         {/* Language Switcher */}
         <button 
           onClick={toggleLanguage}
           className="w-full bg-white py-2 px-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition group hover:border-navy/10"
         >
           <div className="flex items-center space-x-4">
             <div className="p-2 bg-navy/5 text-navy rounded-xl">🌐</div>
             <span className="font-bold text-navy text-sm">{t('user.menu.language')}</span>
           </div>
           <div className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
              {language === 'en' ? 'English' : '中文'}
           </div>
         </button>

         <button className="w-full bg-white py-2 px-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition group hover:border-navy/10">
           <div className="flex items-center space-x-4">
             <div className="p-2 bg-navy/5 text-navy rounded-xl">🔔</div>
             <span className="font-bold text-navy text-sm">{t('user.menu.notifications')}</span>
           </div>
           <ChevronRight className="text-gray-300 group-hover:text-navy transition" />
         </button>

         <button className="w-full bg-white py-2 px-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition group hover:border-navy/10">
           <div className="flex items-center space-x-4">
             <div className="p-2 bg-navy/5 text-navy rounded-xl">🛡️</div>
             <span className="font-bold text-navy text-sm">{t('user.menu.privacy')}</span>
           </div>
           <ChevronRight className="text-gray-300 group-hover:text-navy transition" />
         </button>

         <button 
           onClick={onLogout}
           className="w-full bg-white py-2 px-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition group hover:bg-red-50 hover:border-red-100"
         >
           <div className="flex items-center space-x-4">
             <div className="p-2 bg-red-50 text-red-500 rounded-xl">🚪</div>
             <span className="font-bold text-red-500 text-sm">
               {userAuth.isGuest ? t('user.menu.exitGuest') : t('user.menu.signOut')}
             </span>
           </div>
         </button>
      </div>

      <div className="text-center text-[10px] text-navy/30 pt-8 font-bold uppercase tracking-widest">
         20251222221630
      </div>
    </div>
  );
}
