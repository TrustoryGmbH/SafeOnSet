
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

  useEffect(() => {
    const channel = new BroadcastChannel('safe-on-set_v1');
    channel.onmessage = (event) => {
      if (event.data.type === 'UPDATE') syncFromStorage();
    };
    syncFromStorage();
    return () => channel.close();
  }, []);

  const currentProduction = productions.find(p => p.email === currentUser || p.team?.some(m => m.email === currentUser));
  
  useEffect(() => {
    if (activeModal === 'settings' && currentProduction) {
        setEditDetailsForm({
            name: currentProduction.name,
            coordinator: currentProduction.coordinator,
            email: currentProduction.email,
            periodStart: currentProduction.periodStart || '',
            periodEnd: currentProduction.periodEnd || '',
            officeAddress: currentProduction.officeAddress || '',
            billingAddress: currentProduction.billingAddress || '',
            trustContactType: currentProduction.trustContactType || 'none',
            trustContactInfo: currentProduction.trustContactInfo || ''
        });
        setSaveStatus('idle');
    }
  }, [activeModal, currentProduction]);

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
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        body: JSON.stringify({ to, subject, html }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("E-Mail erfolgreich versendet!");
        setActiveModal('none');
      } else {
        alert("Fehler beim Senden: " + (data.error?.message || "Unbekannter Fehler"));
      }
    } catch (err) {
      alert("Netzwerkfehler beim E-Mail-Versand.");
    } finally {
      setIsSendingEmail(false);
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
    const prod = productions.find(p => p.email === email || p.team?.some(m => m.email === email));
    if (prod) {
        if (prod.status === 'Pending') { alert("Account is pending approval."); return; }
        if (prod.status === 'Finished') { alert("Production has finished."); return; }
    }
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

  const handleRegisterProduction = (prod: Omit<Production, 'id' | 'status'>) => {
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

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduction) return;
    setSaveStatus('saving');
    setTimeout(() => {
        handleUpdateProduction(currentProduction.id, editDetailsForm);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleInvite = (id: string) => {
    const prod = productions.find(p => p.id === id);
    if (!prod) return;
    handleUpdateProduction(id, { status: 'Invited' });
    sendEmailViaBackend(
      prod.email, 
      `Einladung zur Produktion: ${prod.name}`, 
      `<h1>Willkommen bei Safe on Set</h1><p>Hallo ${prod.coordinator}, du wurdest eingeladen. Dein Login-Code lautet: <strong>123456</strong></p>`
    );
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
       <div className="w-full max-w-sm bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
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
        <Login onLogin={handleProductionLogin} lang={lang} setLang={setLang} onAdminClick={() => setView('admin-login')} onRegister={handleRegisterProduction} />
    </>
  );

  return (
    <div className={`h-screen w-full overflow-hidden bg-[#0f172a] text-white flex flex-col relative ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />

      <header className="h-[70px] shrink-0 bg-slate-900/40 border-b border-white/5 flex justify-between items-center px-8 backdrop-blur-md z-40">
        <div className="flex flex-col">
          <div className="font-bold text-lg leading-tight tracking-tight">Safe on Set <span className="opacity-40 font-normal">| Production Dashboard</span></div>
          <div className="text-[11px] font-semibold text-blue-400 mt-0.5 uppercase tracking-wider flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>{currentProduction?.name || 'Test Production'}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
             {(['en', 'de', 'ar'] as Language[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`text-2xl px-2 py-0.5 rounded transition-all ${lang === l ? 'opacity-100 scale-100 grayscale-0 bg-white/10 shadow-sm text-white' : 'opacity-30 grayscale hover:opacity-60'}`}>{l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}</button>
             ))}
          </div>
          <div className={`flex items-center gap-3 ${isRTL ? 'border-l pl-5' : 'border-r pr-5'} border-white/10`}>
             <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
               <div className="block font-medium text-sm text-slate-200">{memberDetails?.name || 'Production Manager'}</div>
               <div className="block text-[10px] uppercase tracking-wider text-slate-500">{memberDetails?.role || t.role}</div>
             </div>
             <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20 text-white border border-white/10">{memberDetails?.name ? memberDetails.name.charAt(0) : 'PM'}</div>
          </div>
          <button onClick={() => { setActiveModal('settings'); setSettingsTab('schedule'); }} className="text-slate-400 hover:text-white transition-colors"><Settings size={20} /></button>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"><LogOut size={16} />{t.logout}</button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 px-6 py-4 overflow-hidden">
        <Dashboard lang={lang} score={score} messages={messages} schedule={schedule} onOpenInbox={() => setActiveModal('inbox')} onOpenHistory={() => setActiveModal('history')} onOpenEmail={() => setActiveModal('email')} productionName={currentProduction?.name || 'Test Production'} />
      </main>

      <footer className="h-[40px] shrink-0 bg-slate-900/40 border-t border-white/5 flex justify-between items-center px-8 text-[10px] uppercase tracking-widest text-slate-600 backdrop-blur-md z-40">
        <div>© 2025 Safe on Set GmbH</div>
        <button onClick={() => setActiveModal('impressum')} className="hover:text-slate-400 transition-colors">{t.imprBtn}</button>
      </footer>

      {activeModal !== 'none' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200">
             <button onClick={() => setActiveModal('none')} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"><X size={20} /></button>
             
             {activeModal === 'email' && (
               <div className="text-center">
                 <h2 className="text-xl font-bold mb-6">QR Poster via E-Mail senden</h2>
                 <p className="text-slate-400 text-sm mb-4">Das QR-Poster wird als Link an die folgende Adresse gesendet.</p>
                 <input 
                    type="email" 
                    value={emailTarget}
                    onChange={(e) => setEmailTarget(e.target.value)}
                    placeholder="assistant@production.com" 
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
                 <button 
                    disabled={isSendingEmail || !emailTarget}
                    onClick={() => sendEmailViaBackend(
                        emailTarget, 
                        "Dein Safe on Set QR-Poster", 
                        `<h1>Dein QR-Poster</h1><p>Hier ist dein QR-Poster für die Produktion <strong>${currentProduction?.name}</strong>. Bitte drucke es aus und hänge es am Set auf.</p>`
                    )} 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                 >
                   {isSendingEmail ? <Loader2 className="animate-spin" /> : "Jetzt senden"}
                 </button>
               </div>
             )}

             {activeModal === 'inbox' && (
               <div className="text-left">
                  <h2 className="text-xl font-bold mb-4">{t.inboxTitle}</h2>
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {messages.length === 0 ? <p className="text-slate-500 text-center py-8">No feedback yet.</p> : (
                      <ul className="space-y-3">
                        {messages.map((m, i) => (
                          <li key={i} className="bg-white/5 p-4 rounded-lg border border-white/5">
                             <div className="flex justify-between items-start mb-2">
                               <div className="flex flex-col">
                                   <span className="text-xs text-slate-400">{m.date}</span>
                                   {m.department && <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 mt-1 bg-blue-500/10 px-1.5 py-0.5 rounded w-fit">{m.department}</span>}
                               </div>
                               <span className="text-red-400 font-bold text-xs">Stress: {m.score}%</span>
                             </div>
                             <p className="text-sm text-slate-200 italic mb-3">"{m.text}"</p>
                             <div className="text-xs text-slate-500 border-t border-white/5 pt-2">Contact: <span className="text-slate-300">{m.contact}</span></div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
               </div>
             )}

             {activeModal === 'history' && (
                <div className="text-left">
                  <h2 className="text-xl font-bold mb-4">Full Shooting Report</h2>
                  <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {schedule.map((day, i) => {
                       let s = 95; if (day.day % 3 === 0) s = 80;
                       const color = s >= 90 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';
                       return (
                         <li key={i} className="flex justify-between p-3 bg-white/5 rounded border border-white/5">
                            <span>{t.day} {day.day} ({day.date})</span>
                            <span className={`font-bold ${color}`}>{s}%</span>
                         </li>
                       )
                    })}
                  </ul>
                </div>
             )}

             {activeModal === 'settings' && (
               <div className="text-left flex flex-col h-full">
                 <div className="flex border-b border-white/10 mb-6 gap-6">
                    <button onClick={() => setSettingsTab('schedule')} className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors ${settingsTab === 'schedule' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><Calendar size={16} /> {t.tabSchedule || 'Shooting Schedule'}</button>
                    <button onClick={() => setSettingsTab('details')} className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors ${settingsTab === 'details' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><FileText size={16} /> {t.tabDetails || 'Production Details'}</button>
                 </div>
                 {settingsTab === 'schedule' && (
                   <>
                      <p className="text-slate-500 text-sm mb-6">Manage active voting days</p>
                      <button onClick={() => { const maxDay = schedule.length > 0 ? Math.max(...schedule.map(s => s.day)) : 0; const newDay = { day: maxDay + 1, date: new Date().toISOString().split('T')[0] }; const newSched = [newDay, ...schedule]; setSchedule(newSched); localStorage.setItem('shootSchedule', JSON.stringify(newSched)); }} className="w-full flex items-center justify-center gap-2 bg-green-500/20 text-green-400 border border-green-500/50 py-2 rounded-lg hover:bg-green-500/30 mb-4 transition-colors"><span>+</span> Add Next Shooting Day</button>
                      <div className="max-h-[300px] overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar">
                          {schedule.map((day, i) => (
                            <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded border border-transparent hover:border-white/10">
                              <span className="font-bold text-sm">Day {day.day}</span>
                              <div className="flex items-center gap-3">
                                <input type="date" value={day.date} onChange={(e) => { const newSched = [...schedule]; newSched[i].date = e.target.value; setSchedule(newSched); localStorage.setItem('shootSchedule', JSON.stringify(newSched)); }} className="bg-transparent text-slate-300 text-right text-sm outline-none cursor-pointer" />
                                <button onClick={() => { if(confirm('Delete?')) { const newSched = schedule.filter((_, idx) => idx !== i); setSchedule(newSched); localStorage.setItem('shootSchedule', JSON.stringify(newSched)); } }} className="text-slate-500 hover:text-red-500 transition-colors">✕</button>
                              </div>
                            </div>
                          ))}
                      </div>
                   </>
                 )}
                 {settingsTab === 'details' && (
                    <form onSubmit={handleSaveDetails} className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                       <div className="grid grid-cols-2 gap-4">
                           <div><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1 flex items-center gap-1"><FileText size={10}/> {t.prodName}</label><input value={editDetailsForm.name || ''} onChange={e => setEditDetailsForm({...editDetailsForm, name: e.target.value})} className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:border-blue-500 outline-none" required /></div>
                           <div><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1 flex items-center gap-1"><User size={10}/> {t.prodCoord}</label><input value={editDetailsForm.coordinator || ''} onChange={e => setEditDetailsForm({...editDetailsForm, coordinator: e.target.value})} className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:border-blue-500 outline-none" required /></div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1 flex items-center gap-1"><Calendar size={10}/> Start</label><input type="date" value={editDetailsForm.periodStart || ''} onChange={e => setEditDetailsForm({...editDetailsForm, periodStart: e.target.value})} className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:border-blue-500 outline-none" /></div>
                           <div><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1 flex items-center gap-1"><Calendar size={10}/> End</label><input type="date" value={editDetailsForm.periodEnd || ''} onChange={e => setEditDetailsForm({...editDetailsForm, periodEnd: e.target.value})} className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:border-blue-500 outline-none" /></div>
                       </div>
                       <div><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1 flex items-center gap-1"><MapPin size={10}/> {t.officeAddr}</label><textarea rows={2} value={editDetailsForm.officeAddress || ''} onChange={e => setEditDetailsForm({...editDetailsForm, officeAddress: e.target.value})} className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:border-blue-500 outline-none resize-none" /></div>
                       <div><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1 flex items-center gap-1"><Building size={10}/> {t.billingAddr}</label><textarea rows={2} value={editDetailsForm.billingAddress || ''} onChange={e => setEditDetailsForm({...editDetailsForm, billingAddress: e.target.value})} className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:border-blue-500 outline-none resize-none" /></div>
                       <div className="bg-slate-900 p-3 rounded-lg border border-white/5">
                           <label className="block text-[10px] uppercase text-green-500 font-bold mb-3 flex items-center gap-1"><Shield size={10}/> {t.trustSection}</label>
                           <div className="space-y-2">
                               <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="trustEdit" checked={editDetailsForm.trustContactType === 'themis'} onChange={() => setEditDetailsForm({...editDetailsForm, trustContactType: 'themis'})} className="accent-green-500" /><span className="text-sm text-slate-300">Themis Member</span></label>
                               <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="trustEdit" checked={editDetailsForm.trustContactType === 'internal'} onChange={() => setEditDetailsForm({...editDetailsForm, trustContactType: 'internal'})} className="accent-green-500" /><span className="text-sm text-slate-300">Internal Contact</span></label>
                               {editDetailsForm.trustContactType === 'internal' && (<input value={editDetailsForm.trustContactInfo || ''} onChange={e => setEditDetailsForm({...editDetailsForm, trustContactInfo: e.target.value})} className="w-full mt-1 p-2 bg-black/20 border border-slate-600 rounded text-xs text-white" placeholder="Contact Name / Phone" />)}
                           </div>
                       </div>
                       <button type="submit" disabled={saveStatus !== 'idle'} className={`mt-2 w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-bold text-sm ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>{saveStatus === 'saving' ? <>Saving...</> : saveStatus === 'saved' ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Update Details</>}</button>
                    </form>
                 )}
               </div>
             )}

             {activeModal === 'impressum' && (
               <div className="text-left">
                  <h2 className="text-xl font-bold mb-4">{t.imprTitle}</h2>
                  <div className="text-sm text-slate-300 space-y-4 leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-line">{t.imprText}</div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
