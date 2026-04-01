// Devuelve "dd/MM/yyyy" a partir de "yyyy-MM-dd"
export const formatDMY = (isoDate?: string): string => {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
};

// Devuelve "HH:mm" a partir de "HH:mm:ss"
export const toHHmm = (hms?: string): string => (hms ? hms.slice(0, 5) : "");

// Normaliza para búsquedas: minusculas + sin acentos
export const normalizeStr = (s?: string): string =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    // elimina marcas diacríticas
    .replace(/[\u0300-\u036f]/g, "");
