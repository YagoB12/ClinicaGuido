using ProyectoAnalisisClinica.Controllers;
using System.Text.RegularExpressions;

namespace ProyectoAnalisisClinica.Utils.Validators
{
    public static class UserValidator
    {
        // ===================== CREACIÓN =====================
        public static string? ValidateCreate(UserCreateDto dto)
        {
            if (dto == null)
                return "Solicitud inválida.";

            // Nombre
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "El nombre es obligatorio.";
            if (dto.Name.Length < 3)
                return "El nombre debe tener al menos 3 caracteres.";
            if (!Regex.IsMatch(dto.Name, @"^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$"))
                return "El nombre solo puede contener letras y espacios.";

            // Identificación
            if (string.IsNullOrWhiteSpace(dto.Identification))
                return "La identificación es obligatoria.";
            if (!Regex.IsMatch(dto.Identification, @"^\d{1,12}$"))
                return "La identificación debe tener solo números (máx. 12 dígitos).";


            // Correo
            if (string.IsNullOrWhiteSpace(dto.Email))
                return "El correo es obligatorio.";
            if (!Regex.IsMatch(dto.Email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
                return "El formato del correo no es válido.";

            // Teléfono
            if (dto.Phone.ToString().Length < 8)
                return "El teléfono debe tener al menos 8 dígitos.";
            if (!Regex.IsMatch(dto.Phone.ToString(), @"^\d+$"))
                return "El teléfono solo puede contener números.";

            // Género
            if (string.IsNullOrWhiteSpace(dto.Gender))
                return "Debe seleccionar un género.";
            if (!new[] { "Masculino", "Femenino" }.Contains(dto.Gender))
                return "Debe seleccionar un género válido.";

            // Contraseña
            if (string.IsNullOrWhiteSpace(dto.Password))
                return "La contraseña es obligatoria.";
            if (dto.Password.Length < 8)
                return "La contraseña debe tener al menos 8 caracteres.";
            if (!Regex.IsMatch(dto.Password, @"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$"))
                return "La contraseña debe contener letras y números.";

            // Rol
            if (dto.RolId <= 0)
                return "Debe seleccionar un rol válido.";

            return null; // Sin errores
        }

        // ===================== EDICIÓN =====================
        public static string? ValidateUpdate(UserUpdateDto dto)
        {
            if (dto == null)
                return "Solicitud inválida.";

            // Solo validar lo que venga con datos nuevos
            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                if (dto.Name.Length < 3)
                    return "El nombre debe tener al menos 3 caracteres.";
                if (!Regex.IsMatch(dto.Name, @"^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$"))
                    return "El nombre solo puede contener letras y espacios.";
            }

            if (!string.IsNullOrWhiteSpace(dto.Identification))
            {
                if (!Regex.IsMatch(dto.Identification, @"^\d{1,12}$"))
                    return "La identificación debe tener solo números (máx. 12 dígitos).";
            }

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                if (!Regex.IsMatch(dto.Email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
                    return "El formato del correo no es válido.";
            }

            if (dto.Phone.HasValue)
            {
                var phoneStr = dto.Phone.Value.ToString();
                if (phoneStr.Length < 8)
                    return "El teléfono debe tener al menos 8 dígitos.";
                if (!Regex.IsMatch(phoneStr, @"^\d+$"))
                    return "El teléfono solo puede contener números.";
            }

            if (!string.IsNullOrWhiteSpace(dto.Gender))
            {
                if (!new[] { "Masculino", "Femenino" }.Contains(dto.Gender))
                    return "Debe seleccionar un género válido.";
            }

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                if (dto.Password.Length < 8)
                    return "La contraseña debe tener al menos 8 caracteres.";
                if (!Regex.IsMatch(dto.Password, @"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$"))
                    return "La contraseña debe contener letras y números.";
            }

            if (dto.RolId.HasValue && dto.RolId.Value <= 0)
                return "Debe seleccionar un rol válido.";

            return null; // Sin errores
        }
    }
}
