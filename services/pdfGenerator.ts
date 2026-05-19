
import { jsPDF } from "jspdf";
import { Language } from "../types";

const POSTER_TRANSLATIONS = {
  en: {
    brandSub: "| Safe on Set",
    hero: "Your Voice Matters.",
    subHero: "Help us create a safer, better working environment.",
    scan: "SCAN TO CHECK IN",
    anon: "100% Anonymous",
    time: "Takes 10 Seconds",
    secure: "Secure & Private",
    footer: "Current Production",
    legal: "Powered by safe-on-set.com"
  },
  de: {
    brandSub: "| Sicher am Set",
    hero: "Deine Stimme zählt.",
    subHero: "Hilf uns, eine bessere Arbeitsumgebung zu schaffen.",
    scan: "HIER SCANNEN & CHECK-IN",
    anon: "100% Anonym",
    time: "Dauert 10 Sekunden",
    secure: "Sicher & Privat",
    footer: "Aktuelle Produktion",
    legal: "Bereitgestellt von safe-on-set.com"
  },
  ar: {
    brandSub: "| Safe on Set",
    hero: "Your Voice Matters",
    subHero: "Help us create a safer, better working environment.",
    scan: "SCAN TO CHECK IN",
    anon: "Anonymous 100%",
    time: "10 Seconds",
    secure: "Secure & Private",
    footer: "Production",
    legal: "Powered by safe-on-set.com"
  }
};

export const generatePosterPDF = (canvasElement: HTMLCanvasElement | null, productionName: string = "Production", lang: Language = 'en') => {
  if (!canvasElement) return;

  const t = POSTER_TRANSLATIONS[lang];

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("Safe on Set", 15, 15);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(t.brandSub, 40, 15);

  const heroY = 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.setTextColor(15, 23, 42);
  doc.text(t.hero, width / 2, heroY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(71, 85, 105);
  doc.text(t.subHero, width / 2, heroY + 12, { align: "center" });

  const qrSize = 90;
  const qrX = (width - qrSize) / 2;
  const qrY = heroY + 40;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 30, 5, 5, 'S');

  const qrImage = canvasElement.toDataURL("image/jpeg");
  doc.addImage(qrImage, 'JPEG', qrX, qrY, qrSize, qrSize);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246);
  doc.text(t.scan, width / 2, qrY + qrSize + 12, { align: "center" });

  const infoY = qrY + qrSize + 50;
  const colW = width / 3;
  const labels = [t.anon, t.time, t.secure];
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);

  labels.forEach((label, i) => {
      doc.setFillColor(59, 130, 246);
      doc.circle((colW * i) + (colW / 2), infoY - 6, 1, 'F');
      doc.text(label, (colW * i) + (colW / 2), infoY, { align: "center" });
  });

  doc.setDrawColor(241, 245, 249);
  doc.line(20, height - 40, width - 20, height - 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(t.footer, width / 2, height - 28, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(productionName, width / 2, height - 20, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(t.legal, width / 2, height - 8, { align: "center" });

  const fileName = `SafeOnSet_Poster_${productionName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

export const generateFeedbackReportPDF = (production: any, messages: any[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(252, 253, 255);
  doc.rect(0, 0, width, height, 'F');

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text("Production Feedback Report", 15, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Safe on Set | Created at ${new Date().toLocaleDateString()}`, 15, 26);

  // Production Info Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 35, width - 30, 40, 3, 3, 'FD');

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(production.name, 25, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Coordinator: ${production.coordinator || 'N/A'}`, 25, 52);
  doc.text(`Email: ${production.email}`, 25, 57);
  doc.text(`Status: ${production.status}`, 25, 62);
  doc.text(`Total Feedbacks: ${messages.length}`, 25, 67);

  // Table Header
  let y = 85;
  doc.setFillColor(59, 130, 246);
  doc.rect(15, y, width - 30, 10, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Date", 18, y + 6.5);
  doc.text("Score", 45, y + 6.5);
  doc.text("Department", 65, y + 6.5);
  doc.text("Comment", 95, y + 6.5);

  y += 10;
  doc.setTextColor(30, 41, 59);

  messages.forEach((msg, index) => {
    // Check page break
    if (y > height - 20) {
      doc.addPage();
      y = 20;
      doc.setFillColor(59, 130, 246);
      doc.rect(15, y, width - 30, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text("Date", 18, y + 6.5);
      doc.text("Score", 45, y + 6.5);
      doc.text("Department", 65, y + 6.5);
      doc.text("Comment", 95, y + 6.5);
      y += 10;
    }

    doc.setFont("helvetica", "normal");
    const dateStr = new Date(msg.date).toLocaleDateString();
    
    // Alt row background
    if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, width - 30, 12, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.text(dateStr, 18, y + 7);
    
    // Score Badge helper
    const score = msg.score;
    if (score <= 2) doc.setTextColor(239, 68, 68); // Red
    else if (score === 3) doc.setTextColor(245, 158, 11); // Amber
    else doc.setTextColor(16, 185, 129); // Green
    
    doc.setFont("helvetica", "bold");
    doc.text(score.toString() + "/5", 45, y + 7);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(msg.department || "General", 65, y + 7);

    // Comment wrapping
    const comment = msg.text || "-";
    const wrappedComment = doc.splitTextToSize(comment, 90);
    doc.text(wrappedComment, 95, y + 7);

    y += 12 + (wrappedComment.length > 1 ? (wrappedComment.length - 1) * 4 : 0);
  });

  doc.save(`Feedback_Report_${production.name.replace(/\s+/g, '_')}.pdf`);
};
