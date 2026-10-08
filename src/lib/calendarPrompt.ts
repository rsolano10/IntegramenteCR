// Per-device memory for the calendar prompts (a convenience, not an
// authority — worst case a prompt shows once more).

// "Ya lo tengo" / added: the feed is a live subscription — once added,
// every new week shows up on its own, so the weekly prompt stops asking.
const suscritoKey = (userId: string) => `im-calendario-suscrito:${userId}`;
const semanaVistaKey = (userId: string, planId: string) => `im-semana-vista:${userId}:${planId}`;

export function calendarioSuscrito(userId: string): boolean {
  try {
    return localStorage.getItem(suscritoKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function marcarCalendarioSuscrito(userId: string) {
  try {
    localStorage.setItem(suscritoKey(userId), "1");
  } catch {
    // storage blocked
  }
}

export function semanaNuevaPendiente(userId: string, planId: string): boolean {
  if (calendarioSuscrito(userId)) return false;
  try {
    return localStorage.getItem(semanaVistaKey(userId, planId)) !== "1";
  } catch {
    return false;
  }
}

export function marcarSemanaVista(userId: string, planId: string) {
  try {
    localStorage.setItem(semanaVistaKey(userId, planId), "1");
  } catch {
    // storage blocked
  }
}
