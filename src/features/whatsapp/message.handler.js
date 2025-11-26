// import { normalizePhone } from "../../core/utils/phone.util.js";
// import { getOrCreateUser } from "../users/users.service.js";
// import { handleExpenseMessage } from "../expenses/expenses.service.js";

// export default async function messageHandler(client, msg) {
//   try {
//     if (msg.fromMe) return; // ignore echo

//     const phone = normalizePhone(msg.from);
//     if (!phone) return;

//     const text = (msg.body || "").trim();
//     console.log(`📨 Message from ${phone}:`, text);

//     // Onboard user (this includes welcome message)
//     const user = await getOrCreateUser(phone, client, msg);

//     // Try to detect & handle expense
//     const handled = await handleExpenseMessage(client, msg, user, text);
//     if (handled) return;

//     // Otherwise default reply
//     await client.sendText(
//       msg.from,
//       "I didn’t detect an expense. Try: “Paid ₦3500 at Spar yesterday”."
//     );
//   } catch (err) {
//     console.error("❌ Handler error:", err);
//   }
// }

// src/features/whatsapp/message.handler.js

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
