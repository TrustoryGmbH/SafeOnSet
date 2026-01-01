
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { ArrowRight, Shield, BarChart3, Lock, LogIn, ChevronRight, Phone, CheckCircle, Globe, LifeBuoy, UserCheck, X } from 'lucide-react';
import Smiley from './Smiley';

interface LandingPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onLoginClick: () => void;
  onSimulateClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ lang, setLang, onLoginClick, onSimulateClick }) => {
  const t = TRANSLATIONS[lang];
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'privacy' | 'terms' | 'imprint'>('none');

  const features = [
    {
      id: 1,
      icon: Shield,
      title: t.feat1Title,
      desc: t.feat1Desc,
      more: t.feat1More,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      border: "border-purple-500/30"
    },
    {
      id: 2,
      icon: BarChart3,
      title: t.feat2Title,
      desc: t.feat2Desc,
      more: t.feat2More,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/30"
    },
    {
      id: 3,
      icon: Lock,
      title: t.feat3Title,
      desc: t.feat3Desc,
      more: t.feat3More,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30"
    }
  ];

  const Background = () => (
    <>
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-slate-800 to-transparent opacity-20" />
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
    </>
  );

  return (
    <div className={`min-h-screen bg-[#0f172a] text-white flex flex-col relative overflow-hidden ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      <Background />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/50">S</div>
           <span className="font-bold text-xl tracking-tight">Safe on Set</span>
        </div>

        <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-1 bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-sm">
                {(['en', 'de', 'ar'] as Language[]).map((l) => (
                <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`text-xl px-2 py-1 rounded-full transition-all ${lang === l ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}
                </button>
                ))}
            </div>

            <button 
                onClick={onLoginClick}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all border border-white/5 hover:border-white/20 backdrop-blur-md group"
            >
                <LogIn size={16} />
                <span>Login</span>
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto pt-10 pb-20">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> {t.appSub}
         </div>
         
         <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 animate-in zoom-in duration-700">
            {t.landHero}
         </h1>
         
         <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {t.landSub}
         </p>

         <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
             <button 
                onClick={onLoginClick}
                className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 group"
             >
                {t.landCTA} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
             </button>
             
             <button 
                onClick={onSimulateClick}
                className="h-14 px-8 bg-slate-800/50 hover:bg-slate-800 text-white text-sm font-bold rounded-full border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 backdrop-blur-md"
             >
                <Phone size={16} />
                Simulate Mobile App
             </button>
         </div>
         
         {/* Trust Indicators */}
         <div className="mt-10 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
             <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <CheckCircle size={12} strokeWidth={3} />
                {t.trustBadge1}
             </div>
             <p className="text-xs text-slate-500 max-w-md leading-relaxed flex items-center justify-center gap-2">
                <Globe size={12} className="shrink-0" /> {t.trustBadge2}
             </p>
         </div>

         <div className="mt-20 w-full max-w-4xl relative animate-in fade-in duration-1000 delay-500">
             <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-10" />
             <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl transform rotate-x-12 perspective-1000 group hover:rotate-x-6 transition-transform duration-700 ease-out">
                 <div className="grid grid-cols-3 gap-4 opacity-100">
                      <div className="col-span-1 bg-slate-950/40 rounded-xl h-44 flex items-center justify-center flex-col gap-2 relative overflow-hidden border border-white/5 shadow-inner">
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-green-500/5 rounded-full blur-2xl animate-pulse" />
                           <div className="animate-float relative z-10">
                               <Smiley score={100} size={70} animate={true} />
                           </div>
                           <div className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest mt-2 px-2 py-0.5 rounded-full bg-green-500/5 border border-green-500/10">
                               100% Positive
                           </div>
                      </div>
                      <div className="col-span-2 bg-slate-950/40 rounded-xl h-44 flex items-center justify-center relative overflow-hidden border border-white/5 shadow-inner">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
                          <div className="flex gap-4 items-end h-28 w-full px-8 pb-3 border-b border-white/5 relative z-10">
                               <div className="flex-1 bg-blue-500/20 rounded-t-md relative group/bar animate-pulse" style={{ height: '40%', animationDuration: '3s' }}></div>
                               <div className="flex-1 bg-blue-500/40 rounded-t-md relative group/bar animate-pulse" style={{ height: '60%', animationDuration: '2.5s', animationDelay: '0.2s' }}></div>
                               <div className="flex-1 bg-blue-500/60 rounded-t-md relative group/bar animate-pulse" style={{ height: '50%', animationDuration: '4s', animationDelay: '0.5s' }}></div>
                               <div className="flex-1 bg-blue-500/80 rounded-t-md relative group/bar animate-pulse" style={{ height: '75%', animationDuration: '2s', animationDelay: '0.1s' }}></div>
                               <div className="flex-1 bg-blue-500 rounded-t-md relative shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden" style={{ height: '90%' }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/40 to-transparent animate-shimmer-slide opacity-50" />
                               </div>
                          </div>
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                               <span className="text-[8px] font-bold text-blue-300 uppercase tracking-wider">Live</span>
                          </div>
                      </div>
                 </div>
             </div>
         </div>
      </main>

      <section className="relative z-10 bg-slate-900/50 border-t border-white/5 py-24 px-6 backdrop-blur-sm">
         <div className="max-w-6xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {features.map((feature, idx) => (
                    <div 
                        key={feature.id}
                        onClick={() => setActiveFeature(idx)}
                        className="bg-slate-800/30 p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all group cursor-pointer hover:bg-slate-800/50 active:scale-[0.98] relative"
                    >
                        <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform`}>
                            <feature.icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white flex items-center justify-between">
                            {feature.title}
                            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-slate-400" />
                        </h3>
                        <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                    </div>
                 ))}
             </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/5 text-center text-slate-500 text-sm relative z-10">
          <div className="flex justify-center items-center gap-6 mb-8">
               <button onClick={() => setActiveModal('privacy')} className="cursor-pointer hover:text-slate-300 transition-colors">Privacy Policy</button>
               <button onClick={() => setActiveModal('terms')} className="cursor-pointer hover:text-slate-300 transition-colors">Terms of Service</button>
               <button onClick={() => setActiveModal('imprint')} className="cursor-pointer hover:text-slate-300 transition-colors">{t.imprTitle}</button>
          </div>
          <p>© 2025 Safe on Set GmbH. All rights reserved.</p>
      </footer>

      {activeModal !== 'none' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActiveModal('none')}>
              <div 
                className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                 <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900 z-10 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white">
                        {activeModal === 'privacy' && t.privacyTitle}
                        {activeModal === 'terms' && t.termsTitle}
                        {activeModal === 'imprint' && t.imprTitle}
                    </h2>
                    <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20} /></button>
                 </div>
                 <div className="p-8 overflow-y-auto custom-scrollbar">
                     <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                        {activeModal === 'privacy' && t.privacyText}
                        {activeModal === 'terms' && t.termsText}
                        {activeModal === 'imprint' && t.imprText}
                     </div>
                 </div>
                 <div className="p-4 border-t border-white/10 bg-slate-900 rounded-b-2xl flex justify-end">
                     <button onClick={() => setActiveModal('none')} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors border border-white/5">{t.close}</button>
                 </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LandingPage;
