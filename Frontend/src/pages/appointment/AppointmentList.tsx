import React, { useEffect, useState } from "react";
import { getAppointmentsList, deleteAppointment } from "../../services/appointmentService";
import type { AppointmentBrief } from "../../types/appointment";
import AppointmentRow from "./AppointmentRow";
import AppointmentViewModal from "./AppointmentViewModal";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import "../../styles/appointmentPage.css";

interface Props {
  onEdit: (appointment: AppointmentBrief) => void;
  reloadFlag: boolean;
}

const AppointmentList: React.FC<Props> = ({ onEdit, reloadFlag }) => {
  const [appointments, setAppointments] = useState<AppointmentBrief[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("Todas");

  const [openView, setOpenView] = useState(false);
  const [current, setCurrent] = useState<AppointmentBrief | null>(null);

  // Cargar todas las citas desde la API
  const loadAppointments = async () => {
    try {
      const data = await getAppointmentsList();
      setAppointments(data);
    } catch (error) {
      showErrorAlert("Error al cargar las citas.");
    }
  };

  // Eliminar cita con confirmación
  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmActionAlert("¿Deseas eliminar esta cita?");
    if (!confirmed) return;

    try {
      await deleteAppointment(id);
      showSuccessAlert("Cita eliminada correctamente.");

      // Refrescar la lista sin recargar la página
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      showErrorAlert("No se pudo eliminar la cita.");
    }
  };
  const handleView = (a: AppointmentBrief) => {
    setCurrent(a);
    setOpenView(true);
  };


  // 🔹 Cargar citas al montar o al editar/agregar
  useEffect(() => {
    loadAppointments();
  }, [reloadFlag]);

  // 🔹 Aplicar filtro
  const filteredAppointments =
    filterStatus === "Todas"
      ? appointments
      : appointments.filter((a) => a.status === filterStatus);

  return (
    <div className="appointment-list-container">
      {/* === FILTRO DE ESTADO === */}
      <div className="filter-container">
        <label htmlFor="filterStatus" className="filter-label">
          Mostrar:
        </label>
        <select
          id="filterStatus"
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="Todas">Todas</option>
          <option value="Programada">Programadas</option>
          <option value="Cancelada">Canceladas</option>
          <option value="Atendida">Atendidas</option>
        </select>
      </div>

      {/* === TABLA === */}
      <table className="appointment-table">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((a) => (
              <AppointmentRow
                key={a.id}
                appointment={a}
                onEdit={onEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))
          ) : (
            <tr>
              <td colSpan={6} className="no-data">
                No hay citas para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <AppointmentViewModal
        open={openView}
        appointment={current}
        onClose={() => setOpenView(false)}
      />
    </div>
  );
};

export default AppointmentList;
