import { callAI } from "../../services/ai/ai.client.js";
import { SUMMARY_INTENT_PROMPT } from "../../prompts/summaryIntent.prompt.js";

export async function classifySummaryIntent(text) {
  try {
    const json = await callAI(`
${SUMMARY_INTENT_PROMPT}

User message: "${text}"
    `);

    return json; // includes: intent, range, category
  } catch (err) {
    console.error("NLP summary error:", err);
    return {
      intent: "none",
      range: { from: null, to: null },
      category: null,
    };
  }
}
