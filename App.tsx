
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, INITIAL_SCHEDULE } from './constants';
import { Language, Message, ShootDay, Production } from './types';
import Dashboard from './components/Dashboard';
import MobileView from './components/MobileView';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import { supabase } from './services/supabase';
import { LogOut, Wifi, WifiOff, Loader2 } from 'lucide-react';

const mapProduction = (p: any): Production => ({
  id: p.id,
  name: p.name,
  coordinator: p.coordinator,
  email: p.email,
  status: p.status,
  team: p.team || [],
  country: p.country,
  periodStart: p.period_start,
  periodEnd: p.period_end,
  officeAddress: p.office_address,
  billingAddress: p.billing_address,
  trustContactType: p.trust_contact_type,
  trustContactInfo: p.trust_contact_info
});

function App() {
  const [lang, setLang] = useState<Language>('de');
  const [view, setView] = useState<'landing' | 'login' | 'admin-login' | 'dashboard' | 'admin-dashboard' | 'mobile'>('landing');
  const [currentUser, setCurrentUser] = useState<string>(''); 
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [schedule, setSchedule] = useState<ShootDay[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);

  const [activeProdForFeedback, setActiveProdForFeedback] = useState<Production | null>(null);
  const [generatedOTP, setGeneratedOTP] = useState<string>('');

  useEffect(() => {
    const initData = async () => {
      try {
        // Wir fragen die Datenbank: "Bist du da?"
        const { data: prods, error: pError } = await supabase.from('productions').select('*');
        if (pError) throw pError;
        
        setProductions((prods || []).map(mapProduction));

        const { data: msgs, error: mError } = await supabase.from('messages').select('*').order('date', { ascending: false });
        if (mError) throw mError;
        setMessages(msgs || []);

        const { data: sched } = await supabase.from('shoot_days').select('*');
        setSchedule(sched && sched.length > 0 ? sched : INITIAL_SCHEDULE);
        
        // Wenn wir hier ankommen, hat alles geklappt! -> Punkt wird GRÜN
        setIsConnected(true);
      } catch (err) {
        console.error("Verbindung zu Supabase fehlgeschlagen:", err);
        setIsConnected(false);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initData();
  }, []);

  const handleLogin = (email: string) => {
    setCurrentUser(email);
    if (email === 'admin@internal') setView('admin-dashboard');
    else setView('dashboard');
  };

  const t = TRANSLATIONS[lang];
  const currentProduction = productions.find(p => p.email === currentUser || p.team?.some((m: any) => m.email === currentUser));

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center text-white font-sans">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-400 animate-pulse uppercase tracking-[0.2em] text-xs font-black">Verbinde mit der Cloud...</p>
      </div>
    );
  }

  if (view === 'landing') return <LandingPage lang={lang} setLang={setLang} onLoginClick={() => setView('login')} onSimulateClick={() => setView('mobile')} />;
  if (view === 'mobile') return <MobileView lang={lang} setLang={setLang} schedule={schedule} productionName={activeProdForFeedback?.name} onSubmit={() => {}} onBack={() => setView('landing')} />;
  if (view === 'login') return <Login onLogin={handleLogin} lang={lang} setLang={setLang} onAdminClick={() => setView('admin-login')} onRegister={() => {}} onSendOTP={async () => true} expectedOTP="" />;
  if (view === 'admin-login') return <Login isAdminMode={true} onLogin={handleLogin} lang={lang} setLang={setLang} onAdminClick={() => setView('login')} onRegister={() => {}} onSendOTP={async () => true} expectedOTP="" />;
  
  if (view === 'admin-dashboard') return <AdminDashboard lang={lang} productions={productions} onLogout={() => setView('landing')} onAddProduction={() => {}} onInvite={()=>{}} onUpdateProduction={() => {}} />;

  return (
    <div className={`h-screen w-full bg-[#0f172a] text-white flex flex-col relative ${lang === 'ar' ? 'font-tajawal' : ''}`} dir={t.dir}>
      <header className="h-[75px] border-b border-white/5 flex justify-between items-center px-10 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl tracking-tight">Safe on Set <span className="opacity-20 mx-1">/</span> <span className="text-blue-400">{currentProduction?.name || 'Management'}</span></div>
          
          {/* Das ist der Punkt, der dir zeigt, ob die URL und der Key funktionieren! */}
          <div className={`flex items-center gap-1.5 px-3 py-1 ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'} border rounded-full transition-colors`}>
            {isConnected ? (
              <>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest text-nowrap">Live Cloud</span>
              </>
            ) : (
              <>
                <WifiOff size={10} className="text-rose-500" />
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Offline</span>
              </>
            )}
          </div>
        </div>
        <button className="text-slate-400 hover:text-white text-[10px] font-black uppercase flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-xl border border-white/5 transition-all hover:bg-white/10" onClick={() => setView('landing')}>
          <LogOut size={14} />{t.logout}
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center px-8 overflow-hidden">
        <Dashboard 
          lang={lang} 
          score={100} 
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
