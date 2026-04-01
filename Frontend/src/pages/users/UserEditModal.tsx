import React, { useState, useEffect } from "react";
import type { User } from "../../types/user";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import { getRoles } from "../../services/roleService";
import "../../styles/userPage.css";

interface Props {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => Promise<void>;
}

const UserEditModal: React.FC<Props> = ({ user, isOpen, onClose, onSave }) => {
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([]);

  // Cargar roles desde el backend
  const loadRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch {
      showErrorAlert("Error al cargar los roles desde el servidor.");
    }
  };

  // Inicializar datos cuando el modal se abre
  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
      loadRoles();
    }
  }, [user]);

  if (!isOpen || !editedUser) return null;

  // Manejo de cambios
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedUser({
      ...editedUser,
      [name]: name === "rolId" ? parseInt(value) : value,
    });
  };

  // Validación personalizada (más ligera que en creación)
  const validateEditForm = (form: User): string | null => {
    // Nombre
    if (!form.name.trim()) return "El nombre es obligatorio.";
    if (form.name.length < 3) return "El nombre debe tener al menos 3 caracteres.";
    if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(form.name))
      return "El nombre solo puede contener letras y espacios, sin emojis ni símbolos especiales.";

    // Teléfono
    if (form.phone && !/^\d+$/.test(form.phone.toString()))
      return "El teléfono solo puede contener números.";
    if (form.phone && form.phone.toString().length < 8)
      return "El teléfono debe tener al menos 8 dígitos.";

    // Género
    if (!form.gender.trim()) return "Debe seleccionar un género.";

    // Rol
    if (!form.rolId || form.rolId === 0)
      return "Debe seleccionar un rol válido.";

    return null;
  };

  // Guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateEditForm(editedUser);
    if (validationError) {
      showErrorAlert(validationError);
      return;
    }

    const confirmed = await showConfirmActionAlert(
      "¿Guardar cambios en este usuario?"
    );
    if (!confirmed) return;

    try {
      await onSave(editedUser);
      showSuccessAlert("Usuario actualizado correctamente.");
      onClose();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "No se pudo guardar el usuario.";
      showErrorAlert(message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="modal-title">Editar Usuario</h2>

        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombres *</label>
            <input
              type="text"
              name="name"
              value={editedUser.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Identificación *</label>
            <input
              type="text"
              name="identification"
              value={editedUser.identification}
              readOnly
              className="readonly"
            />
          </div>

          <div className="form-group">
            <label>Correo *</label>
            <input
              type="email"
              name="email"
              value={editedUser.email}
              readOnly
              className="readonly"
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="text"
              name="phone"
              value={editedUser.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Género *</label>
            <select
              name="gender"
              value={editedUser.gender}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>

          <div className="form-group">
            <label>Rol *</label>
            <select
              name="rolId"
              value={editedUser.rolId}
              onChange={handleChange}
              required
            >
              <option value="0">Seleccione...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Estado *</label>
            <select
              name="isActive"
              value={editedUser.isActive ? "true" : "false"}
              onChange={(e) =>
                setEditedUser({
                  ...editedUser,
                  isActive: e.target.value === "true",
                })
              }
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>

          <div className="form-group">
            <label>Contraseña *</label>
            <input
              type="password"
              name="password"
              value={editedUser.password}
              readOnly
              className="readonly"
            />
          </div>

          <div className="form-button">
            <button type="submit">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;
