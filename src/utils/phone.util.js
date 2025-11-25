// Normalize WhatsApp IDs into Nigerian E.164 phone numbers
export function normalizePhone(rawId) {
  if (!rawId) return null;

  // Ignore system / broadcast / groups
  if (
    rawId.includes("broadcast") ||
    rawId.includes("@g.us") ||
    rawId.includes("status")
  ) {
    return null;
  }

  // Standard WhatsApp user format
  if (rawId.endsWith("@c.us")) {
    const num = rawId.replace("@c.us", "");
    return cleanToE164(num);
  }

  // WPPConnect weird ID (@lid)
  if (rawId.endsWith("@lid")) {
    const num = rawId.replace("@lid", "");
    return cleanToE164(num);
  }

  return null;
}

function cleanToE164(num) {
  // remove leading 0
  if (num.startsWith("0")) num = num.slice(1);

  // ensure starts with 234
  if (!num.startsWith("234")) num = "234" + num;

  return num;
}
