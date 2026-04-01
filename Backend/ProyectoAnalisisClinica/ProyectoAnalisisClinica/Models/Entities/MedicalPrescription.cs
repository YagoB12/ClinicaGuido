// Models/Entities/MedicalPrescription.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ProyectoAnalisisClinica.Models.Entities
{
    [Table("MedicalPrescription")]
    [Index(nameof(ConsultationId), IsUnique = true)] // Relación 1:1 con Consultation
    public class MedicalPrescription
    {
        [Key]
        public int Id { get; set; }

        // FK 1:1 -> Consultation
        [Required]
        public int ConsultationId { get; set; }
        public Consultation? Consultation { get; set; }

        // Fecha de emisión
        [Required]
        public DateOnly IssueDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

        // Observaciones generales de la receta
        [MaxLength(500)]
        public string? Observation { get; set; }

        // Indicaciones generales o instrucciones al paciente
        [MaxLength(1000)]
        public string? AdditionalInstructions { get; set; }

        // Models/Entities/MedicalPrescription.cs
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Emitida";


        // Relación N:M con medicamentos (tabla puente)
        public ICollection<PrescriptionMedicine>? Items { get; set; }
    }
}
