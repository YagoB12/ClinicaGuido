import React, { useState } from "react";
import AppointmentList from "./AppointmentList";
import AppointmentForm from "./AppointmentForm";
import AppointmentEditModal from "./AppointmentEditModal";
import { updateAppointment } from "../../services/appointmentService";
import type { AppointmentBrief } from "../../types/appointment";
import AppLayout from "../../components/layout/AppLayout";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import { logoutUser } from "../../services/authService";
import "../../styles/userPage.css"; // Reutiliza el estilo clínico general

// 🔹 Pestañas disponibles
const tabs = ["Agregar Cita", "Lista de Citas"];

// 🔹 Cerrar sesión con confirmación
const handleLogout = async () => {
  const confirmed = await showConfirmActionAlert("¿Deseas cerrar sesión?");
  if (confirmed) logoutUser();
};

const AppointmentPage: React.FC = () => {
  // Estado de pestaña activa
  const [activeTab, setActiveTab] = useState("Lista de Citas");

  // Estado del modal de edición
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentBrief | null>(null);

  // Bandera para recargar la lista tras editar o agregar
  const [reloadFlag, setReloadFlag] = useState(false);

  // 🔹 Abrir modal de edición
  const handleEdit = (appointment: AppointmentBrief) => {
    setSelectedAppointment(appointment);
    setIsEditOpen(true);
  };

  // 🔹 Guardar cambios desde el modal
  const handleSaveEdit = async (updated: AppointmentBrief) => {
    try {
      await updateAppointment(updated);
      showSuccessAlert("Cita actualizada correctamente.");

      // Cerrar modal y recargar lista
      setIsEditOpen(false);
      setSelectedAppointment(null);
      setReloadFlag((prev) => !prev);
    } catch (error) {
      showErrorAlert("No se pudo actualizar la cita.");
    }
  };

  return (
    <AppLayout title="Gestión de Citas">
    
        {/* === TABS === */}
        <div className="tabs-container">
          <div className="tabs-header">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-button ${activeTab === tab ? "active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="tabs-content">
            {activeTab === "Agregar Cita" ? (
              <AppointmentForm />
            ) : (
              <AppointmentList onEdit={handleEdit} reloadFlag={reloadFlag} />
            )}
          </div>
        </div>
   

      {/* === MODAL DE EDICIÓN === */}
      {isEditOpen && selectedAppointment && (
        <AppointmentEditModal
          appointment={selectedAppointment}
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedAppointment(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    
    </AppLayout>
  );
};

export default AppointmentPage;
