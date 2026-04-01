import axios from "axios";
import type { MedicalPatient } from "../types/patient";

const API_URL = "/api/medicalpatient";

// ==================== LISTAR PACIENTES ====================
export const getPatients = async (): Promise<MedicalPatient[]> => {
  const { data } = await axios.get(API_URL, { withCredentials: true });
  return data;
};

// ==================== OBTENER PACIENTE POR ID ====================
export const getPatientById = async (id: number): Promise<MedicalPatient> => {
  const { data } = await axios.get(`${API_URL}/${id}`, { withCredentials: true });
  return data;
};

// ==================== CREAR PACIENTE ====================
export const createPatient = async (patient: any): Promise<MedicalPatient> => {
  try {
    // Log payload for debugging (remove in production)
    // eslint-disable-next-line no-console
    console.debug("createPatient payload:", patient);

    const isForm = typeof (patient as FormData).append === "function";

    const config: any = { withCredentials: true };
    if (isForm) {
      // Do NOT set Content-Type here — let axios set the correct multipart boundary header
      // (setting it manually without the boundary causes 415 Unsupported Media Type).
    }

    // Ensure LastName placeholder is always sent to satisfy backend validation
    const LASTNAME_PLACEHOLDER = "N/A";
    if (isForm) {
      // If using FormData, append LastName only if not present
      try {
        if (!patient.get("LastName")) patient.append("LastName", LASTNAME_PLACEHOLDER);
      } catch (e) {
        // ignore
      }
    } else {
      if ((patient as any).LastName === undefined) (patient as any).LastName = LASTNAME_PLACEHOLDER;
    }

    const { data } = await axios.post(API_URL, patient, config);

    // eslint-disable-next-line no-console
    console.debug("createPatient response:", data);
    return data;
  } catch (err: any) {
    // Log server error details to help diagnose 400 responses
    // eslint-disable-next-line no-console
    console.error("createPatient error:", err?.response?.status, err?.response?.data || err.message);
    throw err;
  }
};

// ==================== ACTUALIZAR PACIENTE ====================
export const updatePatient = async (id: number, patient: any): Promise<any> => {
  try {
    // eslint-disable-next-line no-console
    console.debug("updatePatient payload:", { id, patient });
    // Ensure LastName placeholder is present so backend validators don't fail
    try {
      const LASTNAME_PLACEHOLDER = "N/A";
      const isForm = typeof (patient as FormData).append === "function";
      if (isForm) {
        if (!patient.get("LastName")) patient.append("LastName", LASTNAME_PLACEHOLDER);
      } else {
        if ((patient as any).LastName === undefined) (patient as any).LastName = LASTNAME_PLACEHOLDER;
      }
    } catch (e) {
      // ignore
    }

    const { data } = await axios.put(`${API_URL}/${id}`, patient, { withCredentials: true });
    // eslint-disable-next-line no-console
    console.debug("updatePatient response:", data);
    return data;
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("updatePatient error:", err?.response?.status, err?.response?.data || err.message);
    throw err;
  }
};

// ==================== ELIMINAR PACIENTE ====================
export const deletePatient = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
};
