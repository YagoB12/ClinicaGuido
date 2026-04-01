import api from "../services/axiosConfig";
import type {
  Consultation,
  ConsultationCreateDto,
  ConsultationUpdateDto,
} from "../types/consultation";

const API_URL = "/Consultations";

// Obtener todas las consultas (opcionalmente filtradas por cita)
export const getConsultations = async (
  appointmentId?: number
): Promise<Consultation[]> => {
  const url = appointmentId ? `${API_URL}?appointmentId=${appointmentId}` : API_URL;
  const { data } = await api.get(url);
  return Array.isArray(data) ? data : []; // defensivo
};

// Obtener una consulta por ID
export const getConsultationById = async (id: number): Promise<Consultation> => {
  const { data } = await api.get(`${API_URL}/${id}`);
  return data;
};

// Crear una nueva consulta
export const createConsultation = async (
  dto: ConsultationCreateDto
): Promise<Consultation> => {
  const { data } = await api.post(API_URL, dto);
  return data;
};

// Actualizar una consulta existente
export const updateConsultation = async (
  id: number,
  dto: ConsultationUpdateDto
): Promise<void> => {
  await api.put(`${API_URL}/${id}`, dto);
};

// Eliminar una consulta por ID
export const deleteConsultation = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};
// DTO reducido que devuelve el endpoint
export interface EligibleConsultation {
  id: number;
  patientName: string;
  patientIdentification: string;
  appointmentDate: string;
  appointmentTime: string;
  officeNumber: string;
  reasonConsultation: string;
}

// Obtener consultas elegibles para receta
export const getEligibleConsultationsForPrescription = async (
  search?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ items: EligibleConsultation[]; total: number }> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());

  const { data } = await api.get(
    `/Consultations/eligible-for-prescription?${params.toString()}`
  );
  return data;
};
