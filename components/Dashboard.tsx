
import React, { useRef, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { TRANSLATIONS } from '../constants';
import { Language, Message, ShootDay, Production } from '../types';
import Smiley from './Smiley';
import { generatePosterPDF } from '../services/pdfGenerator';
import { 
  Mail, FileText, Inbox, BarChart2, TrendingUp, AlertCircle, CheckCircle, 
  AlertTriangle, X, Filter, Check, ShieldCheck, MessageSquare, ChevronDown, ChevronUp, Clock,
  Plus, Trash2, Brain, ShieldAlert, Activity, Sparkles
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
  const [activeModal, setActiveModal] = useState<'none' | 'inbox' | 'history' | 'schedule'>('none');
  const [inboxFilter, setInboxFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [showOnlyNegative, setShowOnlyNegative] = useState<boolean>(true); // Startet direkt mit Fokus auf negative Feedbacks wie gewünscht
  
  // Local synchronized message list for responsive resolve state adjustment
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  
  // Schedule state hooks
  const [localSchedule, setLocalSchedule] = useState<any[]>([]);
  const [newDayNum, setNewDayNum] = useState<string>('');
  const [newDayDate, setNewDayDate] = useState<string>('');
  const [schedError, setSchedError] = useState<string | null>(null);
  const [midTab, setMidTab] = useState<'trend' | 'ai-advisor' | 'heatmap'>('trend');

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    setLocalSchedule(schedule);
  }, [schedule]);

  const handleAddShootDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDayNum || !newDayDate) return;
    setSchedError(null);

    const dayVal = parseInt(newDayNum);
    if (isNaN(dayVal)) {
      setSchedError("Ungültige Tag-Nummer");
      return;
    }

    const newDayObj: any = {
      production_id: productionId,
      date: newDayDate,
      day: dayVal
    };

    // Optimistic local update
    const tempId = Math.random().toString();
    const optimisticDay = { ...newDayObj, id: tempId };
    setLocalSchedule(prev => [...prev, optimisticDay].sort((a,b) => a.day - b.day));

    if (!isSandboxMode) {
      try {
        const { data, error } = await supabase
          .from('shoot_days')
          .insert([newDayObj])
          .select();

        if (error) {
          if (error.message.includes('column') || error.message.includes('not find') || error.message.includes('does not exist')) {
            setSchedError("Datenbank-Spalte 'production_id' fehlt in 'shoot_days'. Bitte wende dich an den Admin, um die Tabelle zu erweitern (ALTER TABLE shoot_days ADD COLUMN production_id UUID;).");
          } else {
            throw error;
          }
          // Revert optimistic update
          setLocalSchedule(prev => prev.filter(s => s.id !== tempId));
        } else if (data && data[0]) {
          // Replace tempId with actual db entry
          setLocalSchedule(prev => prev.map(s => s.id === tempId ? data[0] : s).sort((a,b) => a.day - b.day));
        }
      } catch (err: any) {
        console.error("Fehler beim Hinzufügen des Drehtags:", err);
        setSchedError(err.message || "Fehler beim Speichern");
        setLocalSchedule(prev => prev.filter(s => s.id !== tempId));
      }
    }

    setNewDayNum('');
    setNewDayDate('');
  };

  const handleToggleActiveDay = async (dayId: string, currentActive: boolean) => {
    setSchedError(null);
    const nextActive = !currentActive;

    // Optimistic local update: only ONE day can be active at a time!
    setLocalSchedule(prev => prev.map(s => {
      if (s.id === dayId) return { ...s, active: nextActive };
      return { ...s, active: false }; // deactivate others
    }));

    if (!isSandboxMode) {
      try {
        // Try to update 'active' column — if it doesn't exist, suppress the error
        // (the column needs to be added via Supabase SQL: ALTER TABLE shoot_days ADD COLUMN active BOOLEAN DEFAULT false;)
        const { error: deactivateError } = await supabase
          .from('shoot_days')
          .update({ active: false })
          .eq('production_id', productionId);

        if (deactivateError && (deactivateError.message.includes('active') || deactivateError.message.includes('not find') || deactivateError.message.includes('does not exist'))) {
          // Column doesn't exist — active state is local-only, which is fine
          console.warn("'active' column not in shoot_days — active state is local-only.");
          return;
        }

        if (!deactivateError) {
          const { error } = await supabase
            .from('shoot_days')
            .update({ active: nextActive })
            .eq('id', dayId);

          if (error) {
            throw error;
          }
        }
      } catch (err: any) {
        console.error("Fehler beim Ändern des Drehtag-Status:", err);
        setSchedError(err.message || "Fehler beim Speichern");
        // Revert
        setLocalSchedule(schedule);
      }
    }
  };

  const handleDeleteShootDay = async (dayId: string) => {
    if (!confirm(lang === 'de' ? "Diesen Drehtag wirklich löschen?" : "Delete this shoot day?")) return;
    setSchedError(null);

    // Optimistic local update
    setLocalSchedule(prev => prev.filter(s => s.id !== dayId));

    if (!isSandboxMode) {
      try {
        const { error } = await supabase
          .from('shoot_days')
          .delete()
          .eq('id', dayId);

        if (error) throw error;
      } catch (err: any) {
        console.error("Fehler beim Löschen des Drehtags:", err);
        setSchedError(err.message || "Fehler beim Löschen");
        // Revert
        setLocalSchedule(schedule);
      }
    }
  };

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

  // Generiere die Liste der Trend-Tage – zeigt ALLE Tage mit Feedback-Daten + heute
  const getTrendDays = () => {
    const todayDate = new Date();
    const todayStr = todayDate.toISOString().split('T')[0];
    
    // Sammle alle einzigartigen Tage aus den Nachrichten
    const messageDates = new Set<string>();
    localMessages.forEach(m => {
      if (m.date) {
        const dateStr = m.date.split('T')[0];
        messageDates.add(dateStr);
      }
    });
    
    // Bestimme den frühesten Tag
    let earliestDate: Date;
    if (productionStartDate) {
      earliestDate = new Date(productionStartDate);
    } else if (messageDates.size > 0) {
      const sortedDates = [...messageDates].sort();
      earliestDate = new Date(sortedDates[0]);
    } else {
      // Kein Start-Datum und keine Nachrichten: zeige die letzten 7 Tage
      earliestDate = new Date(todayDate);
      earliestDate.setDate(earliestDate.getDate() - 6);
    }
    
    // Sandbox: Zeige 10 Tage Demo-Daten rückwärts
    if (isSandboxMode) {
      const days = [];
      for (let i = 0; i < 10; i++) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        days.push({
          label: i === 0 ? t.today : `${d.getDate()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.`,
          date: ds,
          score: calculateScoreForDate(ds)
        });
      }
      return days;
    }
    
    // Real: Zeige alle Tage von heute rückwärts bis zum frühesten Datum (max 60 Tage)
    const days = [];
    const maxDays = 60;
    for (let i = 0; i < maxDays; i++) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      
      // Stoppe, wenn wir vor dem frühesten Datum sind
      if (d < earliestDate && i > 0) break;
      
      // Zeige den Tag wenn: a) es heute ist, b) es Nachrichten gibt, c) es ein Produktions-Zeitraum-Tag ist
      const hasFeedback = messageDates.has(ds);
      const isToday = ds === todayStr;
      const isInProductionRange = productionStartDate ? d >= earliestDate : true;
      
      if (isToday || hasFeedback || isInProductionRange) {
        days.push({
          label: isToday ? t.today : `${d.getDate()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.`,
          date: ds,
          score: calculateScoreForDate(ds)
        });
      }
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

  // --- AI SAFETY ADVISORY CALCULATIONS ---
  const activeUnresolvedIncidents = localMessages.filter(m => m.score > 0 && !m.resolved);
  
  // Risk assessment Level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (activeUnresolvedIncidents.length >= 4) riskLevel = 'HIGH';
  else if (activeUnresolvedIncidents.length >= 1) riskLevel = 'MEDIUM';
  
  // Satisfaction Score
  const satisfactionIndex = localMessages.length === 0 
    ? 100 
    : Math.round(((localMessages.filter(m => m.score === 0).length) / localMessages.length) * 100);

  // Parse keywords and assemble recommendations
  const getAIRecommendations = (): string[] => {
    const recs: string[] = [];
    const textCorpus = localMessages.map(m => m.text?.toLowerCase() || '').join(' ');

    const keywordMapping = [
      {
        keys: ['überstunde', 'müde', 'schlaf', 'fatigue', 'tired', 'pause', 'break', 'überarbeitet'],
        de: "Erhöhtes Risiko für Konzentrationsschwächen gemeldet. Bitte verlängerte Ruhezeiten zwischen den Drehtagen einplanen und zusätzliche Kaffeepausen einlegen.",
        en: "Increased risk of concentration fatigue reported. Please plan extended rest periods between shoot days and schedule additional set breaks."
      },
      {
        keys: ['staub', 'atmen', 'maske', 'dust', 'breathing', 'ffp2', 'schmutz'],
        de: "Feinstaubbelastung oder Atembeschwerden gemeldet. Bitte FFP2-Masken am Set bereitstellen und für regelmäßige Lüftungsintervalle in Innenräumen sorgen.",
        en: "Fine dust exposure or respiratory discomfort reported. Please supply FFP2/N95 masks on set and implement strict room ventilation cycles."
      },
      {
        keys: ['kabel', 'stolpern', 'tripping', 'cables', 'verlegung', 'safety matten'],
        de: "Physische Stolpergefahren durch Kabel gemeldet. Bitte die Grip- und Lichtabteilungen anweisen, alle Verkehrswege mit gelben Sicherheitsmatten abzudecken.",
        en: "Physical tripping hazards reported. Please direct grip and electric departments to secure all high-traffic cable routes with yellow hazard covers."
      },
      {
        keys: ['stunt', 'höhe', 'height', 'absturz', 'fall', 'leiter', 'ladder'],
        de: "Sicherheitsrisiko bei Präzisions- oder Höhenarbeiten gemeldet. Bitte vor dem nächsten Take eine Sicherheitsunterweisung durch den Stunt-Koordinator durchführen.",
        en: "Safety risk during precision or high-elevation setups reported. Please hold a dedicated safety briefing with the stunt coordinator before the next take."
      },
      {
        keys: ['essen', 'wasser', 'catering', 'food', 'water', 'durst', 'hunger'],
        de: "Beschwerden bezüglich Catering oder Dehydration. Bitte ausreichend kühle Wasserflaschen direkt am Set platzieren und Snack-Intervalle anpassen.",
        en: "Complaints regarding catering or hydration. Please place adequate cold water stations directly on set and adjust nutrition break durations."
      }
    ];

    keywordMapping.forEach(mapping => {
      if (mapping.keys.some(key => textCorpus.includes(key))) {
        recs.push(lang === 'de' ? mapping.de : mapping.en);
      }
    });

    // Default suggestions if no keywords hit
    if (recs.length === 0) {
      if (riskLevel === 'LOW') {
        recs.push(
          lang === 'de' 
            ? "Alle Sicherheitsindikatoren sind im grünen Bereich. Fahren Sie mit den standardmäßigen täglichen Sicherheits-Briefings fort." 
            : "All safety indicators are nominal. Continue with standard daily safety brief check-ins."
        );
      } else {
        recs.push(
          lang === 'de' 
            ? "Unaufgelöste Vorfälle vorhanden. Bitte kontaktieren Sie die betroffenen Departments, um Gefahrenquellen zeitnah zu entschärfen." 
            : "Unresolved incidents present. Please interface with the affected departments to mitigate risk vectors promptly."
        );
      }
    }

    return recs;
  };

  const aiRecommendations = getAIRecommendations();

  // --- DEPARTMENT HEATMAP CALCULATIONS ---
  const DEPARTMENTS_LIST = [
    { key: 'camera', label: lang === 'de' ? 'Kamera / Grip' : 'Camera / Grip', icon: '🎥' },
    { key: 'lighting', label: lang === 'de' ? 'Licht / Elektrik' : 'Lighting / Electric', icon: '💡' },
    { key: 'sound', label: lang === 'de' ? 'Ton / Sound' : 'Sound / Audio', icon: '🎤' },
    { key: 'production', label: lang === 'de' ? 'Aufnahmeleitung' : 'Production Office', icon: '🎬' },
    { key: 'catering', label: lang === 'de' ? 'Set-Catering' : 'Set Catering', icon: '🍲' },
    { key: 'costume', label: lang === 'de' ? 'Kostüm & Maske' : 'Costume & Makeup', icon: '💄' },
    { key: 'design', label: lang === 'de' ? 'Szenenbild / Requisite' : 'Art Dept / Props', icon: '📐' }
  ];

  const getDepartmentStats = () => {
    return DEPARTMENTS_LIST.map(dept => {
      const deptMsgs = localMessages.filter(m => {
        const dName = (m.department || '').toLowerCase();
        return dName === dept.key || dName.includes(dept.key) || dName === dept.label.toLowerCase() || dName.includes(dept.label.toLowerCase().split(' ')[0]);
      });

      const total = deptMsgs.length;
      const unresolvedNegatives = deptMsgs.filter(m => m.score > 0 && !m.resolved).length;
      
      const health = total === 0 ? 100 : Math.max(20, 100 - (unresolvedNegatives * 30));

      return {
        ...dept,
        total,
        unresolvedNegatives,
        health
      };
    });
  };

  const departmentStats = getDepartmentStats();

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
      {/* Middle: Premium Multi-Tab Workspace */}
      <div className="flex flex-col border-r border-white/5 bg-slate-950/15">
        
        {/* Workspace Tab Headers */}
        <div className="border-b border-white/5 flex p-4 justify-between items-center bg-black/10">
          <div className="flex gap-2">
            <button 
              onClick={() => setMidTab('trend')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                midTab === 'trend' 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <TrendingUp size={12} />
              {lang === 'de' ? 'Drehplan Trend' : 'Shoot Trend'}
            </button>
            
            <button 
              onClick={() => setMidTab('ai-advisor')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 relative ${
                midTab === 'ai-advisor' 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <Brain size={12} />
              AI Advisor
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-indigo-400" />
            </button>
            
            <button 
              onClick={() => setMidTab('heatmap')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                midTab === 'heatmap' 
                  ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <Activity size={12} />
              {lang === 'de' ? 'Heatmap' : 'Heatmap'}
            </button>
          </div>
          
          <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-full px-2 py-0.5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Live</span>
          </div>
        </div>

        <div className="p-8 flex-1 overflow-hidden flex flex-col justify-between">
          
          {midTab === 'trend' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="flex items-center gap-2 mb-8">
                <TrendingUp size={14} className="text-slate-500" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">{t.hTrend}</span>
              </div>
              
              <div className="space-y-5 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar flex-1">
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
          )}

          {midTab === 'ai-advisor' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Brain size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">AI Set Risk Advisory</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                     <Sparkles size={10} /> Smart Scan
                  </div>
                </div>

                {/* Dashboard Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className={`p-4 rounded-2xl border transition-all ${
                    riskLevel === 'LOW' 
                      ? 'bg-emerald-950/10 border-emerald-500/10' 
                      : riskLevel === 'MEDIUM'
                        ? 'bg-amber-950/10 border-amber-500/10'
                        : 'bg-rose-950/10 border-rose-500/10 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  }`}>
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Set Risk Level</span>
                    <span className={`text-sm font-black uppercase tracking-wider ${
                      riskLevel === 'LOW' ? 'text-emerald-400' : riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {riskLevel === 'LOW' 
                        ? (lang === 'de' ? 'Gering' : 'Low') 
                        : riskLevel === 'MEDIUM' 
                          ? (lang === 'de' ? 'Erhöht' : 'Medium') 
                          : (lang === 'de' ? 'Kritisch' : 'Critical')
                      }
                    </span>
                  </div>
                  
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Set Satisfaction</span>
                    <span className="text-sm font-black text-white tracking-wider">{satisfactionIndex}%</span>
                  </div>
                </div>

                {/* Smart recommendations */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-2">
                   <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Safe Recommendations</span>
                   
                   {aiRecommendations.map((rec, i) => (
                      <div key={i} className="p-4 bg-indigo-950/5 border border-indigo-500/10 rounded-2xl flex gap-3 text-left">
                         <div className="p-1.5 bg-indigo-500/10 rounded-xl h-fit border border-indigo-500/20 text-indigo-400">
                            <ShieldAlert size={14} />
                         </div>
                         <div>
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Safety recommendation</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-1 font-medium">{rec}</p>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            </div>
          )}

          {midTab === 'heatmap' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 mb-6">
                <Activity size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">{lang === 'de' ? 'Crew-Departments Auslastung' : 'Department Safety Scores'}</span>
              </div>

              <div className="space-y-3.5 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar flex-1">
                 {departmentStats.map((dept, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-2xl border transition-all ${
                        dept.health < 80 
                          ? 'bg-rose-950/5 border-rose-500/10 shadow-[0_0_10px_rgba(239,68,68,0.02)]' 
                          : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                      }`}
                    >
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <span className="text-xs">{dept.icon}</span>
                             <span className="text-xs font-bold text-slate-200">{dept.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             {dept.unresolvedNegatives > 0 && (
                               <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-black uppercase rounded-lg">
                                  {dept.unresolvedNegatives} Open
                               </span>
                             )}
                             <span className="text-[10px] font-black text-slate-400">{dept.health}%</span>
                          </div>
                       </div>
                       
                       <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${dept.health}%`, 
                              backgroundColor: dept.health >= 90 
                                ? '#10b981' 
                                : dept.health >= 70 
                                  ? '#f59e0b' 
                                  : '#ef4444' 
                            }}
                          />
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-white/5 grid grid-cols-3 gap-3 bg-black/10">
           <button 
             onClick={() => { onOpenInbox(); setActiveModal('inbox'); }} 
             className="h-14 bg-slate-800/50 hover:bg-slate-800 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all group"
           >
             <Inbox size={16} className="text-slate-400 group-hover:text-rose-400" />
             <span className="hidden sm:inline">{t.inbox}</span>
             <span className="sm:hidden">Inbox</span>
             {localMessages.filter(m => m.score > 0 && !m.resolved).length > 0 && (
               <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                 {localMessages.filter(m => m.score > 0 && !m.resolved).length}
               </span>
             )}
           </button>
           <button 
             onClick={() => { onOpenHistory(); setActiveModal('history'); }} 
             className="h-14 bg-slate-800/50 hover:bg-slate-800 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all group"
           >
             <BarChart2 size={16} className="text-slate-400 group-hover:text-blue-400" />
             <span className="hidden sm:inline">{t.viewStats}</span>
             <span className="sm:hidden">Stats</span>
           </button>
           <button 
             onClick={() => setActiveModal('schedule')} 
              className="h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-lg shadow-blue-900/25 group"
           >
             <Clock size={16} className="text-blue-200 group-hover:scale-110 transition-transform" />
             <span className="hidden sm:inline">{lang === 'de' ? 'Drehtage' : 'Schedule'}</span>
             <span className="sm:hidden">Planer</span>
             {(() => {
                const today = new Date().toISOString().split('T')[0];
                const activeByProp = localSchedule.find(s => (s as any).active);
                const activeByDate = localSchedule.find(s => s.date === today);
                const active = activeByProp || activeByDate;
                return active ? (
                  <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                    {active.day}
                  </span>
                ) : null;
              })()}
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
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="inbox-modal-title">
          <div className="bg-slate-900 border border-white/10 rounded-[24px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-slate-950/20">
              <div>
                <h2 id="inbox-modal-title" className="text-xl font-extrabold text-white flex items-center gap-2">
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
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
          <div className="bg-slate-900 border border-white/10 rounded-[24px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-slate-950/20">
              <div>
                <h2 id="history-modal-title" className="text-xl font-extrabold text-white flex items-center gap-2">
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
                              ? <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle size={10} /> {lt.allPositive}</span>
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

      {/* ================= SCHEDULE / DREHTAGE MODAL ================= */}
      {activeModal === 'schedule' && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
          <div className="bg-slate-900 border border-white/10 rounded-[24px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden text-left animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-slate-950/20">
              <div>
                <h2 id="schedule-modal-title" className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Clock className="text-blue-400" size={20} />
                  {lang === 'de' ? 'Drehtage- & Terminplaner' : 'Shoot Schedule Planner'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'de' 
                    ? 'Verwalte Drehtage und steuere, an welchen Tagen Abstimmungen möglich sind.' 
                    : 'Manage shoot days and control when active crew feedback is open.'}
                </p>
              </div>
              <button 
                onClick={() => { setActiveModal('none'); setSchedError(null); }}
                className="p-1 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {schedError && (
              <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs font-semibold leading-relaxed">
                ⚠️ {schedError}
                {schedError.includes('production_id') && (
                  <div className="mt-2 p-2 bg-black/40 rounded text-[9px] font-mono text-slate-400 overflow-x-auto select-all">
                    ALTER TABLE shoot_days <br />
                    ADD COLUMN IF NOT EXISTS production_id UUID REFERENCES productions(id) ON DELETE CASCADE,<br />
                    ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false;
                  </div>
                )}
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Add New Day Form */}
              <form onSubmit={handleAddShootDay} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Plus size={14} /> {lang === 'de' ? 'Neuen Drehtag hinzufügen' : 'Add New Shoot Day'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{lang === 'de' ? 'Tag-Nummer' : 'Day Number'}</label>
                    <input 
                      type="number"
                      required
                      placeholder="z.B. 1"
                      value={newDayNum}
                      onChange={(e) => setNewDayNum(e.target.value)}
                      className="bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{lang === 'de' ? 'Datum' : 'Date'}</label>
                    <input 
                      type="date"
                      required
                      value={newDayDate}
                      onChange={(e) => setNewDayDate(e.target.value)}
                      className="bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-900/20"
                >
                  {lang === 'de' ? 'Hinzufügen & Speichern' : 'Add Shoot Day'}
                </button>
              </form>

              {/* Shoot Days List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {lang === 'de' ? 'Geplante Drehtage' : 'Scheduled Shoot Days'}
                </h3>
                
                {localSchedule.length === 0 ? (
                  <div className="text-center py-10 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-slate-500 text-xs italic">
                    {lang === 'de' ? 'Noch keine Drehtage geplant.' : 'No shoot days scheduled yet.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {localSchedule.map((day) => {
                      const formattedDate = new Date(day.date).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
                        weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
                      });

                      return (
                        <div 
                          key={day.id}
                          className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                            day.active 
                              ? 'bg-emerald-950/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.02)]' 
                              : 'bg-white/5 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                              day.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                            }`}>
                              D{day.day}
                            </div>
                            <div>
                              <span className="block font-bold text-sm text-white">{lang==='de'?'Drehtag':'Shoot Day'} {day.day}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{formattedDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleActiveDay(day.id, !!day.active)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border ${
                                day.active 
                                  ? 'bg-emerald-600 text-white border-emerald-500' 
                                  : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white hover:bg-slate-700'
                              }`}
                            >
                              <CheckCircle size={12} />
                              {day.active 
                                ? (lang === 'de' ? 'Voting Geöffnet' : 'Voting Open')
                                : (lang === 'de' ? 'Öffnen' : 'Open Voting')
                              }
                            </button>
                            
                            <button
                              onClick={() => handleDeleteShootDay(day.id)}
                              className="p-2 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/10"
                              title="Löschen"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-950/20 text-center text-[10px] text-slate-500">
              Safe on Set • Drehtage- & Terminplaner
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

