import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import logo from "../assets/logo-clinica.png";
import { showErrorAlert, showSuccessAlert } from "../utils/alerts";
import { loginUser } from "../services/authService";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginUser(email, password); // { token, user, role, perms }
      showSuccessAlert(`Bienvenido, ${result.user.name}`);

      // Redirigir según rol
      const role = (result.role || result.user.rol || "").trim();
      if (role === "Admin") {
        navigate("/users", { replace: true });
      } else if (role === "Doctor/a") {
        navigate("/", { replace: true });
      } else if (role === "Secretario/a" || role === "Secretaria") {
        navigate("/", { replace: true });
      } else {
        // Fallback (por si llega otro rol en el futuro)
        navigate("/", { replace: true });
      }
    } catch {
      showErrorAlert("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <h1>¡Hola, Bienvenido!</h1>
        <p>Por favor ingresa tus datos para continuar</p>
        <img src={logo} alt="Logo Clínica" className="logo-clinica" />
      </div>

      <div className="login-right">
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Iniciar Sesión</h2>

          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            placeholder="ejemplo@correo.com"
            data-testid="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input

            id="password"
            type="password"
            data-testid="login-password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" data-testid="login-submit" disabled={loading}>
            {loading ? "Cargando..." : "Ingresar"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default LoginPage;
