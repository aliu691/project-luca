import { extractExpenseWithAI } from "../../services/ai.service.js";
import { quickExtract } from "./expenses.util.js";

// export async function handleExpenseMessage(client, msg, user, text) {
//   const looksLikeExpense =
//     text.match(/\d/) && /(\bNGN\b|₦|\bUSD\b|\$|paid|spent|to|at)/i;

//   const isCommand =
//     text.toLowerCase().startsWith("/expense") ||
//     text.toLowerCase().startsWith("expense:");

//   if (!looksLikeExpense && !isCommand) return false; // handler didn't process

//   const raw = text.replace(/^\/?expense[:\s]*/i, "").trim();

//   let parsed;
//   try {
//     parsed = await extractExpenseWithAI(raw);
//   } catch (err) {
//     parsed = quickExtract(raw);
//     parsed.notes = parsed.notes || "fallback parser";
//   }

//   const expense = {
//     userPhone: user.phone,
//     amount: parsed.amount,
//     currency: parsed.currency || "NGN",
//     merchant: parsed.merchant || null,
//     category: parsed.category || "other",
//     date: parsed.date || new Date().toISOString().slice(0, 10),
//     notes: parsed.notes || "",
//     raw_text: raw,
//   };

//   const saved = createExpense(expense);

//   await client.sendText(
//     msg.from,
//     `✅ Expense recorded:
// • Amount: ${expense.amount ?? "N/A"} ${expense.currency}
// • Merchant: ${expense.merchant ?? "N/A"}
// • Category: ${expense.category}
// • Date: ${expense.date}`
//   );

//   console.log("💾 Expense saved:", saved);
//   return true;
// }

import { prisma } from "../../core/db/prisma.js";

/**
 * Detects & processes expense messages
 */
export async function handleExpenseMessage(client, msg, user, text) {
  const looksLikeExpense =
    text.match(/\d/) && /(\bNGN\b|₦|\bUSD\b|\$|paid|spent|to|at)/i;

  const isCommand =
    text.toLowerCase().startsWith("/expense") ||
    text.toLowerCase().startsWith("expense:");

  // Not an expense → let other handlers manage
  if (!looksLikeExpense && !isCommand) return false;

  // Remove “/expense” prefix if present
  const raw = text.replace(/^\/?expense[:\s]*/i, "").trim();

  // --- 1) Extract values ---
  let parsed;
  try {
    parsed = await extractExpenseWithAI(raw);
  } catch (err) {
    parsed = quickExtract(raw);
    parsed.notes = parsed.notes || "fallback parser";
  }

  // --- 2) Normalise payload ---
  const expenseData = {
    userId: user.id,
    amount: parsed.amount || null,
    currency: parsed.currency || (parsed.amount ? "NGN" : null),
    merchant: parsed.merchant || null,
    category: parsed.category || "other",
    date: parsed.date ? new Date(parsed.date) : new Date(),
    notes: parsed.notes || "",
    rawText: raw,
  };

  // --- 3) Save to DB ---
  const saved = await prisma.expense.create({
    data: expenseData,
  });

  // --- 4) Send confirmation ---
  await client.sendText(
    msg.from,
    `✅ Expense recorded:
• Amount: ${expenseData.amount ?? "N/A"} ${expenseData.currency ?? ""}
• Merchant: ${expenseData.merchant ?? "N/A"}
• Category: ${expenseData.category}
• Date: ${expenseData.date.toISOString().slice(0, 10)}`
  );

  console.log("💾 Expense saved:", saved);

  return true;
}
