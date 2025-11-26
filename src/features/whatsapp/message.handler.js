// import { normalizePhone } from "../../core/utils/phone.util.js";
// import { getOrCreateUser } from "../users/users.service.js";
// import { handleExpenseMessage } from "../expenses/expenses.service.js";

// export default async function messageHandler(client, msg) {
//   try {
//     if (msg.fromMe) return;

//     const phone = normalizePhone(msg.from);
//     if (!phone) return;

//     const text = (msg.body || "").trim();
//     console.log(`📨 Incoming message from ${phone}:`, text);

//     // 1. Ensure user exists
//     const user = getOrCreateUser(phone);

//     // 2. Route message to expenses feature (if applicable)
//     const wasHandled = await handleExpenseMessage(client, msg, user, text);
//     if (wasHandled) return;

//     // 3. Default fallback response
//     await client.sendText(
//       msg.from,
//       "I didn't detect an expense. Try: 'Spent ₦1500 at Spar yesterday'"
//     );
//   } catch (err) {
//     console.error("❌ Handler error:", err);
//     await client.sendText(msg.from, "⚠️ Something went wrong.");
//   }
// }

// src/handlers/message.handler.js

import { normalizePhone } from "../../core/utils/phone.util.js";
import { getOrCreateUser } from "../users/users.service.js";
import { handleExpenseMessage } from "../expenses/expenses.service.js";

export default async function messageHandler(client, msg) {
  try {
    if (msg.fromMe) return; // ignore echo

    const phone = normalizePhone(msg.from);
    if (!phone) return;

    const text = (msg.body || "").trim();
    console.log(`📨 Message from ${phone}:`, text);

    // Onboard user (this includes welcome message)
    const user = await getOrCreateUser(phone, client, msg);

    // Try to detect & handle expense
    const handled = await handleExpenseMessage(client, msg, user, text);
    if (handled) return;

    // Otherwise default reply
    await client.sendText(
      msg.from,
      "I didn’t detect an expense. Try: “Paid ₦3500 at Spar yesterday”."
    );
  } catch (err) {
    console.error("❌ Handler error:", err);
  }
}
