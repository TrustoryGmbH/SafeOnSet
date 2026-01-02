
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Production } from '../types';
import { Mail, ArrowRight, CheckCircle, Lock, ClipboardList, X, Shield, KeyRound } from 'lucide-react';

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

const COUNTRIES = [
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'UAE', name: 'UAE', flag: '🇦🇪' },
  { code: 'OTHER', name: 'Other / Sonstiges', flag: '🌍' },
];

const Login: React.FC<LoginProps> = ({ onLogin, lang, setLang, onAdminClick, onRegister, onSendOTP, expectedOTP, isAdminMode = false }) => {
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '', coordinator: '', email: '', country: '', customCountry: '',
    periodStart: '', periodEnd: '', officeAddress: '', billingAddress: '',
    trustContactType: 'themis' as 'themis' | 'internal' | 'none', trustContactInfo: ''
  });

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Das besprochene Admin-Passwort
    if (password === 'admin1234') {
        onLogin('admin@internal'); // Interner Identifier für den Admin-Status
    } else {
        setError('Ungültiges Passwort');
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminMode) return handleAdminSubmit(e);
    
    if (!email.includes('@')) {
      setError('Ungültige E-Mail-Adresse');
      return;
    }
    setIsLoading(true);
    setError('');
    const success = await onSendOTP(email);
    setIsLoading(false);
    if (success) setStep('otp');
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === expectedOTP && otp !== '') { 
      onLogin(email);
    } else {
      setError('Falscher Code. Bitte überprüfe deine E-Mails.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white font-sans p-6 relative overflow-hidden ${lang === 'ar' ? 'font-tajawal' : ''}`} dir={t.dir}>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />
      
      <div className={`w-full max-w-[420px] bg-slate-900/60 backdrop-blur-2xl p-10 rounded-[32px] shadow-2xl border ${isAdminMode ? 'border-purple-500/30' : 'border-white/10'} relative z-10 ring-1 ring-white/5`}>
        
        <div className="absolute top-6 right-6 flex bg-slate-950/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
            {(['en', 'de', 'ar'] as Language[]).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${lang === l ? 'bg-white/10 text-white' : 'text-slate-500'}`}>
                 <span className="text-xl leading-none">{l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}</span>
            </button>
            ))}
        </div>

        <div className="text-center mb-10 mt-4">
          <div className={`w-16 h-16 ${isAdminMode ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' : 'bg-blue-600/10 text-blue-500 border-blue-500/20'} rounded-2xl border flex items-center justify-center mx-auto mb-6 shadow-xl`}>
             {isAdminMode ? <Shield size={32} /> : <Lock size={32} />}
          </div>
          <h1 className="text-3xl font-black mb-1 tracking-tight text-white">{isAdminMode ? 'Admin Portal' : 'Trustory'}</h1>
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em]">{isAdminMode ? 'System Management' : t.appSub}</p>
        </div>
        
        {isAdminMode ? (
           <form onSubmit={handleAdminSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">Admin Password</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full py-4 pl-12 pr-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-lg" 
                    placeholder="••••••••" 
                    required 
                    autoFocus
                  />
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                </div>
              </div>
              {error && <p className="text-rose-400 text-xs text-center font-bold">{error}</p>}
              <button type="submit" className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl shadow-xl shadow-purple-900/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                Access Dashboard <ArrowRight size={16} />
              </button>
              <button type="button" onClick={onAdminClick} className="w-full text-slate-500 text-[10px] uppercase font-bold tracking-widest hover:text-white pt-2">Back to User Login</button>
           </form>
        ) : step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">{t.email}</label>
              <div className="relative group">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="coordinator@production.com" className="w-full py-4 pl-11 pr-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white outline-none transition-all text-sm group-hover:border-white/20" autoFocus />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              </div>
            </div>
            {error && <p className="text-rose-400 text-xs ml-1">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t.sendCode} <ArrowRight size={18} /></>}
            </button>
            <div className="pt-2 flex justify-center"><button type="button" onClick={() => setShowRegister(true)} className="text-slate-500 hover:text-slate-300 transition-colors text-xs font-medium flex items-center gap-2 py-2 px-4 rounded-full hover:bg-white/5"><ClipboardList size={14} /> {t.registerProd}</button></div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6 animate-in slide-in-from-right-8 duration-300">
             <div className="text-center mb-6 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20"><p className="text-emerald-200 text-sm font-medium">{t.otpSent}</p><p className="text-xs text-emerald-200/60 mt-1 font-mono">{email}</p></div>
            <div><input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="••••••" className="w-full py-4 text-center bg-slate-950/50 border border-white/10 rounded-2xl text-white text-2xl font-mono tracking-[0.5em] outline-none" maxLength={6} autoFocus /></div>
            {error && <p className="text-rose-400 text-xs text-center">{error}</p>}
            <button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wide">{t.verifyCode}</button>
            <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="w-full text-slate-500 text-xs hover:text-slate-300 py-2">{t.backToEmail}</button>
          </form>
        )}
      </div>

      <div className="absolute bottom-8 w-full flex justify-center gap-6 text-[10px] font-medium text-slate-600 uppercase tracking-widest">
        <span>© 2025 Trustory GmbH</span>
        {!isAdminMode && <button onClick={onAdminClick} className="flex items-center gap-1 hover:text-slate-400 transition-colors"><Shield size={10} /> {t.adminLogin}</button>}
      </div>

      {showRegister && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 max-h-[95vh] overflow-y-auto relative">
                <button onClick={() => { setShowRegister(false); setRegSuccess(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 p-2"><X size={20} /></button>
                {regSuccess ? (
                    <div className="p-12 text-center flex flex-col items-center min-h-[400px]">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6"><CheckCircle size={40} className="text-green-400" /></div>
                        <h2 className="text-2xl font-bold mb-3">{t.regSuccess}</h2>
                        <p className="text-slate-400 max-w-sm">{t.regSuccessDesc}</p>
                        <button onClick={() => { setShowRegister(false); setRegSuccess(false); }} className="mt-8 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl">{t.close}</button>
                    </div>
                ) : (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold mb-8">{t.regTitle}</h2>
                        <form onSubmit={(e) => { e.preventDefault(); onRegister(regForm as any); setRegSuccess(true); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Country</label>
                                <select value={regForm.country} onChange={e => setRegForm({...regForm, country: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white">
                                    {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                                </select>
                             </div>
                             <div><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t.prodName}</label><input required value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white" /></div>
                             <div><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t.prodCoord}</label><input required value={regForm.coordinator} onChange={e => setRegForm({...regForm, coordinator: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white" /></div>
                             <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t.prodEmail}</label><input required type="email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white" /></div>
                             <div className="md:col-span-2 flex gap-3 mt-4"><button type="button" onClick={() => setShowRegister(false)} className="flex-1 py-3 bg-slate-700 text-white rounded-xl">{t.cancel}</button><button type="submit" className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl">{t.submit}</button></div>
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
