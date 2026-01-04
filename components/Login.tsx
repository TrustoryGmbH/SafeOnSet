
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Production } from '../types';
import { Mail, ArrowRight, CheckCircle, Lock, ClipboardList, X, Shield, KeyRound, Beaker } from 'lucide-react';

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
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '', email: ''
  });

  const ADMIN_EMAIL = 'trustorygmbh@gmail.com';

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const targetEmail = isAdminMode ? ADMIN_EMAIL : email;
    
    // Test code directly in login also works as a backup
    if (!isAdminMode && email.toUpperCase() === 'XPLM2') {
        onLogin('XPLM2');
        return;
    }

    if (!isAdminMode && !email.includes('@')) {
      setError('Invalid Email');
      return;
    }

    setIsLoading(true);
    const success = await onSendOTP(targetEmail);
    setIsLoading(false);
    if (success) setStep('otp');
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === expectedOTP && otp !== '') { 
      onLogin(isAdminMode ? 'admin@internal' : email);
    } else {
      setError('Invalid Code');
    }
  };

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
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">
                {isAdminMode ? 'Admin Account' : t.email}
              </label>
              <div className="relative group">
                <input 
                    type="text" 
                    value={isAdminMode ? '••••••••••••••••' : email} 
                    onChange={(e) => !isAdminMode && setEmail(e.target.value)} 
                    placeholder={isAdminMode ? 'Protected Access' : "Email address"} 
                    className={`w-full py-4 pl-11 pr-4 ${isAdminMode ? 'bg-slate-950/30 text-slate-500 cursor-not-allowed' : 'bg-slate-950/50 text-white'} border border-white/10 rounded-2xl outline-none transition-all text-sm`} 
                    disabled={isAdminMode}
                    autoFocus={!isAdminMode}
                />
                {isAdminMode ? <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} /> : <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />}
              </div>
            </div>
            {error && <p className="text-rose-400 text-xs ml-1">{error}</p>}
            <button type="submit" disabled={isLoading} className={`w-full h-14 ${isAdminMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide`}>
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
          <form onSubmit={handleVerify} className="space-y-6 animate-in slide-in-from-right-8 duration-300">
             <div className="text-center mb-6 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                <p className="text-emerald-200 text-sm font-medium">{t.otpSent}</p>
                <p className="text-xs text-emerald-200/60 mt-1 font-mono">{isAdminMode ? 'Admin Account' : email}</p>
             </div>
            <div>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="••••••" className="w-full py-4 text-center bg-slate-950/50 border border-white/10 rounded-2xl text-white text-2xl font-mono tracking-[0.5em] outline-none" maxLength={6} autoFocus />
            </div>
            {error && <p className="text-rose-400 text-xs text-center">{error}</p>}
            <button type="submit" className={`w-full h-14 ${isAdminMode ? 'bg-purple-600' : 'bg-blue-600'} text-white font-bold rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wide`}>
                {t.verifyCode}
            </button>
            <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="w-full text-slate-500 text-xs hover:text-slate-300 py-2">
                {t.backToEmail}
            </button>
          </form>
        )}
      </div>

      <div className="absolute bottom-8 w-full flex justify-center gap-6 text-[10px] font-medium text-slate-600 uppercase tracking-widest">
        <span>© 2025 Trustory GmbH</span>
        {!isAdminMode && <button onClick={onAdminClick} className="flex items-center gap-1 hover:text-slate-400"><Shield size={10} /> {t.adminLogin}</button>}
      </div>

      {showRegister && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-lg shadow-2xl relative p-10">
                <button onClick={() => setShowRegister(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white p-2"><X size={24} /></button>
                {regSuccess ? (
                    <div className="text-center py-12">
                        <CheckCircle size={64} className="text-emerald-500 mx-auto mb-6" />
                        <h2 className="text-3xl font-black mb-3 uppercase tracking-tight">{t.regSuccess}</h2>
                        <p className="text-slate-400 font-medium">{t.regSuccessDesc}</p>
                        <button onClick={() => setShowRegister(false)} className="mt-10 bg-slate-800 px-10 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs border border-white/5">Close</button>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">{t.requestTestAccess}</h2>
                        <form onSubmit={(e) => { e.preventDefault(); onRegister(regForm as any); setRegSuccess(true); }} className="space-y-6">
                             <div><label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 block ml-1">Full Name</label><input required value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-colors" /></div>
                             <div><label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 block ml-1">Email</label><input required type="email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-colors" /></div>
                             <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl mt-6 uppercase tracking-[0.2em] shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-all">Send Request</button>
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
