import { extractTypedExpenseAI } from "../ai/typedExpense.ai.js";
import { quickExtract } from "../expenses.util.js";

export async function parseTypedExpense(text) {
  try {
    const ai = await extractTypedExpenseAI(text);
    return ai;
  } catch (err) {
    console.warn("AI extraction failed → using quick parser");
    return quickExtract(text);
  }
}
