
import React, { useRef, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { TRANSLATIONS } from '../constants';
import { Language, Message, ShootDay } from '../types';
import Smiley from './Smiley';
import { generatePosterPDF } from '../services/pdfGenerator';
import { Mail, FileText, Inbox, BarChart2, TrendingUp, AlertCircle, CheckCircle, ChevronUp } from 'lucide-react';

interface DashboardProps {
  lang: Language;
  score: number;
  messages: Message[];
  schedule: ShootDay[];
  onOpenInbox: () => void;
  onOpenHistory: () => void;
  onOpenEmail: () => void;
  productionName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  lang, score, messages, schedule, 
  onOpenInbox, onOpenHistory, onOpenEmail, productionName 
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

  const getExplanation = () => {
    if (score === 100) return { title: t.explTitle100, text: t.explText100, color: 'text-green-400', icon: CheckCircle };
    if (score >= 90) return { title: t.explTitle90, text: t.explText90, color: 'text-yellow-400', icon: AlertCircle };
    return { title: t.explTitle80, text: t.explText80, color: 'text-red-400', icon: AlertCircle };
  };

  const explanation = getExplanation();
  const Icon = explanation.icon;

  const sortedSchedule = [...schedule].sort((a, b) => b.day - a.day).slice(0, 7);

  const handlePdfSelect = (l: Language) => {
    generatePosterPDF(canvasRef.current, productionName, l);
    setActivePopup('none');
  };

  const handleEmailSelect = (l: Language) => {
    onOpenEmail(); 
    setActivePopup('none');
  };

  const LanguageMenu = ({ onSelect }: { onSelect: (l: Language) => void }) => (
    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-32 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950/30 p-2 text-center border-b border-white/5 tracking-wider">
            Language
        </div>
        {(['en', 'de', 'ar'] as Language[]).map(l => (
            <button 
            key={l}
            onClick={(e) => { e.stopPropagation(); onSelect(l); }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
            >
            <span className="text-base leading-none">{l === 'en' ? '🇬🇧' : l === 'de' ? '🇩🇪' : '🇸🇦'}</span>
            <span className="uppercase tracking-wide">{l}</span>
            </button>
        ))}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
    </div>
  );

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-0 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-6xl mx-auto h-[500px] relative overflow-hidden ring-1 ring-white/5 ${lang === 'ar' ? 'font-tajawal' : 'font-sans'}`} dir={t.dir}>
      
      <div className={`flex flex-col h-full bg-gradient-to-b from-white/5 to-transparent ${lang === 'ar' ? 'border-l' : 'border-r'} border-white/5 relative group overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[80px] animate-pulse-slow pointer-events-none"></div>

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
            <div className="absolute top-full left-0 w-full text-5xl font-black text-white/5 blur-sm scale-y-[-0.5] pointer-events-none select-none">
                {score}%
            </div>
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

      <div className="flex flex-col h-full bg-slate-900/20">
        <div className="pt-6 px-6 pb-4 flex justify-between items-end border-b border-white/5">
             <div className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase flex items-center gap-2">
                <TrendingUp size={12} />
                {t.hTrend}
             </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden p-6 pt-2">
          <div className="flex justify-between px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
             <span>Period</span>
             <span>Status</span>
          </div>
          
          <ul className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
            {sortedSchedule.map((item, idx) => {
              let dayScore = 100;
              if (item.day === 23) dayScore = 100;
              if (item.day === 22) dayScore = 92;
              if (item.day === 19) dayScore = 85;
              if (idx === 0) dayScore = score; 

              const barColor = getColor(dayScore);
              const isToday = idx === 0;

              return (
                <li key={item.day} className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${isToday ? 'bg-white/5 border border-white/5' : 'hover:bg-white/[0.02]'}`}>
                   <div className="flex flex-col">
                       <span className={`text-xs font-medium ${isToday ? 'text-white' : 'text-slate-400'}`}>
                         {isToday ? t.today : `${t.day} ${item.day}`}
                       </span>
                       {isToday && <span className="text-[9px] text-slate-500 uppercase tracking-wider">{item.date}</span>}
                   </div>

                   <div className="flex items-center gap-4 w-1/2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
                        <div 
                          className={`h-full rounded-full relative transition-all duration-[1500ms] ease-out shadow-[0_0_10px_currentColor] overflow-hidden ${isToday ? 'animate-pulse' : ''}`} 
                          style={{ 
                              width: showBars ? `${dayScore}%` : '0%', 
                              backgroundColor: barColor, 
                              color: barColor,
                              transitionDelay: `${idx * 100}ms`
                          }}
                        >
                             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-slide transform -skew-x-12" />
                        </div>
                      </div>
                      <span className={`w-8 text-right font-mono text-xs font-bold ${isToday ? 'text-white' : 'text-slate-500'}`}>{dayScore}</span>
                   </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 border-t border-white/5 grid grid-cols-2 gap-3 bg-white/[0.02]">
           <button 
             onClick={onOpenInbox}
             className="flex items-center justify-center gap-2 h-10 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 text-slate-300 rounded-lg hover:border-red-500/50 hover:text-red-400 transition-all text-xs font-bold group shadow-lg active:scale-95"
           >
             <div className="relative">
                <Inbox size={14} />
                {messages.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
             </div>
             {t.inbox}
           </button>
           <button 
             onClick={onOpenHistory}
             className="flex items-center justify-center gap-2 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg hover:brightness-110 transition-all text-xs font-bold shadow-lg shadow-blue-900/20 active:scale-95"
           >
             <BarChart2 size={14} />
             {t.viewStats}
           </button>
        </div>
      </div>

      <div className={`flex flex-col h-full bg-gradient-to-b from-white/5 to-transparent ${lang === 'ar' ? 'border-r' : 'border-l'} border-white/5`}>
        <div className="pt-6 px-6 pb-2 text-center">
             <div className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase flex items-center justify-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                {t.hAccess}
                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
             </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="bg-white p-4 pb-2 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 duration-300" ref={qrRef}>
            <QRCodeCanvas 
                value="https://safe-on-set.com" 
                size={130}
                level={"H"}
                bgColor="#FFFFFF"
                fgColor="#0f172a"
            />
            <div className="mt-2 text-center text-[9px] font-bold text-slate-400 tracking-widest uppercase">Scan Me</div>
          </div>
        </div>
        
        <div className="p-5">
            <div className="grid grid-cols-2 gap-3" onClick={() => activePopup !== 'none' && setActivePopup('none')}>
                <div className="relative">
                    {activePopup === 'pdf' && <LanguageMenu onSelect={handlePdfSelect} />}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActivePopup(activePopup === 'pdf' ? 'none' : 'pdf'); }}
                        className={`w-full flex flex-col items-center justify-center gap-1 h-14 bg-slate-800/50 border ${activePopup === 'pdf' ? 'border-blue-500 ring-1 ring-blue-500 bg-slate-800' : 'border-white/10'} text-slate-300 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider group relative`}
                    >
                        {activePopup === 'pdf' ? <ChevronUp size={16} className="text-blue-500" /> : <FileText size={16} className="opacity-70 group-hover:opacity-100" />}
                        {t.pdf}
                    </button>
                </div>

                <div className="relative">
                    {activePopup === 'email' && <LanguageMenu onSelect={handleEmailSelect} />}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActivePopup(activePopup === 'email' ? 'none' : 'email'); }}
                        className={`w-full flex flex-col items-center justify-center gap-1 h-14 bg-slate-800/50 border ${activePopup === 'email' ? 'border-blue-500 ring-1 ring-blue-500 bg-slate-800' : 'border-white/10'} text-slate-300 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider group`}
                    >
                        {activePopup === 'email' ? <ChevronUp size={16} className="text-blue-500" /> : <Mail size={16} className="opacity-70 group-hover:opacity-100" />}
                        {t.email}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
