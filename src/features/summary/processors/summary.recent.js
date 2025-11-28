// src/features/summary/processors/summary.recent.js

import { getLast5Expenses } from "../summary.queries.js";
import { sendSummaryMessage } from "../summary.actions.formatter.js";

export async function sendLast5(client, to, userId) {
  const rows = await getLast5Expenses(userId);
  return sendSummaryMessage(client, to, "Last 5 Transactions", rows);
}
