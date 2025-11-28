import { prisma } from "../../core/db/prisma.js";

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
