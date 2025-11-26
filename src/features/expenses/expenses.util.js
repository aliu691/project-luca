export function quickExtract(rawText) {
  const r = {
    amount: null,
    currency: null,
    merchant: null,
    date: null,
    notes: "",
  };

  // amount patterns: ₦, NGN, $, numbers
  const amtMatch = rawText.match(
    /(?:₦|NGN|\bNGN\b|\$|USD|EUR)?\s*([0-9]{1,3}(?:[.,][0-9]{1,2})?(?:\s?[kK])?)/i
  );
  if (amtMatch) {
    let num = amtMatch[1].replace(/[,\s]/g, "");
    // handle k suffix
    if (/k$/i.test(num)) {
      num = Number(num.replace(/k$/i, "")) * 1000;
    }
    r.amount = Number(num);
    // currency heuristics
    if (/₦|NGN/i.test(amtMatch[0])) r.currency = "NGN";
    else if (/\$|USD/i.test(amtMatch[0])) r.currency = "USD";
  }

  // very naive date match dd/mm/yyyy or yyyy-mm-dd
  const dtMatch = rawText.match(
    /(\d{4}-\d{2}-\d{2})|(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/
  );
  if (dtMatch) {
    const dt = dtMatch[0];
    // normalize simple formats to ISO if possible
    if (/\d{4}-\d{2}-\d{2}/.test(dt)) {
      r.date = dt;
    } else {
      // try to parse dd/mm/yyyy
      const parts = dt.split(/[\/\-]/);
      let d = parts;
      if (parts[2].length === 2) parts[2] = "20" + parts[2];
      r.date = `${parts[2].padStart(4, "20")}-${parts[1].padStart(
        2,
        "0"
      )}-${parts[0].padStart(2, "0")}`;
    }
  }

  // merchant guess: "at XYZ", "to XYZ", "pay to XYZ"
  const merchantMatch = rawText.match(
    /\b(?:at|to|from|via|for)\s+([A-Za-z0-9&.\-\' ]{2,40})/i
  );
  if (merchantMatch) {
    r.merchant = merchantMatch[1].trim();
  }

  r.raw = rawText;
  return r;
}

export function formatDateDDMMYYYY(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function cleanAmount(input) {
  if (!input) return null;

  return Number(
    input
      .toString()
      .replace(/[₦,\s]/g, "")
      .replace(/[^\d.-]/g, "")
  );
}

// normalizeAmount(str) -> number | null
export function normalizeAmount(raw) {
  if (!raw && raw !== 0) return null;
  // raw can be like "NGN-100,250.00" or "3,300.00" or "DR Amt:3,300.00" or "CR Amt:300,000.00"
  const s = String(raw)
    .replace(/(NGN|USD|UGX|₦|\$|,|CR|DR|Amt|:|-)/gi, "") // remove currency/labels/commas/dashes
    .trim();

  // sometimes parser gives "100.00" or "100000.00"
  const n = parseFloat(s);
  if (Number.isFinite(n)) return Math.round(n); // store integer (smallest unit optional)
  return null;
}
