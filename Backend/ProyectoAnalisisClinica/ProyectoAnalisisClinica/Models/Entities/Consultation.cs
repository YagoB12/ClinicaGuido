using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ProyectoAnalisisClinica.Models.Entities
{
    [Table("Consultation")]
    public class Consultation
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string ReasonConsultation { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Diagnostic { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        [MaxLength(500)]
        public string? TreatmentPlan { get; set; }

        public int? Temperature { get; set; }
        public double? BloodPressure { get; set; }
        public double? HeartRate { get; set; }

        public double? Weight { get; set; }   // Peso en kg
        public double? Height { get; set; }   // Altura en metros o cm (según cómo manejés el dato)

      
        [Required]
        public int AppointmentId { get; set; }

        [JsonIgnore]
        public Appointment? Appointment { get; set; }

        // Navegación 1:1 hacia la receta
        public MedicalPrescription? MedicalPrescription { get; set; }
    }
}
