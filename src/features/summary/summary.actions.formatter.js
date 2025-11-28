import { formatDateDDMMYYYY } from "../expenses/expenses.util.js";

export async function sendSummaryMessage(client, to, label, rows) {
  if (!rows.length) {
    await client.sendText(to, `📭 No expenses recorded for *${label}*.`);
    return true;
  }

  const total = rows.reduce((sum, e) => sum + (e.amount || 0), 0);

  const sorted = [...rows].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt) // oldest → newest
  );

  const list = sorted
    .map(
      (e) =>
        `• ₦${e.amount.toLocaleString()} — ${
          e.merchant || "Unknown"
        } (${formatDateDDMMYYYY(e.date)})`
    )
    .join("\n");

  const message = `📊 *${label}*\n\n${list}\n\n🧮 *Total:* ₦${total.toLocaleString()}`;

  await client.sendText(to, message);
  return true;
}
