import { Routes, Route, Navigate } from "react-router-dom";
import UserPage from "./pages/users/UserPage";
import ConsultationPage from "./pages/consultations/ConsultationPage";
import PrescriptionPage from "./pages/prescriptions/PrescriptionPage";
import MedicinePage from "./pages/medicines/MedicinePage";

function App() {
  return (
    <Routes>
      {/* Ruta principal */}
      <Route path="/" element={<Navigate to="/users" />} />

      {/* Gestión de usuarios */}
      <Route path="/users" element={<UserPage />} />

      {/* Gestión de consultas */}
      <Route path="/consultations" element={<ConsultationPage />} />

      {/* Gestión de recetas */}
      <Route path="/prescriptions" element={<PrescriptionPage />} />

      {/* Gestión de medicamentos */}
      <Route path="/medicines/*" element={<MedicinePage />} />
    </Routes>
  );
}

export default App;
