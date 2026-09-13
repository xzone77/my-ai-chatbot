```javascript
// api/chat.js
// XZone AI - Vercel Serverless Function

module.exports = async function handler(req, res) {

  // Only POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

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
        error: "GEMINI_API_KEY is not configured in Vercel"
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
      encodeURIComponent(apiKey),
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

    console.log("Gemini HTTP:", response.status);

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

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(function (part) {
          return part.text || "";
        })
        .join("")
        .trim();

    if (!reply) {

      console.error(
        "Gemini returned no reply:",
        JSON.stringify(data)
      );

      return res.status(502).json({
        error: "Gemini returned no text response"
      });
    }

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {

    console.error(
      "XZone API Error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Internal server error"
    });
  }
};
```
