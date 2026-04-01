import { useEffect, useMemo, useRef, useState } from "react";
import { getEligibleConsultationsForPrescription } from "../../services/consultationService";

export type EligibleConsultation = {
  id: number;
  patientName: string;
  patientIdentification: string;
  appointmentDate: string;
  appointmentTime: string;
  officeNumber: string;
  reasonConsultation: string;
};

interface ConsultationSelectProps {
  onSelect: (c: EligibleConsultation | null) => void;
  selected: EligibleConsultation | null;
}

export default function ConsultationSelect({ onSelect, selected }: ConsultationSelectProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<EligibleConsultation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comboRef = useRef<HTMLDivElement>(null);

  // cerrar dropdown al click fuera
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!comboRef.current) return;
      if (!comboRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // carga con debounce
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    const t = setTimeout(async () => {
      try {
        const res = await getEligibleConsultationsForPrescription(query, 1, 10);
        if (!alive) return;
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      } catch (err) {
        if (!alive) return;
        console.error(err);
        setError("No se pudieron cargar las consultas elegibles.");
      } finally {
        if (alive) setLoading(false);
      }
    }, 300);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  const renderLine1 = (it: EligibleConsultation) =>
    `${it.patientName} (${it.patientIdentification}) — ${formatDate(it.appointmentDate)} ${it.appointmentTime} — ${it.officeNumber}`;

  const renderLine2 = (it: EligibleConsultation) =>
    `Motivo: ${it.reasonConsultation || "—"} — Consulta #${it.id}`;

  function formatDate(isoDate: string) {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  }

  return (
    <div className="field">
      <label>Consulta *</label>

      <div className="combo" ref={comboRef}>
        <input
          className="combo-input"
          placeholder="Buscar por nombre, cédula o fecha (dd/mm/aaaa)…"
          value={selected ? renderLine1(selected) : query}
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
              <div className="combo-item muted">No hay consultas elegibles.</div>
            )}
            {!loading &&
              !error &&
              items.map((it) => (
                <div
                  key={it.id}
                  className="combo-item"
                  onClick={() => {
                    onSelect(it);
                    setOpen(false);
                  }}
                >
                  <div className="line-strong">{renderLine1(it)}</div>
                  <div className="line-muted">{renderLine2(it)}</div>
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
        Esta receta queda ligada 1:1 a la consulta seleccionada.
      </small>
    </div>
  );
}
