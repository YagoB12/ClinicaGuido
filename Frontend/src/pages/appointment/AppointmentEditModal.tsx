import React, { useState, useEffect } from "react";
import type { AppointmentBrief } from "../../types/appointment";
import type { MedicalPatient } from "../../types/patient";
import { getPatients } from "../../services/patientService";
import { updateAppointment } from "../../services/appointmentService";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import "../../styles/appointmentPage.css";
import { validateAppointmentForm } from "../../utils/appointmentValidation";

interface Props {
  appointment: AppointmentBrief | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: AppointmentBrief) => void;
}

const AppointmentEditModal: React.FC<Props> = ({
  appointment,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editedAppointment, setEditedAppointment] = useState<AppointmentBrief | null>(null);
  const [patients, setPatients] = useState<MedicalPatient[]>([]);

  // Cargar pacientes una sola vez
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch {
        showErrorAlert("Error al cargar pacientes.");
      }
    };
    loadPatients();
  }, []);

  // Cargar datos de la cita seleccionada
  useEffect(() => {
    if (appointment) {
      setEditedAppointment({
        ...appointment,
        reasonAppointment: appointment.reasonAppointment || "",
        priority: appointment.priority || "Media",
        status: appointment.status || "Programada",
        hourAppointment: appointment.hourAppointment?.slice(0, 5) || "08:00",
        medicalPatientId: appointment.medicalPatientId ?? 0,
      });
    }
  }, [appointment]);

  if (!isOpen || !editedAppointment) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setEditedAppointment({ ...editedAppointment, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateAppointmentForm(editedAppointment);
    if (validationError) {
      showErrorAlert(validationError);
      return;
    }

    const confirmed = await showConfirmActionAlert("¿Guardar cambios en esta cita?");
    if (!confirmed) return;

    try {
      const payload = {
        ...editedAppointment,
        hourAppointment:
          editedAppointment.hourAppointment.length === 5
            ? editedAppointment.hourAppointment + ":00"
            : editedAppointment.hourAppointment,
      };

      await updateAppointment(payload);
      showSuccessAlert("Cita actualizada correctamente.");
      onSave(payload);
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || "No se pudo actualizar la cita.";
      showErrorAlert(message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="modal-title">Editar Cita</h2>

        <form onSubmit={handleSubmit} className="appointment-form">
          <div className="form-row">
            <div className="form-group">
              <label>Fecha *</label>
              <input
                type="date"
                name="dateAppointment"
                value={editedAppointment.dateAppointment}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Hora *</label>

              <div className="custom-time-input">
                <input
                  type="text"
                  name="hourAppointment"
                  data-testid="hourAppointment"
                  placeholder="HH:MM"
                  maxLength={5}
                  value={editedAppointment.hourAppointment}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^0-9]/g, "");

                    if (v.length >= 3) {
                      v = v.substring(0, 2) + ":" + v.substring(2, 4);
                    }

                    setEditedAppointment({ ...editedAppointment, hourAppointment: v });
                  }}
                  onBlur={() => {
                    const v = editedAppointment.hourAppointment;
                    if (/^\d{1}:\d{2}$/.test(v)) {
                      setEditedAppointment({ ...editedAppointment, hourAppointment: "0" + v });
                    }
                  }}
                  required
                />
              </div>
            </div>


            <div className="form-group">
              <label>Estado *</label>
              <select
                name="status"
                value={editedAppointment.status}
                onChange={handleChange}
              >
                <option value="Programada">Programada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Atendida">Atendida</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prioridad *</label>
              <select
                name="priority"
                value={editedAppointment.priority}
                onChange={handleChange}
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Motivo</label>
            <textarea
              name="reasonAppointment"
              value={editedAppointment.reasonAppointment}
              onChange={handleChange}
            />
          </div>

          {/* Paciente bloqueado (solo lectura) */}
          <div className="form-group">
            <label>Paciente *</label>
            {/* Campo visible solo para mostrar el nombre */}
            <input
              type="text"
              value={appointment?.patientName || "Desconocido"}
              readOnly
              className="readonly-input"
            />

            {/* Campo oculto que mantiene el ID del paciente para enviar al backend */}
            <input
              type="hidden"
              name="medicalPatientId"
              value={editedAppointment.medicalPatientId}
            />
          </div>

          <div className="form-button">
            <button type="submit">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentEditModal;
