// services/axiosConfig.ts
import axios from "axios";
import { logoutUser } from "./authService";

const api = axios.create({
  baseURL: "/api",
});

// ---- REQUEST: adjuntar token si existe ----
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- RESPONSE: manejar 401/403 de forma controlada ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = (error?.config?.url || "").toLowerCase();

    // Evitar recarga si el error 401 viene del login
    const isLoginCall = url.includes("/auth/login");

    if (status === 401) {
      if (!isLoginCall) {
        logoutUser();
      }
      return Promise.reject(error);
    }

    if (status === 403) {
      window.location.href = "/403";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
