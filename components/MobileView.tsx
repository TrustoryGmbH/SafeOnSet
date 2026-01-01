
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, ShootDay } from '../types';
import Smiley from './Smiley';
import { ArrowLeft, Lock, Info, ChevronDown, CheckCircle, ShieldCheck, MessageSquare, CornerDownLeft, Building } from 'lucide-react';

interface MobileViewProps {
  lang: Language;
  setLang: (l: Language) => void;
  onSubmit: (score: number, message?: { text: string; contact: string; department?: string }) => void;
  onBack: () => void;
  schedule: ShootDay[];
  productionName?: string; // Neu: Für Kontextanzeige
}

const MobileView: React.FC<MobileViewProps> = ({ lang, setLang, onSubmit, onBack, schedule, productionName }) => {
  const t = TRANSLATIONS[lang];
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintContact, setComplaintContact] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [isClosed, setIsClosed] = useState(false);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const isOpen = schedule.some(s => s.date === today);
    setIsClosed(!isOpen);

    const voteKey = `trustory_voted_${today}`;
    if (localStorage.getItem(voteKey)) {
        setHasAlreadyVoted(true);
    }
  }, [schedule]);

  const recordVote = () => {
      const today = new Date().toISOString().split('T')[0];
      const voteKey = `trustory_voted_${today}`;
      localStorage.setItem(voteKey, 'true');
      setIsSubmitted(true);
  };

  const handlePositiveClick = () => {
    onSubmit(0, { text: '', contact: '', department: selectedDept || undefined });
    recordVote();
  };

  const handleNegativeClick = () => {
    setShowComplaintForm(true);
  };

  const handleComplaintSubmit = () => {
    if (complaintContact.length < 3 || !complaintText) {
      alert(t.compContact + " required!");
      return;
    }
    onSubmit(100, { text: complaintText, contact: complaintContact, department: selectedDept || undefined });
    recordVote();
  };

  const departments = Object.entries(t.depts);

  const Background = () => (
    <>
      <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
    </>
  );

  if (isSubmitted) {
      return (
          <div className={`fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center text-white ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
              <Background />
              <div className="relative z-10 flex flex-col items-center">
                  <div className="scale-0 animate-zoom-in">
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-full p-8 shadow-[0_0_50px_rgba(34,197,94,0.3)] backdrop-blur-md">
                        <CheckCircle size={80} className="text-green-400" strokeWidth={2} />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold mt-8 mb-3 tracking-tight text-center animate-fade-in opacity-0 text-white" style={{ animationDelay: '0.3s' }}>
                    {t.thankYou}
                  </h1>
                  <p className="text-base text-slate-400 opacity-0 animate-fade-in text-center px-6 leading-relaxed" style={{ animationDelay: '0.6s' }}>
                    {t.voteRegistered}
                  </p>
                  <button onClick={onBack} className="mt-12 text-sm text-slate-500 hover:text-white transition-colors animate-fade-in opacity-0" style={{ animationDelay: '1s' }}>
                      Back to Home
                  </button>
              </div>
          </div>
      );
  }

  if (hasAlreadyVoted) {
      return (
        <div className={`fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center text-white p-6 ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
            <Background />
            <div className="relative z-10 w-full max-sm bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center text-center">
                <ShieldCheck size={64} className="text-blue-400 mb-6" strokeWidth={1.5} />
                <h2 className="text-2xl font-bold mb-3">{t.alreadyVoted}</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">{t.alreadyVotedDesc}</p>
                <div className="w-full h-px bg-white/5 mb-4"></div>
                <div className="text-[10px] uppercase tracking-widest text-slate-600">
                    Trustory Secure Voting
                </div>
            </div>
             <button onClick={onBack} className="relative z-10 mt-8 text-slate-500 hover:text-white transition-colors text-sm font-medium">
                Close
             </button>
        </div>
      );
  }

  return (
    <div className={`fixed inset-0 z-50 bg-[#0f172a] text-white overflow-y-auto overflow-x-hidden ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      <Background />
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex justify-between items-center p-5 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
           <ArrowLeft size={24} />
        </button>
        
        {productionName && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
            <Building size={12} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 truncate max-w-[120px]">{productionName}</span>
          </div>
        )}

        <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-sm">
           {(['en', 'de', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-2xl px-2 py-0.5 rounded-full transition-all ${lang === l ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center pt-8 pb-12 px-6 max-w-md mx-auto min-h-[85vh]">
        
        <div className="w-full flex flex-col items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-center leading-tight mb-2 tracking-tight text-white drop-shadow-sm">
                {t.mobTitle}
            </h1>
            <p className="text-slate-400 text-sm text-center max-w-[80%]">{t.mobQuest}</p>
        </div>

        {isClosed ? (
            <div className="mt-8 text-center flex flex-col items-center bg-white/5 p-8 rounded-3xl border border-white/5">
                <Lock size={48} className="text-slate-500 mb-4" />
                <h2 className="text-xl font-bold mb-2 text-slate-300">{t.votingClosed}</h2>
                <p className="text-slate-500 text-sm">{t.votingClosedDesc}</p>
            </div>
        ) : !showComplaintForm ? (
        <div className="w-full flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-8 duration-500">
            
            <div className="relative w-full">
                <select 
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full p-4 bg-slate-800/50 border border-white/10 rounded-2xl text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none backdrop-blur-sm transition-colors hover:border-white/20"
                >
                    <option value="" className="bg-slate-800">{t.selectDept}</option>
                    {departments.map(([key, label]) => (
                        <option key={key} value={label} className="bg-slate-800">{label}</option>
                    ))}
                </select>
                <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 text-slate-500 pointer-events-none`} size={18} />
            </div>

            <button 
                onClick={handlePositiveClick}
                className="group relative w-full h-32 bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-500/30 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.1)] active:scale-95 transition-all flex items-center justify-between overflow-hidden hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:border-emerald-400/50"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-400/30 transition-all duration-500"></div>

                <div className="flex-1 text-left px-6 z-10">
                    <span className="block text-lg font-bold text-white tracking-wide uppercase drop-shadow-md">{t.btnPositive}</span>
                    <span className="text-xs text-emerald-200/70 font-medium mt-1">Tap to confirm</span>
                </div>
                <div className="pr-6 z-10 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                    <Smiley score={100} size={64} />
                </div>
            </button>

            <button 
                onClick={handleNegativeClick}
                className="group relative w-full h-32 bg-gradient-to-br from-rose-600 to-rose-900 border border-rose-500/30 rounded-3xl shadow-[0_0_30px_rgba(244,63,94,0.1)] active:scale-95 transition-all flex items-center justify-between overflow-hidden hover:shadow-[0_0_40px_rgba(244,63,94,0.2)] hover:border-rose-400/50"
            >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-400/30 transition-all duration-500"></div>

                 <div className="flex-1 text-left px-6 z-10">
                    <span className="block text-lg font-bold text-white tracking-wide uppercase drop-shadow-md">{t.btnNegative}</span>
                    <span className="text-xs text-rose-200/70 font-medium mt-1">Report an issue</span>
                </div>
                <div className="pr-6 z-10 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                     <Smiley score={0} size={64} />
                </div>
            </button>
        </div>
        ) : (
            <div className="w-full bg-slate-900/80 backdrop-blur-xl p-1 rounded-3xl shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300 ring-1 ring-white/5">
                <div className="bg-slate-950/50 rounded-[22px] p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                        <div className="p-2 bg-rose-500/10 rounded-full border border-rose-500/20">
                            <MessageSquare size={20} className="text-rose-400" />
                        </div>
                        <h3 className="font-bold text-lg text-white">{t.btnNegative}</h3>
                    </div>
                    
                    {selectedDept && (
                        <div className="mb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 p-2 rounded-lg inline-block border border-white/5">
                           {t.deptLabel}: <span className="text-white">{selectedDept}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-slate-400 font-bold mb-2 text-xs uppercase tracking-wide">{t.compTitle}</label>
                            <textarea
                                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 focus:outline-none text-white placeholder-slate-600 resize-none text-sm leading-relaxed"
                                rows={4}
                                placeholder={t.compDesc}
                                value={complaintText}
                                onChange={(e) => setComplaintText(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 font-bold mb-2 text-xs uppercase tracking-wide">{t.compContact}</label>
                            <input
                                type="text"
                                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 focus:outline-none text-white placeholder-slate-600 text-sm"
                                placeholder="Phone / Email"
                                value={complaintContact}
                                onChange={(e) => setComplaintContact(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button 
                            onClick={() => setShowComplaintForm(false)}
                            className="flex-1 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 hover:text-white transition-colors text-sm border border-white/5"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={handleComplaintSubmit}
                            className="flex-[2] py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-900/40 hover:from-rose-500 hover:to-rose-600 transition-all active:scale-95 text-sm flex items-center justify-center gap-2 border border-rose-500/20"
                        >
                            {t.submit} <CornerDownLeft size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {!showComplaintForm && !isClosed && (
            <div className="w-full mt-auto pt-8 pb-4">
                <div className="flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity duration-300">
                    <Info size={24} className="text-slate-400 mb-3" />
                    <div className="text-[10px] md:text-xs leading-relaxed text-slate-400 text-center font-medium max-w-xs">
                        {t.disclaimerText}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MobileView;
