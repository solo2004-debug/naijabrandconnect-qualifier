export const config = { runtime: "edge" };

const SERPER_KEY = process.env.SERPER_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function serperSearch(query) {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 5 }),
    });
    const data = await res.json();
    const snippets = (data.organic || [])
      .map(r => `${r.title}: ${r.snippet}`)
      .join("\n");
    return snippets || "No results found.";
  } catch (e) {
    return "Search failed: " + e.message;
  }
}

async function geminiAnalyze(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1500,
        },
      }),
    }
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

function extractJSON(raw) {
  const stripped = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in response");

  const jsonStr = stripped.slice(start, end + 1);
  return JSON.parse(jsonStr);
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!GEMINI_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not set in environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!SERPER_KEY) {
    return new Response(
      JSON.stringify({ error: "SERPER_API_KEY is not set in environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { name, website, instagram } = await req.json();

    const [generalInfo, shippingInfo, contactInfo] = await Promise.all([
      serperSearch(`${name} fashion brand Instagram followers ${website || ""}`),
      serperSearch(`${name} shipping Nigeria ${website || ""}`),
      serperSearch(`${name} contact email founder ${website || ""}`),
    ]);

    const prompt = `You are a brand qualification analyst. Based ONLY on the search results below, score this brand.

Brand: ${name}
Website: ${website || "unknown"}
Instagram: ${instagram || "unknown"}

SEARCH RESULT 1 - General Info:
${generalInfo}

SEARCH RESULT 2 - Nigeria Shipping:
${shippingInfo}

SEARCH RESULT 3 - Contact Info:
${contactInfo}

Return ONLY a raw JSON object. No markdown, no explanation, no code fences. Just the JSON.

Rules:
- followers_score: 1 if followers between 5000 and 200000, else 0
- nigeria_shipping_score: 1 if they do NOT ship to Nigeria (means opportunity), else 0
- nigeria_audience_score: 1 if they have NO Nigerian audience, else 0
- email_score: 1 if a real contact email was found, else 0
- total_score: add all 4 scores together

{
  "followers_score": 0,
  "nigeria_shipping_score": 0,
  "nigeria_audience_score": 0,
  "email_score": 0,
  "total_score": 0,
  "follower_count": "number or unknown",
  "ships_to_nigeria": "yes or no or unknown",
  "nigeria_presence": "none or minimal or moderate or strong",
  "contact_email": "email or not found",
  "contact_name": "name or unknown",
  "reason": "one sentence on the Nigeria opportunity for this brand",
  "recommendation": "Email immediately or Email in round 2 or Skip"
}`;

    const raw = await geminiAnalyze(prompt);
    const result = extractJSON(raw);

    result.total_score =
      (result.followers_score || 0) +
      (result.nigeria_shipping_score || 0) +
      (result.nigeria_audience_score || 0) +
      (result.email_score || 0);

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
