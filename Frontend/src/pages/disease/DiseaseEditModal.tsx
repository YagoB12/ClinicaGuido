import React, { useState, useEffect } from "react";
import type { Disease } from "../../types/disease";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import "../../styles/diseasePage.css"; // reutilizamos estilos del modal

interface Props {
  disease: Disease | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (disease: Disease) => Promise<void>;
}

const DiseaseEditModal: React.FC<Props> = ({ disease, isOpen, onClose, onSave }) => {
  const [editedDisease, setEditedDisease] = useState<Disease | null>(null);

  // Inicializa los datos cuando el modal se abre
  useEffect(() => {
    if (disease) {
      setEditedDisease({ ...disease });
    }
  }, [disease]);

  if (!isOpen || !editedDisease) return null;

  // Manejo de cambios (inputs y checkbox)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      setEditedDisease({ ...editedDisease, [name]: e.target.checked });
    } else {
      setEditedDisease({ ...editedDisease, [name]: value });
    }
  };

  // Guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmed = await showConfirmActionAlert("¿Guardar cambios en esta enfermedad?");
    if (!confirmed) return;

    try {
      await onSave(editedDisease);
      showSuccessAlert("Enfermedad actualizada correctamente");
      onClose();
    } catch (error) {
      showErrorAlert("No se pudo actualizar la enfermedad");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="modal-title">Editar Enfermedad</h2>

        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              name="name"
              value={editedDisease.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de enfermedad</label>
            <input
              type="text"
              name="typeDisease"
              value={editedDisease.typeDisease || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="description"
              value={editedDisease.description || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Nivel de severidad</label>
            <select
              name="levelSeverity"
              value={editedDisease.levelSeverity || ""}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              <option value="Leve">Leve</option>
              <option value="Moderada">Moderada</option>
              <option value="Grave">Grave</option>
            </select>
          </div>

          <div className="form-group">
            <label>Síntomas</label>
            <textarea
              name="symptoms"
              value={editedDisease.symptoms || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Causas</label>
            <textarea
              name="causes"
              value={editedDisease.causes || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="isContagious"
                checked={editedDisease.isContagious}
                onChange={handleChange}
              />
              Es contagiosa
            </label>
          </div>

          <div className="form-button">
            <button type="submit">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiseaseEditModal;
