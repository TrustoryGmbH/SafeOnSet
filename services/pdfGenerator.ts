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
    legal: "Powered by Trustory GmbH"
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
    legal: "Bereitgestellt von Trustory GmbH"
  },
  ar: {
    // Note: Standard jsPDF fonts do not support Arabic glyphs properly without embedding custom fonts (base64).
    // For this demo, we use English/Latin characters or simple transliteration where necessary to avoid rendering boxes/garbage.
    brandSub: "| Safe on Set",
    hero: "Your Voice Matters",
    subHero: "Help us create a safer, better working environment.",
    scan: "SCAN TO CHECK IN",
    anon: "Anonymous 100%",
    time: "10 Seconds",
    secure: "Secure & Private",
    footer: "Production",
    legal: "Powered by Trustory GmbH"
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

  const width = doc.internal.pageSize.getWidth(); // 210
  const height = doc.internal.pageSize.getHeight(); // 297

  // --- Background ---
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, 'F');

  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text("Trustory", 15, 15);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(t.brandSub, 34, 15);

  // --- Hero Section ---
  const heroY = 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(t.hero, width / 2, heroY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(t.subHero, width / 2, heroY + 12, { align: "center" });

  // --- QR Code Section (Card Effect) ---
  const qrSize = 90;
  const qrX = (width - qrSize) / 2;
  const qrY = heroY + 40;

  // Shadow/Border Area
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.roundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 30, 5, 5, 'S');

  // QR Image
  const qrImage = canvasElement.toDataURL("image/jpeg");
  doc.addImage(qrImage, 'JPEG', qrX, qrY, qrSize, qrSize);

  // Scan Instruction
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246); // Brand Blue
  doc.text(t.scan, width / 2, qrY + qrSize + 12, { align: "center" });

  // --- Value Props (Why?) ---
  const infoY = qrY + qrSize + 50;
  
  // Grid of 3
  const colW = width / 3;
  const labels = [t.anon, t.time, t.secure];
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);

  labels.forEach((label, i) => {
      // Small dot
      doc.setFillColor(59, 130, 246);
      doc.circle((colW * i) + (colW / 2), infoY - 6, 1, 'F');
      
      // Text
      doc.text(label, (colW * i) + (colW / 2), infoY, { align: "center" });
  });

  // --- Footer / Production Info ---
  doc.setDrawColor(241, 245, 249); // Slate 100
  doc.line(20, height - 40, width - 20, height - 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(t.footer, width / 2, height - 28, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(productionName, width / 2, height - 20, { align: "center" });

  // Legal Tiny
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(t.legal, width / 2, height - 8, { align: "center" });

  const fileName = `Trustory_Poster_${lang.toUpperCase()}_${productionName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};
