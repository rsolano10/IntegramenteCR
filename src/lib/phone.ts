// Costa Rica has no area codes — every mobile/landline number is 8 digits.
// WhatsApp's Cloud API requires E.164 (+506XXXXXXXX). Accepts whatever a
// caregiver naturally types (spaces, dashes, a leading +506 or not) and
// normalizes it; returns null when it doesn't look like a real CR number,
// so the caller can decide whether to block or just skip saving it.
export function normalizeCrPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 8) return `+506${digits}`;
  if (digits.length === 11 && digits.startsWith("506")) return `+${digits}`;
  return null;
}
