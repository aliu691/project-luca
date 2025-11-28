// src/features/expenses/expense.orchestrator.js

import { parseTypedExpense } from "./parsers/typedExpense.parser.js";
import { parseBankAlert } from "./parsers/bankAlerts.parser.js";
import { quickExtract } from "./expenses.util.js";
import { createExpenseRecord } from "./expenses.service.js";

export class ExpenseOrchestrator {
  static looksLikeBankAlert(text) {
    return /CR Amt|DR Amt|Debit!|Credit!|Acct:/i.test(text);
  }

  static looksLikeTypedExpense(text) {
    return (
      /\d/.test(text) &&
      /(paid|spent|bought|for|at|to|₦|\$|ngn|usd|£|€)/i.test(text)
    );
  }

  static async processMessage(client, msg, user) {
    const text = (msg.body || "").trim();

    const isBankAlert = ExpenseOrchestrator.looksLikeBankAlert(text);
    const isTypedExpense = ExpenseOrchestrator.looksLikeTypedExpense(text);

    let parsed = null;
    let source = null;

    // BANK ALERT
    if (isBankAlert) {
      parsed = await parseBankAlert(text);

      if (parsed === null) {
        await client.sendText(
          msg.from,
          "⚠️ This appears to be a *credit alert*. Only debit alerts can be recorded as expenses."
        );
        return true;
      }

      if (parsed?.error === "NO_AMOUNT") {
        await client.sendText(
          msg.from,
          "⚠️ I couldn't extract the *debit amount* from this alert.\nPlease send the full alert exactly as received."
        );
        return true;
      }

      source = "bank-alert";
    }

    // TYPED EXPENSE
    else if (isTypedExpense) {
      try {
        parsed = await parseTypedExpense(text);
        source = "typed";
      } catch (err) {
        parsed = null;
      }
    }

    // NOT AN EXPENSE
    else {
      return false;
    }

    // FALLBACK
    if (!parsed) {
      parsed = quickExtract(text);
      parsed.notes = parsed.notes || "fallback parser";
      source = "fallback";
    }

    // FORCE TODAY
    parsed.date = new Date().toISOString().slice(0, 10);

    const saved = await createExpenseRecord(user.id, parsed, source);

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
}
