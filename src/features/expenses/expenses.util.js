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
