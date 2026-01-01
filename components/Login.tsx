
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Production } from '../types';
import { Mail, ArrowRight, CheckCircle, Lock, ClipboardList, X, KeyRound } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
  lang: Language;
  setLang: (l: Language) => void;
  onAdminClick: () => void;
  onRegister: (prod: Omit<Production, 'id' | 'status'>) => void;
  onSendOTP: (email: string) => Promise<boolean>;
  expectedOTP: string;
  isAdminMode?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, lang, setLang, onAdminClick, onRegister, onSendOTP, expectedOTP, isAdminMode = false }) => {
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState<'email' | 'otp' | 'admin-password'>(isAdminMode ? 'admin-password' : 'email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Registration State
  const [showRegister, setShowRegister] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    coordinator: '',
    email: '',
    country: '',
    customCountry: '',
    periodStart: '',
    periodEnd: '',
    officeAddress: '',
    billingAddress: '',
    trustContactType: 'themis' as 'themis' | 'internal' | 'none',
    trustContactInfo: ''
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Invalid email address');
      return;
    }
    setIsLoading(true);
    setError('');
    
    const success = await onSendOTP(email);
    setIsLoading(false);
    if (success) {
      setStep('otp');
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === expectedOTP && otp !== '') { 
      onLogin(email);
    } else {
      setError('Wrong code. Please check your emails.');
    }
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Admin login with password only as requested
    if (password === 'TahmeeNils54321') {
      onLogin('admin@safe-on-set.com');
    } else {
      setError('Invalid Admin Password');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onRegister({
          ...regForm,
          country: regForm.country === 'OTHER' ? regForm.customCountry : regForm.country
      });
      setRegSuccess(true);
  };

  const Background = () => (
    <>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
    </>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white font-sans p-6 relative overflow-hidden ${lang === 'ar' ? 'font-tajawal' : ''}`} dir={t.dir}>
      <Background />
      
      <div className="w-full max-w-[420px] bg-slate-900/60 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl border border-white/10 relative z-10 ring-1 ring-white/5">
        
        {/* Language Switcher */}
        <div className="absolute top-8 right-8 flex bg-slate-950/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
            {(['en', 'de', 'ar'] as Language[]).map((l) => (
            <button
                key={l}
                onClick={() => setLang(l)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${lang === l ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'text-slate-500 hover:text-slate-300'}`}
            >
                 <span className="text-xl leading-none">{l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}</span>
            </button>
            ))}
        </div>

        {/* Logo Section */}
        <div className="text-center mb-10 mt-4">
          <h1 className="text-4xl font-black mb-1 tracking-tight text-white drop-shadow-sm">Trustory</h1>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">{t.appSub}</p>
        </div>
        
        {isAdminMode || step === 'admin-password' ? (
           <form onSubmit={handleAdminVerify} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Lock size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.adminLogin}</span>
             </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider ml-1">Admin Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-4 pl-11 pr-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm"
                  autoFocus
                />
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              </div>
            </div>
            {error && <p className="text-rose-400 text-xs ml-1 flex items-center gap-1"><X size={12}/> {error}</p>}
            <button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                Access Admin Panel
            </button>
            <button type="button" onClick={() => window.location.reload()} className="w-full text-slate-500 hover:text-white text-xs py-2">Back to User Login</button>
           </form>
        ) : step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider ml-1">{t.email}</label>
              <div className="relative group">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="production@studio.com"
                  className="w-full py-4 pl-11 pr-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm group-hover:border-white/20"
                  autoFocus
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-slate-400 transition-colors" size={18} />
              </div>
            </div>
            {error && <p className="text-rose-400 text-xs ml-1 flex items-center gap-1"><X size={12}/> {error}</p>}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-widest group"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  <>
                    {t.sendCode} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
              )}
            </button>
            <div className="pt-2 flex justify-center">
                <button type="button" onClick={() => setShowRegister(true)} className="text-slate-500 hover:text-slate-300 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2 py-2 px-4 rounded-full hover:bg-white/5">
                    <ClipboardList size={14} /> {t.registerProd}
                </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
             <div className="text-center mb-6 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
               <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">{t.otpSent}</p>
               <p className="text-[10px] text-emerald-200/60 font-mono truncate">{email}</p>
             </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider ml-1">CODE</label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="••••••"
                className="w-full py-4 text-center bg-slate-950/50 border border-white/10 rounded-2xl text-white text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-800"
                maxLength={6}
                autoFocus
              />
            </div>
            {error && <p className="text-rose-400 text-xs text-center">{error}</p>}
            <button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl transition-all transform active:scale-[0.98] text-xs uppercase tracking-widest">
              {t.verifyCode}
            </button>
            <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white py-2">
               {t.backToEmail}
            </button>
          </form>
        )}
      </div>

      <div className="absolute bottom-10 w-full flex justify-center gap-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
        <span className="opacity-50 hover:opacity-100 transition-opacity">© 2025 Trustory GmbH</span>
        <button onClick={onAdminClick} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
            <Lock size={12} className="group-hover:scale-110 transition-transform" /> {t.adminLogin}
        </button>
      </div>

      {/* Registration Modal */}
      {showRegister && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar relative p-10">
                <button onClick={() => { setShowRegister(false); setRegSuccess(false); }} className="absolute top-8 right-8 text-slate-500 hover:text-white bg-white/5 p-2 rounded-full"><X size={20} /></button>
                {regSuccess ? (
                    <div className="text-center py-10">
                        <CheckCircle size={60} className="text-green-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black mb-2">{t.regSuccess}</h2>
                        <p className="text-slate-400 text-sm mb-8">{t.regSuccessDesc}</p>
                        <button onClick={() => setShowRegister(false)} className="px-10 py-4 bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest">Close</button>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-3xl font-black mb-1 uppercase tracking-tighter">{t.regTitle}</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10">{t.regDesc}</p>
                        <form onSubmit={handleRegisterSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">{t.prodName}</label>
                                <input required className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-white" value={regForm.name} onChange={e=>setRegForm({...regForm, name: e.target.value})}/></div>
                                <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">{t.prodCoord}</label>
                                <input required className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-white" value={regForm.coordinator} onChange={e=>setRegForm({...regForm, coordinator: e.target.value})}/></div>
                            </div>
                            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">{t.prodEmail}</label>
                            <input required type="email" className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-white" value={regForm.email} onChange={e=>setRegForm({...regForm, email: e.target.value})}/></div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={()=>setShowRegister(false)} className="flex-1 py-4 bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Register</button>
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
