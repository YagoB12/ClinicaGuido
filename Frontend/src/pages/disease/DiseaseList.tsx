import React, { useEffect, useState } from "react";
import { getDiseases, deleteDisease } from "../../services/diseaseService";
import type { Disease } from "../../types/disease";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import "../../styles/diseasePage.css";

interface Props {
  onEdit: (disease: Disease) => void;
  reloadFlag: boolean;
}

const DiseaseList: React.FC<Props> = ({ onEdit, reloadFlag }) => {
  const [diseases, setDiseases] = useState<Disease[]>([]);

  const loadAll = async () => {
    try {
      const data = await getDiseases();
      setDiseases(data);
    } catch {
      showErrorAlert("Error al cargar enfermedades.");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmActionAlert("¿Eliminar esta enfermedad?");
    if (!confirmed) return;

    try {
      await deleteDisease(id);
      showSuccessAlert("Enfermedad eliminada correctamente.");
      loadAll();
    } catch {
      showErrorAlert("No se pudo eliminar la enfermedad.");
    }
  };

  useEffect(() => {
    loadAll();
  }, [reloadFlag]);

  return (
    <div className="user-list-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Severidad</th>
            <th>Contagiosa</th>
            <th>Síntomas</th>
            <th>Causas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {diseases.length > 0 ? (
            diseases.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.typeDisease || "—"}</td>
                <td>{d.levelSeverity || "—"}</td>
                <td>
                  <span
                    className={`status-badge ${
                      d.isContagious ? "active" : "inactive"
                    }`}
                  >
                    {d.isContagious ? "Sí" : "No"}
                  </span>
                </td>
                <td>{d.symptoms || "—"}</td>
                <td>{d.causes || "—"}</td>
                <td className="actions">
                  <button className="action-btn edit-btn" onClick={() => onEdit(d)}>
                    Editar
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(d.id!)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="no-data">
                No hay enfermedades registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DiseaseList;
