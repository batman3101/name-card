const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

const contactSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Person name printed on the business card.' },
    company: { type: 'string', description: 'Company or organization name.' },
    position: { type: 'string', description: 'Job title or role.' },
    phone: { type: 'string', description: 'Main phone or mobile number. Preserve country codes.' },
    email: { type: 'string', description: 'Email address.' },
    address: { type: 'string', description: 'Office, factory, or company address. Combine address lines with line breaks.' },
    tags: { type: 'string', description: 'Short comma-separated Korean tags such as 전시회, 구매, 베트남.' },
    memo: { type: 'string', description: 'Brief note only when useful. Otherwise empty.' },
    confidence: { type: 'integer', description: '0 to 100 confidence score for the extracted contact.' },
    rawText: { type: 'string', description: 'All readable text from the card, preserving line breaks.' },
  },
  required: ['name', 'company', 'position', 'phone', 'email', 'address', 'tags', 'memo', 'confidence', 'rawText'],
  additionalProperties: false,
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };
}

function readGeminiText(response) {
  return response?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();
}

function parseJsonText(text) {
  if (!text) throw new Error('Gemini returned an empty response.');

  const cleaned = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

function normalizeContact(value) {
  return {
    name: String(value.name || '').trim(),
    company: String(value.company || '').trim(),
    position: String(value.position || '').trim(),
    phone: String(value.phone || '').trim(),
    email: String(value.email || '').trim(),
    address: String(value.address || '').trim(),
    tags: String(value.tags || '').trim(),
    memo: String(value.memo || '').trim(),
    confidence: Math.max(0, Math.min(100, Number(value.confidence || 0))),
    rawText: String(value.rawText || '').trim(),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'POST only.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(503, {
      ok: false,
      error: 'GEMINI_API_KEY is not configured in Netlify Functions environment variables.',
    });
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const imageBase64 = String(payload.imageBase64 || '');
    const mimeType = String(payload.mimeType || 'image/jpeg');

    if (!imageBase64) return json(400, { ok: false, error: 'imageBase64 is required.' });
    if (!mimeType.startsWith('image/')) return json(400, { ok: false, error: 'mimeType must be an image type.' });
    if (imageBase64.length > 18_000_000) return json(413, { ok: false, error: 'Image payload is too large.' });

    const geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                text: [
                  'Extract business card contact information from this image.',
                  'Use only visible information. Do not invent missing values.',
                  'The card can contain Korean, English, Vietnamese, phone numbers, emails, and multiple Korean addresses.',
                  'Keep phone country codes such as +82 or +84 when visible.',
                  'Return valid JSON only, matching the schema. Use empty strings for unknown fields.',
                ].join('\n'),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseJsonSchema: contactSchema,
        },
      }),
    });

    const geminiJson = await geminiResponse.json();
    if (!geminiResponse.ok) {
      return json(geminiResponse.status, {
        ok: false,
        error: geminiJson?.error?.message || 'Gemini API request failed.',
      });
    }

    const text = readGeminiText(geminiJson);
    const contact = normalizeContact(parseJsonText(text));
    return json(200, { ok: true, model: MODEL, contact });
  } catch (error) {
    return json(500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
