export const config = { runtime: "edge" };

const SERPER_KEY = process.env.SERPER_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function serperSearch(query) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 5 }),
  });
  const data = await res.json();
  const snippets = (data.organic || []).map(r => `${r.title}: ${r.snippet}`).join("\n");
  return snippets || "No results found.";
}

async function geminiAnalyze(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 800 },
      }),
    }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { name, website, instagram } = await req.json();

    // Run 3 targeted searches in parallel
    const [generalInfo, shippingInfo, contactInfo] = await Promise.all([
      serperSearch(`${name} fashion brand Instagram followers ${website || ""}`),
      serperSearch(`${name} fashion brand shipping Nigeria ${website || ""}`),
      serperSearch(`${name} fashion brand contact email founder marketing ${website || ""}`),
    ]);

    const prompt = `You are a brand qualification analyst for a Nigerian fashion market consultant.

Based ONLY on the search results below, score this brand on 4 criteria.
Return ONLY valid JSON. No explanation. No markdown. Just the raw JSON object.

Brand: ${name}
Website: ${website || "unknown"}
Instagram: ${instagram || "unknown"}

--- SEARCH RESULT 1: General Brand Info ---
${generalInfo}

--- SEARCH RESULT 2: Nigeria Shipping Info ---
${shippingInfo}

--- SEARCH RESULT 3: Contact / Email Info ---
${contactInfo}

Score each criterion as 1 (pass) or 0 (fail):
- followers_score: 1 if followers are between 5,000 and 200,000 | 0 if outside range or unclear
- nigeria_shipping_score: 1 if they do NOT ship to Nigeria (gap = opportunity) | 0 if they already ship to Nigeria
- nigeria_audience_score: 1 if they have NO or minimal Nigerian audience | 0 if they have strong Nigerian presence
- email_score: 1 if a real contact email was found | 0 if not found

Return this exact JSON:
{
  "followers_score": 0,
  "nigeria_shipping_score": 0,
  "nigeria_audience_score": 0,
  "email_score": 0,
  "total_score": 0,
  "follower_count": "estimated number or unknown",
  "ships_to_nigeria": "yes or no or unknown",
  "nigeria_presence": "none or minimal or moderate or strong",
  "contact_email": "email or not found",
  "contact_name": "name or unknown",
  "reason": "one sentence on why Nigeria is an opportunity for this brand",
  "recommendation": "Email immediately or Email in round 2 or Skip"
}`;

    const raw = await geminiAnalyze(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse Gemini response");

    const result = JSON.parse(jsonMatch[0]);
    result.total_score = (
      (result.followers_score || 0) +
      (result.nigeria_shipping_score || 0) +
      (result.nigeria_audience_score || 0) +
      (result.email_score || 0)
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
