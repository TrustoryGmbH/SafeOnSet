
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Production, AccessRequest } from '../types';
import { LogOut, Plus, Send, ShieldCheck, Mail, BarChart2, X, Settings, Edit2, Save, XCircle, Calendar, MapPin, Building, Shield, Check, Trash2, Clock, AlertCircle, Copy, Terminal, Eye, Info, User, Phone } from 'lucide-react';
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
  const [selectedReq, setSelectedReq] = useState<AccessRequest | null>(null);
  
  const [newProdName, setNewProdName] = useState('');
  const [newCoordName, setNewCoordName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const SQL_SETUP = `-- UPDATE: Access Requests Tabelle mit allen Feldern
ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'test',
ADD COLUMN IF NOT EXISTS manager_name TEXT,
ADD COLUMN IF NOT EXISTS manager_email TEXT,
ADD COLUMN IF NOT EXISTS coordinator_name TEXT,
ADD COLUMN IF NOT EXISTS coordinator_email TEXT,
ADD COLUMN IF NOT EXISTS start_period TEXT,
ADD COLUMN IF NOT EXISTS end_period TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS office_address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Standard Tabelle falls noch gar nicht vorhanden
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT DEFAULT 'test',
  first_name TEXT,
  last_name TEXT,
  name TEXT, -- Production Name
  email TEXT NOT NULL,
  manager_name TEXT,
  manager_email TEXT,
  coordinator_name TEXT,
  coordinator_email TEXT,
  start_period TEXT,
  end_period TEXT,
  billing_address TEXT,
  office_address TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
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

        // E-Mail Logik (vereinfacht)
        await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            body: JSON.stringify({
                to: req.email,
                subject: req.request_type === 'production' ? "Produktion freigeschaltet" : "Test-Zugang freigeschaltet",
                html: `<div style="font-family: sans-serif; padding: 20px;"><h1>Freigabe erfolgreich</h1><p>Code: <b>XPLM2</b></p></div>`
            })
        });
        alert(`Anfrage genehmigt.`);
        fetchRequests();
        setSelectedReq(null);
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
       <header className="h-[70px] bg-slate-900/95 border-b border-white/10 flex justify-between items-center px-8 backdrop-blur-md sticky top-0 z-50">
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
        <button onClick={onLogout} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/5 transition-all">
            <LogOut size={16} /> {t.logout}
        </button>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        {activeTab === 'productions' ? (
           <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left">
                  <thead className="bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold border-b border-white/10">
                      <tr><th className="p-4">Production</th><th className="p-4">Coordinator</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {productions.map(prod => (
                          <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-bold text-slate-200">{prod.name}</td>
                              <td className="p-4 text-slate-400 text-sm">{prod.email}</td>
                              <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${prod.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{prod.status}</span>
                              </td>
                              <td className="p-4 text-right"><button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-slate-400"><Settings size={14} /></button></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
           </div>
        ) : (
           <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-lg min-h-[400px] flex flex-col">
              {dbError === 'TableMissing' ? (
                  <div className="flex-1 p-12 text-center flex flex-col items-center justify-center">
                    <Terminal size={40} className="text-amber-500 mb-4" />
                    <h3 className="text-xl font-bold mb-4">SQL Update erforderlich</h3>
                    <div className="bg-black p-4 rounded-xl text-xs text-blue-400 font-mono text-left w-full max-w-lg mb-4 overflow-x-auto">{SQL_SETUP}</div>
                    <button onClick={() => {navigator.clipboard.writeText(SQL_SETUP); alert("SQL kopiert!");}} className="bg-blue-600 px-6 py-2 rounded-lg font-bold">SQL Kopieren</button>
                  </div>
              ) : (
                  <table className="w-full text-left">
                      <thead className="bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold border-b border-white/10">
                          <tr><th className="p-4">Type</th><th className="p-4">Name/Production</th><th className="p-4">Contact</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {accessRequests.map(req => (
                              <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                                  <td className="p-4">
                                     <span className={`px-2 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${req.request_type === 'production' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-700/50 text-slate-400'}`}>
                                        {req.request_type || 'test'}
                                     </span>
                                  </td>
                                  <td className="p-4 font-bold text-slate-200">
                                      {req.request_type === 'production' ? req.name : `${req.first_name} ${req.last_name}`}
                                  </td>
                                  <td className="p-4 text-slate-400 text-sm">{req.email}</td>
                                  <td className="p-4">
                                     <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{req.status}</span>
                                  </td>
                                  <td className="p-4 text-right flex justify-end gap-2">
                                      <button onClick={() => setSelectedReq(req)} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Eye size={16} /></button>
                                      {req.status === 'pending' && <button onClick={() => handleApproveRequest(req)} className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><Check size={16} /></button>}
                                      <button onClick={() => handleRejectRequest(req.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              )}
           </div>
        )}
      </main>

      {/* Detail Modal für Admins */}
      {selectedReq && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
                 <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1 block">Anfrage Details</span>
                        <h2 className="text-2xl font-black uppercase tracking-tight">{selectedReq.request_type === 'production' ? selectedReq.name : 'Test-Anfrage'}</h2>
                    </div>
                    <button onClick={() => setSelectedReq(null)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                 </div>
                 <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {selectedReq.request_type === 'production' ? (
                        <>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-400"><User size={16}/> <span className="text-[10px] font-bold uppercase">Produktionsleiter</span></div>
                                <div className="font-bold text-white">{selectedReq.manager_name}</div>
                                <div className="text-sm text-blue-400 underline">{selectedReq.manager_email}</div>
                                
                                <div className="pt-4 flex items-center gap-3 text-slate-400"><Calendar size={16}/> <span className="text-[10px] font-bold uppercase">Zeitraum</span></div>
                                <div className="font-bold text-white">{selectedReq.start_period} bis {selectedReq.end_period}</div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-400"><User size={16}/> <span className="text-[10px] font-bold uppercase">Koordinator</span></div>
                                <div className="font-bold text-white">{selectedReq.coordinator_name || 'Keiner angegeben'}</div>
                                <div className="text-sm text-blue-400 underline">{selectedReq.coordinator_email || '-'}</div>

                                <div className="pt-4 flex items-center gap-3 text-slate-400"><Phone size={16}/> <span className="text-[10px] font-bold uppercase">Kontakt Telefon</span></div>
                                <div className="font-bold text-white">{selectedReq.phone || '-'}</div>
                            </div>
                            <div className="md:col-span-2 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-400"><MapPin size={16}/> <span className="text-[10px] font-bold uppercase">Rechnungsadresse</span></div>
                                    <div className="bg-slate-950 p-4 rounded-xl text-sm text-slate-200 leading-relaxed border border-white/5 whitespace-pre-line">{selectedReq.billing_address}</div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-400"><MapPin size={16}/> <span className="text-[10px] font-bold uppercase">Büroadresse</span></div>
                                    <div className="bg-slate-950 p-4 rounded-xl text-sm text-slate-200 leading-relaxed border border-white/5 whitespace-pre-line">{selectedReq.office_address}</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="md:col-span-2 text-center py-10">
                            <h3 className="text-lg font-bold mb-2 text-white">{selectedReq.first_name} {selectedReq.last_name}</h3>
                            <p className="text-blue-400">{selectedReq.email}</p>
                            <p className="text-slate-500 mt-4 text-sm">Dies ist eine einfache Anfrage für einen Test-Zugang.</p>
                        </div>
                    )}
                 </div>
                 <div className="p-8 bg-slate-950/50 flex justify-end gap-4">
                    <button onClick={() => setSelectedReq(null)} className="px-8 py-3 bg-slate-800 text-white text-[10px] font-black rounded-xl uppercase tracking-widest">Schließen</button>
                    {selectedReq.status === 'pending' && (
                        <button onClick={() => handleApproveRequest(selectedReq)} className="px-8 py-3 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-blue-500 transition-all">Jetzt Genehmigen</button>
                    )}
                 </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
