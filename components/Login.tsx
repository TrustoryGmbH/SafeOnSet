
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { Mail, ArrowRight, CheckCircle, Lock, ClipboardList, X, Shield, User, Building, Calendar, Phone, MapPin } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
  lang: Language;
  setLang: (l: Language) => void;
  onAdminClick: () => void;
  onRegister: (data: any) => void;
  onSendOTP: (email: string) => Promise<boolean>;
  expectedOTP: string;
  isAdminMode?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, lang, setLang, onAdminClick, onRegister, onSendOTP, expectedOTP, isAdminMode = false }) => {
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  
  // Detailliertes Formular State
  const [regForm, setRegForm] = useState({
    productionName: '',
    managerName: '',
    managerEmail: '',
    coordinatorName: '',
    coordinatorEmail: '',
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    billingAddress: '',
    officeAddress: '',
    phone: ''
  });

  const ADMIN_EMAIL = 'trustorygmbh@gmail.com';

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const targetEmail = isAdminMode ? ADMIN_EMAIL : email;
    if (!isAdminMode && email.toUpperCase() === 'XPLM2') { onLogin('XPLM2'); return; }
    if (!isAdminMode && !email.includes('@')) { setError('Invalid Email'); return; }
    setIsLoading(true);
    const success = await onSendOTP(targetEmail);
    setIsLoading(false);
    if (success) setStep('otp');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        request_type: 'production',
        name: regForm.productionName,
        email: regForm.managerEmail, // Primary contact
        manager_name: regForm.managerName,
        manager_email: regForm.managerEmail,
        coordinator_name: regForm.coordinatorName,
        coordinator_email: regForm.coordinatorEmail,
        start_period: `${regForm.startMonth}/${regForm.startYear}`,
        end_period: `${regForm.endMonth}/${regForm.endYear}`,
        billing_address: regForm.billingAddress,
        office_address: regForm.officeAddress,
        phone: regForm.phone,
        status: 'pending'
    };
    onRegister(payload);
    setRegSuccess(true);
  };

  const InputField = ({ label, icon: Icon, value, onChange, placeholder, required = true, type = "text" }: any) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
          {label} {!required && <span className="opacity-40 font-medium">({t.optional})</span>}
        </label>
        <div className="relative">
            <input 
                required={required} 
                type={type}
                value={value} 
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full p-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-all pl-11"
            />
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
        </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white p-6 relative overflow-hidden ${lang === 'ar' ? 'font-tajawal' : ''}`} dir={t.dir}>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className={`w-full max-w-[420px] bg-slate-900/60 backdrop-blur-2xl p-10 rounded-[32px] shadow-2xl border ${isAdminMode ? 'border-purple-500/30' : 'border-white/10'} relative z-10`}>
        <div className="absolute top-6 right-6 flex bg-slate-950/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
            {(['en', 'de', 'ar'] as Language[]).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${lang === l ? 'bg-white/10 text-white' : 'text-slate-500'}`}>
                 <span className="text-xl">{l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}</span>
            </button>
            ))}
        </div>

        <div className="text-center mb-10 mt-4">
          <div className={`w-16 h-16 ${isAdminMode ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/10 text-blue-500'} rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-6`}>
             {isAdminMode ? <Shield size={32} /> : <Lock size={32} />}
          </div>
          <h1 className="text-3xl font-black mb-1 tracking-tight text-white">{isAdminMode ? 'Admin Portal' : 'Trustory'}</h1>
          {!isAdminMode && <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em]">{t.appSub}</p>}
        </div>
        
        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">{isAdminMode ? 'Admin Account' : t.email}</label>
              <div className="relative group">
                <input type="text" value={isAdminMode ? '••••••••••••••••' : email} onChange={(e) => !isAdminMode && setEmail(e.target.value)} placeholder={isAdminMode ? 'Protected Access' : t.email} className={`w-full py-4 pl-11 pr-4 ${isAdminMode ? 'bg-slate-950/30 text-slate-500 cursor-not-allowed' : 'bg-slate-950/50 text-white'} border border-white/10 rounded-2xl outline-none transition-all text-sm`} disabled={isAdminMode} autoFocus={!isAdminMode} />
                {isAdminMode ? <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} /> : <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />}
              </div>
            </div>
            <button type="submit" disabled={isLoading} className={`w-full h-14 ${isAdminMode ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'} text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide`}>
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isAdminMode ? 'Secured Log-In' : t.sendCode)}
            </button>
            <div className="pt-2 flex flex-col items-center gap-4">
                {!isAdminMode && (
                  <button type="button" onClick={() => setShowRegister(true)} className="text-slate-500 hover:text-slate-300 transition-colors text-xs font-medium flex items-center gap-2 py-2 px-4 rounded-full hover:bg-white/5">
                      <ClipboardList size={14} /> {t.registerProd}
                  </button>
                )}
                <button type="button" onClick={() => window.location.href = '/'} className="text-slate-600 hover:text-slate-400 transition-colors text-[10px] uppercase font-black tracking-widest">Back to Home</button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (otp === expectedOTP) onLogin(isAdminMode ? 'admin@internal' : email); else setError('Code falsch'); }} className="space-y-6">
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="••••••" className="w-full py-4 text-center bg-slate-950/50 border border-white/10 rounded-2xl text-white text-2xl font-mono tracking-[0.5em] outline-none" maxLength={6} autoFocus />
            {error && <p className="text-rose-400 text-xs text-center">{error}</p>}
            <button type="submit" className={`w-full h-14 ${isAdminMode ? 'bg-purple-600' : 'bg-blue-600'} text-white font-bold rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wide`}>{t.verifyCode}</button>
          </form>
        )}
      </div>

      {/* RIESIGES REGISTRIERUNGS MODAL */}
      {showRegister && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-white/10 rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar">
                <button onClick={() => setShowRegister(false)} className="fixed md:absolute top-8 right-8 text-slate-400 hover:text-white p-2 z-50 bg-slate-900 rounded-full border border-white/10 transition-colors">
                  <X size={24} />
                </button>
                
                {regSuccess ? (
                    <div className="text-center py-24 px-10">
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
                            <CheckCircle size={48} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black mb-4 uppercase tracking-tight text-white">{t.regSuccess}</h2>
                        <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
                            {t.regSuccessDesc}
                        </p>
                        <button onClick={() => setShowRegister(false)} className="bg-slate-800 hover:bg-slate-700 px-12 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs border border-white/5 transition-all">
                          {t.close}
                        </button>
                    </div>
                ) : (
                    <div className="p-10 md:p-14">
                        <div className="mb-12">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
                                <ClipboardList size={12} /> {t.registerProd}
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tight text-white">{t.regTitle}</h2>
                            <p className="text-slate-500 mt-2 font-medium">{t.regDesc}</p>
                        </div>

                        <form onSubmit={handleRegisterSubmit} className="space-y-10">
                             {/* Section: Projekt */}
                             <div className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Building size={16} /> <span className="text-xs font-black uppercase tracking-widest">{t.generalInfo}</span>
                                </div>
                                <InputField label={t.prodName} icon={Building} value={regForm.productionName} onChange={(v:any) => setRegForm({...regForm, productionName: v})} placeholder="z.B. Tatort München" />
                             </div>

                             {/* Section: Personen */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <User size={16} /> <span className="text-xs font-black uppercase tracking-widest">{t.role}: PL</span>
                                    </div>
                                    <InputField label={t.nameLabel} icon={User} value={regForm.managerName} onChange={(v:any) => setRegForm({...regForm, managerName: v})} placeholder="Max Mustermann" />
                                    <InputField label={t.emailLabel} type="email" icon={Mail} value={regForm.managerEmail} onChange={(v:any) => setRegForm({...regForm, managerEmail: v})} placeholder="max@produktion.de" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <User size={16} /> <span className="text-xs font-black uppercase tracking-widest">{t.role}: Coord.</span>
                                    </div>
                                    <InputField required={false} label={t.nameLabel} icon={User} value={regForm.coordinatorName} onChange={(v:any) => setRegForm({...regForm, coordinatorName: v})} placeholder="Julia Schmidt" />
                                    <InputField required={false} label={t.emailLabel} type="email" icon={Mail} value={regForm.coordinatorEmail} onChange={(v:any) => setRegForm({...regForm, coordinatorEmail: v})} placeholder="julia@produktion.de" />
                                </div>
                             </div>

                             {/* Section: Zeitraum */}
                             <div className="pt-4 border-t border-white/5 space-y-4">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Calendar size={16} /> <span className="text-xs font-black uppercase tracking-widest">{t.period}</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InputField label="Start MM" icon={Calendar} value={regForm.startMonth} onChange={(v:any) => setRegForm({...regForm, startMonth: v})} placeholder="05" />
                                    <InputField label="Start JJJJ" icon={Calendar} value={regForm.startYear} onChange={(v:any) => setRegForm({...regForm, startYear: v})} placeholder="2025" />
                                    <InputField label="Ende MM" icon={Calendar} value={regForm.endMonth} onChange={(v:any) => setRegForm({...regForm, endMonth: v})} placeholder="08" />
                                    <InputField label="Ende JJJJ" icon={Calendar} value={regForm.endYear} onChange={(v:any) => setRegForm({...regForm, endYear: v})} placeholder="2025" />
                                </div>
                             </div>

                             {/* Section: Adressen & Kontakt */}
                             <div className="pt-4 border-t border-white/5 space-y-6">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <MapPin size={16} /> <span className="text-xs font-black uppercase tracking-widest">{t.officeAddr} & {t.billingAddr}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.billingAddr}</label>
                                        <textarea required rows={3} value={regForm.billingAddress} onChange={e => setRegForm({...regForm, billingAddress: e.target.value})} className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500 resize-none" placeholder="Firma, Straße, PLZ, Ort" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.officeAddr}</label>
                                        <textarea required rows={3} value={regForm.officeAddress} onChange={e => setRegForm({...regForm, officeAddress: e.target.value})} className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500 resize-none" placeholder="Straße, Ort, Motiv..." />
                                    </div>
                                </div>
                                <InputField required={false} label="Telefon Rückfragen" icon={Phone} type="tel" value={regForm.phone} onChange={(v:any) => setRegForm({...regForm, phone: v})} placeholder="+49 123 456789" />
                             </div>

                             <div className="pt-10">
                                <button type="submit" className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[20px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/50 transition-all flex items-center justify-center gap-3 group">
                                    {t.submit} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <p className="text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest mt-6">Sie erhalten eine Kopie per E-Mail nach der Freischaltung.</p>
                             </div>
                        </form>
                    </div>
                )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Login;
