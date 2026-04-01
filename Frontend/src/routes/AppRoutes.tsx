import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import UserPage from "../pages/users/UserPage";
import ConsultationPage from "../pages/consultations/ConsultationPage";
import PrescriptionPage from "../pages/prescriptions/PrescriptionPage";
import PatientPage from "../pages/patients/PatientPage";
import PrivateRoute from "./PrivateRoute";
import AppointmentPage from "../pages/appointment/AppointmentPage";
import AppointmentCalendar from "../pages/appointment/AppointmentCalendar";
import MedicinePage from "../pages/medicines/MedicinePage";
import HomeClinic from "../pages/home/HomeClinic";
import DiseasePage from "../pages/disease/DiseasePage";


const Forbidden = () => (
  <div style={{ padding: 40, textAlign: "center" }}>
    <h2>403 - Acceso denegado</h2>
    <p>No tienes permiso para ver esta página.</p>
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Home principal */}
        <Route
          path="/"
          element={
            <PrivateRoute
              element={<HomeClinic />}
              allowedRoles={["Admin", "Doctor/a", "Secretaria", "Secretario/a"]}
            />
          }
        />
        
        {/* Enfermedades */}
        <Route
          path="/diseases"
          element={
            <PrivateRoute
              element={<DiseasePage />}
              allowedRoles={["Admin", "Doctor/a"]}
            />
          }
        />

        {/* Usuarios */}
        <Route
          path="/users"
          element={<PrivateRoute element={<UserPage />} allowedRoles={["Admin"]} />}
        />

        {/* Pacientes */}
        <Route
          path="/patients"
          element={
            <PrivateRoute
              element={<PatientPage />}
              allowedRoles={["Admin", "Doctor/a", "Secretario/a"]}
            />
          }
        />

        {/* Citas */}
        <Route
          path="/appointments"
          element={
            <PrivateRoute
              element={<AppointmentPage />}
              allowedRoles={["Admin", "Doctor/a", "Secretario/a"]}
            />
          }
        />

        {/* Calendario */}
        <Route
          path="/calendar"
          element={
            <PrivateRoute
              element={<AppointmentCalendar />}
              allowedRoles={["Admin", "Doctor/a", "Secretaria"]}
            />
          }
        />

        {/* Consultas */}
        <Route
          path="/consultations"
          element={
            <PrivateRoute
              element={<ConsultationPage />}
              allowedRoles={["Admin", "Doctor/a"]}
            />
          }
        />
        {/* Admin o Doctora pueden ver recetas */}
        <Route
          path="/prescriptions"
          element={
            <PrivateRoute
              element={<PrescriptionPage />}
              allowedRoles={["Admin", "Doctor/a"]}
            />
          }
        />
        {/* Medicamentos - Admin, Doctora y Secretaria pueden ver medicamentos */}
        <Route
          path="/medicines"
          element={
            <PrivateRoute
              element={<MedicinePage />}
              allowedRoles={["Admin", "Doctor/a", "Secretaria", "Secretario/a"]}
            />
          }
        />


        {/* Página de error */}
        <Route path="/403" element={<Forbidden />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
