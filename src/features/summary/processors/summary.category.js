// src/features/summary/processors/summary.category.js

import { prisma } from "../../../core/db/prisma.js";

export async function sendCategoryBreakdown(client, to, userId) {
  const rows = await prisma.expense.groupBy({
    by: ["category"],
    _sum: { amount: true },
    where: { userId },
  });

  if (!rows.length) {
    await client.sendText(to, `📭 No category data available yet.`);
    return true;
  }

  const list = rows
    .map((r) => `• ${r.category}: ₦${(r._sum.amount || 0).toLocaleString()}`)
    .join("\n");

  await client.sendText(to, `📂 *Spending by Category*\n\n${list}`);

  return true;
}
