import { prisma } from "../../core/db/prisma.js";
import {
  getTodayExpenses,
  getYesterdayExpenses,
  getThisWeekExpenses,
  getThisMonthExpenses,
} from "./expenses.query.js";

import { formatDateDDMMYYYY } from "./expenses.util.js";

/**
 * Pure function to insert an expense in DB.
 * Called by: ExpenseOrchestrator
 */
export async function createExpenseRecord(userId, parsed, source) {
  const todayISO = new Date().toISOString().slice(0, 10);

  // Normalize amount
  const amount = parsed.amount ?? null;

  // normalize string fields → empty string if null/undefined
  const safe = (v) => (v === null || v === undefined ? "" : String(v).trim());

  const expenseData = {
    userId,
    amount,
    currency: safe(parsed.currency) || (amount ? "NGN" : ""), // never null
    merchant: safe(parsed.merchant),
    category: safe(parsed.category) || "other",
    date: new Date(todayISO + "T00:00:00.000Z"),

    notes: safe(parsed.notes), // ensure empty string
    rawText: safe(parsed.raw_text || parsed.rawText), // ensure empty string
  };

  const saved = await prisma.expense.create({
    data: expenseData,
  });

  console.log("💾 Expense saved:", saved);
  return saved;
}

/**
 * Handle expense summaries (today, week, etc.)
 * Called by: message.handler.js before orchestrator
 */
export async function processSummaryQuery(client, msg, user, text) {
  const lower = text.toLowerCase().trim();

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

  return false;
}

/**
 * Send formatted expense summary
 */
export async function sendSummary(client, to, label, rows) {
  if (!rows.length) {
    await client.sendText(to, `📭 No expenses recorded for *${label}*.`);
    return true;
  }

  const total = rows.reduce((sum, e) => sum + (e.amount || 0), 0);

  const list = rows
    .map(
      (e) =>
        `• ₦${e.amount.toLocaleString()} — ${
          e.merchant || "Unknown"
        } (${formatDateDDMMYYYY(e.date)})`
    )
    .join("\n");

  const msg = `📊 *${label} Expenses*\n\n${list}\n\n🧮 Total: ₦${total.toLocaleString()}`;
  await client.sendText(to, msg);

  return true;
}
