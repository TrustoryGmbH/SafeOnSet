
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Production } from '../types';
import { LogOut, Plus, Send, ShieldCheck, Mail, BarChart2, X, Settings, UserPlus, StopCircle, Edit2, Save, XCircle, Calendar, MapPin, Building, Shield } from 'lucide-react';

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
  const [newProdName, setNewProdName] = useState('');
  const [newCoordName, setNewCoordName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [selectedProductionId, setSelectedProductionId] = useState<string | null>(null);
  const [managingProductionId, setManagingProductionId] = useState<string | null>(null);

  // Edit States
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editProdValues, setEditProdValues] = useState<Partial<Production>>({ name: '', coordinator: '', email: '' });
  
  const [editingMemberIdx, setEditingMemberIdx] = useState<number | null>(null);
  const [editMemberValues, setEditMemberValues] = useState({ name: '', email: '', role: '' });

  // Add Member State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  const selectedProduction = productions.find(p => p.id === selectedProductionId);
  const managingProduction = productions.find(p => p.id === managingProductionId);

  useEffect(() => {
    if (managingProduction) {
      setEditProdValues({
        name: managingProduction.name,
        coordinator: managingProduction.coordinator,
        email: managingProduction.email,
        periodStart: managingProduction.periodStart || '',
        periodEnd: managingProduction.periodEnd || '',
        officeAddress: managingProduction.officeAddress || '',
        billingAddress: managingProduction.billingAddress || '',
        trustContactType: managingProduction.trustContactType || 'none',
        trustContactInfo: managingProduction.trustContactInfo || ''
      });
      setIsEditingInfo(false);
      setEditingMemberIdx(null);
    }
  }, [managingProduction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProdName && newCoordName && newEmail) {
      onAddProduction({
        name: newProdName,
        coordinator: newCoordName,
        email: newEmail
      });
      setNewProdName('');
      setNewCoordName('');
      setNewEmail('');
    }
  };

  const getMockScore = (id: string) => {
    const val = (id.length * 13) % 40; 
    return 60 + val;
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingProduction || !newMemberName || !newMemberEmail || !newMemberRole) return;
    
    const currentTeam = managingProduction.team || [];
    if (currentTeam.length >= 4) return;

    const newTeam = [...currentTeam, { name: newMemberName, email: newMemberEmail, role: newMemberRole }];
    onUpdateProduction(managingProduction.id, { team: newTeam });
    
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('');
  };

  const handleStatusChange = (status: 'Finished' | 'Active') => {
    if (!managingProduction) return;
    onUpdateProduction(managingProduction.id, { status });
  };

  // --- Edit Handlers ---
  const handleSaveInfo = () => {
    if (!managingProduction) return;
    onUpdateProduction(managingProduction.id, editProdValues);
    setIsEditingInfo(false);
  };

  const handleEditMemberStart = (idx: number, member: {name: string, email: string, role: string}) => {
    setEditingMemberIdx(idx);
    setEditMemberValues(member);
  };

  const handleSaveMember = () => {
    if (!managingProduction || editingMemberIdx === null) return;
    
    const newTeam = [...(managingProduction.team || [])];
    newTeam[editingMemberIdx] = editMemberValues;
    onUpdateProduction(managingProduction.id, { team: newTeam });
    setEditingMemberIdx(null);
  };

  const handleInviteMember = (email: string) => {
    alert(`${t.inviteSent} (${email})`);
  };

  return (
    <div className={`min-h-screen bg-slate-900 text-white ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
       {/* Header */}
       <header className="h-[70px] bg-slate-900/95 border-b border-white/10 flex justify-between items-center px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
           <ShieldCheck className="text-blue-500" size={24} />
           <span className="font-bold text-lg">{t.adminDash}</span>
        </div>
        <button onClick={onLogout} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold">
            <LogOut size={16} /> {t.logout}
        </button>
      </header>

      <div className="p-8 max-w-6xl mx-auto">
        
        {/* Add Production Form */}
        <div className="bg-slate-800 border border-white/10 p-6 rounded-2xl mb-8 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus size={20} className="text-green-500" /> {t.addProd}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t.prodName}</label>
                    <input 
                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg outline-none focus:border-blue-500"
                        value={newProdName}
                        onChange={e => setNewProdName(e.target.value)}
                        placeholder="e.g. Tatort - Köln"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t.prodCoord}</label>
                    <input 
                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg outline-none focus:border-blue-500"
                        value={newCoordName}
                        onChange={e => setNewCoordName(e.target.value)}
                        placeholder="e.g. Maria Schmidt"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t.prodEmail}</label>
                    <input 
                        className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg outline-none focus:border-blue-500"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        type="email"
                        placeholder="maria@prod.com"
                        required
                    />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg transition-colors">
                    {t.addProd}
                </button>
            </form>
        </div>

        {/* List */}
        <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold border-b border-white/10">
                    <tr>
                        <th className="p-4">{t.prodName}</th>
                        <th className="p-4">{t.prodCoord}</th>
                        <th className="p-4">{t.prodEmail}</th>
                        <th className="p-4">{t.status}</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {productions.map(prod => (
                        <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium">{prod.name}</td>
                            <td className="p-4 text-slate-300">{prod.coordinator}</td>
                            <td className="p-4 text-slate-300 flex items-center gap-2">
                                <Mail size={14} className="opacity-50" /> {prod.email}
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                    prod.status === 'Active' ? 'bg-green-500/20 text-green-400' : 
                                    prod.status === 'Finished' ? 'bg-slate-500/20 text-slate-400' :
                                    prod.status === 'Invited' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                    {prod.status}
                                </span>
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2">
                                <button 
                                    onClick={() => setManagingProductionId(prod.id)}
                                    className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-2 transition-colors border border-white/5"
                                    title={t.manage}
                                >
                                    <Settings size={14} />
                                </button>
                                <button 
                                    onClick={() => setSelectedProductionId(prod.id)}
                                    className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-2 transition-colors border border-white/5"
                                >
                                    <BarChart2 size={14} /> {t.viewStats}
                                </button>
                                {prod.status !== 'Active' && prod.status !== 'Finished' && (
                                    <button 
                                        onClick={() => onInvite(prod.id)}
                                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-2 transition-colors border border-blue-500/30"
                                    >
                                        <Send size={14} /> {t.invite}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {productions.length === 0 && (
                <div className="p-8 text-center text-slate-500">No productions yet.</div>
            )}
        </div>
      </div>

      {/* Stats Modal */}
      {selectedProduction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-[zoom-in_0.2s_ease-out]">
                {/* Modal Header */}
                <div className="flex justify-between items-start p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold">{t.prodStats}</h2>
                        <p className="text-slate-400 text-sm mt-1">{selectedProduction.name}</p>
                    </div>
                    <button onClick={() => setSelectedProductionId(null)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-6">
                    {selectedProduction.status !== 'Active' && selectedProduction.status !== 'Finished' ? (
                         <div className="text-center py-8 text-slate-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                            Production not active yet. No data available.
                         </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Score Card */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.currentScore}</div>
                                {(() => {
                                    const score = getMockScore(selectedProduction.id);
                                    const color = score >= 90 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
                                    return (
                                        <div className={`text-6xl font-black ${color}`}>
                                            {score}%
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* Incidents Card */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.recentIncidents}</div>
                                {getMockScore(selectedProduction.id) > 80 ? (
                                    <div className="h-32 flex items-center justify-center text-slate-500 text-sm italic">
                                        <ShieldCheck size={18} className="mr-2" /> {t.noIncidents}
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        <li className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                            <div className="flex justify-between text-xs text-red-300 mb-1">
                                                <span>Yesterday</span>
                                                <span className="font-bold">Score: 100</span>
                                            </div>
                                            <p className="text-sm text-slate-300 italic">"Catering was late, crew is hungry..."</p>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 pt-0 flex justify-end">
                    <button 
                        onClick={() => setSelectedProductionId(null)}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm transition-colors"
                    >
                        {t.close}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Manage Production Modal */}
      {managingProduction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-[zoom-in_0.2s_ease-out] max-h-[90vh] overflow-y-auto custom-scrollbar">
                 <div className="flex justify-between items-start p-6 border-b border-white/10 sticky top-0 bg-slate-800 z-10">
                    <div>
                        <h2 className="text-xl font-bold">{t.manageProd}</h2>
                        <p className="text-slate-400 text-sm mt-1">{managingProduction.name}</p>
                    </div>
                    <button onClick={() => setManagingProductionId(null)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Section 0: General Info Editing */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.generalInfo}</h3>
                           {!isEditingInfo && (
                               <button onClick={() => setIsEditingInfo(true)} className="text-slate-400 hover:text-white">
                                   <Edit2 size={14} />
                               </button>
                           )}
                        </div>
                        
                        {isEditingInfo ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block uppercase">{t.prodName}</label>
                                        <input 
                                            value={editProdValues.name}
                                            onChange={e => setEditProdValues({...editProdValues, name: e.target.value})}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block uppercase">{t.prodCoord}</label>
                                        <input 
                                            value={editProdValues.coordinator}
                                            onChange={e => setEditProdValues({...editProdValues, coordinator: e.target.value})}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block uppercase">{t.prodEmail}</label>
                                    <input 
                                        value={editProdValues.email}
                                        onChange={e => setEditProdValues({...editProdValues, email: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                     <div>
                                        <label className="text-xs text-slate-500 mb-1 block uppercase">Start</label>
                                        <input 
                                            type="date"
                                            value={editProdValues.periodStart}
                                            onChange={e => setEditProdValues({...editProdValues, periodStart: e.target.value})}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block uppercase">End</label>
                                        <input 
                                            type="date"
                                            value={editProdValues.periodEnd}
                                            onChange={e => setEditProdValues({...editProdValues, periodEnd: e.target.value})}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block uppercase">Office Address</label>
                                    <textarea 
                                        rows={2}
                                        value={editProdValues.officeAddress}
                                        onChange={e => setEditProdValues({...editProdValues, officeAddress: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block uppercase">Trust Contact</label>
                                    <div className="flex gap-2 mb-1">
                                        <label className="text-xs flex items-center gap-1 cursor-pointer">
                                            <input type="radio" checked={editProdValues.trustContactType === 'themis'} onChange={() => setEditProdValues({...editProdValues, trustContactType: 'themis'})} /> Themis
                                        </label>
                                        <label className="text-xs flex items-center gap-1 cursor-pointer">
                                            <input type="radio" checked={editProdValues.trustContactType === 'internal'} onChange={() => setEditProdValues({...editProdValues, trustContactType: 'internal'})} /> Internal
                                        </label>
                                    </div>
                                    {editProdValues.trustContactType === 'internal' && (
                                        <input 
                                            value={editProdValues.trustContactInfo}
                                            onChange={e => setEditProdValues({...editProdValues, trustContactInfo: e.target.value})}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                            placeholder="Contact Info"
                                        />
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setIsEditingInfo(false)} className="text-xs bg-slate-700 px-3 py-1 rounded hover:bg-slate-600">{t.cancel}</button>
                                    <button onClick={handleSaveInfo} className="text-xs bg-green-600 px-3 py-1 rounded hover:bg-green-500">{t.save}</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm font-bold text-white">{managingProduction.name}</div>
                                    <div className="text-sm text-slate-300">{managingProduction.coordinator}</div>
                                    <div className="text-xs text-slate-500">{managingProduction.email}</div>
                                </div>
                                {(managingProduction.periodStart || managingProduction.officeAddress) && (
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                         {/* Period */}
                                         {managingProduction.periodStart && (
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1"><Calendar size={10}/> Start</div>
                                                    <div className="text-slate-300">{managingProduction.periodStart}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1"><Calendar size={10}/> End</div>
                                                    <div className="text-slate-300">{managingProduction.periodEnd}</div>
                                                </div>
                                            </div>
                                         )}

                                         {/* Addresses */}
                                         {managingProduction.officeAddress && (
                                             <div>
                                                 <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-1"><MapPin size={10}/> Office Address</div>
                                                 <div className="text-xs text-slate-300 leading-relaxed bg-black/20 p-2 rounded">{managingProduction.officeAddress}</div>
                                             </div>
                                         )}

                                        {/* Trust */}
                                        {managingProduction.trustContactType && (
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-1"><Shield size={10}/> Trust Contact</div>
                                                <div className="flex items-center gap-2">
                                                    {managingProduction.trustContactType === 'themis' ? (
                                                        <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">Member of Themis</span>
                                                    ) : (
                                                        <div className="text-xs">
                                                            <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300 mr-2">Internal</span>
                                                            <span className="text-white">{managingProduction.trustContactInfo || 'N/A'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section 1: End Production */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Project Status</h3>
                        <div className="flex justify-between items-center">
                             <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                managingProduction.status === 'Active' ? 'bg-green-500/20 text-green-400' : 
                                managingProduction.status === 'Finished' ? 'bg-slate-500/20 text-slate-400' :
                                'bg-yellow-500/20 text-yellow-400'
                            }`}>
                                {managingProduction.status}
                            </span>
                            
                            {managingProduction.status === 'Finished' ? (
                                <button 
                                   onClick={() => handleStatusChange('Active')}
                                   className="text-xs font-bold text-blue-400 hover:text-blue-300 border border-blue-500/30 bg-blue-500/10 px-3 py-2 rounded-lg"
                                >
                                   {t.reactivateProd}
                                </button>
                            ) : managingProduction.status === 'Pending' ? (
                                <button 
                                   onClick={() => handleStatusChange('Active')}
                                   className="text-xs font-bold text-green-400 hover:text-green-300 border border-green-500/30 bg-green-500/10 px-3 py-2 rounded-lg"
                                >
                                   Approve & Activate
                                </button>
                            ) : (
                                <button 
                                   onClick={() => handleStatusChange('Finished')}
                                   className="text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/30 bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-2"
                                >
                                   <StopCircle size={14} /> {t.endProd}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Team Members */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.teamMembers}</h3>
                         
                         {/* List existing */}
                         <ul className="space-y-3 mb-6">
                            {/* Owner Row - Not editable here to avoid conflict with General Info */}
                            <li className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                <div>
                                    <div className="font-bold text-white">{managingProduction.coordinator}</div>
                                    <div className="text-slate-500 text-xs">{managingProduction.email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Owner</span>
                                </div>
                            </li>

                            {managingProduction.team?.map((member, idx) => {
                                const isEditing = editingMemberIdx === idx;
                                return (
                                    <li key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        {isEditing ? (
                                             <div className="flex-1 mr-2 grid grid-cols-1 gap-2">
                                                <input 
                                                    value={editMemberValues.name}
                                                    onChange={e => setEditMemberValues({...editMemberValues, name: e.target.value})}
                                                    className="bg-slate-900/50 border border-slate-600 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                                                    placeholder="Name"
                                                />
                                                <input 
                                                    value={editMemberValues.email}
                                                    onChange={e => setEditMemberValues({...editMemberValues, email: e.target.value})}
                                                    className="bg-slate-900/50 border border-slate-600 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                                                    placeholder="Email"
                                                />
                                                <input 
                                                    value={editMemberValues.role}
                                                    onChange={e => setEditMemberValues({...editMemberValues, role: e.target.value})}
                                                    className="bg-slate-900/50 border border-slate-600 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                                                    placeholder="Role"
                                                />
                                             </div>
                                        ) : (
                                            <div>
                                                <div className="font-bold text-white">{member.name}</div>
                                                <div className="text-slate-500 text-xs">{member.email}</div>
                                                <span className="text-[10px] bg-slate-600/30 text-slate-300 px-1.5 py-0.5 rounded mt-1 inline-block">{member.role}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-2 ml-2">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleSaveMember} className="text-green-500 hover:text-green-400 p-1">
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingMemberIdx(null)} className="text-slate-500 hover:text-slate-300 p-1">
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleInviteMember(member.email)} className="text-blue-400 hover:text-blue-300 p-1 bg-blue-500/10 rounded" title={t.invite}>
                                                        <Send size={14} />
                                                    </button>
                                                    <button onClick={() => handleEditMemberStart(idx, member)} className="text-slate-400 hover:text-white p-1" title={t.edit}>
                                                        <Edit2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                         </ul>

                         {/* Add Form */}
                         {(managingProduction.team?.length || 0) < 4 ? (
                             <form onSubmit={handleAddMember} className="space-y-3">
                                <div className="text-xs font-bold text-blue-400 mb-2">{t.addMember}</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        placeholder={t.nameLabel}
                                        value={newMemberName}
                                        onChange={e => setNewMemberName(e.target.value)}
                                        className="bg-slate-900/50 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                        required
                                    />
                                     <input 
                                        placeholder={t.roleLabel}
                                        value={newMemberRole}
                                        onChange={e => setNewMemberRole(e.target.value)}
                                        className="bg-slate-900/50 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="email"
                                        placeholder={t.emailLabel}
                                        value={newMemberEmail}
                                        onChange={e => setNewMemberEmail(e.target.value)}
                                        className="bg-slate-900/50 border border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 flex-1"
                                        required
                                    />
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded text-sm">
                                        {t.add}
                                    </button>
                                </div>
                             </form>
                         ) : (
                             <div className="text-center text-xs text-yellow-500 py-2 border border-yellow-500/20 bg-yellow-500/5 rounded">
                                 {t.maxMembers}
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
