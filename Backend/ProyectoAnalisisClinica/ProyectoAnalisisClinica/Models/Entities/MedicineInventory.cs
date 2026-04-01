// Models/Entities/MedicineInventory.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProyectoAnalisisClinica.Models.Entities
{
    [Table("MedicineInventory")]
    public class MedicineInventory
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string NameMedicine { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        // Tabletas, jarabe, solución, etc.
        [MaxLength(100)]
        public string? TypePresentation { get; set; }

        public int AvailableQuantity { get; set; }

        public DateOnly? PreparationDate { get; set; }
        public DateOnly? ExpirationDate { get; set; }

        // Ej.: 500.0 (mg), 5.0 (mg/mL), etc. — unidad definida por presentación
        public double? Concentration { get; set; }

        // N:M inverso
        public ICollection<PrescriptionMedicine>? Prescriptions { get; set; }
    }
}
