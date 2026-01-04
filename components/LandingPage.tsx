
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { ArrowRight, Shield, BarChart3, Lock, LogIn, Phone, CheckCircle, Globe, X, Beaker, ClipboardCheck, Play, Users, Zap, Mail, User } from 'lucide-react';
import { supabase } from '../services/supabase';

interface LandingPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onLoginClick: () => void;
  onTestAccess: (type: 'code' | 'request') => void;
  onEnterTestCode: (code: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ lang, setLang, onLoginClick, onTestAccess, onEnterTestCode }) => {
  const t = TRANSLATIONS[lang];
  const [activeModal, setActiveModal] = useState<'none' | 'privacy' | 'terms' | 'imprint' | 'test-options' | 'request-form'>('none');
  const [testCode, setTestCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  
  // Request Form States
  const [reqForm, setReqForm] = useState({ firstName: '', lastName: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const features = [
    { id: 1, icon: Shield, title: t.feat1Title, desc: t.feat1Desc, more: t.feat1More, color: "text-purple-400", bg: "bg-purple-500/20" },
    { id: 2, icon: BarChart3, title: t.feat2Title, desc: t.feat2Desc, more: t.feat2More, color: "text-blue-400", bg: "bg-blue-500/20" },
    { id: 3, icon: Lock, title: t.feat3Title, desc: t.feat3Desc, more: t.feat3More, color: "text-emerald-400", bg: "bg-emerald-500/20" }
  ];

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const { error } = await supabase.from('access_requests').insert([{
            first_name: reqForm.firstName,
            last_name: reqForm.lastName,
            name: `${reqForm.firstName} ${reqForm.lastName}`,
            email: reqForm.email,
            status: 'pending'
        }]);
        
        if (error) throw error;
        setIsSuccess(true);
    } catch (err: any) {
        console.error("Supabase Insertion Error:", err);
        alert(`Fehler beim Senden der Anfrage: ${err.message || 'Bitte prüfen Sie die Datenbank-Struktur.'}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setActiveModal('none');
    setShowCodeInput(false);
    setIsSuccess(false);
    setReqForm({ firstName: '', lastName: '', email: '' });
  };

  return (
    <div className={`min-h-screen bg-[#0f172a] text-white flex flex-col relative overflow-x-hidden ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/10 to-transparent opacity-30" />
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-900/50">T</div>
           <span className="font-bold text-xl tracking-tight">Trustory</span>
        </div>
        <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-1 bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-sm">
                {(['en', 'de', 'ar'] as Language[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`text-xl px-2 py-1 rounded-full transition-all ${lang === l ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    {l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}
                </button>
                ))}
            </div>
            <button onClick={onLoginClick} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all border border-white/5 backdrop-blur-md">
                <LogIn size={16} />
                <span>Login</span>
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto pt-20 pb-32">
         <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/80 border border-blue-500/30 text-white text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                {t.appSub}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest backdrop-blur-md h-9">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {t.trustBadge1}
            </div>
         </div>
         
         <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            {t.landHero}
         </h1>
         
         <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mb-12 leading-relaxed font-medium">
            {t.landSub}
         </p>

         <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
             <button onClick={onLoginClick} className="h-16 px-10 bg-blue-600 hover:bg-blue-500 text-white text-xl font-black rounded-2xl shadow-[0_10px_40px_rgba(37,99,235,0.4)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 group">
                {t.landCTA} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
             </button>
             <button onClick={() => setActiveModal('test-options')} className="h-16 px-10 bg-slate-800/40 hover:bg-slate-800 text-slate-200 text-sm font-bold rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 backdrop-blur-md group">
                <Beaker size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                {t.testAccess}
             </button>
         </div>

         <div className="flex flex-col items-center gap-3">
             <div className="flex items-center justify-center gap-4 bg-white/[0.03] px-8 py-3 rounded-2xl border border-white/10 backdrop-blur-xl">
                <Globe size={18} className="text-blue-500" /> 
                <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    {t.trustBadge2}
                </span>
             </div>
         </div>
      </main>

      <section className="relative z-10 py-32 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((f) => (
            <div key={f.id} className="group p-10 rounded-[40px] bg-slate-800/20 border border-white/5 hover:border-white/10 transition-all flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-3xl ${f.bg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <f.icon className={f.color} size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">{f.title}</h3>
              <p className="text-slate-400 font-medium leading-relaxed mb-6">{f.desc}</p>
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${f.color}`}>{f.more}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-8 text-center">
           <h2 className="text-4xl md:text-6xl font-black mb-20 uppercase tracking-tight italic">
            <span className="text-blue-500 mr-4">0.0</span> {t.howTitle}
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-left">
              {[
                { step: "01", title: t.how1, desc: "Fast registration within 5 minutes.", icon: Zap },
                { step: "02", title: t.how2, desc: "Place posters in catering and key areas.", icon: Play },
                { step: "03", title: t.how3, desc: "Real-time mood feedback via QR.", icon: Users }
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="text-9xl font-black text-white opacity-[0.03] absolute -top-16 -left-8">{item.step}</div>
                  <div className="relative z-10">
                    <item.icon className="text-blue-500 mb-6" size={40} />
                    <h4 className="text-2xl font-black mb-4 uppercase tracking-tight">{item.title}</h4>
                    <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      <section className="relative z-10 py-32 bg-slate-900/80">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tight">{t.trustSecTitle}</h2>
          <p className="text-slate-400 text-xl font-medium mb-20">{t.trustSecSub}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
             {[t.trustSecFeat1, t.trustSecFeat2, t.trustSecFeat3].map((f, i) => (
               <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center gap-4 justify-center">
                 <CheckCircle size={20} className="text-emerald-500" />
                 <span className="font-bold text-sm tracking-wide">{f}</span>
               </div>
             ))}
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 rounded-[48px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 text-left">
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 mb-2">{t.trustCardTitle}</h3>
                <h4 className="text-3xl font-black mb-4 uppercase tracking-tight">{t.trustCardName}</h4>
                <p className="text-blue-100/70 font-medium max-w-sm">Direct psychological support and professional advice for film crews.</p>
             </div>
             <button className="h-16 px-10 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all flex items-center gap-3">
                <Phone size={20} /> {t.trustCardBtn}
             </button>
          </div>
        </div>
      </section>

      <footer className="py-20 px-8 border-t border-white/5 text-center text-slate-500 text-sm relative z-10 bg-slate-950">
          <div className="flex flex-col items-center mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-black text-white mb-4 border border-white/5">T</div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Trustory GmbH</p>
          </div>
          <div className="flex justify-center items-center gap-8 mb-10 font-bold uppercase tracking-widest text-[10px]">
               <button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
               <button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors">Terms of Service</button>
               <button onClick={() => setActiveModal('imprint')} className="hover:text-white transition-colors">{t.imprTitle}</button>
          </div>
          <p className="font-medium opacity-50">© 2025 Trustory GmbH. All rights reserved.</p>
      </footer>

      {/* Modals */}
      {(activeModal === 'test-options' || activeModal === 'request-form') && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={closeModal}>
              <div className="bg-[#0f172a] border border-white/10 rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                 <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                        {activeModal === 'request-form' ? t.requestTestAccess : (showCodeInput ? t.enterTestCode : t.testAccess)}
                    </h2>
                    <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                 </div>
                 
                 <div className="p-8">
                    {activeModal === 'request-form' ? (
                        isSuccess ? (
                            <div className="text-center py-6 animate-in slide-in-from-bottom-4">
                                <CheckCircle size={64} className="text-emerald-500 mx-auto mb-6" />
                                <h3 className="text-2xl font-black mb-3 uppercase tracking-tight text-white">{t.regSuccess}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                    Ihre Daten sind eingegangen. Nach Überprüfung erhalten Sie Ihren kostenfreien Zugang per E-Mail.
                                </p>
                                <button onClick={closeModal} className="w-full py-5 bg-blue-600 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-blue-900/30 transition-all hover:bg-blue-500">
                                    {t.close}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleRequestSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Vorname</label>
                                    <div className="relative">
                                        <input required type="text" value={reqForm.firstName} onChange={e => setReqForm({...reqForm, firstName: e.target.value})} className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all pl-11" placeholder="Max" />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nachname</label>
                                    <div className="relative">
                                        <input required type="text" value={reqForm.lastName} onChange={e => setReqForm({...reqForm, lastName: e.target.value})} className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all pl-11" placeholder="Mustermann" />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">E-Mail Adresse</label>
                                    <div className="relative">
                                        <input required type="email" value={reqForm.email} onChange={e => setReqForm({...reqForm, email: e.target.value})} className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all pl-11" placeholder="max@beispiel.de" />
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    </div>
                                </div>
                                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl mt-4 uppercase tracking-[0.2em] shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-2">
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Jetzt Anfragen'}
                                </button>
                                <p className="text-[10px] text-slate-500 text-center mt-4">Kostenfrei • Unverbindlich • 24h Freischaltung</p>
                            </form>
                        )
                    ) : (
                        showCodeInput ? (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="text-center mb-6">
                                    <Beaker size={48} className="text-blue-500 mx-auto mb-4" />
                                    <p className="text-slate-400 text-sm">Geben Sie Ihren Zugangscode ein.</p>
                                </div>
                                <input type="text" value={testCode} onChange={(e) => setTestCode(e.target.value.toUpperCase())} placeholder="XXXXX" className="w-full py-5 text-center bg-slate-900 border border-blue-500/30 rounded-2xl text-white text-3xl font-black tracking-[0.5em] outline-none" maxLength={5} autoFocus />
                                <button onClick={() => onEnterTestCode(testCode)} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-all">Bestätigen</button>
                                <button onClick={() => setShowCodeInput(false)} className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest py-2">Zurück</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <button onClick={() => setShowCodeInput(true)} className="w-full flex items-center gap-4 p-5 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all text-left group">
                                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform"><LogIn size={24} /></div>
                                    <div>
                                        <div className="font-black text-white uppercase text-xs tracking-widest">{t.enterTestCode}</div>
                                    </div>
                                </button>
                                <button onClick={() => setActiveModal('request-form')} className="w-full flex items-center gap-4 p-5 bg-slate-800/40 border border-white/10 rounded-2xl hover:bg-slate-800 transition-all text-left group">
                                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 shrink-0 group-hover:scale-110 transition-transform"><ClipboardCheck size={24} /></div>
                                    <div>
                                        <div className="font-black text-white uppercase text-xs tracking-widest">{t.requestTestAccess}</div>
                                        <div className="text-slate-400 text-xs mt-1">Get an official test account</div>
                                    </div>
                                </button>
                            </div>
                        )
                    )}
                 </div>
                 
                 {/* Only show footer on form view, not success view */}
                 {!isSuccess && (
                    <div className="p-6 bg-slate-950/50 flex justify-end">
                        <button onClick={closeModal} className="px-8 py-3 bg-slate-800 text-white text-[10px] font-black rounded-xl uppercase tracking-widest border border-white/5">{t.close}</button>
                    </div>
                 )}
              </div>
          </div>
      )}

      {/* Legacy Modals (Privacy etc) */}
      {(['privacy', 'terms', 'imprint'].includes(activeModal)) && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={closeModal}>
               <div className="bg-[#0f172a] border border-white/10 rounded-[32px] shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-black mb-6 uppercase tracking-tight text-white">Information</h2>
                    <div className="text-slate-300 whitespace-pre-line font-medium text-sm leading-relaxed max-h-[400px] overflow-y-auto pr-4 mb-6">
                        {activeModal === 'privacy' && t.privacyText}
                        {activeModal === 'terms' && t.termsText}
                        {activeModal === 'imprint' && t.imprText}
                    </div>
                    <button onClick={closeModal} className="w-full py-4 bg-slate-800 text-white font-black rounded-xl uppercase tracking-widest border border-white/5">Schließen</button>
               </div>
          </div>
      )}
    </div>
  );
};

export default LandingPage;
