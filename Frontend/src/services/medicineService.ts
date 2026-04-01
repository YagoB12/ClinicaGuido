import api from "../services/axiosConfig";
import type { Medicine, MedicineBrief, MedicineCreate, MedicineUpdate } from "../types/medicine";

// Obtener medicamentos del inventario con filtros
export const getMedicines = async (
  q?: string,
  onlyAvailable: boolean = true,
  onlyNotExpired: boolean = true,
  page: number = 1,
  pageSize: number = 10
): Promise<{ items: MedicineBrief[]; total: number }> => {
  const params = new URLSearchParams();

  if (q) params.append("q", q);
  if (onlyAvailable) params.append("onlyAvailable", "true");
  if (onlyNotExpired) params.append("onlyNotExpired", "true");
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());

  const { data } = await api.get(`/Medicines?${params.toString()}`);
  return data;
};

// Obtener un medicamento por ID
export const getMedicineById = async (id: number): Promise<Medicine> => {
  const { data } = await api.get(`/Medicines/${id}`);
  return data;
};

// Lista breve para selects/autocompletes
export const getMedicinesBrief = async (q?: string): Promise<MedicineBrief[]> => {
  const { data } = await api.get(`/Medicines/brief`, {
    params: q ? { q } : undefined,
  });
  return data;
};

// Crear medicamento
export const createMedicine = async (payload: MedicineCreate): Promise<Medicine> => {
  const { data } = await api.post(`/Medicines`, payload);
  return data;
};

// Actualizar medicamento
export const updateMedicine = async (id: number, payload: MedicineUpdate): Promise<void> => {
  await api.put(`/Medicines/${id}`, payload);
};

// Eliminar medicamento
export const deleteMedicine = async (id: number): Promise<void> => {
  await api.delete(`/Medicines/${id}`);
};
