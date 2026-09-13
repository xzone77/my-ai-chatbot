```javascript
// api/chat.js
// XZone AI - Vercel Serverless Function

export default async function handler(req, res) {
  try {
    // Only POST requests
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    // Vercel parses JSON body for this handler style
    const message = req.body?.message;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");

      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured"
      });
    }

    // Current Gemini model
    const model = "gemini-3.8-flash";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
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
    });

    const data = await response.json();

    console.log("Gemini status:", response.status);

    // Gemini returned an error
    if (!response.ok) {
      console.error(
        "Gemini API error:",
        JSON.stringify(data)
      );

      return res.status(502).json({
        error:
          data?.error?.message ||
          data?.error?.status ||
          "Gemini API request failed"
      });
    }

    // Extract text safely
    const reply = Array.isArray(
      data?.candidates?.[0]?.content?.parts
    )
      ? data.candidates[0].content.parts
          .map(part => part?.text || "")
          .join("")
          .trim()
      : "";

    if (!reply) {
      console.error(
        "Gemini returned no text:",
        JSON.stringify(data)
      );

      return res.status(502).json({
        error: "Gemini returned no text response"
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error(
      "XZone server error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Internal server error"
    });
  }
}
```
