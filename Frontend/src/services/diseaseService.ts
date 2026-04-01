import axios from "axios";
import type { Disease, CreateDisease } from "../types/disease";

const API_BASE = "/api/Disease";

// 🔹 Headers con token JWT (si aplica)
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

// ==================== LISTAR ====================
export const getDiseases = async (): Promise<Disease[]> => {
  const { data } = await axios.get(API_BASE, getAuthHeaders());
  return data;
};

// ==================== OBTENER POR ID ====================
export const getDiseaseById = async (id: number): Promise<Disease> => {
  const { data } = await axios.get(`${API_BASE}/${id}`, getAuthHeaders());
  return data;
};

// ==================== CREAR ====================
export const createDisease = async (disease: CreateDisease): Promise<void> => {
  await axios.post(API_BASE, disease, getAuthHeaders());
};

// ==================== ACTUALIZAR ====================
export const updateDisease = async (disease: Disease): Promise<void> => {
  if (!disease.id) throw new Error("La enfermedad no tiene ID definido.");

  await axios.put(`${API_BASE}/${disease.id}`, disease, getAuthHeaders());
};

// ==================== ELIMINAR ====================
export const deleteDisease = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/${id}`, getAuthHeaders());
};
