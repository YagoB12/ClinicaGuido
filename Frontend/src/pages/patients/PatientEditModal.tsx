import React, { useState, useEffect } from "react";
import type { MedicalPatient } from "../../types/patient";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import "../../styles/patientPage.css";

interface Props {
  patient: MedicalPatient | null;
  isOpen: boolean;
  onClose: () => void;
  // onSave receives the patient id and a partial payload with only changed fields
  onSave: (id: number, payload: any) => Promise<any>;
}

const PatientEditModal: React.FC<Props> = ({ patient, isOpen, onClose, onSave }) => {
  const [editedPatient, setEditedPatient] = useState<MedicalPatient | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (patient) setEditedPatient({ ...patient });
  }, [patient]);

  if (!isOpen || !editedPatient) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedPatient({ ...editedPatient, [name]: value } as any);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
  };

  // helper: file -> base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmed = await showConfirmActionAlert("¿Guardar cambios en este paciente?");
    if (!confirmed) return;

    try {
      if (!patient || !editedPatient) throw new Error("Paciente inválido");

      // Build a partial payload with only changed fields
      const payload: any = {};

      // Name in backend is a single field; use the local `name` field only
      const origName = (patient as any).name ?? "";
      const newName = (editedPatient as any).name ?? "";
      if (newName !== origName) {
        const combined = `${String(newName).trim()}`.trim();
        if (combined) payload.Name = combined;
      }

      // Compare other simple fields and add to payload if changed
      const fieldsToCheck: Array<[string, string]> = [
        ["email", "Email"],
        ["phone", "Phone"],
        ["birthDate", "BirthDate"],
        ["address", "Address"],
        ["maritalStatus", "MaritalStatus"],
        ["disability", "Disability"],
        ["emergencyContactName", "EmergencyContactName"],
        ["emergencyContactNumber", "EmergencyContactNumber"],
      ];

      for (const [localKey, backendKey] of fieldsToCheck) {
        const orig = (patient as any)[localKey];
        const curr = (editedPatient as any)[localKey];
        // treat empty string as undefined for partial update purposes
        if ((curr === "" || curr === null || curr === undefined) && (orig === "" || orig === null || orig === undefined)) continue;
        if (String(curr) !== String(orig)) {
          // convert numbers where applicable
          if (backendKey === "Phone" || backendKey === "EmergencyContactNumber") {
            payload[backendKey] = curr ? Number(curr) : null;
          } else {
            payload[backendKey] = curr ?? null;
          }
        }
      }

      // If a new photo file was selected, convert to base64 and include
      if (photoFile) {
        const base64DataUrl = await fileToBase64(photoFile);
        const parts = base64DataUrl.split(",");
        const base64Only = parts.length > 1 ? parts[1] : parts[0];
        payload.Photo = base64Only;
      }

      // If no changes detected, return early
      if (Object.keys(payload).length === 0) {
        showSuccessAlert("No hay cambios para guardar.");
        onClose();
        return;
      }

      await onSave(patient.id as number, payload);
      showSuccessAlert("Paciente actualizado correctamente.");
      onClose();
    } catch (error) {
      showErrorAlert("No se pudo guardar el paciente.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="modal-title">Editar Paciente</h2>

        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" name="name" value={editedPatient.name} onChange={handleChange} />
          </div>

          {/* Apellido eliminado: backend usa un solo campo Name */}

          <div className="form-group">
            <label>Identificación *</label>
            <input type="text" name="identification" value={editedPatient.identification} readOnly className="readonly" />
          </div>

          <div className="form-group">
            <label>Correo</label>
            <input type="text" name="email" value={editedPatient.email || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Foto (opcional)</label>
            <input type="file" name="photo" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" name="phone" value={editedPatient.phone || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Fecha de nacimiento</label>
            <input type="date" name="birthDate" value={editedPatient.birthDate || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input type="text" name="address" value={editedPatient.address || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Estado civil</label>
            <select name="maritalStatus" value={editedPatient.maritalStatus || ""} onChange={handleChange}>
              <option value="">Seleccione...</option>
              <option value="Soltero/a">Soltero/a</option>
              <option value="Casado/a">Casado/a</option>
              <option value="Divorciado/a">Divorciado/a</option>
              <option value="Viudo/a">Viudo/a</option>
            </select>
          </div>

          <div className="form-group">
            <label>Relación / Nombre contacto de emergencia</label>
            <input type="text" name="emergencyContactName" value={editedPatient.emergencyContactName || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Teléfono de contacto de emergencia</label>
            <input type="text" name="emergencyContactNumber" value={editedPatient.emergencyContactNumber || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Estado *</label>
            <select name="isActive" value={editedPatient.isActive ? "true" : "false"} onChange={(e) => setEditedPatient({ ...editedPatient, isActive: e.target.value === "true" })}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>

          <div className="form-button">
            <button type="submit">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientEditModal;
