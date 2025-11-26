// src/features/expenses/parsers/bankAlerts.parser.js

export async function parseBankAlert(text) {
  const lower = text.toLowerCase();

  // ─────────────────────────────
  // 1. REJECT CREDIT ALERTS
  // ─────────────────────────────
  if (/cr amt|credit!/i.test(text)) return null;

  // ─────────────────────────────
  // 2. EXTRACT DEBIT AMOUNT
  // Supports:
  //   DR Amt:3,300.00
  //   Amt:NGN-100,250.00
  //   Debit! Amt:NGN-200,000.00
  // ─────────────────────────────
  const amountMatch =
    text.match(/(?:DR|Debit!)\s*Amt:?[\s₦NGN-]*([\d,]+\.\d{2})/i) ||
    text.match(/Amt:\s*NGN-?([\d,]+\.\d{2})/i);

  if (!amountMatch) {
    // return special failure type so orchestrator does NOT save
    return { error: "NO_AMOUNT" };
  }

  const amount = Number(amountMatch[1].replace(/,/g, ""));

  // ─────────────────────────────
  // 3. MERCHANT EXTRACTION
  // ─────────────────────────────

  let merchant = "";

  // Rule 1: POS always becomes "POS"
  if (/pos/i.test(text)) {
    merchant = "POS";
  }

  // Rule 2: NIP format → extract name
  if (!merchant) {
    const nipMatch = text.match(/NIP\/([^\/\n]+)/i);
    if (nipMatch) {
      const nipName = nipMatch[1].trim();
      if (!isMostlyDigits(nipName)) merchant = nipName;
    }
  }

  // Rule 3: Desc field (fallback)
  const descMatch = text.match(/Desc:([^\n]+)/i);
  const desc = descMatch ? descMatch[1].split("/")[0].trim() : "";

  if (!merchant && desc && !isMostlyDigits(desc)) {
    merchant = desc;
  }

  // Fallback: ensure never null
  merchant = merchant || "";

  // ─────────────────────────────
  // 4. Notes
  // ─────────────────────────────
  const notes = desc || "";

  return {
    amount,
    currency: "NGN",
    merchant,
    category: "other",
    notes,
    raw_text: text,
  };
}

/**
 * Detect nonsense merchants like:
 *    "017907538812"
 *    "3107443566757120160"
 */
function isMostlyDigits(str) {
  return /^[\d-]+$/.test(str);
}
