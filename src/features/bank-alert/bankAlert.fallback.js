export function fallbackBankAlertParser(text) {
  const isCredit = /(credit|cr\s*amt|cr:|cr\b)/i.test(text);
  const isDebit = /(debit|dr\s*amt|dr:|dr\b|pos|cashout|atm)/i.test(text);

  const amountMatch = text.match(/([\d,]+\.\d+|\d{3,})/);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : null;

  return {
    type: isCredit ? "credit" : "debit",
    amount,
    currency: "NGN",
    merchant: null,
    channel: null,
    date: null,
    notes: "fallback parser",
  };
}
