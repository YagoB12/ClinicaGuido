import { useEffect, useMemo, useState } from "react";
import {
  addPrescriptionItem,
  deletePrescriptionItem,
  updatePrescriptionItem,
  getPrescriptionItems,
  type PrescriptionItem,
} from "../../services/prescriptionService";
import MedicineSelect from "./MedicineSelect";
import type { MedicineBrief } from "../../types/medicine";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import { collectBackendErrors } from "../../utils/apiErrors";

type Props = {
  prescriptionId: number;
  onChanged?: () => void;
};

type NewItemDraft = {
  medicine: MedicineBrief | null;
  dailyDose: string;
  frequency: string;
  days: number | "";
  quantity: number | "";
  itemObservation?: string;
};

type RowEdit = {
  medicineId: number;
  dailyDose: string;
  frequency: string;
  days: number | "";
  quantity: number | "";
  itemObservation?: string;
  editingMed?: boolean;
  selectedMed?: MedicineBrief | null;
};

// ===== Helpers =====
const blockNonIntegerKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (["e", "E", "+", "-", ".", ","].includes(e.key)) e.preventDefault();
};
const filterPasteInteger = (e: React.ClipboardEvent<HTMLInputElement>) => {
  const t = e.clipboardData.getData("text");
  if (!/^\d*$/.test(t)) e.preventDefault();
};
const preventWheel = (e: React.WheelEvent<HTMLInputElement>) => {
  (e.target as HTMLInputElement).blur();
  e.stopPropagation();
};
const parseIntOrEmpty = (v: string | number) => {
  if (v === "" || v === null || v === undefined) return "";
  const s = String(v);
  if (!/^\d+$/.test(s)) return "";
  const n = Number(s);
  return Number.isFinite(n) ? n : "";
};

function containsEmojiOrControl(s: string): boolean {
  for (const ch of s) {
    const u = ch.codePointAt(0)!;
    if (
      (u >= 0x1f300 && u <= 0x1faff) ||
      (u >= 0x1f1e6 && u <= 0x1f1ff) ||
      (u >= 0x2600 && u <= 0x27bf) ||
      (u >= 0xfe00 && u <= 0xfe0f) ||
      (u >= 0x1f900 && u <= 0x1f9ff) ||
      (u <= 0x1f && u !== 9 && u !== 10 && u !== 13)
    )
      return true;
  }
  return false;
}
const sanitizePlain = (s: string, max = 1000) =>
  s.trim().replace(/\s+/g, " ").slice(0, max);

