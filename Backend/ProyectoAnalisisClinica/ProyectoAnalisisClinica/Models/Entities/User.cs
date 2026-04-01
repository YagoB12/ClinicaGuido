using System.ComponentModel.DataAnnotations;

namespace ProyectoAnalisisClinica.Models.Entities
{
    public class User : Person

    {


        public User()
        {
            IsActive = true; // esto fuerza el valor cuando EF instancia
        }
        [Required(ErrorMessage = "La contraseña es obligatoria"), MaxLength(100)]
        public string Password { get; set; } = string.Empty;

        // Relación con Rol
        public int RolId { get; set; }// FK
        public Rol? Rol { get; set; }// Navegación
    }
}
