
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

  // Synchronisation und Deep-Link Check
  useEffect(() => {
    const channel = new BroadcastChannel('safe-on-set_v1');
    channel.onmessage = (event) => {
      if (event.data.type === 'UPDATE') syncFromStorage();
    };
    
    // Zuerst Daten laden
    const currentProds = syncFromStorage();
    
    // Dann URL prüfen
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
      const data = await response.json();
      return response.ok;
    } catch (err) {
      console.error("Email error:", err);
      return false;
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleRegister = async (prod: Omit<Production, 'id' | 'status'>) => {
    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2>New Production Registration</h2>
        <p><b>Production:</b> ${prod.name}</p>
        <p><b>Coordinator:</b> ${prod.coordinator}</p>
        <p><b>Country:</b> ${prod.country}</p>
        <p><b>Start:</b> ${prod.periodStart} / <b>End:</b> ${prod.periodEnd}</p>
        <p>Please log in to the Admin Dashboard to approve this request.</p>
      </div>
    `;
    const success = await sendEmailViaBackend(prod.email, `Registration: ${prod.name}`, html);
    if (success) {
      // Temporär lokal hinzufügen
      const newProd: Production = { ...prod, id: Date.now().toString(), status: 'Pending', team: [] };
      const updated = [...productions, newProd];
      setProductions(updated);
      persistData('productions', updated);
    }
  };

  const handleSendReport = async () => {
    if (!reportEmail || !currentProduction) return;
    const qrUrl = `${window.location.origin}${window.location.pathname}?prod=${currentProduction.id}`;
    const html = `
      <div style="font-family: sans-serif; color: #111; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h1 style="color: #2563eb;">Safe on Set Report</h1>
        <p>Report for production: <b>${currentProduction.name}</b></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <div style="font-size: 24px; font-weight: bold;">Current Score: ${score}%</div>
        <p style="color: #666;">Feedback is 100% anonymous and secure.</p>
        <div style="margin-top: 30px;">
          <a href="${qrUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Production Details</a>
        </div>
      </div>
    `;
    const success = await sendEmailViaBackend(reportEmail, `Report: ${currentProduction.name}`, html);
    if (success) {
      alert(t.alert);
      setActiveModal('none');
      setReportEmail('');
    } else {
      alert("Error sending email. Please try again.");
    }
  };

  const handleResolveMessage = (id: string) => {
    const newMsgs = messages.map(m => m.id === id ? { ...m, resolved: true } : m);
    setMessages(newMsgs);
    persistData('incidentMessages', newMsgs);
    
    const m = messages.find(m => m.id === id);
    if (m && m.score > 50) {
      const newNeg = Math.max(0, negVotes - 1);
      setNegVotes(newNeg);
      persistData('negVotes', newNeg.toString());
    }
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
        department: messagePayload.department,
        resolved: false
      });
    }
    persistData('negVotes', newNeg.toString());
    persistData('totalVotes', newTotal.toString());
    persistData('incidentMessages', newMsgs);
    setNegVotes(newNeg);
    setTotalVotes(newTotal);
    setMessages(newMsgs);
  };

  const score = totalVotes === 0 ? 100 : Math.max(0, 100 - (negVotes * 10));
  const t = TRANSLATIONS[lang];

  if (view === 'landing') return <LandingPage lang={lang} setLang={setLang} onLoginClick={() => setView('login')} onSimulateClick={() => setView('mobile')} />;
  
  if (view === 'mobile') return (
    <MobileView 
      lang={lang} 
      setLang={setLang} 
      onSubmit={handleMobileSubmit} 
      onBack={() => {
        window.history.replaceState({}, '', window.location.pathname);
        setView('landing');
      }} 
      schedule={schedule} 
      productionName={activeProdForFeedback?.name || currentProduction?.name || "Safe on Set"}
    />
  );

  if (view === 'admin-dashboard') return <AdminDashboard lang={lang} onLogout={() => {setCurrentUser(''); setView('landing');}} productions={productions} onAddProduction={()=>{}} onInvite={()=>{}} onUpdateProduction={()=>{}} />;
  
  if (view === 'login') return (
    <Login 
      onLogin={(email) => { setCurrentUser(email); setView('dashboard'); }} 
      lang={lang} setLang={setLang} 
      onAdminClick={() => setView('admin-login')} 
      onRegister={handleRegister} 
      onSendOTP={async (email) => { 
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOTP(otp);
        return await sendEmailViaBackend(email, "Safe on Set Login", `<div style="font-family:sans-serif; text-align:center; padding: 20px; border: 1px solid #eee; border-radius: 12px;"><h2>Login Code</h2><p style="font-size:32px; font-weight:bold; letter-spacing: 5px; color:#2563eb;">${otp}</p><p>This code is valid for 10 minutes.</p></div>`);
      }}
      expectedOTP={generatedOTP}
    />
  );

  return (
    <div className={`h-screen w-full overflow-hidden bg-[#0f172a] text-white flex flex-col relative ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      <header className="h-[75px] bg-[#0f172a] border-b border-white/5 flex justify-between items-center px-10 z-40">
        <div className="font-bold text-xl flex items-center gap-3">
          Safe on Set <span className="opacity-30 font-light mx-2">/</span> <span className="opacity-50 font-normal">Management</span>
        </div>
        <button className="text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-xl border border-white/5 transition-all" onClick={() => {setCurrentUser(''); setView('landing');}}>
          <LogOut size={14} />{t.logout}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-6 overflow-hidden">
        <Dashboard 
          lang={lang} 
          score={score} 
          messages={messages} 
          schedule={schedule} 
          onOpenInbox={() => setActiveModal('inbox')} 
          onOpenHistory={() => setActiveModal('history')} 
          onOpenEmail={() => setActiveModal('email')} 
          productionName={currentProduction?.name || 'Production'} 
          productionId={currentProduction?.id || '1'}
        />
      </main>

      {/* Email Modal */}
      {activeModal === 'email' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setActiveModal('none')}>
          <div className="bg-[#111827] border border-white/10 rounded-[32px] shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <button onClick={() => setActiveModal('none')} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X size={20} /></button>
             <div className="text-center mb-8">
               <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <MailIcon size={28} className="text-blue-500" />
               </div>
               <h2 className="text-2xl font-black tracking-tight">Send Report</h2>
               <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold">via Email</p>
             </div>
             
             <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Recipient Address</label>
                   <input 
                      type="email" 
                      value={reportEmail}
                      onChange={e => setReportEmail(e.target.value)}
                      placeholder="colleague@production.com"
                      className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      autoFocus
                   />
                </div>
                <button 
                  onClick={handleSendReport}
                  disabled={isSendingEmail || !reportEmail}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-xl shadow-blue-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {isSendingEmail ? <Loader2 className="animate-spin" size={20} /> : <><Send size={16} /> Send Report</>}
                </button>
             </div>
          </div>
        </div>
      )}

      {activeModal === 'inbox' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setActiveModal('none')}>
          <div className="bg-[#111827] border border-white/10 rounded-[32px] shadow-2xl w-full max-w-2xl p-8 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <button onClick={() => setActiveModal('none')} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X size={20} /></button>
             <h2 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-3">
               <Inbox size={24} className="text-rose-500" />
               {t.inboxTitle}
             </h2>
             <div className="max-h-[65vh] overflow-y-auto custom-scrollbar pr-4">
               {messages.length === 0 ? <div className="text-center py-16 text-slate-500 italic">No feedback yet.</div> : (
                 <ul className="space-y-4">
                   {messages.map((m) => (
                     <li key={m.id} className={`p-6 rounded-2xl border transition-all ${m.resolved ? 'bg-black/20 border-white/5 opacity-50' : 'bg-white/[0.03] border-white/10'}`}>
                        <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest mb-4 font-black">
                           <span>{m.date}</span>
                           <span className={m.score > 50 ? 'text-rose-500' : 'text-emerald-500'}>{m.department} | {m.score}%</span>
                        </div>
                        <p className="text-base text-slate-200 leading-relaxed font-medium mb-6">"{m.text}"</p>
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                           <div className="text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">{m.contact}</div>
                           {!m.resolved && (
                             <button onClick={() => handleResolveMessage(m.id)} className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/20 transition-all">
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
