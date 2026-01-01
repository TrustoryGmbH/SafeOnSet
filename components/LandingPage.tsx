
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { ArrowRight, Shield, BarChart3, Lock, LogIn, Phone, CheckCircle, Globe, X } from 'lucide-react';
import Smiley from './Smiley';

interface LandingPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onLoginClick: () => void;
  onSimulateClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ lang, setLang, onLoginClick, onSimulateClick }) => {
  const t = TRANSLATIONS[lang];
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
           <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-900/50">T</div>
           <span className="font-bold text-xl tracking-tight">Trustory</span>
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
         
         {/* Top Badge Area: Typewriter + Version Badge */}
         <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 animate-fade-in">
            {/* Typewriter Box */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/80 border border-blue-500/30 text-white text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(59,130,246,0.2)] relative overflow-hidden h-9">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                <div className="relative inline-block overflow-hidden whitespace-nowrap animate-typing border-r-2 border-blue-500 animate-cursor-blink pr-1 leading-none h-3">
                  {t.appSub}
                </div>
            </div>
            
            {/* Version Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest backdrop-blur-md h-9">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {t.trustBadge1}
            </div>
         </div>
         
         <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 animate-in zoom-in duration-700">
            {t.landHero}
         </h1>
         
         <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 font-medium">
            {t.landSub}
         </p>

         <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
             <button 
                onClick={onLoginClick}
                className="h-16 px-10 bg-blue-600 hover:bg-blue-500 text-white text-xl font-black rounded-2xl shadow-[0_10px_40px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_60px_rgba(37,99,235,0.6)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 group"
             >
                {t.landCTA} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
             </button>
             
             <button 
                onClick={onSimulateClick}
                className="h-16 px-10 bg-slate-800/40 hover:bg-slate-800 text-slate-200 text-sm font-bold rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 backdrop-blur-md group"
             >
                <Phone size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                Simulate Mobile App
             </button>
         </div>
         
         {/* Trust Indicators (Region List) */}
         <div className="mt-16 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
             <div className="flex items-center justify-center gap-4 bg-white/[0.03] px-8 py-3 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl max-w-3xl">
                <Globe size={18} className="text-blue-500 shrink-0" /> 
                <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    {t.trustBadge2}
                </span>
             </div>
         </div>

         {/* Preview Section */}
         <div className="mt-24 w-full max-w-4xl relative animate-in fade-in duration-1000 delay-500 opacity-60 hover:opacity-100 transition-opacity">
             <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-10" />
             <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-2xl backdrop-blur-xl transform rotate-x-6 perspective-1000">
                 <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-1 bg-slate-950/40 rounded-2xl h-48 flex items-center justify-center flex-col gap-2 relative overflow-hidden border border-white/5 shadow-inner">
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-green-500/5 rounded-full blur-2xl animate-pulse" />
                           <div className="animate-float relative z-10">
                               <Smiley score={100} size={80} animate={true} />
                           </div>
                           <div className="text-[10px] font-black text-green-500/80 uppercase tracking-widest mt-2 px-3 py-1 rounded-full bg-green-500/5 border border-green-500/10">
                               Excellent Status
                           </div>
                      </div>
                      <div className="col-span-2 bg-slate-950/40 rounded-2xl h-48 flex items-center justify-center relative overflow-hidden border border-white/5 shadow-inner p-8">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
                          <div className="flex gap-4 items-end h-32 w-full px-4 pb-4 border-b border-white/5 relative z-10">
                               <div className="flex-1 bg-blue-500/10 rounded-t-lg" style={{ height: '40%' }}></div>
                               <div className="flex-1 bg-blue-500/20 rounded-t-lg" style={{ height: '60%' }}></div>
                               <div className="flex-1 bg-blue-500/30 rounded-t-lg" style={{ height: '50%' }}></div>
                               <div className="flex-1 bg-blue-500/50 rounded-t-lg" style={{ height: '75%' }}></div>
                               <div className="flex-1 bg-blue-600 rounded-t-lg shadow-[0_0_25px_rgba(37,99,235,0.4)] relative overflow-hidden" style={{ height: '90%' }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent animate-shimmer-slide" />
                               </div>
                          </div>
                      </div>
                 </div>
             </div>
         </div>
      </main>

      <section className="relative z-10 bg-slate-900/40 border-t border-white/5 py-32 px-6">
         <div className="max-w-6xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 {features.map((feature) => (
                    <div 
                        key={feature.id}
                        className="bg-slate-800/20 p-10 rounded-[40px] border border-white/5 hover:border-white/20 transition-all group cursor-default"
                    >
                        <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mb-8 ${feature.color} group-hover:scale-110 transition-transform shadow-lg`}>
                            <feature.icon size={32} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 text-white">
                            {feature.title}
                        </h3>
                        <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                             <CheckCircle size={12} className="text-blue-500" />
                             {feature.more}
                        </div>
                    </div>
                 ))}
             </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8 border-t border-white/5 text-center text-slate-500 text-sm relative z-10">
          <div className="flex justify-center items-center gap-8 mb-10 font-bold uppercase tracking-widest text-[10px]">
               <button onClick={() => setActiveModal('privacy')} className="cursor-pointer hover:text-white transition-colors">Privacy Policy</button>
               <button onClick={() => setActiveModal('terms')} className="cursor-pointer hover:text-white transition-colors">Terms of Service</button>
               <button onClick={() => setActiveModal('imprint')} className="cursor-pointer hover:text-white transition-colors">{t.imprTitle}</button>
          </div>
          <p className="font-medium opacity-50">© 2025 Trustory GmbH. All rights reserved.</p>
      </footer>

      {activeModal !== 'none' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActiveModal('none')}>
              <div 
                className="bg-slate-900 border border-white/10 rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                 <div className="flex items-center justify-between p-8 border-b border-white/10 bg-slate-900 z-10 rounded-t-[32px]">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                        {activeModal === 'privacy' && t.privacyTitle}
                        {activeModal === 'terms' && t.termsTitle}
                        {activeModal === 'imprint' && t.imprTitle}
                    </h2>
                    <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24} /></button>
                 </div>
                 <div className="p-10 overflow-y-auto custom-scrollbar">
                     <div className="text-slate-300 text-base leading-relaxed whitespace-pre-line font-medium">
                        {activeModal === 'privacy' && t.privacyText}
                        {activeModal === 'terms' && t.termsText}
                        {activeModal === 'imprint' && t.imprText}
                     </div>
                 </div>
                 <div className="p-6 border-t border-white/10 bg-slate-900 rounded-b-[32px] flex justify-end">
                     <button onClick={() => setActiveModal('none')} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-black rounded-xl transition-colors border border-white/5 uppercase tracking-widest">{t.close}</button>
                 </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LandingPage;
