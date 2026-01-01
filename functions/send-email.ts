
import { Buffer } from 'buffer';

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { to, subject, html } = JSON.parse(event.body);
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "Resend API Key is missing." }) 
      };
    }

    // ACHTUNG: "from" muss eine verifizierte Domain sein. 
    // Solange safe-on-set.com nicht in Resend verifiziert ist, 
    // nutze "Safe on Set <onboarding@resend.dev>"
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Safe on Set <onboarding@resend.dev>", 
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Email sent successfully", data }),
      };
    } else {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
