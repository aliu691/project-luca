import wppconnect from "@wppconnect-team/wppconnect";
import { WHATSAPP_SESSION_DIR } from "../config/env.js";
import messageHandler from "../handlers/message.handler.js";

let client = null;

export async function startWhatsapp() {
  try {
    client = await wppconnect.create({
      session: "luca-session",

      folderNameToken: WHATSAPP_SESSION_DIR,

      catchQR: (qrCode) => {
        console.log("\n\n📌 QR CODE RECEIVED (Scan this):\n");
        console.log(qrCode);
      },

      headless: false, // IMPORTANT: keep visible
      autoClose: false,

      useChrome: true,
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",

      browserArgs: ["--no-sandbox"],
    });

    console.log("🟢 WhatsApp connected!");

    client.onMessage((msg) => {
      console.log("📨 Incoming:", msg.from, "→", msg.body);
      messageHandler(client, msg);
    });

    return client;
  } catch (error) {
    console.error("❌ WhatsApp init error:", error);
  }
}

export function getClient() {
  return client;
}
