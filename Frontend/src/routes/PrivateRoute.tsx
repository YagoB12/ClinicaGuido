// routes/PrivateRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuth } from "../services/authService";

interface PrivateRouteProps {
  element: React.ReactElement;
  allowedRoles?: string[];       // ej: ["Admin"]
  requiredPerms?: string[];      // ej: ["users.manage"]
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  element,
  allowedRoles,
  requiredPerms,
}) => {
  const auth = getAuth();
  const location = useLocation();

  // Si no hay sesión, redirige al login
  if (!auth) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Validar rol (si la ruta define roles permitidos)
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to="/403" replace />;
  }

  // Validar permisos específicos (si la ruta define permisos requeridos)
  if (requiredPerms && !requiredPerms.every(p => auth.perms.includes(p))) {
    return <Navigate to="/403" replace />;
  }

  // Si todo está correcto → renderiza el componente
  return element;
};

export default PrivateRoute;
