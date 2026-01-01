
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, INITIAL_SCHEDULE, INITIAL_PRODUCTIONS } from './constants';
import { Language, Message, ShootDay, Production } from './types';
import Dashboard from './components/Dashboard';
import MobileView from './components/MobileView';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import { LogOut, X, Inbox, CheckCircle2, Settings, Plus, Trash2, Save } from 'lucide-react';

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
  const [activeModal, setActiveModal] = useState<'none' | 'email' | 'inbox' | 'history' | 'settings'>('none');
  const [generatedOTP, setGeneratedOTP] = useState<string>('');

  // Sync state & Deep Links
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

  const handleUpdateSchedule = (newSchedule: ShootDay[]) => {
    setSchedule(newSchedule);
    persistData('shootSchedule', newSchedule);
  };

  const currentProduction = productions.find(p => p.email === currentUser || p.team?.some(m => m.email === currentUser));
  const score = totalVotes === 0 ? 100 : Math.max(0, 100 - (negVotes * 10));
  const t = TRANSLATIONS[lang];

  // Global Auth Guard
  const handleLogout = () => {
    setCurrentUser('');
    setView('landing');
  };

  if (view === 'landing') return <LandingPage lang={lang} setLang={setLang} onLoginClick={() => setView('login')} onSimulateClick={() => setView('mobile')} />;
  
  if (view === 'mobile') return (
    <MobileView 
      lang={lang} 
      setLang={setLang} 
      onSubmit={(s, m) => {
        let nNeg = negVotes;
        let nTotal = totalVotes + 1;
        if (s > 50) nNeg++;
        const nMsgs = [...messages];
        if (m) nMsgs.unshift({ id: Date.now().toString(), date: new Date().toLocaleTimeString(), ...m, score: s, resolved: false });
        persistData('negVotes', nNeg.toString());
        persistData('totalVotes', nTotal.toString());
        persistData('incidentMessages', nMsgs);
        setNegVotes(nNeg); setTotalVotes(nTotal); setMessages(nMsgs);
      }} 
      onBack={() => { window.history.replaceState({}, '', window.location.pathname); setView('landing'); }} 
      schedule={schedule} 
      productionName={activeProdForFeedback?.name || currentProduction?.name || "Safe on Set"}
    />
  );

  if (view === 'admin-dashboard') {
    return (
      <AdminDashboard 
        lang={lang} 
        onLogout={handleLogout} 
        productions={productions} 
        onAddProduction={(p) => {
          const nProds = [...productions, { ...p, id: Date.now().toString(), status: 'Active', team: [] }];
          setProductions(nProds);
          persistData('productions', nProds);
        }} 
        onInvite={() => {}} 
        onUpdateProduction={(id, upd) => {
          const nProds = productions.map(p => p.id === id ? { ...p, ...upd } : p);
          setProductions(nProds);
          persistData('productions', nProds);
        }} 
      />
    );
  }

  if (view === 'login' || view === 'admin-login') {
    return (
      <Login 
        onLogin={(email) => { 
          setCurrentUser(email); 
          setView(view === 'admin-login' ? 'admin-dashboard' : 'dashboard'); 
        }} 
        lang={lang} 
        setLang={setLang} 
        onAdminClick={() => setView('admin-login')} 
        isAdminMode={view === 'admin-login'}
        onRegister={(p) => {
           const nProds = [...productions, { ...p, id: Date.now().toString(), status: 'Pending', team: [] }];
           setProductions(nProds);
           persistData('productions', nProds);
        }} 
        onSendOTP={async (email) => { 
          const otp = "123456"; // Demo OTP
          setGeneratedOTP(otp);
          return true;
        }}
        expectedOTP={generatedOTP || "123456"}
      />
    );
  }

  return (
    <div className={`h-screen w-full overflow-hidden bg-[#0f172a] text-white flex flex-col relative ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      <header className="h-[75px] bg-[#0f172a] border-b border-white/5 flex justify-between items-center px-10 z-40">
        <div className="font-bold text-xl flex items-center gap-3">
          Safe on Set <span className="opacity-30 font-light mx-2">/</span> <span className="opacity-50 font-normal">Management</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sprachumschalter */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-sm">
            {(['en', 'de', 'ar'] as Language[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${lang === l ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-slate-500 hover:text-slate-300'}`}>
                <span className="text-xl leading-none">{l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}</span>
              </button>
            ))}
          </div>

          {/* Einstellungs-Button für Drehtage (Rotation) */}
          <button onClick={() => setActiveModal('settings')} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all group" title={t.tabSchedule}>
            <Settings size={20} className="group-hover:rotate-45 transition-transform duration-500" />
          </button>

          <button className="text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-xl border border-white/5 transition-all" onClick={handleLogout}>
            <LogOut size={14} />{t.logout}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-6 overflow-hidden">
        <Dashboard 
          lang={lang} score={score} messages={messages} schedule={schedule} 
          onOpenInbox={() => setActiveModal('inbox')} 
          onOpenHistory={() => setActiveModal('history')} 
          onOpenEmail={() => setActiveModal('email')} 
          productionName={currentProduction?.name || 'Production'} 
          productionId={currentProduction?.id || '1'}
        />
      </main>

      {/* Settings Modal - Drehtage verwalten (Rotation) */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-[#111827] border border-white/10 rounded-[32px] shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200">
             <button onClick={() => setActiveModal('none')} className="absolute top-6 right-6 text-slate-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors"><X size={20} /></button>
             <h2 className="text-2xl font-black mb-6 flex items-center gap-3 tracking-tight"><Settings className="text-blue-500" /> {t.tabSchedule}</h2>
             
             <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {schedule.map((day, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.day}</span>
                        <span className="text-sm font-bold text-white">{day.day}</span>
                    </div>
                    <input 
                      type="date" 
                      value={day.date} 
                      onChange={(e) => {
                        const next = [...schedule];
                        next[idx].date = e.target.value;
                        handleUpdateSchedule(next);
                      }}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-blue-500 text-white"
                    />
                    <button onClick={() => handleUpdateSchedule(schedule.filter((_, i) => i !== idx))} className="text-rose-500 hover:bg-rose-500/10 p-2.5 rounded-xl transition-colors"><Trash2 size={18}/></button>
                  </div>
                ))}
             </div>
             
             <div className="mt-8 flex gap-3">
               <button onClick={() => handleUpdateSchedule([{ day: (schedule[0]?.day || 0) + 1, date: new Date().toISOString().split('T')[0] }, ...schedule])} className="flex-1 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold border border-white/5 transition-all uppercase tracking-widest">
                  <Plus size={18} /> Add Day
               </button>
               <button onClick={() => setActiveModal('none')} className="flex-1 h-14 bg-blue-600 hover:bg-blue-500 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold shadow-lg transition-all uppercase tracking-widest">
                  <Save size={18} /> {t.save}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Inbox Modal */}
      {activeModal === 'inbox' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111827] border border-white/10 rounded-[32px] shadow-2xl w-full max-w-2xl p-8 relative animate-in zoom-in-95 duration-200">
             <button onClick={() => setActiveModal('none')} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X size={20} /></button>
             <h2 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-3 uppercase tracking-tighter">
               <Inbox size={24} className="text-rose-500" />
               {t.inboxTitle}
             </h2>
             <div className="max-h-[65vh] overflow-y-auto custom-scrollbar pr-4">
               {messages.length === 0 ? <div className="text-center py-16 text-slate-500 italic">No feedback yet.</div> : (
                 <ul className="space-y-4">
                   {messages.map((m) => (
                     <li key={m.id} className={`p-6 rounded-[28px] border transition-all ${m.resolved ? 'bg-black/20 border-white/5 opacity-50' : 'bg-white/[0.03] border-white/10 shadow-xl'}`}>
                        <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest mb-4 font-black">
                           <span>{m.date}</span>
                           <span className={m.score > 50 ? 'text-rose-500' : 'text-emerald-500'}>{m.department} | {m.score}%</span>
                        </div>
                        <p className="text-base text-slate-200 leading-relaxed font-medium mb-6">"{m.text}"</p>
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                           <div className="text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">{m.contact}</div>
                           {!m.resolved && (
                             <button onClick={() => {
                                const newMsgs = messages.map(msg => msg.id === m.id ? { ...msg, resolved: true } : msg);
                                setMessages(newMsgs);
                                persistData('incidentMessages', newMsgs);
                             }} className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/20 transition-all">
                               <CheckCircle2 size={12} /> {t.markResolved}
                             </button>
                           )}
                           {m.resolved && <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12}/> Resolved</div>}
                        </div>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
