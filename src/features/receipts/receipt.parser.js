// src/features/receipts/receipt.parser.js
// Turn OCR text into expense fields (amount, merchant, date, notes, raw_text)

export function parseReceiptToExpense(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid OCR text");
  }

  const raw = text.replace(/\r/g, "\n"); // normalize
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Helper: convert candidate numeric string to number
  function toNumber(s) {
    if (!s) return null;
    const cleaned = String(s).replace(/[^\d\.-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  // 1) Try multiple patterns to find a total/debit/amount value (most receipts)
  const joined = lines.join("\n").toLowerCase();

  const amountPatterns = [
    /total\s*ngn[:\s]*([-\d,]+\.\d{2})/i,
    /total[:\s]*ngn[:\s]*([-\d,]+\.\d{2})/i,
    /total[:\s]*([-\d,]+\.\d{2})/i,
    /grand total[:\s]*([-\d,]+\.\d{2})/i,
    /pos paid\s*ngn[:\s]*([-\d,]+\.\d{2})/i,
    /amt[:\s]*ngn[:\s]*([-\d,]+\.\d{2})/i,
    /amount[:\s]*ngn[:\s]*([-\d,]+\.\d{2})/i,
    /\bngn[-\s]*([0-9,]+\.\d{2})\b/i,
    /([0-9,]+\.\d{2})\s*$/m, // last numeric line with cents
  ];

  let amount = null;
  for (const re of amountPatterns) {
    const m = joined.match(re);
    if (m && m[1]) {
      amount = toNumber(m[1]);
      if (amount !== null) break;
    }
  }

  // 2) Merchant heuristics: take first non-empty uppercase-ish line that is not "invoice", "total", "pos", "thanks"
  let merchant = "";
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i];
    const low = l.toLowerCase();
    if (!low) continue;
    if (
      /invoice|total|thank|thanks|date|time|tel|phone|pos|change|ngn|amount|paid/.test(
        low
      )
    )
      continue;
    // ignore lines that are mostly numbers (invoice numbers, phone)
    if (/^[\d\W]+$/.test(l)) continue;
    // merchant candidate
    merchant = l;
    break;
  }

  // cleanup merchant: remove extra punctuation
  merchant = merchant.replace(/[^a-zA-Z0-9 &.\-']/g, "").trim();

  // 3) Date extraction (various formats)
  let date = null;
  // patterns for dd/mm/yyyy or dd-mm-yyyy or dd-mmm-yy etc
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/, // 27/11/2025 or 27-11-25
    /([A-Za-z]{3,9}\s*\d{1,2}[,]?\s*\d{4})/, // Nov 27 2025
    /(\d{4}-\d{2}-\d{2})/, // 2025-11-27
    /(\d{1,2}\s*-\s*[A-Za-z]{3}\s*-\s*\d{2,4})/, // 27-Nov-25
  ];
  for (const re of datePatterns) {
    const m = joined.match(re);
    if (m && m[1]) {
      // try to parse to yyyy-mm-dd
      const candidate = m[1].replace(/\./g, "-").trim();
      let parsed = null;
      // Normalize dd/mm/yyyy and dd-mm-yyyy
      if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(candidate)) {
        const parts = candidate.split(/[\/\-]/);
        if (parts.length === 3) {
          let [d, m, y] = parts;
          if (y.length === 2) y = "20" + y;
          // zero-pad
          const dd = String(d).padStart(2, "0");
          const mm = String(m).padStart(2, "0");
          parsed = `${y}-${mm}-${dd}`;
        }
      } else {
        // Try Date parse fallback
        const dt = new Date(candidate);
        if (!isNaN(dt)) {
          parsed = dt.toISOString().slice(0, 10);
        }
      }
      if (parsed) {
        date = parsed;
        break;
      }
    }
  }

  // 4) Normalize strings to avoid nulls (you requested empty strings)
  merchant = merchant || "";
  const notes = "";

  // 5) If amount is missing, throw (so orchestrator can inform user & not save)
  if (amount === null) {
    const err = new Error("NO_AMOUNT");
    err.code = "NO_AMOUNT";
    throw err;
  }

  return {
    amount,
    currency: "NGN",
    merchant,
    category: "other",
    date: date || new Date().toISOString().slice(0, 10),
    notes,
    raw_text: text,
  };
}
