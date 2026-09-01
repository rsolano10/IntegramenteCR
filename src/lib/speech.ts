// Browser built-in text-to-speech for the participant view — no backend
// needed. `cancel()` first so mashing "Escuchar" restarts instead of queuing.
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-CR";
  window.speechSynthesis.speak(utterance);
}
