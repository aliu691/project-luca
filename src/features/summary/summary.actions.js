// src/features/summary/summary.actions.js

import {
  getTodayExpenses,
  getYesterdayExpenses,
  getThisWeekExpenses,
  getThisMonthExpenses,
  getLast5Expenses,
  getExpensesByCategory,
  getExpensesByRange,
} from "./summary.queries.js";

import { formatDateDDMMYYYY } from "../expenses/expenses.util.js";
import { prisma } from "../../core/db/prisma.js";

export async function sendSummaryByIntent(client, to, intent, userId) {
  switch (intent.type) {
    case "today":
      return sendList(client, to, "Today", await getTodayExpenses(userId));

    case "yesterday":
      return sendList(
        client,
        to,
        "Yesterday",
        await getYesterdayExpenses(userId)
      );

    case "week":
      return sendList(
        client,
        to,
        "This Week",
        await getThisWeekExpenses(userId)
      );

    case "month":
      return sendList(
        client,
        to,
        "This Month",
        await getThisMonthExpenses(userId)
      );

    case "recent":
      return sendRecent(client, to, userId);

    // -------------------------------
    // CATEGORY NLP (“transport”, "food")
    // -------------------------------
    case "category":
      return sendList(
        client,
        to,
        `${intent.category} Expenses`,
        await getExpensesByCategory(userId, intent.category)
      );

    // -------------------------------
    // DATE RANGE NLP (“past 2 days”)
    // -------------------------------
    case "range":
      return sendList(
        client,
        to,
        `Expenses (${intent.from} → ${intent.to})`,
        await getExpensesByRange(userId, intent.from, intent.to)
      );

    default:
      return false;
  }
}

/**
 * Format & send list summaries
 */
async function sendList(client, to, label, rows) {
  if (!rows.length)
    return client.sendText(to, `📭 No expenses recorded for *${label}*.`);

  const total = rows.reduce((sum, e) => sum + (e.amount || 0), 0);

  const list = rows
    .map((e) => {
      const amount = e.amount?.toLocaleString() || "0";
      const merchant = e.merchant?.trim() || "Unknown";
      const date = formatDateDDMMYYYY(e.date);

      return `• ₦${amount} — ${merchant} (${date})`;
    })
    .join("\n");

  return client.sendText(
    to,
    `📊 *${label}*\n\n${list}\n\n🧮 Total: ₦${total.toLocaleString()}`
  );
}

/**
 * Spending aggregated by category
 */
export async function sendCategories(client, to, userId) {
  const rows = await prisma.expense.groupBy({
    by: ["category"],
    _sum: { amount: true },
    where: { userId },
  });

  if (!rows.length) return client.sendText(to, `📭 No category data yet.`);

  const msg = rows
    .map((r) => {
      const total = r._sum.amount?.toLocaleString() || "0";
      return `• ${r.category}: ₦${total}`;
    })
    .join("\n");

  return client.sendText(to, `📂 *Spending by Category*\n\n${msg}`);
}

/**
 * Last 5 transactions
 */
export async function sendRecent(client, to, userId) {
  const rows = await getLast5Expenses(userId);

  if (!rows.length) return client.sendText(to, "📭 No transaction history.");

  const msg = rows
    .map((e) => {
      const amount = e.amount?.toLocaleString() || "0";
      const merchant = e.merchant?.trim() || "Unknown";
      const date = formatDateDDMMYYYY(e.date);

      return `• ₦${amount} — ${merchant} (${date})`;
    })
    .join("\n");

  return client.sendText(to, `📘 *Last 5 Transactions*\n\n${msg}`);
}
