// «hoy a las 10:15 a.m.», «ayer a las 6:40 p.m.», «el martes 11 a las 9:05 a.m.».
export function cuandoFue(iso: string, ahora = new Date()): string {
  const d = new Date(iso);
  const tz = "America/Costa_Rica";
  const dia = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: tz });
  // Como el resto de la app: «8:05 a.m.», «1:27 p.m.».
  const [h, m] = d.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).split(":").map(Number);
  const hora = `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}`;
  const ayer = new Date(ahora.getTime() - 864e5);
  if (dia(d) === dia(ahora)) return `hoy a las ${hora}`;
  if (dia(d) === dia(ayer)) return `ayer a las ${hora}`;
  const fecha = d.toLocaleDateString("es-CR", { timeZone: tz, weekday: "long", day: "numeric" });
  return `el ${fecha} a las ${hora}`;
}
