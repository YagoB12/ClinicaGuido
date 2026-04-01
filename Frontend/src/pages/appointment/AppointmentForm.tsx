import React, { useState, useEffect } from "react";
import { createAppointment } from "../../services/appointmentService";
import { getPatients } from "../../services/patientService";
import { showSuccessAlert, showErrorAlert } from "../../utils/alerts";
import type { AppointmentBrief } from "../../types/appointment";
import type { MedicalPatient } from "../../types/patient";
import "../../styles/appointmentPage.css";
import { validateAppointmentForm } from "../../utils/appointmentValidation";

const AppointmentForm: React.FC = () => {
  const [form, setForm] = useState<AppointmentBrief>({
    dateAppointment: "",
    hourAppointment: "",
    reasonAppointment: "",
    priority: "",
    officeNumber: "",
    status: "",
    medicalPatientId: 0,
  });

  const [patients, setPatients] = useState<MedicalPatient[]>([]);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch {
        showErrorAlert("Error al cargar la lista de pacientes.");
      }
    };
    loadPatients();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateAppointmentForm(form);
    if (validationError) {
      showErrorAlert(validationError);
      return;
    }

    try {
      await createAppointment(form);
      showSuccessAlert("Cita registrada correctamente.");
      setForm({
        dateAppointment: "",
        hourAppointment: "",
        reasonAppointment: "",
        priority: "",
        officeNumber: "",
        status: "",
        medicalPatientId: 0,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "No se pudo registrar la cita.";
      showErrorAlert(message);
    }
  };

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Fecha de la Cita *</label>
          <input
            type="date"
            data-testid="dateAppointment"
            name="dateAppointment"
            value={form.dateAppointment}
            onChange={handleChange}

          />
        </div>

        <div className="form-group">
          <label>Hora de la Cita *</label>

          <div className="custom-time-input">
            <input
              type="text"
              data-testid="hourAppointment"
              name="hourAppointment"
              placeholder="HH:MM"
              maxLength={5}
              value={form.hourAppointment}
              onChange={(e) => {
                let v = e.target.value.replace(/[^0-9]/g, "");

                if (v.length >= 3) {
                  v = v.substring(0, 2) + ":" + v.substring(2, 4);
                }

                setForm({ ...form, hourAppointment: v });
              }}
              onBlur={() => {
                const v = form.hourAppointment;
                if (/^\d{1}:\d{2}$/.test(v)) {
                  setForm({ ...form, hourAppointment: "0" + v });
                }
              }}
            />
          </div>
        </div>



        <div className="form-group">
          <label>Estado *</label>
          <select
            name="status"
            data-testid="status"
            value={form.status}
            onChange={handleChange}

          >
            <option value="">Seleccione...</option>
            <option value="Programada">Programada</option>
            <option value="Cancelada">Cancelada</option>
            <option value="Atendida">Atendida</option>
          </select>
        </div>

        <div className="form-group">
          <label>Prioridad *</label>
          <select
            name="priority"
            data-testid="priority"
            value={form.priority}
            onChange={handleChange}

          >
            <option value="">Seleccione...</option>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Razón de la Cita</label>
        <textarea
          data-testid="reasonAppointment"
          name="reasonAppointment"
          placeholder="Motivo o descripción breve de la cita..."
          value={form.reasonAppointment}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Paciente *</label>
        <select
          data-testid="medicalPatientId"
          name="medicalPatientId"
          value={form.medicalPatientId}
          onChange={handleChange}

        >
          <option value={0}>Seleccione paciente...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-button">
        <button type="submit" className="create-btn" data-testid="submitAppointment">Crear Cita</button>
      </div>
    </form>
  );
};

export default AppointmentForm;
