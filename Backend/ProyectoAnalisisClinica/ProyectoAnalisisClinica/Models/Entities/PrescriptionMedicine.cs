// Models/Entities/PrescriptionMedicine.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProyectoAnalisisClinica.Models.Entities
{
    [Table("PrescriptionMedicine")]
    public class PrescriptionMedicine
    {
        [Key]
        public int Id { get; set; }

        // FK -> Receta
        [Required]
        public int MedicalPrescriptionId { get; set; }
        public MedicalPrescription? MedicalPrescription { get; set; }

        // FK -> Medicamento de inventario
        [Required]
        public int MedicineInventoryId { get; set; }
        public MedicineInventory? Medicine { get; set; }

        // Datos clínicos por ítem de la receta
        [Required, MaxLength(150)]
        public string DailyDose { get; set; } = string.Empty;      // ej.: "500 mg"

        [Required, MaxLength(150)]
        public string Frequency { get; set; } = string.Empty;      // ej.: "cada 8 horas"

        [Required]
        public int TreatmentDurationDays { get; set; }             // ej.: 7

        [MaxLength(500)]
        public string? ItemObservation { get; set; }               // indicación puntual del ítem

        public int? QuantityTotal { get; set; }                    // opcional: cantidad a dispensar
    }
}
