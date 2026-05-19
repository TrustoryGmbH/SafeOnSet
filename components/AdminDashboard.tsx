
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Production, AccessRequest } from '../types';
import { LogOut, Plus, Send, ShieldCheck, Mail, BarChart2, X, Settings, Edit2, Save, XCircle, Calendar, MapPin, Building, Shield, Check, Trash2, Clock, AlertCircle, Copy, Terminal, Eye, Info, User, Phone, FileDown } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AdminDashboardProps {
  lang: Language;
  onLogout: () => void;
  productions: Production[];
  onAddProduction: (prod: Omit<Production, 'id' | 'status'>) => void;
  onInvite: (id: string) => void;
  onUpdateProduction: (id: string, updates: Partial<Production>) => void;
  onViewFeedback: (id: string) => void;
  onDownloadReport: (id: string) => void;
  onRefresh?: () => void;
  dbError?: string | null;
}

const mapProduction = (p: any): Production => ({
  id: p.id,
  name: p.name,
  coordinator: p.coordinator || p.contact_person || 'N/A',
  email: p.email,
  status: p.status,
  team: p.team || [],
  co_admins: p.co_admins || [],
  country: p.country,
  periodStart: p.period_start,
  periodEnd: p.period_end
});

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  lang, onLogout, productions, onAddProduction, onInvite, onUpdateProduction, onViewFeedback, onDownloadReport,
  onRefresh, dbError: externalDbError
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Production | null>(null);
  
  // Co-Admin states
  const [coAdminFirstName, setCoAdminFirstName] = useState('');
  const [coAdminLastName, setCoAdminLastName] = useState('');
  const [coAdminEmail, setCoAdminEmail] = useState('');
  const [isAddingCoAdmin, setIsAddingCoAdmin] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);

  useEffect(() => {
    // Check if co_admins column exists by trying a small select
    const checkColumn = async () => {
        const { error } = await supabase.from('productions').select('co_admins').limit(1);
        if (error && (error.message.includes('column') || error.message.includes('not find'))) {
            setNeedsMigration(true);
        }
    };
    checkColumn();
  }, []);

  const handleAddCoAdmin = async () => {
    if (!selectedProd || !coAdminFirstName || !coAdminLastName || !coAdminEmail) return;
    
    const newCoAdmin = {
        id: Math.random().toString(36).substring(7),
        first_name: coAdminFirstName,
        last_name: coAdminLastName,
        email: coAdminEmail
    };

    const currentCoAdmins = selectedProd.co_admins || [];
    if (currentCoAdmins.length >= 2) {
        alert("Maximal 2 Co-Admins erlaubt.");
        return;
    }

    const updatedCoAdmins = [...currentCoAdmins, newCoAdmin];
    
    try {
        // Update DB
        const { error } = await supabase.from('productions').update({ 
            co_admins: updatedCoAdmins 
        }).eq('id', selectedProd.id);
        
        if (error) {
            if (error.message.includes('column') || error.message.includes('cache')) {
                setNeedsMigration(true);
                throw new Error("Datenbank-Struktur veraltet. Bitte führen Sie das SQL-Update aus (siehe 'Requests' Tab).");
            }
            throw error;
        }
        
        // Update local state via App.tsx prop if available, or just refetch. 
        // For now, let's use onUpdateProduction
        onUpdateProduction(selectedProd.id, { co_admins: updatedCoAdmins });
        
        // Trigger Invite
        handleInviteCoAdmin(selectedProd, newCoAdmin);
        
        // Reset
        setCoAdminFirstName('');
        setCoAdminLastName('');
        setCoAdminEmail('');
        setIsAddingCoAdmin(false);
        setSelectedProd({ ...selectedProd, co_admins: updatedCoAdmins });
    } catch (err: any) {
        alert(err.message);
    }
  };

  const handleInviteCoAdmin = async (production: Production, coAdmin: any) => {
    const inviteUrl = `${window.location.origin}/?admin_prod=${production.id}&co_user=${coAdmin.id}`;
    
    try {
        await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            body: JSON.stringify({
                to: coAdmin.email,
                subject: `Admin-Einladung für ${production.name}`,
                html: `<div style="font-family: sans-serif; padding: 40px; text-align: center; background: #f8fafc;">
                        <h1 style="color: #1e293b;">Admin Zugang</h1>
                        <p style="color: #64748b;">Hallo ${coAdmin.first_name}, Sie wurden als Co-Admin für <b>${production.name}</b> hinzugefügt.</p>
                        <div style="margin: 30px 0;">
                            <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background: #2563eb; color: white; text-decoration: none; border-radius: 12px; font-weight: bold;">Zum Admin Portal</a>
                        </div>
                        <p style="font-size: 12px; color: #94a3b8;">Nach Klick auf den Link wird Ihnen ein Sicherheitscode per E-Mail zugestellt.</p>
                       </div>`
            })
        });
        alert(`Einladung an ${coAdmin.email} versendet!`);
    } catch (err) {
        console.warn("Email error:", err);
        alert(`Einladung konnte nicht versendet werden. Manueller Link: ${inviteUrl}`);
    }
  };

  const handleCreate = () => {
    if (!newProdName || !newEmail) return;
    onAddProduction({
        name: newProdName,
        coordinator: newCoordName,
        email: newEmail,
    });
    setNewProdName('');
    setNewCoordName('');
    setNewEmail('');
    setShowAddModal(false);
  };

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

