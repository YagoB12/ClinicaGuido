import { useMemo, useState, useEffect } from "react";
import ConsultationSelect from "./ConsultationSelect";
import type { EligibleConsultation } from "./ConsultationSelect";
import MedicineSelect from "./MedicineSelect";
import type { MedicineBrief } from "../../types/medicine";
import { createPrescription } from "../../services/prescriptionService";
import Swal from "sweetalert2";

type ItemRow = {
  id: number;
  medicine: MedicineBrief;
  dailyDose: string;
  frequency: string;
  days: number | "";
  quantity: number | "";
  itemObservation?: string;
};

// ===================== Helpers de validación front =====================
const TODAY_YYYY_MM_DD = new Date().toISOString().slice(0, 10);

// Bloquea emojis y caracteres de control
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
  if (t.length > maxLen) return { ok: false, value: t.slice(0, maxLen) };
  if (containsEmojiOrControl(t)) return { ok: false, value: t.replace(/[\p{C}\p{So}\p{Sk}]/gu, "") };
  return { ok: true, value: t };
}

// Previene notación científica/ signos/ punto en inputs numéricos
function blockNonIntegerKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  const bad = ["e", "E", "+", "-", ".", ","];
  if (bad.includes(e.key)) e.preventDefault();
}
function filterPasteInteger(e: React.ClipboardEvent<HTMLInputElement>) {
  const text = e.clipboardData.getData("text");
  if (!/^\d*$/.test(text)) e.preventDefault();
}
// Evita que la ruedita cambie el valor
function preventWheel(e: React.WheelEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).blur();
  e.stopPropagation();
}

function parseIntOrEmpty(v: string | number): number | "" {
  if (v === "" || v === null || v === undefined) return "";
  const s = String(v);
  if (!/^\d+$/.test(s)) return "";
  const n = Number(s);
  return Number.isFinite(n) ? n : "";
}

function isValidDateNotFuture(yyyy_mm_dd: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(yyyy_mm_dd) && yyyy_mm_dd <= TODAY_YYYY_MM_DD;
}

function collectBackendErrors(err: any): string[] {
  const arr: string[] = [];
  const data = err?.response?.data ?? err?.data ?? err;
  if (!data) return ["Ocurrió un error desconocido."];

  // Caso { error: "mensaje" }
  if (typeof data.error === "string") arr.push(data.error);

  // Caso { errors: [ { field, errors: [...] } ] }
  if (Array.isArray(data.errors)) {
    for (const e of data.errors) {
      const fname = e.field ? `${e.field}: ` : "";
      if (Array.isArray(e.errors)) {
        for (const m of e.errors) arr.push(`${fname}${m}`);
      }
    }
  }

  // Caso ModelState plano
  if (typeof data === "object" && !Array.isArray(data) && !data.error && !data.errors) {
    for (const k of Object.keys(data)) {
      const msgs = data[k];
      if (Array.isArray(msgs)) for (const m of msgs) arr.push(`${k}: ${m}`);
    }
  }

  if (arr.length === 0) arr.push("No se pudo guardar. Revise los datos.");
  return arr;
}

export default function PrescriptionForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedConsultation, setSelectedConsultation] =
    useState<EligibleConsultation | null>(null);
  const [issueDate, setIssueDate] = useState<string>("");
  const [observation, setObservation] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");

  const [selectedMedicine, setSelectedMedicine] =
    useState<MedicineBrief | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);

  const [loading, setLoading] = useState(false);

 // dentro de PrescriptionForm
function todayYMD() {
  return new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd en local
}

useEffect(() => {
  const handlePrefill = (ev: any) => {
    const data = ev.detail ?? {};

    // SIEMPRE poner la fecha de hoy, tenga o no tenga consulta
    setIssueDate(todayYMD());

    // Solo si viene consulta, la precargo
    if (data.consultationId) {
      const prefillConsultation: EligibleConsultation = {
        id: data.consultationId,
        patientName: data.patientName || "—",
        patientIdentification: data.patientIdentification || "—",
        appointmentDate: data.appointmentDate || "",
        appointmentTime: data.appointmentTime || "",
        officeNumber: data.officeNumber || "",
        reasonConsultation: data.reasonConsultation || "",
      };
      setSelectedConsultation(prefillConsultation);
    }
  };

  window.addEventListener("prescriptions:prefill", handlePrefill);
  return () => window.removeEventListener("prescriptions:prefill", handlePrefill);
}, []);

