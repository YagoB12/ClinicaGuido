// Models/Dtos/Prescriptions/CreatePrescriptionItemDto.cs
using System.ComponentModel.DataAnnotations;

namespace ProyectoAnalisisClinica.Models.Dtos.Prescriptions
{
    public class CreatePrescriptionItemDto
    {
        [Required]
        public int MedicineInventoryId { get; set; }

        [Required, MaxLength(150)]
        public string DailyDose { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string Frequency { get; set; } = string.Empty;

        [Required]
        public int TreatmentDurationDays { get; set; }

        public string? ItemObservation { get; set; }
        public int? QuantityTotal { get; set; }
    }
}
