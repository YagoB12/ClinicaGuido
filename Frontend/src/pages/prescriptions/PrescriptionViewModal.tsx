// src/pages/prescriptions/PrescriptionViewModal.tsx
import React, { useEffect, useState } from "react";
import {
  getPrescriptionById,
  getPrescriptionItems,
  type Prescription,
  type PrescriptionItem,
} from "../../services/prescriptionService";

function formatDateDDMMYYYY(iso?: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

type Props = {
  open: boolean;
  id: number | null;
  onClose: () => void;
  seed?: {
    patientName?: string;
    patientIdentification?: string;
  };
};

const PrescriptionViewModal: React.FC<Props> = ({ open, id, onClose, seed }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Prescription | null>(null);
  const [items, setItems] = useState<PrescriptionItem[]>([]);

  useEffect(() => {
    if (!open || id == null) return;

    let alive = true;
    setLoading(true);
    setError(null);
    setData(null);
    setItems([]);

    (async () => {
      try {
        const [pres, presItems] = await Promise.all([
          getPrescriptionById(id),
          getPrescriptionItems(id),
        ]);
        if (!alive) return;
        setData(pres);
        setItems(presItems ?? []);
      } catch (e) {
        console.error(e);
        if (alive) setError("No se pudo cargar la receta.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [open, id]);

  if (!open) return null;

  const patientName = seed?.patientName ?? "—";
  const patientId = seed?.patientIdentification ?? "—";

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 900 }}>
        <div className="modal-title">Receta #{id}</div>

        {loading && <div className="muted">Cargando…</div>}
        {!loading && error && <div className="alert-error">{error}</div>}

        {!loading && !error && data && (
          <>
            <div className="review-card" style={{ marginBottom: 12 }}>
              <div className="review-grid">
                <div><b>Paciente:</b> {patientName}</div>
                <div><b>Cédula:</b> {patientId}</div>
                <div><b>Emitida:</b> {formatDateDDMMYYYY(data.issueDate)}</div>
                <div><b>Estado:</b> {data.status}</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Observación</label>
                <textarea readOnly value={data.observation ?? "—"} />
              </div>
              <div className="field">
                <label>Instrucciones adicionales</label>
                <textarea readOnly value={data.additionalInstructions ?? "—"} />
              </div>
            </div>

            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Medicamento</th>
                    <th>Dosis</th>
                    <th>Frecuencia</th>
                    <th>Días</th>
                    <th>Cant.</th>
                    <th>Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? (
                    items.map((it) => {
                      const med = it.medicine;
                      const name = med?.nameMedicine ?? `#${it.medicineInventoryId}`;
                      const pres = med?.typePresentation ? ` (${med.typePresentation})` : "";
                      const conc = typeof med?.concentration === "number" ? ` ${med.concentration} mg` : "";
                      return (
                        <tr key={it.id}>
                          <td>{name}{pres}{conc}</td>
                          <td>{it.dailyDose}</td>
                          <td>{it.frequency}</td>
                          <td>{it.treatmentDurationDays}</td>
                          <td>{typeof it.quantityTotal === "number" ? it.quantityTotal : "—"}</td>
                          <td>{it.itemObservation ?? "—"}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="muted">No hay medicamentos en esta receta.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionViewModal;
