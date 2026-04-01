// src/pages/home/HomeClinic.tsx
import React from "react";
import { Link } from "react-router-dom";
import "../../styles/homeClinic.css";
import HomeHeader from "./HomeHeader";
import HomeStats from "./HomeStats";
import HomeCalendar from "./HomeCalendar";
import AppNavbar from "../../components/layout/AppNavbar";

const HomeClinic: React.FC = () => {
  return (
    <div className="page-container home-page">
      {/* Navbar genérico con visibilidad por rol */}
      <AppNavbar />

      {/* CONTENIDO PRINCIPAL */}
      <HomeHeader />
      <HomeStats />
      <HomeCalendar />

      {/* ACCESOS RÁPIDOS */}
      <section className="module-grid">
        <h2 className="modules-title">Módulos del Sistema</h2>
        <div className="module-buttons">
          <Link to="/patients" className="module-card">
            <img src="/paciente.jpg" alt="Pacientes" />
            <span>Pacientes</span>
          </Link>

          <Link to="/appointments" className="module-card">
            <img src="/citaMedica.jpg" alt="Citas" />
            <span>Citas</span>
          </Link>

          <Link to="/consultations" className="module-card">
            <img src="/consulta.jpg" alt="Consultas" />
            <span>Consultas</span>
          </Link>

          <Link to="/medicines" className="module-card">
            <img src="/expedienteMedico.jpg" alt="Medicamentos" />
            <span>Medicamentos</span>
          </Link>

          <Link to="/diseases" className="module-card">
            <img src="/enfermedades.jpg" alt="Enfermedades" />
            <span>Enfermedades</span>
          </Link>

          <Link to="/exams" className="module-card">
            <img src="/examenMedico.jpg" alt="Exámenes" />
            <span>Exámenes</span>
          </Link>

          <Link to="/prescriptions" className="module-card">
            <img src="/recetaMedica.jpg" alt="Recetas" />
            <span>Recetas</span>
          </Link>

          <Link to="/users" className="module-card">
            <img src="/usuario.jpg" alt="Usuarios" />
            <span>Usuarios</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomeClinic;
