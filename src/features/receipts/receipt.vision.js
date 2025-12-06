// src/features/receipts/receipt.vision.js

import fetch from "node-fetch";
import { OPENAI_API_KEY } from "../../core/config/env.js";

const OPENAI_URL =
  (process.env.OPENAI_API_BASE || "https://api.openai.com/v1") + "/responses";

export async function extractReceiptOCR({ mime, base64 }) {
  const cleanBase64 = base64.replace(/\s+/g, "");

  const prompt = `
You are a receipt OCR and parser. Extract all key fields and output STRICT JSON ONLY:

{
  "amount": <number or null>,
  "currency": "NGN",
  "merchant": "<string or null>",
  "date": "<YYYY-MM-DD or null>",
  "category": "<string>",
  "notes": "<string>",
  "raw_text": "<full OCR text>"
}

Rules:
- amount: numeric only (remove commas)
- merchant: short store name when possible
- date: normalize into YYYY-MM-DD
- category: try groceries, transport, dining, utilities, entertainment, healthcare, subscription, rent, other
- raw_text: return entire OCR result
`;

  const body = {
    model: "gpt-4o-mini", // Vision + cheap
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          {
            type: "input_image",
            image_url: `data:${mime};base64,${cleanBase64}`,
          },
        ],
      },
    ],
    temperature: 0,
    max_output_tokens: 1500,

    // CORRECT formatting for structured JSON output
    text: {
      format: { type: "json_object" },
    },
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
    const err = await res.text();
    throw new Error(`Vision OCR API Error: ${err}`);
  }

  const data = await res.json();

  // Extract the LLM output text safely
  const outputNode = data.output?.[0]?.content?.find(
    (c) => c.type === "output_text"
  );

  if (!outputNode || !outputNode.text) {
    throw new Error("OCR did not return output_text");
  }

  const text = outputNode.text.trim();
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("OCR did not return JSON");
  }

  const parsed = JSON.parse(match[0]);

  // Normalize amount
  parsed.amount = parsed.amount
    ? Number(String(parsed.amount).replace(/,/g, ""))
    : null;

  return parsed;
}
