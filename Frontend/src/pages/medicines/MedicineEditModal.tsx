// src/pages/medicines/MedicineEditModal.tsx
import { useState } from "react";
import type { Medicine, MedicineUpdate } from "../../types/medicine";
import { updateMedicine } from "../../services/medicineService";
import {
  showConfirmActionAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../utils/alerts";
import "../../styles/medicine.css";

// ===================== Helpers =====================
const TODAY_YYYY_MM_DD = new Date().toISOString().slice(0, 10);

function containsEmojiOrControl(s: string): boolean {
  for (const ch of s) {
    const u = ch.codePointAt(0)!;
    if (
      (u >= 0x1f300 && u <= 0x1faff) || // emojis
      (u >= 0x1f1e6 && u <= 0x1f1ff) || // flags
      (u >= 0x2600 && u <= 0x27bf) ||   // misc symbols
      (u >= 0xfe00 && u <= 0xfe0f) ||   // variation selectors
      (u >= 0x1f900 && u <= 0x1f9ff) || // supplemental
      (u <= 0x1f && u !== 9 && u !== 10 && u !== 13)
    )
      return true;
  }
  return false;
}

function normalizePlain(s: string, maxLen = 1000) {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length > maxLen) return { ok: false, value: t.slice(0, maxLen) };
  if (containsEmojiOrControl(t)) return { ok: false, value: t.replace(/[\p{C}\p{So}\p{Sk}]/gu, "") };
  return { ok: true, value: t };
}

// ===================== Componente principal =====================
interface Props {
  medicine: Medicine;
  onClose: (changed?: boolean) => void;
}

export default function MedicineEditModal({ medicine, onClose }: Props) {
  const [form, setForm] = useState<MedicineUpdate>({
    nameMedicine: medicine.nameMedicine,
    description: medicine.description || "",
    typePresentation: medicine.typePresentation || "",
    availableQuantity: medicine.availableQuantity,
    preparationDate: medicine.preparationDate || "",
    expirationDate: medicine.expirationDate || "",
    concentration: medicine.concentration ?? undefined,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof MedicineUpdate>(key: K, value: MedicineUpdate[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ===================== Validación =====================
  const validate = async (): Promise<boolean> => {
    const msgs: string[] = [];

    // Nombre
    if (!form.nameMedicine.trim())
      msgs.push("• El nombre del medicamento es requerido.");
    else if (form.nameMedicine.length > 200)
      msgs.push("• El nombre no puede superar 200 caracteres.");
    else if (containsEmojiOrControl(form.nameMedicine))
      msgs.push("• El nombre contiene caracteres no válidos.");

    // Presentación
    if (form.typePresentation && containsEmojiOrControl(form.typePresentation))
      msgs.push("• La presentación contiene caracteres no válidos.");

    // Descripción
    if (form.description && containsEmojiOrControl(form.description))
      msgs.push("• La descripción contiene caracteres no válidos.");

    // Cantidad
    if (form.availableQuantity < 0)
      msgs.push("• La cantidad disponible no puede ser negativa.");

    // Concentración
    if (form.concentration != null && form.concentration < 0)
      msgs.push("• La concentración no puede ser negativa.");

    // Fechas
    const prep = form.preparationDate ? new Date(form.preparationDate) : null;
    const exp = form.expirationDate ? new Date(form.expirationDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (prep && prep > today)
      msgs.push("• La fecha de preparación no puede ser futura.");

    if (prep && exp && exp < prep)
      msgs.push("• La fecha de expiración no puede ser anterior a la de preparación.");

    if (msgs.length > 0) {
      await showErrorAlert(msgs.join("\n"));
      return false;
    }

    return true;
  };

  // ===================== Guardar cambios =====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validate())) return;

    const confirmed = await showConfirmActionAlert(
      "Se guardarán los cambios de este medicamento."
    );
    if (!confirmed) return;

    const normName = normalizePlain(form.nameMedicine, 200);
    const normDesc = normalizePlain(form.description || "", 500);
    const normPres = normalizePlain(form.typePresentation || "", 100);

    try {
      setSaving(true);
      await updateMedicine(medicine.id, {
        nameMedicine: normName.value,
        description: normDesc.value || undefined,
        typePresentation: normPres.value || undefined,
        availableQuantity: Number(form.availableQuantity),
        preparationDate: form.preparationDate || undefined,
        expirationDate: form.expirationDate || undefined,
        concentration:
          form.concentration !== undefined && form.concentration !== null
            ? Number(form.concentration)
            : undefined,
      });

      await showSuccessAlert("Medicamento actualizado correctamente.");
      onClose(true);
    } catch (err) {
      console.error(err);
      await showErrorAlert("Error al actualizar el medicamento. Verifique los datos.");
    } finally {
      setSaving(false);
    }
  };

  // ===================== Render =====================
  return (
    <div className="rxscope">
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal">
          <h2 className="modal-title">Editar Medicamento</h2>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="grid-3">
              {/* Nombre */}
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Nombre *</label>
                <input
                  value={form.nameMedicine}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!containsEmojiOrControl(v)) set("nameMedicine", v);
                  }}
                  maxLength={200}
                />
              </div>

              {/* Presentación */}
              <div className="field">
                <label>Presentación</label>
                <input
                  value={form.typePresentation || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!containsEmojiOrControl(v)) set("typePresentation", v);
                  }}
                  maxLength={100}
                />
              </div>

              {/* Cantidad */}
              <div className="field">
                <label>Cantidad disponible *</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.availableQuantity}
                  onChange={(e) => set("availableQuantity", Number(e.target.value))}
                />
              </div>

              {/* Concentración */}
              <div className="field">
                <label>Concentración</label>
                <input
                  type="number"
                  step="any"
                  placeholder="500 (mg)"
                  value={form.concentration ?? ""}
                  onChange={(e) =>
                    set(
                      "concentration",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>

              {/* Preparación */}
              <div className="field">
                <label>Preparación</label>
                <input
                  type="date"
                  max={TODAY_YYYY_MM_DD}
                  value={form.preparationDate || ""}
                  onChange={(e) => set("preparationDate", e.target.value)}
                />
              </div>

              {/* Expiración */}
              <div className="field">
                <label>Expiración</label>
                <input
                  type="date"
                  value={form.expirationDate || ""}
                  onChange={(e) => set("expirationDate", e.target.value)}
                />
              </div>

              {/* Descripción */}
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Descripción</label>
                <textarea
                  rows={3}
                  value={form.description || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!containsEmojiOrControl(v)) set("description", v);
                  }}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => onClose()}
                disabled={saving}
              >
                Cancelar
              </button>
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
