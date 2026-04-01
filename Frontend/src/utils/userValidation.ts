export const validateUserForm = (form: any): string | null => {
  // Nombre
  if (!form.name.trim()) return "El nombre es obligatorio.";
  if (form.name.length < 3) return "El nombre debe tener al menos 3 caracteres.";
  if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(form.name))
    return "El nombre solo puede contener letras y espacios.";

  // Identificación
  if (!form.identification.trim())
    return "La identificación es obligatoria.";
  if (!/^[Ee]?\d{1,12}$/.test(form.identification))
    return "La identificación debe tener solo números (máx. 12) o iniciar con E.";

  // Correo
  if (!form.email.trim()) return "El correo es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    return "El formato del correo no es válido.";

  // Teléfono
  if (!form.phone.toString().trim()) return "El teléfono es obligatorio.";
  if (!/^\d+$/.test(form.phone.toString()))
    return "El teléfono solo puede contener números.";
  if (form.phone.toString().length < 8)
    return "El teléfono debe tener al menos 8 dígitos.";

  // Género
  if (!form.gender.trim()) return "Debe seleccionar un género.";

  // Rol
  if (!form.rolId || form.rolId === 0)
    return "Debe seleccionar un rol válido.";

  // Contraseña
  if (!form.password.trim()) return "La contraseña es obligatoria.";
  if (form.password.length < 8)
    return "La contraseña debe tener al menos 8 caracteres.";
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(form.password))
    return "La contraseña debe contener letras y números.";

  return null; // ✅ Sin errores
};
