
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, INITIAL_SCHEDULE, INITIAL_PRODUCTIONS } from './constants';
import { Language, Message, ShootDay, Production } from './types';
import Dashboard from './components/Dashboard';
import MobileView from './components/MobileView';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import { LogOut, X, Inbox, CheckCircle2, Send, Mail as MailIcon, Loader2 } from 'lucide-react';

function App() {
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<'landing' | 'login' | 'admin-login' | 'dashboard' | 'admin-dashboard' | 'mobile'>('landing');
  const [currentUser, setCurrentUser] = useState<string>(''); 
  const [negVotes, setNegVotes] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [schedule, setSchedule] = useState<ShootDay[]>(INITIAL_SCHEDULE);
  const [productions, setProductions] = useState<Production[]>(INITIAL_PRODUCTIONS);

  const [activeProdForFeedback, setActiveProdForFeedback] = useState<Production | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'email' | 'inbox' | 'history' | 'settings' | 'impressum'>('none');
  const [generatedOTP, setGeneratedOTP] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [reportEmail, setReportEmail] = useState('');

  useEffect(() => {
    const channel = new BroadcastChannel('safe-on-set_v1');
    channel.onmessage = (event) => {
      if (event.data.type === 'UPDATE') syncFromStorage();
    };
    const currentProds = syncFromStorage();
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('prod');
    if (prodId) {
      const targetProd = currentProds.find(p => p.id === prodId);
      if (targetProd) {
        setActiveProdForFeedback(targetProd);
        setView('mobile');
      }
    }
    return () => channel.close();
  }, []);

  const currentProduction = productions.find(p => p.email === currentUser || p.team?.some(m => m.email === currentUser));
  
  const syncFromStorage = () => {
    const sNeg = parseInt(localStorage.getItem('negVotes') || '0');
    const sTotal = parseInt(localStorage.getItem('totalVotes') || '0');
    const sMsgs = JSON.parse(localStorage.getItem('incidentMessages') || '[]');
    const sSched = JSON.parse(localStorage.getItem('shootSchedule') || 'null');
    const sProds = JSON.parse(localStorage.getItem('productions') || 'null') || INITIAL_PRODUCTIONS;
    
    setNegVotes(sNeg);
    setTotalVotes(sTotal);
    setMessages(sMsgs);
    if(sSched) setSchedule(sSched);
    setProductions(sProds);
    return sProds as Production[];
  };

  const persistData = (key: string, data: any) => {
    localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
    const channel = new BroadcastChannel('safe-on-set_v1');
    channel.postMessage({ type: 'UPDATE' });
    channel.close();
  };

  const sendEmailViaBackend = async (to: string, subject: string, html: string) => {
    setIsSendingEmail(true);
    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html }),
      });
      return response.ok;
    } catch (err) {
      return false;
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleRegister = async (prod: Omit<Production, 'id' | 'status'>) => {
    const html = `<h2>New Production Request</h2><p><b>Name:</b> ${prod.name}</p><p><b>Contact:</b> ${prod.email}</p>`;
    const success = await sendEmailViaBackend(prod.email, `Registration: ${prod.name}`, html);
    if (success) {
      const newProd: Production = { ...prod, id: Date.now().toString(), status: 'Pending', team: [] };
      const updated = [...productions, newProd];
      setProductions(updated);
      persistData('productions', updated);
    }
  };

  const score = totalVotes === 0 ? 100 : Math.max(0, 100 - (negVotes * 10));
  const t = TRANSLATIONS[lang];

  if (view === 'landing') return <LandingPage lang={lang} setLang={setLang} onLoginClick={() => setView('login')} onSimulateClick={() => setView('mobile')} />;
  
  if (view === 'mobile') return (
    <MobileView lang={lang} setLang={setLang} schedule={schedule} productionName={activeProdForFeedback?.name || "Safe on Set"}
      onSubmit={handleMobileSubmit} onBack={() => { window.history.replaceState({}, '', window.location.pathname); setView('landing'); }} 
    />
  );

  if (view === 'admin-dashboard') return <AdminDashboard lang={lang} productions={productions} onLogout={() => {setCurrentUser(''); setView('landing');}} onAddProduction={()=>{}} onInvite={()=>{}} onUpdateProduction={()=>{}} />;
  
  if (view === 'admin-login') return (
    <Login 
      isAdminMode={true}
      onLogin={(email) => { setCurrentUser(email); setView('admin-dashboard'); }} 
      lang={lang} setLang={setLang} onAdminClick={() => setView('login')} 
      onRegister={handleRegister} onSendOTP={async () => true} expectedOTP=""
    />
  );

  if (view === 'login') return (
    <Login 
      onLogin={(email) => { setCurrentUser(email); setView('dashboard'); }} 
      lang={lang} setLang={setLang} onAdminClick={() => setView('admin-login')} 
      onRegister={handleRegister} 
      onSendOTP={async (email) => { 
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOTP(otp);
        return await sendEmailViaBackend(email, "Login Code", `<h2>Code: ${otp}</h2>`);
      }}
      expectedOTP={generatedOTP}
    />
  );

  // Hilfsfunktionen für Mobile Submit & Resolve ... (unverändert)
  function handleMobileSubmit(s: number, p?: any) {
    let nN = negVotes; let nT = totalVotes + 1; if (s > 50) nN++;
    const nMs = [...messages]; if (p) nMs.unshift({ id: Date.now().toString(), date: new Date().toLocaleTimeString(), text: p.text, contact: p.contact, score: s, department: p.department, resolved: false });
    persistData('negVotes', nN.toString()); persistData('totalVotes', nT.toString()); persistData('incidentMessages', nMs);
    setNegVotes(nN); setTotalVotes(nT); setMessages(nMs);
  }

  return (
    <div className={`h-screen w-full bg-[#0f172a] text-white flex flex-col relative ${lang === 'ar' ? 'font-tajawal' : ''}`} dir={t.dir}>
      <header className="h-[75px] border-b border-white/5 flex justify-between items-center px-10">
        <div className="font-bold text-xl">Safe on Set <span className="opacity-30">/</span> Management</div>
        <button className="text-slate-400 hover:text-white text-[10px] font-black uppercase flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-xl border border-white/5" onClick={() => {setCurrentUser(''); setView('landing');}}>
          <LogOut size={14} />{t.logout}
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center px-8 overflow-hidden">
        <Dashboard lang={lang} score={score} messages={messages} schedule={schedule} onOpenInbox={() => setActiveModal('inbox')} onOpenHistory={() => setActiveModal('history')} onOpenEmail={() => setActiveModal('email')} productionName={currentProduction?.name || 'Production'} productionId={currentProduction?.id || '1'} />
      </main>
      {/* Modal-Logik für Inbox etc... (unverändert) */}
    </div>
  );
}

export default App;