-- UPDATE: Productions Tabelle
ALTER TABLE productions
ADD COLUMN IF NOT EXISTS co_admins JSONB DEFAULT '[]'::jsonb;

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
);

-- Productions Tabelle falls noch nicht vorhanden
CREATE TABLE IF NOT EXISTS productions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coordinator TEXT,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  team JSONB DEFAULT '[]'::jsonb,
  co_admins JSONB DEFAULT '[]'::jsonb,
  country TEXT,
  period_start TEXT,
  period_end TEXT,
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

        let inviteUrl = '';
        
        // If it's a production request, auto-create a production object
        if (req.request_type === 'production') {
            const newProd = {
                name: req.name || 'Neues Projekt',
                coordinator: req.coordinator_name || req.manager_name || 'Coordinator',
                email: req.manager_email || req.email,
                status: 'Active'
            };
            const { data: pData, error: pError } = await supabase.from('productions').insert([newProd]).select();
            if (pError) {
                console.error("Auto-create production failed:", pError);
            } else if (pData && pData[0]) {
                const mapped = mapProduction(pData[0]);
                onAddProduction(mapped); // Local state update through App.tsx prop
                inviteUrl = `${window.location.origin}/?prod=${pData[0].id}`;
            }
        }

        // Email logic
        try {
            await fetch('/.netlify/functions/send-email', {
                method: 'POST',
                body: JSON.stringify({
                    to: req.email,
                    subject: req.request_type === 'production' ? "Ihre Safe on Set Produktion ist bereit" : "Zugang freigeschaltet",
                    html: `<div style="font-family: sans-serif; padding: 40px; text-align: center; background: #f8fafc;">
                            <h1 style="color: #2563eb;">${req.request_type === 'production' ? 'Produktion Bereit' : 'Zugang Erteilt'}</h1>
                            <p style="color: #64748b; font-size: 16px;">Ihre Anfrage wurde erfolgreich genehmigt.</p>
                            ${inviteUrl ? `
                                <div style="margin: 30px 0;">
                                    <a href="${inviteUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">Dashboard öffnen</a>
                                </div>
                            ` : `
                                <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; display: inline-block; margin: 20px 0;">
                                    <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: bold; margin-bottom: 8px;">Ihr persönlicher Code</span>
                                    <span style="font-size: 32px; font-weight: 900; color: #1e293b; letter-spacing: 0.2em;">XPLM2</span>
                                </div>
                            `}
                            <p style="font-size: 11px; color: #94a3b8; margin-top: 40px;">Safe on Set © 2026 • Trustory GmbH</p>
                        </div>`
                })
            });
            alert(`Anfrage genehmigt.${req.request_type === 'production' ? ' Produktion wurde angelegt.' : ''}`);
        } catch (emailErr) {
            console.warn("Email error in preview:", emailErr);
            alert(`Anfrage genehmigt, aber E-Mail-Versand in dieser Vorschau nicht verfügbar.\n${inviteUrl ? 'URL: ' + inviteUrl : 'Code: XPLM2'}`);
        }
        
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
        <div className="flex items-center gap-4">
            {activeTab === 'productions' && (
                <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-900/40">
                    <Plus size={16} /> New Production
                </button>
            )}
            <button onClick={onLogout} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/5 transition-all">
                <LogOut size={16} /> {t.logout}
            </button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-6">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Übersicht</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{productions.length} {productions.length === 1 ? 'Produktion' : 'Produktionen'} aktiv</p>
            </div>
            <div className="flex gap-2">
                <button onClick={onRefresh} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white" title="Aktualisieren">
                    <Save size={16} />
                </button>
            </div>
        </div>

        {(externalDbError || productions.length === 0) && (
            <div className="mb-6 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${externalDbError ? 'bg-rose-500/20 text-rose-500' : 'bg-blue-500/20 text-blue-400'} flex items-center justify-center`}>
                            {externalDbError ? <AlertCircle size={20} /> : <Terminal size={20} />}
                        </div>
                        <div>
                            <h4 className={`text-sm font-bold uppercase tracking-tight ${externalDbError ? 'text-rose-500' : 'text-blue-400'}`}>
                                {externalDbError ? 'System-Status / Diagnose' : 'Produktion wiederherstellen'}
                            </h4>
                            <p className="text-xs text-slate-400">{externalDbError || 'Die Liste ist aktuell leer. Sie können Ihr Projekt mit dem untenstehenden SQL-Code reaktivieren.'}</p>
                        </div>
                    </div>
                    <button onClick={onRefresh} className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-slate-700 transition-all">Liste aktualisieren</button>
                </div>
                
                <div className="mt-2 p-5 bg-blue-600/10 border border-blue-500/30 rounded-xl">
                    <h5 className="text-blue-400 font-black uppercase text-[10px] mb-2 flex items-center gap-2">
                         <Terminal size={14} /> Reparatur-Code (SUPERIOR)
                    </h5>
                    <p className="text-[10px] text-slate-300 mb-3 leading-relaxed">
                        Kopieren Sie diesen Code in den <b>Supabase SQL Editor</b> (New Query), um Ihre Produktion reaktivieren:
                    </p>
                    <pre className="p-3 bg-black/40 rounded-lg text-[9px] font-mono text-emerald-400 overflow-x-auto border border-white/5 mb-3 whitespace-pre">
{`-- 1. Tabelle prüfen/erstellen
CREATE TABLE IF NOT EXISTS productions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coordinator TEXT,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  team JSONB DEFAULT '[]'::jsonb,
  co_admins JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SUPERIOR wiederherstellen
INSERT INTO productions (name, coordinator, email, status)
SELECT 'SUPERIOR', 'kutzner.nils@yahoo.de', 'info@vonwesternhagen.com', 'Invited'
WHERE NOT EXISTS (SELECT 1 FROM productions WHERE name = 'SUPERIOR');`}
                    </pre>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS productions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, coordinator TEXT, email TEXT NOT NULL, status TEXT DEFAULT 'Active', team JSONB DEFAULT '[]'::jsonb, co_admins JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT now()); INSERT INTO productions (name, coordinator, email, status) SELECT 'SUPERIOR', 'kutzner.nils@yahoo.de', 'info@vonwesternhagen.com', 'Invited' WHERE NOT EXISTS (SELECT 1 FROM productions WHERE name = 'SUPERIOR');`);
                            alert("Wiederherstellungs-Code kopiert!");
                        }}
                        className="w-full py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-blue-500 transition-all font-bold"
                    >
                        Wiederherstellungs-Code kopieren
                    </button>
                </div>
            </div>
        )}
        {needsMigration && activeTab === 'productions' && (
            <div className="mb-6 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-500">Datenbank-Update erforderlich</h4>
                        <p className="text-xs text-slate-400">Für die Co-Admin Funktion muss eine neue Spalte in Supabase angelegt werden.</p>
                    </div>
                </div>
                <button onClick={() => setActiveTab('requests')} className="px-4 py-2 bg-amber-500 text-black text-[10px] font-black uppercase rounded-lg hover:bg-amber-400 transition-all">SQL Anzeigen</button>
            </div>
        )}
        {activeTab === 'productions' ? (
           <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left">
                  <thead className="bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold border-b border-white/10">
                      <tr><th className="p-4">Production</th><th className="p-4">Coordinator</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {productions.map(prod => (
                          <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-bold text-slate-200 uppercase tracking-tight">{prod.name}</td>
                              <td className="p-4 text-slate-400 text-sm">
                                <div className="text-white font-medium mb-0.5">{prod.coordinator}</div>
                                <div className="text-[10px] opacity-50">{prod.email}</div>
                              </td>
                              <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${prod.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{prod.status}</span>
                              </td>
                              <td className="p-4 text-right flex justify-end gap-2 text-slate-400">
                                  {(prod.status === 'Active' || prod.status === 'Invited') && (
                                    <>
                                        <button onClick={() => onViewFeedback(prod.id)} title="Feedback ansehen" className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                            <BarChart2 size={14} />
                                        </button>
                                        <button onClick={() => onDownloadReport(prod.id)} title="Bericht (PDF) laden" className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all shadow-sm">
                                            <FileDown size={14} />
                                        </button>
                                        <button onClick={() => onInvite(prod.id)} title="Erneut einladen" className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                            <Send size={14} />
                                        </button>
                                    </>
                                  )}
                                  <button onClick={() => setSelectedProd(prod)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"><Settings size={14} /></button>
                              </td>
                          </tr>
                      ))}
                      {productions.length === 0 && (
                          <tr>
                              <td colSpan={4} className="p-12 text-center text-slate-500">
                                  <div className="flex flex-col items-center gap-3">
                                      <div className="p-4 bg-slate-700/20 rounded-full text-slate-500">
                                          <AlertCircle size={32} className="opacity-50" />
                                      </div>
                                      <div className="text-center">
                                          <p className="text-sm font-bold text-slate-300">Keine Produktionen gefunden</p>
                                          <p className="text-[10px] text-slate-500 mt-1 max-w-[250px] mx-auto italic">
                                              Schauen Sie im "Anfragen Verwalten" Tab nach den SQL-Befehlen. 
                                              Evtl. wurde die Tabelle 'productions' gelöscht oder umbenannt.
                                          </p>
                                      </div>
                                      {externalDbError && (
                                          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-500 font-mono">
                                              DEBUG: {externalDbError}
                                          </div>
                                      )}
                                      <div className="flex gap-4 mt-2">
                                        <button onClick={onRefresh} className="px-5 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">Daten neu laden</button>
                                        <button onClick={() => window.location.reload()} className="px-5 py-2 bg-white/5 text-slate-400 text-[10px] font-black uppercase rounded-xl hover:text-white transition-all">Vollständiger Refresh</button>
                                      </div>
                                  </div>
                              </td>
                          </tr>
                      )}
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

      {/* Modal: New Production */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                   <div>
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1 block">Quick Setup</span>
                       <h2 className="text-2xl font-black uppercase tracking-tight">New Production</h2>
                   </div>
                   <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Production Name</label>
                        <input 
                            value={newProdName} 
                            onChange={e => setNewProdName(e.target.value)}
                            placeholder="e.g. Cinema Feature June"
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Coordinator Email</label>
                        <input 
                            value={newEmail} 
                            onChange={e => setNewEmail(e.target.value)}
                            placeholder="coordinator@production.com"
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Manager Name (Optional)</label>
                        <input 
                            value={newCoordName} 
                            onChange={e => setNewCoordName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>
                <div className="p-8 bg-slate-950/50 flex gap-4">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-800 text-white text-xs font-black rounded-2xl uppercase tracking-widest">Cancel</button>
                    <button onClick={handleCreate} className="flex-1 py-4 bg-blue-600 text-white text-xs font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-blue-900/40">Create & Deploy</button>
                </div>
             </div>
        </div>
      )}

      {/* Modal: Edit Production */}
      {selectedProd && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                   <div>
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-1 block">Settings</span>
                       <h2 className="text-2xl font-black uppercase tracking-tight">{selectedProd.name}</h2>
                   </div>
                   <button onClick={() => setSelectedProd(null)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-4 text-slate-300 text-sm overflow-y-auto max-h-[60vh]">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="font-bold">Dashboard Link</span>
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?prod=${selectedProd.id}`); alert("URL kopiert!"); }} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                            <Copy size={16} /> URL
                        </button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="font-bold">Status</span>
                        <span className="text-emerald-500 text-xs font-black uppercase">{selectedProd.status}</span>
                    </div>

                    {/* CO-ADMIN SECTION */}
                    <div className="pt-6 border-t border-white/10 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Co-Admins</h3>
                                <span className="text-[9px] text-slate-500">Maximal 2 zusätzliche Verwalter</span>
                            </div>
                            {(selectedProd.co_admins || []).length < 2 && !isAddingCoAdmin && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsAddingCoAdmin(true); }} 
                                    className="px-3 py-1.5 bg-blue-600/20 text-blue-400 text-[10px] font-black rounded-lg uppercase hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    <Plus size={12} /> Hinzufügen
                                </button>
                            )}
                        </div>

                        {isAddingCoAdmin ? (
                            <div className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/20 space-y-3 mb-6 animate-in slide-in-from-top-2 border-dashed">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-slate-500 ml-1">Vorname</label>
                                        <input 
                                            placeholder="z.B. Max" 
                                            value={coAdminFirstName}
                                            onChange={e => setCoAdminFirstName(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-slate-500 ml-1">Nachname</label>
                                        <input 
                                            placeholder="z.B. Mustermann" 
                                            value={coAdminLastName}
                                            onChange={e => setCoAdminLastName(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-slate-500 ml-1">E-Mail Adresse</label>
                                    <input 
                                        placeholder="beispiel@mail.de" 
                                        value={coAdminEmail}
                                        onChange={e => setCoAdminEmail(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setIsAddingCoAdmin(false)} className="flex-1 py-3 bg-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors">Abbrechen</button>
                                    <button onClick={handleAddCoAdmin} className="flex-1 py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-900/40">Einladung senden</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(selectedProd.co_admins || []).map((ca, idx) => (
                                    <div key={ca.id} className="group flex justify-between items-center p-4 bg-white/5 hover:bg-white/[0.07] rounded-2xl border border-white/5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">
                                                {ca.first_name[0]}{ca.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{ca.first_name} {ca.last_name}</div>
                                                <div className="text-[10px] text-slate-500">{ca.email}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if(!confirm(`Möchten Sie ${ca.first_name} ${ca.last_name} als Co-Admin entfernen?`)) return;
                                                const filtered = (selectedProd.co_admins || []).filter((_, i) => i !== idx);
                                                await supabase.from('productions').update({ co_admins: filtered }).eq('id', selectedProd.id);
                                                onUpdateProduction(selectedProd.id, { co_admins: filtered });
                                                setSelectedProd({...selectedProd, co_admins: filtered});
                                            }}
                                            className="p-2.5 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {(selectedProd.co_admins || []).length === 0 && (
                                    <div className="text-center py-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-slate-500 text-[10px] font-medium italic">Noch keine Co-Admins hinzugefügt.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-8 mb-4">
                       <button onClick={() => { if(confirm("Archivieren?")) onUpdateProduction(selectedProd.id, {status: 'Finished'}); setSelectedProd(null); }} className="w-full py-4 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest rounded-2xl">
                           Produktion Archivieren
                       </button>
                    </div>
                </div>
                <div className="p-8 bg-slate-950/50">
                    <button onClick={() => setSelectedProd(null)} className="w-full py-4 bg-slate-800 text-white text-xs font-black rounded-2xl uppercase tracking-widest">Fertig</button>
                </div>
             </div>
          </div>
      )}

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
