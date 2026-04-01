import axios from "axios";
import type { User } from "../types/user";

const API_URL = "/api/User";

// Función auxiliar para configurar el token en los headers
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};


// ==================== LISTAR USUARIOS ====================
export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get(API_URL, getAuthHeaders());
  return response.data;
};

// ==================== CREAR USUARIO ====================
export const createUser = async (user: User) => {
  const response = await axios.post(API_URL, user, getAuthHeaders());
  return response.data;
};

// ==================== ACTUALIZAR USUARIO ====================
export const updateUser = async (user: User): Promise<void> => {
  if (!user.id) throw new Error("El usuario no tiene ID definido.");
  await axios.put(`${API_URL}/${user.id}`, user, getAuthHeaders());
};

// ==================== ELIMINAR USUARIO ====================
export const deleteUser = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  delete axios.defaults.headers.common["Authorization"];
  window.location.href = "/login"; // redirigir al login
};
