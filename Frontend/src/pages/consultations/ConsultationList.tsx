// pages/consultations/ConsultationList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getConsultations, deleteConsultation } from "../../services/consultationService";
import { getAppointmentsBriefByIds } from "../../services/appointmentService";
import { getPrescriptionByConsultation } from "../../services/prescriptionService";
import type { Consultation } from "../../types/consultation";
import type { AppointmentBrief } from "../../types/appointment";
import { formatDMY, toHHmm } from "../../utils/date";
import { showConfirmActionAlert, showSuccessAlert, showErrorAlert } from "../../utils/alerts";
import "../../styles/consultationPage.css";

import ConsultationViewModal from "./ConsultationViewModal";

type Props = {
  onEdit: (c: Consultation) => void;
  reloadFlag: boolean;
};

const ConsultationList: React.FC<Props> = ({ onEdit, reloadFlag }) => {
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appts, setAppts] = useState<AppointmentBrief[]>([]);
  const [loadingAppt, setLoadingAppt] = useState(true);

  const [presByConsultation, setPresByConsultation] = useState<Map<number, number>>(new Map());
  const [loadingPres, setLoadingPres] = useState(true);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modal Ver Consulta
  const [viewOpen, setViewOpen] = useState(false);
  const [viewConsultation, setViewConsultation] = useState<Consultation | null>(null);
  const [viewSeed, setViewSeed] = useState<{ patientName?: string; patientIdentification?: string }>();

  const FMT = {
    temp: (v?: number | null) => (typeof v === "number" ? `${v.toFixed(1)} °C` : "—"),
    pres: (v?: number | string | null) => (v ? `${v} mmHg` : "—"),
    pulse: (v?: number | null) => (typeof v === "number" ? `${v} bpm` : "—"),
    weight: (v?: number | null) => (typeof v === "number" ? `${v} kg` : "—"),
    height: (v?: number | null) => {
      if (typeof v !== "number") return "—";
      return v > 3 ? `${Math.round(v)} cm` : `${v.toFixed(2)} m`;
    },
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const consultas = await getConsultations();
      setItems(consultas);

      const ids = Array.from(
        new Set(consultas.map((c) => Number(c.appointmentId)).filter((n) => Number.isFinite(n) && n > 0))
      );
      setLoadingAppt(true);
      const briefs = await getAppointmentsBriefByIds(ids);
      setAppts(briefs);

      setLoadingPres(true);
      const map = new Map<number, number>();
      await Promise.allSettled(
        consultas.filter((c) => typeof c.id === "number").map(async (c) => {
          try {
            const p = await getPrescriptionByConsultation(Number(c.id));
            if (p?.id) map.set(Number(c.id), Number(p.id));
          } catch {}
        })
      );
      setPresByConsultation(map);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ?? err?.message ?? "No se pudo cargar la lista de consultas."
      );
    } finally {
      setLoading(false);
      setLoadingAppt(false);
      setLoadingPres(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadFlag]);

  const apptById = useMemo(() => {
    const m = new Map<number, AppointmentBrief>();
    appts.forEach((a) => {
      if (typeof a.id === "number") m.set(a.id, a);
    });
    return m;
  }, [appts]);

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmActionAlert("¿Deseas eliminar esta consulta?");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteConsultation(id);
      showSuccessAlert("Consulta eliminada correctamente.");
      loadAll();
    } catch {
      showErrorAlert("No se pudo eliminar la consulta.");
    } finally {
      setDeletingId(null);
    }
  };

  const goCreatePrescription = (consultationId: number) => {
    const appt = apptById.get(Number(items.find((x) => x.id === consultationId)?.appointmentId ?? 0));
    const params = new URLSearchParams({ new: "1", consultationId: String(consultationId) });

    if (appt?.patientName) params.set("patientName", appt.patientName);
    if (appt?.patientIdentification) params.set("patientIdentification", appt.patientIdentification);
    if (appt?.dateAppointment) params.set("appointmentDate", appt.dateAppointment);
    if (appt?.hourAppointment) params.set("appointmentTime", toHHmm(appt.hourAppointment));
    if (appt?.officeNumber) params.set("officeNumber", String(appt.officeNumber));

    const cons = items.find((c) => c.id === consultationId);
    if (cons?.reasonConsultation) params.set("reasonConsultation", cons.reasonConsultation);

    window.location.href = `/prescriptions?${params.toString()}`;
  };

  const goViewPrescription = (prescriptionId: number, consultationId?: number) => {
    const appt = apptById.get(Number(items.find((x) => x.id === consultationId)?.appointmentId ?? 0));
    const params = new URLSearchParams({ view: String(prescriptionId) });
    if (appt?.patientName) params.set("pn", appt.patientName);
    if (appt?.patientIdentification) params.set("pid", appt.patientIdentification);
    window.location.href = `/prescriptions?${params.toString()}`;
  };

  const openConsultationView = (c: Consultation) => {
    const appt = apptById.get(Number(c.appointmentId));
    setViewConsultation(c);
    setViewSeed({
      patientName: appt?.patientName ?? "—",
      patientIdentification: appt?.patientIdentification ?? "—",
    });
    setViewOpen(true);
  };

  if (loading) return <div className="loading">Cargando consultas…</div>;
  if (error) return <div className="alert-error">{error}</div>;
  if (items.length === 0) return <div className="muted">No hay consultas registradas.</div>;

  return (
    <div className="conscope">
      <div className="table-wrap">
        {/* ⬇️ ACTIVAMOS EL MODIFICADOR QUE CENTRA TODO */}
        <table className="table table--center">
          <thead>
            <tr>
              <th>#</th>
              <th>Paciente</th>
              <th>Fecha / Hora</th>
              <th>Razón</th>
              <th>Temp (°C)</th>
              <th>Presión (mmHg)</th>
              <th>Pulso (bpm)</th>
              <th>Peso (kg)</th>
              <th>Altura</th>
              <th className="nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c, idx) => {
              const appt = apptById.get(Number(c.appointmentId));
              const paciente = appt?.patientName ?? "—";
              const fecha = appt ? formatDMY(appt.dateAppointment) : "—";
              const hora = appt ? toHHmm(appt.hourAppointment) : "—";
              const presId = presByConsultation.get(Number(c.id));

              return (
                <tr key={c.id}>
                  <td>{idx + 1}</td>
                  <td>{paciente}</td>
                  <td>{`${fecha} ${hora}`}</td>
                  <td>{c.reasonConsultation ?? "—"}</td>
                  <td>{FMT.temp(c.temperature)}</td>
                  <td>{FMT.pres(c.bloodPressure)}</td>
                  <td>{FMT.pulse(c.heartRate)}</td>
                  <td>{FMT.weight(c.weight)}</td>
                  <td>{FMT.height(c.height)}</td>
                  <td className="nowrap">
                    <div className="actions" style={{ gap: 8 }}>
                      {!loadingPres &&
                        (presId ? (
                          <button
                            className="btn-ghost"
                            onClick={() => goViewPrescription(presId, Number(c.id))}
                          >
                            Ver receta
                          </button>
                        ) : (
                          <button
                            className="btn-ghost"
                            onClick={() => goCreatePrescription(Number(c.id))}
                          >
                            Crear receta
                          </button>
                        ))}

                      <button
                        className="btn-primary"
                        onClick={() => openConsultationView(c)}
                      >
                        Ver consulta
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={() => onEdit(c)}
                        disabled={deletingId === c.id}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(c.id!)}
                        disabled={deletingId === c.id}
                      >
                        {deletingId === c.id ? "Eliminando…" : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(loadingAppt || loadingPres) && items.length > 0 && (
          <div className="muted" style={{ marginTop: 8 }}>
            Cargando datos complementarios…
          </div>
        )}
      </div>

      <ConsultationViewModal
        open={viewOpen}
        consultation={viewConsultation}
        prescriptionId={null}
        seed={viewSeed}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
};

export default ConsultationList;
