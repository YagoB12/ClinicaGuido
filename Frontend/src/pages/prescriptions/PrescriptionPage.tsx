// src/pages/prescriptions/PrescriptionPage.tsx
import React, { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import PrescriptionForm from "./PrescriptionForm";
import PrescriptionList from "./PrescriptionList";
import "../../styles/prescriptions.css";

const tabs = ["Agregar Receta", "Lista de Recetas"] as const;
type Tab = (typeof tabs)[number];

type PrefillPayload = {
  consultationId: number;
  patientName?: string;
  patientIdentification?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  officeNumber?: string;
  reasonConsultation?: string;
};

export default function PrescriptionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Lista de Recetas");
  const [qsPrefill, setQsPrefill] = useState<PrefillPayload | null>(null);

  useEffect(() => {
    const goList = () => setActiveTab("Lista de Recetas");
    window.addEventListener("prescriptions:goList", goList);
    return () => window.removeEventListener("prescriptions:goList", goList);
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const isNew = sp.get("new");
    const consultationIdStr = sp.get("consultationId");

    if (isNew === "1" && consultationIdStr && /^\d+$/.test(consultationIdStr)) {
      const payload: PrefillPayload = { consultationId: Number(consultationIdStr) };
      const pn = sp.get("patientName");
      const pid = sp.get("patientIdentification");
      const apptDate = sp.get("appointmentDate");
      const apptTime = sp.get("appointmentTime");
      const office = sp.get("officeNumber");
      const reason = sp.get("reasonConsultation");

      if (pn) payload.patientName = pn;
      if (pid) payload.patientIdentification = pid;
      if (apptDate) payload.appointmentDate = apptDate;
      if (apptTime) payload.appointmentTime = apptTime;
      if (office) payload.officeNumber = office;
      if (reason) payload.reasonConsultation = reason;

      setQsPrefill(payload);
      setActiveTab("Agregar Receta");
    }
  }, []);

  useEffect(() => {
    if (activeTab === "Agregar Receta" && qsPrefill) {
      window.dispatchEvent(new CustomEvent("prescriptions:prefill", { detail: qsPrefill }));
      setQsPrefill(null);
    }
  }, [activeTab, qsPrefill]);

  return (
    <AppLayout title="Gestión de Recetas">
      {/* 🔒 Encapsulamos toda la vista en el scope para usar los estilos centrados */}
      <div className="prescscope">
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
            {activeTab === "Agregar Receta" ? <PrescriptionForm /> : <PrescriptionList />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
