// src/features/expenses/expense.orchestrator.js
import { parseTypedExpense } from "./parsers/typedExpense.parser.js";
import { parseBankAlert } from "./parsers/bankAlerts.parser.js";
import { quickExtract } from "./expenses.util.js";
import { createExpenseRecord } from "./expenses.service.js";

export class ExpenseOrchestrator {
  static async processMessage(client, msg, user) {
    const text = (msg.body || "").trim();

    const isBankAlert = this.looksLikeBankAlert(text);
    const isTypedExpense = this.looksLikeTypedExpense(text);

    let parsed = null;
    let source = null;

    // -----------------------------------------------------
    // 1. BANK ALERT FIRST — HIGHEST PRIORITY
    // -----------------------------------------------------
    if (isBankAlert) {
      parsed = await parseBankAlert(text);

      // ❌ CREDIT ALERT: parsed === null
      if (!parsed) {
        await client.sendText(
          msg.from,
          "⚠️ This appears to be a *credit alert*. Only debit alerts can be logged as expenses."
        );
        return true; // stop pipeline
      }

      source = "bank-alert";
    }

    // -----------------------------------------------------
    // 2. TYPED EXPENSE
    // -----------------------------------------------------
    else if (isTypedExpense) {
      parsed = await parseTypedExpense(text);
      source = "typed";
    }

    // -----------------------------------------------------
    // 3. NOT AN EXPENSE → LET OTHER HANDLERS RUN
    // -----------------------------------------------------
    else {
      return false;
    }

    // -----------------------------------------------------
    // 4. If parsed failed for a typed expense → fallback
    // -----------------------------------------------------
    if (!parsed && isTypedExpense) {
      parsed = quickExtract(text);
      parsed.notes = parsed.notes || "fallback parser";
      source = "fallback";
    }

    // -----------------------------------------------------
    // 5. Enforce today's date
    // -----------------------------------------------------
    parsed.date = new Date().toISOString().slice(0, 10);

    // -----------------------------------------------------
    // 6. Save to DB
    // -----------------------------------------------------
    const saved = await createExpenseRecord(user.id, parsed, source);

    await client.sendText(
      msg.from,
      `✅ Expense recorded (${source}):
• Amount: ${parsed.amount ?? "N/A"} ${parsed.currency ?? ""}
• Merchant: ${parsed.merchant ?? "N/A"}
• Category: ${parsed.category}
• Date: ${parsed.date}`
    );

    return true;
  }

  static looksLikeBankAlert(text) {
    return /CR Amt|DR Amt|Debit!|Credit!|Acct:/i.test(text);
  }

  static looksLikeTypedExpense(text) {
    return (
      /\d/.test(text) &&
      /(paid|spent|bought|for|at|to|₦|\$|ngn|usd)/i.test(text)
    );
  }
}
