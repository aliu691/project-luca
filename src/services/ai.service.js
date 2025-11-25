import fetch from "node-fetch";
import { OPENAI_API_KEY } from "../core/config/env.js";

const OPENAI_URL =
  (process.env.OPENAI_API_BASE || "https://api.openai.com/v1") + "/responses";
const MODEL = "gpt-4.1-mini"; // use GPT-4.1 Mini

export async function extractExpenseWithAI(rawText) {
  // Prompt + system style to force JSON output
  const prompt = `
You are an extractor. Given a single-line natural language text describing an expense (a user message),
return a JSON object only. The JSON schema must be exactly:

{
  "amount": <number or null>,
  "currency": "<3-letter currency or null>",
  "merchant": "<merchant name or null>",
  "category": "<category or null>",
  "date": "<ISO8601 date or null>",
  "notes": "<short text or empty string>",
  "raw_text": "<original input>"
}

Rules:
- Output must be valid JSON only (no explanatory text).
- amount must be a number (use numeric value, no thousand separators).
- currency should be "NGN", "USD", "EUR" etc when known, otherwise null.
- date should be ISO 8601 (yyyy-mm-dd) if found, otherwise null.
- category should be one of: groceries, transport, dining, utilities, subscription, rent, entertainment, healthcare, other; if uncertain use "other".
- merchant should be short (company/store name) or null.
- notes can include any extra short extraction hints.

Input:
"${rawText}"
`;

  const body = {
    model: MODEL,
    input: [
      {
        role: "user",
        content: prompt,
      },
    ],
    // set temperature low for deterministic extraction
    temperature: 0.0,
    max_output_tokens: 600,
  };

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }

  const data = await res.json();

  // The Responses API returns structured output; attempt to find JSON string
  // Fallback: search raw response text
  const outputText =
    // some responses include output[0].content[0].text
    data.output?.[0]?.content?.find((c) => c.type === "output_text")?.text ||
    // or stringify full output
    JSON.stringify(data.output) ||
    "";

  // Try to extract first JSON object substring from outputText
  const jsonMatch = outputText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI did not return JSON");
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    // ensure numbers where expected
    parsed.amount = parsed.amount === null ? null : Number(parsed.amount);
    parsed.raw_text = rawText;
    return parsed;
  } catch (err) {
    throw new Error("Failed to parse AI JSON: " + err.message);
  }
}
