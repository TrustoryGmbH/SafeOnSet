
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Production, AccessRequest } from '../types';
import { LogOut, Plus, Send, ShieldCheck, Mail, BarChart2, X, Settings, Edit2, Save, XCircle, Calendar, MapPin, Building, Shield, Check, Trash2, Clock } from 'lucide-react';
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
  
  // States für Production-Management
  const [newProdName, setNewProdName] = useState('');
  const [newCoordName, setNewCoordName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [managingProductionId, setManagingProductionId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase.from('access_requests').select('*').order('created_at', { ascending: false });
    if (data) setAccessRequests(data);
  };

  const handleApproveRequest = async (req: AccessRequest) => {
    await supabase.from('access_requests').update({ status: 'approved' }).eq('id', req.id);
    alert(`Request for ${req.email} approved. User can now use XPLM2.`);
    fetchRequests();
  };

  const handleRejectRequest = async (id: string) => {
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
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-[10px] flex items-center justify-center rounded-full animate-pulse">
                    {accessRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
           </nav>
        </div>
        <button onClick={onLogout} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold">
            <LogOut size={16} /> {t.logout}
        </button>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        {activeTab === 'productions' ? (
           <>
              <div className="bg-slate-800 border border-white/10 p-6 rounded-2xl mb-8 shadow-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus size={20} className="text-green-500" /> {t.addProd}</h2>
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      onAddProduction({ name: newProdName, coordinator: newCoordName, email: newEmail });
                      setNewProdName(''); setNewCoordName(''); setNewEmail('');
                  }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div><label className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Title</label><input className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg outline-none" value={newProdName} onChange={e => setNewProdName(e.target.value)} required /></div>
                      <div><label className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Coordinator</label><input className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg outline-none" value={newCoordName} onChange={e => setNewCoordName(e.target.value)} required /></div>
                      <div><label className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Email</label><input className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg outline-none" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required /></div>
                      <button type="submit" className="bg-blue-600 h-[50px] text-white font-bold rounded-lg">{t.addProd}</button>
                  </form>
              </div>

              <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                  <table className="w-full text-left">
                      <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-bold border-b border-white/10">
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
                                  <td className="p-4 font-medium">{prod.name}</td>
                                  <td className="p-4 text-slate-400 text-sm">{prod.email}</td>
                                  <td className="p-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${prod.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{prod.status}</span>
                                  </td>
                                  <td className="p-4 text-right flex justify-end gap-2">
                                      <button onClick={() => setManagingProductionId(prod.id)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10"><Settings size={14} /></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
           </>
        ) : (
           <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left">
                  <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-bold border-b border-white/10">
                      <tr>
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {accessRequests.map(req => (
                          <tr key={req.id} className="hover:bg-white/5">
                              <td className="p-4 font-bold">{req.name}</td>
                              <td className="p-4 text-slate-400">{req.email}</td>
                              <td className="p-4 text-slate-500 text-xs">{new Date(req.created_at).toLocaleDateString()}</td>
                              <td className="p-4">
                                 <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {req.status}
                                 </span>
                              </td>
                              <td className="p-4 text-right flex justify-end gap-2">
                                  {req.status === 'pending' && (
                                    <button onClick={() => handleApproveRequest(req)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20"><Check size={16} /></button>
                                  )}
                                  <button onClick={() => handleRejectRequest(req.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20"><Trash2 size={16} /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {accessRequests.length === 0 && <div className="p-20 text-center text-slate-500 italic">No access requests found.</div>}
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
