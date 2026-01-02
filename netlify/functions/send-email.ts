
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { to, subject, html } = JSON.parse(event.body);
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("Missing RESEND_API_KEY environment variable");
      return { 
        statusCode: 500, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: { message: "RESEND_API_KEY is not configured." } }) 
      };
    }

    console.log(`Attempting to send email to ${to} with subject: ${subject}`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Safe on Set <info@safe-on-set.com>", 
        to: [to],
        reply_to: "info@safe-on-set.com",
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Email sent successfully via Resend:", data.id);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, data }),
      };
    } else {
      console.error("Resend API Error:", data);
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: data }),
      };
    }
  } catch (error) {
    console.error("Internal Lambda Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: { message: error.message } }),
    };
  }
};
