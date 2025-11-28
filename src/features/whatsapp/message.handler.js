import { normalizePhone } from "../../core/utils/phone.util.js";
import { getOrCreateUser } from "../users/users.service.js";
import { SummaryOrchestrator } from "../summary/summary.orchestrator.js";
import { ExpenseOrchestrator } from "../expenses/expense.orchestrator.js";

export default async function messageHandler(client, msg) {
  try {
    if (msg.fromMe) return;

    const phone = normalizePhone(msg.from);
    if (!phone) return;

    const user = await getOrCreateUser(phone);

    // 1️⃣ Try Summary NLP first
    const summaryHandled = await SummaryOrchestrator.processMessage(
      client,
      msg,
      user
    );

    if (summaryHandled) return;

    // 2️⃣ Then expense processing (bank alerts, typed expenses, fallback)
    const expenseHandled = await ExpenseOrchestrator.processMessage(
      client,
      msg,
      user
    );

    if (!expenseHandled) {
      await client.sendText(
        msg.from,
        "I didn’t detect an expense. Try: “Spent ₦1500 at Spar”."
      );
    }
  } catch (e) {
    console.error("handler error:", e);
  }
}