// además, al montar el formulario, asegúrate que tenga hoy (por si el evento no llegó aún)
useEffect(() => {
  setIssueDate((d) => d || todayYMD());
}, []);


  // ====== Validaciones de paso 1 (incluye evitar fecha futura) ======
  const canContinueStep1 = useMemo(() => {
    if (!selectedConsultation) return false;
    if (!issueDate || !isValidDateNotFuture(issueDate)) return false;
    // Limpieza previa de emojis/control en textos (no bloquea, solo pre-normaliza)
    return true;
  }, [selectedConsultation, issueDate]);

  const isRowValid = (row: ItemRow) =>
    row.medicine?.id > 0 &&
    row.dailyDose.trim().length > 0 &&
    row.frequency.trim().length > 0 &&
    typeof row.days === "number" &&
    row.days > 0;

  const canContinueStep2 = useMemo(() => {
    if (items.length === 0) return false;
    return items.every(isRowValid);
  }, [items]);

  const formatDateDDMMYYYY = (yyyy_mm_dd: string) => {
    const [y, m, d] = yyyy_mm_dd.split("-");
    return y && m && d ? `${d}/${m}/${y}` : yyyy_mm_dd;
  };

  const existsInItems = (id: number) => items.some((r) => r.id === id);

  const handleAddMedicine = () => {
    if (!selectedMedicine) {
      Swal.fire({
        icon: "info",
        title: "Seleccione un medicamento",
        text: "Busque y seleccione un medicamento para poder agregarlo.",
        confirmButtonColor: "#03346E",
      });
      return;
    }

    if (existsInItems(selectedMedicine.id)) {
      Swal.fire({
        icon: "warning",
        title: "Ya está en la lista",
        text: "Este medicamento ya fue agregado a la receta.",
        confirmButtonColor: "#03346E",
      });
      return;
    }

    const newRow: ItemRow = {
      id: selectedMedicine.id,
      medicine: selectedMedicine,
      dailyDose: "",
      frequency: "",
      days: "",
      quantity: "",
      itemObservation: "",
    };

    setItems((prev) => [...prev, newRow]);
    setSelectedMedicine(null);
  };

  const updateRow = <K extends keyof ItemRow>(
    id: number,
    key: K,
    value: ItemRow[K]
  ) => {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  };

  const removeRow = (id: number) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  // ====== Paso 1 next con mensajes claros ======
  const handleNextFromStep1 = async () => {
    if (canContinueStep1) {
      setStep(2);
      return;
    }
    const msgs: string[] = [];
    if (!selectedConsultation) msgs.push("• Seleccione una consulta.");
    if (!issueDate) msgs.push("• Ingrese la fecha de emisión.");
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate))
      msgs.push("• La fecha debe tener el formato válido (aaaa-mm-dd).");
    else if (issueDate > TODAY_YYYY_MM_DD)
      msgs.push("• La fecha de emisión no puede ser futura.");
    await Swal.fire({
      icon: "warning",
      title: "Faltan datos",
      html: msgs.join("<br/>"),
      confirmButtonColor: "#03346E",
    });
  };

  const handleNextFromStep2 = async () => {
    if (canContinueStep2) {
      setStep(3);
      return;
    }
    await Swal.fire({
      icon: "warning",
      title: "Complete los medicamentos",
      html: "Agregue al menos un medicamento y complete:<br/>• Dosis diaria<br/>• Frecuencia<br/>• Días (> 0)",
      confirmButtonColor: "#03346E",
    });
  };

  const handleSave = async () => {
    if (!selectedConsultation) return;

    // Limpieza/validación de textos globales
    const obsNorm = normalizePlain(observation, 1000);
    const instNorm = normalizePlain(instructions, 1000);
    if (!obsNorm.ok || !instNorm.ok) {
      await Swal.fire({
        icon: "warning",
        title: "Texto inválido",
        text: "Observación o instrucciones contienen emojis o caracteres no permitidos.",
        confirmButtonColor: "#03346E",
      });
      // Aún así aplicamos la versión normalizada para que el usuario no pierda lo escrito
      if (obsNorm.value !== undefined) setObservation(obsNorm.value);
      if (instNorm.value !== undefined) setInstructions(instNorm.value);
      return;
    }

    // Validar filas (evita enviar basuras)
    for (const r of items) {
      if (!isRowValid(r)) {
        await Swal.fire({
          icon: "warning",
          title: "Medicamento incompleto",
          text: `Revise "${r.medicine?.nameMedicine ?? "Medicamento"}": dosis, frecuencia y días (> 0).`,
          confirmButtonColor: "#03346E",
        });
        return;
      }
      if (r.quantity !== "" && typeof r.quantity === "number" && r.quantity <= 0) {
        await Swal.fire({
          icon: "warning",
          title: "Cantidad inválida",
          text: `La cantidad total debe ser mayor a 0 si se indica.`,
          confirmButtonColor: "#03346E",
        });
        return;
      }

      // Normaliza textos de cada fila
      const dd = normalizePlain(r.dailyDose, 100);
      const fr = normalizePlain(r.frequency, 100);
      const io = normalizePlain(r.itemObservation ?? "", 500);
      if (!dd.ok || !fr.ok || !io.ok) {
        await Swal.fire({
          icon: "warning",
          title: "Texto de medicamento inválido",
          text: "Dosis, frecuencia u observación del ítem contienen emojis o caracteres no permitidos.",
          confirmButtonColor: "#03346E",
        });
        updateRow(r.id, "dailyDose", dd.value);
        updateRow(r.id, "frequency", fr.value);
        updateRow(r.id, "itemObservation", io.value);
        return;
      }
    }

    const dto = {
      consultationId: selectedConsultation.id,
      observation: obsNorm.value,
      additionalInstructions: instNorm.value,
      items: items.map((r) => ({
        medicineInventoryId: r.medicine.id,
        dailyDose: r.dailyDose.trim(),
        frequency: r.frequency.trim(),
        treatmentDurationDays: Number(r.days),
        itemObservation: (r.itemObservation ?? "").trim() || undefined,
        quantityTotal:
          r.quantity === "" ? undefined : Number(r.quantity),
      })),
    };

    try {
      setLoading(true);
      await createPrescription(dto);

      await Swal.fire({
        icon: "success",
        title: "Receta creada",
        text: `Se creó la receta correctamente.`,
        confirmButtonColor: "#03346E",
      });

      // limpiar y volver al inicio
      setStep(1);
      setSelectedConsultation(null);
      setIssueDate("");
      setObservation("");
      setInstructions("");
      setItems([]);

      // pedir a la página que cambie a "Lista de Recetas"
      window.dispatchEvent(new CustomEvent("prescriptions:goList"));
    } catch (err: any) {
      console.error(err);
      const msgs = collectBackendErrors(err);
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        html: msgs.map((m) => `• ${m}`).join("<br/>"),
        confirmButtonColor: "#03346E",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-grid" style={{ maxWidth: 1200 }}>
      <style>{`.hide-helper small{display:none !important;}`}</style>

      <div className="stepper">
        <StepDot n={1} label="Datos generales" active={step === 1} done={step > 1} />
        <StepDot n={2} label="Medicamentos" active={step === 2} done={step > 2} />
        <StepDot n={3} label="Revisión" active={step === 3} done={false} />
      </div>

      {step === 1 && (
        <>
          <div className="grid-2">
            <div className="hide-helper">
              <ConsultationSelect
                selected={selectedConsultation}
                onSelect={setSelectedConsultation}
              />
            </div>

           <div className="field">
  <label>Fecha de emisión *</label>
  <input
    type="date"
    lang="es-CR"
    value={issueDate}
    readOnly
    disabled
    style={{ backgroundColor: "#f9f9f9", color: "#444", cursor: "not-allowed" }}
  />
  <small className="muted">
    La fecha de emisión se asigna automáticamente al día de hoy.
  </small>
</div>

          </div>

          <div className="grid-2">
            <div className="field">
              <label>Observación</label>
              <textarea
                placeholder="Indicaciones generales, notas…"
                value={observation}
                onChange={(e) => {
                  const { value } = e.target;
                  // Limpieza on-the-fly (no deja meter emojis)
                  if (!containsEmojiOrControl(value)) setObservation(value);
                }}
              />
              <small className="muted">Opcional. Texto que aparecerá en la receta.</small>
            </div>
            <div className="field">
              <label>Instrucciones adicionales</label>
              <textarea
                placeholder="Recomendaciones al paciente…"
                value={instructions}
                onChange={(e) => {
                  const { value } = e.target;
                  if (!containsEmojiOrControl(value)) setInstructions(value);
                }}
              />
              <small className="muted">Opcional. Indicaciones específicas para el paciente.</small>
            </div>
          </div>

          <div className="actions-right" style={{ gap: 8 }}>
            <button className="btn-primary" onClick={handleNextFromStep1}>
              Siguiente
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="grid-2">
            <div className="field">
              <MedicineSelect
                selected={selectedMedicine}
                onSelect={setSelectedMedicine}
              />
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button className="btn-ghost" onClick={handleAddMedicine}>
                Agregar medicamento
              </button>
              <small className="muted">Seleccione un medicamento y agréguelo a la tabla.</small>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="nowrap">Medicamento</th>
                  <th>Presentación</th>
                  <th>Concentración</th>
                  <th>Dosis diaria *</th>
                  <th>Frecuencia *</th>
                  <th>Días *</th>
                  <th>Cant. total</th>
                  <th>Obs. ítem</th>
                  <th className="nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="muted">
                      No hay medicamentos agregados.
                    </td>
                  </tr>
                )}
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.medicine.nameMedicine}</td>
                    <td>{row.medicine.typePresentation || "—"}</td>
                    <td>
                      {typeof row.medicine.concentration === "number"
                        ? `${row.medicine.concentration} mg`
                        : "—"}
                    </td>
                    <td>
                      <input
                        className="cell-input"
                        placeholder="500 mg"
                        value={row.dailyDose}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!containsEmojiOrControl(v))
                            updateRow(row.id, "dailyDose", v);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="cell-input"
                        placeholder="cada 8 h"
                        value={row.frequency}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!containsEmojiOrControl(v))
                            updateRow(row.id, "frequency", v);
                        }}
                      />
                    </td>
                    <td style={{ maxWidth: 80 }}>
                      <input
                        className="cell-input"
                        inputMode="numeric"
                        pattern="\d*"
                        placeholder="7"
                        value={row.days}
                        onKeyDown={blockNonIntegerKeys}
                        onPaste={filterPasteInteger}
                        onWheel={preventWheel}
                        onChange={(e) => {
                          const parsed = parseIntOrEmpty(e.target.value);
                          updateRow(row.id, "days", parsed as any);
                        }}
                      />
                    </td>
                    <td style={{ maxWidth: 100 }}>
                      <input
                        className="cell-input"
                        inputMode="numeric"
                        pattern="\d*"
                        placeholder="(opcional)"
                        value={row.quantity}
                        onKeyDown={blockNonIntegerKeys}
                        onPaste={filterPasteInteger}
                        onWheel={preventWheel}
                        onChange={(e) => {
                          const parsed = parseIntOrEmpty(e.target.value);
                          updateRow(row.id, "quantity", parsed as any);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="cell-input"
                        placeholder="Después de comida"
                        value={row.itemObservation || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!containsEmojiOrControl(v))
                            updateRow(row.id, "itemObservation", v);
                        }}
                      />
                    </td>
                    <td className="nowrap">
                      <button className="btn-ghost" onClick={() => removeRow(row.id)}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="actions-right" style={{ gap: 8 }}>
            <button className="btn-ghost" onClick={() => setStep(1)}>
              Atrás
            </button>
            <button className="btn-primary" onClick={handleNextFromStep2}>
              Siguiente
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="review-card">
            <div className="review-title">Resumen de la receta</div>

            <div className="review-grid">
              <div>
                <b>Consulta:</b>{" "}
                {selectedConsultation ? `#${selectedConsultation.id}` : "—"}
              </div>
              <div>
                <b>Fecha emisión:</b>{" "}
                {issueDate ? formatDateDDMMYYYY(issueDate) : "—"}
              </div>
              <div>
                <b>Observación:</b> {observation || "—"}
              </div>
              <div>
                <b>Instrucciones:</b> {instructions || "—"}
              </div>
            </div>

            <div className="table-wrap" style={{ marginTop: 14 }}>
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
                  {items.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {r.medicine.nameMedicine}{" "}
                        {r.medicine.typePresentation
                          ? `(${r.medicine.typePresentation})`
                          : ""}
                        {typeof r.medicine.concentration === "number"
                          ? ` ${r.medicine?.concentration ?? r.medicine.concentration} mg`
                          : ""}
                      </td>
                      <td>{r.dailyDose || "—"}</td>
                      <td>{r.frequency || "—"}</td>
                      <td>{r.days || "—"}</td>
                      <td>{r.quantity || "—"}</td>
                      <td>{r.itemObservation || "—"}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="muted">
                        No hay medicamentos en esta receta.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="actions-right" style={{ gap: 8 }}>
            <button className="btn-ghost" onClick={() => setStep(2)}>
              Atrás
            </button>
            <button className="btn-primary" disabled={loading} onClick={handleSave}>
              {loading ? "Guardando..." : "Guardar receta"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StepDot({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className={`step-dot ${active ? "active" : ""} ${done ? "done" : ""}`}>
      <span className="step-index">{n}</span>
      <span className="step-label">{label}</span>
    </div>
  );
}
