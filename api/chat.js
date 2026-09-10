export default async function handler(req, res) {
  // Only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    // API key stays on the server
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Server configuration error."
      });
    }

    // Read request body safely
    const { message } = req.body || {};

    // Validate message
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    // Limit very large requests
    const userMessage = message.trim();

    if (userMessage.length > 10000) {
      return res.status(413).json({
        error: "Message is too long."
      });
    }

    // Call Gemini
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
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
                  "You are XZone AI, a helpful, respectful and safe AI assistant. " +
                  "Give clear and accurate answers. Do not provide instructions that could cause serious harm. " +
                  "Protect user privacy and never ask for passwords, API keys, OTPs or other secret credentials."
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

          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
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

    // Gemini API error
    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(502).json({
        error: "AI service is temporarily unavailable."
      });
    }

    // Extract AI response
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "";

    if (!reply) {
      return res.status(502).json({
        error: "AI returned an empty response."
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
}
