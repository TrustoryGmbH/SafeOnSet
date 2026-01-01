
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Production } from '../types';
import { Mail, ArrowRight, CheckCircle, Lock, ClipboardList, X, Calendar, MapPin, Building, Shield, Globe } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
  lang: Language;
  setLang: (l: Language) => void;
  onAdminClick: () => void;
  onRegister: (prod: Omit<Production, 'id' | 'status'>) => void;
  onSendOTP: (email: string) => Promise<boolean>;
  expectedOTP: string;
}

const COUNTRIES = [
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'UAE', name: 'UAE', flag: '🇦🇪' },
  { code: 'OTHER', name: 'Other / Sonstiges', flag: '🌍' },
];

const Login: React.FC<LoginProps> = ({ onLogin, lang, setLang, onAdminClick, onRegister, onSendOTP, expectedOTP }) => {
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
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
      setError('Ungültige E-Mail-Adresse');
      return;
    }
    setIsLoading(true);
    setError('');
    
    const success = await onSendOTP(email);
    
    setIsLoading(false);
    if (success) {
      setStep('otp');
    } else {
      // Error handling is mostly done via alerts in App.tsx
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === expectedOTP && otp !== '') { 
      onLogin(email);
    } else {
      setError('Falscher Code. Bitte überprüfe deine E-Mails.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const finalCountry = regForm.country === 'OTHER' ? regForm.customCountry : regForm.country;
      
      onRegister({
          name: regForm.name,
          coordinator: regForm.coordinator,
          email: regForm.email,
          country: finalCountry,
          periodStart: regForm.periodStart,
          periodEnd: regForm.periodEnd,
          officeAddress: regForm.officeAddress,
          billingAddress: regForm.billingAddress,
          trustContactType: regForm.trustContactType,
          trustContactInfo: regForm.trustContactInfo
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
      
      <div className="w-full max-w-[420px] bg-slate-900/60 backdrop-blur-2xl p-10 rounded-[32px] shadow-2xl border border-white/10 relative z-10 ring-1 ring-white/5">
        
        {/* Language Switcher */}
        <div className="absolute top-6 right-6 flex bg-slate-950/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
            {(['en', 'de', 'ar'] as Language[]).map((l) => (
            <button
                key={l}
                onClick={() => setLang(l)}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${lang === l ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'text-slate-500 hover:text-slate-300'}`}
                title={l === 'en' ? 'English' : l === 'de' ? 'Deutsch' : 'Arabic'}
            >
                 <span className="text-xl leading-none">{l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}</span>
            </button>
            ))}
        </div>

        {/* Logo Section */}
        <div className="text-center mb-12 mt-4">
          <h1 className="text-4xl font-black mb-2 tracking-tight text-white drop-shadow-sm">Trustory</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">{t.appSub}</p>
        </div>
        
        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">{t.email}</label>
              <div className="relative group">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="production@studio.com"
                  className="w-full py-4 pl-11 pr-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm group-hover:border-white/20"
                  autoFocus
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-400 transition-colors" size={18} />
              </div>
            </div>
            
            {error && <p className="text-rose-400 text-xs ml-1 flex items-center gap-1"><X size={12}/> {error}</p>}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-wide group"
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
                <button 
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="text-slate-500 hover:text-slate-300 transition-colors text-xs font-medium flex items-center gap-2 py-2 px-4 rounded-full hover:bg-white/5"
                >
                    <ClipboardList size={14} /> {t.registerProd}
                </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
             <div className="text-center mb-6 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
               <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-400">
                    <Mail size={20} />
               </div>
               <p className="text-emerald-200 text-sm font-medium">
                 {t.otpSent}
               </p>
               <p className="text-xs text-emerald-200/60 mt-1 font-mono">{email}</p>
             </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">Verifizierungscode</label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="••••••"
                className="w-full py-4 text-center bg-slate-950/50 border border-white/10 rounded-2xl text-white text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder-slate-700"
                maxLength={6}
                autoFocus
              />
            </div>
            {error && <p className="text-rose-400 text-xs text-center">{error}</p>}
            
            <button 
              type="submit" 
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
            >
              {t.verifyCode}
            </button>
            
            <button 
               type="button"
               onClick={() => { setStep('email'); setOtp(''); setError(''); }}
               className="w-full text-slate-500 text-xs hover:text-slate-300 py-2"
            >
               {t.backToEmail}
            </button>
          </form>
        )}
      </div>

      <div className="absolute bottom-8 w-full flex justify-center gap-6 text-[10px] font-medium text-slate-600 uppercase tracking-widest">
        <span>© 2025 Trustory GmbH</span>
        <button onClick={onAdminClick} className="flex items-center gap-1 hover:text-slate-400 transition-colors">
            <Lock size={10} /> {t.adminLogin}
        </button>
      </div>

      {/* Registration Modal */}
      {showRegister && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" dir={t.dir}>
              <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-[zoom-in_0.2s_ease-out] max-h-[95vh] overflow-y-auto custom-scrollbar relative">
                <button 
                    onClick={() => { setShowRegister(false); setRegSuccess(false); }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 p-2 bg-slate-800 rounded-full"
                >
                    <X size={20} />
                </button>

                {regSuccess ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle size={40} className="text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">{t.regSuccess}</h2>
                        <p className="text-slate-400 max-w-sm leading-relaxed">{t.regSuccessDesc}</p>
                        <button 
                            onClick={() => { setShowRegister(false); setRegSuccess(false); }}
                            className="mt-8 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl"
                        >
                            {t.close}
                        </button>
                    </div>
                ) : (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold mb-2">{t.regTitle}</h2>
                        <p className="text-slate-400 text-sm mb-8">{t.regDesc}</p>

                        <form onSubmit={handleRegisterSubmit} className="space-y-6">
                            
                            {/* Country Selection (Top) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t.countryLabel}</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={regForm.country}
                                        onChange={e => setRegForm({...regForm, country: e.target.value})}
                                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none appearance-none"
                                    >
                                        <option value="" disabled>{t.selectCountry}</option>
                                        {COUNTRIES.map(c => (
                                            <option key={c.code} value={c.name} className="bg-slate-800">
                                                {c.flag} {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <Globe className="absolute right-3 top-3 text-slate-500 pointer-events-none" size={16} />
                                </div>
                                {regForm.country === 'Other / Sonstiges' && (
                                    <input 
                                        required
                                        value={regForm.customCountry}
                                        onChange={e => setRegForm({...regForm, customCountry: e.target.value})}
                                        className="w-full mt-2 p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                        placeholder={t.otherCountryPlaceholder}
                                    />
                                )}
                            </div>

                            {/* General */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t.prodName}</label>
                                    <input 
                                        required
                                        value={regForm.name}
                                        onChange={e => setRegForm({...regForm, name: e.target.value})}
                                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                        placeholder="Project X"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t.prodCoord}</label>
                                    <input 
                                        required
                                        value={regForm.coordinator}
                                        onChange={e => setRegForm({...regForm, coordinator: e.target.value})}
                                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                        placeholder="Full Name"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t.prodEmail}</label>
                                <input 
                                    required
                                    type="email"
                                    value={regForm.email}
                                    onChange={e => setRegForm({...regForm, email: e.target.value})}
                                    className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                    placeholder="coordinator@production.com"
                                />
                            </div>

                            {/* Period */}
                            <div>
                                <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2"><Calendar size={14}/> {t.period}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-slate-500 mb-1 uppercase">{t.periodStart}</label>
                                        <input 
                                            type="date"
                                            required
                                            value={regForm.periodStart}
                                            onChange={e => setRegForm({...regForm, periodStart: e.target.value})}
                                            className="w-full p-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-500 mb-1 uppercase">{t.periodEnd}</label>
                                        <input 
                                            type="date"
                                            required
                                            value={regForm.periodEnd}
                                            onChange={e => setRegForm({...regForm, periodEnd: e.target.value})}
                                            className="w-full p-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Addresses */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2"><MapPin size={14}/> {t.officeAddr}</h3>
                                    <textarea 
                                        required
                                        rows={3}
                                        value={regForm.officeAddress}
                                        onChange={e => setRegForm({...regForm, officeAddress: e.target.value})}
                                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none resize-none"
                                        placeholder="Street, City, Zip"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2"><Building size={14}/> {t.billingAddr}</h3>
                                    <textarea 
                                        required
                                        rows={3}
                                        value={regForm.billingAddress}
                                        onChange={e => setRegForm({...regForm, billingAddress: e.target.value})}
                                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none resize-none"
                                        placeholder="Company Name, Address..."
                                    />
                                </div>
                            </div>

                            {/* Trust Section */}
                            <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                                <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                                    <Shield size={14}/> {t.trustSection} <span className="text-slate-500 font-normal">{t.optional}</span>
                                </h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${regForm.trustContactType === 'themis' ? 'border-green-500 bg-green-500/20' : 'border-slate-500 group-hover:border-slate-300'}`}>
                                            {regForm.trustContactType === 'themis' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                        </div>
                                        <input 
                                            type="radio" 
                                            name="trust" 
                                            className="hidden" 
                                            checked={regForm.trustContactType === 'themis'} 
                                            onChange={() => setRegForm({...regForm, trustContactType: 'themis'})}
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{t.trustThemis}</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                         <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${regForm.trustContactType === 'internal' ? 'border-green-500 bg-green-500/20' : 'border-slate-500 group-hover:border-slate-300'}`}>
                                            {regForm.trustContactType === 'internal' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                        </div>
                                        <input 
                                            type="radio" 
                                            name="trust" 
                                            className="hidden" 
                                            checked={regForm.trustContactType === 'internal'} 
                                            onChange={() => setRegForm({...regForm, trustContactType: 'internal'})}
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{t.trustInternal}</span>
                                    </label>

                                    {regForm.trustContactType === 'internal' && (
                                        <input 
                                            value={regForm.trustContactInfo}
                                            onChange={e => setRegForm({...regForm, trustContactInfo: e.target.value})}
                                            className="w-full ml-8 p-2 bg-slate-900/50 border border-slate-600 rounded text-sm outline-none focus:border-green-500 mt-1"
                                            placeholder={t.trustInternalName}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowRegister(false)}
                                    className="flex-1 py-3 bg-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-600 text-sm"
                                >
                                    {t.cancel}
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 shadow-lg shadow-green-900/30 text-sm"
                                >
                                    {t.submit}
                                </button>
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
