// src/features/receipts/receipt.orchestrator.js

import { extractReceiptOCR } from "./receipt.vision.js";
import { assignReceiptCategory } from "./receipt.category.js";
import { createExpenseRecord } from "../expenses/expenses.service.js";

export class ReceiptOrchestrator {
  static async processMessage(client, msg, user) {
    // Detect real images in WPPConnect
    const isImage =
      msg.type === "image" ||
      msg.mimetype?.startsWith?.("image/") ||
      msg.isMedia === true;

    if (!isImage) return false;

    console.log("📸 RECEIPT: Incoming image → decrypting...");

    try {
      // 1) Download full-res image from WhatsApp
      const buffer = await client.decryptFile(msg);

      if (!buffer || buffer.length < 1000) {
        console.error("❌ Could not decrypt image, buffer too small:", buffer);
        await client.sendText(
          msg.from,
          "⚠️ I couldn't download this image. Please resend it."
        );
        return true;
      }

      const mime = msg.mimetype || "image/jpeg";
      const base64 = buffer.toString("base64");

      console.log("📸 MIME:", mime);
      console.log("📸 Full image size:", buffer.length);

      // 2) Run OCR with Vision API
      const ocr = await extractReceiptOCR({ mime, base64 });

      console.log("📄 OCR OUTPUT:", ocr);

      if (!ocr || typeof ocr !== "object") {
        await client.sendText(
          msg.from,
          "⚠️ I couldn't read this receipt. Try sending a clearer photo."
        );
        return true;
      }

      // 3) Create expense object
      const parsed = {
        amount: ocr.amount ?? null,
        currency: ocr.currency || "NGN",
        merchant: ocr.merchant || "",
        notes: ocr.notes || "",
        raw_text: ocr.raw_text || "",
        category: ocr.category || "other",
      };

      // 4) Improve category inference
      parsed.category = await assignReceiptCategory(
        parsed.merchant,
        parsed.raw_text
      );

      // 5) Force today’s date
      parsed.date = new Date().toISOString().slice(0, 10);

      // 6) Save to DB
      await createExpenseRecord(user.id, parsed, "receipt");

      // 7) Reply
      await client.sendText(
        msg.from,
        `✅ Expense recorded (receipt):
• Amount: ${parsed.amount ?? "N/A"} ${parsed.currency}
• Merchant: ${parsed.merchant || "N/A"}
• Category: ${parsed.category}
• Date: ${parsed.date}`
      );

      return true;
    } catch (err) {
      console.error("Receipt OCR error:", err);
      await client.sendText(
        msg.from,
        "⚠️ I couldn't read this receipt. Please try a clearer photo."
      );
      return true;
    }
  }
}
