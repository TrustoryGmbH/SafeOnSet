
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, INITIAL_SCHEDULE, INITIAL_PRODUCTIONS } from './constants';
import { Language, Message, ShootDay, Production } from './types';
import Dashboard from './components/Dashboard';
import MobileView from './components/MobileView';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import { LogOut, Settings, Phone, ArrowLeft, Calendar, FileText, MapPin, Building, Shield, User, Save, X, Check, Loader2 } from 'lucide-react';

function App() {
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<'landing' | 'login' | 'admin-login' | 'dashboard' | 'admin-dashboard' | 'mobile'>('landing');
  const [currentUser, setCurrentUser] = useState<string>(''); 
  const [negVotes, setNegVotes] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [schedule, setSchedule] = useState<ShootDay[]>(INITIAL_SCHEDULE);
  const [productions, setProductions] = useState<Production[]>(INITIAL_PRODUCTIONS);

  const [activeModal, setActiveModal] = useState<'none' | 'email' | 'inbox' | 'history' | 'settings' | 'impressum'>('none');
  const [settingsTab, setSettingsTab] = useState<'schedule' | 'details'>('schedule');
  const [adminPassword, setAdminPassword] = useState('');
  const [editDetailsForm, setEditDetailsForm] = useState<Partial<Production>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [emailTarget, setEmailTarget] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState<string>('');

  useEffect(() => {
    const channel = new BroadcastChannel('safe-on-set_v1');
    channel.onmessage = (event) => {
      if (event.data.type === 'UPDATE') syncFromStorage();
    };
    syncFromStorage();
    return () => channel.close();
  }, []);

  const currentProduction = productions.find(p => p.email === currentUser || p.team?.some(m => m.email === currentUser));
  
  const syncFromStorage = () => {
    const sNeg = parseInt(localStorage.getItem('negVotes') || '0');
    const sTotal = parseInt(localStorage.getItem('totalVotes') || '0');
    const sMsgs = JSON.parse(localStorage.getItem('incidentMessages') || '[]');
    const sSched = JSON.parse(localStorage.getItem('shootSchedule') || 'null');
    const sProds = JSON.parse(localStorage.getItem('productions') || 'null');
    
    setNegVotes(sNeg);
    setTotalVotes(sTotal);
    setMessages(sMsgs);
    if(sSched) setSchedule(sSched);
    if(sProds) setProductions(sProds);
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
      // Netlify Functions sind unter /.netlify/functions/ erreichbar
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return true;
      } else {
        const errorMsg = data.error?.message || data.error || "Unbekannter Fehler";
        alert(`Versandfehler: ${errorMsg}`);
        return false;
      }
    } catch (err) {
      alert("Netzwerkfehler: Die Server-Funktion konnte nicht erreicht werden. Stelle sicher, dass die Seite auf Netlify live ist.");
      return false;
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendOTP = async (email: string) => {
    const userExists = productions.some(p => p.email === email || p.team?.some(m => m.email === email));
    
    if (!userExists) {
      alert("Diese E-Mail-Adresse ist keiner aktiven Produktion zugeordnet.");
      return false;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);

    return await sendEmailViaBackend(
      email,
      "Dein Safe on Set Login-Code",
      `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;">
        <h2 style="color:#2563eb;">Safe on Set Login</h2>
        <p>Dein Code lautet:</p>
        <div style="background:#f3f4f6;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:5px;">${otp}</div>
        <p style="font-size:12px;color:gray;margin-top:20px;">Dieser Code ist nur für kurze Zeit gültig.</p>
      </div>`
    );
  };

  const handleMobileSubmit = (stressScore: number, messagePayload?: { text: string; contact: string; department?: string }) => {
    let newNeg = negVotes;
    let newTotal = totalVotes + 1;
    if (stressScore > 50) newNeg++;
    const newMsgs = [...messages];
    if (messagePayload) {
      newMsgs.unshift({
        id: Date.now().toString(),
        date: new Date().toLocaleTimeString(),
        text: messagePayload.text,
        contact: messagePayload.contact,
        score: stressScore,
        department: messagePayload.department
      });
    }
    persistData('negVotes', newNeg.toString());
    persistData('totalVotes', newTotal.toString());
    persistData('incidentMessages', newMsgs);
    setNegVotes(newNeg);
    setTotalVotes(newTotal);
    setMessages(newMsgs);
  };

  const handleProductionLogin = (email: string) => {
    setCurrentUser(email);
    setView('dashboard');
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'TahmeeNils54321') { setView('admin-dashboard'); setAdminPassword(''); }
    else { alert('Wrong password'); }
  };

  const handleAddProduction = (prod: Omit<Production, 'id' | 'status'>) => {
    const newProd: Production = { ...prod, id: Date.now().toString(), status: 'Pending', team: [] };
    const newProds = [...productions, newProd];
    setProductions(newProds);
    persistData('productions', newProds);
  };

  const handleUpdateProduction = (id: string, updates: Partial<Production>) => {
    const newProds = productions.map(p => p.id === id ? { ...p, ...updates } : p);
    setProductions(newProds);
    persistData('productions', newProds);
  };

  const handleInvite = async (id: string) => {
    const prod = productions.find(p => p.id === id);
    if (!prod) return;
    const success = await sendEmailViaBackend(prod.email, "Einladung zu Safe on Set", `<p>Deine Produktion ${prod.name} ist bereit.</p>`);
    if (success) {
      handleUpdateProduction(id, { status: 'Invited' });
      alert("Einladung versendet!");
    }
  };

  const handleLogout = () => { setCurrentUser(''); setView('landing'); };

  const score = totalVotes === 0 ? 100 : Math.max(0, 100 - (negVotes * 10));
  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'ar';
  const memberDetails = currentProduction?.email === currentUser 
    ? { name: currentProduction.coordinator, role: t.role }
    : currentProduction?.team?.find(m => m.email === currentUser);

  if (view === 'landing') return <LandingPage lang={lang} setLang={setLang} onLoginClick={() => setView('login')} onSimulateClick={() => setView('mobile')} />;
  if (view === 'mobile') return <MobileView lang={lang} setLang={setLang} onSubmit={handleMobileSubmit} onBack={() => setView('landing')} schedule={schedule} />;
  if (view === 'admin-dashboard') return <AdminDashboard lang={lang} onLogout={handleLogout} productions={productions} onAddProduction={handleAddProduction} onInvite={handleInvite} onUpdateProduction={handleUpdateProduction} />;
  if (view === 'admin-login') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
       <div className="w-full max-sm bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
           <button onClick={() => setView('login')} className="mb-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm"><ArrowLeft size={16} /> Back</button>
           <h2 className="text-2xl font-bold mb-6">{t.adminLogin}</h2>
           <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Master Password" className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg outline-none focus:border-blue-500" autoFocus />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg">Login</button>
           </form>
       </div>
    </div>
  );
  if (view === 'login') return (
    <>
        <button onClick={() => setView('landing')} className="fixed top-6 left-6 z-50 text-slate-500 hover:text-white flex items-center gap-2 text-sm font-bold bg-slate-900/50 p-2 rounded-full border border-white/5 backdrop-blur-md transition-colors"><ArrowLeft size={16} /> Home</button>
        <Login 
          onLogin={handleProductionLogin} 
          lang={lang} 
          setLang={setLang} 
          onAdminClick={() => setView('admin-login')} 
          onRegister={handleAddProduction} 
          onSendOTP={handleSendOTP}
          expectedOTP={generatedOTP}
        />
    </>
  );

  return (
    <div className={`h-screen w-full overflow-hidden bg-[#0f172a] text-white flex flex-col relative ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      <header className="h-[70px] bg-slate-900/40 border-b border-white/5 flex justify-between items-center px-8 backdrop-blur-md z-40">
        <div className="font-bold text-lg leading-tight tracking-tight">Safe on Set <span className="opacity-40 font-normal">| Dashboard</span></div>
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-3 border-white/10`}>
             <div className="text-right">
               <div className="block font-medium text-sm text-slate-200">{memberDetails?.name || 'Manager'}</div>
               <div className="block text-[10px] uppercase tracking-wider text-slate-500">{currentProduction?.name}</div>
             </div>
             <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm text-white">{memberDetails?.name?.charAt(0) || 'P'}</div>
          </div>
          <button className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2" onClick={handleLogout}><LogOut size={16} />{t.logout}</button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-4 overflow-hidden">
        <Dashboard lang={lang} score={score} messages={messages} schedule={schedule} onOpenInbox={() => setActiveModal('inbox')} onOpenHistory={() => setActiveModal('history')} onOpenEmail={() => setActiveModal('email')} productionName={currentProduction?.name || 'Production'} />
      </main>

      {activeModal !== 'none' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
             <button onClick={() => setActiveModal('none')} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
             {activeModal === 'email' && (
               <div className="text-center">
                 <h2 className="text-xl font-bold mb-6">QR Poster senden</h2>
                 <input type="email" value={emailTarget} onChange={(e) => setEmailTarget(e.target.value)} placeholder="Email eingeben" className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white mb-4 outline-none" />
                 <button disabled={isSendingEmail || !emailTarget} onClick={async () => {
                        const success = await sendEmailViaBackend(emailTarget, "QR Poster", `<p>Hier ist dein Poster.</p>`);
                        if (success) { alert("E-Mail versendet!"); setActiveModal('none'); }
                    }} className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                   {isSendingEmail ? <Loader2 className="animate-spin" /> : "Jetzt senden"}
                 </button>
               </div>
             )}
             {activeModal === 'inbox' && (
               <div className="text-left">
                  <h2 className="text-xl font-bold mb-4">{t.inboxTitle}</h2>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {messages.length === 0 ? <p className="text-slate-500">No feedback yet.</p> : (
                      <ul className="space-y-3">
                        {messages.map((m, i) => (
                          <li key={i} className="bg-white/5 p-4 rounded-lg border border-white/5">
                             <div className="flex justify-between text-xs text-slate-400"><span>{m.date}</span><span>Score: {m.score}%</span></div>
                             <p className="text-sm mt-2 italic">"{m.text}"</p>
                             <div className="text-xs text-slate-500 mt-2">Kontakt: {m.contact}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
