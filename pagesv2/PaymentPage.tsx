
import React, { useState, useEffect } from 'react';
import { 
  DiamondIcon, TimerIcon, ZapIcon, LockIcon, 
  ShieldIcon, CheckCircleIcon, CreditCardIcon, AppleIcon,
  AlipayIcon, WeChatPayIcon, QrCodeIcon 
} from '../componentsv2/Icons';
import * as Storage from '../servicesv2/storageService';
import { SubscriptionTier, PaymentTransaction } from '../types';
import { useTranslation } from '../contextsv2/LanguageContext';

interface Props {
  onNavigate: (view: string) => void;
}

interface Plan {
  id: string;
  tier: SubscriptionTier;
  titleKey: string;
  subtitleKey: string;
  price: string;
  originalPrice?: string;
  discountLabel?: string;
  periodKey: string;
  features: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
  color: string;
  bgGradient?: string;
  vipKey?: string;
  btnKey: string;
}

const PaymentPage: React.FC<Props> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  // Social Proof Notification State
  const [notification, setNotification] = useState<{name: string, plan: string, location: string, avatar: string} | null>(null);
  
  // Payment Processing State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'method' | 'qrcode' | 'processing' | 'success'>('method');
  const [paymentMethod, setPaymentMethod] = useState<'WeChat' | 'Alipay' | 'Apple' | 'Card' | ''>('');
  const [currentOrderId, setCurrentOrderId] = useState('');

  const PLANS: Plan[] = [
    {
      id: 'plan_week',
      tier: SubscriptionTier.WEEKLY,
      titleKey: 'payment.plans.week.title',
      subtitleKey: 'payment.plans.week.subtitle',
      price: '$9.99',
      originalPrice: '$16.99',
      discountLabel: '-41%',
      periodKey: 'payment.plans.week.period',
      features: ['Priority Queue (Skip 50%)', '5 Deep Consultations', 'Basic Avatar Analysis'],
      color: 'border-gray-200',
      btnKey: 'payment.plans.week.btn'
    },
    {
      id: 'plan_month',
      tier: SubscriptionTier.MONTHLY,
      titleKey: 'payment.plans.month.title',
      subtitleKey: 'payment.plans.month.subtitle',
      price: '$29.99',
      originalPrice: '$49.99',
      discountLabel: 'SAVE 40%',
      periodKey: 'payment.plans.month.period',
      features: ['Instant AI Response', 'Unlimited Chat Coach', 'Deep Web Search', 'Full Avatar Psychology'],
      isPopular: true,
      color: 'border-blue-200',
      bgGradient: 'bg-gradient-to-b from-blue-50 to-white',
      btnKey: 'payment.plans.month.btn'
    },
    {
      id: 'plan_life',
      tier: SubscriptionTier.LIFETIME,
      titleKey: 'payment.plans.life.title',
      subtitleKey: 'payment.plans.life.subtitle',
      price: '$179',
      originalPrice: '$688',
      discountLabel: 'SAVE 74%',
      periodKey: 'payment.plans.life.period',
      features: ['Forever VIP Status', 'New Features First', 'Exclusive AI Models', 'Priority Support'],
      isBestValue: true,
      color: 'border-gold',
      bgGradient: 'bg-navy',
      vipKey: 'payment.plans.life.vip',
      btnKey: 'payment.plans.life.btn'
    }
  ];

  useEffect(() => {
    // 1. Countdown Timer
    const timer = window.setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    // 2. Social Proof Notifications Loop
    let notificationTimeout: number; 
    
    const triggerNotification = () => {
       const delay = Math.random() * 3000 + 1000; // Random delay between 1-4 seconds
       
       notificationTimeout = window.setTimeout(() => {
          const names = ['Sarah', 'Michael', 'Jessica', 'David', 'Emily', 'Chris', 'Anna', 'James', 'Olivia', 'Daniel', 'Sophia', 'Alex'];
          const locations = ['London', 'NY', 'Tokyo', 'Paris', 'Sydney', 'LA', 'Toronto', 'Berlin'];
          const plans = ['Lover Plan', 'Soulmate VIP', 'Lover Plan', 'Soulmate VIP', 'Soulmate VIP']; // Weighted towards premium
          const avatars = ['👩', '👨', '🧑', '👱‍♀️', '🧔', '👵'];
          
          const name = names[Math.floor(Math.random() * names.length)];
          const plan = plans[Math.floor(Math.random() * plans.length)];
          const location = locations[Math.floor(Math.random() * locations.length)];
          const avatar = avatars[Math.floor(Math.random() * avatars.length)];
          
          setNotification({ name, plan, location, avatar });
          
          // Hide after 4 seconds
          window.setTimeout(() => setNotification(null), 4000);
          
          // Schedule next
          triggerNotification();
       }, delay + 4000); 
    };

    triggerNotification();

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(notificationTimeout);
    };
  }, []);

  // Generate Order ID when opening modal
  useEffect(() => {
    if (showPaymentModal) {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      setCurrentOrderId(`ORD-${date}-${random}`);
    }
  }, [showPaymentModal]);

  // Auto-transition for QR code step simulation
  useEffect(() => {
    if (paymentStep === 'qrcode') {
        // Simulate scanning time (3-5 seconds)
        const scanTime = Math.random() * 2000 + 3000;
        const timer = window.setTimeout(() => {
            handlePayProcess();
        }, scanTime); 
        return () => window.clearTimeout(timer);
    }
  }, [paymentStep]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlanSelect = (id: string) => {
    setSelectedPlanId(id);
    setPaymentStep('method');
    setShowPaymentModal(true);
  };

  const handleMethodSelect = (method: 'WeChat' | 'Alipay' | 'Apple' | 'Card') => {
    setPaymentMethod(method);
    if (method === 'Alipay' || method === 'WeChat') {
        setPaymentStep('qrcode');
    } else {
        handlePayProcess();
    }
  };

  const handlePayProcess = () => {
    setPaymentStep('processing');
    
    // Simulate API delay
    window.setTimeout(() => {
       setPaymentStep('success');
       
       // Update User Data & Save Transaction
       const plan = PLANS.find(p => p.id === selectedPlanId);
       if (plan && paymentMethod) {
         // 1. Update Profile
         const user = Storage.getUserProfile();
         user.subscriptionTier = plan.tier;
         user.isVip = plan.tier !== SubscriptionTier.FREE;
         Storage.saveUserProfile(user);

         // 2. Save Transaction
         const tx: PaymentTransaction = {
            id: currentOrderId,
            amount: plan.price,
            currency: 'USD',
            planName: plan.titleKey, // Using key for now, could translate
            method: paymentMethod as any,
            status: 'success',
            timestamp: Date.now()
         };
         Storage.savePaymentTransaction(tx);
       }

       // Redirect after success
       window.setTimeout(() => {
         setShowPaymentModal(false);
         onNavigate('user');
       }, 2000);
    }, 2000);
  };

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId);

  return (
    <div className="h-full bg-cream overflow-y-auto pb-24 relative">
      
      {/* 1. Header: Anxiety & Urgency */}
      <div className="bg-red-600 text-white px-4 py-3 sticky top-0 z-30 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider animate-pulse">
           <TimerIcon className="w-4 h-4" />
           <span>{t('payment.flashSale')}</span>
        </div>
        <div className="font-mono font-bold text-sm bg-red-800/80 px-2 py-0.5 rounded border border-red-500">
           {formatTime(timeLeft)}
        </div>
      </div>

      <div className="p-6 space-y-8">
        <header className="text-center space-y-2">
           {/* Notification / Social Proof Area */}
           <div className="h-8 flex items-center justify-center mb-2">
              {notification ? (
                <div className="inline-flex items-center gap-2 bg-white text-navy px-3 py-1.5 rounded-full text-[10px] font-bold border border-gray-100 shadow-md animate-fade-in">
                   <span className="text-sm">
                     {notification.avatar}
                   </span>
                   <span>
                     {notification.name} ({notification.location}) just bought <span className="text-gold-dark">{notification.plan}</span>
                   </span>
                </div>
              ) : (
                <div className="h-full w-full"></div>
              )}
           </div>

           <h1 className="text-3xl font-serif font-bold text-navy leading-tight">
             {t('payment.upgradeTitle')} <br/><span className="text-gold">{t('payment.upgradeTitleSuffix')}</span>
           </h1>
           <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
             {t('payment.capacityWarning')} <span className="text-red-500 font-bold">{t('payment.capacityValue')}</span>. {t('payment.secureAccess')}
           </p>
        </header>

        {/* 2. Tiers Layout */}
        <div className="space-y-5">
           
           {/* Tier 1: Weekender */}
           <div 
             onClick={() => handlePlanSelect('plan_week')}
             className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm relative active:scale-95 transition-transform cursor-pointer group"
           >
              <div className="flex justify-between items-center mb-4">
                 <div>
                    <h3 className="text-lg font-bold text-gray-700">{t(PLANS[0].titleKey)}</h3>
                    <p className="text-xs text-gray-400 font-medium">{t(PLANS[0].subtitleKey)}</p>
                 </div>
                 <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[10px] text-gray-400 line-through">{PLANS[0].originalPrice}</span>
                        <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1 rounded">
                            {PLANS[0].discountLabel}
                        </span>
                    </div>
                    <div className="text-xl font-bold text-gray-700">{PLANS[0].price}</div>
                    <div className="text-[10px] text-gray-400">{t(PLANS[0].periodKey)}</div>
                 </div>
              </div>
              <ul className="space-y-2 mb-4">
                 {PLANS[0].features.map((f, i) => (
                   <li key={i} className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircleIcon className="w-3 h-3 text-gray-300" /> {f}
                   </li>
                 ))}
              </ul>
              <button className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold group-hover:bg-gray-100 transition">
                 {t(PLANS[0].btnKey)}
              </button>
           </div>

           {/* Tier 2: Lover (Highlighted) */}
           <div 
             onClick={() => handlePlanSelect('plan_month')}
             className="bg-white p-6 rounded-3xl border-2 border-blue-500 shadow-xl relative active:scale-95 transition-transform cursor-pointer overflow-hidden group"
           >
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl shadow-md">
                 {t('payment.plans.month.popular')}
              </div>
              
              <div className="flex justify-between items-center mb-4 mt-2">
                 <div>
                    <h3 className="text-xl font-serif font-bold text-navy">{t(PLANS[1].titleKey)}</h3>
                    <p className="text-xs text-blue-500 font-bold">{t('payment.plans.month.bestFor')}</p>
                 </div>
                 <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1 mb-0.5">
                       <span className="text-xs text-gray-400 line-through">{PLANS[1].originalPrice}</span>
                       <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">
                          {PLANS[1].discountLabel}
                       </span>
                    </div>
                    <div className="text-3xl font-bold text-navy">{PLANS[1].price}</div>
                    <div className="text-[10px] text-gray-400">{t(PLANS[1].periodKey)}</div>
                 </div>
              </div>

              <div className="my-4 h-px w-full bg-gray-100"></div>

              <ul className="space-y-3 mb-6">
                 {PLANS[1].features.map((f, i) => (
                   <li key={i} className="flex items-center gap-2 text-sm text-navy">
                      <ZapIcon className="w-4 h-4 text-blue-500" /> {f}
                   </li>
                 ))}
              </ul>
              <button className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 group-hover:bg-blue-700 transition">
                 {t(PLANS[1].btnKey)}
              </button>
           </div>

           {/* Tier 3: Soulmate (VIP) */}
           <div 
             onClick={() => handlePlanSelect('plan_life')}
             className="bg-navy p-6 rounded-3xl border border-gold/40 shadow-2xl relative active:scale-95 transition-transform cursor-pointer overflow-hidden group"
           >
              {/* Gold Effects */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold opacity-10 rounded-full blur-3xl animate-pulse"></div>
              
              <div className="absolute top-4 left-4 bg-gradient-to-r from-gold to-yellow-300 text-navy-light text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                 <DiamondIcon className="w-3 h-3" /> {t('payment.plans.life.vip')}
              </div>

              <div className="flex justify-between items-end mb-6 mt-10 relative z-10">
                 <div>
                    <h3 className="text-2xl font-serif font-bold text-white">{t(PLANS[2].titleKey)}</h3>
                    <p className="text-xs text-gold/80">{t(PLANS[2].subtitleKey)}</p>
                 </div>
                 <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1.5 mb-1">
                       <span className="text-xs text-gray-400 line-through decoration-red-500/70">{PLANS[2].originalPrice}</span>
                       <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm animate-pulse">
                         {PLANS[2].discountLabel}
                       </span>
                    </div>
                    <div className="text-4xl font-bold text-white tracking-tight text-shadow-sm">{PLANS[2].price}</div>
                    <div className="text-[10px] text-gray-400">{t(PLANS[2].periodKey)}</div>
                 </div>
              </div>

              <ul className="space-y-3 mb-8 relative z-10">
                 {PLANS[2].features.map((f, i) => (
                   <li key={i} className="flex items-center gap-3 text-sm text-white font-medium">
                      <span className="bg-gold/20 p-1 rounded-full text-gold"><DiamondIcon className="w-3 h-3" /></span>
                      {f}
                   </li>
                 ))}
              </ul>

              <button className="relative z-10 w-full py-4 bg-gradient-to-r from-gold to-yellow-300 text-navy-light font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 group-hover:brightness-110 transition">
                 {t(PLANS[2].btnKey)}
              </button>
           </div>
        </div>

        {/* Footer Trust Indicators */}
        <div className="flex justify-center gap-6 opacity-50 grayscale pt-4">
           <div className="flex items-center gap-1 text-[10px] font-bold text-navy">
              <ShieldIcon className="w-3 h-3" /> {t('payment.trust.ssl')}
           </div>
           <div className="flex items-center gap-1 text-[10px] font-bold text-navy">
              <LockIcon className="w-3 h-3" /> {t('payment.trust.encrypted')}
           </div>
        </div>
      </div>

      {/* --- 3. Payment Processing Overlay --- */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl transform transition-transform animate-slide-up">
              
              {/* Step 1: Payment Method */}
              {paymentStep === 'method' && (
                <div className="space-y-5">
                   <div className="flex justify-between items-center">
                      <h3 className="text-xl font-serif font-bold text-navy">{t('payment.modal.title')}</h3>
                      <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-navy">✕</button>
                   </div>
                   
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                      <div>
                         <div className="text-xs text-gray-500 uppercase">{t('payment.modal.total')}</div>
                         <div className="text-2xl font-bold text-navy">
                           {selectedPlan.price}
                         </div>
                      </div>
                      <div className="text-xs font-bold text-gold-dark bg-gold/10 px-2 py-1 rounded">
                         {t(selectedPlan.titleKey)}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleMethodSelect('Alipay')} className="p-4 border-2 border-blue-50 bg-blue-50/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition active:scale-95 group">
                             <div className="text-blue-500 p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition"><AlipayIcon className="w-8 h-8" /></div>
                             <span className="font-bold text-sm text-navy">Alipay</span>
                          </button>
                          <button onClick={() => handleMethodSelect('WeChat')} className="p-4 border-2 border-green-50 bg-green-50/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-green-500 hover:bg-green-50 transition active:scale-95 group">
                             <div className="text-green-500 p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition"><WeChatPayIcon className="w-8 h-8" /></div>
                             <span className="font-bold text-sm text-navy">WeChat Pay</span>
                          </button>
                      </div>

                      <div className="relative flex py-2 items-center">
                         <div className="flex-grow border-t border-gray-100"></div>
                         <span className="flex-shrink-0 mx-2 text-gray-300 text-[10px] font-bold uppercase tracking-widest">{t('payment.modal.global')}</span>
                         <div className="flex-grow border-t border-gray-100"></div>
                      </div>

                      <button onClick={() => handleMethodSelect('Apple')} className="w-full p-4 border border-gray-200 rounded-xl flex items-center justify-between hover:border-navy hover:bg-gray-50 transition group">
                         <div className="flex items-center gap-3">
                            <div className="bg-black text-white p-2 rounded-lg"><AppleIcon className="w-5 h-5" /></div>
                            <span className="font-bold text-navy">Apple Pay</span>
                         </div>
                         <div className="w-4 h-4 rounded-full border border-gray-300 group-hover:border-navy group-hover:bg-navy"></div>
                      </button>
                      <button onClick={() => handleMethodSelect('Card')} className="w-full p-4 border border-gray-200 rounded-xl flex items-center justify-between hover:border-navy hover:bg-gray-50 transition group">
                         <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white p-2 rounded-lg"><CreditCardIcon className="w-5 h-5" /></div>
                            <span className="font-bold text-navy">Credit Card</span>
                         </div>
                         <div className="w-4 h-4 rounded-full border border-gray-300 group-hover:border-navy group-hover:bg-navy"></div>
                      </button>
                   </div>
                   
                   <p className="text-center text-[10px] text-gray-400">
                      {t('payment.modal.note')}
                   </p>
                </div>
              )}

              {/* Step 2: QR Code Scan (New) */}
              {paymentStep === 'qrcode' && (
                 <div className="space-y-6 text-center">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-serif font-bold text-navy">{t('payment.modal.scanTitle')}</h3>
                        <button onClick={() => setPaymentStep('method')} className="text-xs font-bold text-gray-400 hover:text-navy">{t('payment.modal.changeMethod')}</button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 border border-gray-100 relative overflow-hidden">
                        {/* Scan Line Animation */}
                        <div className={`absolute top-0 left-0 w-full h-1 z-10 animate-[scan_2s_ease-in-out_infinite] ${paymentMethod === 'Alipay' ? 'bg-blue-500/50' : 'bg-green-500/50'}`}></div>
                        
                        <div className={`w-48 h-48 bg-white p-2 rounded-xl border-4 shadow-sm flex items-center justify-center ${paymentMethod === 'Alipay' ? 'border-blue-500' : 'border-green-500'}`}>
                           <QrCodeIcon className={`w-full h-full ${paymentMethod === 'Alipay' ? 'text-navy' : 'text-navy'}`} />
                        </div>
                        
                        <div className="text-center">
                           <p className="text-2xl font-bold text-navy">{selectedPlan.price}</p>
                           <p className="text-xs text-gray-500 mt-1">
                               {t('payment.modal.openApp')} <span className={`font-bold ${paymentMethod === 'Alipay' ? 'text-blue-600' : 'text-green-600'}`}>{paymentMethod}</span> {t('payment.modal.toScan')}
                           </p>
                           <div className="text-[10px] text-gray-300 mt-1 font-mono">{currentOrderId}</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <div className="w-3 h-3 border-2 border-gray-300 border-t-navy rounded-full animate-spin"></div>
                        {t('payment.modal.waiting')}
                    </div>
                 </div>
              )}

              {/* Step 3: Processing */}
              {paymentStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                   <div className="relative">
                      <div className="w-16 h-16 border-4 border-gray-100 border-t-gold rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <LockIcon className="w-6 h-6 text-gray-300" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-navy">{t('payment.modal.processing')}</h3>
                      <p className="text-xs text-gray-400 mt-1">{t('payment.modal.verifying')} {currentOrderId}</p>
                   </div>
                </div>
              )}

              {/* Step 4: Success */}
              {paymentStep === 'success' && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
                      <CheckCircleIcon className="w-10 h-10" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-serif font-bold text-navy">{t('payment.modal.success')}</h3>
                      <p className="text-sm text-gray-500 mt-2">{t('payment.modal.successDesc')}</p>
                   </div>
                </div>
              )}

           </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;
