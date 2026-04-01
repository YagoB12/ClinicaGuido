// src/utils/apiErrors.ts

/**
 * Formatos esperados del backend:
 * - { error: string }
 * - { errors: [{ field?: string, errors?: string[] }] }
 * - ModelState plano: { "Body.Items[0].QuantityTotal": ["mensaje 1", "mensaje 2"] }
 * - string o array de strings
 */

export type BackendErrorShape =
  | string
  | string[]
  | {
      error?: string;
      errors?: Array<{ field?: string; errors?: string[] }>;
      // ModelState u otras propiedades arbitrarias:
      [key: string]: any;
    };

function safeToArray(x: unknown): string[] {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter((s) => typeof s === "string") as string[];
  if (typeof x === "string") return [x];
  return [];
}

/**
 * Extrae un objeto de datos de error desde distintos tipos de errores (Axios, fetch, otros).
 */
function extractErrorData(err: any): BackendErrorShape | null {
  // Axios: err.response?.data
  if (err && err.response && err.response.data != null) return err.response.data;

  // fetch envuelto: err.data
  if (err && err.data != null) return err.data;

  // texto simple
  if (typeof err === "string") return err;

  // Error nativo con message
  if (err && typeof err.message === "string" && !err.response) return err.message;

  return null;
}

/**
 * Convierte diversos formatos de error del backend a una lista de mensajes (strings).
 */
export function collectBackendErrors(err: any): string[] {
  const messages: string[] = [];
  const data = extractErrorData(err);

  // Errores de red evidentes
  const status = err?.response?.status ?? err?.status;
  if (status === 0 || err?.message === "Network Error") {
    return ["No hay conexión con el servidor. Verifica tu red."];
  }

  // Si la respuesta es texto/array
  if (typeof data === "string") return data.trim() ? [data] : ["Ocurrió un error desconocido."];
  if (Array.isArray(data)) return data.length ? (data as string[]) : ["Ocurrió un error."];

  // Objeto estructurado
  if (data && typeof data === "object") {
    // 1) { error: "mensaje" }
    if (typeof (data as any).error === "string" && (data as any).error.trim()) {
      messages.push((data as any).error.trim());
    }

    // 2) { errors: [{ field, errors[] }] }
    if (Array.isArray((data as any).errors)) {
      for (const e of (data as any).errors) {
        const prefix = e?.field ? `${e.field}: ` : "";
        if (Array.isArray(e?.errors)) {
          for (const m of e.errors) if (typeof m === "string") messages.push(prefix + m);
        }
      }
    }

    // 3) ModelState plano: { key: ["msg1", "msg2"] }
    // (incluye cualquier otra propiedad que sea array de strings)
    for (const k of Object.keys(data as Record<string, unknown>)) {
      if (k === "error" || k === "errors") continue;
      const arr = safeToArray((data as any)[k]);
      for (const m of arr) messages.push(`${k}: ${m}`);
    }
  }

  // 4) Fallback con el mensaje general del error (si no hubo nada)
  if (messages.length === 0) {
    if (typeof err?.message === "string" && err.message.trim()) {
      messages.push(err.message.trim());
    }
  }

  // 5) Último recurso
  if (messages.length === 0) {
    messages.push("Operación rechazada. Revise los datos.");
  }

  // Normaliza: quita duplicados y recorta
  const seen = new Set<string>();
  return messages
    .map((m) => String(m).trim())
    .filter((m) => m)
    .filter((m) => {
      const key = m.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Devuelve un HTML con viñetas (•) para usar en SweetAlert (prop "html").
 */
export function errorsToBulletedHtml(errors: string[]): string {
  if (!errors || errors.length === 0) return "Ocurrió un error.";
  return errors.map((m) => `• ${escapeHtml(m)}`).join("<br/>");
}

/**
 * Shortcut: arma directamente el HTML desde el error crudo.
 */
export function buildErrorAlertHtml(err: any): string {
  return errorsToBulletedHtml(collectBackendErrors(err));
}

/**
 * Escapa caracteres peligrosos para HTML.
 */
function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
