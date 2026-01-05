
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, INITIAL_SCHEDULE } from './constants';
import { Language, Message, ShootDay, Production } from './types';
import Dashboard from './components/Dashboard';
import MobileView from './components/MobileView';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import { supabase } from './services/supabase';
import { LogOut, WifiOff, Loader2, Beaker, AlertTriangle } from 'lucide-react';

const mapProduction = (p: any): Production => ({
  id: p.id,
  name: p.name,
  coordinator: p.coordinator,
  email: p.email,
  status: p.status,
  team: p.team || [],
  country: p.country,
  periodStart: p.period_start,
  periodEnd: p.period_end
});

function App() {
  const [lang, setLang] = useState<Language>('de');
  const [view, setView] = useState<'landing' | 'login' | 'admin-login' | 'dashboard' | 'admin-dashboard' | 'mobile'>('landing');
  const [loginViewMode, setLoginViewMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<string>(''); 
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [schedule, setSchedule] = useState<ShootDay[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [expectedOTP, setExpectedOTP] = useState('');

  const [isSandboxMode, setIsSandboxMode] = useState(false);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      const { data: prods } = await supabase.from('productions').select('*');
      setProductions((prods || []).map(mapProduction));

      const { data: msgs } = await supabase.from('messages').select('*').order('date', { ascending: false });
      setMessages(msgs || []);

      const { data: sched } = await supabase.from('shoot_days').select('*');
      setSchedule(sched && sched.length > 0 ? sched : INITIAL_SCHEDULE);
      
      setIsConnected(true);
    } catch (err) {
      console.error("Connection failed:", err);
      setIsConnected(false);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleLogin = (email: string) => {
    setCurrentUser(email);
    if (email === 'admin@internal') {
        setView('admin-dashboard');
    } else if (email === 'test-account@internal' || email === 'XPLM2') {
        setIsSandboxMode(true);
        setMessages([]); // Reset for test
        setView('dashboard');
    } else {
        setView('dashboard');
    }
  };

  const handleTestCodeEntry = (code: string) => {
    if (code.toUpperCase() === 'XPLM2') {
        handleLogin('test-account@internal');
    } else {
        alert("Invalid Test Code");
    }
  };

  const handleRegisterAccess = async (payload: any) => {
    try {
        const { error } = await supabase.from('access_requests').insert([payload]);
        if (error) throw error;
    } catch (err: any) {
        console.error("Registration failed:", err);
    }
  };

  const handleSendOTP = async (email: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedOTP(code);
    try {
        await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            body: JSON.stringify({
                to: email,
                subject: "Ihr Trustory Login Code",
                html: `<div style="font-family: sans-serif; text-align: center; padding: 40px;">
                        <h1 style="color: #2563eb; font-size: 48px; letter-spacing: 0.2em;">${code}</h1>
                        <p style="color: #64748b;">Geben Sie diesen Code ein, um auf Ihr Dashboard zuzugreifen.</p>
                       </div>`
            })
        });
        return true;
    } catch (e) {
        return true; 
    }
  };

  const t = TRANSLATIONS[lang];
  const currentProduction = isSandboxMode 
    ? { id: 'test', name: 'Sandbox Production', coordinator: 'Tester', email: 'test@internal', status: 'Test' as const }
    : productions.find(p => p.email === currentUser || p.team?.some((m: any) => m.email === currentUser));

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Connecting Cloud...</p>
      </div>
    );
  }

  if (view === 'landing') return (
    <LandingPage 
        lang={lang} 
        setLang={setLang} 
        onLoginClick={() => { setLoginViewMode('login'); setView('login'); }} 
        onAdminLoginClick={() => setView('admin-login')}
        onRegisterClick={() => { setLoginViewMode('register'); setView('login'); }}
        onEnterTestCode={handleTestCodeEntry}
        onTestAccess={(type) => {
            if (type === 'code') {
               // Modal-Logik wird in LandingPage gehandhabt
            } else {
               setView('login');
            }
        }} 
    />
  );
  
  if (view === 'mobile') return (
    <MobileView 
        lang={lang} 
        setLang={setLang} 
        schedule={schedule} 
        productionName={currentProduction?.name} 
        onSubmit={() => {}} 
        onBack={() => setView('landing')} 
    />
  );

  if (view === 'login' || view === 'admin-login') return (
    <Login 
        isAdminMode={view === 'admin-login'}
        onLogin={handleLogin} 
        lang={lang} 
        setLang={setLang} 
        onAdminClick={() => setView(view === 'login' ? 'admin-login' : 'login')} 
        onRegister={handleRegisterAccess} 
        onSendOTP={handleSendOTP} 
        expectedOTP={expectedOTP} 
        initialShowRegister={loginViewMode === 'register'}
    />
  );
  
  if (view === 'admin-dashboard') return (
    <AdminDashboard 
        lang={lang} 
        productions={productions} 
        onLogout={() => setView('landing')} 
        onAddProduction={() => {}} 
        onInvite={()=>{}} 
        onUpdateProduction={() => {}} 
    />
  );

  return (
    <div className={`h-screen w-full bg-[#0f172a] text-white flex flex-col relative ${lang === 'ar' ? 'font-tajawal' : ''}`} dir={t.dir}>
      <header className="h-[75px] border-b border-white/5 flex justify-between items-center px-10 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl tracking-tight text-white">
            Safe on Set <span className="opacity-20 mx-1">/</span> 
            <span className="text-blue-400">{currentProduction?.name || 'Management'}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'} border rounded-full`}>
            {isConnected ? <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> : <WifiOff size={10} className="text-rose-500" />}
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`}>{isConnected ? (isSandboxMode ? 'Sandbox' : 'Live Cloud') : 'Offline'}</span>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white text-[10px] font-black uppercase flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-xl border border-white/5 transition-all" onClick={() => { setIsSandboxMode(false); setView('landing'); }}>
          <LogOut size={14} />{t.logout}
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-8">
        {isSandboxMode && (
            <div className="mb-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl max-w-lg w-full">
                <AlertTriangle className="text-amber-500" size={18} />
                <p className="text-xs text-amber-200 font-medium">{t.testAccountInfo}</p>
            </div>
        )}
        <Dashboard 
          lang={lang} 
          score={isSandboxMode ? 100 : 95} 
          messages={messages} 
          schedule={schedule} 
          onOpenInbox={() => {}} 
          onOpenHistory={() => {}} 
          onOpenEmail={() => {}} 
          productionName={currentProduction?.name || 'Production'} 
          productionId={currentProduction?.id || '1'} 
        />
      </main>
    </div>
  );
}

export default App;
