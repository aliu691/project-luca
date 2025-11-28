import { prisma } from "../../../core/db/prisma.js";
import {
  getTodayExpenses,
  getYesterdayExpenses,
  getThisWeekExpenses,
  getThisMonthExpenses,
  getExpensesByRange,
} from "../summary.queries.js";
import { formatDateDDMMYYYY } from "../../expenses/expenses.util.js";

/**
 * sendCategoryTime:
 * - if `category` is provided → show transactions for that category in the period
 * - if `category` is null → show grouped totals by category for the period
 *
 * range:
 * - null => use named period (today/yesterday/week/month)
 * - { from, to } => custom range (ISO yyyy-mm-dd strings)
 */
export async function sendCategoryTime(client, to, userId, category, range) {
  // Custom range (explicit from/to)
  if (range && range.from && range.to) {
    return sendForRange(client, to, userId, category, range.from, range.to);
  }

  // Named periods: we will determine by calling appropriate helper.
  // The orchestrator already decides which named period it is; but if it calls here
  // with no `range` we will assume 'today' as fallback. Orchestrator should pass correct rows.
  // To cover all cases, accept a `range` param shaped by the classifier when possible.
  // For robustness, treat `range` === null as 'today'.

  // Fallback named period -> use getTodayExpenses
  // (The orchestrator could call this processor from different named-intent handlers)
  const rows = await getTodayExpenses(userId);
  const label = "Today";

  // if category requested => list transactions for that category in this named period
  if (category) {
    const filtered = rows.filter((r) => r.category === category);

    if (!filtered.length) {
      await client.sendText(
        to,
        `📭 No *${category}* expenses recorded for *${label}*.`
      );
      return true;
    }

    return sendCategoryTransactions(client, to, category, label, filtered);
  }

  // category === null => group totals for this named period
  return sendGroupedForRows(client, to, "Today", rows);
}

/* ----------------- Helpers for named/custom ranges ----------------- */

async function sendForRange(client, to, userId, category, from, toDate) {
  // from/to are ISO yyyy-mm-dd strings
  const rows = await getExpensesByRange(userId, from, toDate);

  const label = `${formatDateDDMMYYYY(new Date(from))} → ${formatDateDDMMYYYY(
    new Date(toDate)
  )}`;

  if (!rows.length) {
    await client.sendText(
      to,
      `📭 No expenses recorded from *${formatDateDDMMYYYY(
        new Date(from)
      )}* to *${formatDateDDMMYYYY(new Date(toDate))}*.`
    );
    return true;
  }

  if (category) {
    const filtered = rows.filter((r) => r.category === category);
    if (!filtered.length) {
      await client.sendText(
        to,
        `📭 No *${category}* expenses found between ${formatDateDDMMYYYY(
          new Date(from)
        )} and ${formatDateDDMMYYYY(new Date(toDate))}.`
      );
      return true;
    }
    return sendCategoryTransactions(client, to, category, label, filtered);
  }

  // No category requested → group totals by category for the given range
  return sendGroupedByCategoryForRange(client, to, userId, from, toDate, label);
}

/* ----------------- Grouping logic (when category === null) ----------------- */

async function sendGroupedByCategoryForRange(
  client,
  to,
  userId,
  from,
  toDate,
  label
) {
  // Use prisma.groupBy to get sums per category in the date window
  const rows = await prisma.expense.groupBy({
    by: ["category"],
    _sum: { amount: true },
    where: {
      userId,
      date: {
        gte: new Date(from + "T00:00:00.000Z"),
        lt: new Date(toDate + "T23:59:59.999Z"),
      },
    },
  });

  if (!rows.length) {
    await client.sendText(to, `📭 No expenses recorded for *${label}*.`);
    return true;
  }

  // sort categories by sum descending (largest first)
  rows.sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0));

  const list = rows
    .map((r) => `• ${r.category}: ₦${(r._sum.amount || 0).toLocaleString()}`)
    .join("\n");

  await client.sendText(to, `📂 ALL CATEGORIES — ${label}\n\n${list}`);
  return true;
}

/* ----------------- When we already have rows (e.g. named period Today) --------------- */

function sendGroupedForRows(client, to, label, rows) {
  if (!rows.length) {
    client.sendText(to, `📭 No expenses recorded for *${label}*.`);
    return true;
  }

  // create a map category => sum
  const map = new Map();
  for (const r of rows) {
    const cat = r.category || "other";
    map.set(cat, (map.get(cat) || 0) + (r.amount || 0));
  }

  // convert to array and sort desc by amount
  const arr = Array.from(map.entries()).map(([category, sum]) => ({
    category,
    sum,
  }));
  arr.sort((a, b) => b.sum - a.sum);

  const list = arr
    .map((x) => `• ${x.category}: ₦${x.sum.toLocaleString()}`)
    .join("\n");

  client.sendText(to, `📂 ALL CATEGORIES — ${label}\n\n${list}`);
  return true;
}

/* ----------------- When specific category requested → list transactions --------------- */

function sendCategoryTransactions(client, to, category, label, rows) {
  // Sort by createdAt ascending (oldest → newest)
  const sorted = [...rows].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  const total = sorted.reduce((s, e) => s + (e.amount || 0), 0);

  const list = sorted
    .map(
      (e) =>
        `• ₦${e.amount.toLocaleString()} — ${
          e.merchant || "Unknown"
        } (${formatDateDDMMYYYY(e.date)})`
    )
    .join("\n");

  const message = `📂 ${category.toUpperCase()} — ${label}\n\n${list}\n\n🧮 Total: ₦${total.toLocaleString()}`;
  client.sendText(to, message);
  return true;
}
