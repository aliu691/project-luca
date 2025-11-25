// // src/handlers/message.handler.js

// import {
//   loadUsers,
//   saveUsers,
//   findUserByPhone,
//   createUser,
// } from "../db/users.js";

// // Loaded at runtime, kept in memory for speed
// let usersCache = loadUsers();

// // DEV ONLY — bypass weird WhatsApp IDs like @lid
// const DEV_WHITELIST = ["98817826851@lid"]; // add more if needed

// export default async function messageHandler(client, msg) {
//   try {
//     const from = msg.from;
//     const body = msg.body || "";

//     // 1️⃣ Ignore system messages
//     if (from === "status@broadcast") {
//       console.log("⚠️ Ignored system message:", from);
//       return;
//     }

//     // 2️⃣ Development bypass
//     if (DEV_WHITELIST.includes(from)) {
//       console.log("⚠️ DEV OVERRIDE — treating", from, "as valid user");
//     } else if (!from.endsWith("@c.us")) {
//       console.log("⚠️ Ignored non-user message from:", from);
//       return;
//     }

//     // 3️⃣ Extract phone number safely
//     const phone = from.replace("@c.us", "").replace("@lid", "");

//     console.log(`📨 Incoming message from ${phone}:`, body);

//     // 4️⃣ Check if user exists
//     let user = usersCache.find((u) => u.phone === phone);

//     if (!user) {
//       // 5️⃣ Create new user
//       user = createUser(phone);

//       // Update in-memory cache
//       usersCache = loadUsers();

//       console.log("🆕 New user created:", user);

//       // 6️⃣ Send welcome message
//       await client.sendText(
//         from,
//         "👋 Welcome to LUCA!\nYou're now registered."
//       );

//       return;
//     }

//     // 7️⃣ Returning user
//     //console.log("🙌 Returning user:", user);

//     await client.sendText(from, "👍 Message received.");
//   } catch (err) {
//     console.error("❌ Message handler error:", err);
//   }
// }

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
