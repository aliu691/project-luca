import { callAI } from "../../../services/ai/ai.client.js";
import { EXPENSE_EXTRACTION_PROMPT } from "../../../prompts/expenseExtraction.prompt.js";

/**
 * AI EXPENSE EXTRACTOR — specific to expenses feature
 */
export async function extractTypedExpenseAI(rawText) {
  const prompt = `${EXPENSE_EXTRACTION_PROMPT}
  
Input:
"${rawText}"`;

  const result = await callAI(prompt);

  // normalize output
  result.amount = result.amount === null ? null : Number(result.amount);
  result.notes = result.notes || "";
  result.raw_text = rawText;

  return result;
}
