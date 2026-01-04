
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Production, AccessRequest } from '../types';
import { LogOut, Plus, Send, ShieldCheck, Mail, BarChart2, X, Settings, Edit2, Save, XCircle, Calendar, MapPin, Building, Shield, Check, Trash2, Clock, AlertCircle } from 'lucide-react';
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
  
  // States for Production Management
  const [newProdName, setNewProdName] = useState('');
  const [newCoordName, setNewCoordName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [managingProductionId, setManagingProductionId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'requests') {
        fetchRequests();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
        const { data, error } = await supabase.from('access_requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setAccessRequests(data || []);
    } catch (err: any) {
        console.error("Error fetching requests:", err);
    } finally {
        setIsLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (req: AccessRequest) => {
    try {
        const { error } = await supabase.from('access_requests').update({ status: 'approved' }).eq('id', req.id);
        if (error) throw error;

        // Trigger confirmation email
        await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            body: JSON.stringify({
                to: req.email,
                subject: "Ihr Trustory Test-Zugang wurde freigeschaltet",
                html: `
                    <div style="font-family: sans-serif; color: #0f172a; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px; max-width: 600px; margin: auto;">
                        <h1 style="color: #2563eb; font-weight: 900; text-transform: uppercase; margin-bottom: 20px;">Willkommen bei Trustory</h1>
                        <p style="font-size: 16px; line-height: 1.5;">Hallo ${req.first_name || req.name || 'Test-User'},</p>
                        <p style="font-size: 16px; line-height: 1.5;">Ihre Anfrage für den kostenfreien Test-Zugang wurde erfolgreich geprüft und freigeschaltet.</p>
                        <div style="background: #f8fafc; padding: 30px; border-radius: 20px; border: 2px dashed #cbd5e1; margin: 30px 0; text-align: center;">
                            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.2em;">Ihr Zugangscode</p>
                            <h2 style="margin: 10px 0 0 0; font-size: 42px; font-weight: 900; letter-spacing: 0.3em; color: #2563eb;">XPLM2</h2>
                        </div>
                        <p style="font-size: 16px; line-height: 1.5;">Besuchen Sie <a href="https://safe-on-set.com" style="color: #2563eb; font-weight: bold; text-decoration: none;">safe-on-set.com</a> und klicken Sie auf <strong>"Test-Zugang"</strong> -> <strong>"Code Eingeben"</strong>.</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;">
                        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Dies ist ein isolierter Sandbox-Account für Demonstrationszwecke. Alle Daten werden nach der Sitzung zurückgesetzt.</p>
                    </div>
                `
            })
        });
        alert(`Request for ${req.email} approved and email sent successfully.`);
        fetchRequests();
    } catch (e: any) {
        alert(`Error: ${e.message || e}`);
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!confirm("Anfrage wirklich löschen?")) return;
    try {
        const { error } = await supabase.from('access_requests').delete().eq('id', id);
        if (error) throw error;
        fetchRequests();
    } catch (err: any) {
        alert("Error deleting request.");
    }
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
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-[10px] flex items-center justify-center rounded-full animate-pulse">
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
           <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-lg min-h-[400px]">
              <table className="w-full text-left">
                  <thead className="bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold border-b border-white/10">
                      <tr>
                          <th className="p-4">Person</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {accessRequests.map(req => (
                          <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                              <td className="p-4">
                                 <div className="font-bold text-slate-100 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-[10px] border border-purple-500/20">
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
                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
                                        title="Freischalten & E-Mail senden"
                                    >
                                        <Check size={14} /> Genehmigen
                                    </button>
                                  )}
                                  <button onClick={() => handleRejectRequest(req.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 text-white transition-all"><Trash2 size={16} /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {isLoadingRequests && (
                  <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                      <Clock className="animate-spin mb-2" size={32} />
                      <p className="text-xs font-bold uppercase tracking-widest">Lade Anfragen...</p>
                  </div>
              )}
              {!isLoadingRequests && accessRequests.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                      <AlertCircle className="mb-4 opacity-20" size={64} />
                      <p className="text-sm font-medium italic">Bisher keine Zugangsanfragen vorhanden.</p>
                  </div>
              )}
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