export default function PrescriptionItemsEditor({ prescriptionId, onChanged }: Props) {
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Alta de nuevo ítem
  const [newMed, setNewMed] = useState<MedicineBrief | null>(null);
  const [newDraft, setNewDraft] = useState<NewItemDraft>({
    medicine: null,
    dailyDose: "",
    frequency: "",
    days: "",
    quantity: "",
    itemObservation: "",
  });

  const canAdd = useMemo(() => {
    return (
      newMed &&
      newDraft.dailyDose.trim().length > 0 &&
      newDraft.frequency.trim().length > 0 &&
      typeof newDraft.days === "number" &&
      newDraft.days > 0
    );
  }, [newMed, newDraft]);

  // Buffer de edición
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});

  const isRowValid = (r: RowEdit) =>
    r.medicineId > 0 &&
    r.dailyDose.trim().length > 0 &&
    r.frequency.trim().length > 0 &&
    typeof r.days === "number" &&
    r.days > 0;

  // ---------- CARGA ----------
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const list = await getPrescriptionItems(prescriptionId);
        if (!alive) return;

        const map = new Map<number, PrescriptionItem>();
        for (const it of list) {
          if (typeof it.id === "number") map.set(it.id, it);
        }
        const unique = Array.from(map.values());
        setItems(unique);

        const buf: Record<number, RowEdit> = {};
        unique.forEach((it) => {
          buf[it.id] = {
            medicineId: it.medicineInventoryId,
            dailyDose: it.dailyDose,
            frequency: it.frequency,
            days: it.treatmentDurationDays,
            quantity: typeof it.quantityTotal === "number" ? it.quantityTotal : "",
            itemObservation: it.itemObservation ?? "",
            editingMed: false,
            selectedMed: it.medicine
              ? {
                  id: it.medicine.id,
                  nameMedicine: it.medicine.nameMedicine,
                  typePresentation: it.medicine.typePresentation,
                  concentration: it.medicine.concentration,
                  availableQuantity: (it as any).medicine?.availableQuantity,
                }
              : null,
          };
        });
        setEdits(buf);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar los ítems de la receta.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [prescriptionId]);

  // ---------- helpers ----------
  const setEdit = <K extends keyof RowEdit>(id: number, key: K, value: RowEdit[K]) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  // ---------- acciones ----------
  const handleSaveRow = async (row: PrescriptionItem) => {
    const buf = edits[row.id];
    if (!buf || !isRowValid(buf)) {
      showErrorAlert("Completa dosis, frecuencia y días (> 0).");
      return;
    }

    const dd = sanitizePlain(buf.dailyDose, 100);
    const fr = sanitizePlain(buf.frequency, 100);
    const io = sanitizePlain(buf.itemObservation ?? "", 500);

    if (
      containsEmojiOrControl(buf.dailyDose) ||
      containsEmojiOrControl(buf.frequency) ||
      containsEmojiOrControl(buf.itemObservation ?? "")
    ) {
      setEdit(row.id, "dailyDose", dd);
      setEdit(row.id, "frequency", fr);
      setEdit(row.id, "itemObservation", io);
      await showErrorAlert(
        "Se removieron caracteres no permitidos en el ítem. Revise y vuelva a guardar."
      );
      return;
    }

    try {
      await updatePrescriptionItem(row.id, {
        medicineInventoryId: buf.medicineId,
        dailyDose: dd,
        frequency: fr,
        treatmentDurationDays: Number(buf.days),
        itemObservation: io || undefined,
        quantityTotal: buf.quantity === "" ? undefined : Number(buf.quantity),
      });

      setItems((prev) =>
        prev.map((it) =>
          it.id === row.id
            ? {
                ...it,
                dailyDose: dd,
                frequency: fr,
                treatmentDurationDays: Number(buf.days),
                itemObservation: io || undefined,
                quantityTotal: buf.quantity === "" ? undefined : Number(buf.quantity),
              }
            : it
        )
      );

      setEdit(row.id, "editingMed", false);
      onChanged?.();
      showSuccessAlert("Ítem actualizado correctamente.");
    } catch (e: any) {
      console.error(e);
      const msgs = collectBackendErrors(e);
      await showErrorAlert(msgs.map((m) => `• ${m}`).join("<br/>"));
    }
  };

  const handleDeleteRow = async (id: number) => {
    const ok = await showConfirmActionAlert("¿Eliminar este medicamento de la receta?");
    if (!ok) return;

    try {
      await deletePrescriptionItem(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      setEdits((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      onChanged?.();
      showSuccessAlert("El medicamento fue eliminado.");
    } catch (e: any) {
      console.error(e);
      const msgs = collectBackendErrors(e);
      await showErrorAlert(msgs.map((m) => `• ${m}`).join("<br/>"));
    }
  };

  const handleAdd = async () => {
    if (!newMed || !canAdd) {
      showErrorAlert("Selecciona un medicamento y completa los campos requeridos.");
      return;
    }

    const dd = sanitizePlain(newDraft.dailyDose, 100);
    const fr = sanitizePlain(newDraft.frequency, 100);
    const io = sanitizePlain(newDraft.itemObservation ?? "", 500);

    if (
      containsEmojiOrControl(newDraft.dailyDose) ||
      containsEmojiOrControl(newDraft.frequency) ||
      containsEmojiOrControl(newDraft.itemObservation ?? "")
    ) {
      setNewDraft((d) => ({ ...d, dailyDose: dd, frequency: fr, itemObservation: io }));
      await showErrorAlert(
        "Se removieron caracteres no permitidos en el ítem nuevo. Revise y vuelva a guardar."
      );
      return;
    }

    // ✅ Validación de stock solo al agregar
    if (
      typeof newDraft.quantity === "number" &&
      newMed.availableQuantity != null &&
      Number.isFinite(newMed.availableQuantity) &&
      newMed.availableQuantity >= 0 &&
      newDraft.quantity > newMed.availableQuantity
    ) {
      await showErrorAlert(
        `La cantidad (${newDraft.quantity}) supera el stock disponible (${newMed.availableQuantity}).`
      );
      return;
    }

    try {
      const created = await addPrescriptionItem(prescriptionId, {
        medicineInventoryId: newMed.id,
        dailyDose: dd,
        frequency: fr,
        treatmentDurationDays: Number(newDraft.days),
        itemObservation: io || undefined,
        quantityTotal: newDraft.quantity === "" ? undefined : Number(newDraft.quantity),
      });

      setItems((prev) => [...prev, created]);

      setEdits((prev) => ({
        ...prev,
        [created.id]: {
          medicineId: created.medicineInventoryId,
          dailyDose: created.dailyDose,
          frequency: created.frequency,
          days: created.treatmentDurationDays,
          quantity:
            typeof created.quantityTotal === "number" ? created.quantityTotal : "",
          itemObservation: created.itemObservation ?? "",
          editingMed: false,
          selectedMed: newMed,
        },
      }));

      setNewMed(null);
      setNewDraft({
        medicine: null,
        dailyDose: "",
        frequency: "",
        days: "",
        quantity: "",
        itemObservation: "",
      });

      onChanged?.();
      showSuccessAlert("Medicamento agregado a la receta.");
    } catch (e: any) {
      console.error(e);
      const msgs = collectBackendErrors(e);
      await showErrorAlert(msgs.map((m) => `• ${m}`).join("<br/>"));
    }
  };

  // ---------- render ----------
  return (
    <div className="form-grid" style={{ maxWidth: 1280 }}>
      <div className="review-title">Medicamentos de la receta</div>

      {loading && <div className="muted">Cargando ítems…</div>}
      {err && <div className="alert-error">{err}</div>}

      {!loading && !err && (
        <>
          {/* Alta de nuevo ítem */}
          <div className="grid-2">
            <div className="field">
              <div style={{ minWidth: 420 }}>
                <MedicineSelect selected={newMed} onSelect={setNewMed} />
              </div>
            </div>
            <div className="field" />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Dosis diaria *</label>
              <input
                className="cell-input"
                placeholder="500 mg"
                value={newDraft.dailyDose}
                onChange={(e) => {
                  const v = sanitizePlain(e.target.value, 100);
                  if (!containsEmojiOrControl(v))
                    setNewDraft((d) => ({ ...d, dailyDose: v }));
                }}
                maxLength={100}
              />
            </div>
            <div className="field">
              <label>Frecuencia *</label>
              <input
                className="cell-input"
                placeholder="cada 8 h"
                value={newDraft.frequency}
                onChange={(e) => {
                  const v = sanitizePlain(e.target.value, 100);
                  if (!containsEmojiOrControl(v))
                    setNewDraft((d) => ({ ...d, frequency: v }));
                }}
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Días *</label>
              <input
                className="cell-input"
                inputMode="numeric"
                pattern="\d*"
                placeholder="7"
                value={newDraft.days}
                onKeyDown={blockNonIntegerKeys}
                onPaste={filterPasteInteger}
                onWheel={preventWheel}
                onChange={(e) =>
                  setNewDraft((d) => ({
                    ...d,
                    days: parseIntOrEmpty(e.target.value) as any,
                  }))
                }
              />
            </div>
            <div className="field">
              <label>Cantidad total</label>
              <input
                className="cell-input"
                inputMode="numeric"
                pattern="\d*"
                placeholder="(opcional)"
                value={newDraft.quantity}
                onKeyDown={blockNonIntegerKeys}
                onPaste={filterPasteInteger}
                onWheel={preventWheel}
                onChange={(e) =>
                  setNewDraft((d) => ({
                    ...d,
                    quantity: parseIntOrEmpty(e.target.value) as any,
                  }))
                }
              />
              {typeof newMed?.availableQuantity === "number" && (
                <small className="muted">
                  Stock disponible: {newMed.availableQuantity}
                </small>
              )}
            </div>
          </div>

          <div className="field">
            <label>Observación ítem</label>
            <input
              className="cell-input"
              placeholder="Después de comida"
              value={newDraft.itemObservation || ""}
              onChange={(e) => {
                const v = sanitizePlain(e.target.value, 500);
                if (!containsEmojiOrControl(v))
                  setNewDraft((d) => ({ ...d, itemObservation: v }));
              }}
              maxLength={500}
            />
          </div>

          <div className="actions-right" style={{ gap: 8 }}>
            <button
              className="btn-primary"
              onClick={handleAdd}
              disabled={!canAdd}
            >
              Agregar medicamento
            </button>
          </div>

          {/* Tabla de ítems */}
          <div
            className="table-wrap"
            style={{ marginTop: 14, maxHeight: 480, overflowY: "auto" }}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Dosis</th>
                  <th>Frecuencia</th>
                  <th>Días</th>
                  <th>Cant.</th>
                  <th>Obs.</th>
                  <th className="nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No hay medicamentos en esta receta.
                    </td>
                  </tr>
                )}

                {items.map((it) => {
                  const buf = edits[it.id];

                  const name =
                    buf?.selectedMed?.nameMedicine ??
                    it.medicine?.nameMedicine ??
                    `#${it.medicineInventoryId}`;

                  const pres =
                    buf?.selectedMed?.typePresentation ??
                    it.medicine?.typePresentation ??
                    "";

                  const conc =
                    (buf?.selectedMed?.concentration ??
                      it.medicine?.concentration ??
                      null) != null
                      ? `${buf?.selectedMed?.concentration ??
                          it.medicine?.concentration} mg`
                      : "";

                  return (
                    <tr key={it.id}>
                      <td className="nowrap">
                        {!buf?.editingMed && (
                          <>
                            {name} {pres ? `(${pres})` : ""} {conc}{" "}
                            <button
                              className="btn-ghost"
                              onClick={() => setEdit(it.id, "editingMed", true)}
                            >
                              Cambiar
                            </button>
                          </>
                        )}
                        {buf?.editingMed && (
                          <div style={{ minWidth: 360 }}>
                            <MedicineSelect
                              selected={buf.selectedMed ?? null}
                              onSelect={(m) => {
                                setEdit(it.id, "selectedMed", m);
                                setEdit(it.id, "medicineId", m ? m.id : 0);
                              }}
                            />
                            <div className="muted">Selecciona uno para reemplazar.</div>
                          </div>
                        )}
                      </td>

                      <td>
                        <input
                          className="cell-input"
                          value={buf?.dailyDose ?? ""}
                          onChange={(e) => {
                            const v = sanitizePlain(e.target.value, 100);
                            if (!containsEmojiOrControl(v))
                              setEdit(it.id, "dailyDose", v);
                          }}
                          maxLength={100}
                        />
                      </td>

                      <td>
                        <input
                          className="cell-input"
                          value={buf?.frequency ?? ""}
                          onChange={(e) => {
                            const v = sanitizePlain(e.target.value, 100);
                            if (!containsEmojiOrControl(v))
                              setEdit(it.id, "frequency", v);
                          }}
                          maxLength={100}
                        />
                      </td>

                      <td style={{ maxWidth: 100 }}>
                        <input
                          className="cell-input"
                          inputMode="numeric"
                          pattern="\d*"
                          value={buf?.days ?? ""}
                          onKeyDown={blockNonIntegerKeys}
                          onPaste={filterPasteInteger}
                          onWheel={preventWheel}
                          onChange={(e) =>
                            setEdit(it.id, "days", parseIntOrEmpty(e.target.value) as any)
                          }
                        />
                      </td>

                      <td style={{ maxWidth: 120 }}>
                        <input
                          className="cell-input"
                          inputMode="numeric"
                          pattern="\d*"
                          value={buf?.quantity ?? ""}
                          onKeyDown={blockNonIntegerKeys}
                          onPaste={filterPasteInteger}
                          onWheel={preventWheel}
                          onChange={(e) =>
                            setEdit(it.id, "quantity", parseIntOrEmpty(e.target.value) as any)
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="cell-input"
                          value={buf?.itemObservation ?? ""}
                          onChange={(e) => {
                            const v = sanitizePlain(e.target.value, 500);
                            if (!containsEmojiOrControl(v))
                              setEdit(it.id, "itemObservation", v);
                          }}
                          maxLength={500}
                        />
                      </td>

                      <td
                        className="nowrap"
                        style={{ display: "flex", gap: 8 }}
                      >
                        <button
                          className="btn-secondary"
                          onClick={() => handleSaveRow(it)}
                        >
                          Guardar
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteRow(it.id)}
                        >
                          Eliminar
                        </button>
                        {buf?.editingMed && (
                          <button
                            className="btn-ghost"
                            onClick={() =>
                              setEdit(it.id, "editingMed", false)
                            }
                          >
                            Cancelar cambio
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
