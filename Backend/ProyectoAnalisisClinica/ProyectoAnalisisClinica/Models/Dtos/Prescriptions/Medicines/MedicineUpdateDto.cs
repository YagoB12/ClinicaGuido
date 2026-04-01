// Models/Dtos/Medicines/MedicineUpdateDto.cs
using System.ComponentModel.DataAnnotations;

namespace ProyectoAnalisisClinica.Models.Dtos.Medicines
{
    public class MedicineUpdateDto
    {
        [Required, StringLength(200)]
        public string NameMedicine { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? TypePresentation { get; set; }

        [Range(0, int.MaxValue)]
        public int AvailableQuantity { get; set; }

        public DateOnly? PreparationDate { get; set; }
        public DateOnly? ExpirationDate { get; set; }

        public double? Concentration { get; set; }
    }
}
