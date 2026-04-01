import React from "react";
import type { AppointmentBrief } from "../../types/appointment";
import "../../styles/appointmentPage.css";

type Props = {
  open: boolean;
  onClose: () => void;
  appointment?: AppointmentBrief | null;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d?.padStart(2,"0")}/${m?.padStart(2,"0")}/${y}`;
};

const formatTime = (timeStr?: string) => (timeStr ? timeStr.slice(0, 5) : "");

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "8px", marginBottom: "10px" }}>
    <div style={{ fontWeight: 600, color: "#5c320e" }}>{label}</div>
    <div>{value ?? "-"}</div>
  </div>
);

const AppointmentViewModal: React.FC<Props> = ({ open, onClose, appointment }) => {
  if (!open || !appointment) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalle de la Cita</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div>
          <Row label="Paciente" value={appointment.patientName} />
          <Row label="Fecha" value={formatDate(appointment.dateAppointment)} />
          <Row label="Hora" value={formatTime(appointment.hourAppointment)} />
          <Row label="Prioridad" value={appointment.priority} />
          <Row label="Estado" value={appointment.status ?? "Programada"} />
          <Row label="Motivo / Razón" value={appointment.reasonAppointment || "—"} />
          
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button className="view-close-btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentViewModal;
