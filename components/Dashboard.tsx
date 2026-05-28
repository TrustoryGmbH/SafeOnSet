
import React, { useRef, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { TRANSLATIONS } from '../constants';
import { Language, Message, ShootDay, Production, UserGroup } from '../types';
import Smiley from './Smiley';
import { generatePosterPDF } from '../services/pdfGenerator';
import { 
  Mail, FileText, Inbox, BarChart2, TrendingUp, AlertCircle, CheckCircle, 
  AlertTriangle, X, Filter, Check, ShieldCheck, MessageSquare, ChevronDown, ChevronUp, Clock,
  Plus, Trash2, Brain, ShieldAlert, Activity, Sparkles, Send
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
  userGroup?: UserGroup;
  productionStartDate?: string; // Optional: Wann die Produktion aktiviert wurde
}

const LOCAL_TRANS: Record<Language, any> = {
  de: {
    inboxTitleFull: "Vertrauensstelle — Meldungen & Vorfälle",
    inboxSubtitle: "Vertrauliche Meldungen vom Set in Echtzeit",
    filterAll: "Alle Meldungen",
    filterOpen: "Offene Vorfälle",
    filterResolved: "Erledigte Fälle",
    filterNegative: "Nur Vorfallmeldungen anzeigen",
    positiveDay: "Keine Vorfälle gemeldet 😊",
    negativeDay: "Vorfall gemeldet 😓",
    noText: "Keine Beschreibung (Check-In ohne Vorfall)",
    markResolved: "Als erledigt markieren",
    markOpen: "Als offen markieren",
    emptyState: "Keine Meldungen für diese Filter-Auswahl.",
    historyTitle: "Statistiken & Vorfallhistorie",
    historySubtitle: "Tägliche Auswertung der Meldungen und Vorfälle",
    dayScore: "Tagesscore",
    allPositive: "Keine Vorfälle an diesem Tag",
    incidentsReported: "Vorfall/Vorfälle gemeldet",
    anonymous: "Anonym",
    resolvedPill: "Erledigt",
    openPill: "Offen",
    showComments: "Details anzeigen",
    hideComments: "Details ausblenden",
    noCritOnDay: "Keine Vorfälle an diesem Tag gemeldet."
  },
  en: {
    inboxTitleFull: "Trust Office — Reports & Incidents",
    inboxSubtitle: "Confidential reports from set in real-time",
    filterAll: "All Reports",
    filterOpen: "Open Incidents",
    filterResolved: "Resolved Cases",
    filterNegative: "Only show incident reports",
    positiveDay: "No incidents reported 😊",
    negativeDay: "Incident reported 😓",
    noText: "No description (Check-in without incident)",
    markResolved: "Mark as Resolved",
    markOpen: "Mark as Open",
    emptyState: "No reports matching this filter selection.",
    historyTitle: "Statistics & Incident History",
    historySubtitle: "Daily analysis of reports and incidents",
    dayScore: "Day Score",
    allPositive: "No incidents on this day",
    incidentsReported: "incident(s) reported",
    anonymous: "Anonymous",
    resolvedPill: "Resolved",
    openPill: "Open",
    showComments: "Show details",
    hideComments: "Hide details",
    noCritOnDay: "No incidents reported on this day."
  },
  ar: {
    inboxTitleFull: "مكتب الثقة — البلاغات والحوادث",
    inboxSubtitle: "بلاغات سرية من موقع التصوير في الوقت الفعلي",
    filterAll: "كل البلاغات",
    filterOpen: "الحوادث المفتوحة",
    filterResolved: "الحالات المحلولة",
    filterNegative: "إظهار بلاغات الحوادث فقط",
    positiveDay: "لم يتم الإبلاغ عن أي حوادث 😊",
    negativeDay: "تم الإبلاغ عن حادثة 😓",
    noText: "لا يوجد وصف (تسجيل وصول بدون حادث)",
    markResolved: "تحديد كمحلول",
    markOpen: "تحديد كمفتوح",
    emptyState: "لا توجد بلاغات تطابق هذا التصفية.",
    historyTitle: "الإحصائيات وسجل الحوادث",
    historySubtitle: "التحليل اليومي للبلاغات والحوادث",
    dayScore: "نتيجة اليوم",
    allPositive: "لا حوادث في هذا اليوم",
    incidentsReported: "حادثة/حوادث مُبلّغ عنها",
    anonymous: "مجهول",
    resolvedPill: "محلول",
    openPill: "مفتوح",
    showComments: "عرض التفاصيل",
    hideComments: "إخفاء التفاصيل",
    noCritOnDay: "لم يتم الإبلاغ عن حوادث في هذا اليوم."
  }
};

const Dashboard: React.FC<DashboardProps> = ({ 
  lang, messages, schedule, 
  onOpenInbox, onOpenHistory, onOpenEmail, productionName, productionId, isSandboxMode = false,
  userGroup = 1, productionStartDate
}) => {
  const t = TRANSLATIONS[lang];
  const lt = LOCAL_TRANS[lang] || LOCAL_TRANS['de'];
  const qrRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePopup, setActivePopup] = useState<'none' | 'pdf'>('none');

  // Modals inside state
  const [activeModal, setActiveModal] = useState<'none' | 'inbox' | 'history' | 'schedule' | 'email-send'>('none');
  const [emailSendAddress, setEmailSendAddress] = useState('');
  const [emailSending, setEmailSending] = useState(false);
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
  const [midTab] = useState<'ai-advisor'>('ai-advisor');

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

    const dayMessages = localMessages.filter(m => m.date && m.date.split('T')[0] === dateString);
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
        
         {/* AI Advisor Header */}
         <div className="border-b border-white/5 flex p-4 justify-between items-center bg-black/10">
           <div className="flex items-center gap-2">
             <Brain size={14} className="text-indigo-400" />
             <span className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">AI Set Risk Advisory</span>
             <span className="relative flex items-center ml-1">
               <span className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
               <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full border border-indigo-400" />
             </span>
           </div>
           <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Sparkles size={10} /> Smart Scan
           </div>
         </div>

         <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
           
           {/* Risk + Satisfaction Cards */}
           <div className="grid grid-cols-2 gap-3">
             <div className={`p-4 rounded-2xl border transition-all ${
               riskLevel === 'LOW' 
                 ? 'bg-emerald-950/10 border-emerald-500/10' 
                 : riskLevel === 'MEDIUM'
                   ? 'bg-amber-950/10 border-amber-500/10'
                   : 'bg-rose-950/10 border-rose-500/10 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
             }`}>
               <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                 {lang === 'de' ? 'Risiko-Level' : 'Set Risk Level'}
               </span>
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
               <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                 {lang === 'de' ? 'Zufriedenheit' : 'Satisfaction'}
               </span>
               <span className="text-sm font-black text-white tracking-wider">{satisfactionIndex}%</span>
             </div>
           </div>

           {/* Trend Summary */}
           <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
             <TrendingUp size={14} className="text-slate-500 flex-shrink-0" />
             <p className="text-[11px] text-slate-400 leading-relaxed">
               {(() => {
                 const totalMsgs = localMessages.length;
                 const negMsgs = localMessages.filter(m => m.score > 0).length;
                 const openMsgs = localMessages.filter(m => m.score > 0 && !m.resolved).length;
                 if (totalMsgs === 0) return lang === 'de' ? 'Noch keine Feedbacks vorhanden. Die Analyse startet automatisch.' : 'No feedback yet. Analysis starts automatically.';
                 if (negMsgs === 0) return lang === 'de' ? `${totalMsgs} Feedbacks — alle positiv. Hervorragende Set-Atmosphäre.` : `${totalMsgs} feedbacks — all positive. Excellent set atmosphere.`;
                 return lang === 'de' 
                   ? `${totalMsgs} Feedbacks, davon ${negMsgs} negativ (${openMsgs} offen). ${openMsgs > 2 ? 'Sofortige Aufmerksamkeit empfohlen.' : 'Situation unter Kontrolle.'}`
                   : `${totalMsgs} feedbacks, ${negMsgs} negative (${openMsgs} open). ${openMsgs > 2 ? 'Immediate attention recommended.' : 'Situation under control.'}`;
               })()}
             </p>
           </div>

           {/* Department Safety Overview */}
           {departmentStats.length > 0 && (
             <div>
               <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">
                 {lang === 'de' ? 'Abteilungen' : 'Departments'}
               </span>
               <div className="space-y-2">
                 {departmentStats.slice(0, 5).map((dept, i) => (
                   <div key={i} className="flex items-center gap-3">
                     <span className="text-xs w-5 text-center">{dept.icon}</span>
                     <span className="text-[11px] font-bold text-slate-300 w-24 truncate">{dept.label}</span>
                     <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full rounded-full transition-all duration-500" style={{ 
                         width: `${dept.health}%`, 
                         backgroundColor: dept.health >= 90 ? '#10b981' : dept.health >= 70 ? '#f59e0b' : '#ef4444' 
                       }} />
                     </div>
                     <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{dept.health}%</span>
                     {dept.unresolvedNegatives > 0 && (
                       <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-black rounded">{dept.unresolvedNegatives}</span>
                     )}
                   </div>
                 ))}
               </div>
             </div>
           )}

           {/* AI Recommendations */}
           <div>
             <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">
               {lang === 'de' ? 'Empfehlungen' : 'Recommendations'}
             </span>
             <div className="space-y-2.5">
               {aiRecommendations.map((rec, i) => (
                 <div key={i} className="p-3.5 bg-indigo-950/5 border border-indigo-500/10 rounded-xl flex gap-3">
                   <div className="p-1.5 bg-indigo-500/10 rounded-lg h-fit border border-indigo-500/20 text-indigo-400">
                     <ShieldAlert size={12} />
                   </div>
                   <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{rec}</p>
                 </div>
               ))}
             </div>
           </div>
         </div>

        <div className="p-6 border-t border-white/5 grid grid-cols-2 gap-3 bg-black/10">
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
            <button onClick={() => { setEmailSendAddress(''); setActiveModal('email-send'); }} className="h-12 bg-blue-600/20 border border-blue-500/20 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-blue-600/30 transition-all">
              <Send size={16} className="text-blue-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">{lang === 'de' ? 'Versenden' : 'Send'}</span>
            </button>
        </div>
      </div>

      {/* ================= SMART TREND ALERT ================= */}
      {(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayNegatives = localMessages.filter(m => m.score > 0 && m.date?.startsWith(today));
        if (todayNegatives.length >= 3) {
          return (
            <div className="absolute bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <AlertTriangle size={20} className="text-rose-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-rose-300">
                    {lang === 'de' ? `⚠️ Trend-Warnung: ${todayNegatives.length} negative Meldungen heute` : `⚠️ Trend Alert: ${todayNegatives.length} negative reports today`}
                  </p>
                  <p className="text-[10px] text-rose-400/80 mt-0.5">
                    {lang === 'de' ? 'Erhöhte Aufmerksamkeit empfohlen. Prüfen Sie die Inbox.' : 'Elevated attention recommended. Check the inbox.'}
                  </p>
                </div>
                <button onClick={() => { setActiveModal('inbox'); }} className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 rounded-xl text-xs font-bold text-rose-300 transition-all">
                  Inbox
                </button>
              </div>
            </div>
          );
        }
        return null;
      })()}

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
                  {lang === 'de' ? 'Terminplaner' : 'Schedule Planner'}
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
              Safe on Set • Vertrauensstelle
            </div>

          </div>
        </div>
      )}

      {/* ================= EMAIL SEND MODAL ================= */}
      {activeModal === 'email-send' && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="bg-slate-900 border border-white/10 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Send className="text-blue-400" size={18} />
                  {lang === 'de' ? 'QR-Code & Poster versenden' : 'Send QR Code & Poster'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'de' ? 'An eine beliebige E-Mail-Adresse senden' : 'Send to any email address'}
                </p>
              </div>
              <button onClick={() => setActiveModal('none')} className="p-1 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors font-bold text-sm">✕</button>
            </div>

            <div className="p-6">
              <label htmlFor="send-email-input" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                {lang === 'de' ? 'Empfänger E-Mail' : 'Recipient Email'}
              </label>
              <input
                id="send-email-input"
                type="email"
                value={emailSendAddress}
                onChange={(e) => setEmailSendAddress(e.target.value)}
                placeholder="email@example.com"
                className="w-full p-3.5 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none text-white placeholder-slate-600 text-sm"
                autoFocus
              />

              <div className="mt-4 p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">{lang === 'de' ? 'Inhalt der E-Mail' : 'Email contents'}</p>
                <div className="flex items-center gap-2 text-xs text-slate-300 mb-1.5">
                  <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center"><span className="text-[10px]">📱</span></div>
                  {lang === 'de' ? 'QR-Code Link für die Produktion' : 'QR Code link for production'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center"><span className="text-[10px]">📄</span></div>
                  {lang === 'de' ? 'PDF Poster zum Ausdrucken' : 'PDF poster for printing'}
                </div>
              </div>

              <button
                disabled={emailSending || !emailSendAddress.includes('@')}
                onClick={async () => {
                  setEmailSending(true);
                  const qrUrl = getQrUrl();
                  try {
                    await fetch('/.netlify/functions/send-email', {
                      method: 'POST',
                      body: JSON.stringify({
                        to: emailSendAddress,
                        subject: `Safe on Set – QR-Code & Poster: ${productionName}`,
                        html: `<div style="font-family: -apple-system, sans-serif; padding: 40px; text-align: center; background: #0f172a; color: white;">
                          <h1 style="font-size: 24px; margin-bottom: 8px;">Safe on Set</h1>
                          <p style="color: #94a3b8; margin-bottom: 32px;">${productionName}</p>
                          <div style="background: white; border-radius: 16px; padding: 24px; display: inline-block; margin-bottom: 24px;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}" width="200" height="200" alt="QR Code" style="display: block;" />
                          </div>
                          <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Diesen QR-Code am Set aushängen. Crew-Mitglieder scannen ihn, um Feedback abzugeben.</p>
                          <div style="margin-bottom: 16px;">
                            <a href="${qrUrl}" style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">QR-Code Link öffnen</a>
                          </div>
                          <p style="color: #334155; font-size: 11px; margin-top: 32px;">Tipp: Lade das PDF-Poster im Dashboard herunter (Button "PDF") und drucke es aus.</p>
                          <p style="color: #1e293b; font-size: 10px; margin-top: 24px;">Safe on Set © 2026 • Trustory GmbH</p>
                        </div>`
                      })
                    });
                    alert(lang === 'de' ? `✅ E-Mail an ${emailSendAddress} gesendet!` : `✅ Email sent to ${emailSendAddress}!`);
                    setActiveModal('none');
                  } catch (err) {
                    console.warn('Email send error:', err);
                    // Fallback: Copy to clipboard
                    try {
                      await navigator.clipboard.writeText(qrUrl);
                      alert(lang === 'de' 
                        ? `E-Mail-Versand nicht verfügbar. QR-Link wurde in die Zwischenablage kopiert:\n${qrUrl}` 
                        : `Email not available. QR link copied to clipboard:\n${qrUrl}`);
                    } catch {
                      alert(lang === 'de' ? `QR-Link: ${qrUrl}` : `QR Link: ${qrUrl}`);
                    }
                    setActiveModal('none');
                  } finally {
                    setEmailSending(false);
                  }
                }}
                className={`w-full mt-5 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  emailSending || !emailSendAddress.includes('@')
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]'
                }`}
              >
                {emailSending ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {lang === 'de' ? 'Wird gesendet...' : 'Sending...'}</>
                ) : (
                  <><Send size={16} /> {lang === 'de' ? 'Jetzt versenden' : 'Send now'}</>
                )}
              </button>
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

