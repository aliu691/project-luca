import {
  loadUsers,
  saveUsers,
  findUserByPhone,
  createUser,
} from "../db/users.js";

import { normalizePhone } from "../utils/phone.util.js";

export default async function messageHandler(client, msg) {
  try {
    // 🛑 1. Prevent message loops (BOT → BOT)
    if (msg.fromMe) {
      console.log("⛔ Ignored echo message (from self)");
      return;
    }

    // 2. Extract normalized phone
    const phone = normalizePhone(msg.from);

    if (!phone) {
      console.log("⚠️ Ignored system or unsupported message:", msg.from);
      return;
    }

    const body = msg.body?.trim() || "";

    console.log(`📨 Incoming message from ${phone}:`, body);

    // 3. Check if user exists in DB
    const existingUser = findUserByPhone(phone);

    if (!existingUser) {
      const newUser = createUser(phone);
      console.log("🆕 New user created:", newUser);

      await client.sendText(
        msg.from,
        "👋 Welcome to LUCA! You're now registered."
      );
      return;
    }

    // 4. Returning user
    console.log("🙌 Returning user:", existingUser);

    await client.sendText(msg.from, "👍 Message received.");
  } catch (err) {
    console.error("❌ Message handler error:", err);
  }
}
