import { extractExpenseWithAI } from "../../../services/ai.service.js";
import { quickExtract } from "../expenses.util.js";
export async function parseTypedExpense(text) {
  try {
    const ai = await extractExpenseWithAI(text);
    return ai;
  } catch (e) {
    return quickExtract(text);
  }
}
