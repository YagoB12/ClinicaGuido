import React, { useEffect, useMemo, useState } from "react";
import { createConsultation } from "../../services/consultationService";
import { getAppointmentsBrief } from "../../services/appointmentService";
import type { ConsultationCreateDto } from "../../types/consultation";
import type { AppointmentBrief } from "../../types/appointment";
import { formatDMY, toHHmm, normalizeStr } from "../../utils/date";
import Swal from "sweetalert2";

type Props = { onCreated?: () => void };

const initial: ConsultationCreateDto = {
  appointmentId: 0,
  reasonConsultation: "",
  diagnostic: "",
  notes: "",
  treatmentPlan: "",
  temperature: undefined,
  bloodPressure: undefined,
  heartRate: undefined,
  weight: undefined,
  height: undefined,
};

const ConsultationForm: React.FC<Props> = ({ onCreated }) => {
  const [form, setForm] = useState<ConsultationCreateDto>(initial);
  const [saving, setSaving] = useState(false);

  // citas para el selector (solo “Pendiente” ya viene filtrado en el backend)
  const [appointments, setAppointments] = useState<AppointmentBrief[]>([]);
  const [loadingAppt, setLoadingAppt] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoadingAppt(true);
        const list = await getAppointmentsBrief();
        setAppointments(list);
      } catch (e) {
        // Si falla la carga de citas, avisamos
        Swal.fire({
          icon: "error",
          title: "No se pudieron cargar las citas",
          text: "Intenta recargar la página o vuelve más tarde.",
          confirmButtonColor: "#03346E",
        });
      } finally {
        setLoadingAppt(false);
      }
    })();
  }, []);

  const filteredAppointments = useMemo(() => {
    const q = normalizeStr(filter.trim());
    if (!q) return appointments;

    return appointments.filter((a) => {
      const dateDMY = formatDMY(a.dateAppointment); // dd/MM/yyyy
      const texto = [
        a.patientName,
        a.dateAppointment, // yyyy-MM-dd
        dateDMY, // dd/MM/yyyy
        toHHmm(a.hourAppointment),
        a.officeNumber ?? "",
      ].join(" ");
      return normalizeStr(texto).includes(q);
    });
  }, [appointments, filter]);

  function setNumber<K extends keyof ConsultationCreateDto>(k: K, v: string) {
    const n = v === "" ? undefined : Number(v);
    setForm((f) => ({ ...f, [k]: (Number.isNaN(n) ? undefined : n) as any }));
  }
  function setText<K extends keyof ConsultationCreateDto>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v as any }));
  }

  // Valida solo lo requerido y rangos cuando haya valor
  function validateForm(): string[] {
    const errs: string[] = [];

    if (!form.appointmentId || form.appointmentId <= 0) {
      errs.push("Debe seleccionar una cita de la lista.");
    }

    if (!form.reasonConsultation || !form.reasonConsultation.trim()) {
      errs.push("ReasonConsultation es requerido.");
    }

    // Rangos del backend (solo si el usuario ingresó algo)
    if (form.temperature != null) {
      if (form.temperature < 30 || form.temperature > 45)
        errs.push("Temperatura fuera de rango (30–45 °C).");
    }
    if (form.bloodPressure != null) {
      if (form.bloodPressure < 40 || form.bloodPressure > 300)
        errs.push("Presión arterial fuera de rango (40–300 mmHg).");
    }
    if (form.heartRate != null) {
      if (form.heartRate < 20 || form.heartRate > 250)
        errs.push("Pulso fuera de rango (20–250 bpm).");
    }
    if (form.weight != null) {
      if (form.weight < 0 || form.weight > 500)
        errs.push("Peso fuera de rango (0–500 kg).");
    }
    if (form.height != null) {
      if (form.height < 0 || form.height > 3.0)
        errs.push("Altura fuera de rango (0–3.0 m).");
    }

    return errs;
  }

  // Normaliza el error del backend (maneja { error }, listas, texto plano, etc.)
  function extractBackendError(err: any): string {
    const data = err?.response?.data;
    if (!data) return err?.message || "Ocurrió un error desconocido.";

    if (typeof data === "string") return data;

    if (data.error) return String(data.error);

    if (Array.isArray(data)) return data.join("\n");

    // ModelState: { campo: ["msg1","msg2"], ... }
    if (typeof data === "object") {
      const msgs: string[] = [];
      for (const k of Object.keys(data)) {
        const val = (data as any)[k];
        if (Array.isArray(val)) msgs.push(...val);
        else if (typeof val === "string") msgs.push(val);
      }
      if (msgs.length) return msgs.join("\n");
    }

    return "No se pudo completar la operación.";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const errs = validateForm();
    if (errs.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Revisa los datos",
        html: `<ul style="text-align:left;margin:0;padding-left:18px">${errs
          .map((x) => `<li>${x}</li>`)
          .join("")}</ul>`,
        confirmButtonColor: "#03346E",
      });
      return;
    }

    setSaving(true);
    try {
      await createConsultation({
        ...form,
        reasonConsultation: form.reasonConsultation.trim(),
        diagnostic: form.diagnostic?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        treatmentPlan: form.treatmentPlan?.trim() || undefined,
      });

      await Swal.fire({
        icon: "success",
        title: "Consulta registrada",
        text: "La consulta se creó correctamente.",
        confirmButtonColor: "#03346E",
      });

      setForm(initial);
      setFilter("");
      onCreated?.();
    } catch (e: any) {
      const msg = extractBackendError(e);
      await Swal.fire({
        icon: "error",
        title: "No se pudo crear la consulta",
        text: msg,
        confirmButtonColor: "#03346E",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <div className="grid-3">
        {/* Selector “humano” de Cita */}
        <div className="field">
          <label>Cita *</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            <input
              type="text"
              placeholder="Buscar por paciente, fecha u oficina…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <select
              value={form.appointmentId || ""}
              onChange={(e) => setNumber("appointmentId", e.target.value)}
              disabled={loadingAppt || filteredAppointments.length === 0}
              required
            >
              <option value="">
                {loadingAppt
                  ? "Cargando citas…"
                  : filteredAppointments.length === 0
                  ? "No hay resultados"
                  : "Seleccione una cita…"}
              </option>
              {filteredAppointments.map((a) => {
                const dateDMY = formatDMY(a.dateAppointment);
                const hhmm = toHHmm(a.hourAppointment);
                const office = a.officeNumber ? ` (Oficina ${a.officeNumber})` : "";
                return (
                  <option key={a.id} value={a.id}>
                    {`${a.patientName} — ${dateDMY} ${hhmm}${office}`}
                  </option>
                );
              })}
            </select>
            {form.appointmentId ? (
              <small style={{ color: "#666" }}>Seleccionado: #{form.appointmentId}</small>
            ) : null}
          </div>
        </div>

        <div className="field">
          <label>Temperatura (°C)</label>
          <input
            type="number"
            step="0.1"
            min={30}
            max={45}
            value={form.temperature ?? ""}
            onChange={(e) => setNumber("temperature", e.target.value)}
            placeholder="30–45"
          />
        </div>

        <div className="field">
          <label>Presión arterial (mmHg)</label>
          <input
            type="number"
            step="1"
            min={40}
            max={300}
            value={form.bloodPressure ?? ""}
            onChange={(e) => setNumber("bloodPressure", e.target.value)}
            placeholder="40–300"
          />
        </div>

        <div className="field">
          <label>Pulso (bpm)</label>
          <input
            type="number"
            step="1"
            min={20}
            max={250}
            value={form.heartRate ?? ""}
            onChange={(e) => setNumber("heartRate", e.target.value)}
            placeholder="20–250"
          />
        </div>

        <div className="field">
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
        </div>

        <div className="field">
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
        </div>
      </div>

      <div className="field">
        <label>Razón de la consulta *</label>
        <textarea
          value={form.reasonConsultation}
          onChange={(e) => setText("reasonConsultation", e.target.value)}
          required
          placeholder="Motivo principal, síntomas, antecedentes breves…"
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Diagnóstico</label>
          <textarea
            value={form.diagnostic ?? ""}
            onChange={(e) => setText("diagnostic", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Notas / observaciones</label>
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => setText("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>Plan de tratamiento</label>
        <textarea
          value={form.treatmentPlan ?? ""}
          onChange={(e) => setText("treatmentPlan", e.target.value)}
        />
      </div>

      <div className="actions-right">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando..." : "Registrar Consulta"}
        </button>
      </div>
    </form>
  );
};

export default ConsultationForm;
