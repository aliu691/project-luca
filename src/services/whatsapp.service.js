// src/services/whatsapp.service.js

import wppconnect from "@wppconnect-team/wppconnect";
import { WHATSAPP_SESSION_DIR, IS_PROD } from "../core/config/env.js";
import { logger } from "../core/config/logger.js";
import messageHandler from "../features/whatsapp/message.handler.js";

let client = null;

export async function startWhatsapp() {
  try {
    logger.info("💬 Initializing WhatsApp session...");

    client = await wppconnect.create({
      session: "luca-session",
      folderNameToken: WHATSAPP_SESSION_DIR,

      /** 🔥 SHOW QR IN TERMINAL */
      catchQR: (qr) => {
        logger.info("📌 QR Code received. Scan to authenticate.");
        logger.info(qr);
      },
      logQR: true,

      /** 🔥 VERY IMPORTANT FOR IMAGE/OCR FEATURES */
      autoDownload: true, // downloads full-res image
      browserSync: true, // ensures media comes with msg.mediaData
      throwErrorOnMissingListeners: false,

      puppeteerOptions: {
        headless: IS_PROD,
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-setuid-sandbox",
          "--disable-infobars",
          "--window-size=1280,800",
          "--disable-web-security",
        ],
      },

      useChrome: true,
      autoClose: false,
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
