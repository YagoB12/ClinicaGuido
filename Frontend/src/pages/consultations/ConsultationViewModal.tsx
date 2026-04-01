import React, { useEffect, useState } from "react";
import {
  getPrescriptionById,
  type Prescription,
} from "../../services/prescriptionService";
import type { Consultation } from "../../types/consultation";

type Props = {
  open: boolean;
  onClose: () => void;
  consultation?: Consultation | null;     // Opción A
  prescriptionId?: number | null;         // Opción B
  seed?: { patientName?: string; patientIdentification?: string };
};

type PrescriptionWithConsultation = Prescription & { consultation?: Consultation | null };

function fmt(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function fmtUnits(c?: Consultation | null) {
  const t = typeof c?.temperature === "number" ? `${c!.temperature!.toFixed(1)} °C` : "—";
  const p = c?.bloodPressure ? `${c.bloodPressure} mmHg` : "—";
  const hr = typeof c?.heartRate === "number" ? `${c!.heartRate} bpm` : "—";
  const w = typeof c?.weight === "number" ? `${c!.weight} kg` : "—";
  let h = "—";
  if (typeof c?.height === "number") {
    h = c!.height! > 3 ? `${Math.round(c!.height!)} cm` : `${c!.height!.toFixed(2)} m`;
  }
  return { t, p, hr, w, h };
}

const ConsultationViewModal: React.FC<Props> = ({
  open,
  onClose,
  consultation,
  prescriptionId,
  seed,
}) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cons, setCons] = useState<Consultation | null>(null);

  useEffect(() => {
    if (!open) return;

    if (consultation) {
      setCons(consultation);
      setErr(null);
      setLoading(false);
      return;
    }

    if (prescriptionId != null) {
      let alive = true;
      setLoading(true);
      setErr(null);
      setCons(null);

      (async () => {
        try {
          const p = (await getPrescriptionById(prescriptionId)) as PrescriptionWithConsultation;
          if (!alive) return;
          setCons(p.consultation ?? null);
        } catch (e) {
          console.error(e);
          if (alive) setErr("No se pudo cargar la consulta.");
        } finally {
          if (alive) setLoading(false);
        }
      })();

      return () => { /* noop */ };
    }

    setCons(null);
  }, [open, consultation, prescriptionId]);

  if (!open) return null;

  const patientName = seed?.patientName ?? "—";
  const patientId   = seed?.patientIdentification ?? "—";
  const { t, p, hr, w, h } = fmtUnits(cons);

  return (
  
    <div className="conscope">
      <div className="modal-backdrop">
        <div className="modal" style={{ maxWidth: 920 }}>
          <div className="modal-title">
            Consulta{prescriptionId ? ` (receta #${prescriptionId})` : ""}
          </div>

          {loading && <div className="muted">Cargando…</div>}
          {!loading && err && <div className="alert-error">{err}</div>}

          {!loading && !err && (
            <>
              {/* Ficha de cabecera */}
              <div className="review-card section-gap">
                <div className="review-grid">
                  <div><b>Paciente:</b> {patientName}</div>
                  <div><b>Cédula:</b> {patientId}</div>
                  <div><b>ID Consulta:</b> {cons?.id ?? "—"}</div>
                  <div><b>Cita (ID):</b> {cons?.appointmentId ?? "—"}</div>
                </div>
              </div>

              {/* Razón / Diagnóstico */}
              <div className="review-card section-gap">
                <div className="review-title">Motivo y diagnóstico</div>
                <div className="grid-2">
                  <div className="field">
                    <label>Razón de consulta</label>
                    <textarea readOnly value={fmt(cons?.reasonConsultation)} />
                  </div>
                  <div className="field">
                    <label>Diagnóstico</label>
                    <textarea readOnly value={fmt(cons?.diagnostic)} />
                  </div>
                </div>
              </div>

              {/* Notas / Plan */}
              <div className="review-card section-gap">
                <div className="review-title">Notas y plan de tratamiento</div>
                <div className="grid-2">
                  <div className="field">
                    <label>Notas</label>
                    <textarea readOnly value={fmt(cons?.notes)} />
                  </div>
                  <div className="field">
                    <label>Plan de tratamiento</label>
                    <textarea readOnly value={fmt(cons?.treatmentPlan)} />
                  </div>
                </div>
              </div>

              {/* Signos vitales */}
              <div className="review-card section-gap">
                <div className="review-title">Signos vitales / medidas</div>
                <div className="vitals-grid">
                  <div className="vital-pill"><span className="lbl">Temperatura</span><span className="val">{t}</span></div>
                  <div className="vital-pill"><span className="lbl">Presión</span><span className="val">{p}</span></div>
                  <div className="vital-pill"><span className="lbl">Pulso</span><span className="val">{hr}</span></div>
                  <div className="vital-pill"><span className="lbl">Peso</span><span className="val">{w}</span></div>
                  <div className="vital-pill"><span className="lbl">Altura</span><span className="val">{h}</span></div>
                </div>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button className="btn-primary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationViewModal;
