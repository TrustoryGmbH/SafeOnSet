
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

  // Ambient Background Component
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
           <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/50">T</div>
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
         
         {/* Trust Indicators V2 */}
         <div className="mt-10 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
             <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <CheckCircle size={12} strokeWidth={3} />
                {t.trustBadge1}
             </div>
             <p className="text-xs text-slate-500 max-w-md leading-relaxed flex items-center justify-center gap-2">
                <Globe size={12} className="shrink-0" /> {t.trustBadge2}
             </p>
         </div>

         {/* Visual Element */}
         <div className="mt-20 w-full max-w-4xl relative animate-in fade-in duration-1000 delay-500">
             <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-10" />
             <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl transform rotate-x-12 perspective-1000 group hover:rotate-x-6 transition-transform duration-700 ease-out">
                 <div className="grid grid-cols-3 gap-4 opacity-100">
                      
                      {/* Left Box: Animated Smiley */}
                      <div className="col-span-1 bg-slate-950/40 rounded-xl h-44 flex items-center justify-center flex-col gap-2 relative overflow-hidden border border-white/5 shadow-inner">
                           {/* Pulsing Background (Green now) */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-green-500/5 rounded-full blur-2xl animate-pulse" />
                           
                           {/* Floating Smiley (Score 100 for Green) */}
                           <div className="animate-float relative z-10">
                               <Smiley score={100} size={70} animate={true} />
                           </div>
                           
                           {/* Mood Text */}
                           <div className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest mt-2 px-2 py-0.5 rounded-full bg-green-500/5 border border-green-500/10">
                               100% Positive
                           </div>
                      </div>

                      {/* Right Box: Live Trend Bars */}
                      <div className="col-span-2 bg-slate-950/40 rounded-xl h-44 flex items-center justify-center relative overflow-hidden border border-white/5 shadow-inner">
                          {/* Grid Background Pattern */}
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
                          
                          {/* Bars Container */}
                          <div className="flex gap-4 items-end h-28 w-full px-8 pb-3 border-b border-white/5 relative z-10">
                               {/* Bar 1 */}
                               <div className="flex-1 bg-blue-500/20 rounded-t-md relative group/bar animate-pulse" style={{ height: '40%', animationDuration: '3s' }}>
                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] text-slate-500 opacity-0 group-hover/bar:opacity-100 transition-opacity">Mon</div>
                               </div>
                               {/* Bar 2 */}
                               <div className="flex-1 bg-blue-500/40 rounded-t-md relative group/bar animate-pulse" style={{ height: '60%', animationDuration: '2.5s', animationDelay: '0.2s' }}>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] text-slate-500 opacity-0 group-hover/bar:opacity-100 transition-opacity">Tue</div>
                               </div>
                               {/* Bar 3 */}
                               <div className="flex-1 bg-blue-500/60 rounded-t-md relative group/bar animate-pulse" style={{ height: '50%', animationDuration: '4s', animationDelay: '0.5s' }}>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] text-slate-500 opacity-0 group-hover/bar:opacity-100 transition-opacity">Wed</div>
                               </div>
                               {/* Bar 4 */}
                               <div className="flex-1 bg-blue-500/80 rounded-t-md relative group/bar animate-pulse" style={{ height: '75%', animationDuration: '2s', animationDelay: '0.1s' }}>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] text-slate-500 opacity-0 group-hover/bar:opacity-100 transition-opacity">Thu</div>
                               </div>
                               {/* Active Bar 5 (Today) */}
                               <div className="flex-1 bg-blue-500 rounded-t-md relative shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden" style={{ height: '90%' }}>
                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/40 to-transparent animate-shimmer-slide opacity-50" />
                                    {/* Top glow line */}
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-white/50" />
                               </div>
                          </div>

                          {/* Live Indicator */}
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                               <span className="text-[8px] font-bold text-blue-300 uppercase tracking-wider">Live</span>
                          </div>
                      </div>
                 </div>
             </div>
         </div>
      </main>

      {/* Features Grid */}
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

      {/* Feature Modal */}
      {activeFeature !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
              <div 
                className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Close Btn */}
                  <button 
                    onClick={() => setActiveFeature(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors z-10"
                  >
                      <X size={20} />
                  </button>

                  <div className="p-8 relative">
                      {/* Background Blob for Modal */}
                      <div className={`absolute top-0 right-0 w-64 h-64 ${features[activeFeature].bg} opacity-20 blur-[80px] pointer-events-none rounded-full -translate-y-1/2 translate-x-1/2`}></div>

                      <div className={`w-16 h-16 ${features[activeFeature].bg} rounded-2xl flex items-center justify-center mb-6 ${features[activeFeature].color}`}>
                            {React.createElement(features[activeFeature].icon, { size: 32 })}
                      </div>
                      
                      <h2 className="text-3xl font-bold mb-2">{features[activeFeature].title}</h2>
                      <p className="text-lg text-slate-300 mb-6 font-medium">{features[activeFeature].desc}</p>
                      
                      <div className={`p-6 rounded-2xl bg-white/5 border ${features[activeFeature].border}`}>
                          <p className="text-slate-300 leading-relaxed">
                              {features[activeFeature].more}
                          </p>
                      </div>

                      <button 
                        onClick={() => setActiveFeature(null)}
                        className="w-full mt-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                      >
                          {t.close}
                      </button>
                  </div>
              </div>
              <div className="absolute inset-0 -z-10" onClick={() => setActiveFeature(null)}></div>
          </div>
      )}

      {/* New Section: Trust & Support */}
      <section className="relative z-10 py-24 px-6 bg-[#0b1222]">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
             <div className="flex-1 text-left">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider mb-6">
                    <LifeBuoy size={14} /> Integrated Support
                 </div>
                 <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                    {t.trustSecTitle}
                 </h2>
                 <p className="text-slate-400 text-lg leading-relaxed mb-8">
                    {t.trustSecSub}
                 </p>
                 <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-slate-300">
                        <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
                            <CheckCircle size={14} />
                        </div>
                        {t.trustSecFeat1}
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                        <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
                            <CheckCircle size={14} />
                        </div>
                        {t.trustSecFeat2}
                    </li>
                 </ul>
             </div>

             <div className="flex-1 w-full relative">
                 {/* Decorative background blob */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
                 
                 {/* Card Visual */}
                 <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 relative shadow-2xl backdrop-blur-md transform rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.trustCardTitle}</div>
                                <div className="font-bold text-lg">{t.trustCardName}</div>
                            </div>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></div>
                    </div>
                    
                    <button className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                        <LifeBuoy size={18} />
                        {t.trustCardBtn}
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-4">Secured by 256-bit encryption. 100% Confidential.</p>
                 </div>
             </div>
         </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl font-bold mb-16">{t.howTitle}</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
              {/* Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 -z-10" />

              {[1, 2, 3].map((step) => (
                  <div key={step} className="bg-[#0f172a] p-4 rounded-2xl border border-white/10 w-full md:w-64">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 font-bold border border-white/10 shadow-lg">
                          {step}
                      </div>
                      <h3 className="font-bold text-slate-300">
                          {step === 1 ? t.how1 : step === 2 ? t.how2 : t.how3}
                      </h3>
                  </div>
              ))}
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/5 text-center text-slate-500 text-sm relative z-10">
          <div className="flex justify-center items-center gap-6 mb-8">
               <button onClick={() => setActiveModal('privacy')} className="cursor-pointer hover:text-slate-300 transition-colors">Privacy Policy</button>
               <button onClick={() => setActiveModal('terms')} className="cursor-pointer hover:text-slate-300 transition-colors">Terms of Service</button>
               <button onClick={() => setActiveModal('imprint')} className="cursor-pointer hover:text-slate-300 transition-colors">{t.imprTitle}</button>
          </div>
          <p>© 2025 Trustory GmbH. All rights reserved.</p>
      </footer>

      {/* Text Modals (Privacy, Terms, Imprint) */}
      {activeModal !== 'none' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActiveModal('none')}>
              <div 
                className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                 {/* Header */}
                 <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900 z-10 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white">
                        {activeModal === 'privacy' && t.privacyTitle}
                        {activeModal === 'terms' && t.termsTitle}
                        {activeModal === 'imprint' && t.imprTitle}
                    </h2>
                    <button 
                        onClick={() => setActiveModal('none')}
                        className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                 </div>

                 {/* Content */}
                 <div className="p-8 overflow-y-auto custom-scrollbar">
                     <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                        {activeModal === 'privacy' && t.privacyText}
                        {activeModal === 'terms' && t.termsText}
                        {activeModal === 'imprint' && t.imprText}
                     </div>
                 </div>

                 {/* Footer */}
                 <div className="p-4 border-t border-white/10 bg-slate-900 rounded-b-2xl flex justify-end">
                     <button 
                        onClick={() => setActiveModal('none')}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors border border-white/5"
                     >
                        {t.close}
                     </button>
                 </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default LandingPage;
