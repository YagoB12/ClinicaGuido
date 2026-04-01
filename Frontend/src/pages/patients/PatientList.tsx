import React, { useEffect, useState } from "react";
import type { MedicalPatient } from "../../types/patient";
import PatientRow from "./PatientRow";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import "../../styles/patientPage.css";
import { getPatients, deletePatient } from "../../services/patientService";

interface Props {
  onEdit: (patient: MedicalPatient) => void;
  reloadFlag: boolean;
}

const PatientList: React.FC<Props> = ({ onEdit, reloadFlag }) => {
  const [patients, setPatients] = useState<MedicalPatient[]>([]);

  const loadAll = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (error) {
      showErrorAlert("Error al obtener la lista de pacientes.");
    }
  };

  // Eliminar paciente con confirmación y llamada al API
  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmActionAlert("¿Deseas eliminar este paciente?");
    if (!confirmed) return;

    try {
      await deletePatient(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
      showSuccessAlert("Paciente eliminado correctamente.");
    } catch (error) {
      showErrorAlert("No se pudo eliminar el paciente.");
    }
  };

  useEffect(() => {
    loadAll();
  }, [reloadFlag]);

  return (
    <div className="patient-list-container">
      <table className="patient-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Identificación</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Fecha de nacimiento</th>
            <th>Estado civil</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {patients.length > 0 ? (
            patients.map((p) => (
              <PatientRow key={p.id} patient={p} onEdit={onEdit} onDelete={handleDelete} />
            ))
          ) : (
            <tr>
              <td colSpan={8} className="no-data">
                No hay pacientes registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PatientList;
