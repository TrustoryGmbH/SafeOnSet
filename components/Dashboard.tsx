
import React, { useRef, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { TRANSLATIONS } from '../constants';
import { Language, Message, ShootDay, Production } from '../types';
import Smiley from './Smiley';
import { generatePosterPDF } from '../services/pdfGenerator';
import { Mail, FileText, Inbox, BarChart2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface DashboardProps {
  lang: Language;
  messages: Message[];
  schedule: ShootDay[];
  onOpenInbox: () => void;
  onOpenHistory: () => void;
  onOpenEmail: () => void;
  productionName: string;
  productionId: string;
  isSandboxMode?: boolean;
  productionStartDate?: string; // Optional: Wann die Produktion aktiviert wurde
}

const Dashboard: React.FC<DashboardProps> = ({ 
  lang, messages, schedule, 
  onOpenInbox, onOpenHistory, onOpenEmail, productionName, productionId, isSandboxMode = false,
  productionStartDate
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

  // Farb-Logik: 100% = Grün, 90-60% = Gelb, <=50% = Rot
  const getColor = (s: number) => {
    if (s >= 100) return '#22c55e'; // Grün
    if (s >= 60) return '#eab308';  // Gelb (1-4 negative Feedbacks)
    return '#ef4444';               // Rot (5+ negative Feedbacks)
  };

  // Hilfsfunktion zur Score-Berechnung: Start 100%, -10% pro negatives Feedback (>0 score)
  const calculateScoreForDate = (dateString: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Sandbox-Modus: Simuliere Historie für Demo-Zwecke
    if (isSandboxMode && dateString !== todayStr) {
        const hash = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const pseudoNegatives = hash % 6; // 0 bis 5
        return Math.max(0, 100 - (pseudoNegatives * 10));
    }

    const dayMessages = messages.filter(m => m.date.split('T')[0] === dateString);
    const negativeCount = dayMessages.filter(m => m.score > 0).length;
    return Math.max(0, 100 - (negativeCount * 10));
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const currentScore = calculateScoreForDate(todayStr);

  const getExplanation = () => {
    if (currentScore >= 100) return { title: t.explTitle100, text: t.explText100, color: 'text-green-500', icon: CheckCircle };
    if (currentScore >= 60) return { title: t.explTitle90, text: t.explText90, color: 'text-yellow-500', icon: AlertCircle };
    return { title: t.explTitle80, text: t.explText80, color: 'text-red-500', icon: AlertCircle };
  };

  const explanation = getExplanation();
  
  const handlePdfSelect = (l: Language) => {
    generatePosterPDF(canvasRef.current, productionName, l);
    setActivePopup('none');
  };

  const getQrUrl = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('prod', productionId);
    return url.toString();
  };

  // Generiere die Liste der Trend-Tage (max 10)
  const getTrendDays = () => {
    const days = [];
    const maxDays = 10;
    
    // In echten Accounts: Wir zählen rückwärts, aber stoppen am Startdatum
    const startLimit = productionStartDate ? new Date(productionStartDate) : new Date();
    if (!productionStartDate && !isSandboxMode) {
        // Falls kein Startdatum da ist, nehmen wir das Datum der ersten Nachricht
        if (messages.length > 0) {
            const sortedMsgs = [...messages].sort((a,b) => a.date.localeCompare(b.date));
            startLimit.setTime(new Date(sortedMsgs[0].date).getTime());
        }
    }

    for (let i = 0; i < maxDays; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        
        // Stopp-Logik für Real-Account
        if (!isSandboxMode && d < startLimit && i > 0) break;

        days.push({
            label: i === 0 ? t.today : `${d.getDate()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.`,
            date: ds,
            score: calculateScoreForDate(ds)
        });
    }
    return days;
  };
  const trendDays = getTrendDays();

  return (
    <div className={`w-full max-w-6xl mx-auto bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] min-h-[550px] ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      
      {/* Left: Live Mood */}
      <div className="p-8 border-r border-white/5 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">{t.hMood}</span>
          <div className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <Smiley score={currentScore} animate={true} size={130} />
          <div className="text-6xl font-black mt-8 text-white tracking-tighter">{currentScore}%</div>
        </div>

        <div className="w-full mt-12 bg-black/20 border border-white/5 rounded-2xl p-4 min-h-[100px]">
           <div className={`flex items-center gap-2 mb-1 ${explanation.color}`}>
             <explanation.icon size={14} strokeWidth={3} />
             <span className="text-[10px] font-black uppercase tracking-wider">{explanation.title}</span>
           </div>
           <p className="text-[11px] text-slate-500 leading-relaxed">{explanation.text}</p>
        </div>
      </div>

      {/* Middle: Trend History (Keine Abteilungen mehr hier!) */}
      <div className="flex flex-col border-r border-white/5">
        <div className="p-8 flex-1">
          <div className="flex items-center gap-2 mb-10">
            <TrendingUp size={14} className="text-slate-500" />
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">{t.hTrend}</span>
          </div>
          
          <div className="space-y-6 overflow-y-auto max-h-[420px] pr-2 custom-scrollbar">
            {trendDays.map((day, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <span className={`text-xs font-bold w-16 transition-colors ${idx === 0 ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`}>{day.label}</span>
                <div className="flex-1 h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${day.score}%`, backgroundColor: getColor(day.score) }}
                  ></div>
                </div>
                <span className="text-[10px] font-black text-slate-400 w-10 text-right tracking-tighter">{day.score}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-white/5 grid grid-cols-2 gap-4 bg-black/10">
           <button onClick={onOpenInbox} className="h-14 bg-slate-800/50 hover:bg-slate-800 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all group">
             <Inbox size={18} className="text-slate-400 group-hover:text-rose-400" />
             {t.inbox}
           </button>
           <button onClick={onOpenHistory} className="h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all shadow-lg shadow-blue-900/20">
             <BarChart2 size={18} />
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
