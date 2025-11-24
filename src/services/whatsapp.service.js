import wppconnect from "@wppconnect-team/wppconnect";
import { WHATSAPP_SESSION_DIR } from "../config/env.js";
import messageHandler from "../handlers/message.handler.js";

let client = null;

async function startWhatsapp() {
  try {
    client = await wppconnect.create({
      session: "luca-session",

      // Render free tier will output QR in logs
      catchQR: (qr) => console.log("SCAN THIS QR:", qr),

      headless: true,

      folderNameToken: WHATSAPP_SESSION_DIR,

      useChrome: true,
      executablePath: "/usr/bin/google-chrome",

      browserArgs: [
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-zygote",
        "--single-process",
      ],

      puppeteerOptions: {
        ignoreDefaultArgs: ["--disable-extensions"],
      },

      debug: false,
    });

    console.log("🟢 WhatsApp connected!");

    client.onMessage((msg) => {
      console.log("📩 Received:", msg.body);
      messageHandler(client, msg);
    });
  } catch (err) {
    console.error("❌ WhatsApp init error:", err);
  }
}

export { startWhatsapp, client };
