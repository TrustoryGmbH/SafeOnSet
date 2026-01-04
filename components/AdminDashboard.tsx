
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Production, AccessRequest } from '../types';
import { LogOut, Plus, Send, ShieldCheck, Mail, BarChart2, X, Settings, Edit2, Save, XCircle, Calendar, MapPin, Building, Shield, Check, Trash2, Clock, AlertCircle, Copy, Terminal } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AdminDashboardProps {
  lang: Language;
  onLogout: () => void;
  productions: Production[];
  onAddProduction: (prod: Omit<Production, 'id' | 'status'>) => void;
  onInvite: (id: string) => void;
  onUpdateProduction: (id: string, updates: Partial<Production>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  lang, onLogout, productions, onAddProduction, onInvite, onUpdateProduction 
}) => {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<'productions' | 'requests'>('productions');
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [managingProductionId, setManagingProductionId] = useState<string | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newCoordName, setNewCoordName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Vollständiges Schema für alle benötigten Tabellen
  const SQL_SETUP = `-- 1. Tabelle für Test-Zugangsanfragen
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabelle für Filmproduktionen
CREATE TABLE IF NOT EXISTS productions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coordinator TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  team JSONB DEFAULT '[]',
  country TEXT,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabelle für Feedback-Nachrichten
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT now(),
  text TEXT,
  contact TEXT,
  score INTEGER,
  department TEXT,
  resolved BOOLEAN DEFAULT false
);

-- 4. Tabelle für Drehtage
CREATE TABLE IF NOT EXISTS shoot_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day INTEGER,
  date TEXT
);`;

  useEffect(() => {
    if (activeTab === 'requests') {
        fetchRequests();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    setDbError(null);
    try {
        const { data, error } = await supabase.from('access_requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setAccessRequests(data || []);
    } catch (err: any) {
        console.error("Error fetching requests:", err);
        if (err.message?.includes('not find the table') || err.message?.includes('does not exist')) {
            setDbError("TableMissing");
        } else {
            setDbError(err.message);
        }
    } finally {
        setIsLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (req: AccessRequest) => {
    try {
        const { error } = await supabase.from('access_requests').update({ status: 'approved' }).eq('id', req.id);
        if (error) throw error;

        await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            body: JSON.stringify({
                to: req.email,
                subject: "Ihr Trustory Test-Zugang wurde freigeschaltet",
                html: `
                    <div style="font-family: sans-serif; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px; max-width: 600px;">
                        <h1 style="color: #2563eb;">Willkommen bei Trustory</h1>
                        <p>Hallo ${req.first_name || req.name},</p>
                        <p>Ihre Anfrage für den kostenfreien Test-Zugang wurde erfolgreich geprüft und freigeschaltet.</p>
                        <div style="background: #f1f5f9; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
                            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Ihr Zugangscode</p>
                            <h2 style="margin: 10px 0 0 0; font-size: 32px; font-weight: 900; letter-spacing: 0.3em; color: #0f172a;">XPLM2</h2>
                        </div>
                        <p>Gehen Sie auf <a href="https://safe-on-set.com">safe-on-set.com</a> und klicken Sie auf <b>"Test-Zugang"</b> -> <b>"Code Eingeben"</b>.</p>
                    </div>
                `
            })
        });
        alert(`Anfrage für ${req.email} genehmigt und E-Mail versendet.`);
        fetchRequests();
    } catch (e: any) {
        alert(`Fehler: ${e.message}`);
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!confirm("Anfrage löschen?")) return;
    await supabase.from('access_requests').delete().eq('id', id);
    fetchRequests();
  };

  return (
    <div className={`min-h-screen bg-slate-900 text-white ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
       <header className="h-[70px] bg-slate-900/95 border-b border-white/10 flex justify-between items-center px-8 backdrop-blur-md">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3">
              <ShieldCheck className="text-purple-500" size={24} />
              <span className="font-bold text-lg">{t.adminDash}</span>
           </div>
           <nav className="flex gap-4 ml-10">
              <button onClick={() => setActiveTab('productions')} className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'productions' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                Productions
              </button>
              <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all relative ${activeTab === 'requests' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {t.pendingRequests}
                {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-[10px] flex items-center justify-center rounded-full">
                    {accessRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
           </nav>
        </div>
        <button onClick={onLogout} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <LogOut size={16} /> {t.logout}
        </button>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        {activeTab === 'productions' ? (
           <>
              <div className="bg-slate-800 border border-white/10 p-6 rounded-2xl mb-8 shadow-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><Plus size={20} className="text-emerald-500" /> {t.addProd}</h2>
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      onAddProduction({ name: newProdName, coordinator: newCoordName, email: newEmail });
                      setNewProdName(''); setNewCoordName(''); setNewEmail('');
                  }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div><label className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Title</label><input className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg outline-none text-white focus:border-blue-500" value={newProdName} onChange={e => setNewProdName(e.target.value)} required /></div>
                      <div><label className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Coordinator</label><input className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg outline-none text-white focus:border-blue-500" value={newCoordName} onChange={e => setNewCoordName(e.target.value)} required /></div>
                      <div><label className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Email</label><input className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg outline-none text-white focus:border-blue-500" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required /></div>
                      <button type="submit" className="bg-blue-600 h-[50px] text-white font-bold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 uppercase text-xs tracking-widest">{t.addProd}</button>
                  </form>
              </div>

              <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                  <table className="w-full text-left">
                      <thead className="bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold border-b border-white/10">
                          <tr>
                              <th className="p-4">Production</th>
                              <th className="p-4">Coordinator</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {productions.map(prod => (
                              <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                                  <td className="p-4 font-bold text-slate-200">{prod.name}</td>
                                  <td className="p-4 text-slate-400 text-sm">{prod.email}</td>
                                  <td className="p-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${prod.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{prod.status}</span>
                                  </td>
                                  <td className="p-4 text-right flex justify-end gap-2">
                                      <button onClick={() => setManagingProductionId(prod.id)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-slate-400"><Settings size={14} /></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
           </>
        ) : (
           <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-lg min-h-[400px] flex flex-col">
              {dbError === 'TableMissing' ? (
                  <div className="flex-1 p-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                      <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                          <Terminal size={40} />
                      </div>
                      <h3 className="text-2xl font-black mb-2 uppercase tracking-tight text-white">Datenbank-Setup erforderlich</h3>
                      <p className="text-slate-400 max-w-md mb-8 text-sm leading-relaxed">
                          Die Tabellen fehlen in Supabase. Kopiere den folgenden Block und füge ihn im <b>SQL Editor</b> deines Supabase-Dashboards ein:
                      </p>
                      
                      <div className="w-full max-w-lg bg-slate-950 rounded-2xl border border-white/10 p-6 relative group mb-8">
                          <pre className="text-blue-400 text-left text-[10px] font-mono overflow-x-auto leading-normal">
                              {SQL_SETUP}
                          </pre>
                          <button 
                            onClick={() => { navigator.clipboard.writeText(SQL_SETUP); alert("SQL Kopiert!"); }}
                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-all"
                            title="Kopieren"
                          >
                              <Copy size={16} />
                          </button>
                      </div>
                      
                      <button onClick={fetchRequests} className="px-8 py-3 bg-blue-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-500 transition-all">
                          Verbindung erneut prüfen
                      </button>
                  </div>
              ) : (
                  <>
                      <table className="w-full text-left">
                          <thead className="bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold border-b border-white/10">
                              <tr>
                                  <th className="p-4">Person</th>
                                  <th className="p-4">Email</th>
                                  <th className="p-4">Datum</th>
                                  <th className="p-4">Status</th>
                                  <th className="p-4 text-right">Aktionen</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {accessRequests.map(req => (
                                  <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                                      <td className="p-4">
                                         <div className="font-bold text-slate-100 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] border border-blue-500/20 text-blue-400 font-black">
                                                {(req.first_name?.[0] || req.name?.[0] || '?').toUpperCase()}
                                            </div>
                                            {req.first_name || ''} {req.last_name || req.name || 'Unbekannt'}
                                         </div>
                                      </td>
                                      <td className="p-4 text-slate-400 text-sm">{req.email}</td>
                                      <td className="p-4 text-slate-500 text-xs">{new Date(req.created_at).toLocaleDateString('de-DE')}</td>
                                      <td className="p-4">
                                         <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {req.status}
                                         </span>
                                      </td>
                                      <td className="p-4 text-right flex justify-end gap-2">
                                          {req.status === 'pending' && (
                                            <button 
                                                onClick={() => handleApproveRequest(req)} 
                                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-bold uppercase"
                                            >
                                                <Check size={14} /> Approve
                                            </button>
                                          )}
                                          <button onClick={() => handleRejectRequest(req.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 text-white transition-all"><Trash2 size={16} /></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      {accessRequests.length === 0 && !isLoadingRequests && (
                          <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-500 italic">
                             Keine Anfragen gefunden.
                          </div>
                      )}
                  </>
              )}
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
