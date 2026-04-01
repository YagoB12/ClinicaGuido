// components/layout/AppNavbar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, logoutUser } from "../../services/authService";
import { showConfirmActionAlert } from "../../utils/alerts";
import "../../styles/appNavbar.css";

export default function AppNavbar() {
  const auth = getAuth();
  const navigate = useNavigate();

  const isAdmin  = auth?.role === "Admin";
  const isDoctor = auth?.role === "Doctor/a";
  const isSecretary = auth?.role === "Secretario/a" || auth?.role === "Secretaria";

  const goHome = () => navigate("/");

  const handleLogout = async () => {
    const confirmed = await showConfirmActionAlert("¿Deseas cerrar sesión?");
    if (confirmed) logoutUser(); // limpia storage y redirige a /login
  };

  return (
    <nav className="navbar">
      <div className="navbar-left" onClick={goHome}>
        <span className="clinic-name">Clínica Dr.Guido</span>
        <span className="divider" />
        <span className="subtitle">Sistema Clínico</span>
      </div>

      <div className="navbar-right">
        {(isAdmin || isDoctor) && (
          <NavLink
            to="/consultations"
            className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
            end
          >
            Consultas
          </NavLink>
        )}
        {(isAdmin || isDoctor) && (
          <NavLink
            to="/prescriptions"
            className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
            end
          >
            Recetas
          </NavLink>
        )}
        {(isAdmin || isDoctor || isSecretary) && (
          <NavLink
            to="/medicines"
            className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
            end
          >
            Medicamentos
          </NavLink>
        )}
        {(isAdmin || isDoctor || isSecretary ) && (
          <NavLink
            to="/appointments"
            className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
            end
          >
            Citas
          </NavLink>
        )      
        }
        {(isAdmin || isDoctor || isSecretary) && (
          <NavLink
            to="/patients"
            className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
            end
          >
            Pacientes
          </NavLink>
        )}
        {(isAdmin || isDoctor) && (
          <NavLink
            to="/diseases"
            className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
            end
          >
            Enfermedades
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
            end
          >
            Usuarios
          </NavLink>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
