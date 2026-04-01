// services/authService.ts
import api from "./axiosConfig";

// ---- Tipos ----
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  rol: string; // "Admin" | "Doctor/a" | "Secretario/a"
};

export type AuthState = {
  token: string;
  user: AuthUser;
  role: string;
  perms: string[];
};

// ---- Utilidades JWT ----
// Decodificador ligero (sin dependencia externa). NO valida firma; solo lee payload.
function decodeJwt<T = any>(token: string): T {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload) as T;
}

// Extrae role y perms del payload (perm puede venir como string o array)
export function parseToken(token: string): { role: string; perms: string[] } {
  const d = decodeJwt<any>(token);
  // Role puede venir con el claim estándar de .NET
  const role =
    d["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    d["role"] ||
    "";

  const rawPerm = d["perm"];
  const perms = Array.isArray(rawPerm) ? rawPerm : rawPerm ? [rawPerm] : [];
  return { role, perms };
}

// ---- API ----
const API_URL = "/Auth";

export const loginUser = async (email: string, password: string): Promise<AuthState> => {
  const { data } = await api.post(`${API_URL}/login`, { email, password });
  const { token, user } = data as { token: string; user: AuthUser };

  // Persisto token/usuario para que el interceptor los lea en cada request
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("user", JSON.stringify(user));

  const { role, perms } = parseToken(token);

  return { token, user, role, perms };
};

export const logoutUser = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  // El interceptor ya no verá token y dejará de enviarlo
  window.location.href = "/login";
};

// Helpers de lectura
export const getToken = () => sessionStorage.getItem("token");

export const getCurrentUser = (): AuthUser | null => {
  const raw = sessionStorage.getItem("user");
  return raw ? (JSON.parse(raw) as AuthUser) : null;
};

export const getAuth = (): AuthState | null => {
  const token = getToken();
  const user = getCurrentUser();
  if (!token || !user) return null;
  const { role, perms } = parseToken(token);
  return { token, user, role, perms };
};

// Checks rápidos para UI
export const hasPerm = (perm: string) => {
  const auth = getAuth();
  return !!auth && auth.perms.includes(perm);
};

export const hasRole = (role: string) => {
  const auth = getAuth();
  return !!auth && auth.role === role;
};
