// src/pages/medicines/MedicineForm.tsx
import { useState } from "react";
import type { MedicineCreate } from "../../types/medicine";
import { createMedicine } from "../../services/medicineService";
import Swal from "sweetalert2";

// ===================== Helpers reutilizables =====================
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
      (u <= 0x1f && u !== 0x09 && u !== 0x0a && u !== 0x0d)
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

function blockNonIntegerKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  const bad = ["e", "E", "+", "-", ".", ","];
  if (bad.includes(e.key)) e.preventDefault();
}
function filterPasteInteger(e: React.ClipboardEvent<HTMLInputElement>) {
  const text = e.clipboardData.getData("text");
  if (!/^\d*$/.test(text)) e.preventDefault();
}
function preventWheel(e: React.WheelEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).blur();
  e.stopPropagation();
}

// ===================== Componente principal =====================
export default function MedicineForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState<MedicineCreate>({
    nameMedicine: "",
    description: "",
    typePresentation: "",
    availableQuantity: 0,
    preparationDate: undefined,
    expirationDate: undefined,
    concentration: undefined,
  });
  const [qtyInput, setQtyInput] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof MedicineCreate>(key: K, value: MedicineCreate[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ===================== Validaciones con Swal =====================
  async function validate(): Promise<boolean> {
    const msgs: string[] = [];

    // Nombre
    if (!form.nameMedicine.trim()) msgs.push("• El nombre es requerido.");
    else if (form.nameMedicine.length > 200) msgs.push("• El nombre no puede superar 200 caracteres.");
    else if (containsEmojiOrControl(form.nameMedicine))
      msgs.push("• El nombre contiene caracteres no válidos (emojis o símbolos).");

    // Presentación
    if (form.typePresentation) {
      if (containsEmojiOrControl(form.typePresentation))
        msgs.push("• La presentación contiene caracteres no válidos.");
      else if (form.typePresentation.length > 100)
        msgs.push("• La presentación no puede superar 100 caracteres.");
    }

    // Descripción
    if (form.description) {
      if (containsEmojiOrControl(form.description))
        msgs.push("• La descripción contiene caracteres no válidos.");
      else if (form.description.length > 500)
        msgs.push("• La descripción no puede superar 500 caracteres.");
    }

    // Cantidad
    if (qtyInput.trim() === "") msgs.push("• La cantidad disponible es requerida.");
    else {
      const n = Number(qtyInput);
      if (isNaN(n)) msgs.push("• La cantidad debe ser un número.");
      else if (n < 0) msgs.push("• La cantidad no puede ser negativa.");
    }

    // Concentración
    if (form.concentration != null) {
      const c = Number(form.concentration);
      if (isNaN(c)) msgs.push("• La concentración debe ser un número.");
      else if (c < 0) msgs.push("• La concentración no puede ser negativa.");
    }

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
      await Swal.fire({
        icon: "warning",
        title: "Datos inválidos o incompletos",
        html: msgs.join("<br/>"),
        confirmButtonColor: "#03346E",
      });
      return false;
    }

    return true;
  }

  // ===================== Submit =====================
  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!(await validate())) return;

    const normName = normalizePlain(form.nameMedicine, 200);
    const normDesc = normalizePlain(form.description || "", 500);
    const normPres = normalizePlain(form.typePresentation || "", 100);

    if (!normName.ok || !normDesc.ok || !normPres.ok) {
      await Swal.fire({
        icon: "warning",
        title: "Texto inválido",
        text: "Algunos campos contenían emojis o caracteres no permitidos. Se limpiaron automáticamente.",
        confirmButtonColor: "#03346E",
      });
    }

    try {
      setLoading(true);
      await createMedicine({
        nameMedicine: normName.value,
        description: normDesc.value || undefined,
        typePresentation: normPres.value || undefined,
        availableQuantity: Number(qtyInput),
        preparationDate: form.preparationDate || undefined,
        expirationDate: form.expirationDate || undefined,
        concentration:
          form.concentration !== undefined && form.concentration !== null && form.concentration !== ("" as any)
            ? Number(form.concentration)
            : undefined,
      });

      await Swal.fire({
        icon: "success",
        title: "Medicamento registrado",
        text: "El medicamento se ha guardado correctamente.",
        confirmButtonColor: "#03346E",
      });

      onCreated();
      setForm({
        nameMedicine: "",
        description: "",
        typePresentation: "",
        availableQuantity: 0,
        preparationDate: undefined,
        expirationDate: undefined,
        concentration: undefined,
      });
      setQtyInput("");
    } catch (err: any) {
  console.error("Error al crear medicamento", err);

  let msg = "No se pudo registrar el medicamento. Verifique los datos.";

  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;

    msg += ` | status: ${status}`;

    // 👇 Mostrar el contenido de data.errors si viene
    if (data?.errors) {
      try {
        const list = Array.isArray(data.errors)
          ? data.errors.join(" ; ")
          : JSON.stringify(data.errors);
        msg += " | errors: " + list;
      } catch {
        msg += " | errors (raw): " + JSON.stringify(data.errors);
      }
    } else {
      // Por si el backend manda otra estructura
      msg += " | raw: " + JSON.stringify(data);
    }
  }

  await Swal.fire({
    icon: "error",
    title: "Error al guardar",
    text: msg,
    confirmButtonColor: "#03346E",
  });
}

 finally {
      setLoading(false);
    }
  }

  // ===================== Render =====================
  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="grid-3">
        {/* Nombre */}
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Nombre *</label>
          <input
            placeholder="Paracetamol, Amoxicilina…"
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
            placeholder="Tabletas, Cápsulas, Jarabe…"
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
            inputMode="numeric"
            pattern="\d*"
            placeholder="0"
            value={qtyInput}
            onKeyDown={blockNonIntegerKeys}
            onPaste={filterPasteInteger}
            onWheel={preventWheel}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d]/g, "");
              setQtyInput(v);
            }}
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
            onChange={(e) => set("concentration", e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </div>

        {/* Fecha de preparación */}
        <div className="field">
          <label>Preparación</label>
          <input
            type="date"
            max={TODAY_YYYY_MM_DD}
            value={form.preparationDate || ""}
            onChange={(e) => set("preparationDate", e.target.value || undefined)}
          />
        </div>

        {/* Fecha de expiración */}
        <div className="field">
          <label>Expiración</label>
          <input
            type="date"
            value={form.expirationDate || ""}
            onChange={(e) => set("expirationDate", e.target.value || undefined)}
          />
        </div>

        {/* Descripción */}
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Descripción</label>
          <textarea
            rows={3}
            placeholder="Analgésico y antipirético…"
            value={form.description || ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!containsEmojiOrControl(v)) set("description", v);
            }}
            maxLength={500}
          />
        </div>
      </div>

      <div className="actions-right">
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Registrar Medicamento"}
        </button>
      </div>
    </form>
  );
}
