import React, { useState } from "react";
import DiseaseList from "./DiseaseList";
import DiseaseForm from "./DiseaseForm";
import DiseaseEditModal from "./DiseaseEditModal";
import type { Disease } from "../../types/disease";
import AppLayout from "../../components/layout/AppLayout";
import { updateDisease } from "../../services/diseaseService";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import { logoutUser } from "../../services/authService";
import { Link } from "react-router-dom";
import "../../styles/diseasePage.css"; // reutilizamos el mismo estilo general

const tabs = ["Agregar Enfermedad", "Lista de Enfermedades"];

// Cerrar sesión
const handleLogout = async () => {
  const confirmed = await showConfirmActionAlert("¿Deseas cerrar sesión?");
  if (confirmed) logoutUser();
};

const DiseasePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Lista de Enfermedades");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [reloadFlag, setReloadFlag] = useState(false);

  // Abrir modal de edición
  const handleEdit = (disease: Disease) => {
    setSelectedDisease(disease);
    setIsEditOpen(true);
  };

  // Guardar cambios del modal
  const handleSaveEdit = async (updatedDisease: Disease) => {
    try {
      await updateDisease(updatedDisease);
      showSuccessAlert("Enfermedad actualizada correctamente.");
      setIsEditOpen(false);
      setSelectedDisease(null);
      setReloadFlag((prev) => !prev); // recargar tabla
    } catch {
      showErrorAlert("No se pudo actualizar la enfermedad.");
    }
  };

  return (
    <AppLayout title="Gestión de Enfermedades">
      
        {/* TABS */}
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
            {activeTab === "Agregar Enfermedad" ? (
              <DiseaseForm onCreated={() => setReloadFlag((prev) => !prev)} />
            ) : (
              <DiseaseList onEdit={handleEdit} reloadFlag={reloadFlag} />
            )}
          </div>
        </div>
    

      {/* MODAL DE EDICIÓN */}
      {isEditOpen && selectedDisease && (
        <DiseaseEditModal
          disease={selectedDisease}
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedDisease(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </AppLayout>
  );
};

export default DiseasePage;
