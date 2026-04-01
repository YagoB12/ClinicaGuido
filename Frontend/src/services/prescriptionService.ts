import api from "../services/axiosConfig";

// ======================== Tipos ========================
export interface PrescriptionItemDto {
  medicineInventoryId: number;
  dailyDose: string;
  frequency: string;
  treatmentDurationDays: number;
  itemObservation?: string;
  quantityTotal?: number;
}

export interface CreatePrescriptionDto {
  consultationId: number;
  observation?: string;
  additionalInstructions?: string;
  items: PrescriptionItemDto[];
}

export interface PrescriptionItem {
  id: number;
  medicalPrescriptionId: number;
  medicineInventoryId: number;
  dailyDose: string;
  frequency: string;
  treatmentDurationDays: number;
  itemObservation?: string;
  quantityTotal?: number;
  medicine?: {
    id: number;
    nameMedicine: string;
    typePresentation?: string;
    concentration?: number;
  };
}

export interface Prescription {
  id: number;
  consultationId: number;
  issueDate: string; // ISO yyyy-MM-dd
  status: string;    // "Emitida" | ...
  observation?: string;
  additionalInstructions?: string;
  items: PrescriptionItem[];
}

// DTO liviano para listar en tabla
export interface PrescriptionListItem {
  id: number;
  patientName: string;
  patientIdentification: string;
  issueDate: string; // ISO yyyy-MM-dd
  status: string;
}

export interface UpdatePrescriptionDto {
  observation?: string;
  additionalInstructions?: string;
  status?: string; // se edita solo por PUT
}

// ======================== Endpoints ========================

// Crear una nueva receta médica
export const createPrescription = async (dto: CreatePrescriptionDto): Promise<Prescription> => {
  const { data } = await api.post("/Prescriptions", dto);
  return data;
};

// Actualizar receta (observación, instrucciones, estado)
export const updatePrescription = async (
  id: number,
  dto: UpdatePrescriptionDto
): Promise<Prescription> => {
  const { data } = await api.put(`/Prescriptions/${id}`, dto);
  return data;
};

// Obtener una receta por ID
export const getPrescriptionById = async (id: number): Promise<Prescription> => {
  const { data } = await api.get(`/Prescriptions/${id}`);
  return data;
};

// Obtener receta por ID de consulta
export const getPrescriptionByConsultation = async (
  consultationId: number
): Promise<Prescription> => {
  const { data } = await api.get(`/Prescriptions/by-consultation/${consultationId}`);
  return data;
};

// Listar recetas (para la tabla) con filtros opcionales
export const getPrescriptions = async (
  q?: string,
  from?: string, // "YYYY-MM-DD"
  to?: string,   // "YYYY-MM-DD"
  page: number = 1,
  pageSize: number = 20
): Promise<{ items: PrescriptionListItem[]; total: number }> => {
  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  params.append("page", String(page));
  params.append("pageSize", String(pageSize));

  const { data } = await api.get(`/Prescriptions?${params.toString()}`);
  return data;
};

// Agregar un ítem (medicamento) a una receta existente
export const addPrescriptionItem = async (
  prescriptionId: number,
  item: PrescriptionItemDto
): Promise<PrescriptionItem> => {
  const { data } = await api.post(`/Prescriptions/${prescriptionId}/items`, item);
  return data;
};

// Actualizar un ítem de receta
export const updatePrescriptionItem = async (
  itemId: number,
  item: PrescriptionItemDto
): Promise<PrescriptionItem> => {
  const { data } = await api.put(`/Prescriptions/items/${itemId}`, item);
  return data;
};

// Eliminar un ítem
export const deletePrescriptionItem = async (itemId: number): Promise<void> => {
  await api.delete(`/Prescriptions/items/${itemId}`);
};

// Eliminar una receta completa
export const deletePrescription = async (id: number): Promise<void> => {
  await api.delete(`/Prescriptions/${id}`);
};
export const getPrescriptionItems = async (prescriptionId: number) => {
  const { data } = await api.get(`/Prescriptions/${prescriptionId}/items`);
  return data as PrescriptionItem[];
};

