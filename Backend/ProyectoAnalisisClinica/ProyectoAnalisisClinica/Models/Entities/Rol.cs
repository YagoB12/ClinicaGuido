using System.ComponentModel.DataAnnotations;

namespace ProyectoAnalisisClinica.Models.Entities
{
    public class Rol
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Nombre { get; set; } = string.Empty;

        // 🔹 Relación inversa
        public ICollection<User>? Users { get; set; }
    }
}
