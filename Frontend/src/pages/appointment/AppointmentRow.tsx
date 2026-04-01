import React from "react";
import type { AppointmentBrief } from "../../types/appointment";
import "../../styles/appointmentPage.css";

interface Props {
  appointment: AppointmentBrief;
  onEdit: (appointment: AppointmentBrief) => void;
  onDelete: (id: number) => void;
   onView: (appointment: AppointmentBrief) => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d.padStart(2,"0")}/${m.padStart(2,"0")}/${y}`;
};

//
const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  return timeStr.slice(0, 5); // corta segundos
};


const AppointmentRow: React.FC<Props> = ({ appointment, onEdit, onDelete, onView  }) => {
  return (
    <tr className="appointment-row">
      {/*Nombre del paciente (viene del backend) */}
      <td>{appointment.patientName}</td>

      {/* Fecha y hora */}
      <td>{formatDate(appointment.dateAppointment)}</td>
      <td>{formatTime(appointment.hourAppointment)}</td>

      {/* Prioridad */}
      <td className="priority-cell">
        <span className={`priority-badge ${appointment.priority?.toLowerCase() || "sin-prioridad"}`}>
          {appointment.priority}
        </span>
      </td>


      {/* Estado */}
      <td>{appointment.status ?? "Programada"}</td>

      {/* Acciones */}
      <td className="actions">
         <button className="action-btn btn-primary" onClick={() => onView(appointment)}>Ver</button>
        <button
          className="action-btn edit-btn"
          onClick={() => onEdit(appointment)}
        >
          Editar
        </button>

        <button
          className="action-btn delete-btn"
          onClick={() => onDelete(appointment.id!)} // el ! asegura que no es undefined
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
};

export default AppointmentRow;
