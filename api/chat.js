export default async function handler(req, res) {
  // Only POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    // Gemini API key from Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");

      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured."
      });
    }

    const { message } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const userMessage = message.trim();

    if (userMessage.length > 10000) {
      return res.status(413).json({
        error: "Message is too long."
      });
    }

    // Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },

        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are XZone AI, a helpful and friendly AI assistant. " +
                  "Give clear, accurate and useful answers. " +
                  "Protect user privacy. " +
                  "Never ask for passwords, API keys, OTPs or other secret credentials."
              }
            ]
          },

          contents: [
            {
              role: "user",
              parts: [
                {
                  text: userMessage
                }
              ]
            }
          ],

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    // Gemini returned an error
    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(502).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    // Get AI response
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "";

    if (!reply) {
      console.error("Empty Gemini response:", data);

      return res.status(502).json({
        error: "Gemini returned an empty response."
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error("XZone AI server error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong on the XZone AI server."
    });
  }
}
