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
