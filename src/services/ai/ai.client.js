import fetch from "node-fetch";
import { OPENAI_API_KEY } from "../../core/config/env.js";

const OPENAI_URL =
  (process.env.OPENAI_API_BASE || "https://api.openai.com/v1") + "/responses";

const MODEL = "gpt-4.1-mini"; // default model

/**
 * Generic OpenAI caller for structured extraction
 */
export async function callAI(prompt) {
  const body = {
    model: MODEL,
    input: [{ role: "user", content: prompt }],
    temperature: 0,
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
    const errText = await res.text();
    throw new Error(`OpenAI API Error: ${res.status} → ${errText}`);
  }

  const data = await res.json();

  // Extract text from Responses API
  const text =
    data.output?.[0]?.content?.find((c) => c.type === "output_text")?.text ||
    "";

  // Extract JSON substring
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI did not return JSON");
  }

  return JSON.parse(jsonMatch[0]);
}
