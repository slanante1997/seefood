// SeeFood — Gemini proxy (Netlify Function, v2 API)
//
// The Gemini API key lives ONLY here, server-side. The browser never sees it.
// The frontend POSTs { imageBase64, mimeType } and gets back structured JSON.

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

// Max payload we'll accept from the client (base64), ~7MB of image data.
const MAX_BASE64_LENGTH = 10 * 1024 * 1024;

const SYSTEM_PROMPT = `You are the engine behind "SeeFood", a food-recognition app.
Analyze the food in the image and return nutrition facts, identification, and recipe ideas.

Rules:
- If the image does NOT contain food, set isFood to false and put a short, friendly note in description (e.g. "That's not food — but nice try!"). Leave nutrition fields empty/zero.
- Nutrition values are an estimate for a single typical serving. Always include units in the strings.
- Be specific with the name (e.g. "Margherita Pizza", not just "Pizza") when you can tell.
- recipeQueries: 3 short search phrases someone could use to find recipes for this dish.
- Keep healthNote to one helpful sentence.`;

// Structured-output schema so we get reliable JSON back, not prose.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    isFood: { type: 'boolean' },
    name: { type: 'string' },
    description: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    servingSize: { type: 'string' },
    calories: { type: 'string' },
    nutrition: {
      type: 'object',
      properties: {
        protein: { type: 'string' },
        carbs: { type: 'string' },
        fat: { type: 'string' },
        fiber: { type: 'string' },
        sugar: { type: 'string' },
        sodium: { type: 'string' }
      },
      required: ['protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium']
    },
    ingredients: { type: 'array', items: { type: 'string' } },
    recipeQueries: { type: 'array', items: { type: 'string' } },
    healthNote: { type: 'string' }
  },
  required: ['isFood', 'name', 'description', 'confidence', 'servingSize', 'calories', 'nutrition', 'ingredients', 'recipeQueries', 'healthNote']
};

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export default async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(500, { error: 'Server is missing GEMINI_API_KEY. Set it in your Netlify environment variables.' });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const { imageBase64, mimeType } = payload || {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return json(400, { error: 'Missing imageBase64.' });
  }
  if (imageBase64.length > MAX_BASE64_LENGTH) {
    return json(413, { error: 'Image is too large. Please use an image under ~7MB.' });
  }

  const requestBody = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Identify this food and provide its nutrition facts and recipe ideas.' },
          { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.4
    }
  };

  let geminiRes;
  try {
    geminiRes = await fetch(GEMINI_URL(MODEL, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
  } catch (err) {
    return json(502, { error: 'Could not reach Gemini.', detail: String(err) });
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text();
    return json(geminiRes.status, {
      error: 'Gemini returned an error.',
      detail: detail.slice(0, 500)
    });
  }

  const data = await geminiRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason;
    return json(502, {
      error: blockReason ? `Request blocked by Gemini (${blockReason}).` : 'Gemini returned an empty response.'
    });
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    return json(502, { error: 'Could not parse Gemini response as JSON.' });
  }

  return json(200, result);
};

export const config = { path: '/api/analyze' };
