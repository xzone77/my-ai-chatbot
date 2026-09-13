```javascript
// api/chat.js
// Vercel Serverless Function
// Gemini API key server-side par safe rahegi.

export default async function handler(req, res) {
  // Only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");

      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in Vercel"
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: message
                }
              ]
            }
          ],

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          }
        })
      }
    );

    const data = await response.json();

    console.log("Gemini status:", response.status);
    console.log("Gemini response:", JSON.stringify(data));

    // Gemini API error
    if (!response.ok) {
      const geminiError =
        data?.error?.message ||
        data?.error?.status ||
        "Unknown Gemini API error";

      return res.status(502).json({
        error: geminiError
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!reply) {
      console.error("No reply from Gemini:", data);

      return res.status(502).json({
        error: "Gemini returned no text response"
      });
    }

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {
    console.error("CHAT API ERROR:", error);

    return res.status(500).json({
      error: error?.message || "Internal server error"
    });
  }
}
```
