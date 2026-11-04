// Funciones puras del hook auth-email (testeables fuera de Deno).

// Las plantillas usan la sintaxis de Go de Supabase. Solo hace falta el
// subconjunto que usan: variables y un {{ if .Data.nombre }}…{{ else }}…{{ end }}.
export function renderizar(html: string, vars: Record<string, string>, data: Record<string, unknown>): string {
  let out = html.replace(/\{\{\s*if \.Data\.(\w+)\s*\}\}([\s\S]*?)(?:\{\{\s*else\s*\}\}([\s\S]*?))?\{\{\s*end\s*\}\}/g, (_m, campo, si, no) =>
    data[campo] ? si : (no ?? ""),
  );
  out = out.replace(/\{\{\s*\.Data\.(\w+)\s*\}\}/g, (_m, campo) => escapar(String(data[campo] ?? "")));
  out = out.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (_m, v) => vars[v] ?? "");
  return out;
}

function escapar(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

// Texto plano a partir del HTML: sin estilos ni comentarios, los enlaces
// como "texto: url", párrafos en líneas separadas.
export function aTexto(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/i, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<div style="display:none[\s\S]*?<\/div>/i, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, txt) => {
      const t = txt.replace(/<[^>]+>/g, "").trim();
      if (href.startsWith("mailto:")) return t;
      return !t || t === href ? href : `${t}: ${href}`;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|tr|h\d|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l, i, arr) => l || (arr[i - 1] ?? "") !== "")
    .join("\n")
    .trim();
}

