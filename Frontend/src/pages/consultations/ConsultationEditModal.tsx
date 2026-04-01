import React, { useState } from "react";
import type { Consultation, ConsultationUpdateDto } from "../../types/consultation";
import { updateConsultation } from "../../services/consultationService";
import {
  showConfirmActionAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../utils/alerts";
import "../../styles/consultationPage.css";

type Props = {
  consultation: Consultation;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const ConsultationEditModal: React.FC<Props> = ({
  consultation,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState<ConsultationUpdateDto>({
    reasonConsultation: consultation.reasonConsultation,
    diagnostic: consultation.diagnostic ?? "",
    notes: consultation.notes ?? "",
    treatmentPlan: consultation.treatmentPlan ?? "",
    temperature: consultation.temperature,
    bloodPressure: consultation.bloodPressure,
    heartRate: consultation.heartRate,
    weight: consultation.weight,
    height: consultation.height,
  });

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (!isOpen) return null;

  function setNumber<K extends keyof ConsultationUpdateDto>(k: K, v: string) {
    const n = v === "" ? undefined : Number(v);
    setForm((f) => ({ ...f, [k]: (Number.isNaN(n) ? undefined : n) as any }));
    setFieldErrors((fe) => ({ ...fe, [k as string]: [] }));
  }

  function setText<K extends keyof ConsultationUpdateDto>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v as any }));
    setFieldErrors((fe) => ({ ...fe, [k as string]: [] }));
  }

  function addFieldError(key: string, msg: string) {
    setFieldErrors((fe) => {
      const arr = fe[key] ? [...fe[key]] : [];
      if (!arr.includes(msg)) arr.push(msg);
      return { ...fe, [key]: arr };
    });
  }

  function validateFront(): string[] {
    const errs: string[] = [];
    setFieldErrors({});

    if (!form.reasonConsultation || !form.reasonConsultation.trim()) {
      addFieldError("reasonConsultation", "Este campo es requerido.");
      errs.push("ReasonConsultation es requerido.");
    }
    if (form.temperature != null && (form.temperature < 30 || form.temperature > 45)) {
      addFieldError("temperature", "Fuera de rango (30–45 °C).");
      errs.push("Temperatura fuera de rango (30–45 °C).");
    }
    if (form.bloodPressure != null && (form.bloodPressure < 40 || form.bloodPressure > 300)) {
      addFieldError("bloodPressure", "Fuera de rango (40–300 mmHg).");
      errs.push("Presión arterial fuera de rango (40–300 mmHg).");
    }
    if (form.heartRate != null && (form.heartRate < 20 || form.heartRate > 250)) {
      addFieldError("heartRate", "Fuera de rango (20–250 bpm).");
      errs.push("Pulso fuera de rango (20–250 bpm).");
    }
    if (form.weight != null && (form.weight < 0 || form.weight > 500)) {
      addFieldError("weight", "Fuera de rango (0–500 kg).");
      errs.push("Peso fuera de rango (0–500 kg).");
    }
    if (form.height != null && (form.height < 0 || form.height > 3.0)) {
      addFieldError("height", "Fuera de rango (0–3.0 m).");
      errs.push("Altura fuera de rango (0–3.0 m).");
    }

    return errs;
  }

  // 🟡 Envío del formulario con confirmación (misma lógica que MedicineEditModal)
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const errs = validateFront();
    if (errs.length > 0) {
      await showErrorAlert("Por favor ingrese valores válidos antes de continuar.");
      return;
    }

    const ok = await showConfirmActionAlert(
      "Se guardarán los cambios de esta consulta."
    );
    if (!ok) return;

    setSaving(true);
    try {
      await updateConsultation(consultation.id, {
        ...form,
        reasonConsultation: form.reasonConsultation.trim(),
        diagnostic: form.diagnostic?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        treatmentPlan: form.treatmentPlan?.trim() || undefined,
      });

      await showSuccessAlert("Consulta actualizada correctamente.");
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      await showErrorAlert("Error al actualizar la consulta.");
    } finally {
      setSaving(false);
    }
  }

  const fe = (k: keyof ConsultationUpdateDto) => fieldErrors[k as string]?.[0];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2 className="modal-title">Editar consulta #{consultation.id}</h2>

        <form onSubmit={onSubmit} className="modal-form">
          <div className="grid-2">
            <div className={`field ${fe("reasonConsultation") ? "has-error" : ""}`}>
              <label>Razón *</label>
              <input
                value={form.reasonConsultation}
                onChange={(e) => setText("reasonConsultation", e.target.value)}
                required
                placeholder="Motivo principal…"
              />
              {fe("reasonConsultation") && (
                <small className="error">{fe("reasonConsultation")}</small>
              )}
            </div>

            <div className={`field ${fe("diagnostic") ? "has-error" : ""}`}>
              <label>Diagnóstico</label>
              <input
                value={form.diagnostic ?? ""}
                onChange={(e) => setText("diagnostic", e.target.value)}
              />
              {fe("diagnostic") && (
                <small className="error">{fe("diagnostic")}</small>
              )}
            </div>

            <div className={`field ${fe("temperature") ? "has-error" : ""}`}>
              <label>Temperatura (°C)</label>
              <input
                type="number"
                step="1"
                min={30}
                max={45}
                value={form.temperature ?? ""}
                onChange={(e) => setNumber("temperature", e.target.value)}
                placeholder="30–45"
              />
              {fe("temperature") && (
                <small className="error">{fe("temperature")}</small>
              )}
            </div>

            <div className={`field ${fe("bloodPressure") ? "has-error" : ""}`}>
              <label>Presión (mmHg)</label>
              <input
                type="number"
                step="0.1"
                min={40}
                max={300}
                value={form.bloodPressure ?? ""}
                onChange={(e) => setNumber("bloodPressure", e.target.value)}
                placeholder="40–300"
              />
              {fe("bloodPressure") && (
                <small className="error">{fe("bloodPressure")}</small>
              )}
            </div>

            <div className={`field ${fe("heartRate") ? "has-error" : ""}`}>
              <label>Pulso (bpm)</label>
              <input
                type="number"
                step="0.1"
                min={20}
                max={250}
                value={form.heartRate ?? ""}
                onChange={(e) => setNumber("heartRate", e.target.value)}
                placeholder="20–250"
              />
              {fe("heartRate") && (
                <small className="error">{fe("heartRate")}</small>
              )}
            </div>

            <div className={`field ${fe("weight") ? "has-error" : ""}`}>
              <label>Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={500}
                value={form.weight ?? ""}
                onChange={(e) => setNumber("weight", e.target.value)}
                placeholder="0–500"
              />
              {fe("weight") && <small className="error">{fe("weight")}</small>}
            </div>

            <div className={`field ${fe("height") ? "has-error" : ""}`}>
              <label>Altura (m)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={3.0}
                value={form.height ?? ""}
                onChange={(e) => setNumber("height", e.target.value)}
                placeholder="0–3.0"
              />
              {fe("height") && <small className="error">{fe("height")}</small>}
            </div>

            <div className={`field col-span-2 ${fe("notes") ? "has-error" : ""}`}>
              <label>Notas</label>
              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setText("notes", e.target.value)}
              />
              {fe("notes") && <small className="error">{fe("notes")}</small>}
            </div>

            <div
              className={`field col-span-2 ${fe("treatmentPlan") ? "has-error" : ""}`}
            >
              <label>Plan de tratamiento</label>
              <textarea
                value={form.treatmentPlan ?? ""}
                onChange={(e) => setText("treatmentPlan", e.target.value)}
              />
              {fe("treatmentPlan") && (
                <small className="error">{fe("treatmentPlan")}</small>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationEditModal;
