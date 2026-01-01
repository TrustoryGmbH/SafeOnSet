
import React, { useRef, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { TRANSLATIONS } from '../constants';
import { Language, Message, ShootDay } from '../types';
import Smiley from './Smiley';
import { generatePosterPDF } from '../services/pdfGenerator';
import { Mail, FileText, Inbox, BarChart2, TrendingUp, AlertCircle, CheckCircle, Activity } from 'lucide-react';

interface DashboardProps {
  lang: Language;
  score: number;
  messages: Message[];
  schedule: ShootDay[];
  onOpenInbox: () => void;
  onOpenHistory: () => void;
  onOpenEmail: () => void;
  productionName: string;
  productionId: string; // Neu für QR-Code Link
}

const Dashboard: React.FC<DashboardProps> = ({ 
  lang, score, messages, schedule, 
  onOpenInbox, onOpenHistory, onOpenEmail, productionName, productionId
}) => {
  const t = TRANSLATIONS[lang];
  const qrRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [showBars, setShowBars] = useState(false);
  const [activePopup, setActivePopup] = useState<'none' | 'pdf' | 'email'>('none');

  useEffect(() => {
    if (qrRef.current) {
        const canvas = qrRef.current.querySelector('canvas');
        if (canvas) canvasRef.current = canvas;
    }
    const timer = setTimeout(() => setShowBars(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const getColor = (s: number) => {
    if (s >= 90) return '#22c55e'; 
    if (s >= 60) return '#eab308'; 
    return '#ef4444'; 
  };

  const getDeptStatus = () => {
    const counts: Record<string, number> = {};
    messages.filter(m => !m.resolved).forEach(m => {
      if (m.department) counts[m.department] = (counts[m.department] || 0) + 1;
    });
    return counts;
  };
  const deptCounts = getDeptStatus();

  const getExplanation = () => {
    if (score === 100) return { title: t.explTitle100, text: t.explText100, color: 'text-green-400', icon: CheckCircle };
    if (score >= 90) return { title: t.explTitle90, text: t.explText90, color: 'text-yellow-400', icon: AlertCircle };
    return { title: t.explTitle80, text: t.explText80, color: 'text-red-400', icon: AlertCircle };
  };

  const explanation = getExplanation();
  const Icon = explanation.icon;

  const handlePdfSelect = (l: Language) => {
    generatePosterPDF(canvasRef.current, productionName, l);
    setActivePopup('none');
  };

  // Dynamische URL für den QR-Code
  const qrUrl = `${window.location.origin}${window.location.pathname}?prod=${productionId}`;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-0 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-6xl mx-auto h-[550px] relative overflow-hidden ring-1 ring-white/5 ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      
      {/* Left: Live Mood */}
      <div className={`flex flex-col h-full bg-gradient-to-b from-white/5 to-transparent ${lang === 'ar' ? 'border-l' : 'border-r'} border-white/5 relative group overflow-hidden`}>
        <div className="pt-6 px-6 pb-2 text-center relative z-10">
             <div className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                {t.hMood}
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
             </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="relative z-10 scale-100 transition-transform duration-500 hover:scale-105 animate-float">
            <Smiley score={score} animate={true} size={110} />
          </div>
          <div className="text-5xl font-black mt-6 text-white leading-none tracking-tight drop-shadow-lg animate-fade-in relative">
            {score}%
          </div>
        </div>
        
        <div className="p-5 relative z-10">
           <div className={`bg-slate-950/50 backdrop-blur-md p-3.5 rounded-xl border border-white/5 transition-all duration-300 hover:border-white/10 hover:translate-y-[-2px]`}>
              <div className={`flex items-center gap-2 mb-1.5 ${explanation.color}`}>
                 <Icon size={14} strokeWidth={3} />
                 <span className="text-[11px] font-bold uppercase tracking-wide">{explanation.title.replace('Status: ', '')}</span>
              </div>
              <span className="text-slate-400 text-[11px] leading-snug block">{explanation.text}</span>
           </div>
        </div>
      </div>

      {/* Middle: Trend & Dept Insights */}
      <div className="flex flex-col h-full bg-slate-900/20">
        <div className="pt-6 px-6 pb-4 flex justify-between items-end border-b border-white/5">
             <div className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase flex items-center gap-2">
                <TrendingUp size={12} />
                {t.hTrend}
             </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden p-6 pt-2">
          {/* Trend Bars */}
          <ul className="flex flex-col gap-1 mb-6">
            {schedule.slice(0, 5).map((item, idx) => {
              const dayScore = idx === 0 ? score : 100 - (idx * 5);
              const barColor = getColor(dayScore);
              const isToday = idx === 0;
              return (
                <li key={idx} className={`flex items-center justify-between p-2 rounded-lg ${isToday ? 'bg-white/5' : ''}`}>
                   <span className="text-xs text-slate-400 w-16">{isToday ? t.today : `${t.day} ${item.day}`}</span>
                   <div className="flex-1 h-1.5 bg-slate-800 rounded-full mx-4 overflow-hidden border border-white/5">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${dayScore}%`, backgroundColor: barColor }} />
                   </div>
                   <span className="text-xs font-bold w-8 text-right text-slate-500">{dayScore}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto border-t border-white/5 pt-4">
             <div className="text-[10px] font-black tracking-[3px] text-slate-600 uppercase mb-4 flex items-center gap-2">
                <Activity size={12} />
                {t.deptInsights}
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(t.depts).slice(0, 8).map(([key, label]) => {
                  const count = deptCounts[label] || 0;
                  return (
                    <div key={key} className={`p-2.5 rounded-xl border transition-all duration-300 ${count > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5 opacity-40'}`}>
                       <div className="text-[9px] text-slate-500 font-bold truncate mb-1">{label}</div>
                       <div className={`text-sm font-black ${count > 0 ? 'text-red-500' : 'text-slate-400'}`}>{count}</div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 grid grid-cols-2 gap-3 bg-white/[0.02]">
           <button onClick={onOpenInbox} className="flex items-center justify-center gap-2 h-10 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 text-slate-300 rounded-lg hover:text-red-400 transition-all text-xs font-bold group shadow-lg">
             <div className="relative"><Inbox size={14} />{messages.filter(m => !m.resolved).length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}</div>
             {t.inbox}
           </button>
           <button onClick={onOpenHistory} className="flex items-center justify-center gap-2 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg hover:brightness-110 transition-all text-xs font-bold shadow-lg">
             <BarChart2 size={14} /> {t.viewStats}
           </button>
        </div>
      </div>

      {/* Right: Access */}
      <div className={`flex flex-col h-full bg-gradient-to-b from-white/5 to-transparent ${lang === 'ar' ? 'border-r' : 'border-l'} border-white/5`}>
        <div className="pt-6 px-6 pb-2 text-center">
             <div className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase">{t.hAccess}</div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="bg-white p-4 pb-2 rounded-2xl shadow-xl transition-transform hover:scale-105" ref={qrRef}>
            <QRCodeCanvas value={qrUrl} size={130} level={"H"} bgColor="#FFFFFF" fgColor="#0f172a" />
            <div className="mt-2 text-center text-[9px] font-bold text-slate-400 tracking-widest uppercase">Scan Me</div>
          </div>
        </div>
        
        <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActivePopup('pdf')} className="w-full flex flex-col items-center justify-center gap-1 h-14 bg-slate-800/50 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-wider relative">
                    <FileText size={16} /> {t.pdf}
                    {activePopup === 'pdf' && (
                        <div className="absolute bottom-full mb-2 left-0 w-full bg-slate-800 rounded-lg p-1 border border-white/10 shadow-2xl z-50">
                            {(['en', 'de', 'ar'] as Language[]).map(l => (
                                <div key={l} onClick={(e) => { e.stopPropagation(); handlePdfSelect(l); }} className="p-2 hover:bg-blue-600 rounded text-[10px] uppercase text-center">{l}</div>
                            ))}
                        </div>
                    )}
                </button>
                <button onClick={onOpenEmail} className="w-full flex flex-col items-center justify-center gap-1 h-14 bg-slate-800/50 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-wider">
                    <Mail size={16} /> {t.email}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
