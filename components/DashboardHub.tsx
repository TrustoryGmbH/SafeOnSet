import React from 'react';
import { Language, Production } from '../types';
import { TRANSLATIONS } from '../constants';
import { Building, ArrowRight, LogOut, Shield, User, Clock, CheckCircle, MessageSquare, AlertCircle, Plus } from 'lucide-react';

interface DashboardHubProps {
  lang: Language;
  email: string;
  productions: Production[];
  onSelectProduction: (id: string) => void;
  onLogout: () => void;
  onRegisterClick: () => void;
  messages: any[];
}

const LOCAL_TRANS: Record<Language, any> = {
  de: {
    title: "Deine Produktionen",
    subtitle: "Wähle ein Projekt aus, um das Sicherheits-Dashboard zu verwalten",
    noProds: "Keine Produktionen für diese E-Mail-Adresse gefunden.",
    roleCoordinator: "Haupt-Verwalter",
    roleCoAdmin: "Co-Admin",
    roleTeam: "Teammitglied",
    messagesCount: "Meldungen",
    enter: "Dashboard öffnen",
    requestAccess: "Neue Produktion anlegen",
    welcome: "Willkommen zurück",
  },
  en: {
    title: "Your Productions",
    subtitle: "Select a project to manage its safety dashboard",
    noProds: "No productions found for this email address.",
    roleCoordinator: "Primary Coordinator",
    roleCoAdmin: "Co-Admin",
    roleTeam: "Team Member",
    messagesCount: "Reports",
    enter: "Open Dashboard",
    requestAccess: "Create New Production",
    welcome: "Welcome Back",
  },
  ar: {
    title: "إنتاجاتك",
    subtitle: "اختر مشروعًا لإدارة لوحة معلومات السلامة الخاصة به",
    noProds: "لم يتم العثور على أي إنتاجات لعنوان البريد الإلكتروني dieses.",
    roleCoordinator: "المنسق الرئيسي",
    roleCoAdmin: "مسؤول مساعد",
    roleTeam: "عضو الفريق",
    messagesCount: "بلاغات",
    enter: "افتح لوحة التحكم",
    requestAccess: "إنشاء إنتاج جديد",
    welcome: "مرحباً بك مجدداً",
  }
};

const DashboardHub: React.FC<DashboardHubProps> = ({
  lang,
  email,
  productions,
  onSelectProduction,
  onLogout,
  onRegisterClick,
  messages
}) => {
  const t = TRANSLATIONS[lang];
  const lh = LOCAL_TRANS[lang] || LOCAL_TRANS['de'];

  // Filter productions for this user
  const userProductions = productions.filter(p => 
    p.email?.toLowerCase() === email.toLowerCase() || 
    p.team?.some((m: any) => m.email?.toLowerCase() === email.toLowerCase()) || 
    p.co_admins?.some((ca: any) => ca.email?.toLowerCase() === email.toLowerCase())
  );

  const getUserRole = (prod: Production) => {
    if (prod.email?.toLowerCase() === email.toLowerCase()) return lh.roleCoordinator;
    if (prod.co_admins?.some((ca: any) => ca.email?.toLowerCase() === email.toLowerCase())) return lh.roleCoAdmin;
    return lh.roleTeam;
  };

  const getMessageCountForProd = (prodId: string) => {
    return messages.filter(m => m.production_id === prodId).length;
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-white flex flex-col relative overflow-hidden font-sans">
      {/* Cinematic Glowing Background overlays */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-900/50">T</div>
          <span className="font-bold text-xl tracking-tight">Trustory <span className="text-blue-500 opacity-50 ml-1 font-black text-xs uppercase tracking-widest">Safe on Set</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{lh.welcome}</span>
            <span className="text-xs text-slate-300 font-medium">{email}</span>
          </div>
          <button 
            onClick={onLogout} 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/5"
          >
            <LogOut size={14} />
            <span>{t.logout}</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 py-16 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
              {lh.title}
            </h1>
            <p className="text-slate-400 text-sm font-medium">{lh.subtitle}</p>
          </div>
          <button 
            onClick={onRegisterClick}
            className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/40 hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <Plus size={16} /> {lh.requestAccess}
          </button>
        </div>

        {userProductions.length === 0 ? (
          <div className="flex-1 bg-slate-900/30 border border-white/5 rounded-[32px] p-12 text-center flex flex-col items-center justify-center backdrop-blur-xl">
            <div className="w-16 h-16 bg-slate-800/40 rounded-2xl flex items-center justify-center text-slate-500 mb-6 border border-white/10">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-2">{lh.noProds}</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-8">Falls du ein Projekt erwartest, stelle bitte sicher, dass dein Koordinator dich mit dieser E-Mail-Adresse ({email}) eingetragen hat.</p>
            <button 
              onClick={onRegisterClick}
              className="py-3 px-6 bg-slate-800 text-white rounded-xl text-xs font-bold border border-white/10 hover:bg-slate-700 transition-colors"
            >
              Neue Produktion anfordern
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userProductions.map(prod => {
              const role = getUserRole(prod);
              const messageCount = getMessageCountForProd(prod.id);
              const isActive = prod.status === 'Active' || prod.status === 'Invited';

              return (
                <div 
                  key={prod.id}
                  onClick={() => onSelectProduction(prod.id)}
                  className="group relative bg-slate-900/40 hover:bg-slate-900/70 border border-white/5 hover:border-blue-500/30 rounded-[28px] p-6 backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_20px_40px_rgba(59,130,246,0.05)] flex flex-col justify-between min-h-[220px]"
                >
                  {/* Neon Glow effect on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 rounded-[28px] transition-opacity duration-300 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-md">
                        {role}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {prod.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {prod.name}
                    </h3>
                    
                    <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                      <span className="font-medium text-slate-400">{prod.coordinator}</span>
                      <span>{prod.email}</span>
                    </div>
                  </div>

                  <div className="relative z-10 pt-6 border-t border-white/5 mt-6 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-slate-500" />
                        <span>{messageCount} {lh.messagesCount}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform duration-300">
                      {lh.enter} <ArrowRight size={12} strokeWidth={3} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest relative z-10">
        Safe on Set © 2026 • Trustory GmbH
      </footer>
    </div>
  );
};

export default DashboardHub;
