using System.ComponentModel.DataAnnotations;

namespace ProyectoAnalisisClinica.Models.Entities
{
    public class Person
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio"), MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "La identificación es obligatoria"), MaxLength(20)]
        public string Identification { get; set; } = string.Empty;

        [Required(ErrorMessage = "El correo es obligatorio"), EmailAddress, MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        public int Phone { get; set; }

        [Required(ErrorMessage = "Debe seleccionar un género")]
        public string Gender { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}
