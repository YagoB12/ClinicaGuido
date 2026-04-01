import React, { useState } from "react";
import { createDisease } from "../../services/diseaseService";
import { showSuccessAlert, showErrorAlert } from "../../utils/alerts";
import type { CreateDisease } from "../../types/disease";
import { validateDiseaseForm } from "../../utils/diseaseValidation";


const DiseaseForm: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const [form, setForm] = useState<CreateDisease>({
    name: "",
    typeDisease: "",
    description: "",
    levelSeverity: "",
    symptoms: "",
    causes: "",
    isContagious: false,
  });

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value, type } = e.target;

  // Si es un checkbox, extraemos el checked
  if (e.target instanceof HTMLInputElement && type === "checkbox") {
    setForm({ ...form, [name]: e.target.checked });
  } else {
    setForm({ ...form, [name]: value });
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const validationError = validateDiseaseForm(form);
  if (validationError) {
    showErrorAlert(validationError);
    return;
  }

  try {
    await createDisease(form);
    showSuccessAlert("Enfermedad registrada correctamente");
    setForm({
      name: "",
      typeDisease: "",
      description: "",
      levelSeverity: "",
      symptoms: "",
      causes: "",
      isContagious: false,
    });
    onCreated();
  } catch {
    showErrorAlert("No se pudo registrar la enfermedad");
  }
};

  return (
    <form className="disease-form" onSubmit={handleSubmit}>
      <h3>Registrar Enfermedad</h3>
      <div className="form-group">
        <label>Nombre</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          
        />
      </div>

      <div className="form-group">
        <label>Tipo</label>
        <input
          type="text"
          name="typeDisease"
          value={form.typeDisease}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Descripción</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
  <label>Nivel de Severidad</label>
  <select
    name="levelSeverity"
    value={form.levelSeverity}
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
          value={form.symptoms}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Causas</label>
        <textarea
          name="causes"
          value={form.causes}
          onChange={handleChange}
        />
      </div>

      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            name="isContagious"
            checked={form.isContagious}
            onChange={handleChange}
          />
          Es contagiosa
        </label>
      </div>

      <button type="submit" className="btn-primary">Guardar</button>
    </form>
  );
};

export default DiseaseForm;
