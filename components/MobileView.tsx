
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, ShootDay } from '../types';
import { ArrowLeft, Lock, ChevronDown, CheckCircle, ShieldCheck, Send, X } from 'lucide-react';

interface MobileViewProps {
  lang: Language;
  setLang: (l: Language) => void;
  onSubmit: (score: number, message?: { text: string; contact: string; department?: string }) => void;
  onBack: () => void;
  schedule: ShootDay[];
  productionName?: string;
}

const MobileView: React.FC<MobileViewProps> = ({ lang, setLang, onSubmit, onBack, schedule, productionName }) => {
  const t = TRANSLATIONS[lang];
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintContact, setComplaintContact] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [isClosed, setIsClosed] = useState(false);
  const [activeDay, setActiveDay] = useState<ShootDay | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let active = schedule.find(s => (s as any).active === true);
    if (!active) active = schedule.find(s => s.date === today);
    if (!active && schedule.length === 0) active = { day: 1, date: today };
    
    setActiveDay(active || null);
    setIsClosed(!active);

    if (active) {
      const voteKey = `trustory_voted_${active.date}`;
      setHasAlreadyVoted(!!localStorage.getItem(voteKey));
    } else {
      setHasAlreadyVoted(false);
    }
  }, [schedule]);

  const recordVote = () => {
    const voteDate = activeDay?.date || new Date().toISOString().split('T')[0];
    localStorage.setItem(`trustory_voted_${voteDate}`, 'true');
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
    if (!complaintText.trim()) {
      alert(lang === 'de' ? 'Bitte beschreibe den Vorfall.' : lang === 'ar' ? 'يرجى وصف الحادثة.' : 'Please describe the incident.');
      return;
    }
    onSubmit(100, { text: complaintText, contact: complaintContact || '', department: selectedDept || undefined });
    recordVote();
  };

  const departments = Object.entries(t.depts);

  // ========== THANK YOU SCREEN ==========
  if (isSubmitted) {
    return (
      <div className={`fixed inset-0 z-50 bg-[#0a0f1a] flex flex-col items-center justify-center text-white ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col items-center px-8">
          <div className="scale-0 animate-zoom-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle size={40} className="text-emerald-400" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold mt-6 mb-2 tracking-tight text-center text-white animate-fade-in opacity-0" style={{ animationDelay: '0.3s' }}>
            {t.thankYou}
          </h1>
          <p className="text-sm text-slate-500 opacity-0 animate-fade-in text-center max-w-[260px] leading-relaxed" style={{ animationDelay: '0.5s' }}>
            {t.voteRegistered}
          </p>
          <button onClick={onBack} className="mt-10 text-xs text-slate-600 hover:text-slate-400 transition-colors animate-fade-in opacity-0 uppercase tracking-widest font-bold" style={{ animationDelay: '0.8s' }}>
            {lang === 'de' ? 'Schließen' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  // ========== ALREADY VOTED SCREEN ==========
  if (hasAlreadyVoted) {
    return (
      <div className={`fixed inset-0 z-50 bg-[#0a0f1a] flex flex-col items-center justify-center text-white p-8 ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
        <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
          <ShieldCheck size={32} className="text-blue-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold mb-2 text-center">{t.alreadyVoted}</h2>
        <p className="text-slate-500 text-sm text-center max-w-[260px] leading-relaxed">{t.alreadyVotedDesc}</p>
        <div className="mt-8 text-[9px] uppercase tracking-[0.2em] text-slate-700 font-bold">Trustory Secure Voting</div>
        <button onClick={onBack} className="mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest font-bold">
          {lang === 'de' ? 'Schließen' : 'Close'}
        </button>
      </div>
    );
  }

  // ========== MAIN VOTING VIEW ==========
  return (
    <div className={`fixed inset-0 z-50 bg-[#0a0f1a] text-white overflow-y-auto overflow-x-hidden ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      {/* Subtle gradient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
      
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-20 flex justify-between items-center px-5 py-4 bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.04] active:bg-white/10 transition-colors" aria-label={lang === 'de' ? 'Zurück' : 'Back'}>
          <ArrowLeft size={18} className="text-slate-400" aria-hidden="true" />
        </button>
        
        {productionName && (
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 truncate max-w-[140px]">
            {productionName}
          </span>
        )}

        <div className="flex gap-0.5 bg-white/[0.03] p-0.5 rounded-full" role="group" aria-label="Sprache">
          {(['en', 'de', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-label={l === 'en' ? 'English' : l === 'de' ? 'Deutsch' : 'العربية'}
              aria-pressed={lang === l}
              className={`text-lg w-8 h-8 flex items-center justify-center rounded-full transition-all ${lang === l ? 'bg-white/10' : 'opacity-40'}`}
            >
              <span aria-hidden="true">{l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ---- Content ---- */}
      <div className="relative z-10 flex flex-col items-center px-5 pt-8 pb-10 max-w-sm mx-auto" style={{ minHeight: 'calc(100vh - 60px)' }}>
        
        {/* Day badge + Title */}
        <div className="w-full flex flex-col items-center mb-8">
          {activeDay && (
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400/80">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {lang === 'de' ? `Drehtag ${activeDay.day}` : `Day ${activeDay.day}`}
            </div>
          )}
          <h1 className="text-xl font-bold text-center leading-snug tracking-tight text-white mb-1.5">
            {t.mobTitle}
          </h1>
          <p className="text-slate-500 text-[13px] text-center max-w-[280px] leading-relaxed">{t.mobQuest}</p>
        </div>

        {/* ---- VOTING CLOSED ---- */}
        {isClosed ? (
          <div className="w-full text-center flex flex-col items-center py-12">
            <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
              <Lock size={24} className="text-slate-600" />
            </div>
            <h2 className="text-lg font-bold mb-1 text-slate-400">{t.votingClosed}</h2>
            <p className="text-slate-600 text-sm max-w-[240px]">{t.votingClosedDesc}</p>
          </div>

        /* ---- COMPLAINT FORM ---- */
        ) : showComplaintForm ? (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              
              {/* Form header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">{t.compTitle}</h3>
                <button onClick={() => setShowComplaintForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.04] active:bg-white/10 transition-colors">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>

              {selectedDept && (
                <div className="mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {t.deptLabel}: <span className="text-slate-300">{selectedDept}</span>
                </div>
              )}

              {/* Textarea */}
              <div className="mb-4">
                <textarea
                  id="complaint-text"
                  className="w-full p-4 bg-black/20 border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500/30 focus:outline-none text-white placeholder-slate-700 resize-none text-sm leading-relaxed"
                  rows={3}
                  maxLength={500}
                  placeholder={t.compDesc}
                  value={complaintText}
                  onChange={(e) => { setComplaintText(e.target.value); setCharCount(e.target.value.length); }}
                  aria-required="true"
                  autoFocus
                />
                <div className="text-right mt-1 text-[10px] text-slate-700 tabular-nums">{charCount}/500</div>
              </div>

              {/* Contact (optional) */}
              <div className="mb-6">
                <label htmlFor="complaint-contact" className="block text-slate-500 font-bold mb-1.5 text-[10px] uppercase tracking-widest">
                  {t.compContact} <span className="text-slate-700 font-normal">– {lang === 'de' ? 'freiwillig' : 'optional'}</span>
                </label>
                <input
                  id="complaint-contact"
                  type="text"
                  className="w-full p-3.5 bg-black/20 border border-white/[0.06] rounded-xl focus:ring-1 focus:ring-rose-500/40 focus:border-rose-500/30 focus:outline-none text-white placeholder-slate-700 text-sm"
                  placeholder={lang === 'de' ? 'Email / Telefon' : lang === 'ar' ? 'بريد / هاتف' : 'Email / Phone'}
                  value={complaintContact}
                  onChange={(e) => setComplaintContact(e.target.value)}
                  aria-required="false"
                />
              </div>

              {/* Actions */}
              <button
                onClick={handleComplaintSubmit}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
              >
                {t.submit} <Send size={14} />
              </button>
            </div>
          </div>

        /* ---- VOTING BUTTONS ---- */
        ) : (
          <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
            
            {/* Department selector */}
            <div className="relative">
              <label htmlFor="dept-select" className="sr-only">{t.selectDept}</label>
              <select 
                id="dept-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                aria-label={t.selectDept}
                className="w-full py-3.5 px-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-400 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/40 appearance-none transition-colors"
              >
                <option value="" className="bg-slate-900">{t.selectDept}</option>
                {departments.map(([key, label]) => (
                  <option key={key} value={label} className="bg-slate-900">{label}</option>
                ))}
              </select>
              <ChevronDown className={`absolute ${lang === 'ar' ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none`} size={16} />
            </div>

            {/* Positive Button */}
            <button 
              onClick={handlePositiveClick}
              aria-label={t.btnPositive}
              className="group w-full py-6 bg-emerald-600/15 border border-emerald-500/20 rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 hover:bg-emerald-600/25 hover:border-emerald-500/30"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center group-active:scale-90 transition-transform">
                <span className="text-2xl">😊</span>
              </div>
              <span className="text-base font-bold text-emerald-300 tracking-wide">{t.btnPositive}</span>
            </button>

            {/* Negative Button */}
            <button 
              onClick={handleNegativeClick}
              aria-label={t.btnNegative}
              className="group w-full py-6 bg-rose-600/10 border border-rose-500/15 rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 hover:bg-rose-600/20 hover:border-rose-500/25"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center group-active:scale-90 transition-transform">
                <span className="text-2xl">😔</span>
              </div>
              <span className="text-base font-bold text-rose-300 tracking-wide">{t.btnNegative}</span>
            </button>
          </div>
        )}

        {/* ---- Footer info ---- */}
        {!showComplaintForm && !isClosed && (
          <div className="w-full mt-auto pt-10 pb-2">
            <p className="text-[10px] text-slate-700 text-center leading-relaxed max-w-[240px] mx-auto">
              {t.disclaimerText}
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-slate-800 uppercase tracking-[0.15em] font-bold">
              <ShieldCheck size={10} />
              {lang === 'de' ? 'Anonym & DSGVO-konform' : 'Anonymous & GDPR compliant'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileView;
