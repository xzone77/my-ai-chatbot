```javascript
// api/chat.js
// XZone AI - Vercel Function
// Gemini API key stays on the server.

export default {
  async fetch(request) {
    try {
      // CORS / basic headers
      const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      };

      // Only POST
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({
            error: "Method not allowed"
          }),
          {
            status: 405,
            headers
          }
        );
      }

      // Read JSON body
      let body;

      try {
        body = await request.json();
      } catch {
        return new Response(
          JSON.stringify({
            error: "Invalid JSON request"
          }),
          {
            status: 400,
            headers
          }
        );
      }

      const message = body?.message;

      if (
        typeof message !== "string" ||
        !message.trim()
      ) {
        return new Response(
          JSON.stringify({
            error: "Message is required"
          }),
          {
            status: 400,
            headers
          }
        );
      }

      // Read secret from Vercel
      const apiKey = process.env.GEMINI_API_KEY;

      if (
        typeof apiKey !== "string" ||
        !apiKey.trim()
      ) {
        console.error("GEMINI_API_KEY is missing");

        return new Response(
          JSON.stringify({
            error: "GEMINI_API_KEY is not configured"
          }),
          {
            status: 500,
            headers
          }
        );
      }

      /*
        Current stable Gemini Flash model.
        Gemini 2.0 Flash is shut down, so don't use it.
      */
      const model = "gemini-3.8-flash";

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const geminiResponse = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey.trim()
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
          ],

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          }
        })
      });

      const geminiText =
        await geminiResponse.text();

      let geminiData = {};

      try {
        geminiData =
          JSON.parse(geminiText);
      } catch {
        console.error(
          "Gemini returned non-JSON:",
          geminiText
        );
      }

      console.log(
        "Gemini status:",
        geminiResponse.status
      );

      // Gemini API error
      if (!geminiResponse.ok) {
        console.error(
          "Gemini API error:",
          geminiData
        );

        const message =
          geminiData?.error?.message ||
          geminiData?.error?.status ||
          "Gemini API request failed";

        return new Response(
          JSON.stringify({
            error: message
          }),
          {
            status: 502,
            headers
          }
        );
      }

      // Extract AI text
      const reply =
        geminiData?.candidates?.[0]?.content?.parts
          ?.map(part => part?.text || "")
          .join("")
          .trim();

      if (!reply) {
        console.error(
          "Gemini returned no text:",
          JSON.stringify(geminiData)
        );

        return new Response(
          JSON.stringify({
            error: "Gemini returned no text response"
          }),
          {
            status: 502,
            headers
          }
        );
      }

      return new Response(
        JSON.stringify({
          reply: reply
        }),
        {
          status: 200,
          headers
        }
      );

    } catch (error) {
      console.error(
        "XZone server error:",
        error
      );

      return new Response(
        JSON.stringify({
          error:
            error?.message ||
            "Internal server error"
        }),
        {
          status: 500,
          headers: {
            "Content-Type":
              "application/json; charset=utf-8",
            "Cache-Control":
              "no-store"
          }
        }
      );
    }
  }
};
```

