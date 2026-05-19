
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, INITIAL_SCHEDULE } from './constants';
import { Language, Message, ShootDay, Production } from './types';
import Dashboard from './components/Dashboard';
import MobileView from './components/MobileView';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import { supabase } from './services/supabase';
import { generateFeedbackReportPDF } from './services/pdfGenerator';
import { LogOut, WifiOff, Loader2, Beaker, AlertTriangle } from 'lucide-react';

const mapProduction = (p: any): Production => ({
  id: p.id,
  name: p.name,
  coordinator: p.coordinator,
  email: p.email,
  status: p.status,
  team: p.team || [],
  co_admins: p.co_admins || [],
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
  const [isAdminReviewing, setIsAdminReviewing] = useState(false);
  const [activeProductionId, setActiveProductionId] = useState<string | null>(null);
  const [coAdminInfo, setCoAdminInfo] = useState<{ prodId: string; userId: string; email: string } | null>(null);

  // 10-Sekunden Polling für Echtzeit-Updates
  useEffect(() => {
    let interval: any;

    if (view === 'dashboard' || view === 'admin-dashboard') {
        interval = setInterval(() => {
            refreshData();
        }, 10000); // 10 Sekunden
    }

    return () => {
        if (interval) clearInterval(interval);
    };
  }, [view]);

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const refreshData = async () => {
    try {
      // Nur Nachrichten nachladen für Performance
      const { data: msgs } = await supabase.from('messages').select('*').order('date', { ascending: false });
      if (msgs) setMessages(msgs);
      setIsConnected(true);
    } catch (err) {
      console.error("Refresh failed:", err);
      setIsConnected(false);
    }
  };

  const initData = async () => {
    try {
      const { data: prods } = await supabase.from('productions').select('*');
      const mappedProds = (prods || []).map(mapProduction);
      setProductions(mappedProds);

      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('prod');
      const adminProdId = params.get('admin_prod');
      const coUserId = params.get('co_user');

      if (prodId) {
        setActiveProductionId(prodId);
        if (prodId === 'test') {
            setIsSandboxMode(true);
        }
        setView('mobile');
      } else if (adminProdId && coUserId) {
         // Find production and the co-admin
         const targetProd = mappedProds.find(p => p.id === adminProdId);
         const coAdmin = (targetProd?.co_admins || []).find((ca: any) => ca.id === coUserId);
         
         if (coAdmin) {
            setCoAdminInfo({ prodId: adminProdId, userId: coUserId, email: coAdmin.email });
            handleSendOTP(coAdmin.email);
            setView('login'); // Reuse login for OTP but with co-admin context
         } else {
            alert("Ungültiger Admin-Link.");
         }
      }

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
    setIsAdminReviewing(false);
    if (email === 'admin@internal') {
        setView('admin-dashboard');
    } else if (email === 'test-account@internal' || email === 'XPLM2') {
        setIsSandboxMode(true);
        setMessages([]); 
        setView('dashboard');
    } else {
        setView('dashboard');
    }
  };

  const handleViewProduction = (id: string) => {
    setActiveProductionId(id);
    setIsAdminReviewing(true);
    setView('dashboard');
  };
  
  const handleDownloadReport = async (id: string) => {
    const prod = productions.find(p => p.id === id);
    if (!prod) return;
    
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('production_id', id)
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      generateFeedbackReportPDF(prod, msgs || []);
    } catch (err) {
      console.error("Failed to generate report:", err);
      alert("Report konnte nicht generiert werden.");
    }
  };

  const handleTestCodeEntry = (code: string) => {
    if (code.toUpperCase() === 'XPLM2') {
        handleLogin('test-account@internal');
    } else {
        alert("Ungültiger Code");
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

  const handleFeedbackSubmit = async (score: number, details?: { text: string; contact: string; department?: string }) => {
    if (isSandboxMode) {
      const sandboxMsg = {
        id: Math.random().toString(),
        date: new Date().toISOString(),
        score: score,
        text: details?.text || '',
        contact: details?.contact || 'Anonymous',
        department: details?.department || 'General',
        resolved: false
      };
      setMessages(prev => [sandboxMsg, ...prev]);
      return;
    }

    const prodToLink = activeProductionId || currentProduction?.id;
    if (!prodToLink) return;

    try {
      const newMessage = {
        date: new Date().toISOString(),
        score: score,
        text: details?.text || '',
        contact: details?.contact || 'Anonymous',
        department: details?.department || 'General',
        production_id: prodToLink,
        resolved: false
      };

      const { error } = await supabase.from('messages').insert([newMessage]);
      if (error) throw error;
      
      setMessages(prev => [{ ...newMessage, id: Math.random().toString() }, ...prev]);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  const handleCreateProduction = async (payload: Omit<Production, 'id' | 'status'>) => {
    try {
      const newProd = {
        name: payload.name,
        coordinator: payload.coordinator,
        email: payload.email,
        status: 'Active'
      };
      
      const { data, error } = await supabase.from('productions').insert([newProd]).select();
      if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message || "Datenbank-Fehler");
      }
      
      if (data && data[0]) {
        const mapped = mapProduction(data[0]);
        setProductions(prev => [...prev, mapped]);
        alert("Produktion erfolgreich angelegt!");
      } else {
        // Fallback falls select() nichts zurückgibt aber kein Fehler kam
        refreshData();
        alert("Produktion angelegt (Bitte Liste aktualisieren)");
      }
    } catch (err: any) {
      console.error("Failed to create production:", err);
      // Detailliertere Fehlermeldung
      const errorMsg = err.message === 'Failed to fetch' 
        ? "Verbindung zur Datenbank fehlgeschlagen (Netzwerk-Fehler oder CORS). Bitte prüfen Sie die Supabase-Einstellungen."
        : err.message;
      alert("Fehler beim Anlegen: " + errorMsg);
    }
  };

  const handleUpdateProduction = async (id: string, updates: Partial<Production>) => {
    try {
      // Map back to DB field names if necessary
      const dbUpdates: any = { ...updates };
      if (updates.periodStart) { dbUpdates.period_start = updates.periodStart; delete dbUpdates.periodStart; }
      if (updates.periodEnd) { dbUpdates.period_end = updates.periodEnd; delete dbUpdates.periodEnd; }

      const { error } = await supabase.from('productions').update(dbUpdates).eq('id', id);
      if (error) throw error;
      
      setProductions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err: any) {
      console.error("Failed to update production:", err);
    }
  };

  const handleInviteProduction = async (id: string) => {
    const prod = productions.find(p => p.id === id);
    if (!prod) return;
    
    try {
      const { error } = await supabase.from('productions').update({ status: 'Invited' }).eq('id', id);
      if (error) throw error;
      
      setProductions(prev => prev.map(p => p.id === id ? { ...p, status: 'Invited' } : p));
      
      const inviteUrl = `${window.location.origin}/?prod=${id}`;
      
      // Netlify Functions sind in der AIS-Preview nicht direkt verfügbar
      // Wir versuchen es trotzdem, fangen aber den Fehler ab
      try {
        await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          body: JSON.stringify({
            to: prod.email,
            subject: `Willkommen bei Trustory: ${prod.name}`,
            html: `<div style="font-family: sans-serif; padding: 40px; text-align: center; background: #f8fafc;">
                    <h1 style="color: #1e293b;">Produktion Bereit</h1>
                    <p style="color: #64748b;">Ihr Feedback-System für <b>${prod.name}</b> wurde aktiviert.</p>
                    <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Zum Dashboard</a>
                    <p style="font-size: 12px; color: #94a3b8;">Sicher am Set mit Trustory Safe on Set.</p>
                   </div>`
          })
        });
        alert("Einladung versendet!");
      } catch (emailErr) {
        console.warn("Email function not available in preview:", emailErr);
        alert(`Produktion wurde eingeladen, aber die E-Mail konnte in dieser Testumgebung nicht versendet werden.\nURL: ${inviteUrl}`);
      }
    } catch (err: any) {
      console.error("Failed to invite:", err);
      alert("Fehler bei der Einladung: " + err.message);
    }
  };

  const t = TRANSLATIONS[lang];
  
  const currentProduction = isSandboxMode 
    ? { id: 'test', name: 'Sandbox Project', coordinator: 'Tester', email: 'test@internal', status: 'Test' as const, created_at: new Date().toISOString() }
    : productions.find(p => p.id === activeProductionId || p.email === currentUser || p.team?.some((m: any) => m.email === currentUser));

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Lade Cloud-Daten...</p>
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
        onTestAccess={(type) => {}} 
    />
  );
  
  if (view === 'mobile') return (
    <MobileView 
        lang={lang} 
        setLang={setLang} 
        schedule={schedule} 
        productionName={currentProduction?.name} 
        onSubmit={handleFeedbackSubmit} 
        onBack={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('prod');
            window.history.replaceState({}, '', url);
            setActiveProductionId(null);
            setView('landing');
        }} 
    />
  );

  if (view === 'login' || view === 'admin-login') return (
    <Login 
        isAdminMode={view === 'admin-login'}
        onLogin={(email) => {
            if (coAdminInfo) {
                // Co-Admin confirmed their OTP
                setActiveProductionId(coAdminInfo.prodId);
                setIsAdminReviewing(true);
                setView('dashboard');
                setCoAdminInfo(null);
                // Clean URL
                const url = new URL(window.location.href);
                url.searchParams.delete('admin_prod');
                url.searchParams.delete('co_user');
                window.history.replaceState({}, '', url.toString());
            } else {
                handleLogin(email);
            }
        }} 
        lang={lang} 
        setLang={setLang} 
        onAdminClick={() => setView(view === 'login' ? 'admin-login' : 'login')} 
        onRegister={handleRegisterAccess} 
        onSendOTP={handleSendOTP} 
        expectedOTP={expectedOTP} 
        initialShowRegister={loginViewMode === 'register'}
        coAdminEmail={coAdminInfo?.email}
    />
  );
  
  if (view === 'admin-dashboard') return (
    <AdminDashboard 
        lang={lang} 
        productions={productions} 
        onLogout={() => setView('landing')} 
        onAddProduction={handleCreateProduction} 
        onInvite={handleInviteProduction} 
        onUpdateProduction={handleUpdateProduction} 
        onViewFeedback={handleViewProduction}
        onDownloadReport={handleDownloadReport}
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
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`}>{isConnected ? (isSandboxMode ? 'Sandbox' : (isAdminReviewing ? 'Admin View' : 'Live Cloud')) : 'Offline'}</span>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white text-[10px] font-black uppercase flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-xl border border-white/5 transition-all" onClick={() => { 
            if (isAdminReviewing) {
                setView('admin-dashboard');
                setIsAdminReviewing(false);
            } else {
                setIsSandboxMode(false); 
                setCurrentUser(''); 
                setView('landing'); 
            }
        }}>
          <LogOut size={14} />{isAdminReviewing ? 'Back to Admin' : t.logout}
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
          isSandboxMode={isSandboxMode}
          messages={messages.filter(m => isSandboxMode ? true : m.production_id === currentProduction?.id)} 
          schedule={schedule} 
          onOpenInbox={() => {}} 
          onOpenHistory={() => {}} 
          onOpenEmail={() => {}} 
          productionName={currentProduction?.name || 'Produktion'} 
          productionId={currentProduction?.id || 'test'} 
          productionStartDate={(currentProduction as any)?.created_at}
        />
      </main>
    </div>
  );
}

export default App;
