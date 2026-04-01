// pages/consultations/ConsultationPage.tsx
import React, { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import ConsultationList from "./ConsultationList";
import ConsultationForm from "./ConsultationForm";
import ConsultationEditModal from "./ConsultationEditModal";
import type { Consultation } from "../../types/consultation";
import "../../styles/consultationPage.css";

const tabs = ["Agregar Consulta", "Lista de Consultas"] as const;
type Tab = (typeof tabs)[number];

const ConsultationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("Lista de Consultas");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<Consultation | null>(null);

  const [reloadFlag, setReloadFlag] = useState(false);
  const bumpReload = () => setReloadFlag((v) => !v);

  return (
    <AppLayout title="Gestión de Consultas">
      {/* Namespace para aislar estilos y centrar tablas por defecto */}
      <div className="conscope">
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
            {activeTab === "Agregar Consulta" ? (
              <ConsultationForm
                onCreated={() => {
                  setActiveTab("Lista de Consultas");
                  bumpReload();
                }}
              />
            ) : (
              <ConsultationList
                reloadFlag={reloadFlag}
                onEdit={(c) => {
                  setSelected(c);
                  setIsEditOpen(true);
                }}
              />
            )}
          </div>
        </div>

        {isEditOpen && selected && (
          <ConsultationEditModal
            consultation={selected}
            isOpen={isEditOpen}
            onClose={() => {
              setIsEditOpen(false);
              setSelected(null);
            }}
            onSaved={() => {
              bumpReload();
              setIsEditOpen(false);
              setSelected(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default ConsultationPage;
