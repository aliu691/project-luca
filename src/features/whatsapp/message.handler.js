import { normalizePhone } from "../../core/utils/phone.util.js";
import { getOrCreateUser } from "../users/users.service.js";
import { ExpenseOrchestrator } from "../expenses/expense.orchestrator.js";

export default async function messageHandler(client, msg) {
  try {
    if (msg.fromMe) return;

    const phone = normalizePhone(msg.from);
    if (!phone) return;

    const user = await getOrCreateUser(phone);

    // route to orchestrator
    const handled = await ExpenseOrchestrator.processMessage(client, msg, user);

    if (!handled) {
      await client.sendText(
        msg.from,
        "I didn’t detect an expense. Try: “Spent ₦1500 at Spar”."
      );
    }
  } catch (e) {
    console.error("handler error:", e);
  }
}
