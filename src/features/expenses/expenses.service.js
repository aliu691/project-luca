import { extractExpenseWithAI } from "../../services/ai.service.js";
import { quickExtract, formatDateDDMMYYYY } from "./expenses.util.js";
import { prisma } from "../../core/db/prisma.js";

import {
  getTodayExpenses,
  getYesterdayExpenses,
  getThisWeekExpenses,
  getThisMonthExpenses,
} from "./expenses.query.js";

/**
 * Handle all expense-like messages
 */
export async function handleExpenseMessage(client, msg, user, text) {
  const lower = text.toLowerCase().trim();

  // --------------------------
  // 1) QUERY COMMANDS
  // --------------------------
  if (lower === "today") {
    const rows = await getTodayExpenses(user.id);
    return sendSummary(client, msg.from, "Today", rows);
  }

  if (lower === "yesterday") {
    const rows = await getYesterdayExpenses(user.id);
    return sendSummary(client, msg.from, "Yesterday", rows);
  }

  if (lower === "this week" || lower === "week") {
    const rows = await getThisWeekExpenses(user.id);
    return sendSummary(client, msg.from, "This Week", rows);
  }

  if (lower === "this month" || lower === "month") {
    const rows = await getThisMonthExpenses(user.id);
    return sendSummary(client, msg.from, "This Month", rows);
  }

  // --------------------------
  // 2) DETECT EXPENSE ENTRY
  // --------------------------
  const looksLikeExpense =
    text.match(/\d/) && /(\bNGN\b|₦|\bUSD\b|\$|paid|spent|to|at|₦|\b£|\b€)/i;

  const isCommand =
    lower.startsWith("/expense") || lower.startsWith("expense:");

  if (!looksLikeExpense && !isCommand) return false; // Let other handlers process message

  // Strip "/expense" prefix if it exists
  const raw = text.replace(/^\/?expense[:\s]*/i, "").trim();

  // --------------------------
  // 3) AI Extraction
  // --------------------------
  let parsed;
  try {
    parsed = await extractExpenseWithAI(raw);
  } catch (err) {
    console.warn("AI failed → using quick parser");
    parsed = quickExtract(raw);
    parsed.notes = parsed.notes || "fallback parser";
  }

  // --------------------------
  // 4) Always use today's date
  // --------------------------

  const today = new Date().toISOString().slice(0, 10);

  const expenseData = {
    userId: user.id,
    amount: parsed.amount || null,
    currency: parsed.currency || (parsed.amount ? "NGN" : null),
    merchant: parsed.merchant || null,
    category: parsed.category || "other",

    // Prisma requires full ISO DateTime
    date: new Date(today + "T00:00:00.000Z"),

    notes: parsed.notes || "",
    rawText: raw,
  };

  // --------------------------
  // 5) Save to DB
  // --------------------------
  const saved = await prisma.expense.create({
    data: expenseData,
  });

  // --------------------------
  // 6) Confirm to user
  // --------------------------
  await client.sendText(
    msg.from,
    `✅ Expense recorded:
• Amount: ${expenseData.amount ?? "N/A"} ${expenseData.currency ?? ""}
• Merchant: ${expenseData.merchant ?? "N/A"}
• Category: ${expenseData.category}
• Date: ${formatDateDDMMYYYY(expenseData.date)}`
  );

  console.log("💾 Expense saved:", saved);

  return true;
}

/**
 * Send a summary list of expenses
 */
async function sendSummary(client, to, label, rows) {
  if (!rows.length) {
    await client.sendText(to, `📭 No expenses recorded for *${label}*.`);
    return true;
  }

  const total = rows.reduce((sum, e) => sum + (e.amount || 0), 0);

  const list = rows
    .map((e) => `• ₦${e.amount} — ${e.merchant || "Unknown"}`)
    .join("\n");

  const message = `📊 *${label} Expenses*\n\n${list}\n\n🧮 Total: ₦${total}`;

  await client.sendText(to, message);
  return true;
}
