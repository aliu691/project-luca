import { callAI } from "../../services/ai/ai.client.js";
import { SUMMARY_INTENT_PROMPT } from "../../prompts/summaryIntent.prompt.js";

export async function classifySummaryIntent(text) {
  try {
    const response = await callAI(`
${SUMMARY_INTENT_PROMPT}

User message: "${text}"
`);

    // Ensure structure
    return {
      intent: response.intent || "none",
      range: response.range || { from: null, to: null },
      category: response.category || null,
    };
  } catch (err) {
    console.error("NLP summary error:", err);
    return { intent: "none", range: { from: null, to: null }, category: null };
  }
}
