// Models/Dtos/Medicines/MedicineDto.cs
using System.ComponentModel.DataAnnotations;

namespace ProyectoAnalisisClinica.Models.Dtos.Medicines
{
    public class MedicineDto
    {
        public int Id { get; set; }

        public string NameMedicine { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? TypePresentation { get; set; }

        public int AvailableQuantity { get; set; }

        public DateOnly? PreparationDate { get; set; }
        public DateOnly? ExpirationDate { get; set; }

        public double? Concentration { get; set; }
    }
}
