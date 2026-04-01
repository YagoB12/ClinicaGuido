// src/pages/prescriptions/PrescriptionEditModal.tsx
import { useEffect, useState } from "react";
import type { PrescriptionListItem } from "../../services/prescriptionService";
import {
  updatePrescription,
  getPrescriptionById,
} from "../../services/prescriptionService";
import PrescriptionItemsEditor from "./PrescriptionItemsEditor";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";

// ========= utilidades (mismas del create) =========
function containsEmojiOrControl(s: string): boolean {
  for (const ch of s) {
    const u = ch.codePointAt(0)!;
    if (
      (u >= 0x1f300 && u <= 0x1faff) || // emojis
      (u >= 0x1f1e6 && u <= 0x1f1ff) || // flags
      (u >= 0x2600 && u <= 0x27bf) ||   // misc symbols
      (u >= 0xfe00 && u <= 0xfe0f) ||   // variation selectors
      (u >= 0x1f900 && u <= 0x1f9ff) || // supplemental
      (u <= 0x1f && u !== 0x09 && u !== 0x0a && u !== 0x0d) // controles salvo tab/lf/cr
    )
      return true;
  }
  return false;
}

function normalizePlain(s: string, maxLen = 1000) {
  const t = s.trim().replace(/\s+/g, " ");
  // si es muy largo, corta; si trae emojis/control, los quita
  let value = t;
  if (value.length > maxLen) value = value.slice(0, maxLen);
  if (containsEmojiOrControl(value)) value = value.replace(/[\p{C}\p{So}\p{Sk}]/gu, "");
  return value;
}

function collectBackendErrors(err: any): string[] {
  const arr: string[] = [];
  const data = err?.response?.data ?? err?.data ?? err;
  if (!data) return ["Ocurrió un error desconocido."];

  if (typeof data.error === "string") arr.push(data.error);

  if (Array.isArray(data.errors)) {
    for (const e of data.errors) {
      const fname = e.field ? `${e.field}: ` : "";
      if (Array.isArray(e.errors)) for (const m of e.errors) arr.push(`${fname}${m}`);
    }
  }

  if (typeof data === "object" && !Array.isArray(data) && !data.error && !data.errors) {
    for (const k of Object.keys(data)) {
      const msgs = (data as any)[k];
      if (Array.isArray(msgs)) for (const m of msgs) arr.push(`${k}: ${m}`);
    }
  }

  if (arr.length === 0) arr.push("No se pudo actualizar. Revise los datos.");
  return arr;
}
// ========= fin utilidades =========

function formatDateDDMMYYYY(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

const ALLOWED_STATUSES = ["Emitida", "Revisada", "Entregada", "Anulada"] as const;

type Props = {
  open: boolean;
  item: PrescriptionListItem | null;
  onClose: () => void;
  onSaved: (updated: { id: number; status: string }) => void;
};

export default function PrescriptionEditModal({
  open,
  item,
  onClose,
  onSaved,
}: Props) {
  const [tab, setTab] = useState<"datos" | "medicamentos">("datos");

  // Campos editables de la receta
  const [status, setStatus] = useState<string>(item?.status ?? "Emitida");
  const [observation, setObservation] = useState<string>("");
  const [additionalInstructions, setAdditionalInstructions] =
    useState<string>("");

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar detalles cuando se abre el modal
  useEffect(() => {
    if (!open || !item) return;
    setTab("datos");
    setStatus(item.status);
    setLoadingDetails(true);

    (async () => {
      try {
        const full = await getPrescriptionById(item.id);
        setObservation(full.observation ?? "");
        setAdditionalInstructions(full.additionalInstructions ?? "");
        setStatus(full.status ?? item.status);
      } catch (e) {
        console.error(e);
        showErrorAlert("No se pudo cargar el detalle de la receta.");
      } finally {
        setLoadingDetails(false);
      }
    })();
  }, [open, item]);

  if (!open || !item) return null;

  const handleSaveDatos = async () => {
    // Normalizar textos y validar status permitido
    const obsClean = normalizePlain(observation, 1000);
    const instClean = normalizePlain(additionalInstructions, 1000);

    // avisar si se limpiaron cosas (emojis/control)
    if (obsClean !== observation || instClean !== additionalInstructions) {
      setObservation(obsClean);
      setAdditionalInstructions(instClean);
      await showErrorAlert(
        "Se removieron caracteres no permitidos en los textos. Revise y vuelva a guardar."
      );
      return;
    }

    if (!ALLOWED_STATUSES.includes(status as any)) {
      await showErrorAlert("Estado inválido.");
      return;
    }

    // Confirmación
    const confirmed = await showConfirmActionAlert(
      `¿Guardar cambios en la receta #${item.id}?`
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      await updatePrescription(item.id, {
        status,
        observation: obsClean || undefined,
        additionalInstructions: instClean || undefined,
      });
      onSaved({ id: item.id, status });
      await showSuccessAlert("La receta se actualizó correctamente.");
      onClose();
    } catch (e: any) {
      console.error(e);
      const msgs = collectBackendErrors(e);
      await showErrorAlert(msgs.map((m) => `• ${m}`).join("<br/>"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-title">Editar receta #{item.id}</div>

        <div className="tabs-header" style={{ marginBottom: 16 }}>
          <button
            className={`tab-button ${tab === "datos" ? "active" : ""}`}
            onClick={() => setTab("datos")}
          >
            Datos generales
          </button>
          <button
            className={`tab-button ${tab === "medicamentos" ? "active" : ""}`}
            onClick={() => setTab("medicamentos")}
          >
            Medicamentos
          </button>
        </div>

        {tab === "datos" && (
          <div className="modal-form">
            <div className="grid-2">
              <div className="field">
                <label>Paciente</label>
                <input value={item.patientName} readOnly />
              </div>
              <div className="field">
                <label>Cédula</label>
                <input value={item.patientIdentification} readOnly />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Fecha de emisión</label>
                <input value={formatDateDDMMYYYY(item.issueDate)} readOnly />
              </div>
              <div className="field">
                <label>Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={loadingDetails}
                >
                  {ALLOWED_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <small className="muted">
                  Estados permitidos: {ALLOWED_STATUSES.join(", ")}.
                </small>
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Observación</label>
                <textarea
                  placeholder="Observaciones generales de la receta…"
                  value={observation}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!containsEmojiOrControl(v)) setObservation(v);
                  }}
                  disabled={loadingDetails}
                  maxLength={1000}
                />
                <small className="muted"></small>
              </div>
              <div className="field">
                <label>Instrucciones adicionales</label>
                <textarea
                  placeholder="Indicaciones para el paciente…"
                  value={additionalInstructions}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!containsEmojiOrControl(v)) setAdditionalInstructions(v);
                  }}
                  disabled={loadingDetails}
                  maxLength={1000}
                />
                <small className="muted"></small>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveDatos}
                disabled={saving || loadingDetails}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}

        {tab === "medicamentos" && (
          <div style={{ marginTop: 8 }}>
            {/* En PrescriptionItemsEditor ya tienes inputs numéricos; 
                asegura aplicar las mismas defensas: bloquear e/E +-., paste solo dígitos, etc. */}
            <PrescriptionItemsEditor
              prescriptionId={item.id}
              onChanged={() => {
                /* refrescos opcionales */
              }}
            />
            <div className="modal-actions">
              <button className="btn-primary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
