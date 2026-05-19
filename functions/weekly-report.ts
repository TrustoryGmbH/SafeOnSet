
import { createClient } from "@supabase/supabase-js";

export const handler = async (event: any) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey || !resendKey) {
    console.error("Missing environment variables");
    return { statusCode: 500, body: "Configuration error" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const { data: productions, error: prodError } = await supabase.from('productions').select('*');
    if (prodError) throw prodError;
    if (!productions || productions.length === 0) return { statusCode: 200, body: "No productions found" };

    for (const prod of productions) {
      const coAdmins = prod.co_admins || [];
      const verifiedCoAdmins = (coAdmins as any[]).filter(ca => ca.verified && ca.email);
      if (verifiedCoAdmins.length === 0) continue;

      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('production_id', prod.id)
        .gte('date', lastWeek.toISOString())
        .order('date', { ascending: false });

      if (msgError) continue;

      // Group by day for the last 7 days
      const dailyData: any[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayMessages = (messages || []).filter(m => m.date.split('T')[0] === dayStr);
        
        const negatives = dayMessages.filter(m => m.score > 0);
        // Scoring: Start 100%, -10% per negative
        const score = Math.max(0, 100 - (negatives.length * 10));
        
        dailyData.push({
          date: d,
          dateStr: d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' }),
          score,
          negatives
        });
      }

      const dailyRows = dailyData.map(day => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 16px; font-weight: 700; color: #334155;">${day.dateStr}</td>
          <td style="padding: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${day.score === 100 ? '#10b981' : (day.score >= 70 ? '#f59e0b' : '#ef4444')};"></span>
              <span style="font-size: 16px; font-weight: 900; color: #1e293b;">${day.score}%</span>
            </div>
          </td>
          <td style="padding: 16px; font-size: 13px; color: #64748b;">
            ${day.score === 100 ? '<span style="color: #10b981; font-weight: 600;">Ausschließlich positives Feedback</span>' : `${day.negatives.length} kritische Meldung(en)`}
          </td>
        </tr>
        ${day.negatives.length > 0 ? day.negatives.map((n: any) => `
          <tr style="background: #fff1f2;">
             <td colspan="3" style="padding: 12px 16px 12px 32px; font-size: 12px;">
                <div style="color: #be123c; font-weight: 700; margin-bottom: 4px;">Kritik (${n.department || 'Allgemein'}):</div>
                <div style="color: #475569; font-style: italic; border-left: 2px solid #fda4af; padding-left: 12px;">"${n.text || 'Kein Kommentar'}"</div>
                <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">Kontakt: ${n.contact || 'Anonym'}</div>
             </td>
          </tr>
        `).join('') : ''}
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <div style="color: #60a5fa; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Weekly Performance Report</div>
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0; tracking: -0.02em;">${prod.name}</h1>
                          </td>
                          <td align="right">
                             <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); padding: 8px 16px; border-radius: 12px;">
                                <span style="color: #60a5fa; font-size: 10px; font-weight: 900; text-transform: uppercase;">KW ${getWeekNumber(now)}</span>
                             </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Meta Info -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 13px; color: #64748b;">Berichtszeitraum: <b>${lastWeek.toLocaleDateString('de-DE')} - ${now.toLocaleDateString('de-DE')}</b></span>
                    </td>
                  </tr>

                  <!-- Content Table -->
                  <tr>
                    <td style="padding: 20px 0;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <thead>
                          <tr style="text-align: left; background: #fff; border-bottom: 2px solid #f1f5f9;">
                            <th style="padding: 16px 40px; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em;">Tag</th>
                            <th style="padding: 16px; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em;">Stimmung</th>
                            <th style="padding: 16px; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em;">Besonderheiten</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${dailyRows}
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                      <div style="margin-bottom: 20px;">
                        <img src="https://sgofclixezlfxaiugcuy.supabase.co/storage/v1/object/public/assets/sos_logo_dark.png" alt="Safe on Set" width="120" style="opacity: 0.5;">
                      </div>
                      <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.6;">
                        Dieser Bericht wurde automatisch generiert.<br>
                        © 2026 Trustory GmbH • Alle Rechte vorbehalten.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      for (const ca of verifiedCoAdmins) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "Safe on Set Reports <reports@safe-on-set.com>",
              to: [ca.email],
              subject: `Wochenbericht: ${prod.name}`,
              html: html,
            }),
          });
          console.log(`Report sent to ${ca.email} for ${prod.name}`);
        } catch (e) {
          console.error(`Failed to send email to ${ca.email}:`, e);
        }
      }
    }

    return { statusCode: 200, body: "Weekly reports processed" };
  } catch (error: any) {
    console.error("Internal Error in weekly report:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

