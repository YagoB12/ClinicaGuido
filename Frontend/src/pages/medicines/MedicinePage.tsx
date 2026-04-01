// src/pages/medicines/MedicinePage.tsx
import React, { useState } from "react";
import type { Medicine } from "../../types/medicine";
import MedicineForm from "./MedicineForm";
import MedicineList from "./MedicineList";
import MedicineEditModal from "./MedicineEditModal";
import MedicineViewModal from "./MedicineViewModal";
import AppLayout from "../../components/layout/AppLayout";
import "../../styles/medicine.css"; // <-- contiene el CSS con .rxscope

// Tabs
const tabs = ["Agregar Medicamento", "Lista de Inventario"] as const;
type Tab = (typeof tabs)[number];

const MedicinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("Lista de Inventario");

  // Control de recarga
  const [reloadFlag, setReloadFlag] = useState(false);
  const bumpReload = () => setReloadFlag((v) => !v);

  // Modales y selección
  const [selected, setSelected] = useState<Medicine | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <AppLayout title="Inventario de Medicamentos">
     
      <div className="rxscope">
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
            {activeTab === "Agregar Medicamento" ? (
              <MedicineForm
                onCreated={() => {
                  setActiveTab("Lista de Inventario");
                  bumpReload();
                }}
              />
            ) : (
              <MedicineList
                reloadFlag={reloadFlag ? 1 : 0}
                onView={(m) => {
                  setSelected(m);
                  setIsViewOpen(true);
                }}
                onEdit={(m) => {
                  setSelected(m);
                  setIsEditOpen(true);
                }}
                onDeleted={bumpReload}
              />
            )}
          </div>
        </div>

        {/* Modal Ver */}
        {isViewOpen && selected && (
          <MedicineViewModal
            medicine={selected}
            onClose={() => {
              setIsViewOpen(false);
              setSelected(null);
            }}
          />
        )}

        {/* Modal Editar */}
        {isEditOpen && selected && (
          <MedicineEditModal
            medicine={selected}
            onClose={(changed) => {
              setIsEditOpen(false);
              setSelected(null);
              if (changed) bumpReload();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default MedicinePage;
