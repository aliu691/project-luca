import wppconnect from "@wppconnect-team/wppconnect";
import { WHATSAPP_SESSION_DIR, IS_PROD, IS_DEV } from "../core/config/env.js";
import { logger } from "../core/config/logger.js";
import messageHandler from "../features/whatsapp/message.handler.js";

let client = null;

export async function startWhatsapp() {
  try {
    logger.info("💬 Initializing WhatsApp session...");

    client = await wppconnect.create({
      session: "luca-session",
      folderNameToken: WHATSAPP_SESSION_DIR,

      catchQR: (qr) => {
        logger.info("📌 QR Code received. Scan to authenticate.");
        logger.info(qr);
      },

      headless: IS_PROD, // show browser in dev
      useChrome: true,
      autoClose: false,

      browserArgs: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });

    logger.info("🟢 WhatsApp connected!");

    client.onMessage((msg) => messageHandler(client, msg));

    return client;
  } catch (err) {
    logger.error("❌ WhatsApp init error: " + err);
  }
}

export function getClient() {
  return client;
}
