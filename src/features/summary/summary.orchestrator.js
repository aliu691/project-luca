// // src/features/summary/summary.orchestrator.js

// import { classifySummaryIntent } from "./summary.nlp.js";
// import {
//   getTodayExpenses,
//   getYesterdayExpenses,
//   getThisWeekExpenses,
//   getThisMonthExpenses,
//   getLast5Expenses,
//   getExpensesByCategory,
//   getExpensesByRange,
// } from "./summary.queries.js";

// import { prisma } from "../../core/db/prisma.js"; // needed for category breakdown
// import { formatDateDDMMYYYY } from "../expenses/expenses.util.js";

// export class SummaryOrchestrator {
//   /**
//    * Main summary handler.
//    * Returns true if handled, false if not a summary request.
//    */
//   static async processMessage(client, msg, user) {
//     const text = (msg.body || "").trim();

//     // 1) Run NLP classifier
//     const intentObj = await classifySummaryIntent(text);

//     if (!intentObj || intentObj.intent === "none") {
//       return false; // not a summary request
//     }

//     const { intent, range, category } = intentObj;

//     switch (intent) {
//       case "today":
//         return this.sendToday(client, msg.from, user.id);

//       case "yesterday":
//         return this.sendYesterday(client, msg.from, user.id);

//       case "week":
//         return this.sendWeek(client, msg.from, user.id);

//       case "month":
//         return this.sendMonth(client, msg.from, user.id);

//       case "last5":
//         return this.sendLast5(client, msg.from, user.id);

//       case "categories":
//         return this.sendCategoryBreakdown(client, msg.from, user.id);

//       case "custom_range":
//         return this.sendCustomRange(
//           client,
//           msg.from,
//           user.id,
//           range.from,
//           range.to
//         );

//       default:
//         return false;
//     }
//   }

//   // ───────────────────────────────────────────────
//   // TODAY
//   static async sendToday(client, to, userId) {
//     const rows = await getTodayExpenses(userId);
//     return this.sendSummary(client, to, "Today", rows);
//   }

//   // ───────────────────────────────────────────────
//   // YESTERDAY
//   static async sendYesterday(client, to, userId) {
//     const rows = await getYesterdayExpenses(userId);
//     return this.sendSummary(client, to, "Yesterday", rows);
//   }

//   // ───────────────────────────────────────────────
//   // WEEK
//   static async sendWeek(client, to, userId) {
//     const rows = await getThisWeekExpenses(userId);
//     return this.sendSummary(client, to, "This Week", rows);
//   }

//   // ───────────────────────────────────────────────
//   // MONTH
//   static async sendMonth(client, to, userId) {
//     const rows = await getThisMonthExpenses(userId);
//     return this.sendSummary(client, to, "This Month", rows);
//   }

//   // ───────────────────────────────────────────────
//   // LAST 5 TRANSACTIONS
//   static async sendLast5(client, to, userId) {
//     const rows = await getLast5Expenses(userId);
//     return this.sendSummary(client, to, "Last 5 Transactions", rows);
//   }

//   // ───────────────────────────────────────────────
//   // CATEGORY BREAKDOWN (group-by)
//   static async sendCategoryBreakdown(client, to, userId) {
//     const rows = await prisma.expense.groupBy({
//       by: ["category"],
//       _sum: { amount: true },
//       where: { userId },
//     });

//     if (!rows.length) {
//       await client.sendText(to, `📭 No category data yet.`);
//       return true;
//     }

//     const list = rows
//       .map((r) => `• ${r.category}: ₦${(r._sum.amount || 0).toLocaleString()}`)
//       .join("\n");

//     await client.sendText(to, `📂 *Spending by Category*\n\n${list}`);

//     return true;
//   }

//   // ───────────────────────────────────────────────
//   // CUSTOM RANGE
//   static async sendCustomRange(client, to, userId, from, toDate) {
//     const rows = await getExpensesByRange(userId, from, toDate);

//     const label = `From ${formatDateDDMMYYYY(
//       new Date(from)
//     )} to ${formatDateDDMMYYYY(new Date(toDate))}`;

//     return this.sendSummary(client, to, label, rows);
//   }

//   // ───────────────────────────────────────────────
//   // GENERIC SUMMARY FORMATTING
//   static async sendSummary(client, to, label, rows) {
//     if (!rows.length) {
//       await client.sendText(to, `📭 No expenses recorded for *${label}*.`);
//       return true;
//     }

//     const total = rows.reduce((sum, e) => sum + (e.amount || 0), 0);

//     // Sort by creation time (oldest → newest)
//     const sorted = [...rows].sort(
//       (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//     );

//     const list = sorted
//       .map(
//         (e) =>
//           `• ₦${e.amount.toLocaleString()} — ${
//             e.merchant || "Unknown"
//           } (${formatDateDDMMYYYY(e.date)})`
//       )
//       .join("\n");

//     const message = `📊 *${label}*\n\n${list}\n\n🧮 *Total:* ₦${total.toLocaleString()}`;

//     await client.sendText(to, message);
//     return true;
//   }
// }

// src/features/summary/summary.orchestrator.js

import { classifySummaryIntent } from "./intent/summary.intent.classifier.js";
import { SUMMARY_INTENTS } from "./intent/summary.intent.types.js";

// processors
import * as Time from "./processors/summary.time.js";
import * as Category from "./processors/summary.category.js";
import * as CatTime from "./processors/summary.categoryTime.js";
import * as Recent from "./processors/summary.recent.js";

export class SummaryOrchestrator {
  static async processMessage(client, msg, user) {
    const text = (msg.body || "").trim();

    // 1) NLP classification
    const intentObj = await classifySummaryIntent(text);

    if (!intentObj || intentObj.intent === SUMMARY_INTENTS.NONE) {
      return false; // not a summary request
    }

    const { intent, range, category } = intentObj;

    // 2) Route by intent
    switch (intent) {
      // ───────────────────────────────────────────────
      // TIME-BASED INTENTS
      // ───────────────────────────────────────────────
      case SUMMARY_INTENTS.TODAY:
        return Time.sendToday(client, msg.from, user.id);

      case SUMMARY_INTENTS.YESTERDAY:
        return Time.sendYesterday(client, msg.from, user.id);

      case SUMMARY_INTENTS.WEEK:
        return Time.sendWeek(client, msg.from, user.id);

      case SUMMARY_INTENTS.MONTH:
        return Time.sendMonth(client, msg.from, user.id);

      case SUMMARY_INTENTS.CUSTOM_RANGE:
        return Time.sendCustomRange(client, msg.from, user.id, range);

      // ───────────────────────────────────────────────
      // CATEGORY-ONLY INTENT
      // ───────────────────────────────────────────────
      case SUMMARY_INTENTS.CATEGORIES:
        return Category.sendCategoryBreakdown(client, msg.from, user.id);

      // ───────────────────────────────────────────────
      // CATEGORY + TIME INTENT
      // ───────────────────────────────────────────────
      case SUMMARY_INTENTS.CATEGORY_TIME:
        return CatTime.sendCategoryTime(
          client,
          msg.from,
          user.id,
          category,
          range
        );

      // ───────────────────────────────────────────────
      // RECENT INTENT (last 5)
      // ───────────────────────────────────────────────
      case SUMMARY_INTENTS.LAST5:
        return Recent.sendLast5(client, msg.from, user.id);

      // ───────────────────────────────────────────────
      // default fallback
      // ───────────────────────────────────────────────
      default:
        return false;
    }
  }
}
