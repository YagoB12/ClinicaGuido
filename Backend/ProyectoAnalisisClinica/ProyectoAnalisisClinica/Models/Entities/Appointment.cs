using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProyectoAnalisisClinica.Models.Entities
{
    [Table("Appointment")]
    public class Appointment
    {
        [Key]
        public int Id { get; set; }

        // Fecha y hora de la cita
        public DateOnly DateAppointment { get; set; }
        public TimeOnly HourAppointment { get; set; }

        [MaxLength(200)]
        public string? ReasonAppointment { get; set; }

        [MaxLength(20)]
        public string? Priority { get; set; }          // Baja/Media/Alta u otra codificación

        [MaxLength(20)]
        public string? OfficeNumber { get; set; }

        [MaxLength(20)]
        public string? Status { get; set; }            // Programada/Cancelada/Atendida...

        // La cita sí está asociada al paciente
        [Required]
        public int MedicalPatientId { get; set; }
        public MedicalPatient? MedicalPatient { get; set; }

        // Relación 1:1 con Consultation (una cita genera una consulta)
        public Consultation? Consultation { get; set; }
    }
}
