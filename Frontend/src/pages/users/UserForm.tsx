import React, { useState, useEffect } from "react";
import { createUser } from "../../services/userService";
import { getRoles } from "../../services/roleService";
import type { User } from "../../types/user";
import Swal from "sweetalert2";
import "../../styles/userPage.css"; // importar el CSS
import { validateUserForm } from "../../utils/userValidation";


const UserForm: React.FC = () => {
  const [form, setForm] = useState<User>({
    name: "",
    identification: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    rolId: 0,
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    const loadRoles = async () => {
      const data = await getRoles();
      setRoles(data);
    };
    loadRoles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "rolId" ? parseInt(value) : value,
    });
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Contraseñas no coinciden",
        text: "Por favor asegúrate de que ambas contraseñas sean iguales.",
        confirmButtonColor: "#03346E",
      });
      return;
    }

    if (form.rolId === 0) {
      Swal.fire({
        icon: "warning",
        title: "Seleccione un rol",
        confirmButtonColor: "#03346E",
      });
      return;
    }

    const validationError = validateUserForm(form);
    if (validationError) {
      Swal.fire({
        icon: "warning",
        title: "Validación",
        text: validationError,
        confirmButtonColor: "#03346E",
      });
      return;
    }

    try {
      await createUser(form);
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Usuario creado correctamente",
        confirmButtonColor: "#03346E",
      });

      setForm({
        name: "",
        identification: "",
        email: "",
        phone: "",
        gender: "",
        password: "",
        rolId: 0,
      });
      setConfirmPassword("");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "No se pudo crear el usuario.";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: "#03346E",
      });
    }

  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nombre completo *</label>
        <input type="text" name="name" value={form.name} onChange={handleChange}  />
      </div>

      <div className="form-group">
        <label>Identificación *</label>
        <input type="text" name="identification" value={form.identification} onChange={handleChange}  />
      </div>

      <div className="form-group">
        <label>Correo *</label>
        <input type="email" name="email" value={form.email} onChange={handleChange}  />
      </div>

      <div className="form-group">
        <label>Teléfono</label>
        <input type="text" name="phone" value={form.phone} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Género *</label>
        <select name="gender" value={form.gender} onChange={handleChange} >
          <option value="">Seleccione...</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </select>
      </div>

      <div className="form-group">
        <label>Rol *</label>
        <select name="rolId" value={form.rolId} onChange={handleChange}>
          <option value="0">Seleccione...</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>

      </div>

      <div className="form-group">
        <label>Contraseña *</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          
        />
      </div>

      <div className="form-group">
        <label>Confirmar contraseña *</label>
        <input
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={handleConfirmChange}
          
        />
      </div>

      <div className="form-button">
        <button type="submit">Guardar Usuario</button>
      </div>
    </form>
  );
};

export default UserForm;
