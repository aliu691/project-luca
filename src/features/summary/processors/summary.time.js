import {
  getTodayExpenses,
  getYesterdayExpenses,
  getThisWeekExpenses,
  getThisMonthExpenses,
  getExpensesByRange,
} from "../summary.queries.js";

import { sendSummaryMessage } from "../summary.actions.formatter.js";
import { formatDateDDMMYYYY } from "../../expenses/expenses.util.js";

export async function sendToday(client, to, userId) {
  return sendSummaryMessage(
    client,
    to,
    "Today",
    await getTodayExpenses(userId)
  );
}

export async function sendYesterday(client, to, userId) {
  return sendSummaryMessage(
    client,
    to,
    "Yesterday",
    await getYesterdayExpenses(userId)
  );
}

export async function sendWeek(client, to, userId) {
  return sendSummaryMessage(
    client,
    to,
    "This Week",
    await getThisWeekExpenses(userId)
  );
}

export async function sendMonth(client, to, userId) {
  return sendSummaryMessage(
    client,
    to,
    "This Month",
    await getThisMonthExpenses(userId)
  );
}

// CUSTOM DATE RANGE
export async function sendCustomRange(client, to, userId, range) {
  const rows = await getExpensesByRange(userId, range.from, range.to);

  const label = `From ${formatDateDDMMYYYY(
    new Date(range.from)
  )} to ${formatDateDDMMYYYY(new Date(range.to))}`;

  return sendSummaryMessage(client, to, label, rows);
}
