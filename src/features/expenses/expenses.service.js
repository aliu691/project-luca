import { extractExpenseWithAI } from "../../services/ai.service.js";
import { quickExtract } from "./expenses.util.js";
import { createExpense } from "../../core/db/expenses.js";

export async function handleExpenseMessage(client, msg, user, text) {
  const looksLikeExpense =
    text.match(/\d/) && /(\bNGN\b|₦|\bUSD\b|\$|paid|spent|to|at)/i;

  const isCommand =
    text.toLowerCase().startsWith("/expense") ||
    text.toLowerCase().startsWith("expense:");

  if (!looksLikeExpense && !isCommand) return false; // handler didn't process

  const raw = text.replace(/^\/?expense[:\s]*/i, "").trim();

  let parsed;
  try {
    parsed = await extractExpenseWithAI(raw);
  } catch (err) {
    parsed = quickExtract(raw);
    parsed.notes = parsed.notes || "fallback parser";
  }

  const expense = {
    userPhone: user.phone,
    amount: parsed.amount,
    currency: parsed.currency || "NGN",
    merchant: parsed.merchant || null,
    category: parsed.category || "other",
    date: parsed.date || new Date().toISOString().slice(0, 10),
    notes: parsed.notes || "",
    raw_text: raw,
  };

  const saved = createExpense(expense);

  await client.sendText(
    msg.from,
    `✅ Expense recorded:
• Amount: ${expense.amount ?? "N/A"} ${expense.currency}
• Merchant: ${expense.merchant ?? "N/A"}
• Category: ${expense.category}
• Date: ${expense.date}`
  );

  console.log("💾 Expense saved:", saved);
  return true;
}
