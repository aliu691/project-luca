import { callAI } from "../../../services/ai/ai.client.js";
import { SUMMARY_INTENT_PROMPT } from "../../../prompts/summaryIntent.prompt.js";
import { SUMMARY_INTENTS } from "./summary.intent.types.js";

// CATEGORY KEYWORDS
const CATEGORY_KEYWORDS = {
  groceries: ["grocery", "groceries"],
  transport: ["transport", "transportation"],
  dining: ["dining", "food", "meal", "meals"],
  utilities: ["utility", "utilities", "bills"],
  subscription: ["subscription", "subscriptions"],
  rent: ["rent"],
  entertainment: ["entertainment", "movies", "movie"],
  healthcare: ["health", "healthcare", "hospital", "doctor"],
  other: ["other", "misc", "miscellaneous"],
};

function resolveCategory(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  for (const [canonical, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.includes(lower)) return canonical;
  }
  return null;
}

function detectCategoryFromText(text) {
  const lower = text.toLowerCase();
  for (const [canonical, words] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const w of words) {
      if (lower.includes(w)) return canonical;
    }
  }
  return null;
}

// RANGE HELPERS
function computePastDaysRange(days) {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);

  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - days);

  return {
    from: fromDate.toISOString().slice(0, 10),
    to,
  };
}

// IMPLICIT CATEGORY-TIME PATTERNS
const CATEGORY_TIME_KEYWORDS = [
  "group my",
  "categorize",
  "category",
  "sort my",
  "arrange my",
  "group today",
  "group this week",
  "group this month",
  "category breakdown",
  "group by category",
  "expenses by category",
];

function isImplicitCategoryTime(text) {
  const lower = text.toLowerCase();
  return CATEGORY_TIME_KEYWORDS.some((k) => lower.includes(k));
}

// MAIN CLASSIFIER
export async function classifySummaryIntent(text) {
  try {
    const lower = text.toLowerCase();

    // detect “past X days”
    const pastDaysMatch = lower.match(/(past|last)\s+(\d+)\s+days?/);
    const pastDays = pastDaysMatch ? Number(pastDaysMatch[2]) : null;

    // Call AI
    const ai = await callAI(`
${SUMMARY_INTENT_PROMPT}

User message: "${text}"
    `);

    let { intent, range, category } = ai;

    // Normalize category
    if (category) category = resolveCategory(category);

    // 🔥 IMPLICIT CATEGORY-TIME DETECTION
    if (isImplicitCategoryTime(text)) {
      const cat = detectCategoryFromText(text); // may be null

      return {
        intent: SUMMARY_INTENTS.CATEGORY_TIME,
        category: cat, // null means “all categories”
        range: pastDays ? computePastDaysRange(pastDays) : range,
      };
    }

    // Fix category intent
    if (intent === SUMMARY_INTENTS.CATEGORIES) {
      const detected = detectCategoryFromText(text);
      if (detected) {
        return {
          intent: SUMMARY_INTENTS.CATEGORY_TIME,
          category: detected,
          range: range,
        };
      }
    }

    // CATEGORY_TIME fix when AI fails to include category
    if (intent === SUMMARY_INTENTS.CATEGORY_TIME) {
      if (!category) {
        const detected = detectCategoryFromText(text);
        category = detected || null;
      }

      if (pastDays) {
        return {
          intent: SUMMARY_INTENTS.CATEGORY_TIME,
          category,
          range: computePastDaysRange(pastDays),
        };
      }
    }

    // CUSTOM RANGE fix
    if (intent === SUMMARY_INTENTS.CUSTOM_RANGE) {
      if (pastDays) {
        return {
          intent: SUMMARY_INTENTS.CUSTOM_RANGE,
          category: null,
          range: computePastDaysRange(pastDays),
        };
      }
    }

    return {
      intent,
      range: range || { from: null, to: null },
      category: category || null,
    };
  } catch (err) {
    console.error("NLP summary classifier error:", err);

    return {
      intent: SUMMARY_INTENTS.NONE,
      range: { from: null, to: null },
      category: null,
    };
  }
}
