
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
  productionId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  lang, score, messages, schedule, 
  onOpenInbox, onOpenHistory, onOpenEmail, productionName, productionId
}) => {
  const t = TRANSLATIONS[lang];
  const qrRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePopup, setActivePopup] = useState<'none' | 'pdf'>('none');

  useEffect(() => {
    if (qrRef.current) {
        const canvas = qrRef.current.querySelector('canvas');
        if (canvas) canvasRef.current = canvas;
    }
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
    if (score === 100) return { title: t.explTitle100, text: t.explText100, color: 'text-green-500', icon: CheckCircle };
    if (score >= 90) return { title: t.explTitle90, text: t.explText90, color: 'text-yellow-500', icon: AlertCircle };
    return { title: t.explTitle80, text: t.explText80, color: 'text-red-500', icon: AlertCircle };
  };

  const explanation = getExplanation();
  
  const handlePdfSelect = (l: Language) => {
    generatePosterPDF(canvasRef.current, productionName, l);
    setActivePopup('none');
  };

  // Dynamische URL Generierung für den QR Code
  const getQrUrl = () => {
    // Verwendet die aktuelle Domain der App
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('prod', productionId);
    return url.toString();
  };

  return (
    <div className={`w-full max-w-6xl mx-auto bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] min-h-[500px] ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      
      {/* Left: Live Mood */}
      <div className="p-8 border-r border-white/5 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">{t.hMood}</span>
          <div className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <Smiley score={score} animate={true} size={130} />
          <div className="text-6xl font-black mt-8 text-white tracking-tighter">{score}%</div>
        </div>

        <div className="w-full mt-12 bg-black/20 border border-white/5 rounded-2xl p-4">
           <div className={`flex items-center gap-2 mb-1 ${explanation.color}`}>
             <explanation.icon size={14} strokeWidth={3} />
             <span className="text-[10px] font-black uppercase tracking-wider">{explanation.title}</span>
           </div>
           <p className="text-[11px] text-slate-500 leading-relaxed">{explanation.text}</p>
        </div>
      </div>

      {/* Middle: History & Insights */}
      <div className="flex flex-col border-r border-white/5">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp size={14} className="text-slate-500" />
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">{t.hTrend}</span>
          </div>
          
          <div className="space-y-4 mb-12">
            {schedule.slice(0, 3).map((day, idx) => {
              // Simulierter Trendverlauf für die Historie
              const dayScore = idx === 0 ? score : Math.min(100, score + (idx * 2));
              return (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400 w-16">{idx === 0 ? t.today : `${t.day} ${day.day}`}</span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${dayScore}%`, backgroundColor: getColor(dayScore) }}></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 w-8 text-right">{dayScore}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-8 border-t border-white/5">
             <div className="flex items-center gap-2 mb-6">
                <Activity size={14} className="text-slate-500" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">{t.deptInsights}</span>
             </div>
             <div className="grid grid-cols-4 gap-3">
                {(Object.entries(t.depts) as [string, string][]).slice(0, 8).map(([key, label]) => {
                  const count = deptCounts[label] || 0;
                  return (
                    <div key={key} className={`p-3 rounded-xl border ${count > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                      <div className="text-[9px] font-bold text-slate-500 truncate mb-1 uppercase tracking-tight">{label}</div>
                      <div className={`text-base font-black ${count > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{count}</div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-white/5 grid grid-cols-2 gap-4 bg-black/10">
           <button onClick={onOpenInbox} className="h-12 bg-slate-800/50 hover:bg-slate-800 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all group">
             <Inbox size={16} className="text-slate-400 group-hover:text-rose-400" />
             {t.inbox}
           </button>
           <button onClick={onOpenHistory} className="h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-lg shadow-blue-900/20">
             <BarChart2 size={16} />
             {t.viewStats}
           </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="p-8 flex flex-col items-center">
        <div className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-12">{t.hAccess}</div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-2xl transition-transform hover:scale-105" ref={qrRef}>
            <QRCodeCanvas value={getQrUrl()} size={140} level="H" includeMargin={false} />
            <div className="mt-2 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Scan Me</div>
          </div>
        </div>

        <div className="w-full mt-12 grid grid-cols-2 gap-3">
            <div className="relative">
              <button onClick={() => setActivePopup(activePopup === 'pdf' ? 'none' : 'pdf')} className="w-full h-12 bg-slate-800/50 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/5 transition-all">
                <FileText size={16} className="text-slate-400" />
                <span className="text-[8px] font-black uppercase tracking-widest">{t.pdf}</span>
              </button>
              {activePopup === 'pdf' && (
                <div className="absolute bottom-full mb-2 left-0 w-full bg-slate-800 border border-white/10 rounded-xl p-1 shadow-2xl z-50">
                  {['en', 'de', 'ar'].map((l) => (
                    <button key={l} onClick={() => handlePdfSelect(l as Language)} className="w-full py-2 hover:bg-blue-600 rounded-lg text-[10px] font-bold uppercase">{l}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onOpenEmail} className="h-12 bg-slate-800/50 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/5 transition-all">
              <Mail size={16} className="text-slate-400" />
              <span className="text-[8px] font-black uppercase tracking-widest">{t.email}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
