using System.ComponentModel.DataAnnotations;

namespace ProyectoAnalisisClinica.Models.Dtos.Appointments
{
    public class AppointmentCreateDto

    {
        public int Id { get; set; }

        [Required(ErrorMessage = "La fecha de la cita es obligatoria.")]
        public DateOnly DateAppointment { get; set; }

        [Required(ErrorMessage = "La hora de la cita es obligatoria.")]
        public TimeOnly HourAppointment { get; set; }

        [MaxLength(200, ErrorMessage = "El motivo no puede superar los 200 caracteres.")]
        public string? ReasonAppointment { get; set; }

        [MaxLength(20)]
        public string? Priority { get; set; } = "Media"; // Valor por defecto

        [MaxLength(20)]
        public string? OfficeNumber { get; set; }

        [MaxLength(20)]
        public string? Status { get; set; } = "Programada"; // Valor por defecto

        [Required(ErrorMessage = "Debe asociarse a un paciente.")]
        public int MedicalPatientId { get; set; }

        public string? PatientName { get; set; }
    }
}
