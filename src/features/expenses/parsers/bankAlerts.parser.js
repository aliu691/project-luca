// src/features/expenses/parsers/bankAlerts.parser.js

export async function parseBankAlert(text) {
  const lower = text.toLowerCase();

  // ---------------------------------------------------
  // 0) Reject credit alerts completely
  // ---------------------------------------------------
  if (/cr amt|credit!/i.test(text)) return null;

  // ---------------------------------------------------
  // 1) Extract AMOUNT (handles: DR Amt:NGN-100,250.00)
  // ---------------------------------------------------
  // Matches:
  //  - DR Amt:3,300.00
  //  - Debit! Amt:NGN-100,250.00
  //  - DR Amt: NGN-5,500.00
  const amountMatch = text.match(
    /(?:DR|Debit!)\s*Amt:?[\s₦NGN-]*([\d,]+\.\d{2})/i
  );

  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : null;

  // ---------------------------------------------------
  // 2) Extract MERCHANT
  // ---------------------------------------------------
  let merchant = null;

  // (A) POS transactions → always return "POS"
  // Covers:
  //  - MC Loc POS Prch
  //  - POS Purchase
  //  - POS Withdrawal
  if (/pos/i.test(text)) {
    merchant = "POS";
  }

  // (B) NIP Transactions: NIP/SENDER NAME/FIP
  const nipMatch = text.match(/NIP\/([^\/\n]+)/i);
  if (!merchant && nipMatch) {
    const nipName = nipMatch[1].trim();
    merchant = isMostlyDigits(nipName) ? "" : nipName;
  }

  // (C) Desc field: Desc:onnify/ KIP:/xxxxxx
  const descMatch = text.match(/Desc:([^\n]+)/i);
  if (!merchant && descMatch) {
    const rawDesc = descMatch[1].trim();
    const cleanDesc = rawDesc.split("/")[0].trim(); // keep text before first slash
    merchant = isMostlyDigits(cleanDesc) ? "" : cleanDesc;
  }

  // Guarantee non-null string
  merchant = merchant || "";

  // ---------------------------------------------------
  // 3) Notes
  // ---------------------------------------------------
  const notes = descMatch ? descMatch[1].trim() : "";

  return {
    amount,
    currency: "NGN",
    merchant,
    category: "other",
    notes,
    raw_text: text,
  };
}

// ---------------------------------------------------
// Helper: detect merchants that are pure digits
// ---------------------------------------------------
function isMostlyDigits(str) {
  return /^[\d-]+$/.test(str);
}
