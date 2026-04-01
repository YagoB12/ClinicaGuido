import React, { useState } from "react";
import PatientList from "./PatientList";
import PatientForm from "./PatientForm";
import PatientEditModal from "./PatientEditModal";
import type { MedicalPatient } from "../../types/patient";
import { logoutUser } from "../../services/authService";
import { showConfirmActionAlert } from "../../utils/alerts";
import { showSuccessAlert, showErrorAlert } from "../../utils/alerts";
import "../../styles/patientPage.css";
import { Link } from "react-router-dom";
import { updatePatient } from "../../services/patientService";

const tabs = ["Agregar Paciente", "Lista de Pacientes"];

// 🔹 Cerrar sesión
const handleLogout = async () => {
  const confirmed = await showConfirmActionAlert("¿Deseas cerrar sesión?");
  if (confirmed) {
    logoutUser();
  }
};


const PatientPage: React.FC = () => {
  // 🔹 Control de pestañas
  const [activeTab, setActiveTab] = useState("Lista de Pacientes");

  // 🔹 Control del modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);

  // 🔹 Bandera para recargar tabla tras editar
  const [reloadFlag, setReloadFlag] = useState(false);

  // 🔹 Abrir modal de edición
  const handleEdit = (patient: MedicalPatient) => {
    setSelectedPatient(patient);
    setIsEditOpen(true);
  };

  // 🔹 Guardar cambios del modal
  const handleSaveEdit = async (id: number, payload: any) => {
    try {
      if (!id) throw new Error("Patient id missing");

      // If backend expects a full DTO on PUT, merge the original patient with the partial payload
      const original = selectedPatient;
      let sendPayload: any = payload;
      if (original) {
        // Build full DTO mapping using original values then override with payload
        sendPayload = {
          Name: payload.Name ?? `${(original as any).name || ""}`.trim(),
          Identification: payload.Identification ?? original.identification,
          Email: payload.Email ?? original.email ?? null,
          Phone: payload.Phone ?? (original.phone ? Number(original.phone) : null),
          Gender: payload.Gender ?? ((original as any).gender === "male" || (original as any).gender === true ? true : false),
          BirthDate: payload.BirthDate ?? original.birthDate ?? null,
          Address: payload.Address ?? original.address ?? null,
          MaritalStatus: payload.MaritalStatus ?? original.maritalStatus ?? null,
          Disability: payload.Disability ?? original.disability ?? null,
          Photo: payload.Photo ?? original.photo ?? null,
          EmergencyContactName: payload.EmergencyContactName ?? original.emergencyContactName ?? null,
          EmergencyContactNumber: payload.EmergencyContactNumber ?? (original.emergencyContactNumber ? Number(original.emergencyContactNumber) : null),
        };
      }

      // Ensure required fields are present (backend validates Name, Identification, Email)
      const missing: string[] = [];
      const nameVal = typeof sendPayload.Name === "string" ? sendPayload.Name.trim() : "";
      const idVal = typeof sendPayload.Identification === "string" ? sendPayload.Identification.trim() : "";
      const emailVal = typeof sendPayload.Email === "string" ? sendPayload.Email.trim() : "";
      if (!nameVal) missing.push("Name");
      if (!idVal) missing.push("Identification");
      if (!emailVal) missing.push("Email");
      if (missing.length) {
        showErrorAlert(`No se puede actualizar: faltan campos obligatorios: ${missing.join(", ")}`);
        return;
      }

      // Do not include LastName in normal logic, but ensure a non-empty placeholder
      // is present so the backend's required validation does not fail.
      if ((sendPayload as any).LastName === undefined) {
        (sendPayload as any).LastName = "N/A";
      }

      // Log the payload before sending
      // eslint-disable-next-line no-console
      console.debug("calling updatePatient with:", { id, sendPayload });

      const resp = await updatePatient(id, sendPayload);

      // If backend returns validation details or an error object, show it
      if (resp && (resp.details || resp.error || resp.message)) {
        const details = resp.details || resp.error || resp.message;
        // eslint-disable-next-line no-console
        console.debug("updatePatient backend details:", details);
        // If there are validation details, surface them to the user
        showErrorAlert(typeof details === "string" ? details : JSON.stringify(details));
      } else {
        showSuccessAlert("Paciente actualizado correctamente.");
      }
      setIsEditOpen(false);
      setSelectedPatient(null);

      // 🔁 Recargar tabla inmediatamente
      setReloadFlag((prev) => !prev);
    } catch (error) {
      showErrorAlert("No se pudo actualizar el paciente.");
    }
  };

  return (
    <div className="page-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="clinic-name">Clínica Dr.Guido</span>
          <span className="divider"></span>
          <span className="subtitle">Sistema Clínico</span>
        </div>

        <div className="navbar-right">
          <Link to="/patients" className="menu-item">Pacientes</Link>
          <Link to="/appointments" className="menu-item">Citas</Link>
          <Link to="/consultations" className="menu-item">Consultas</Link>
          <Link to="/medicines" className="menu-item">Medicamentos</Link>
          <Link to="/diseases" className="menu-item">Enfermedades</Link>
          <Link to="/exams" className="menu-item">Exámenes</Link>
          <Link to="/prescriptions" className="menu-item">Recetas</Link>

          <button className="logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="content">
        <div className="header-box">
          <h1 className="header-title">Gestión de Pacientes</h1>
        </div>

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
            {activeTab === "Agregar Paciente" ? (
              <PatientForm />
            ) : (
              <PatientList onEdit={handleEdit} reloadFlag={reloadFlag} />
            )}
          </div>
        </div>
      </main>

      {/* MODAL DE EDICIÓN */}
      {isEditOpen && selectedPatient && (
        <PatientEditModal
          patient={selectedPatient}
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedPatient(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default PatientPage;
