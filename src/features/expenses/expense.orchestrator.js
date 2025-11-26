// src/features/expenses/expense.orchestrator.js

import { parseTypedExpense } from "./parsers/typedExpense.parser.js";
import { parseBankAlert } from "./parsers/bankAlerts.parser.js";
import { quickExtract } from "./expenses.util.js";
import { createExpenseRecord } from "./expenses.service.js";

export class ExpenseOrchestrator {
  static async processMessage(client, msg, user) {
    const text = (msg.body || "").trim();

    // -----------------------------------------------------
    // 1. DETECT MESSAGE TYPE
    // -----------------------------------------------------
    const isBankAlert = this.looksLikeBankAlert(text);
    const isTypedExpense = this.looksLikeTypedExpense(text);

    let parsed = null;
    let source = null;

    // -----------------------------------------------------
    // 2. HANDLE BANK ALERTS (HIGHEST PRIORITY)
    // -----------------------------------------------------
    if (isBankAlert) {
      parsed = await parseBankAlert(text);

      // ❌ CREDIT ALERT (parseBankAlert returns null)
      if (parsed === null) {
        await client.sendText(
          msg.from,
          "⚠️ This appears to be a *credit alert*. Only debit alerts can be recorded as expenses."
        );
        return true;
      }

      // ❌ ALERT MISSING AMOUNT
      if (parsed?.error === "NO_AMOUNT") {
        await client.sendText(
          msg.from,
          "⚠️ I couldn't extract the *debit amount* from this alert.\nPlease resend the *full alert* exactly as received."
        );
        return true;
      }

      source = "bank-alert";
    }

    // -----------------------------------------------------
    // 3. HANDLE TYPED EXPENSES
    // -----------------------------------------------------
    else if (isTypedExpense) {
      try {
        parsed = await parseTypedExpense(text);
        source = "typed";
      } catch (err) {
        parsed = null;
      }
    }

    // -----------------------------------------------------
    // 4. NOT AN EXPENSE → LET OTHER HANDLERS CONTINUE
    // -----------------------------------------------------
    else {
      return false;
    }

    // -----------------------------------------------------
    // 5. FALLBACK PARSER (AI or typed parser failed)
    // -----------------------------------------------------
    if (!parsed) {
      parsed = quickExtract(text);
      parsed.notes = parsed.notes || "fallback parser";
      source = "fallback";
    }

    // -----------------------------------------------------
    // 6. BUSINESS RULE — ALL DATES = TODAY
    // -----------------------------------------------------
    parsed.date = new Date().toISOString().slice(0, 10);

    // -----------------------------------------------------
    // 7. SAVE TO DATABASE
    // -----------------------------------------------------
    const saved = await createExpenseRecord(user.id, parsed, source);

    // -----------------------------------------------------
    // 8. MESSAGE BACK TO USER
    // -----------------------------------------------------
    await client.sendText(
      msg.from,
      `✅ Expense recorded (${source}):
• Amount: ${parsed.amount ?? "N/A"} ${parsed.currency ?? ""}
• Merchant: ${parsed.merchant || "N/A"}
• Category: ${parsed.category || "other"}
• Date: ${parsed.date}`
    );

    return true;
  }

  // -----------------------------------------------------
  // DETECTION HELPERS
  // -----------------------------------------------------
  static looksLikeBankAlert(text) {
    // Covers: CR Amt, DR Amt, Debit!, Credit!, MC Loc POS, Acct:
    return /CR Amt|DR Amt|Debit!|Credit!|Acct:/i.test(text);
  }

  static looksLikeTypedExpense(text) {
    return (
      /\d/.test(text) &&
      /(paid|spent|bought|for|at|to|₦|\$|ngn|usd|£|€)/i.test(text)
    );
  }
}
