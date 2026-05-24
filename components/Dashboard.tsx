
import React, { useRef, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { TRANSLATIONS } from '../constants';
import { Language, Message, ShootDay, Production } from '../types';
import Smiley from './Smiley';
import { generatePosterPDF } from '../services/pdfGenerator';
import { 
  Mail, FileText, Inbox, BarChart2, TrendingUp, AlertCircle, CheckCircle, 
  AlertTriangle, X, Filter, Check, ShieldCheck, MessageSquare, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { supabase } from '../services/supabase';

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

const LOCAL_TRANS: Record<Language, any> = {
  de: {
    inboxTitleFull: "Sicherheits-Feedback & Vorfälle",
    inboxSubtitle: "Meldungen und Stimmen am Filmset in Echtzeit",
    filterAll: "Alle Stimmen",
    filterOpen: "Offene Vorfälle",
    filterResolved: "Erledigte Fälle",
    filterNegative: "Nur negative Vorfälle anzeigen",
    positiveDay: "Positiver Drehtag 😊",
    negativeDay: "Kritischer Vorfall 😓",
    noText: "Kein schriftlicher Kommentar (Einfache positive Stimme)",
    markResolved: "Als erledigt markieren",
    markOpen: "Als offen markieren",
    emptyState: "Keine Feedback-Meldungen für diese Filter-Auswahl.",
    historyTitle: "Statistiken & Drehtag-Historie",
    historySubtitle: "Tägliche Auswertung der Stimmung und Vorfälle",
    dayScore: "Tagesscore",
    allPositive: "Ausschließlich positives Feedback",
    incidentsReported: "kritische Meldung(en)",
    anonymous: "Anonym",
    resolvedPill: "Erledigt",
    openPill: "Offen",
    showComments: "Kommentare anzeigen",
    hideComments: "Kommentare ausblenden",
    noCritOnDay: "Keine kritischen Meldungen an diesem Tag."
  },
  en: {
    inboxTitleFull: "Safety Feedback & Incidents",
    inboxSubtitle: "Real-time crew feedback and reports",
    filterAll: "All Feedback",
    filterOpen: "Open Incidents",
    filterResolved: "Resolved Cases",
    filterNegative: "Only show negative incidents",
    positiveDay: "Positive Shooting Day 😊",
    negativeDay: "Critical Incident 😓",
    noText: "No written comment (Simple positive vote)",
    markResolved: "Mark as Resolved",
    markOpen: "Mark as Open",
    emptyState: "No feedback matching this filter selection.",
    historyTitle: "Statistics & Shooting History",
    historySubtitle: "Daily analysis of moods and reported incidents",
    dayScore: "Day Score",
    allPositive: "100% positive feedback",
    incidentsReported: "critical report(s)",
    anonymous: "Anonymous",
    resolvedPill: "Resolved",
    openPill: "Open",
    showComments: "Show comments",
    hideComments: "Hide comments",
    noCritOnDay: "No critical reports on this day."
  },
  ar: {
    inboxTitleFull: "ملاحظات السلامة والحوادث",
    inboxSubtitle: "آراء الطاقم وتقاريرهم في الوقت الفعلي",
    filterAll: "كل الآراء",
    filterOpen: "الحوادث المفتوحة",
    filterResolved: "الحالات المحلولة",
    filterNegative: "إظهار الحوادث السلبية فقط",
    positiveDay: "يوم تصوير إيجابي 😊",
    negativeDay: "حادث حرج 😓",
    noText: "لا توجد تعليقات مكتوبة (تصويت بسيط)",
    markResolved: "تحديد كمحلول",
    markOpen: "تحديد كمفتوح",
    emptyState: "لا توجد تعليقات تطابق هذا التصفية.",
    historyTitle: "الإحصائيات وتاريخ التصوير",
    historySubtitle: "التحليل اليومي للمزاج والحوادث المبلغ عنها",
    dayScore: "نتيجة اليوم",
    allPositive: "تعليقات إيجابية بنسبة 100٪",
    incidentsReported: "تقرير/تقارير حرجة",
    anonymous: "مجهول",
    resolvedPill: "محلول",
    openPill: "مفتوح",
    showComments: "عرض التعليقات",
    hideComments: "إخفاء التعليقات",
    noCritOnDay: "لا توجد تقارير حرجة في هذا اليوم."
  }
};

const Dashboard: React.FC<DashboardProps> = ({ 
  lang, messages, schedule, 
  onOpenInbox, onOpenHistory, onOpenEmail, productionName, productionId, isSandboxMode = false,
  productionStartDate
}) => {
  const t = TRANSLATIONS[lang];
  const lt = LOCAL_TRANS[lang] || LOCAL_TRANS['de'];
  const qrRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePopup, setActivePopup] = useState<'none' | 'pdf'>('none');

  // Modals inside state
  const [activeModal, setActiveModal] = useState<'none' | 'inbox' | 'history'>('none');
  const [inboxFilter, setInboxFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [showOnlyNegative, setShowOnlyNegative] = useState<boolean>(true); // Startet direkt mit Fokus auf negative Feedbacks wie gewünscht
  
  // Local synchronized message list for responsive resolve state adjustment
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

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

    const dayMessages = localMessages.filter(m => m.date.split('T')[0] === dateString);
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
        if (localMessages.length > 0) {
            const sortedMsgs = [...localMessages].sort((a,b) => a.date.localeCompare(b.date));
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

  // Toggle feedback resolution status live
  const handleToggleResolve = async (msgId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic UI update
    setLocalMessages(prev => prev.map(m => m.id === msgId ? { ...m, resolved: nextStatus } : m));
    
    if (!isSandboxMode) {
      try {
        const { error } = await supabase
          .from('messages')
          .update({ resolved: nextStatus })
          .eq('id', msgId);
        if (error) throw error;
      } catch (err) {
        console.error("Error toggling resolve:", err);
        // Revert
        setLocalMessages(prev => prev.map(m => m.id === msgId ? { ...m, resolved: currentStatus } : m));
      }
    }
  };

  const toggleDayExpansion = (dayDate: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayDate]: !prev[dayDate]
    }));
  };

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

      {/* Middle: Trend History */}
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
           <button 
             onClick={() => { onOpenInbox(); setActiveModal('inbox'); }} 
             className="h-14 bg-slate-800/50 hover:bg-slate-800 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all group"
           >
             <Inbox size={18} className="text-slate-400 group-hover:text-rose-400" />
             {t.inbox}
             {localMessages.filter(m => m.score > 0 && !m.resolved).length > 0 && (
               <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                 {localMessages.filter(m => m.score > 0 && !m.resolved).length}
               </span>
             )}
           </button>
           <button 
             onClick={() => { onOpenHistory(); setActiveModal('history'); }} 
             className="h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
           >
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

      {/* ================= INBOX MODAL ================= */}
      {activeModal === 'inbox' && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-[24px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-slate-950/20">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Inbox className="text-blue-400" size={20} />
                  {lt.inboxTitleFull}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{lt.inboxSubtitle}</p>
              </div>
              <button 
                onClick={() => setActiveModal('none')}
                className="p-1 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs & Toggle */}
            <div className="p-5 border-b border-white/5 bg-slate-950/10 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(['all', 'open', 'resolved'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setInboxFilter(f)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      inboxFilter === f 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {f === 'all' && lt.filterAll}
                    {f === 'open' && lt.filterOpen}
                    {f === 'resolved' && lt.filterResolved}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input 
                  type="checkbox" 
                  id="neg-only-switch"
                  checked={showOnlyNegative}
                  onChange={(e) => setShowOnlyNegative(e.target.checked)}
                  className="rounded border-white/10 bg-black/20 text-rose-500 focus:ring-rose-500/50 cursor-pointer w-4 h-4"
                />
                <label htmlFor="neg-only-switch" className="text-xs text-slate-300 font-bold select-none cursor-pointer hover:text-white transition-colors flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-400" />
                  {lt.filterNegative}
                </label>
              </div>
            </div>

            {/* Feedback Scroll Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {(() => {
                const filtered = localMessages.filter(m => {
                  // Apply resolution filter
                  if (inboxFilter === 'open' && m.resolved) return false;
                  if (inboxFilter === 'resolved' && !m.resolved) return false;
                  // Apply negativity filter (score > 0 is negative)
                  if (showOnlyNegative && m.score === 0) return false;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-16 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-800/30 flex items-center justify-center mb-4 border border-white/5">
                        <SmileCheck size={24} className="text-slate-500" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">{lt.emptyState}</p>
                    </div>
                  );
                }

                return filtered.map((m) => {
                  const isNeg = m.score > 0;
                  const dateFormatted = new Date(m.date).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <div 
                      key={m.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        isNeg 
                          ? m.resolved 
                            ? 'bg-slate-900/30 border-white/5 opacity-60'
                            : 'bg-rose-950/5 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.03)]'
                          : 'bg-emerald-950/5 border-emerald-500/10'
                      }`}
                    >
                      {/* Top Header Row within Card */}
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            {isNeg ? (
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 ${
                                m.resolved ? 'bg-slate-800 text-slate-400 border border-white/5' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                <AlertCircle size={10} />
                                {lt.negativeDay}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle size={10} />
                                {lt.positiveDay}
                              </span>
                            )}

                            {m.department && (
                              <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded border border-white/5 uppercase">
                                {m.department}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <Clock size={10} />
                            {dateFormatted}
                          </div>
                        </div>

                        {/* Status Pin */}
                        {isNeg && (
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            m.resolved 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                          }`}>
                            {m.resolved ? lt.resolvedPill : lt.openPill}
                          </span>
                        )}
                      </div>

                      {/* Comment Message */}
                      <p className={`text-sm leading-relaxed my-3 font-medium ${
                        isNeg ? 'text-slate-100 italic' : 'text-slate-300'
                      }`}>
                        {m.text ? `"${m.text}"` : <span className="text-slate-500 italic text-xs">{lt.noText}</span>}
                      </p>

                      {/* Contact & Resolve Control Footer */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
                        <div className="text-xs text-slate-500">
                          {t.compContact}: <span className="text-slate-300 font-bold">{m.contact || lt.anonymous}</span>
                        </div>

                        {isNeg && (
                          <button
                            onClick={() => handleToggleResolve(m.id, !!m.resolved)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                              m.resolved 
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5' 
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
                            }`}
                          >
                            <Check size={12} strokeWidth={3} />
                            {m.resolved ? lt.markOpen : lt.markResolved}
                          </button>
                        )}
                      </div>

                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-950/20 text-center text-[10px] text-slate-500">
              Safe on Set • {lt.inboxTitleFull}
            </div>

          </div>
        </div>
      )}

      {/* ================= STATS / HISTORY MODAL ================= */}
      {activeModal === 'history' && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-[24px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-slate-950/20">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <BarChart2 className="text-blue-400" size={20} />
                  {lt.historyTitle}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{lt.historySubtitle}</p>
              </div>
              <button 
                onClick={() => setActiveModal('none')}
                className="p-1 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Bar */}
            <div className="p-5 border-b border-white/5 bg-slate-950/10 grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <Smiley score={currentScore} size={48} />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.currentScore}</div>
                  <div className="text-2xl font-black text-white">{currentScore}%</div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500/10 rounded-full border border-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="text-rose-400 font-bold" size={22} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aktive Vorfälle</div>
                  <div className="text-2xl font-black text-rose-400">{localMessages.filter(m => m.score > 0 && !m.resolved).length}</div>
                </div>
              </div>
            </div>

            {/* Daily Breakdown List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {trendDays.map((day) => {
                const dayMsgs = localMessages.filter(m => m.date.split('T')[0] === day.date);
                const dayNegs = dayMsgs.filter(m => m.score > 0);
                const isExpanded = !!expandedDays[day.date];

                return (
                  <div key={day.date} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all hover:border-white/10">
                    
                    {/* Day Row Header Trigger */}
                    <div 
                      onClick={() => toggleDayExpansion(day.date)}
                      className="p-4 flex justify-between items-center cursor-pointer select-none bg-slate-950/20 hover:bg-slate-950/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: getColor(day.score) }}></div>
                        <div>
                          <span className="block font-bold text-sm text-white">{day.label}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                            {day.score === 100 
                              ? <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle size={10} /> {lang==='en'?lt.allPositiveEn:lt.allPositive}</span>
                              : <span className="text-amber-500 font-black">{dayNegs.length} {lt.incidentsReported}</span>
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block uppercase tracking-wide text-[9px] font-bold">{lt.dayScore}</span>
                          <span className="font-extrabold text-base text-white tracking-tighter">{day.score}%</span>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </div>

                    {/* Expandable Case Comments Breakdown */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-950/30 border-t border-white/5 space-y-3">
                        {dayNegs.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-500 font-medium">
                            {lt.noCritOnDay}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {dayNegs.map((cf) => (
                              <div key={cf.id} className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-xs">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="font-extrabold text-rose-400 uppercase tracking-wider text-[9px] bg-rose-500/10 px-1.5 py-0.5 rounded">
                                    {cf.department || lt.anonymous}
                                  </span>
                                  <span className={`text-[8px] uppercase tracking-widest font-black ${cf.resolved ? 'text-emerald-400' : 'text-amber-500 animate-pulse'}`}>
                                    {cf.resolved ? lt.resolvedPill : lt.openPill}
                                  </span>
                                </div>
                                <p className="text-slate-200 italic font-medium">"{cf.text || lt.noText}"</p>
                                <div className="mt-2 text-[9px] text-slate-500 flex justify-between items-center">
                                  <span>Kontakt: {cf.contact || lt.anonymous}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleResolve(cf.id, !!cf.resolved); }}
                                    className="text-blue-400 underline hover:text-blue-300 font-bold"
                                  >
                                    {cf.resolved ? lt.markOpen : lt.markResolved}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-950/20 text-center text-[10px] text-slate-500">
              Safe on Set • {lt.historyTitle}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// SmileCheck Icon fallback inside for cleaner layout
const SmileCheck: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default Dashboard;

