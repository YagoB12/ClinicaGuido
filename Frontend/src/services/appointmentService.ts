import axios from "axios";
import type { AppointmentBrief } from "../types/appointment";

const API_BASE = "/api/appointments";

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

// ==================== LISTAR ====================
export const getAppointmentsBrief = async (): Promise<AppointmentBrief[]> => {
  const { data } = await axios.get(`${API_BASE}/brief`, getAuthHeaders());
  return data;
};

export const getAppointmentsList = async (): Promise<AppointmentBrief[]> => {
  const { data } = await axios.get(`${API_BASE}/list`, getAuthHeaders());
  return data;
};

// ==================== BUSCAR POR IDS ====================
export const getAppointmentsBriefByIds = async (ids: number[]): Promise<AppointmentBrief[]> => {
  if (!ids.length) return [];
  const { data } = await axios.get(`${API_BASE}/brief-by-ids`, {
    ...getAuthHeaders(),
    params: { ids },
    paramsSerializer: {
      serialize: (params) =>
        (params.ids as number[])
          .map((v) => `ids=${encodeURIComponent(String(v))}`)
          .join("&"),
    },
  });
  return data;
};


// ==================== CREAR ====================
export const createAppointment = async (appointment: AppointmentBrief) => {
  // Nueva versión sin pérdida de día por desfase UTC
const formatDate = (value: string): string => {
  // value del <input type="date"> ya viene "YYYY-MM-DD"
  const [y, m, d] = value.split("-").map(Number);
  const local = new Date(y, m - 1, d); // NO se usa para enviar, solo para sanity check
  // devolvemos exactamente lo que espera el backend:
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

const payload = {
  ...appointment,
  dateAppointment: formatDate(appointment.dateAppointment), // "YYYY-MM-DD"
  hourAppointment:
    appointment.hourAppointment.length === 5
      ? `${appointment.hourAppointment}:00` // "HH:mm:ss"
      : appointment.hourAppointment,
};

  console.log("Payload enviado:", payload);

  const { data } = await axios.post(`${API_BASE}/add`, payload, getAuthHeaders());
  return data;
};



// ==================== ACTUALIZAR ====================
export const updateAppointment = async (appointment: any): Promise<void> => {
  if (!appointment.id) throw new Error("La cita no tiene ID definido.");

  const payload = {
    dateAppointment: appointment.dateAppointment,
    hourAppointment:
      appointment.hourAppointment.length === 5
        ? `${appointment.hourAppointment}:00`
        : appointment.hourAppointment,
    reasonAppointment: appointment.reasonAppointment || "",
    priority: appointment.priority,
    officeNumber: appointment.officeNumber || "",
    status: appointment.status,
    medicalPatientId: appointment.medicalPatientId,
  };

  console.log("Payload enviado (PUT):", payload);

  await axios.put(`${API_BASE}/${appointment.id}`, payload, getAuthHeaders());
};

// ==================== ELIMINAR ====================
export const deleteAppointment = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/${id}`, getAuthHeaders());
};

// ==================== LISTAR PARA CALENDARIO ====================
export const getAppointmentsForCalendar = async (): Promise<AppointmentBrief[]> => {
  const { data } = await axios.get(`${API_BASE}/calendar`, getAuthHeaders());
  return data;
};
