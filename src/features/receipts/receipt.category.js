import { callAI } from "../../services/ai/ai.client.js";

const MERCHANT_KEYWORDS = {
  groceries: ["shoprite", "spar", "market square", "foodco"],
  dining: ["chicken republic", "kfc", "kilimanjaro", "mcdonald", "kingsbite"],
  transport: ["uber", "bolt", "indrive"],
  utilities: [
    "ikeja electric",
    "abuja electric",
    "ekedc",
    "aedc",
    "water board",
  ],
  subscription: [
    "mtn",
    "airtel",
    "glo",
    "9mobile",
    "dstv",
    "gotv",
    "showmax",
    "spotify",
    "netflix",
  ],
  rent: ["estate", "landlord", "property"],
  healthcare: ["pharmacy", "clinic", "hospital"],
};

export function inferCategoryFromMerchant(merchant) {
  if (!merchant) return null;

  const lower = merchant.toLowerCase();

  for (const [category, keywords] of Object.entries(MERCHANT_KEYWORDS)) {
    for (const k of keywords) {
      if (lower.includes(k)) return category;
    }
  }

  return null; // no match
}

export async function inferCategoryWithAI(text) {
  try {
    const prompt = `
Classify the following merchant or receipt text into one category:
groceries, transport, dining, utilities, subscription, rent, entertainment, healthcare, other.

Return JSON ONLY:
{"category": "<value>"}

Text: "${text}"
`;

    const result = await callAI(prompt);

    if (result?.category) return result.category.toLowerCase();
  } catch (e) {
    console.warn("AI category inference failed:", e);
  }

  return "other";
}

export async function assignReceiptCategory(merchant, ocrText) {
  // 1) Rule-based
  const rule = inferCategoryFromMerchant(merchant);
  if (rule) return rule;

  // 2) AI fallback
  return await inferCategoryWithAI(merchant || ocrText);
}
