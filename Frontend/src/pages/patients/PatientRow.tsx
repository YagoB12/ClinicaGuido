import React from "react";
import type { MedicalPatient } from "../../types/patient";
import "../../styles/patientPage.css";

interface Props {
  patient: MedicalPatient;
  onEdit: (patient: MedicalPatient) => void;
  onDelete: (id: number) => void;
}

const PatientRow: React.FC<Props> = ({ patient, onEdit, onDelete }) => {
  return (
    <tr className="user-row">
      <td>{patient.name}</td>
      <td>{patient.identification}</td>
      <td>{patient.email}</td>
      <td>{patient.phone}</td>
      <td>{patient.birthDate}</td>
      <td>{patient.maritalStatus}</td>

      {/* 🔹 Estado con texto dentro del círculo */}
      <td className="status-cell">
        <span
          className={`status-badge ${patient.isActive ? "active" : "inactive"}`}
        >
          {patient.isActive ? "Activo" : "Inactivo"}
        </span>
      </td>

      <td className="actions">
        <button className="action-btn edit-btn" onClick={() => onEdit(patient)}>
          Editar
        </button>

        <button
          className="action-btn delete-btn"
          onClick={() => onDelete(patient.id!)}
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
};

export default PatientRow;
