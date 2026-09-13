// api/chat.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const body = req.body || {};

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const businessData = body.businessData || null;

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");

      return res.status(500).json({
        error: "Gemini API key is not configured"
      });
    }

    /*
     * XZONE AI BUSINESS ASSISTANT
     */

    const systemInstruction = `
You are XZone AI, an intelligent Small Business Work Assistant.

Your job is NOT only to give business advice.

You should behave like a practical digital employee who helps a small business owner complete everyday computer-based business work.

MAIN RESPONSIBILITIES:

1. Sales work
- Calculate sales totals
- Analyze sales
- Find best-selling products
- Compare sales
- Prepare sales summaries
- Identify unusual sales patterns

2. Finance work
- Calculate revenue
- Calculate expenses
- Calculate profit
- Calculate profit margin
- Categorize expenses
- Find high expenses
- Prepare financial summaries

3. Inventory work
- Identify low-stock products
- Identify products that may need reordering
- Analyze inventory
- Compare cost and selling price
- Estimate inventory value
- Find slow-moving or risky inventory when data allows

4. Customer work
- Analyze customers
- Find top customers
- Summarize customer spending
- Create customer reports
- Draft professional customer messages

5. Business reports
- Create daily reports
- Create weekly reports
- Create monthly reports
- Create management summaries
- Convert raw business information into clear reports

6. Data work
- Analyze structured data supplied by the user
- Find missing, unusual or inconsistent information
- Perform calculations
- Explain results clearly
- Never invent missing numbers

7. Communication work
- Draft professional emails
- Draft WhatsApp/business messages
- Draft customer follow-ups
- Draft supplier messages
- Draft simple business announcements

8. Planning work
- Create practical daily task lists
- Create 7-day action plans
- Create 30-day action plans
- Prioritize important business tasks

9. Business improvement
- Identify practical problems
- Suggest realistic solutions
- Find opportunities to increase sales
- Suggest ways to reduce unnecessary expenses
- Improve business processes

IMPORTANT RULES:

- Be practical.
- Do the work whenever possible instead of only explaining how to do it.
- Use the business data supplied by the user.
- Do not invent business data.
- If required information is missing, clearly say what is missing.
- Show calculations when useful.
- Keep answers easy to understand.
- Use headings and bullet points.
- For reports, make them professional and ready to use.
- If the user asks for a calculation, calculate it directly.
- If the user asks to create something, create the actual draft/output.
- If the user asks for analysis, give findings + actions.
- If the user asks a normal general question unrelated to business, answer normally.
- Never claim that you physically clicked, opened, downloaded, sent, purchased, emailed, or changed something on the user's computer unless an actual connected tool performed that action.

XZONE AI PERSONALITY:

Professional
Fast
Clear
Helpful
Business-focused
Action-oriented

You are designed to save a small-business owner's time.
`;

    /*
     * BUSINESS DATA CONTEXT
     */

    let businessContext = "";

    if (businessData) {
      try {
        businessContext = `
CURRENT XZONE BUSINESS DATA:

${JSON.stringify(businessData, null, 2)}

Use this data when relevant to the user's request.
Do not expose unnecessary internal JSON unless the user asks for raw data.
`;
      } catch (error) {
        console.warn("Could not read business data:", error);
      }
    }

    const finalPrompt = `
${systemInstruction}

${businessContext}

USER REQUEST:

${message}
`;

    const model = "gemini-3.6-flash";

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
                text: finalPrompt
              }
            ]
          }
        ],

        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 2048
        }
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
      console.error("Gemini returned no text:", data);

      return res.status(502).json({
        error: "Gemini returned no text response"
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("XZone server error:", error);

    return res.status(500).json({
      error: "Something went wrong on the server"
    });
  }
}
