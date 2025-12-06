// src/features/whatsapp/message.handler.js

import { normalizePhone } from "../../core/utils/phone.util.js";
import { getOrCreateUser } from "../users/users.service.js";

import { SummaryOrchestrator } from "../summary/summary.orchestrator.js";
import { ReceiptOrchestrator } from "../receipts/receipt.orchestrator.js";
import { ExpenseOrchestrator } from "../expenses/expense.orchestrator.js";

export default async function messageHandler(client, msg) {
  try {
    if (msg.fromMe) return;

    const phone = normalizePhone(msg.from);
    if (!phone) return;

    const user = await getOrCreateUser(phone);

    const text = (msg.body || "").trim().toLowerCase();

    // ───────────────────────────────────────────────
    // 1️⃣ SUMMARY NLP (highest priority for text)
    // ───────────────────────────────────────────────
    if (msg.type === "chat" && text) {
      const summaryHandled = await SummaryOrchestrator.processMessage(
        client,
        msg,
        user
      );

      if (summaryHandled) return;
    }

    // ───────────────────────────────────────────────
    // 2️⃣ RECEIPT OCR (image messages)
    // ───────────────────────────────────────────────
    if (msg.type === "image") {
      const receiptHandled = await ReceiptOrchestrator.processMessage(
        client,
        msg,
        user
      );

      if (receiptHandled) return;
    }

    // ───────────────────────────────────────────────
    // 3️⃣ EXPENSE PIPELINE (bank alerts → typed → fallback)
    // ───────────────────────────────────────────────
    const expenseHandled = await ExpenseOrchestrator.processMessage(
      client,
      msg,
      user
    );

    if (!expenseHandled) {
      await client.sendText(
        msg.from,
        "I didn’t detect an expense. Try: “Spent ₦1500 at Spar”."
      );
    }
  } catch (e) {
    console.error("handler error:", e);
  }
}
