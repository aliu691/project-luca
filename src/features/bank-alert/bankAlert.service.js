import { extractBankAlert } from "./bankAlert.service.js";
import { fallbackBankAlertParser } from "./bankAlert.fallback.js";
import { prisma } from "../../core/db/prisma.js";
import { formatDateDDMMYYYY } from "../expenses/expenses.util.js";

export async function handleBankAlert(client, msg, user, text) {
  text = text.trim();

  // 1️⃣ HARD BLOCK — rejects credit BEFORE AI or fallback
  const isHardCredit = /(credit|cr\s*amt|cr\b|credited)/i.test(text);
  if (isHardCredit) {
    await client.sendText(
      msg.from,
      "❌ Credit alert detected.\nCredit inflows are not recorded as expenses."
    );
    return true;
  }

  // 2️⃣ Heuristic: looks like bank alert
  const looksLikeAlert =
    /(acct|dt:|bal:|dr\s*amt|pos|atm|cashout|transfer|nip)/i.test(text);

  if (!looksLikeAlert) return false;

  let parsed;

  // 3️⃣ Try AI extraction
  try {
    parsed = await extractBankAlert(text);
  } catch {
    parsed = fallbackBankAlertParser(text);
  }

  // 4️⃣ If AI/fallback *still* thinks it's credit → block
  if (parsed.type === "credit") {
    await client.sendText(
      msg.from,
      "❌ This is a credit alert.\nCredit transactions are not added as expenses."
    );
    return true;
  }

  // 5️⃣ If not debit → ignore
  if (parsed.type !== "debit") {
    await client.sendText(
      msg.from,
      "⚠️ Unable to detect debit transaction. Please send a valid debit alert."
    );
    return true;
  }

  // 6️⃣ Normalise date
  const today = new Date().toISOString().slice(0, 10);
  const dateISO = parsed.date || today;

  // 7️⃣ Save debit as expense
  const saved = await prisma.expense.create({
    data: {
      userId: user.id,
      amount: parsed.amount,
      currency: "NGN",
      merchant: parsed.merchant,
      category: "bank_alert",
      channel: parsed.channel,
      date: dateISO,
      notes: parsed.notes,
      rawText: text,
    },
  });

  // 8️⃣ Respond to user
  await client.sendText(
    msg.from,
    `🏦 Debit alert saved:
• Amount: ${parsed.amount} NGN
• Merchant: ${parsed.merchant ?? "N/A"}
• Channel: ${parsed.channel ?? "N/A"}
• Date: ${formatDateDDMMYYYY(dateISO)}`
  );

  console.log("💾 Bank debit saved:", saved);
  return true;
}
