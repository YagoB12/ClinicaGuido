import { useEffect, useRef, useState } from "react";
import { getMedicines, type MedicineBrief } from "../../services/medicineService";

interface MedicineSelectProps {
  onSelect: (m: MedicineBrief | null) => void;
  selected: MedicineBrief | null;
}

export default function MedicineSelect({ onSelect, selected }: MedicineSelectProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MedicineBrief[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comboRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!comboRef.current) return;
      if (!comboRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Cargar medicamentos con debounce
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    const t = setTimeout(async () => {
      try {
        const res = await getMedicines(query, true, true, 1, 10);
        if (!alive) return;
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      } catch (err) {
        if (!alive) return;
        console.error(err);
        setError("No se pudieron cargar los medicamentos.");
      } finally {
        if (alive) setLoading(false);
      }
    }, 300);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <div className="field">
      <label>Buscar medicamento *</label>

      <div className="combo" ref={comboRef}>
        <input
          className="combo-input"
          placeholder="Buscar por nombre, presentación o concentración…"
          value={selected ? selected.nameMedicine : query}
          onChange={(e) => {
            onSelect(null);
            setQuery(e.target.value);
          }}
          onFocus={() => setOpen(true)}
        />

        {open && (
          <div className="combo-list">
            {loading && <div className="combo-item muted">Cargando…</div>}
            {!loading && error && <div className="combo-item muted">{error}</div>}
            {!loading && !error && items.length === 0 && (
              <div className="combo-item muted">No se encontraron medicamentos.</div>
            )}
            {!loading &&
              !error &&
              items.map((m) => (
                <div
                  key={m.id}
                  className="combo-item"
                  onClick={() => {
                    onSelect(m);
                    setOpen(false);
                  }}
                >
                  <div className="line-strong">
                    {m.nameMedicine}{" "}
                    {m.typePresentation && (
                      <span style={{ opacity: 0.8 }}>
                        ({m.typePresentation})
                      </span>
                    )}
                  </div>
                  <div className="line-muted">
                    {m.concentration ? `${m.concentration} mg` : "—"} — Stock:{" "}
                    {m.availableQuantity}
                    {m.expirationDate ? ` — Vence: ${formatDate(m.expirationDate)}` : ""}
                  </div>
                </div>
              ))}
            {!loading && !error && total > items.length && (
              <div className="combo-item muted">
                Mostrando {items.length} de {total}. Reafine la búsqueda.
              </div>
            )}
          </div>
        )}
      </div>

      <small className="muted">
        Seleccione un medicamento del inventario disponible.
      </small>
    </div>
  );
}

// Formateo de fechas ISO -> dd/MM/yyyy
function formatDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}
