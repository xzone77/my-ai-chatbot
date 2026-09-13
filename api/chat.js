```javascript
// api/chat.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const body = req.body || {};
    const message = body.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured"
      });
    }

    const model = "gemini-3.8-flash";

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      model +
      ":generateContent";

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
                text: message.trim()
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(502).json({
        error:
          data?.error?.message ||
          data?.error?.status ||
          "Gemini API request failed"
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(function (part) {
          return part?.text || "";
        })
        .join("")
        .trim();

    if (!reply) {
      console.error("No Gemini text:", data);

      return res.status(502).json({
        error: "Gemini returned no text response"
      });
    }

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {
    console.error("XZone server error:", error);

    return res.status(500).json({
      error: error?.message || "Internal server error"
    });
  }
}
```
